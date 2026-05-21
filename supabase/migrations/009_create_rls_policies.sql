-- ============================================================
-- Delta Engine — Migration 009: Row-Level Security Policies
-- Users can only see/modify their own data
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE tc_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE copier_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE symbol_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- tc_users policies
-- ============================================================
CREATE POLICY "Users can view own profile"
    ON tc_users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON tc_users FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================
-- trading_accounts policies
-- ============================================================
CREATE POLICY "Users can view own accounts"
    ON trading_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
    ON trading_accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
    ON trading_accounts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
    ON trading_accounts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- copier_relations policies
-- ============================================================
CREATE POLICY "Users can view own copier relations"
    ON copier_relations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own copier relations"
    ON copier_relations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own copier relations"
    ON copier_relations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own copier relations"
    ON copier_relations FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- symbol_mappings policies
-- ============================================================
CREATE POLICY "Users can view own symbol mappings"
    ON symbol_mappings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own symbol mappings"
    ON symbol_mappings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own symbol mappings"
    ON symbol_mappings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own symbol mappings"
    ON symbol_mappings FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- risk_profiles policies
-- ============================================================
CREATE POLICY "Users can view own risk profiles"
    ON risk_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own risk profiles"
    ON risk_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own risk profiles"
    ON risk_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================
-- execution_events policies
-- ============================================================
CREATE POLICY "Users can view own execution events"
    ON execution_events FOR SELECT
    USING (auth.uid() = user_id);

-- Workers insert via service role, not user JWT
-- No INSERT policy needed for regular users

-- ============================================================
-- worker_nodes policies (admin only — no user access)
-- ============================================================
-- Worker nodes are managed by service role only
-- No user-facing policies needed

-- ============================================================
-- worker_sessions policies (admin only — no user access)
-- ============================================================
-- Worker sessions are managed by service role only
-- No user-facing policies needed

-- ============================================================
-- Admin helper: Check if user is admin
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tc_users
        WHERE id = auth.uid()
        AND subscription_plan = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for worker tables
CREATE POLICY "Admins can view worker nodes"
    ON worker_nodes FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can view worker sessions"
    ON worker_sessions FOR SELECT
    USING (is_admin());
