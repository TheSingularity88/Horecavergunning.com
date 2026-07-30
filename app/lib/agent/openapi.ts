import 'server-only';

import { AI_TOOLS, type ToolAccess } from '@/app/lib/ai/tools/registry';
import { availableExternally } from '@/app/lib/agent/run-tool';
import { SITE_URL } from '@/app/lib/site';

/**
 * The OpenAPI document a ChatGPT Custom GPT imports as an Action.
 *
 * GENERATED FROM THE REGISTRY, never hand-written. A Custom GPT cannot call an
 * arbitrary URL — its Actions panel needs a schema listing every operation and
 * its arguments — and a hand-maintained copy of that would drift from the tools
 * the first time one changed. This is the same list the internal chat and the
 * Claude CLI already work from, so all three stay in step by construction.
 *
 * One path per tool rather than a single dispatcher: ChatGPT plans against
 * named operations, and `POST /tools/{name}` with a free-text name would give
 * it nothing to plan with.
 */

/** A JSON response body of the named component. Keeps the `content` boilerplate out of each response. */
const json = (schema: string) => ({
  content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}` } } },
});

/**
 * Every way authentication itself can fail, attached to operations that take no
 * body. Declaring only 200 would tell a GPT that a 401 is an unexpected fault
 * and invite it to retry a key that will never work.
 */
const AUTH_FAILURES = {
  '401': { description: 'Missing, unknown, revoked or expired key. Not retryable.', ...json('AgentError') },
  '403': { description: 'The AI employee this key belongs to is paused or deactivated.', ...json('AgentError') },
  '429': { description: 'Rate limited. Slow down and retry.', ...json('AgentError') },
  '503': { description: 'Temporarily unavailable. Retry shortly.', ...json('AgentError') },
} as const;

/**
 * ChatGPT's Action importer rejects the WHOLE document if any operation's
 * summary or description exceeds this. Not a style preference — an import
 * error, and the reason the first version of this document could not be
 * imported at all.
 */
const CHATGPT_TEXT_LIMIT = 300;

/**
 * What each tier means, restated per operation so the GPT reads it in place.
 *
 * Kept short deliberately: it is spent out of the same 300-character budget as
 * the tool's own description, and it is the half that must never be the part
 * that gets dropped. A GPT that loses "nothing changes until a human approves"
 * will report proposals as completed work.
 */
const TIER_NOTE: Record<ToolAccess, string> = {
  read: 'Read-only. Needs the "read" permission.',
  write: 'Changes internal work only, never anything a customer sees. Needs "write".',
  propose:
    'Files a PENDING PROPOSAL — nothing changes until a human approves it. Do NOT report it as done. Needs "propose".',
};

/**
 * Cut to `limit` on a word boundary. A last resort: every tool long enough to
 * hit this should carry a hand-written `brief` instead, so that what survives
 * is chosen rather than whatever happened to fall inside the budget. Present
 * so that adding a long-descriptioned tool can never again produce a document
 * ChatGPT refuses — it degrades the text instead of breaking the import.
 */
function clamp(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > limit * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** The first sentence, for the one-line summary ChatGPT shows when it asks to run an action. */
function firstSentence(text: string): string {
  const end = text.search(/[.!?](\s|$)/);
  return clamp(end === -1 ? text : text.slice(0, end + 1), CHATGPT_TEXT_LIMIT);
}

/**
 * Last line of defence: nothing leaves this function over the limit.
 *
 * The per-tool path below already budgets its text, but the hand-written
 * operations above it do not, and neither will the next one somebody adds.
 * One over-long string rejects the ENTIRE document — every operation becomes
 * unimportable, not just the offending one — so this is enforced structurally
 * rather than left to whoever edits the file next. That is exactly how the
 * first version shipped unusable.
 */
function enforceTextLimits(paths: Record<string, unknown>): void {
  for (const [path, methods] of Object.entries(paths)) {
    for (const operation of Object.values(methods as Record<string, Record<string, unknown>>)) {
      for (const field of ['summary', 'description'] as const) {
        const value = operation[field];
        if (typeof value !== 'string' || value.length <= CHATGPT_TEXT_LIMIT) continue;
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[openapi] ${path} ${field} is ${value.length} chars and was cut to ` +
              `${CHATGPT_TEXT_LIMIT}. Give the tool a shorter \`brief\` so the wording is chosen, not truncated.`,
          );
        }
        operation[field] = clamp(value, CHATGPT_TEXT_LIMIT);
      }
    }
  }
}

