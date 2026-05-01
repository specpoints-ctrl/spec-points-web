-- SpecPoints Database Schema - Migration 0010
-- Version: 0010
-- Created: 2026-04-30
-- Adds: instagram_handle to users profile

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(30);

CREATE INDEX IF NOT EXISTS idx_users_instagram_handle
  ON users(instagram_handle);
