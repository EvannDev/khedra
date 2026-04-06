# Khedra — Claude Code Instructions

## What is this project?

Khedra is a SaaS for shift planning optimization. It uses constraint-based optimization (Google OR-Tools) to generate schedules, and LLM features to let users describe constraints in natural language.

## Monorepo Structure

```
khedra/
├── apps/web/          # Next.js 14+ (App Router) — main frontend + API
├── services/solver/   # Python FastAPI — OR-Tools solver microservice
└── packages/shared/   # Shared TypeScript types
```

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, React
- **UI**: ShadCN/UI (New York style, Neutral color), Tailwind CSS
- **State**: Zustand
- **Auth**: NextAuth.js (email/password + Google OAuth)
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase or Neon)
- **Solver**: Python, FastAPI, Google OR-Tools (CP-SAT)
- **LLM**: Anthropic Claude API via Vercel AI SDK
- **Job Queue**: BullMQ + Redis (Phase 5+ only, not MVP)
- **Deployment**: Vercel (web), Railway or Fly.io (solver), Supabase (DB)

## Coding Conventions

- **Language**: TypeScript for frontend/API, Python for solver
- **Components**: Functional only, no class components
- **Naming JS/TS**: camelCase for variables/functions, PascalCase for components
- **Naming Python**: snake_case
- **Files**: kebab-case (e.g. `planning-detail.tsx`)
- **Components**: PascalCase (e.g. `ConstraintBuilder.tsx`)
- **API routes**: RESTful (`/api/plannings`, `/api/plannings/[id]/constraints`)
- **Errors**: Always return `{ error: string, details?: any }`
- **Commits**: Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)

## Key Architecture Rules

- The solver is a **black box**: JSON in, JSON out. The frontend never calls the solver directly.
- The LLM is a **translator**, not the decision-maker: natural language → structured constraint JSON → validated → stored → sent to solver.
- Always validate LLM output before it touches the solver.
- Job queue (BullMQ + Redis) is deferred until Phase 5 (30+ employees threshold).

## Data Model (Core Entities)

- **User**: id, email, name, role (admin | manager | viewer)
- **Team**: id, name → has many Users, Plannings
- **Planning**: id, name, start_date, end_date, status (draft | solving | solved | failed)
- **Employee**: id, name, role, skills (tags), team_id
- **ShiftType**: id, name, start_time, end_time, color
- **Constraint**: id, type (enum), params (JSON), scope (all | team | employee), enabled, source (manual | llm)
- **Solution**: id, created_at, score, status → has many Assignments
- **Assignment**: employee_id, date, shift_type_id

## Constraint Types (MVP)

1. `max_hours_per_week` — `{ max: 35 }`
2. `unavailability` — `{ employee_id, days: ["monday"] }`
3. `min_rest_between_shifts` — `{ hours: 11 }`
4. `max_consecutive_days` — `{ max: 5 }`
5. `required_skill` — `{ shift_type_id, skill: "manager" }`
6. `weekend_fairness` — `{ max_weekends_per_month: 2 }`
7. `shift_preference` — `{ employee_id, shift_type_id, weight: "preferred" }`
8. `min_employees_per_shift` — `{ shift_type_id, min: 2 }`

## MVP Phases

| Phase | Focus |
|-------|-------|
| 0 | Foundation: monorepo, auth, deploy pipeline, DB setup ← **current** |
| 1 | Core Data Model: Planning, Employee, Shift CRUD |
| 2 | Constraint System: schema, builder UI, validation |
| 3 | OR-Tools Solver Integration |
| 4 | LLM Constraint Creation |
| 5 | Polish & Launch: job queue, exports, error handling |

## Dev Commands

```bash
# From root — start everything
pnpm dev

# From apps/web only
cd apps/web && pnpm dev

# From services/solver only
cd services/solver && source .venv/bin/activate && uvicorn main:app --reload --port 8000
```

## Current Status

- Phase 0 in progress
- Monorepo initialized (Turborepo + pnpm)
- Next.js + ShadCN configured
- FastAPI solver skeleton created
- Auth + DB not yet set up