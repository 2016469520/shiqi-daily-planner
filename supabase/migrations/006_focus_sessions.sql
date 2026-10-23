-- ============================================================
-- Migration 006: Focus Sessions
-- ============================================================

BEGIN;

-- ---------- focus_sessions ----------
CREATE TABLE IF NOT EXISTS focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    title TEXT,
    mode TEXT NOT NULL DEFAULT 'focus' CHECK (mode IN ('focus', 'short_break', 'long_break')),
    planned_minutes INT NOT NULL DEFAULT 25,
    actual_seconds INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'running', 'paused', 'completed', 'cancelled')),
    pause_count INT NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_status ON focus_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task_id ON focus_sessions(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_focus_sessions_started ON focus_sessions(user_id, started_at);

-- Auto-update trigger
CREATE TRIGGER update_focus_sessions_updated_at
    BEFORE UPDATE ON focus_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own focus sessions"
    ON focus_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions"
    ON focus_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus sessions"
    ON focus_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus sessions"
    ON focus_sessions FOR DELETE
    USING (auth.uid() = user_id);

COMMIT;
