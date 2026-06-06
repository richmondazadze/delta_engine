-- ============================================================
-- Migration 011: worker_commands (flatten, test, etc.)
-- ============================================================

CREATE TABLE worker_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tc_users(id) ON DELETE CASCADE,
    trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    command_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payload JSONB DEFAULT '{}'::jsonb,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_worker_commands_account ON worker_commands(trading_account_id);
CREATE INDEX idx_worker_commands_status ON worker_commands(status) WHERE status = 'pending';

-- Stripe checkout session tracking
ALTER TABLE tc_users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Extend platform enum for futures connectors
ALTER TYPE platform_enum ADD VALUE IF NOT EXISTS 'tradovate';
