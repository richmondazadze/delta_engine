-- Allow trading account deletion while preserving execution audit history.
-- Account references on events are cleared instead of blocking the delete.

ALTER TABLE execution_events
    DROP CONSTRAINT IF EXISTS execution_events_master_account_id_fkey;

ALTER TABLE execution_events
    DROP CONSTRAINT IF EXISTS execution_events_follower_account_id_fkey;

ALTER TABLE execution_events
    ADD CONSTRAINT execution_events_master_account_id_fkey
        FOREIGN KEY (master_account_id) REFERENCES trading_accounts(id) ON DELETE SET NULL;

ALTER TABLE execution_events
    ADD CONSTRAINT execution_events_follower_account_id_fkey
        FOREIGN KEY (follower_account_id) REFERENCES trading_accounts(id) ON DELETE SET NULL;
