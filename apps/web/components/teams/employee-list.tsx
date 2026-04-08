"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteEmployee } from "@/app/actions/employees"
import { EmployeeForm } from "./employee-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiUserLine } from "@remixicon/react"
import type { EmployeeModel } from "@/lib/generated/prisma/models/Employee"

interface EmployeeListProps {
  teamId: string
  employees: EmployeeModel[]
}

export function EmployeeList({ teamId, employees }: EmployeeListProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EmployeeModel | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openCreate() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(employee: EmployeeModel) {
    setEditing(employee)
    setDialogOpen(true)
  }

  async function handleDelete(employeeId: string) {
    if (!confirm("Delete this employee?")) return
    setDeletingId(employeeId)
    await deleteEmployee(teamId, employeeId)
    router.refresh()
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Employees</h2>
        <Button size="sm" onClick={openCreate}>
          <RiAddLine className="size-4" />
          Add employee
        </Button>
      </div>

      {employees.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <RiUserLine className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No employees yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add your first employee to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell className="text-muted-foreground">{employee.role}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {employee.skills.map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(employee)}
                      >
                        <RiEditLine className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        disabled={deletingId === employee.id}
                        onClick={() => handleDelete(employee.id)}
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
            <DialogTitle>{editing ? "Edit employee" : "Add employee"}</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            teamId={teamId}
            employee={editing}
            onSuccess={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
