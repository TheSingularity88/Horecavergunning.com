'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireStaff, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import { checkRateLimitStrict } from '@/app/lib/rate-limit';
import { resolveEmployeeProvider } from '@/app/lib/ai/provider-for-employee';
import { bibleSchema } from '@/app/lib/ai/bible-schema';
import { renderBibleDigest } from '@/app/lib/ai/render-bible';
import { buildChatSystem, chatDigestPreface } from '@/app/lib/ai/prompts/chat';
import { estimateCostCents } from '@/app/lib/ai/pricing';
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
const MAX_REPLY_TOKENS = 2000;

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

export async function getAiChatEmployees(): Promise<ActionResult<{ employees: ChatEmployee[] }>> {
  try {
    await requireStaff();
    const admin = createAdminClient();

    const [{ data: profiles }, { data: configs }] = await Promise.all([
      admin.from('profiles').select('id, full_name').eq('role', 'ai').eq('is_active', true),
      admin.from('ai_employee_config').select('profile_id, is_paused'),
    ]);

    const pausedByProfile = new Map(
      ((configs as { profile_id: string; is_paused: boolean }[]) || []).map((c) => [
        c.profile_id,
        c.is_paused,
      ]),
    );

    return {
      success: true,
      data: {
        employees: ((profiles as { id: string; full_name: string }[]) || []).map((p) => ({
          profileId: p.id,
          fullName: p.full_name,
          isPaused: pausedByProfile.get(p.id) ?? false,
        })),
      },
    };
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
        .select('job_description, max_runs_per_day, is_paused')
        .eq('profile_id', aiProfileId)
        .maybeSingle(),
    ]);
    if (!ai || !config) {
      return { success: false, error: 'That AI employee is not available.' };
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
      { role: 'user', content: [digestBlock] },
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

    let result;
    try {
      result = await provider.client.complete({
        model: provider.model,
        system: buildChatSystem(config.job_description),
        messages: turns,
        maxTokens: MAX_REPLY_TOKENS,
      });
    } catch (err) {
      await recordChatRun(admin, aiProfileId, provider.providerName, provider.model, {
        status: 'error',
        error: err instanceof Error ? err.message : 'provider error',
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
        inputTokens: result.inputTokens,
        cacheWriteTokens: result.cacheWriteTokens,
        cacheReadTokens: result.cacheReadTokens,
        outputTokens: result.outputTokens,
        latencyMs: result.latencyMs,
      });
      return { success: false, error: 'The AI declined to answer this.', code: 'ai_unavailable' };
    }

    let reply = result.text.trim();

    // An empty reply is an error, not a message: stored, it would render as a
    // blank bubble AND poison every later call in the history window (the
    // provider rejects empty content blocks).
    if (!reply) {
      await recordChatRun(admin, aiProfileId, provider.providerName, result.model, {
        status: 'error',
        error: 'empty reply',
        inputTokens: result.inputTokens,
        cacheWriteTokens: result.cacheWriteTokens,
        cacheReadTokens: result.cacheReadTokens,
        outputTokens: result.outputTokens,
        latencyMs: result.latencyMs,
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
      inputTokens: result.inputTokens,
      cacheWriteTokens: result.cacheWriteTokens,
      cacheReadTokens: result.cacheReadTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
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
