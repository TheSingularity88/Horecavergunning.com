# Handoff — AI employee system

Written 2026-07-28. Everything below is merged to `main` and applied to the live
Supabase project (`llpkcmfpijzevbmujfkq`) unless it says otherwise.

## The one invariant everything serves

The owner's words: *"AI should not communicate directly with customers, a real
human should always approve interactions and or check an AI's work before any
important crucial action is taken."* And: AI employees never hold admin access.

In code this is the **tool tier**:

| Tier | Meaning |
|---|---|
| `read` | see internal work |
| `write` | change internal work directly — reversible, invisible to any customer |
| `propose` | anything a customer can see, or that is hard to undo → a PENDING proposal a human approves in `/dashboard/ai-review` |

**Tools run on a service-role client that bypasses all RLS. The tier is the only
control.** Mis-tiering IS the breach — there is no second line of defence.

### How to decide a tier — do not reason, grep

This has been got wrong twice, both times by assuming. Before tiering a tool,
grep `app/client/**` and the RLS policies for every column it writes.

Verified customer-visible today:

- `cases.status` → emails the client
- `cases.title / description / municipality / reference_number / priority / deadline` → the customer's own case page
- `case_documents.*` → the checklist on that page
- `tasks.title / tasks.status` → the task list on that page (`tasks_select_client` in `002_security_fixes.sql`, rendered at `app/client/cases/[id]/page.tsx:554`)

## Two routes, and every AI employee is marked with one

| | |
|---|---|
| **Route 1 `platform`** | We hold an Anthropic key and call the model for it. Works from `/dashboard/ai-chat` and the case-assessment button. "Agent 1" is one. |
| **Route 2 `external`** | *We mint an API key*; an outside agent (Custom GPT, Claude Code) authenticates with it and drives the dashboard over HTTP. Brings its own model. "Nova CLI" is one. |

`ai_employee_config.employment_type`, enforced by database constraints:
platform ⇒ has a provider; external ⇒ has none; **the route is immutable after
creation** (a trigger refuses), because flipping it would silently re-label
everything that employee ever produced.

## Where R4b-3 picks up

**Done (#45, #46):** the marking, and platform-minted inbound keys with
fail-closed auth. `GET /api/agent/v1/me` works: a key authenticates **as its AI
employee**, never as an admin.

**To build:** the rest of the agent HTTP surface — read endpoints (leads, cases,
tasks, clients, documents), a propose endpoint, and an OpenAPI 3.1 document a
Custom GPT can import as an Action.

### Non-obvious things that will bite

1. **Reuse the tool registry, do not reimplement it.** `app/lib/ai/tools/registry.ts`
   + `dashboard-tools.ts` already encode every tier decision, and `run-tools.ts`
   already writes the `ai_tool_calls` audit row. An HTTP surface that
   reimplements the queries will drift from the tiering. `ToolContext` currently
   requires `staffId: string` — an external agent has no staff member behind it,
   and `ai_tool_calls.staff_id` is **already nullable** for exactly this case.
2. **Enforce `scopes`.** Keys carry `read`/`write`/`propose` and **nothing checks
   them yet** — `hasScope()` in `app/lib/agent/auth.ts` exists and is unused.
   Map tool `access` → required scope.
3. **`middleware.ts` exempts `/api`.** Every route must carry its own auth from
   line one. No CORS — server-to-server only.
4. **Do not log or echo the plaintext key.** This project leaked a provider key
   once through Next's server-action argument logging; `next.config.ts` sets
   `logging.serverFunctions: false` because of it.
5. **`ai_proposals.ai_employment_type` is stamped by a database trigger**, so
   proposals filed over HTTP get marked automatically. Do not set it by hand.

### Postgres traps this codebase has hit twice

- **A `CHECK` is satisfied by `NULL`.** `CHECK (status IN (...))` does not stop
  `status = NULL`. Validate in code too.
- **`array_length('{}', 1)` returns `NULL`, not 0** — use `cardinality()`.
- **`toISOString()` is UTC by specification.** The business runs in Amsterdam;
  use `Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' })`.
- **supabase-js RESOLVES a failed query** with `{ data: null, error }`. `?? []`
  turns an outage into a confident empty answer. Check `error`.
- **A `.filter((x): x is T => ...)` predicate ASSERTS rather than checks.** A
  field missing from a hand-built object type-checks clean. Annotate the `map`.

## Open decisions for the owner

- **#18 — `create_task` writes an AI-authored title onto a customer's case page.**
  Pre-existing. Either stop rendering the internal task list in the client
  portal, or route created titles through approval. A product call.
- **Test artifacts in production:** AI employee **"Nova CLI"** and one revoked
  key. Both inert; Nova CLI is the natural subject for R4b-3.
- Still owner-blocked from earlier: rotate the leaked Anthropic key, set
  `AI_KEY_ENCRYPTION_SECRET` on Vercel.

## Working agreement that has paid off

Every PR gets an adversarial review workflow before merge — findings filed by
one agent, then handed to a skeptic told to refute them. It has caught, among
others: a tiering breach that would have painted false progress on a customer's
page, an approval path broken by a `'use server'` file exporting a constant, and
unthrottled anonymous writes into the audit log. Claims are verified against the
live database, not asserted.
