# Architecture

## Overview

Khedra is split into two independent services that communicate over HTTP:

```
Browser
  │
  ▼
┌─────────────────────────────┐
│   Next.js (apps/web)        │  Vercel
│   - UI + API routes         │
│   - Auth (NextAuth v5)      │
│   - Prisma → PostgreSQL     │
└──────────────┬──────────────┘
               │ POST /solve
               │ X-Internal-Token: <secret>
               ▼
┌─────────────────────────────┐
│   FastAPI (services/solver) │  Railway / Fly.io
│   - OR-Tools CP-SAT solver  │
│   - JSON in, JSON out       │
└─────────────────────────────┘
               │
               ▼
         PostgreSQL
         (Supabase)
```

The Next.js app is the only entry point for users. It owns the database. The solver is a stateless black box — it receives a constraint problem as JSON and returns a solution as JSON.

---

## Services

### `apps/web` — Next.js App

The main application. Handles everything user-facing:

- **Pages** — App Router (`app/`) with server and client components
- **API routes** — under `app/api/`, currently only NextAuth
- **Server actions** — under `app/actions/`, used for mutations
- **Auth** — NextAuth v5 with JWT sessions, magic link (Resend) + Google OAuth
- **Database** — Prisma ORM connected to PostgreSQL via `lib/prisma.ts`
- **Solver client** — calls the solver service with a shared secret header (Phase 3)

### `services/solver` — FastAPI Solver

A stateless microservice that solves constraint satisfaction problems using Google OR-Tools CP-SAT.

- Accepts a `SolveRequest` JSON payload
- Returns a `SolveResponse` with the optimal shift assignments
- Protected by `X-Internal-Token` header (shared secret with Next.js)
- No database access — all data is passed in the request

---

## Data Model

```
User ──< TeamMember >── Team
                         │
                    ┌────┴─────┐
                    │          │
                 Employee   Planning ──< Constraint
                    │          │
                    └────┬─────┘
                         │
                      Solution ──< Assignment
                                       │
                                   ShiftType
```

### Core entities

| Entity | Key fields |
|--------|-----------|
| `User` | id, email, name, role (admin/manager/viewer) |
| `Team` | id, name |
| `TeamMember` | userId, teamId, role |
| `Employee` | id, name, role, skills[], teamId |
| `ShiftType` | id, name, startTime, endTime, color |
| `Planning` | id, name, startDate, endDate, status |
| `Constraint` | id, type, params (JSON), scope, source (manual/llm) |
| `Solution` | id, score, status |
| `Assignment` | employeeId, date, shiftTypeId |

---

## Auth Flow

```
1. User enters email → NextAuth sends magic link via Resend
   OR
1. User clicks "Continue with Google" → OAuth redirect

2. On callback → NextAuth creates/updates User in DB via PrismaAdapter
3. JWT issued with { id, name, email, image }
4. Middleware protects /dashboard/* routes
```

Session data is stored in a signed JWT cookie (not database sessions). The `id` field is added via a custom `jwt` callback.

---

## Constraint System (Phase 2)

Constraints are stored as typed JSON in the `Constraint` table:

```ts
type ConstraintType =
  | "max_hours_per_week"       // { max: 35 }
  | "unavailability"           // { employee_id, days: ["monday"] }
  | "min_rest_between_shifts"  // { hours: 11 }
  | "max_consecutive_days"     // { max: 5 }
  | "required_skill"           // { shift_type_id, skill: "manager" }
  | "weekend_fairness"         // { max_weekends_per_month: 2 }
  | "shift_preference"         // { employee_id, shift_type_id, weight: "preferred" }
  | "min_employees_per_shift"  // { shift_type_id, min: 2 }
```

Constraints can be created manually (UI) or via LLM (Phase 4). LLM-sourced constraints are validated before being stored.

---

## Solver Integration (Phase 3)

The Next.js app sends a solve job to the FastAPI solver:

```
POST http://solver-host/solve
X-Internal-Token: <INTERNAL_API_SECRET>
Content-Type: application/json

{
  "planning_id": "...",
  "employees": [...],
  "shift_types": [...],
  "constraints": [...],
  "date_range": { "start": "2024-01-01", "end": "2024-01-07" }
}
```

The solver returns:

```json
{
  "status": "optimal",
  "score": 0.95,
  "assignments": [
    { "employee_id": "...", "date": "2024-01-01", "shift_type_id": "..." }
  ]
}
```

The Next.js app then persists the assignments to the database.

---

## LLM Integration (Phase 4)

Natural language constraints flow through a translate → validate → store pipeline:

```
User input: "Alice can't work Mondays"
     │
     ▼
Claude API (translator)
     │
     ▼
{ type: "unavailability", params: { employee_id: "alice-id", days: ["monday"] } }
     │
     ▼
Zod schema validation
     │
     ▼
Constraint stored in DB (source: "llm")
     │
     ▼
Included in next solve job
```

The LLM is a translator only — it never makes scheduling decisions directly.

---

## Security Model

- All user-facing mutations go through authenticated server actions (`auth()` check + Prisma)
- The solver is not publicly accessible — protected by a shared secret (`INTERNAL_API_SECRET`)
- LLM output is always validated with Zod before touching the database or solver
- No raw SQL — all queries use Prisma's parameterized query builder
