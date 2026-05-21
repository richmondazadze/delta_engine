-- ============================================================
-- Delta Engine — Migration 003: copier_relations
-- Master-to-follower copy links with lot sizing config
-- ============================================================

CREATE TYPE risk_mode_enum AS ENUM (
    'multiplier', 'fixed_lot', 'equity_ratio', 'risk_percent'
);

CREATE TABLE copier_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tc_users(id) ON DELETE CASCADE,
    master_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    follower_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    label VARCHAR(100),
    risk_mode risk_mode_enum DEFAULT 'multiplier',
    multiplier NUMERIC(8, 4) DEFAULT 1.0000,
    fixed_lot_size NUMERIC(10, 2) DEFAULT 0.01,
    copy_sl BOOLEAN DEFAULT TRUE,
    copy_tp BOOLEAN DEFAULT TRUE,
    copy_closes BOOLEAN DEFAULT TRUE,
    copy_modifications BOOLEAN DEFAULT TRUE,
    max_signal_age_ms INTEGER DEFAULT 3000,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_master_follower_pair UNIQUE (master_account_id, follower_account_id),
    CONSTRAINT check_not_self_copy CHECK (master_account_id <> follower_account_id)
);

-- Indexes
CREATE INDEX idx_copier_relations_user ON copier_relations(user_id);
CREATE INDEX idx_copier_relations_master ON copier_relations(master_account_id);
CREATE INDEX idx_copier_relations_follower ON copier_relations(follower_account_id);
CREATE INDEX idx_copier_relations_enabled ON copier_relations(is_enabled) WHERE is_enabled = TRUE;

-- Auto-update trigger
CREATE TRIGGER update_copier_relations_updated_at
    BEFORE UPDATE ON copier_relations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
