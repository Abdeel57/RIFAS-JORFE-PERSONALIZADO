-- AlterTable
ALTER TABLE "Raffle" ADD COLUMN "luckyMachineNumbers" INTEGER[] DEFAULT ARRAY[5, 10, 20, 50]::INTEGER[];
