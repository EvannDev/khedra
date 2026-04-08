"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "Employees", segment: "employees", minRole: "viewer" },
  { label: "Shifts", segment: "shifts", minRole: "viewer" },
  { label: "Plannings", segment: "plannings", minRole: "viewer" },
  { label: "Members", segment: "members", minRole: "manager" },
  { label: "My Schedule", segment: "my-schedule", minRole: "viewer" },
] as const

const roleRank: Record<string, number> = { viewer: 0, manager: 1, admin: 2 }

export function TeamNav({ teamId, role }: { teamId: string; role: string }) {
  const pathname = usePathname()
  const visibleTabs = tabs.filter((t) => roleRank[role] >= roleRank[t.minRole])

  return (
    <nav className="flex gap-1 border-b border-border">
      {visibleTabs.map(({ label, segment }) => {
        const href = `/dashboard/teams/${teamId}/${segment}`
        const isActive = pathname.startsWith(href)
        return (
          <Link
            key={segment}
            href={href}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
