-- AlterTable
ALTER TABLE "Raffle" ADD COLUMN "opportunities" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "isGift" BOOLEAN NOT NULL DEFAULT false;
