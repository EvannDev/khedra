"use client"

import Link from "next/link"
import { CONSTRAINT_TYPE_COLORS, CONSTRAINT_TYPE_LABELS, formatConstraintParams } from "@/lib/constraint-utils"
import { cn } from "@/lib/utils"
import type { ConstraintType } from "@/lib/generated/prisma/enums"

interface TeamConstraint {
  id: string
  type: string
  params: unknown
  enabled: boolean
}

interface TeamConstraintSectionProps {
  teamId: string
  constraints: TeamConstraint[]
  employees: { id: string; name: string }[]
  shiftTypes: { id: string; name: string }[]
}

export function TeamConstraintSection({
  teamId,
  constraints,
  employees,
  shiftTypes,
}: TeamConstraintSectionProps) {
  const enabled = constraints.filter((c) => c.enabled)

  return (
    <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-medium text-foreground">Team constraints</p>
        <Link
          href={`/dashboard/teams/${teamId}/constraints`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Manage →
        </Link>
      </div>
      {enabled.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No team-level constraints.{" "}
          <Link
            href={`/dashboard/teams/${teamId}/constraints`}
            className="underline hover:text-foreground transition-colors"
          >
            Add one
          </Link>{" "}
          to apply rules across all plannings.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {enabled.map((c) => {
            const type = c.type as ConstraintType
            const label = formatConstraintParams(
              type,
              c.params as Record<string, unknown>,
              employees,
              shiftTypes
            )
            return (
              <span
                key={c.id}
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                  CONSTRAINT_TYPE_COLORS[type]
                )}
                title={CONSTRAINT_TYPE_LABELS[type]}
              >
                {label}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
