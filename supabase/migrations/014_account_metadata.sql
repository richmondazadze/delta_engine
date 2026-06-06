-- Account metadata (firm slug, DXtrade context, etc.)
ALTER TABLE trading_accounts
    ADD COLUMN IF NOT EXISTS account_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_trading_accounts_metadata_firm
    ON trading_accounts ((account_metadata->>'firm_slug'))
    WHERE platform = 'dxtrade';
