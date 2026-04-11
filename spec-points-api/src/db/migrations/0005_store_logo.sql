-- Migration 0005: add logo_url to stores
-- Version: 0005

ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
