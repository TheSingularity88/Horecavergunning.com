# Codex Instructions - HorecaVergunning.com

Welcome! This file provides quick context for AI assistants working on this repository.

## Project Overview

HorecaVergunning.com is a Next.js 16.1.1 marketing website with an employee/admin dashboard for managing hospitality permit applications in the Netherlands.

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Database/Auth**: Supabase
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Language**: TypeScript
- **i18n**: Custom translation system (Dutch + English)

## Key Documentation

- **Dashboard implementation details**: `docs/DASHBOARD_IMPLEMENTATION.md`
- **Database schema**: `docs/database-schema.sql`
- **Plan file**: Check `.claude/plans/` for implementation plans

## Important Files

| File | Purpose |
|------|---------|
| `app/context/AuthContext.tsx` | Authentication state management |
| `app/lib/supabase/client.ts` | Browser Supabase client |
| `app/lib/types/database.ts` | TypeScript types for database |
| `app/lib/translations.ts` | i18n translations |
| `middleware.ts` | Route protection (deprecated warning) |

## Supabase Setup Required

Before the dashboard works, these steps must be completed in Supabase:

1. Run `docs/database-schema.sql` in SQL Editor
2. Create storage bucket named `documents`
3. Set first user's `role` to `admin` in profiles table

## Common Patterns

### Supabase Query Type Casting
```typescript
const { data } = await supabase.from('clients').select('*');
setClients((data as Client[]) || []);
```

### Insert/Update with Type Bypass
```typescript
await supabase.from('clients').insert(formData as unknown as never);
```

### Preventing Hydration Mismatch
```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

## Recent Work Summary

The dashboard was implemented with:
- Full CRUD for clients, cases, tasks, documents
- Admin-only routes for user management, settings, activity logs
- Role-based access control via Supabase RLS
- Kanban board for task management
- Bilingual support (NL/EN)

## Known Issues

1. `middleware.ts` shows deprecation warning (Next.js wants `proxy` instead)
2. Supabase types are manually cast (could use generated types)
3. Storage bucket policies may need configuration

## File Organization

```
app/
├── (auth)/          # Login, forgot password
├── dashboard/       # All dashboard pages
├── components/
│   ├── dashboard/   # Sidebar, Header, StatsCard
│   └── ui/          # Reusable UI components
├── context/         # Auth and Language providers
└── lib/
    ├── supabase/    # Supabase clients
    ├── types/       # TypeScript types
    └── translations.ts
```

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Questions?

Read `docs/DASHBOARD_IMPLEMENTATION.md` for comprehensive details on every aspect of the dashboard implementation.
