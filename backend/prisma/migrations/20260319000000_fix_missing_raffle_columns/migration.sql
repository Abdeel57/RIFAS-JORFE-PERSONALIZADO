-- ============================================================
-- FIX: Add missing Raffle columns (safe, idempotent)
-- This migration adds columns only if they don't already exist.
-- Fixes: column Raffle.opportunities does not exist
-- ============================================================

-- Add opportunities column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Raffle'
      AND column_name = 'opportunities'
  ) THEN
    ALTER TABLE "Raffle" ADD COLUMN "opportunities" INTEGER NOT NULL DEFAULT 1;
    RAISE NOTICE 'Added column: opportunities';
  ELSE
    RAISE NOTICE 'Column opportunities already exists, skipping.';
  END IF;
END $$;

-- Add autoReleaseHours column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Raffle'
      AND column_name = 'autoReleaseHours'
  ) THEN
    ALTER TABLE "Raffle" ADD COLUMN "autoReleaseHours" INTEGER NOT NULL DEFAULT 0;
    RAISE NOTICE 'Added column: autoReleaseHours';
  ELSE
    RAISE NOTICE 'Column autoReleaseHours already exists, skipping.';
  END IF;
END $$;

-- Add luckyMachineNumbers column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Raffle'
      AND column_name = 'luckyMachineNumbers'
  ) THEN
    ALTER TABLE "Raffle" ADD COLUMN "luckyMachineNumbers" INTEGER[] DEFAULT ARRAY[5, 10, 20, 50]::INTEGER[];
    RAISE NOTICE 'Added column: luckyMachineNumbers';
  ELSE
    RAISE NOTICE 'Column luckyMachineNumbers already exists, skipping.';
  END IF;
END $$;

-- Add isGift column to Ticket if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Ticket'
      AND column_name = 'isGift'
  ) THEN
    ALTER TABLE "Ticket" ADD COLUMN "isGift" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added column: isGift';
  ELSE
    RAISE NOTICE 'Column isGift already exists, skipping.';
  END IF;
END $$;

-- Add isVirtual column to Raffle if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Raffle'
      AND column_name = 'isVirtual'
  ) THEN
    ALTER TABLE "Raffle" ADD COLUMN "isVirtual" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added column: isVirtual';
  ELSE
    RAISE NOTICE 'Column isVirtual already exists, skipping.';
  END IF;
END $$;
