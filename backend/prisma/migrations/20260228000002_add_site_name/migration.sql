-- Add siteName to SystemSettings
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "siteName" TEXT NOT NULL DEFAULT 'RIFAS NAO';
