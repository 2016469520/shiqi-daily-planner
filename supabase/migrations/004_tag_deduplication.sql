-- ============================================================
-- 我的计划日历 — Migration 004: Tag deduplication
-- ============================================================
-- Purpose:
--   1. Add unique constraint on tags(user_id, name) to prevent duplicates
--   2. Clean up existing duplicate tags by merging them
--   3. Ensure the unique constraint is enforced going forward
--
-- Run: npx supabase db push (if using Supabase CLI)
--   or paste into Supabase SQL Editor manually
-- ============================================================

-- ============================================================
-- STEP 1: Clean up existing duplicate tags
-- ============================================================

DO $$
DECLARE
    dup_record RECORD;
    keeper_id UUID;
    dup_id UUID;
BEGIN
    -- Find duplicate tag names per user (case-insensitive, trimmed)
    FOR dup_record IN
        SELECT
            user_id,
            lower(trim(name)) AS normalized_name,
            array_agg(id ORDER BY created_at ASC) AS tag_ids,
            count(*) AS cnt
        FROM tags
        GROUP BY user_id, lower(trim(name))
        HAVING count(*) > 1
    LOOP
        -- The first (oldest) tag is the keeper
        keeper_id := dup_record.tag_ids[1];

        -- For each duplicate, migrate tasks and delete the dup
        FOR i IN 2..array_length(dup_record.tag_ids, 1) LOOP
            dup_id := dup_record.tag_ids[i];

            -- Migrate tasks referencing the duplicate tag to the keeper
            UPDATE tasks
            SET tag_id = keeper_id,
                updated_at = now()
            WHERE tag_id = dup_id
              AND user_id = dup_record.user_id;

            -- Delete the duplicate tag
            DELETE FROM tags
            WHERE id = dup_id
              AND user_id = dup_record.user_id;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================
-- STEP 2: Normalize existing tag names (trim whitespace)
-- ============================================================

UPDATE tags
SET name = trim(name),
    updated_at = now()
WHERE name != trim(name);

-- ============================================================
-- STEP 3: Add unique constraint on (user_id, name)
-- ============================================================

-- Use a unique index for better control (supports case-insensitive if needed)
-- This uses simple byte comparison which is sufficient with normalized names
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_name_unique
    ON tags (user_id, lower(trim(name)));

-- Verify no duplicates remain
DO $$
DECLARE
    dup_count INTEGER;
BEGIN
    SELECT count(*) INTO dup_count
    FROM (
        SELECT user_id, lower(trim(name)), count(*)
        FROM tags
        GROUP BY user_id, lower(trim(name))
        HAVING count(*) > 1
    ) sub;

    IF dup_count > 0 THEN
        RAISE EXCEPTION 'Duplicate tags still exist: % groups found', dup_count;
    END IF;
END $$;

-- ============================================================
-- STEP 4: Update new-user-setup to use upsert-safe insert
-- ============================================================
-- Note: setupNewUser() in src/lib/supabase/new-user-setup.ts
-- now checks existing tags before inserting, making it safe.
-- The unique index makes it impossible to create duplicates even
-- under race conditions.

-- ============================================================
-- VERIFICATION QUERIES (run after applying):
-- ============================================================
-- -- Check for remaining duplicates:
-- SELECT user_id, lower(trim(name)) AS norm_name, count(*)
-- FROM tags
-- GROUP BY user_id, lower(trim(name))
-- HAVING count(*) > 1;
--
-- -- Check unique index exists:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'tags' AND indexname = 'idx_tags_user_name_unique';
