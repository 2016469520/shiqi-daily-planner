-- ============================================================
-- 我的计划日历 — Fix signup 500 error
-- Run this in Supabase SQL Editor (https://fnxlpiilnsyvjdxeeime.supabase.co)
-- ============================================================

-- ============================================================
-- OPTION A (Recommended): Drop the trigger entirely
-- The app now handles new user setup via setupNewUser() in
-- src/lib/supabase/new-user-setup.ts, which is called after
-- successful signup. This is more robust because:
--   - App has full control over error handling
--   - No dependency on PostgreSQL trigger execution context
--   - Upsert semantics are safe to retry
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Verify
SELECT 'Trigger removed — signup should now work' AS status;

-- ============================================================
-- OPTION B (Alternative): Re-create trigger with search_path fix
-- Uncomment below if you prefer database-level setup.
-- ============================================================

/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = 'public'
SECURITY DEFINER
AS $$
DECLARE
    default_tags JSONB;
    tag JSONB;
BEGIN
    -- Create profile
    INSERT INTO profiles (id, display_name, timezone)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            split_part(NEW.email, '@', 1)
        ),
        'Asia/Shanghai'
    );

    -- Create default preferences
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id);

    -- Create default tags
    default_tags := '[
        {"name": "学习", "color": "#3b82f6", "icon": "BookOpen"},
        {"name": "科研", "color": "#8b5cf6", "icon": "FlaskConical"},
        {"name": "工作", "color": "#f59e0b", "icon": "Briefcase"},
        {"name": "运动", "color": "#10b981", "icon": "Dumbbell"},
        {"name": "生活", "color": "#ec4899", "icon": "Heart"},
        {"name": "休息", "color": "#6b7280", "icon": "Moon"},
        {"name": "社交", "color": "#06b6d4", "icon": "Users"},
        {"name": "其他", "color": "#94a3b8", "icon": "Ellipsis"}
    ]'::JSONB;

    FOR i IN 0..jsonb_array_length(default_tags) - 1 LOOP
        tag := default_tags->i;
        INSERT INTO tags (user_id, name, color, icon, is_default, is_visible, sort_order)
        VALUES (
            NEW.id,
            tag->>'name',
            tag->>'color',
            tag->>'icon',
            true,
            true,
            i
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/
