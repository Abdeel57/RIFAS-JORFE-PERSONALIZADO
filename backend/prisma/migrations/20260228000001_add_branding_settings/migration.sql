-- Add branding fields to SystemSettings
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT NOT NULL DEFAULT '#3b82f6';
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT NOT NULL DEFAULT '#6366f1';
