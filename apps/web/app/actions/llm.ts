"use server"

import Anthropic from "@anthropic-ai/sdk"
import { auth } from "@/auth"
import { requireTeamMember } from "@/lib/auth-utils"
import { constraintSchema } from "@/lib/schemas/constraint"
import { CONSTRAINT_TYPE_LABELS, formatConstraintParams } from "@/lib/constraint-utils"
import type { ConstraintType } from "@/lib/generated/prisma/enums"
import { redirect } from "next/navigation"

function isLlmEnabled() {
  return process.env.NEXT_PUBLIC_LLM_ENABLED === "true"
}

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set")
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

interface TranslateContext {
  employees: { id: string; name: string }[]
  shiftTypes: { id: string; name: string }[]
}

export type TranslateResult =
  | { constraint: { type: string; params: Record<string, unknown> } }
  | { clarification: string }
  | { error: string }

export async function translateConstraint(
  teamId: string,
  input: string,
  context: TranslateContext
): Promise<TranslateResult> {
  if (!isLlmEnabled()) return { error: "AI features are not enabled." }
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  const { employees, shiftTypes } = context

  const systemPrompt = `You are a scheduling constraint translator for a shift-planning app.
Your job is to convert natural language descriptions into structured scheduling constraints.

## Available employees
${employees.length > 0 ? employees.map((e) => `- id: "${e.id}", name: "${e.name}"`).join("\n") : "No employees yet."}

## Available shift types
${shiftTypes.length > 0 ? shiftTypes.map((s) => `- id: "${s.id}", name: "${s.name}"`).join("\n") : "No shift types yet."}

## Constraint types and their exact param shapes

\`\`\`
max_hours_per_week      { max: number }                    — cap total hours per week
max_hours_per_month     { max: number, employee_id?: string } — cap total hours per month
max_days_per_week       { max: number, mode: "hard"|"soft" } — cap working days per week
max_shifts_per_day      { max: number, employee_id?: string } — allow multiple shifts per day
max_consecutive_days    { max: number, mode: "hard"|"soft" } — max days worked in a row
min_consecutive_days    { min: number, mode: "hard"|"soft" } — min block length before day off
min_rest_between_shifts { hours: number }                  — minimum rest between shifts
min_days_between_shifts { days: number, consecutive?: number, mode: "hard"|"soft" } — days off between shifts
unavailability          { employee_id: string, days: string[] } — block employee on weekdays
holiday                 { dates: string[], name?: string, employee_id?: string } — block specific dates
weekend_fairness        { max_weekends_per_month: number } — limit weekend days per employee/month
shift_coverage          { shift_type_id: string, min?: number, max?: number, mode: "hard"|"soft" } — staffing levels
required_skill          { shift_type_id: string, skill: string } — restrict shift to skilled employees
shift_preference        { employee_id: string, shift_type_id: string, weight: "preferred"|"avoid", mode: "hard"|"soft" }
day_pairing             { days: string[], mode: "hard"|"soft" } — linked days (all or none worked)
no_shift_alternation    { penalty: number (1–10) }         — discourage switching shift types day to day
no_consecutive_weekends { employee_id?: string }            — prevent working two weekends in a row
\`\`\`

## Rules
- Days use 3-char lowercase abbreviations: "mon" "tue" "wed" "thu" "fri" "sat" "sun"
- Dates use ISO format: "YYYY-MM-DD"
- When the user mentions an employee by name, match to the closest employee id from the list above
- When the user says "everyone" or doesn't mention a specific employee, omit employee_id
- For holiday/unavailability without employee: it applies to all (omit employee_id)
- Use "hard" mode by default unless the user says "prefer", "try to", "ideally", "if possible"
- If the input is ambiguous (e.g. employee name matches multiple people, or no shift type can be inferred), call ask_clarification instead`

  try {
    const anthropic = getAnthropicClient()
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      tools: [
        {
          name: "create_constraint",
          description: "Output a structured constraint object",
          input_schema: {
            type: "object" as const,
            properties: {
              type: { type: "string" },
              params: { type: "object" },
            },
            required: ["type", "params"],
          },
        },
        {
          name: "ask_clarification",
          description: "Ask the user a clarifying question when the request is ambiguous",
          input_schema: {
            type: "object" as const,
            properties: {
              question: { type: "string" },
            },
            required: ["question"],
          },
        },
      ],
      messages: [{ role: "user", content: input }],
    })

    const toolUse = response.content.find((b) => b.type === "tool_use")
    if (!toolUse || toolUse.type !== "tool_use") {
      return { error: "Could not interpret this constraint. Try rephrasing or add it manually." }
    }

    if (toolUse.name === "ask_clarification") {
      const q = (toolUse.input as { question: string }).question
      return { clarification: q }
    }

    if (toolUse.name === "create_constraint") {
      const raw = toolUse.input as { type: string; params: Record<string, unknown> }
      const parsed = constraintSchema.safeParse(raw)
      if (!parsed.success) {
        const issue = parsed.error.issues[0]?.message ?? "Invalid constraint structure"
        return { error: `Generated constraint is invalid: ${issue}. Try rephrasing.` }
      }
      return { constraint: { type: parsed.data.type, params: parsed.data.params as Record<string, unknown> } }
    }

    return { error: "Unexpected response. Try rephrasing or add the constraint manually." }
  } catch {
    return { error: "Could not interpret this constraint. Try rephrasing or add it manually." }
  }
}

