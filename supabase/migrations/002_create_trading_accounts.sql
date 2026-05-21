-- ============================================================
-- Delta Engine — Migration 002: trading_accounts
-- Broker account connections with encrypted credentials
-- ============================================================

CREATE TYPE platform_enum AS ENUM (
    'mt5', 'mt4', 'ctrader', 'dxtrade', 'matchtrader',
    'tradelocker', 'ninjatrader', 'tradingview'
);

CREATE TYPE connection_status_enum AS ENUM (
    'connected', 'disconnected', 'auth_failed', 'terminal_unavailable',
    'broker_unavailable', 'disabled', 'locked'
);

CREATE TYPE account_mode_enum AS ENUM ('hedging', 'netting', 'unknown');

CREATE TABLE trading_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tc_users(id) ON DELETE CASCADE,
    platform platform_enum NOT NULL DEFAULT 'mt5',
    account_number VARCHAR(64) NOT NULL,
    broker_server VARCHAR(255) NOT NULL,
    encrypted_password TEXT NOT NULL,
    account_label VARCHAR(100),
    account_mode account_mode_enum DEFAULT 'unknown',
    connection_status connection_status_enum DEFAULT 'disconnected',
    balance NUMERIC(14, 2),
    equity NUMERIC(14, 2),
    currency VARCHAR(20),
    leverage INTEGER,
    last_connected_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_trading_accounts_user ON trading_accounts(user_id);
CREATE INDEX idx_trading_accounts_status ON trading_accounts(connection_status);
CREATE INDEX idx_trading_accounts_platform ON trading_accounts(platform);

-- Unique constraint: same user can't add same account number + broker combo twice
CREATE UNIQUE INDEX idx_trading_accounts_unique_login 
    ON trading_accounts(user_id, platform, account_number, broker_server);

-- Auto-update trigger
CREATE TRIGGER update_trading_accounts_updated_at
    BEFORE UPDATE ON trading_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
