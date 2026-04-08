# Khedra

**Smarter shifts, happier teams.**

Khedra is a SaaS for shift planning optimization. It uses constraint-based optimization (Google OR-Tools) to generate schedules automatically, and LLM features to let managers describe constraints in plain language.

## Features

- **Constraint-aware scheduling** — define rules like max hours, unavailability, rest periods, and skill requirements
- **Auto-generated schedules** — OR-Tools CP-SAT solver finds the optimal assignment in seconds
- **Natural language constraints** — describe rules in plain English, Khedra translates them into structured constraints
- **Team management** — multi-team support with role-based access (admin, manager, viewer)
- **Invite links** — admins share a single-use URL to onboard new team members
- **Employee linking** — team members can be linked to their employee profile to view their own schedule
- **Magic link auth** — passwordless sign-in via email, plus Google OAuth

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, React 19 |
| UI | shadcn/ui, Tailwind CSS v4 |
| Auth | NextAuth.js v5 (magic link + Google OAuth) |
| Database | PostgreSQL (Supabase), Prisma ORM |
| Solver | Python, FastAPI, Google OR-Tools (CP-SAT) |
| LLM | Anthropic Claude API via Vercel AI SDK |
| Deployment | Vercel (web), Railway/Fly.io (solver) |

## Monorepo Structure

```
khedra/
├── apps/web/          # Next.js app — frontend + API routes
├── services/solver/   # Python FastAPI — OR-Tools solver microservice
└── packages/shared/   # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Python 3.11+
- PostgreSQL database (Supabase recommended)

### 1. Clone and install

```bash
git clone https://github.com/EvannDev/khedra.git
cd khedra
pnpm install
```

### 2. Configure environment

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in the required values in `apps/web/.env.local`:

```env
AUTH_SECRET=              # openssl rand -base64 32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
DATABASE_URL=
DIRECT_URL=
RESEND_API_KEY=
RESEND_FROM=
INTERNAL_API_SECRET=      # openssl rand -hex 32
NEXT_PUBLIC_APP_URL=      # e.g. http://localhost:3000
```

### 3. Set up the database

```bash
cd apps/web
pnpm prisma migrate dev
```

### 4. Set up the solver

```bash
cd services/solver
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Set INTERNAL_API_SECRET to match apps/web/.env.local
```

### 5. Run everything

```bash
# From root — starts both web and solver
pnpm dev
```

Or individually:

```bash
# Web app (http://localhost:3000)
cd apps/web && pnpm dev

# Solver (http://localhost:8000)
cd services/solver && source .venv/bin/activate && uvicorn main:app --reload --port 8000
```

## License

MIT
