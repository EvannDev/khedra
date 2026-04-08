"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { deletePlanning } from "@/app/actions/plannings"
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
import { RiAddLine, RiDeleteBinLine, RiCalendarLine } from "@remixicon/react"
import type { PlanningModel } from "@/lib/generated/prisma/models/Planning"
import { planningStatusVariant } from "@/lib/planning-utils"

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface PlanningListProps {
  teamId: string
  plannings: PlanningModel[]
}

export function PlanningList({ teamId, plannings }: PlanningListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(planningId: string) {
    if (!confirm("Delete this planning?")) return
    setDeletingId(planningId)
    await deletePlanning(teamId, planningId)
    router.refresh()
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Plannings</h2>
        <Button size="sm" asChild>
          <Link href={`/dashboard/teams/${teamId}/plannings/new`}>
            <RiAddLine className="size-4" />
            New planning
          </Link>
        </Button>
      </div>

      {plannings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <RiCalendarLine className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No plannings yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a planning to start building schedules.
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
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {plannings.map((planning) => (
                <TableRow key={planning.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/teams/${teamId}/plannings/${planning.id}`}
                      className="hover:underline"
                    >
                      {planning.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(planning.startDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(planning.endDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={planningStatusVariant[planning.status] ?? "secondary"}>
                      {planning.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(planning.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 ml-auto text-destructive hover:text-destructive"
                      disabled={deletingId === planning.id}
                      onClick={() => handleDelete(planning.id)}
                    >
                      <RiDeleteBinLine className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
