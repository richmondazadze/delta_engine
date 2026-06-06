-- Daily equity snapshots for "today's net" on the dashboard

CREATE TABLE IF NOT EXISTS account_equity_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tc_users(id) ON DELETE CASCADE,
    trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    equity_open NUMERIC(14, 2),
    balance_open NUMERIC(14, 2),
    currency VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (trading_account_id, snapshot_date)
);

CREATE INDEX idx_equity_snapshots_user_date
    ON account_equity_snapshots(user_id, snapshot_date);

ALTER TABLE trading_accounts
    ADD COLUMN IF NOT EXISTS last_balance_sync_at TIMESTAMPTZ;
