'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireStaff, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import { checkRateLimitStrict } from '@/app/lib/rate-limit';
import { resolveEmployeeProvider } from '@/app/lib/ai/provider-for-employee';
import { bibleSchema } from '@/app/lib/ai/bible-schema';
import { renderBibleDigest } from '@/app/lib/ai/render-bible';
import { buildChatSystem, chatDigestPreface } from '@/app/lib/ai/prompts/chat';
import { estimateCostCents } from '@/app/lib/ai/pricing';
import { toolDefinitions } from '@/app/lib/ai/tools/registry';
import { runToolCalls } from '@/app/lib/ai/tools/run-tools';
import { describeProviderError } from '@/app/lib/ai/provider-errors';
import { sendChatMessageSchema, chatHistoryQuerySchema } from '@/app/lib/validation/ai-chat';
import type { AiMessage } from '@/app/lib/types/database';
import type { AiContentBlock } from '@/app/lib/ai/provider';

/**
 * Chat with an AI employee. STAFF ONLY — the AI never talks to customers, and
 * nothing said here executes anything: replies are advice, and any change to a
 * case still goes through the proposal queue a human approves.
 *
 * One shared thread per AI employee, visible to all staff, like the review
 * queue. Every reply is a paid provider call: it draws from the same daily
 * budget as assessments (one knob, one meaning) and lands in the same ai_runs
 * cost ledger the monitoring dashboard reads.
 */

/** How many recent messages travel with each reply. */
const HISTORY_WINDOW = 20;
const MAX_REPLY_TOKENS = 4000;

/**
 * How many provider round trips one message may take. Each iteration is a paid
 * call, so this is a spend cap as much as a loop guard: the model gets enough
 * turns to look something up, act on it, and summarise, and no more.
 */
const MAX_TOOL_ITERATIONS = 6;

/**
 * Digest cache, keyed by kb_versions.id. Rules are immutable per version, so
 * re-fetching 160KB of JSON and re-rendering the digest on every chat message
 * bought nothing. Module scope = per server instance, which is exactly the
 * lifetime this needs.
 */
const digestByVersion = new Map<string, { version: number; digest: string }>();

export interface ChatEmployee {
  profileId: string;
  fullName: string;
  isPaused: boolean;
}

export async function getAiChatEmployees(): Promise<
  ActionResult<{ employees: ChatEmployee[]; externalCount: number }>
> {
  try {
    await requireStaff();
    const admin = createAdminClient();

    const [profilesResult, configsResult] = await Promise.all([
      admin.from('profiles').select('id, full_name').eq('role', 'ai').eq('is_active', true),
      // Every AI employee's route, not just the platform ones: an
      // external-only setup has to be reported as "your employees work
      // elsewhere", not as "you have none".
      admin.from('ai_employee_config').select('profile_id, is_paused, employment_type'),
    ]);

    // Report a failed read as a failure. supabase-js RESOLVES a failed query
    // with { data: null, error }, so `?? []` would coalesce an outage into an
    // empty list — and because the config row is now the membership test, that
    // would render as a confident "no AI employees yet" instead of an error.
    if (profilesResult.error || configsResult.error) {
      console.error(
        '[ai-chat] employee lookup failed:',
        profilesResult.error?.message ?? configsResult.error?.message,
      );
      return { success: false, error: 'Could not load the AI employees.' };
    }

    const configs =
      (configsResult.data as
        | { profile_id: string; is_paused: boolean; employment_type: string }[]
        | null) || [];
    const configByProfile = new Map(configs.map((c) => [c.profile_id, c]));
    const activeProfiles = (profilesResult.data as { id: string; full_name: string }[]) || [];

    // Only PLATFORM employees are offered. This chat works by US calling a model
    // on the employee's behalf; an external employee has no provider key here,
    // so offering it would mean choosing a conversation partner that cannot
    // answer. An external employee is instructed in its own tool — the Custom
    // GPT, or the Claude CLI — and reaches this platform through the API key we
    // mint for it.
    const employees: ChatEmployee[] = [];
    let externalCount = 0;
    for (const p of activeProfiles) {
      const config = configByProfile.get(p.id);
      if (!config) continue;
      if (config.employment_type !== 'platform') {
        externalCount += 1;
        continue;
      }
      employees.push({ profileId: p.id, fullName: p.full_name, isPaused: config.is_paused });
    }

    return { success: true, data: { employees, externalCount } };
  } catch (err) {
    return toActionError(err);
  }
}

