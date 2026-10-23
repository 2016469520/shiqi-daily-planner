-- Migration 008: Add timer_mode to focus_sessions
-- Supports both countdown (倒计时) and stopwatch (正计时) modes
-- Idempotent: safe to re-run even if partially or fully applied

BEGIN;

-- 1. Add timer_mode column (safe to re-run)
ALTER TABLE focus_sessions
ADD COLUMN IF NOT EXISTS timer_mode TEXT;

-- 2. Set default for existing rows that still have NULL
UPDATE focus_sessions
SET timer_mode = 'countdown'
WHERE timer_mode IS NULL;

-- 3. Make column NOT NULL now that all rows have a value
--    Uses a DO block to avoid errors if already NOT NULL
DO $$
BEGIN
    ALTER TABLE focus_sessions ALTER COLUMN timer_mode SET NOT NULL;
EXCEPTION
    WHEN others THEN
        -- Column is already NOT NULL; nothing to do
        RAISE NOTICE 'timer_mode column is already NOT NULL';
END $$;

-- 4. Set default for future rows (safe to re-run)
ALTER TABLE focus_sessions ALTER COLUMN timer_mode SET DEFAULT 'countdown';

-- 5. Add check constraint (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'focus_sessions'
          AND con.conname = 'chk_focus_timer_mode'
    ) THEN
        ALTER TABLE focus_sessions
        ADD CONSTRAINT chk_focus_timer_mode
        CHECK (timer_mode IN ('countdown', 'stopwatch'));
    END IF;
END $$;

-- 6. Create index for timer_mode filtering (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_focus_sessions_timer_mode
ON focus_sessions(user_id, timer_mode);

COMMIT;
