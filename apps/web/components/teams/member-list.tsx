import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { InviteSection } from "@/components/teams/invite-section"
import { LinkEmployeeSelect } from "@/components/teams/link-employee-select"
import { RoleSelect } from "@/components/teams/role-select"
import type { TeamMemberModel } from "@/lib/generated/prisma/models/TeamMember"
import type { UserModel } from "@/lib/generated/prisma/models/User"
import type { EmployeeModel } from "@/lib/generated/prisma/models/Employee"

type MemberWithUser = TeamMemberModel & { user: UserModel }

const roleVariant: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  manager: "secondary",
  viewer: "outline",
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface MemberListProps {
  teamId: string
  members: MemberWithUser[]
  employees: EmployeeModel[]
  inviteToken: string | null
  currentUserRole: string
  currentUserId: string
}

export function MemberList({ teamId, members, employees, inviteToken, currentUserRole, currentUserId }: MemberListProps) {
  const isAdmin = currentUserRole === "admin"

  // employees already linked to some member (keyed by userId)
  const linkedEmployeeByUserId = new Map(
    employees.filter((e) => e.userId).map((e) => [e.userId!, e])
  )
  // employees not yet linked to anyone
  const unlinkedEmployees = employees.filter((e) => !e.userId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Members</h2>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const linkedEmployee = linkedEmployeeByUserId.get(member.userId)
              const selectOptions = linkedEmployee
                ? [linkedEmployee, ...unlinkedEmployees]
                : unlinkedEmployees

              return (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.user.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{member.user.email}</TableCell>
                  <TableCell>
                    {isAdmin && member.userId !== currentUserId ? (
                      <RoleSelect
                        teamId={teamId}
                        targetUserId={member.userId}
                        currentRole={member.role as "admin" | "manager" | "viewer"}
                      />
                    ) : (
                      <Badge variant={roleVariant[member.role] ?? "outline"}>{member.role}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <LinkEmployeeSelect
                        teamId={teamId}
                        memberUserId={member.userId}
                        currentEmployeeId={linkedEmployee?.id ?? null}
                        unlinkedEmployees={selectOptions}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {linkedEmployee?.name ?? "—"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(member.createdAt)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <InviteSection
        teamId={teamId}
        inviteToken={inviteToken}
        isAdmin={isAdmin}
      />
    </div>
  )
}
