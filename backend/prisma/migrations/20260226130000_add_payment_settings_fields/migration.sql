-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "paymentInstructions" TEXT;
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "autoVerificationEnabled" BOOLEAN DEFAULT true;
