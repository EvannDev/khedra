"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteConstraint, toggleConstraint } from "@/app/actions/constraints"
import { ConstraintForm } from "./constraint-form"
import { CONSTRAINT_TYPE_LABELS, formatConstraintParams } from "@/lib/constraint-utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  RiAddLine,
  RiDeleteBinLine,
  RiMoreLine,
  RiSettings4Line,
  RiToggleLine,
  RiToggleFill,
} from "@remixicon/react"
import type { ConstraintModel } from "@/lib/generated/prisma/models/Constraint"
import type { ConstraintType } from "@/lib/generated/prisma/enums"

interface ConstraintListProps {
  teamId: string
  planningId: string
  constraints: ConstraintModel[]
  employees: { id: string; name: string }[]
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Constraints</h2>
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
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-20 text-center">Enabled</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {constraints.map((constraint) => (
                <TableRow key={constraint.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {CONSTRAINT_TYPE_LABELS[constraint.type as ConstraintType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatConstraintParams(
                      constraint.type as ConstraintType,
                      constraint.params as Record<string, unknown>,
                      employees,
                      shiftTypes
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={constraint.enabled}
                      onCheckedChange={() => handleToggle(constraint.id, constraint.enabled)}
                      disabled={togglingId === constraint.id}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={deletingId === constraint.id}
                        >
                          <RiMoreLine className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggle(constraint.id, constraint.enabled)}
                          disabled={togglingId === constraint.id}
                        >
                          {constraint.enabled ? (
                            <>
                              <RiToggleFill className="size-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <RiToggleLine className="size-4" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(constraint.id)}
                        >
                          <RiDeleteBinLine className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add constraint dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
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

      {/* Delete confirmation alert dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
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
