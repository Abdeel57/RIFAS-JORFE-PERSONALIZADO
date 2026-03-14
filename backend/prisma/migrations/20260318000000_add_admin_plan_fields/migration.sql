-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "planType" TEXT,
ADD COLUMN "planStartDate" TIMESTAMP(3),
ADD COLUMN "planExpiryDate" TIMESTAMP(3);
