/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ConstraintType" ADD VALUE 'max_hours_per_month';
ALTER TYPE "ConstraintType" ADD VALUE 'max_employees_per_shift';
ALTER TYPE "ConstraintType" ADD VALUE 'holiday';
ALTER TYPE "ConstraintType" ADD VALUE 'preferred_consecutive_days';
ALTER TYPE "ConstraintType" ADD VALUE 'no_shift_alternation';
ALTER TYPE "ConstraintType" ADD VALUE 'min_consecutive_days';
ALTER TYPE "ConstraintType" ADD VALUE 'max_days_per_week';
ALTER TYPE "ConstraintType" ADD VALUE 'min_days_between_shifts';
ALTER TYPE "ConstraintType" ADD VALUE 'day_pairing';
ALTER TYPE "ConstraintType" ADD VALUE 'shift_coverage';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
