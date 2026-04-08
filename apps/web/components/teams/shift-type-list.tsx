"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteShiftType } from "@/app/actions/shift-types"
import { ShiftTypeForm } from "./shift-type-form"
import { Button } from "@/components/ui/button"
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
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiTimeLine } from "@remixicon/react"
import type { ShiftTypeModel } from "@/lib/generated/prisma/models/ShiftType"

interface ShiftTypeListProps {
  teamId: string
  shiftTypes: ShiftTypeModel[]
}

export function ShiftTypeList({ teamId, shiftTypes }: ShiftTypeListProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ShiftTypeModel | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openCreate() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(shiftType: ShiftTypeModel) {
    setEditing(shiftType)
    setDialogOpen(true)
  }

  async function handleDelete(shiftTypeId: string) {
    if (!confirm("Delete this shift type?")) return
    setDeletingId(shiftTypeId)
    await deleteShiftType(teamId, shiftTypeId)
    router.refresh()
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Shift types</h2>
        <Button size="sm" onClick={openCreate}>
          <RiAddLine className="size-4" />
          Add shift type
        </Button>
      </div>

      {shiftTypes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <RiTimeLine className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No shift types yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Define the types of shifts your team works.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shiftTypes.map((shiftType) => (
                <TableRow key={shiftType.id}>
                  <TableCell className="font-medium">{shiftType.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {shiftType.startTime}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {shiftType.endTime}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-5 rounded-full border border-border/50 shrink-0"
                        style={{ backgroundColor: shiftType.color }}
                      />
                      <span className="font-mono text-xs text-muted-foreground">
                        {shiftType.color}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(shiftType)}
                      >
                        <RiEditLine className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        disabled={deletingId === shiftType.id}
                        onClick={() => handleDelete(shiftType.id)}
                      >
                        <RiDeleteBinLine className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit shift type" : "Add shift type"}</DialogTitle>
          </DialogHeader>
          <ShiftTypeForm
            teamId={teamId}
            shiftType={editing}
            onSuccess={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
