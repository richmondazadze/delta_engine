-- ============================================================
-- Delta Engine — Migration 005: risk_profiles
-- Per-account risk rules (11 risk checks from PRD)
-- ============================================================

CREATE TABLE risk_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tc_users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,

    -- Loss limits
    max_daily_loss NUMERIC(14, 2),
    max_total_loss NUMERIC(14, 2),
    min_equity NUMERIC(14, 2),

    -- Position limits
    max_lot_per_trade NUMERIC(10, 2),
    max_open_positions INTEGER DEFAULT 10,
    max_trades_per_day INTEGER,

    -- Symbol filters
    allowed_symbols TEXT[],
    blocked_symbols TEXT[],

    -- Feature flags
    news_pause_enabled BOOLEAN DEFAULT FALSE,
    lock_after_loss BOOLEAN DEFAULT TRUE,
    auto_flatten_enabled BOOLEAN DEFAULT TRUE,

    -- Lockout state
    is_locked BOOLEAN DEFAULT FALSE,
    locked_reason TEXT,
    locked_at TIMESTAMP WITH TIME ZONE,

    -- Daily tracking (reset at midnight)
    daily_loss_accumulated NUMERIC(14, 2) DEFAULT 0.00,
    daily_trades_count INTEGER DEFAULT 0,
    daily_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_risk_profiles_user ON risk_profiles(user_id);
CREATE INDEX idx_risk_profiles_account ON risk_profiles(account_id);
CREATE INDEX idx_risk_profiles_locked ON risk_profiles(is_locked) WHERE is_locked = TRUE;

-- One risk profile per account
CREATE UNIQUE INDEX idx_risk_profiles_unique_account ON risk_profiles(account_id);

-- Auto-update trigger
CREATE TRIGGER update_risk_profiles_updated_at
    BEFORE UPDATE ON risk_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
