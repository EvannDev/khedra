# Contributing

## Prerequisites

- Node.js 20+, pnpm 10+
- Python 3.11+
- A PostgreSQL database (local or Supabase free tier)

## Setup

Follow the [Getting Started](README.md#getting-started) steps in the README.

## Project Structure

```
khedra/
├── apps/web/
│   ├── app/                  # Next.js App Router pages and layouts
│   │   ├── (dashboard)/      # Protected routes (require auth)
│   │   ├── actions/          # Server actions (mutations)
│   │   └── api/              # API routes
│   ├── components/           # Shared React components
│   │   └── ui/               # shadcn/ui primitives
│   ├── lib/                  # Utilities, schemas, helpers
│   ├── prisma/               # Prisma schema and migrations
│   └── types/                # TypeScript type augmentations
└── services/solver/
    ├── main.py               # FastAPI app + routes
    ├── solver.py             # OR-Tools CP-SAT logic
    └── models.py             # Pydantic request/response models
```

## Conventions

### TypeScript / Next.js

- **Components**: functional only, PascalCase filename (`PlanningCard.tsx`)
- **Other files**: kebab-case (`planning-detail.tsx`, `use-planning.ts`)
- **Variables/functions**: camelCase
- **Mutations**: server actions in `app/actions/`, never inline in components
- **Validation**: Zod schemas in `lib/schemas/`, shared between client and server
- **UI components**: use shadcn/ui primitives — run `pnpm shadcn add <component>` to add new ones
- **Icons**: `@remixicon/react` only

### Python

- **Style**: snake_case for everything
- **Models**: Pydantic v2 in `models.py`
- **Solver logic**: isolated in `solver.py`, no FastAPI imports

### API & Errors

- API routes follow REST: `/api/plannings`, `/api/plannings/[id]/constraints`
- Always return `{ error: string, details?: any }` on failure
- HTTP status codes: 400 bad input, 401 unauthenticated, 403 forbidden, 404 not found

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add employee CRUD
fix: correct session update after name change
chore: update dependencies
docs: add architecture diagram
```

## Database Changes

1. Edit `apps/web/prisma/schema.prisma`
2. Apply the migration:
   - **Interactive terminal**: `npx prisma migrate dev --name <description>`
   - **Non-interactive / quick dev**: `npx prisma db push` (no migration file created)
3. Commit both the schema and the generated migration file (when using `migrate dev`)

Never edit migration files manually after they've been applied.

## Adding a New Constraint Type

1. Add the type to the `ConstraintType` enum in `prisma/schema.prisma`
2. Add the Zod params schema in `lib/schemas/constraints.ts`
3. Implement the OR-Tools logic in `services/solver/solver.py`
4. Add the constraint to the UI builder (Phase 2)

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `AUTH_SECRET` | `apps/web` | NextAuth signing key |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | `apps/web` | Google OAuth |
| `DATABASE_URL` | `apps/web` | Pooled Prisma connection |
| `DIRECT_URL` | `apps/web` | Direct connection for migrations |
| `RESEND_API_KEY` / `RESEND_FROM` | `apps/web` | Magic link emails |
| `NEXT_PUBLIC_APP_URL` | `apps/web` | Base URL used in invite links (e.g. `http://localhost:3000`) |
| `INTERNAL_API_SECRET` | both | Shared secret between Next.js and solver |

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- Include a short description of what changed and why
- Make sure `pnpm build` passes before opening a PR
