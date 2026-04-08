-- CreateTable
CREATE TABLE "PolleriaConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "prizeName" TEXT NOT NULL DEFAULT 'Televisor Plasma 75 Pulgadas',
    "prizeImage" TEXT,
    "drawDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalTickets" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolleriaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolleriaTicket" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolleriaTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PolleriaTicket_number_key" ON "PolleriaTicket"("number");

-- CreateIndex
CREATE INDEX "PolleriaTicket_number_idx" ON "PolleriaTicket"("number");
