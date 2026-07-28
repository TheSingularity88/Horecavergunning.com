import 'server-only';

import { AI_TOOLS, type ToolAccess } from '@/app/lib/ai/tools/registry';
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

/** What each tier means, restated per operation so the GPT reads it in place. */
const TIER_NOTE: Record<ToolAccess, string> = {
  read: 'Read-only. Requires the "read" permission on your key.',
  write:
    'Changes internal work only — nothing a customer can see. Requires the "write" permission.',
  propose:
    'Files a PENDING PROPOSAL and changes nothing. A human approves it in the review queue before it takes effect. Do NOT report the change as done. Requires the "propose" permission.',
};

export function agentOpenApiDocument(): Record<string, unknown> {
  const paths: Record<string, unknown> = {
    '/api/agent/v1/me': {
      get: {
        operationId: 'whoAmI',
        summary: 'Which AI employee this key acts as, and what it may do.',
        description:
          'Call this first to confirm the key works. Returns the AI employee identity, the key label, and the permissions granted.',
        responses: { '200': { description: 'Identity and permissions.' } },
      },
    },
    '/api/agent/v1/tools': {
      get: {
        operationId: 'listTools',
        summary: 'Everything this key is allowed to do.',
        description:
          'Returns each available operation with its permission tier and whether this key carries it.',
        responses: { '200': { description: 'The tool catalogue.' } },
      },
    },
  };

  for (const tool of AI_TOOLS) {
    paths[`/api/agent/v1/tools/${tool.name}`] = {
      post: {
        // ChatGPT surfaces this to the user when asking to run an action, so it
        // has to read as a sentence, not an identifier.
        operationId: toCamel(tool.name),
        summary: tool.description,
        description: `${tool.description}\n\n${TIER_NOTE[tool.access]}`,
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
          '200': { description: 'The tool ran. `result` holds its output.' },
          '400': { description: 'Bad arguments, or the tool refused them. `message` says why.' },
          '401': { description: 'Missing, unknown, revoked or expired key.' },
          '403': { description: 'This key lacks the permission this operation needs.' },
          '429': { description: 'Rate limited. Slow down.' },
        },
      },
    };
  }

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
