-- AlterTable: Add verification fields to Purchase
ALTER TABLE "Purchase" ADD COLUMN "verificationStatus" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "verificationNote" TEXT;
