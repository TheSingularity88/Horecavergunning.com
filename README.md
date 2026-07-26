# HorecaVergunning.com

Marketing site + client/employee portal that helps Dutch entrepreneurs apply
for hospitality permits (horeca-, exploitatie-, alcohol-, terras-, Bibob-
vergunning). Clients sign up, submit a request for the permit they need, and we
handle the government paperwork for a one-time fee per permit type.

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS v4** · **Framer Motion** · **Lucide** icons
- **Supabase** — Postgres, Auth, Storage (`@supabase/ssr`)
- **Mollie** — iDEAL / card payments
- **Resend** — transactional email
- **Zod** — input validation
- Custom NL/EN i18n (React context, cookie-persisted)

## Architecture

- **Public site** (`app/page.tsx`, `app/components/*`) — hero, services,
  DB-driven pricing, lead-capturing quiz, FAQ, blog, contact form.
- **Client portal** (`app/client/*`) — dashboard, requests, cases + document
  checklist, documents, invoices, profile.
- **Employee/admin dashboard** (`app/dashboard/*`) — clients, cases, tasks,
  documents, requests review, leads inbox; admin-only: users, **permit types &
  pricing**, settings, activity log.
- **Security** — all privileged writes go through server actions
  (`app/lib/actions/*`) using a service-role client (`app/lib/supabase/admin.ts`)
  behind auth guards (`app/lib/auth/guards.ts`). Everything else is protected by
  Postgres RLS. `middleware.ts` gates `/dashboard/*` (staff) and `/client/*`
  (clients).
- **Payments** — request approval creates a case + document checklist + invoice,
  starts a Mollie payment, and emails the client a checkout link. The webhook
  (`app/api/webhooks/mollie/route.ts`) refetches the payment from Mollie and
  updates the invoice idempotently.
- **Leads** — `POST /api/leads` (quiz / contact / newsletter) with zod, a
  honeypot, and IP/email rate limiting; inserts via the service role and
  notifies the owner via Resend.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

### Environment variables

See `.env.example`. Summary:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; bypasses RLS. **Never expose.** |
| `NEXT_PUBLIC_SITE_URL` | Base URL for Mollie redirect/webhook + email links |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `OWNER_NOTIFICATION_EMAIL` | Email |
| `MOLLIE_API_KEY` | Payments (use a `test_` key first) |
| `ANTHROPIC_API_KEY` | AI analysis (knowledge base). Pay-per-use key from console.anthropic.com |

Email and payments **degrade gracefully** when their keys are absent, so the app
runs locally without them.

## Database & migrations

Versioned SQL lives in `supabase/migrations/`. `000_baseline.sql` documents the
already-applied state; `002`–`007` are the changes made since. Apply new
migrations via the Supabase SQL editor or the Supabase MCP tools, then
regenerate types:

```bash
npx supabase gen types typescript --project-id <project-id> > app/lib/types/supabase.ts
```

## Deployment

Deployed on **Vercel**. Set all environment variables in the Vercel project.
Configure the Mollie webhook to point at `<site>/api/webhooks/mollie` (needs a
public URL — use a preview deploy or a tunnel when testing locally).

## Roadmap

Planned next: per-case document **auto-checking** — the `permit_types` →
`required_documents` → `case_documents` model (with `auto_check_config`) is the
foundation for it. See `docs/DASHBOARD_IMPLEMENTATION.md` for more.
