"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteConstraint, toggleConstraint } from "@/app/actions/constraints"
import { ConstraintForm, ConstraintParamsStep } from "./constraint-form"
import {
  CONSTRAINT_TYPE_COLORS,
  CONSTRAINT_TYPE_LABELS,
  CONSTRAINT_TYPE_BORDER,
  DEPRECATED_CONSTRAINT_TYPES,
  CONSTRAINT_CATEGORIES,
  formatConstraintParams,
} from "@/lib/constraint-utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiSettings4Line,
  RiArrowDownSLine,
} from "@remixicon/react"
import type { ConstraintModel } from "@/lib/generated/prisma/models/Constraint"
import type { ConstraintType } from "@/lib/generated/prisma/enums"

interface ConstraintListProps {
  teamId: string
  planningId: string | null
  constraints: ConstraintModel[]
  employees: { id: string; name: string; skills: string[] }[]
  shiftTypes: { id: string; name: string }[]
}


export function ConstraintList({
  teamId,
  planningId,
  constraints,
  employees,
  shiftTypes,
}: ConstraintListProps) {
  const router = useRouter()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<{
    id: string
    type: ConstraintType
    params: Record<string, unknown>
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleToggle(constraintId: string, currentEnabled: boolean) {
    setTogglingId(constraintId)
    await toggleConstraint(teamId, planningId, constraintId, !currentEnabled)
    router.refresh()
    setTogglingId(null)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeletingId(deleteTarget)
    setDeleteTarget(null)
    await deleteConstraint(teamId, planningId, deleteTarget)
    router.refresh()
    setDeletingId(null)
  }

  // Single-pass grouping: bucket each constraint into its category
  const buckets = new Map<string, ConstraintModel[]>()
  const knownTypes = new Set(CONSTRAINT_CATEGORIES.flatMap((c) => c.types as string[]))
  for (const c of constraints) {
    const label = CONSTRAINT_CATEGORIES.find((cat) => (cat.types as string[]).includes(c.type))?.label ?? "Other"
    const bucket = buckets.get(label) ?? []
    bucket.push(c)
    buckets.set(label, bucket)
  }
  const grouped = [
    ...CONSTRAINT_CATEGORIES.filter((cat) => buckets.has(cat.label)).map((cat) => ({
      label: cat.label,
      items: buckets.get(cat.label)!,
    })),
    ...(constraints.some((c) => !knownTypes.has(c.type))
      ? [{ label: "Other", items: buckets.get("Other")! }]
      : []),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 rounded-full bg-border" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Constraints
          </h2>
          {constraints.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {constraints.filter((c) => c.enabled).length}/{constraints.length}
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <RiAddLine className="size-4" />
          Add constraint
        </Button>
      </div>

      {constraints.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <RiSettings4Line className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No constraints yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add constraints to define rules for this planning.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {grouped.map((group) => (
            <ConstraintGroup
              key={group.label}
              label={group.label}
              items={group.items}
              employees={employees}
              shiftTypes={shiftTypes}
              togglingId={togglingId}
              deletingId={deletingId}
              onToggle={handleToggle}
              onEdit={(c) =>
                setEditTarget({
                  id: c.id,
                  type: c.type as ConstraintType,
                  params: c.params as Record<string, unknown>,
                })
              }
              onDelete={(id) => setDeleteTarget(id)}
            />
          ))}
        </div>
      )}

      {/* Add constraint dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add constraint</DialogTitle>
          </DialogHeader>
          <ConstraintForm
            teamId={teamId}
            planningId={planningId}
            employees={employees}
            shiftTypes={shiftTypes}
            onSuccess={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit constraint dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit constraint</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <ConstraintParamsStep
              key={editTarget.id}
              type={editTarget.type}
              teamId={teamId}
              planningId={planningId}
              employees={employees}
              shiftTypes={shiftTypes}
              constraintId={editTarget.id}
              initialParams={editTarget.params}
              onSuccess={() => setEditTarget(null)}
              onBack={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete constraint?</AlertDialogTitle>
            <AlertDialogDescription>
              This constraint will be permanently removed from the planning.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface ConstraintGroupProps {
  label: string
  items: ConstraintModel[]
  employees: { id: string; name: string; skills: string[] }[]
  shiftTypes: { id: string; name: string }[]
  togglingId: string | null
  deletingId: string | null
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (c: ConstraintModel) => void
  onDelete: (id: string) => void
}

function ConstraintGroup({
  label,
  items,
  employees,
  shiftTypes,
  togglingId,
  deletingId,
  onToggle,
  onEdit,
  onDelete,
}: ConstraintGroupProps) {
  const [open, setOpen] = useState(true)
  const activeCount = items.filter((c) => c.enabled).length

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted/50 transition-colors group">
          <RiArrowDownSLine
            className={cn(
              "size-3.5 text-muted-foreground/60 transition-transform duration-200 shrink-0",
              !open && "-rotate-90"
            )}
          />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex-1">
            {label}
          </span>
          <span className="text-[10px] tabular-nums text-muted-foreground/60 font-medium">
            {activeCount}/{items.length}
          </span>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="ml-2 mt-0.5 rounded-lg border border-border overflow-hidden divide-y divide-border">
          {items.map((constraint) => (
            <ConstraintRow
              key={constraint.id}
              constraint={constraint}
              employees={employees}
              shiftTypes={shiftTypes}
              toggling={togglingId === constraint.id}
              deleting={deletingId === constraint.id}
              onToggle={() => onToggle(constraint.id, constraint.enabled)}
              onEdit={() => onEdit(constraint)}
              onDelete={() => onDelete(constraint.id)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface ConstraintRowProps {
  constraint: ConstraintModel
  employees: { id: string; name: string; skills: string[] }[]
  shiftTypes: { id: string; name: string }[]
  toggling: boolean
  deleting: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

function ConstraintRow({
  constraint,
  employees,
  shiftTypes,
  toggling,
  deleting,
  onToggle,
  onEdit,
  onDelete,
}: ConstraintRowProps) {
  const type = constraint.type as ConstraintType
  const isDeprecated = DEPRECATED_CONSTRAINT_TYPES.has(type)
  const description = formatConstraintParams(
    type,
    constraint.params as Record<string, unknown>,
    employees,
    shiftTypes
  )

  return (
    <div
      className={cn(
        "group flex items-center gap-2.5 pl-3 pr-2 py-2 border-l-2 transition-opacity",
        !constraint.enabled && "opacity-40",
        CONSTRAINT_TYPE_BORDER[type]
      )}
    >
      <Badge
        className={cn(
          "text-[10px] h-5 px-1.5 shrink-0 font-medium leading-none",
          CONSTRAINT_TYPE_COLORS[type]
        )}
      >
        {CONSTRAINT_TYPE_LABELS[type]}
      </Badge>

      <p className="flex-1 min-w-0 text-xs text-muted-foreground truncate">
        {description}
      </p>

      {isDeprecated && (
        <span className="text-[10px] font-medium text-muted-foreground/60 border border-border rounded px-1 py-px leading-none shrink-0 hidden group-hover:inline-flex">
          deprecated
        </span>
      )}

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={onEdit}
              disabled={deleting}
            >
              <RiEditLine className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Edit</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
              disabled={deleting}
            >
              <RiDeleteBinLine className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Delete</TooltipContent>
        </Tooltip>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Switch
            checked={constraint.enabled}
            onCheckedChange={onToggle}
            disabled={toggling}
            className="shrink-0 scale-[0.8] origin-right"
          />
        </TooltipTrigger>
        <TooltipContent side="top">
          {constraint.enabled ? "Disable" : "Enable"}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
