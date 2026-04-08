"use client"

import { useRouter } from "next/navigation"
import { linkMemberToEmployee } from "@/app/actions/teams"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LinkEmployeeSelectProps {
  teamId: string
  memberUserId: string
  currentEmployeeId: string | null
  unlinkedEmployees: { id: string; name: string }[]
}

export function LinkEmployeeSelect({
  teamId,
  memberUserId,
  currentEmployeeId,
  unlinkedEmployees,
}: LinkEmployeeSelectProps) {
  const router = useRouter()

  async function handleChange(value: string) {
    await linkMemberToEmployee(teamId, memberUserId, value === "none" ? null : value)
    router.refresh()
  }

  return (
    <Select defaultValue={currentEmployeeId ?? "none"} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-40 text-xs">
        <SelectValue placeholder="Link employee" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {unlinkedEmployees.map((e) => (
          <SelectItem key={e.id} value={e.id}>
            {e.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
