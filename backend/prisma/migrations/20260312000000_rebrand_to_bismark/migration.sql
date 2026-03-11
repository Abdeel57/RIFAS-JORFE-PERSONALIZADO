-- Rebrand defaults from Rifas NAO to Bismark
ALTER TABLE "SystemSettings" ALTER COLUMN "beneficiary" SET DEFAULT 'Bismark México S.A.';
ALTER TABLE "SystemSettings" ALTER COLUMN "contactEmail" SET DEFAULT 'contacto@bismark.com';
ALTER TABLE "SystemSettings" ALTER COLUMN "instagram" SET DEFAULT '@bismark_oficial';
ALTER TABLE "SystemSettings" ALTER COLUMN "siteName" SET DEFAULT 'Bismark';

-- Actualizar SystemSettings para despliegues ya en producción (admin lo actualiza el seed)
UPDATE "SystemSettings" SET "siteName" = 'Bismark', "beneficiary" = 'Bismark México S.A.', "contactEmail" = 'contacto@bismark.com', "instagram" = '@bismark_oficial' WHERE id = 'default' AND ("siteName" = 'RIFAS NAO' OR "beneficiary" LIKE '%RIFAS NAO%');
