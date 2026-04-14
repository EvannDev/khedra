-- Add teamId as nullable first so we can backfill before enforcing NOT NULL
ALTER TABLE "Constraint" ADD COLUMN "teamId" TEXT;

-- Backfill teamId from the related Planning's teamId
UPDATE "Constraint" c
SET "teamId" = p."teamId"
FROM "Planning" p
WHERE c."planningId" = p.id;

-- Now enforce NOT NULL (all rows have a value after backfill)
ALTER TABLE "Constraint" ALTER COLUMN "teamId" SET NOT NULL;

-- Make planningId nullable (team-level constraints have no planning)
ALTER TABLE "Constraint" ALTER COLUMN "planningId" DROP NOT NULL;

-- Add FK from Constraint.teamId to Team
ALTER TABLE "Constraint" ADD CONSTRAINT "Constraint_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
