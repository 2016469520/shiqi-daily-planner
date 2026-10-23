-- Migration 009: Add 'minutes' and 'hours' to habits.measurement_type CHECK constraint
-- The app now supports measurement_type 'minutes' and 'hours' in addition to the original four.
-- This migration alters the CHECK constraint to add these two new values.
-- Idempotent: safe to re-run even if partially or fully applied.

BEGIN;

-- 1. Drop any old CHECK constraint on measurement_type
--    (the original migration 001 inline CHECK has an auto-generated name)
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find ANY constraint on habits.measurement_type (old or new name)
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'habits'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%measurement_type%'
    ORDER BY con.conname -- prefer dropping older/auto-named constraints first
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE habits DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No measurement_type constraint found to drop';
    END IF;
END $$;

-- 2. Add the new CHECK constraint with all six values
--    Only if it doesn't already exist (handles the fully-applied case)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'habits'
          AND con.conname = 'chk_habits_measurement_type'
    ) THEN
        ALTER TABLE habits ADD CONSTRAINT chk_habits_measurement_type
            CHECK (measurement_type IN ('boolean', 'count', 'duration', 'minutes', 'hours', 'numeric'));
        RAISE NOTICE 'Created constraint: chk_habits_measurement_type';
    ELSE
        -- Constraint exists — verify its definition is correct
        RAISE NOTICE 'Constraint chk_habits_measurement_type already exists';
    END IF;
END $$;

-- 3. Verify existing data satisfies the new constraint
--    Report any rows that would violate (should never happen, but diagnostic)
DO $$
DECLARE
    bad_count integer;
BEGIN
    SELECT count(*) INTO bad_count
    FROM habits
    WHERE measurement_type NOT IN ('boolean', 'count', 'duration', 'minutes', 'hours', 'numeric');

    IF bad_count > 0 THEN
        RAISE WARNING 'Found % habit(s) with unexpected measurement_type values', bad_count;
    ELSE
        RAISE NOTICE 'All existing habit rows have valid measurement_type values';
    END IF;
END $$;

-- 4. Comment for documentation
COMMENT ON COLUMN habits.measurement_type IS 'Measurement type: boolean, count, duration, minutes, hours, numeric';

COMMIT;
