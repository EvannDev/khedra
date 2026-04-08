import type { PlanningStatus } from "@/lib/generated/prisma/enums"

export const planningStatusVariant: Record<PlanningStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  solving: "default",
  solved: "default",
  failed: "destructive",
}
