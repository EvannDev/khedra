"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { updateTeamMemberRole } from "@/app/actions/teams"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const ROLES = ["admin", "manager", "viewer"] as const
type Role = (typeof ROLES)[number]

interface RoleSelectProps {
  teamId: string
  targetUserId: string
  currentRole: Role
}

export function RoleSelect({ teamId, targetUserId, currentRole }: RoleSelectProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Role>(currentRole)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSelected(currentRole)
  }, [currentRole])

  const isDirty = selected !== currentRole

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await updateTeamMemberRole(teamId, targetUserId, selected)
    setSaving(false)
    if ("error" in result) {
      setError(result.error ?? "Something went wrong.")
      setSelected(currentRole)
    } else {
      router.refresh()
    }
  }

  function handleCancel() {
    setSelected(currentRole)
    setError(null)
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Select value={selected} onValueChange={(v) => { setSelected(v as Role); setError(null) }}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
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
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