interface AnalyzeFailureContext {
  constraints: Array<{ type: string; params: Record<string, unknown>; enabled: boolean }>
  employees: Array<{ id: string; name: string }>
  shiftTypes: Array<{ id: string; name: string; startTime: Date; endTime: Date }>
  startDate: Date
  endDate: Date
}

export type AnalyzeFailureResult =
  | { analysis: { summary: string; suggestions: Array<{ title: string; description: string }> } }
  | { error: string }

export async function analyzeFailure(
  teamId: string,
  planningId: string,
  context: AnalyzeFailureContext
): Promise<AnalyzeFailureResult> {
  if (!isLlmEnabled()) return { error: "AI features are not enabled." }
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member) return { error: "Forbidden" }

  const { constraints, employees, shiftTypes, startDate, endDate } = context

  const enabledConstraints = constraints.filter((c) => c.enabled)
  const disabledCount = constraints.length - enabledConstraints.length

  const planningDays = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1

  const constraintLines =
    enabledConstraints.length === 0
      ? "No active constraints."
      : enabledConstraints
          .slice(0, 50)
          .map((c) => {
            const label = CONSTRAINT_TYPE_LABELS[c.type as ConstraintType] ?? c.type
            const detail = formatConstraintParams(
              c.type as ConstraintType,
              c.params,
              employees,
              shiftTypes
            )
            return `- [${label}] ${detail}`
          })
          .join("\n") +
        (enabledConstraints.length > 50
          ? `\n... and ${enabledConstraints.length - 50} more constraints (not shown)`
          : "")

  const shiftNames = shiftTypes.map((s) => s.name).join(", ") || "none"

  const systemPrompt = `You are a scheduling expert diagnosing why an OR-Tools CP-SAT solver failed to produce a valid schedule.

## Planning period
${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)} (${planningDays} days)

## Team
${employees.length} employee(s), ${shiftTypes.length} shift type(s): ${shiftNames}

## Active constraints (${enabledConstraints.length} enabled${disabledCount > 0 ? `, ${disabledCount} disabled` : ""})
${constraintLines}

## Common infeasibility patterns to reason about
- Availability gaps: unavailability or holiday constraints block all employees on certain days, making it impossible to staff required shifts
- Coverage impossible: shift_coverage minimum requirements exceed the number of available (non-blocked) employees on certain days
- Hours arithmetic: max_hours_per_week or max_hours_per_month caps combined with coverage minimums cannot both be satisfied
- Skill bottleneck: required_skill restricts a shift to a small subset of employees who are also blocked by unavailability
- Rest time conflict: min_rest_between_shifts combined with consecutive-day constraints leaves no feasible assignment
- Zero employees or shifts: the team has no employees or no shift types configured at all

Analyze the constraints above and identify the most likely root cause(s). Be specific — reference actual constraint values, employee names, and shift names where relevant. Keep the summary concise (2–4 sentences) and the suggestions concrete and actionable.`

  try {
    const anthropic = getAnthropicClient()
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      tools: [
        {
          name: "explain_failure",
          description: "Explain why the solver failed and provide actionable suggestions to fix it",
          input_schema: {
            type: "object" as const,
            properties: {
              summary: {
                type: "string",
                description: "2–4 sentence plain-English diagnosis of the most likely root cause(s)",
              },
              suggestions: {
                type: "array",
                description: "2–4 concrete, actionable suggestions to fix the schedule",
                items: {
                  type: "object" as const,
                  properties: {
                    title: { type: "string", description: "Short title under 60 characters" },
                    description: {
                      type: "string",
                      description:
                        "Specific instruction referencing actual constraint values or names",
                    },
                  },
                  required: ["title", "description"],
                },
                minItems: 1,
                maxItems: 4,
              },
            },
            required: ["summary", "suggestions"],
          },
        },
      ],
      messages: [{ role: "user", content: "Why did the solver fail? What should I fix?" }],
    })

    const toolUse = response.content.find((b) => b.type === "tool_use")
    if (!toolUse || toolUse.type !== "tool_use" || toolUse.name !== "explain_failure") {
      return { error: "Could not analyze the failure. Please review your constraints manually." }
    }

    const raw = toolUse.input as {
      summary: string
      suggestions: Array<{ title: string; description: string }>
    }
    if (!raw.summary || !Array.isArray(raw.suggestions)) {
      return { error: "Could not analyze the failure. Please review your constraints manually." }
    }

    return { analysis: { summary: raw.summary, suggestions: raw.suggestions } }
  } catch {
    return { error: "Analysis unavailable. Please review your constraints manually." }
  }
}