export function agentOpenApiDocument(): Record<string, unknown> {
  const paths: Record<string, unknown> = {
    '/api/agent/v1/me': {
      get: {
        operationId: 'whoAmI',
        summary: 'Which AI employee this key acts as, and what it may do.',
        description:
          'Call this first to confirm the key works. Returns the AI employee identity, the key label, and the permissions granted.',
        responses: { '200': { description: 'Identity and permissions.' }, ...AUTH_FAILURES },
      },
    },
    '/api/agent/v1/tools': {
      get: {
        operationId: 'listTools',
        summary: 'Everything this key is allowed to do.',
        description:
          'Returns each available operation with its permission tier and whether this key carries it.',
        responses: { '200': { description: 'The tool catalogue.' }, ...AUTH_FAILURES },
      },
    },
  };

  // The SAME gate the executor applies, not a second copy of the registry.
  // WITHHELD_FROM_EXTERNAL is empty today, so this changes nothing now — but
  // the whole purpose of that set is to be used when a tool must not be exposed,
  // and a schema that advertised a withheld tool would send a Custom GPT to a
  // guaranteed 403 with no way to know why.
  for (const tool of AI_TOOLS.filter((t) => availableExternally(t.name))) {
    const tier = TIER_NOTE[tool.access];
    // The tier note is reserved out of the budget FIRST and appended whole, so
    // the part that can be shortened is the description of what the tool does —
    // never the part saying a proposal is not a completed change.
    const body = clamp(tool.brief ?? tool.description, CHATGPT_TEXT_LIMIT - tier.length - 2);

    paths[`/api/agent/v1/tools/${tool.name}`] = {
      post: {
        // ChatGPT surfaces this to the user when asking to run an action, so it
        // has to read as a sentence, not an identifier.
        operationId: toCamel(tool.name),
        summary: firstSentence(tool.brief ?? tool.description),
        description: `${body}\n\n${tier}`,
        // ChatGPT asks the user to confirm every call unless told otherwise,
        // which would make a read-only agent unusable. Set from `access` for
        // all three tiers rather than only for read: pinning write and propose
        // to `true` keeps the confirmation prompt on the operations that change
        // something, instead of leaving it to a ChatGPT default we do not own.
        'x-openai-isConsequential': tool.access !== 'read',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              // The tool's own JSON Schema, verbatim. It is what the internal
              // model is given, so an external agent gets the same contract.
              schema: tool.inputSchema,
            },
          },
        },
        responses: {
          '200': { description: 'The tool ran.', ...json('ToolResult') },
          '400': {
            description: 'Bad arguments, or the tool refused them. `message` says why.',
            ...json('AgentError'),
          },
          '401': { description: 'Missing, unknown, revoked or expired key.', ...json('AgentError') },
          '403': {
            description:
              'Refused: either this key lacks the permission the operation needs, or the AI employee it belongs to is paused or deactivated. Not retryable — a human must change something.',
            ...json('AgentError'),
          },
          '429': { description: 'Rate limited. Slow down.', ...json('AgentError') },
        },
      },
    };
  }

  enforceTextLimits(paths);

  return {
    openapi: '3.1.0',
    info: {
      title: 'HorecaVergunning — AI employee API',
      version: '1.0.0',
      description: [
        'Work the employee dashboard as one of our AI employees.',
        '',
        'THREE RULES, enforced by this API and not merely requested:',
        '1. Anything a customer can see is filed as a PROPOSAL and takes effect only when a human approves it. Never tell a colleague such a change is done.',
        '2. You cannot contact a customer. No operation here sends email or messages.',
        '3. You have no administrator access, and you act as your AI employee — never as a person.',
        '',
        'Start with whoAmI to confirm your key, then listTools to see what you may do.',
      ].join('\n'),
    },
    servers: [{ url: SITE_URL }],
    // ChatGPT's Actions panel configures the key separately, under
    // Authentication → API Key → Bearer. This just declares the scheme.
    security: [{ bearerAuth: [] }],
    components: {
      // ChatGPT's importer requires `schemas` to be an object and fails the
      // whole document with "schemas subsection is not an object" when it is
      // absent. An empty object satisfies the letter of that check, but there
      // are reports of the importer wanting at least one definition, and the
      // responses were untyped anyway — so these describe what the routes
      // actually return, and the responses below reference them.
      schemas: {
        AgentError: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Machine-readable reason, e.g. scope_denied.' },
            message: { type: 'string', description: 'What went wrong, in plain language.' },
          },
          required: ['error'],
        },
        ToolResult: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            access: { type: 'string', enum: ['read', 'write', 'propose'] },
            result: { description: "The tool's own output. Its shape depends on the tool." },
            note: {
              type: 'string',
              description:
                'Present on propose-tier calls: the change is PENDING a human decision. Do not report it as done.',
            },
          },
          required: ['tool', 'access'],
        },
      },
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', description: 'The key minted for this AI employee.' },
      },
    },
    paths,
  };
}

/** list_leads -> listLeads. ChatGPT requires operationIds to be unique and identifier-safe. */
function toCamel(name: string): string {
  return name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}
