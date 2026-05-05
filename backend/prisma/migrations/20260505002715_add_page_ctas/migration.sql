-- CreateTable
CREATE TABLE "PageCta" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "whatsappPhone" TEXT,
    "whatsappMessage" TEXT,
    "infoUrl" TEXT,
    "primaryLabel" TEXT,
    "secondaryLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageCta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageCta_section_key" ON "PageCta"("section");
