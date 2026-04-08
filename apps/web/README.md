# apps/web

Next.js 16 (App Router) frontend for Khedra. Handles all user-facing pages, server actions, and database access.

## Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **UI**: shadcn/ui (New York style, Neutral), Tailwind CSS v4
- **Auth**: NextAuth.js v5 — magic link (Resend) + Google OAuth
- **ORM**: Prisma 7 → PostgreSQL (Supabase)
- **Forms**: react-hook-form + Zod (via `standardSchemaResolver`)
- **Icons**: `@remixicon/react`

## Structure

```
app/
├── (dashboard)/dashboard/   # Protected pages (auth enforced by auth.config.ts)
│   ├── page.tsx             # Team list
│   ├── teams/[id]/          # Per-team section
│   │   ├── employees/       # Shift workers CRUD
│   │   ├── shifts/          # Shift type CRUD
│   │   ├── plannings/       # Planning CRUD + detail view
│   │   ├── members/         # App users + invite link (admin/manager only)
│   │   └── my-schedule/     # Personal schedule for linked employees
│   └── settings/            # Profile settings
├── invite/[token]/          # Invite link acceptance (public)
├── sign-in/                 # Auth page
└── actions/                 # Server actions (all mutations)

components/teams/            # Feature components
components/ui/               # shadcn/ui primitives

lib/
├── auth-utils.ts            # requireTeamMember() helper
├── planning-utils.ts        # planningStatusVariant map
├── schemas/                 # Zod validation schemas
└── utils.ts                 # cn(), pluralize()

prisma/
├── schema.prisma            # Source of truth for DB schema
└── migrations/              # Applied migration history
```

## Dev

```bash
pnpm dev          # starts on http://localhost:3000
pnpm build        # production build
pnpm lint         # ESLint
```

## Environment variables

See `CONTRIBUTING.md` for the full list. Copy `.env.example` to `.env.local` to get started.
