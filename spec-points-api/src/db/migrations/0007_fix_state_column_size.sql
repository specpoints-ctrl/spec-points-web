-- SpecPoints Migration 0007
-- Fix state column size: VARCHAR(2) is too small for international state/department names
-- (e.g. "Alto Paraná" in Paraguay). Expand to VARCHAR(100).

ALTER TABLE architects ALTER COLUMN state TYPE VARCHAR(100);
ALTER TABLE stores ALTER COLUMN state TYPE VARCHAR(100);
