-- Migration: Add promoTiers JSON column to Raffle table
ALTER TABLE "Raffle" ADD COLUMN IF NOT EXISTS "promoTiers" JSONB NOT NULL DEFAULT '[]'::JSONB;
