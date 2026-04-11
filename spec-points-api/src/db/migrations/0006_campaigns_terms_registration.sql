-- SpecPoints Migration 0006
-- Campaigns, Terms, Extended Registration Fields
-- Created: 2026-04-11

-- =============================================
-- CAMPAIGNS
-- =============================================

CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  focus VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (focus IN ('all', 'architect', 'lojista')),
  points_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0 CHECK (points_multiplier > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_prizes (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  points_required BIGINT NOT NULL CHECK (points_required > 0),
  stock BIGINT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Links a sale to a campaign for tracking campaign-specific points
CREATE TABLE IF NOT EXISTS campaign_sales (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  points_earned BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, sale_id)
);

-- =============================================
-- TERMS & CONDITIONS
-- =============================================

CREATE TABLE IF NOT EXISTS terms (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  version VARCHAR(50) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_terms_acceptance (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  terms_id BIGINT NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  accepted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, terms_id)
);

-- =============================================
-- SALES TABLE ADDITIONS
-- NOTE: points_generated is GENERATED ALWAYS AS (FLOOR(amount_usd)) STORED
-- and cannot be modified. We add points_effective for multiplier-adjusted values.
-- Legacy sales have points_effective = NULL; reads should use COALESCE(points_effective, points_generated).
-- =============================================

ALTER TABLE sales ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 CHECK (quantity > 0);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS campaign_id BIGINT REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS points_effective BIGINT;

-- =============================================
-- REDEMPTIONS TABLE ADDITIONS
-- =============================================

ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMP;
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- =============================================
-- ARCHITECTS TABLE ADDITIONS
-- =============================================

ALTER TABLE architects ADD COLUMN IF NOT EXISTS document_ci VARCHAR(20);
ALTER TABLE architects ADD COLUMN IF NOT EXISTS ruc VARCHAR(20);
ALTER TABLE architects ADD COLUMN IF NOT EXISTS office_phone VARCHAR(20);
ALTER TABLE architects ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE architects ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT false;

-- =============================================
-- STORES TABLE ADDITIONS
-- =============================================

ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_ci VARCHAR(20);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS ruc VARCHAR(20);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS office_phone VARCHAR(20);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_birthday DATE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT false;

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(active);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaign_prizes_campaign_id ON campaign_prizes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sales_campaign_id ON campaign_sales(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sales_sale_id ON campaign_sales(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_campaign_id ON sales(campaign_id);
CREATE INDEX IF NOT EXISTS idx_terms_active ON terms(active);
CREATE INDEX IF NOT EXISTS idx_user_terms_user_id ON user_terms_acceptance(user_id);
CREATE INDEX IF NOT EXISTS idx_architects_profile_complete ON architects(profile_complete);
CREATE INDEX IF NOT EXISTS idx_stores_profile_complete ON stores(profile_complete);

-- =============================================
-- TRIGGERS
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_campaigns_updated_at'
  ) THEN
    CREATE TRIGGER update_campaigns_updated_at
      BEFORE UPDATE ON campaigns
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
