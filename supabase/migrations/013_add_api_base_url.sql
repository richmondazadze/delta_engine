-- API platform base URL (DXtrade REST root, etc.)
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS api_base_url TEXT;

COMMENT ON COLUMN trading_accounts.api_base_url IS
  'REST API root for non-terminal platforms (e.g. https://dxtrade.ftmo.com).';
