-- ============================================================
-- Migration 005: Countdowns
-- ============================================================

BEGIN;

-- ---------- countdowns ----------
CREATE TABLE IF NOT EXISTS countdowns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_date DATE NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    icon TEXT,
    category TEXT,
    is_yearly BOOLEAN NOT NULL DEFAULT false,
    linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    show_on_home BOOLEAN NOT NULL DEFAULT true,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_countdowns_user_id ON countdowns(user_id);
CREATE INDEX IF NOT EXISTS idx_countdowns_user_date ON countdowns(user_id, target_date);
CREATE INDEX IF NOT EXISTS idx_countdowns_user_pinned ON countdowns(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_countdowns_archived ON countdowns(user_id, archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_countdowns_linked_task ON countdowns(linked_task_id) WHERE linked_task_id IS NOT NULL;

-- Auto-update trigger
CREATE TRIGGER update_countdowns_updated_at
    BEFORE UPDATE ON countdowns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own countdowns"
    ON countdowns FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own countdowns"
    ON countdowns FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own countdowns"
    ON countdowns FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own countdowns"
    ON countdowns FOR DELETE
    USING (auth.uid() = user_id);

COMMIT;
