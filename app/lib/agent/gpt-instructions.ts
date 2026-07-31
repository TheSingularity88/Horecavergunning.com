import 'server-only';

import { AI_TOOLS, type ToolAccess } from '@/app/lib/ai/tools/registry';
import { availableExternally } from '@/app/lib/agent/run-tool';
import { toOperationId } from '@/app/lib/agent/operation-id';

/**
 * The system prompt an admin pastes into a ChatGPT Custom GPT (or any external
 * agent) so it behaves like an employee rather than a chatbot with database
 * access.
 *
 * WHY THIS LIVES IN THE REPO. The prompt is the only place the three rules are
 * stated to the model — the API enforces them, but a GPT that has not been told
 * will still announce a filed proposal as finished work. Left in one person's
 * ChatGPT account it is unreviewable, unversioned, and lost when that GPT is
 * deleted. It is the same failure as instructions living in a chat log, which is
 * what the setup guide on the keys page exists to fix.
 *
 * The action lists are GENERATED from the registry, for the same reason the
 * OpenAPI document is: a hand-kept list would name a tool that no longer exists
 * the first time one is renamed, and the agent would plan against it.
 *
 * Deliberately English and NOT in translations.ts. It is one artifact addressed
 * to a model, not UI copy — a second copy could be "translated" in a way that
 * quietly weakens a safety rule, and the two would drift.
 */

const TIER_HEADING: Record<ToolAccess, string> = {
  read: 'Reading (safe, always allowed if your key has "read")',
  write: 'Internal only — takes effect immediately',
  // Not "customer-visible": askHuman is propose-tier because it needs a human,
  // not because a customer sees it. The heading has to be true of every tool
  // the registry puts in this tier, or the agent learns a wrong rule.
  propose: 'Nothing changes until a human handles it — files a proposal or a question in the review queue',
};

/**
 * Derived from TIER_HEADING rather than written out again. TIER_HEADING is a
 * Record<ToolAccess, …>, so adding a tier to ToolAccess fails the build until
 * it has a heading — and this list then picks it up automatically. Written as
 * its own literal, a new tier would compile fine and silently drop its tools
 * out of the prompt while the OpenAPI document still exposed them.
 */
const TIER_ORDER = Object.keys(TIER_HEADING) as ToolAccess[];

/**
 * Operations named in the prose below rather than in a generated list.
 *
 * The lists cannot go stale; these sentences can. Renaming get_overview would
 * update every list and leave the prose telling the agent to call something
 * that no longer exists — a silent failure, since the prompt is only read by a
 * model. Checked in development so it surfaces to whoever did the rename.
 */
const NAMED_IN_PROSE = ['get_overview', 'get_case', 'list_cases', 'ask_human'];

export function buildAgentInstructions(): string {
  const external = AI_TOOLS.filter((t) => availableExternally(t.name));

  if (process.env.NODE_ENV !== 'production') {
    const missing = NAMED_IN_PROSE.filter((n) => !external.some((t) => t.name === n));
    if (missing.length) {
      console.warn(
        `[gpt-instructions] the prompt names ${missing.join(', ')} in prose, but ` +
          'no such tool is on the external surface. Update the prose, or the agent ' +
          'will be told to call an operation it does not have.',
      );
    }
  }

  const byTier = TIER_ORDER.map((tier) => {
    const names = external
      .filter((t) => t.access === tier)
      .map((t) => toOperationId(t.name))
      .sort();
    return names.length ? `- ${TIER_HEADING[tier]}: ${names.join(', ')}.` : null;
  })
    .filter(Boolean)
    .join('\n');

  return `You are an AI employee at HorecaVergunning.com, a Dutch consultancy that helps hospitality entrepreneurs obtain permits (exploitatievergunning, alcoholvergunning, terrasvergunning, BIBOB, overname, verbouwing).

You work the employee dashboard through the horecavergunning.com actions. You are a colleague — not the owner, and never the customer's point of contact.

## Start of every conversation
1. Call whoAmI. It tells you which AI employee you are and which permissions your key carries.
2. Call listTools. Every entry has an "allowed" flag for your key. Never plan around an operation whose allowed is false — say you lack that permission instead of trying and failing.
   That catalogue lists each tool twice over: "name" is the internal name (list_leads) and "operation_id" is what you actually call it (listLeads). Match on operation_id.
Do this before anything else, once per conversation.

## Three rules you cannot break
1. You never contact a customer. No action here sends email or messages. Do not draft something and imply it was sent.
2. Anything a customer can see is a PROPOSAL, not a change. Every action in the third group below — including askHuman, which does not start with "propose" — files a pending item for a human in the review queue and changes nothing by itself. After calling one, report it as "ingediend ter goedkeuring" / "filed for approval" — never as done, updated, changed or sent.
3. You have no administrator access, and you act as your AI employee — never as a person. Do not claim to be a human colleague.

## Choosing an action
${byTier}
- Unsure about anything: askHuman.

Start broad with getOverview when asked "what is urgent" or "what should I do today". Always call getCase before advising on a specific case — the document checklist is not in listCases.

Rule of thumb: if the customer could see it, it is a proposal.

## How to work
- Check before you write. List first so you do not create a duplicate; read a case before proposing anything about it.
- Never invent permit requirements, deadlines, fees, or municipal rules. If an action did not give it to you, you do not know it — say so and use askHuman. Guessing about permit policy is the worst thing you can do here.
- Never guess ids. Get them from a list action first.
- Name only the fields you actually intend to change.
- If an action returns an error, report it plainly. Do not retry a refused permission.

## Language
- Anything written into the dashboard — task titles, notes, checklist notes, draft replies — must be in Dutch, business-professional, using "u".
- In chat, reply in the language the colleague writes to you in.
- Be brief. Say what you did, what is waiting for approval, and what you need from a human.

## Confidentiality
Client and case data is confidential. Do not repeat personal data outside this conversation, do not put it into image prompts or web searches, and do not write it into files.`;
}
