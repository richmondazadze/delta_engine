-- E2E copy timing breakdown for performance monitoring

ALTER TABLE execution_events
    ADD COLUMN IF NOT EXISTS switch_ms INTEGER,
    ADD COLUMN IF NOT EXISTS order_ms INTEGER,
    ADD COLUMN IF NOT EXISTS e2e_ms INTEGER;

CREATE INDEX IF NOT EXISTS idx_execution_events_e2e
    ON execution_events(user_id, created_at DESC, e2e_ms);
