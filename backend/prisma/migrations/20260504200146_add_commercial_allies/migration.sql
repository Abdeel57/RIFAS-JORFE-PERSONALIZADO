/*
  Warnings:

  - Made the column `autoVerificationEnabled` on table `SystemSettings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "RaffleStatus" ADD VALUE 'draft';

-- AlterTable
ALTER TABLE "SystemSettings" ALTER COLUMN "id" SET DEFAULT 'default',
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "autoVerificationEnabled" SET NOT NULL;

-- CreateTable
CREATE TABLE "CommercialAlly" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "targetView" TEXT NOT NULL,
    "badgeLabel" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "gradientFrom" TEXT NOT NULL DEFAULT '#dbeafe',
    "gradientTo" TEXT NOT NULL DEFAULT '#bfdbfe',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialAlly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommercialAlly_isActive_order_idx" ON "CommercialAlly"("isActive", "order");
