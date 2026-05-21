-- ============================================================
-- Delta Engine — Migration 008: worker_sessions
-- Per-account terminal sessions
-- ============================================================

CREATE TABLE worker_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_node_id UUID REFERENCES worker_nodes(id) ON DELETE SET NULL,
    trading_account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
    session_status VARCHAR(50) DEFAULT 'starting',
    terminal_path TEXT,
    process_id INTEGER,
    last_heartbeat_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stopped_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_worker_sessions_worker ON worker_sessions(worker_node_id);
CREATE INDEX idx_worker_sessions_account ON worker_sessions(trading_account_id);
CREATE INDEX idx_worker_sessions_status ON worker_sessions(session_status);

-- Only one active session per trading account
CREATE UNIQUE INDEX idx_worker_sessions_active_account 
    ON worker_sessions(trading_account_id) 
    WHERE session_status IN ('starting', 'running', 'reconnecting');
