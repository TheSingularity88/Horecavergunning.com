# Dashboard Implementation Documentation

This document provides a complete overview of the employee/admin dashboard implementation for HorecaVergunning.com, created for future developers or AI assistants working on this repository.

---

## Overview

A modern, professional dashboard was implemented for employees and admins with the following features:
- **Authentication**: Supabase Auth with email/password
- **Role-based access**: Employees see assigned data, admins see all
- **Client Management**: CRUD operations for client companies
- **Case Management**: Track permit applications through various stages
- **Task Management**: List and Kanban board views
- **Document Management**: Upload, categorize, and manage files
- **Admin Features**: User management, system settings, activity logs
- **Bilingual Support**: Dutch (nl) and English (en)

---

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Database/Auth**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Language**: TypeScript
- **Icons**: Lucide React

---

## Supabase Configuration

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://llpkcmfpijzevbmujfkq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxscGtjbWZwaWp6ZXZibXVqZmtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTA2MTcsImV4cCI6MjA4NDQyNjYxN30.xjNChJ2tCu_i9OPgwrACrXvvfCcyX9ig5iMFwfXCKqM
```

---

## File Structure

```
app/
├── (auth)/                          # Auth route group
│   ├── layout.tsx                   # Wraps auth pages with providers
│   ├── login/page.tsx               # Login page with Suspense boundary
│   └── forgot-password/page.tsx     # Password reset page
│
├── dashboard/                       # Dashboard route group
│   ├── layout.tsx                   # Dashboard layout with sidebar, auth check
│   ├── page.tsx                     # Dashboard home with stats
│   │
│   ├── clients/
│   │   ├── page.tsx                 # Client list with search/filter
│   │   ├── new/page.tsx             # Create new client form
│   │   └── [id]/page.tsx            # Client detail/edit page
│   │
│   ├── cases/
│   │   ├── page.tsx                 # Case list with filters
│   │   ├── new/page.tsx             # Create new case form
│   │   └── [id]/page.tsx            # Case detail with timeline
│   │
│   ├── tasks/
│   │   ├── page.tsx                 # Task list + Kanban board
│   │   ├── new/page.tsx             # Create new task form
│   │   └── [id]/page.tsx            # Task detail/edit page
│   │
│   ├── documents/
│   │   └── page.tsx                 # Document management with upload
│   │
│   ├── admin/                       # Admin-only routes
│   │   ├── users/page.tsx           # User management
│   │   ├── settings/page.tsx        # System settings
│   │   └── activity/page.tsx        # Activity/audit log
│   │
│   └── profile/
│       └── page.tsx                 # User profile settings
│
├── components/
│   ├── dashboard/
│   │   ├── Sidebar.tsx              # Navigation sidebar
│   │   ├── Header.tsx               # Top header with user menu
│   │   └── StatsCard.tsx            # Statistics display cards
│   │
│   └── ui/
│       ├── Input.tsx                # Form input with label/error
│       ├── Select.tsx               # Dropdown select
│       ├── Textarea.tsx             # Text area input
│       ├── Card.tsx                 # Card container
│       ├── Badge.tsx                # Status badges
│       ├── Modal.tsx                # Dialog/modal component
│       ├── Table.tsx                # Data table with pagination
│       ├── Avatar.tsx               # User avatar
│       ├── Spinner.tsx              # Loading spinner
│       └── Button.tsx               # (existing, extended)
│
├── context/
│   ├── AuthContext.tsx              # Authentication state provider
│   └── LanguageContext.tsx          # (existing) i18n provider
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser Supabase client
│   │   └── server.ts                # Server Supabase client
│   │
│   ├── types/
│   │   └── database.ts              # TypeScript types for all tables
│   │
│   ├── translations.ts              # Extended with dashboard strings
│   └── utils/
│       └── cn.ts                    # Class name utility
│
└── middleware.ts                    # Route protection (deprecated, see note)

docs/
└── database-schema.sql              # Complete SQL schema for Supabase
```

---

## Database Schema

The database schema is in `docs/database-schema.sql`. Tables include:

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends auth.users) |
| `clients` | Client companies |
| `cases` | Permit applications |
| `tasks` | Task tracking |
| `documents` | File metadata |
| `activity_log` | Audit trail |
| `system_settings` | Admin configuration |

### Row Level Security (RLS)

- Employees can only see/edit clients and cases assigned to them
- Admins can see and manage all data
- Activity logs are insert-only for users, select-only for admins

---

## Key Implementation Details

### Authentication Flow

1. `AuthContext.tsx` manages auth state with Supabase
2. `useAuth()` hook provides: `user`, `profile`, `isLoading`, `isAdmin`, `signIn`, `signOut`
3. Dashboard layout checks auth and redirects to `/login` if not authenticated
4. Admin routes check `isAdmin` and redirect to `/dashboard` if not admin

### Supabase Client Setup

```typescript
// app/lib/supabase/client.ts - Browser client with memoization
import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return client;
}
```

### Type Casting for Supabase Queries

Supabase queries return `never` type without generated types. We use type casting:

```typescript
const { data } = await supabase.from('clients').select('*');
setClients((data as Client[]) || []);

