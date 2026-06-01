-- ============================================================
-- Delta Engine — Migration 010: terminal_path on trading_accounts
-- MT5 terminal executable path (broker-specific installs)
-- ============================================================

ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS terminal_path TEXT;
