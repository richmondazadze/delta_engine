-- ============================================================
-- Delta Engine — Migration 006: execution_events
-- Full trade audit trail — every signal, every attempt, every result
-- ============================================================

CREATE TYPE execution_status_enum AS ENUM (
    'pending', 'success', 'failed', 'rejected', 'skipped_risk',
    'skipped_slippage', 'duplicate_ignored', 'partial', 'closed', 'modified'
);

CREATE TABLE execution_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tc_users(id) ON DELETE CASCADE,
    copier_relation_id UUID REFERENCES copier_relations(id) ON DELETE SET NULL,
    master_account_id UUID REFERENCES trading_accounts(id),
    follower_account_id UUID REFERENCES trading_accounts(id),

    -- Event classification
    event_type VARCHAR(50) NOT NULL,

    -- Trade identifiers
    master_ticket VARCHAR(100),
    follower_ticket VARCHAR(100),

    -- Symbol info
    symbol_master VARCHAR(50),
    symbol_follower VARCHAR(50),

    -- Trade details
    side VARCHAR(10),
    requested_lot NUMERIC(10, 2),
    executed_lot NUMERIC(10, 2),
    requested_price NUMERIC(18, 8),
    executed_price NUMERIC(18, 8),

    -- Performance metrics
    slippage_points NUMERIC(12, 4),
    latency_ms INTEGER,

    -- Result
    status execution_status_enum NOT NULL,
    broker_return_code VARCHAR(100),
    error_message TEXT,
    raw_payload JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for filtering (dashboard needs fast queries)
CREATE INDEX idx_execution_events_user ON execution_events(user_id);
CREATE INDEX idx_execution_events_copier ON execution_events(copier_relation_id);
CREATE INDEX idx_execution_events_master ON execution_events(master_account_id);
CREATE INDEX idx_execution_events_follower ON execution_events(follower_account_id);
CREATE INDEX idx_execution_events_status ON execution_events(status);
CREATE INDEX idx_execution_events_created ON execution_events(created_at DESC);
CREATE INDEX idx_execution_events_event_type ON execution_events(event_type);

-- Composite index for common dashboard query: user's recent events
CREATE INDEX idx_execution_events_user_created 
    ON execution_events(user_id, created_at DESC);
