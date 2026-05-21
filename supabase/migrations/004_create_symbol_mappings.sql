-- ============================================================
-- Delta Engine — Migration 004: symbol_mappings
-- Cross-broker symbol translation (XAUUSD → GOLD.m etc.)
-- ============================================================

CREATE TABLE symbol_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tc_users(id) ON DELETE CASCADE,
    master_account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
    follower_account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
    master_symbol VARCHAR(50) NOT NULL,
    follower_symbol VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_symbol_mappings_user ON symbol_mappings(user_id);
CREATE INDEX idx_symbol_mappings_master_account ON symbol_mappings(master_account_id);
CREATE INDEX idx_symbol_mappings_follower_account ON symbol_mappings(follower_account_id);

-- Unique constraint: same symbol mapping for same account pair
CREATE UNIQUE INDEX idx_symbol_mappings_unique 
    ON symbol_mappings(master_account_id, follower_account_id, master_symbol) 
    WHERE is_active = TRUE;