export type ChatMessageView = Pick<
  AiMessage,
  'id' | 'author' | 'content' | 'created_at'
> & { staffName: string | null };

export async function getAiChatHistory(
  input: unknown,
): Promise<ActionResult<{ messages: ChatMessageView[] }>> {
  try {
    await requireStaff();
    const parsed = chatHistoryQuerySchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid request.' };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('ai_messages')
      .select('id, author, content, created_at, profiles:staff_id(full_name)')
      .eq('ai_profile_id', parsed.data.aiProfileId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      console.error('[ai-chat] history failed:', error);
      return { success: false, error: 'Could not load the conversation.' };
    }

    type Raw = Pick<AiMessage, 'id' | 'author' | 'content' | 'created_at'> & {
      profiles: { full_name: string } | null;
    };

    return {
      success: true,
      data: {
        // Fetched newest-first for the LIMIT; shown oldest-first.
        messages: ((data as unknown as Raw[]) || [])
          .reverse()
          .map((m) => ({
            id: m.id,
            author: m.author,
            content: m.content,
            created_at: m.created_at,
            staffName: m.profiles?.full_name ?? null,
          })),
      },
    };
  } catch (err) {
    return toActionError(err);
  }
}

export async function sendAiChatMessage(
  input: unknown,
): Promise<ActionResult<{ reply: string }>> {
  try {
    const { profile } = await requireStaff();
    const parsed = sendChatMessageSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid message.' };
    }
    const { aiProfileId, message } = parsed.data;

    const admin = createAdminClient();

    // The employee must exist, be active and not paused.
    const [{ data: ai }, { data: config }] = await Promise.all([
      admin
        .from('profiles')
        .select('id')
        .eq('id', aiProfileId)
        .eq('role', 'ai')
        .eq('is_active', true)
        .maybeSingle(),
      admin
        .from('ai_employee_config')
        .select('job_description, max_runs_per_day, is_paused, employment_type')
        .eq('profile_id', aiProfileId)
        .maybeSingle(),
    ]);
    if (!ai || !config) {
      return { success: false, error: 'That AI employee is not available.' };
    }
    // Self-guard, because every `use server` export is a POST endpoint and the
    // picker filter is only a UI convenience. Without this the request still
    // fails — resolveEmployeeProvider throws on the null provider_id — but with
    // "an admin can check the key", advice nobody can act on: the provider field
    // is hidden for an external employee and the database CHECK forbids one.
    if (config.employment_type !== 'platform') {
      return {
        success: false,
        error:
          'That AI employee works through its own API key and is instructed in its own tool, not from this chat.',
      };
    }
    if (config.is_paused) {
      return { success: false, error: 'This AI employee is paused.', code: 'ai_paused' };
    }

    // Rulebook digest — chat answers must be grounded in the active rules.
    const { data: kbHead } = await admin
      .from('kb_versions')
      .select('id, version')
      .eq('status', 'active')
      .maybeSingle();
    if (!kbHead) {
      return {
        success: false,
        error: 'There is no active rulebook yet. Activate a knowledge-base version first.',
      };
    }

    let cached = digestByVersion.get(kbHead.id);
    if (!cached) {
      const { data: kbFull } = await admin
        .from('kb_versions')
        .select('rules')
        .eq('id', kbHead.id)
        .maybeSingle();
      const bible = bibleSchema.safeParse(kbFull?.rules);
      if (!bible.success) {
        return { success: false, error: 'The active rulebook is not readable.' };
      }
      cached = { version: kbHead.version, digest: renderBibleDigest(bible.data) };
      digestByVersion.set(kbHead.id, cached);
    }

    // Answers a colleague gave to this employee's questions. Without feeding
    // them back the AI asks the same thing forever — the answer sits in the
    // database and never reaches the one who asked.
    const { data: answered } = await admin
      .from('ai_proposals')
      .select('payload, review_note')
      .eq('ai_profile_id', aiProfileId)
      .eq('proposal_type', 'question')
      .eq('status', 'approved')
      .not('review_note', 'is', null)
      .order('reviewed_at', { ascending: false })
      .limit(10);

    const answeredBlock = (
      (answered as { payload: { question_nl?: string } | null; review_note: string }[]) || []
    )
      .map((q) => `- V: ${q.payload?.question_nl ?? '(vraag onbekend)'}\n  A: ${q.review_note}`)
      .join('\n');

    // Recent history, oldest first.
    const { data: historyRows } = await admin
      .from('ai_messages')
      .select('author, content')
      .eq('ai_profile_id', aiProfileId)
      .order('created_at', { ascending: false })
      .limit(HISTORY_WINDOW);
    const history = (((historyRows as Pick<AiMessage, 'author' | 'content'>[]) || [])).reverse();

    // Provider before budget: asking the limiter IS the spend, so a
    // misconfigured key must not burn budget slots (the B2 lesson).
    let provider;
    try {
      provider = await resolveEmployeeProvider(aiProfileId);
    } catch (err) {
      // Generic on purpose: the real error can name env vars and crypto
      // internals, which belongs in the server log, not in a staff browser.
      console.error('[ai-chat] provider resolution failed:', err);
      return {
        success: false,
        error: 'The AI provider is not available. An admin can check the key under Admin → AI employees.',
        code: 'ai_unavailable',
      };
    }

    // Chat and assessments draw from ONE daily budget. A single knob the admin
    // already understands beats a second limit that means almost the same
    // thing; raise max_runs_per_day if chat needs more room.
    const withinBudget = await checkRateLimitStrict(
      `ai-run:${aiProfileId}`,
      config.max_runs_per_day,
      86400,
    );
    if (!withinBudget) {
      return {
        success: false,
        error: 'This AI employee has reached its daily run limit.',
        code: 'ai_budget_exceeded',
      };
    }

    /*
     * Message layout, built for the prompt cache:
     *
     *   turn 1 (user):      rulebook digest   <- cacheable, IDENTICAL each call
     *   turn 2 (assistant): short ack
     *   turns 3..n:         history, coalesced to strict user/assistant alternation
     *   last turn (user):   the new message
     *
     * The digest lives in its own leading turn — not merged into the history —
     * because the history WINDOW slides: if the digest shared a turn with the
     * oldest windowed message, every slide would change the cached prefix and
     * every call would pay the cache-write surcharge for a hit that never
     * comes. A stable leading turn hits on every consecutive message.
     */
    const digestBlock: AiContentBlock = {
      type: 'text',
      text: chatDigestPreface(cached.version) + cached.digest,
      cacheable: true,
    };

    const turns: { role: 'user' | 'assistant'; content: AiContentBlock[] }[] = [
      {
        role: 'user',
        content: answeredBlock
          ? [
              digestBlock,
              {
                type: 'text',
                text: `EERDER BEANTWOORDE VRAGEN (bindend — volg deze, vraag ze niet opnieuw):
${answeredBlock}`,
              },
            ]
          : [digestBlock],
      },
      { role: 'assistant', content: [{ type: 'text', text: 'Begrepen. Waarmee kan ik helpen?' }] },
    ];
    for (const m of history) {
      // The provider rejects empty text blocks with a 400 — one bad stored row
      // must not brick the whole thread.
      if (!m.content.trim()) continue;
      const role = m.author === 'staff' ? 'user' : 'assistant';
      const last = turns[turns.length - 1];
      if (last.role === role) {
        // Consecutive same-author messages merge into one turn — the provider
        // requires strict alternation.
        last.content.push({ type: 'text', text: m.content });
      } else {
        turns.push({ role, content: [{ type: 'text', text: m.content }] });
      }
    }
    const lastTurn = turns[turns.length - 1];
    if (lastTurn.role === 'user') {
      lastTurn.content.push({ type: 'text', text: message });
    } else {
      turns.push({ role: 'user', content: [{ type: 'text', text: message }] });
    }

    // The staff message is part of the thread whatever the provider does next —
    // a failed reply should read as "I asked, it broke", not as silence.
    const { error: insertError } = await admin.from('ai_messages').insert({
      ai_profile_id: aiProfileId,
      author: 'staff',
      staff_id: profile.id,
      content: message,
    });
    if (insertError) {
      console.error('[ai-chat] could not store staff message:', insertError);
      return { success: false, error: 'Could not send the message.' };
    }

    /*
     * Agentic loop. The model may call tools, read the results, and call more
     * before answering — that is what makes it "sitting at the dashboard"
     * rather than answering from memory.
     *
     * Token counts accumulate across iterations: one chat message can be
     * several billed calls, and the ledger must show the total, not the last.
     */
    const system = buildChatSystem(config.job_description);
    const tools = toolDefinitions();
    let result;
    let iterations = 0;
    let inputTokens = 0;
    let cacheWriteTokens = 0;
    let cacheReadTokens = 0;
    let outputTokens = 0;
    let latencyMs = 0;
    const mutations: string[] = [];

    try {
      for (;;) {
        iterations += 1;
        result = await provider.client.complete({
          model: provider.model,
          system,
          messages: turns,
          maxTokens: MAX_REPLY_TOKENS,
          tools,
        });

        inputTokens += result.inputTokens;
        cacheWriteTokens += result.cacheWriteTokens;
        cacheReadTokens += result.cacheReadTokens;
        outputTokens += result.outputTokens;
        latencyMs += result.latencyMs;

        // The provider's own server-side tool loop hit its cap: resend the
        // transcript unchanged and it resumes. Not our tools, nothing to run.
        if (result.stopReason === 'pause') {
          turns.push({ role: 'assistant', content: result.content });
          if (iterations >= MAX_TOOL_ITERATIONS) break;
          continue;
        }

        if (result.stopReason !== 'tool_use' || result.toolUses.length === 0) break;

        // Echo the assistant turn VERBATIM — the provider rejects a transcript
        // whose tool_use blocks were dropped or rebuilt.
        turns.push({ role: 'assistant', content: result.content });

        const outcome = await runToolCalls(result.toolUses, {
          admin,
          aiProfileId,
          staffId: profile.id,
        });
        mutations.push(...outcome.mutations);

        // Every tool result goes back in ONE user turn.
        turns.push({ role: 'user', content: outcome.blocks });

        if (iterations >= MAX_TOOL_ITERATIONS) {
          // Out of budget mid-task. Tell the model so it wraps up honestly
          // instead of being cut off mid-thought.
          turns.push({
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Je hebt geen tool-aanroepen meer over voor dit bericht. Rond af: vertel kort wat je hebt gedaan, wat er nog open staat, en wat een mens nu moet doen.',
              },
            ],
          });
          result = await provider.client.complete({
            model: provider.model,
            system,
            messages: turns,
            maxTokens: MAX_REPLY_TOKENS,
          });
          inputTokens += result.inputTokens;
          cacheWriteTokens += result.cacheWriteTokens;
          cacheReadTokens += result.cacheReadTokens;
          outputTokens += result.outputTokens;
          latencyMs += result.latencyMs;
          break;
        }
      }
    } catch (err) {
      await recordChatRun(admin, aiProfileId, provider.providerName, provider.model, {
        status: 'error',
        error: err instanceof Error ? err.message : 'provider error',
        inputTokens,
        cacheWriteTokens,
        cacheReadTokens,
        outputTokens,
        latencyMs,
      });
      return {
        success: false,
        error: describeProviderError('ai-chat', err),
        code: 'ai_unavailable',
      };
    }

    if (result.stopReason === 'refusal') {
      await recordChatRun(admin, aiProfileId, provider.providerName, result.model, {
        status: 'error',
        error: 'stop_reason refusal',
        inputTokens,
        cacheWriteTokens,
        cacheReadTokens,
        outputTokens,
        latencyMs,
      });
      return { success: false, error: 'The AI declined to answer this.', code: 'ai_unavailable' };
    }

    let reply = result.text.trim();

    // An empty reply is an error, not a message: stored, it would render as a
    // blank bubble AND poison every later call in the history window (the
    // provider rejects empty content blocks).
    if (!reply && mutations.length > 0) {
      // Tools ran and changed things; the model just had nothing left to say.
      // Silence would hide real work, so state it plainly.
      reply = `Uitgevoerd: ${mutations.join(', ')}.`;
    }

    if (!reply) {
      await recordChatRun(admin, aiProfileId, provider.providerName, result.model, {
        status: 'error',
        error: 'empty reply',
        inputTokens,
        cacheWriteTokens,
        cacheReadTokens,
        outputTokens,
        latencyMs,
      });
      return { success: false, error: 'The AI could not reply. Try again.', code: 'ai_unavailable' };
    }

    // A reply that hit the token cap is stored — it was billed and may still
    // be useful — but never silently: the thread must show it is incomplete.
    const truncated = result.stopReason === 'max_tokens';
    if (truncated) {
      reply +=
        '\n\n[Antwoord afgekapt — stel een gerichtere vraag, of vraag een AI-beoordeling aan voor het volledige overzicht.]';
    }

    const { error: replyError } = await admin.from('ai_messages').insert({
      ai_profile_id: aiProfileId,
      author: 'ai',
      staff_id: profile.id,
      content: reply,
    });
    if (replyError) {
      // The reply was billed; the ledger must know even if the thread doesn't.
      console.error('[ai-chat] could not store AI reply:', replyError);
    }

    await recordChatRun(admin, aiProfileId, provider.providerName, result.model, {
      status: 'ok',
      error: truncated ? 'truncated at max_tokens' : undefined,
      inputTokens,
      cacheWriteTokens,
      cacheReadTokens,
      outputTokens,
      latencyMs,
    });

    return { success: true, data: { reply } };
  } catch (err) {
    return toActionError(err);
  }
}

async function recordChatRun(
  admin: ReturnType<typeof createAdminClient>,
  aiProfileId: string,
  provider: string,
  model: string,
  record: {
    status: 'ok' | 'error';
    error?: string;
    inputTokens?: number;
    cacheWriteTokens?: number;
    cacheReadTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
  },
): Promise<void> {
  const { error } = await admin.from('ai_runs').insert({
    ai_profile_id: aiProfileId,
    provider,
    model,
    run_type: 'chat',
    input_tokens: record.inputTokens ?? null,
    cache_write_tokens: record.cacheWriteTokens ?? null,
    cache_read_tokens: record.cacheReadTokens ?? null,
    output_tokens: record.outputTokens ?? null,
    latency_ms: record.latencyMs ?? null,
    cost_estimate_cents:
      record.inputTokens != null && record.outputTokens != null
        ? estimateCostCents(
            model,
            record.inputTokens,
            record.outputTokens,
            record.cacheWriteTokens ?? 0,
            record.cacheReadTokens ?? 0,
          )
        : null,
    status: record.status,
    error: record.error ?? null,
  });
  if (error) console.error('[ai-chat] could not record run:', error);
}
