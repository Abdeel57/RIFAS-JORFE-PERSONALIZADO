-- Create SystemSettings if it doesn't exist (table was never in init migration)
CREATE TABLE IF NOT EXISTS "SystemSettings" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL DEFAULT 'BBVA México',
    "clabe" TEXT NOT NULL DEFAULT '012 180 0152 4895 2410',
    "beneficiary" TEXT NOT NULL DEFAULT 'RIFAS NAO MÉXICO S.A.',
    "whatsapp" TEXT NOT NULL DEFAULT '+521234567890',
    "contactEmail" TEXT NOT NULL DEFAULT 'contacto@rifasnao.com',
    "instagram" TEXT NOT NULL DEFAULT '@rifasnao_oficial',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- Add new columns (IF NOT EXISTS for existing deployments)
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "paymentInstructions" TEXT;
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "autoVerificationEnabled" BOOLEAN DEFAULT true;
