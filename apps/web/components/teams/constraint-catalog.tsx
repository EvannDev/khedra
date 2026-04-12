"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  CONSTRAINT_TYPE_COLORS,
  CONSTRAINT_TYPE_LABELS,
  CONSTRAINT_TYPE_BORDER,
  DEPRECATED_CONSTRAINT_TYPES,
  CONSTRAINT_CATEGORIES,
} from "@/lib/constraint-utils"
import { cn } from "@/lib/utils"
import { RiSearchLine } from "@remixicon/react"
import type { ConstraintType } from "@/lib/generated/prisma/enums"

interface ConstraintCatalogProps {
  onSelect: (type: ConstraintType) => void
}


const CONSTRAINT_DESCRIPTIONS: Record<ConstraintType, string> = {
  max_hours_per_week: "Cap total hours an employee can work in a single week.",
  max_hours_per_month: "Cap total hours an employee can work across a full calendar month.",
  unavailability: "Block an employee from being scheduled on specific weekdays.",
  min_rest_between_shifts: "Guarantee a minimum rest period between back-to-back shifts.",
  max_consecutive_days: "Prevent employees from working more than N days in a row.",
  required_skill: "Restrict a shift type to employees who hold a specific skill.",
  weekend_fairness: "Limit how many weekend days per month an employee is scheduled.",
  shift_preference: "Express an employee's preference or aversion for a shift type.",
  shift_coverage: "Set minimum and/or maximum staffing levels for a shift each day.",
  holiday: "Block scheduling on public holidays or grant personal time off.",
  no_shift_alternation: "Discourage switching between different shift types on consecutive days.",
  min_consecutive_days: "Require a minimum block length before an employee takes a day off.",
  max_days_per_week: "Limit working days in a Monday–Sunday calendar week.",
  min_days_between_shifts: "Enforce a minimum number of days off between any two shifts.",
  day_pairing: "Link weekdays so they are always worked together or not at all.",
  max_shifts_per_day: "Allow employees to work more than one shift in a single day.",
  no_consecutive_weekends: "Prevent an employee (or everyone) from working two weekends in a row.",
  // deprecated — never rendered
  min_employees_per_shift: "",
  max_employees_per_shift: "",
  preferred_consecutive_days: "",
}

export function ConstraintCatalog({ onSelect }: ConstraintCatalogProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const q = search.toLowerCase().trim()

  const visibleTypes = CONSTRAINT_CATEGORIES
    .filter((cat) => !activeCategory || cat.id === activeCategory)
    .flatMap((cat) => cat.types)
    .filter((type) => !DEPRECATED_CONSTRAINT_TYPES.has(type))
    .filter((type) => {
      if (!q) return true
      return (
        CONSTRAINT_TYPE_LABELS[type].toLowerCase().includes(q) ||
        CONSTRAINT_DESCRIPTIONS[type].toLowerCase().includes(q)
      )
    })

  // When searching across categories, show flat list; otherwise group by category
  const showGrouped = !q && !activeCategory

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search constraints…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
            activeCategory === null
              ? "bg-foreground text-background border-foreground"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          All
        </button>
        {CONSTRAINT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              activeCategory === cat.id
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Card grid */}
      {visibleTypes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No constraints match your search.</p>
      ) : showGrouped ? (
        <div className="flex flex-col gap-4">
          {CONSTRAINT_CATEGORIES.map((cat) => {
            const catTypes = cat.types.filter((t) => !DEPRECATED_CONSTRAINT_TYPES.has(t))
            if (catTypes.length === 0) return null
            return (
              <div key={cat.id} className="flex flex-col gap-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
                  {cat.label}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {catTypes.map((type) => (
                    <ConstraintCard key={type} type={type} onClick={() => onSelect(type)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {visibleTypes.map((type) => (
            <ConstraintCard key={type} type={type} onClick={() => onSelect(type)} />
          ))}
        </div>
      )}
    </div>
  )
}

function ConstraintCard({ type, onClick }: { type: ConstraintType; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border border-border border-l-2 p-3 text-left",
        "transition-all hover:bg-accent/60 hover:shadow-sm cursor-pointer",
        CONSTRAINT_TYPE_BORDER[type]
      )}
    >
      <Badge className={cn("text-[11px] h-5 pointer-events-none", CONSTRAINT_TYPE_COLORS[type])}>
        {CONSTRAINT_TYPE_LABELS[type]}
      </Badge>
      <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
        {CONSTRAINT_DESCRIPTIONS[type]}
      </p>
    </button>
  )
}
