/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "inviteToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Team_inviteToken_key" ON "Team"("inviteToken");
