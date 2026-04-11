-- SpecPoints Migration 0003
-- Adds extended contact/address fields to architects table

ALTER TABLE architects ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE architects ADD COLUMN IF NOT EXISTS cep VARCHAR(10);
ALTER TABLE architects ADD COLUMN IF NOT EXISTS "number" VARCHAR(20);
ALTER TABLE architects ADD COLUMN IF NOT EXISTS complement VARCHAR(100);
ALTER TABLE architects ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);

-- Copy existing phone data into the new telefone column
UPDATE architects SET telefone = phone WHERE telefone IS NULL AND phone IS NOT NULL;
