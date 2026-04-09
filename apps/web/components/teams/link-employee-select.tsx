"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { linkMemberToEmployee } from "@/app/actions/teams"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

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
  const initial = currentEmployeeId ?? "none"
  const [selected, setSelected] = useState(initial)
  const [saving, setSaving] = useState(false)

  // Sync if the server-side value changes (e.g. after another member's save triggers a refresh)
  useEffect(() => {
    setSelected(currentEmployeeId ?? "none")
  }, [currentEmployeeId])

  const isDirty = selected !== initial

  async function handleSave() {
    setSaving(true)
    await linkMemberToEmployee(teamId, memberUserId, selected === "none" ? null : selected)
    setSaving(false)
    router.refresh()
  }

  function handleCancel() {
    setSelected(initial)
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selected} onValueChange={setSelected}>
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

      {isDirty && (
        <>
          <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <span className="size-3 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
        </>
      )}
    </div>
  )
}
