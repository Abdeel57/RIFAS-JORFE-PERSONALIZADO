-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN "adminId" TEXT, ADD COLUMN "adminRole" TEXT;

-- CreateIndex
CREATE INDEX "PushSubscription_adminRole_idx" ON "PushSubscription"("adminRole");
