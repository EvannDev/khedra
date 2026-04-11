import { config } from "dotenv"
config({ path: ".env.local" })

import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// ── CLI arg ────────────────────────────────────────────────────────────────
const emailArg = process.argv.find((a) => a.startsWith("--email="))?.slice(8)
  ?? process.argv[process.argv.indexOf("--email") + 1]

if (!emailArg) {
  console.error("Usage: pnpm prisma db seed -- --email your@email.com")
  process.exit(1)
}

// ── Helpers ────────────────────────────────────────────────────────────────
function dateUTC(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d))
}

// April 2026 has 30 days
function aprilDays(): Date[] {
  const days: Date[] = []
  for (let d = 1; d <= 30; d++) days.push(dateUTC(2026, 4, d))
  return days
}

// 0=Sun,1=Mon,...,6=Sat
function isWeekend(d: Date) {
  const dow = d.getUTCDay()
  return dow === 0 || dow === 6
}

async function main() {
  // ── Resolve user ──────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({ where: { email: emailArg } })
  if (!user) {
    console.error(`No user found for "${emailArg}". Sign in first, then re-run.`)
    process.exit(1)
  }
  console.log(`Seeding for ${user.email} (${user.id})`)

  // ── Wipe existing demo team (idempotent) ──────────────────────────────
  await prisma.team.deleteMany({ where: { name: "Khedra Demo Team" } })

  // ── Team ──────────────────────────────────────────────────────────────
  const team = await prisma.team.create({ data: { name: "Khedra Demo Team" } })

  // ── Team member (admin) ───────────────────────────────────────────────
  await prisma.teamMember.create({
    data: { userId: user.id, teamId: team.id, role: "admin" },
  })

  // ── Shift types ───────────────────────────────────────────────────────
  const [morning, afternoon, evening] = await Promise.all([
    prisma.shiftType.create({ data: { name: "Morning",   startTime: "07:00", endTime: "15:00", color: "#F0B429", teamId: team.id } }),
    prisma.shiftType.create({ data: { name: "Afternoon", startTime: "13:00", endTime: "21:00", color: "#2DD4BF", teamId: team.id } }),
    prisma.shiftType.create({ data: { name: "Evening",   startTime: "20:00", endTime: "04:00", color: "#A78BFA", teamId: team.id } }),
  ])

  // ── Employees (Alice linked to the calling user) ──────────────────────
  const [alice, bob, charlie, diana, emma] = await Promise.all([
    prisma.employee.create({ data: { name: "Alice Martin",  role: "Barista",    skills: ["morning", "manager"], teamId: team.id, userId: user.id } }),
    prisma.employee.create({ data: { name: "Bob Chen",      role: "Barista",    skills: ["morning"],            teamId: team.id } }),
    prisma.employee.create({ data: { name: "Charlie Davis", role: "Shift Lead", skills: ["manager", "evening"], teamId: team.id } }),
    prisma.employee.create({ data: { name: "Diana Wilson",  role: "Barista",    skills: ["evening"],            teamId: team.id } }),
    prisma.employee.create({ data: { name: "Emma Brown",    role: "Part-time",  skills: ["morning", "evening"], teamId: team.id } }),
  ])

  // ── Planning ──────────────────────────────────────────────────────────
  const planning = await prisma.planning.create({
    data: {
      name: "April 2026",
      startDate: dateUTC(2026, 4, 1),
      endDate:   dateUTC(2026, 4, 30),
      status: "solved",
      teamId: team.id,
    },
  })

  // ── Constraints ───────────────────────────────────────────────────────
  await prisma.constraint.createMany({
    data: [
      { type: "max_hours_per_week",      params: { max: 35 },                                  scope: "all",      planningId: planning.id },
      { type: "min_rest_between_shifts", params: { hours: 11 },                               scope: "all",      planningId: planning.id },
      { type: "weekend_fairness",        params: { max_weekends_per_month: 2 },               scope: "all",      planningId: planning.id },
      { type: "unavailability",          params: { employee_id: bob.id, days: ["sat","sun"] }, scope: "employee", planningId: planning.id },
      { type: "min_employees_per_shift", params: { shift_type_id: morning.id, min: 2 },       scope: "all",      planningId: planning.id },
    ],
  })

  // ── Solution ──────────────────────────────────────────────────────────
  const solution = await prisma.solution.create({
    data: { planningId: planning.id, status: "complete", score: 87 },
  })

  // ── Assignments ───────────────────────────────────────────────────────
  // Strategy:
  //   - Each day: 2 employees on Morning, 2 on Afternoon
  //   - ~3× per week one Evening slot added (Wed, Fri, Sun)
  //   - Bob never works weekends
  //   - Rotate through employees with simple index arithmetic
  //   - Max 5 consecutive days enforced via a streak tracker

  const days = aprilDays()
  const allEmps = [alice, bob, charlie, diana, emma]
  const streaks: Record<string, number> = Object.fromEntries(allEmps.map((e) => [e.id, 0]))
  const assignments: Array<{ date: Date; employeeId: string; shiftTypeId: string; solutionId: string }> = []

  for (let di = 0; di < days.length; di++) {
    const day = days[di]
    const weekend = isWeekend(day)

    // Eligible pool: Bob excluded on weekends; skip employees at streak limit
    const eligible = allEmps.filter((e) => {
      if (e.id === bob.id && weekend) return false
      if (streaks[e.id] >= 5) return false
      return true
    })

    // Pick 4 workers for the day using offset rotation (2 morning, 2 afternoon)
    const picked: typeof allEmps = []
    let offset = di * 3
    for (let attempt = 0; picked.length < 4 && attempt < eligible.length * 2; attempt++) {
      const candidate = eligible[(offset + attempt) % eligible.length]
      if (!picked.find((p) => p.id === candidate.id)) picked.push(candidate)
    }

    const [m1, m2, a1, a2] = picked

    if (m1) assignments.push({ date: day, employeeId: m1.id, shiftTypeId: morning.id, solutionId: solution.id })
    if (m2) assignments.push({ date: day, employeeId: m2.id, shiftTypeId: morning.id, solutionId: solution.id })
    if (a1) assignments.push({ date: day, employeeId: a1.id, shiftTypeId: afternoon.id, solutionId: solution.id })
    if (a2) assignments.push({ date: day, employeeId: a2.id, shiftTypeId: afternoon.id, solutionId: solution.id })

    // Evening shift on Wed (3), Fri (5), Sun (0)
    const dow = day.getUTCDay()
    if (dow === 3 || dow === 5 || dow === 0) {
      const eveningEmp = [charlie, diana, emma].find(
        (e) => !picked.find((p) => p.id === e.id) && streaks[e.id] < 5
      )
      if (eveningEmp) {
        assignments.push({ date: day, employeeId: eveningEmp.id, shiftTypeId: evening.id, solutionId: solution.id })
        streaks[eveningEmp.id]++
      }
    }

    // Update streaks
    const workedToday = new Set(assignments.filter((a) => a.date === day).map((a) => a.employeeId))
    for (const e of allEmps) {
      if (workedToday.has(e.id)) {
        streaks[e.id]++
      } else {
        streaks[e.id] = 0
      }
    }
  }

  await prisma.assignment.createMany({ data: assignments, skipDuplicates: true })

  console.log(`✓ Team:       ${team.name}`)
  console.log(`✓ Employees:  ${allEmps.length} (Alice linked to your account)`)
  console.log(`✓ Shifts:     Morning / Afternoon / Evening`)
  console.log(`✓ Planning:   April 2026 (solved)`)
  console.log(`✓ Constraints: 5`)
  console.log(`✓ Assignments: ${assignments.length}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
