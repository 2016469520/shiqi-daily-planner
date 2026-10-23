-- ============================================================
-- Migration 007: Add difficulty and due_at to tasks
-- Idempotent: safe to re-run even if partially or fully applied
-- ============================================================

BEGIN;

-- 1. Add difficulty column (replaces priority for user choice)
--    Separate into individual steps for safe re-runs
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS difficulty TEXT;

-- 2. Update existing NULL values to 'medium'
UPDATE tasks SET difficulty = 'medium' WHERE difficulty IS NULL;

-- 3. Make column NOT NULL with default (safe to re-run)
DO $$
BEGIN
    ALTER TABLE tasks ALTER COLUMN difficulty SET NOT NULL;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'difficulty column is already NOT NULL';
END $$;

ALTER TABLE tasks ALTER COLUMN difficulty SET DEFAULT 'medium';

-- 4. Add named CHECK constraint (only if not already present with correct name)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'tasks'
          AND con.conname = 'chk_tasks_difficulty'
    ) THEN
        -- Drop any unnamed constraint on difficulty from partial prior runs
        -- (inline ADD COLUMN CHECK creates an auto-named constraint)
        BEGIN
            EXECUTE (
                SELECT 'ALTER TABLE tasks DROP CONSTRAINT ' || quote_ident(con.conname)
                FROM pg_constraint con
                JOIN pg_class rel ON rel.oid = con.conrelid
                WHERE rel.relname = 'tasks'
                  AND con.contype = 'c'
                  AND con.conname != 'chk_tasks_difficulty'
                  AND pg_get_constraintdef(con.oid) LIKE '%difficulty%'
                LIMIT 1
            );
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'No old difficulty constraint to drop';
        END;

        ALTER TABLE tasks
        ADD CONSTRAINT chk_tasks_difficulty
        CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard'));
    END IF;
END $$;

-- 5. Add due_at column (deadline for auto urgency calculation)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;

-- 6. Add index for due_at based queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(user_id, due_at) WHERE due_at IS NOT NULL;

-- 7. Migrate existing priority values to difficulty (best-effort mapping, idempotent)
-- priority 'low' → 'easy', 'normal' → 'medium', 'high' → 'hard', 'urgent' → 'very_hard'
-- Only updates rows that still have the default 'medium' value
UPDATE tasks SET difficulty = 'easy' WHERE priority = 'low' AND difficulty = 'medium';
UPDATE tasks SET difficulty = 'hard' WHERE priority = 'high' AND difficulty = 'medium';
UPDATE tasks SET difficulty = 'very_hard' WHERE priority = 'urgent' AND difficulty = 'medium';
-- 'normal' already maps to 'medium', no change needed

-- 8. Add comment for legacy priority column
COMMENT ON COLUMN tasks.priority IS 'Legacy priority field — superseded by difficulty. Kept for backward compatibility.';

COMMIT;
