-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "clabe" TEXT NOT NULL,
    "beneficiary" TEXT NOT NULL,
    "accountNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- Seed from existing SystemSettings if any
INSERT INTO "PaymentMethod" ("id", "bankName", "clabe", "beneficiary", "accountNumber", "isActive", "updatedAt")
SELECT 'legacy-initial', "bankName", "clabe", "beneficiary", "accountNumber", true, NOW()
FROM "SystemSettings"
WHERE id = 'default'
ON CONFLICT ("id") DO NOTHING;
