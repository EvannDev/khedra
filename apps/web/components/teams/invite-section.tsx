"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { generateInviteToken } from "@/app/actions/teams"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RiFileCopyLine, RiRefreshLine, RiLinkM } from "@remixicon/react"

interface InviteSectionProps {
  teamId: string
  inviteToken: string | null
  isAdmin: boolean
}

export function InviteSection({ teamId, inviteToken, isAdmin }: InviteSectionProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const inviteUrl = inviteToken ? `${appUrl}/invite/${inviteToken}` : null

  async function handleGenerate() {
    setGenerating(true)
    setError("")
    const result = await generateInviteToken(teamId)
    if (result && "error" in result) {
      setError(result.error)
    } else {
      router.refresh()
    }
    setGenerating(false)
  }

  async function handleCopy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <RiLinkM className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Invite link</p>
          <p className="text-xs text-muted-foreground">
            Anyone with this link can join the team as a viewer.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-3 text-sm text-destructive">{error}</p>
      )}

      {inviteUrl ? (
        <div className="flex gap-2">
          <Input value={inviteUrl} readOnly className="font-mono text-xs" />
          <Button variant="outline" size="icon" onClick={handleCopy} title="Copy link">
            <RiFileCopyLine className="size-4" />
            <span className="sr-only">{copied ? "Copied!" : "Copy"}</span>
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleGenerate}
              disabled={generating}
              title="Regenerate link"
            >
              <RiRefreshLine className={`size-4 ${generating ? "animate-spin" : ""}`} />
              <span className="sr-only">Regenerate</span>
            </Button>
          )}
        </div>
      ) : isAdmin ? (
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <>
              <span className="size-4 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
              Generating…
            </>
          ) : (
            "Generate invite link"
          )}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">No invite link generated yet. Ask an admin to create one.</p>
      )}
    </div>
  )
}
