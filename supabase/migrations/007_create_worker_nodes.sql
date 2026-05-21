-- ============================================================
-- Delta Engine — Migration 007: worker_nodes
-- Worker machine registry for orchestration
-- ============================================================

CREATE TABLE worker_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_name VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    host_identifier VARCHAR(255),
    status VARCHAR(50) DEFAULT 'offline',
    capacity INTEGER DEFAULT 1,
    active_sessions INTEGER DEFAULT 0,
    last_heartbeat_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_worker_nodes_status ON worker_nodes(status);
CREATE INDEX idx_worker_nodes_heartbeat ON worker_nodes(last_heartbeat_at);

-- Auto-update trigger
CREATE TRIGGER update_worker_nodes_updated_at
    BEFORE UPDATE ON worker_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