// For insert/update:
await supabase.from('clients').insert(formData as unknown as never);
```

### Hydration Issue Fix

Dashboard layout uses `mounted` state to prevent SSR/client mismatch:

```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null; // Prevent SSR rendering
```

### Suspense for useSearchParams

Next.js 16 requires Suspense boundary for `useSearchParams()`:

```typescript
function LoginForm() {
  const searchParams = useSearchParams(); // Needs Suspense
  // ...
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginForm />
    </Suspense>
  );
}
```

---

## Bugs Fixed During Implementation

| Issue | File(s) | Fix |
|-------|---------|-----|
| Missing `useState` import | `dashboard/layout.tsx` | Added to import |
| "useAuth must be used within AuthProvider" | `(auth)/layout.tsx` | Created layout with providers |
| LanguageSwitcher import error | `dashboard/Header.tsx` | Changed to named import |
| Dashboard stuck on loading | `context/AuthContext.tsx`, `dashboard/layout.tsx` | Memoized Supabase client, added mounted state |
| TypeScript spread type errors | Multiple files | Added `as Type` casting |
| useSearchParams without Suspense | `login/page.tsx` | Wrapped in Suspense boundary |

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2. Environment Variables
Create `.env.local` with Supabase credentials (see above)

### 3. Run Database Schema
1. Go to Supabase Dashboard → SQL Editor
2. Paste contents of `docs/database-schema.sql`
3. Run the query

### 4. Create Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Create bucket named `documents`
3. Set appropriate policies for authenticated users

### 5. Create First Admin User
1. Sign up via `/login` page
2. Go to Supabase Dashboard → Table Editor → `profiles`
3. Find your user record
4. Set `role` to `admin`

---

## Translations

Dashboard translations were added to `app/lib/translations.ts` under the `dashboard` key:

```typescript
dashboard: {
  nav: { ... },           // Navigation labels
  home: { ... },          // Dashboard home
  clients: { ... },       // Client management
  cases: { ... },         // Case management
  tasks: { ... },         // Task management
  documents: { ... },     // Document management
  admin: { ... },         // Admin section
  auth: { ... },          // Login/auth
  common: { ... },        // Common strings
}
```

Both English (`en`) and Dutch (`nl`) are supported.

---

## Case Types and Statuses

### Case Types
- `exploitatievergunning` - Exploitation permit
- `alcoholvergunning` - Alcohol license
- `terrasvergunning` - Terrace permit
- `bibob` - BIBOB investigation
- `overname` - Business takeover
- `verbouwing` - Renovation permit

### Case Statuses
- `intake` - Initial intake
- `in_progress` - Being processed
- `waiting_client` - Waiting for client
- `waiting_government` - Waiting for government
- `review` - Under review
- `approved` - Approved
- `rejected` - Rejected
- `completed` - Completed

---

## Design System

### Colors (matching existing site)
- Primary: `amber-500`
- Background: `slate-50`
- Cards: `white` with `border-slate-200`
- Text: `slate-900` (headings), `slate-600` (body)
- Status badges: green (success), amber (warning), red (error), blue (info)

### Patterns
- Rounded corners: `rounded-xl`, `rounded-2xl`
- Shadows: `shadow-sm`, `shadow-xl`
- Animations: Framer Motion for page transitions and interactions
- Mobile: Collapsible sidebar with hamburger menu

---

## Known Limitations / Future Improvements

1. **Middleware deprecation**: Next.js 16.1.1 shows warning about `middleware.ts` being deprecated in favor of `proxy`. Consider migrating.

2. **Supabase typing**: Currently using manual type casting. Consider generating types with `supabase gen types typescript`.

3. **File upload**: Documents upload to Supabase Storage but preview/download needs testing.

4. **Email notifications**: Not implemented. Could add for task assignments, case updates.

5. **Real-time updates**: Could use Supabase Realtime for live updates.

6. **Search**: Basic search implemented. Could add full-text search with Supabase.

---

## Testing Checklist

- [ ] Login/logout flow
- [ ] Role-based redirects (admin vs employee)
- [ ] Create/edit/delete clients
- [ ] Create/edit/delete cases
- [ ] Task status updates (drag-and-drop on Kanban)
- [ ] Document upload/download
- [ ] Admin user management
- [ ] Admin system settings
- [ ] Language switching (NL/EN)
- [ ] Mobile responsive layout
- [ ] RLS policies (employee can't see other's data)

---

## Contact / Questions

This implementation was created by Claude (Anthropic AI). For questions about the codebase, refer to this documentation or examine the source files directly.

Last updated: January 2026
