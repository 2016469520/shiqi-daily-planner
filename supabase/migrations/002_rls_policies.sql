-- ============================================================
-- 我的计划日历 — RLS Policies
-- Run AFTER creating tables and AFTER creating users
-- ============================================================

-- Enable RLS on all user-data tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_subitems ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================
-- tags
-- ============================================================
CREATE POLICY "Users can read own tags"
    ON tags FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tags"
    ON tags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
    ON tags FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
    ON tags FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- tasks
-- ============================================================
CREATE POLICY "Users can read own tasks"
    ON tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
    ON tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
    ON tasks FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- task_subitems
-- ============================================================
CREATE POLICY "Users can read own subitems"
    ON task_subitems FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subitems"
    ON task_subitems FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subitems"
    ON task_subitems FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subitems"
    ON task_subitems FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- recurrence_exceptions
-- ============================================================
CREATE POLICY "Users can read own recurrence exceptions"
    ON recurrence_exceptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurrence exceptions"
    ON recurrence_exceptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurrence exceptions"
    ON recurrence_exceptions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- habits
-- ============================================================
CREATE POLICY "Users can read own habits"
    ON habits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits"
    ON habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
    ON habits FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
    ON habits FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- habit_logs
-- ============================================================
CREATE POLICY "Users can read own habit logs"
    ON habit_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habit logs"
    ON habit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit logs"
    ON habit_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs"
    ON habit_logs FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- daily_reviews
-- ============================================================
CREATE POLICY "Users can read own reviews"
    ON daily_reviews FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reviews"
    ON daily_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
    ON daily_reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================
-- task_templates
-- ============================================================
CREATE POLICY "Users can read own templates"
    ON task_templates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
    ON task_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
    ON task_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
    ON task_templates FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- user_preferences
-- ============================================================
CREATE POLICY "Users can read own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================
-- NEW USER TRIGGER: Auto-create profile and default tags
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_tags JSONB;
    tag JSONB;
BEGIN
    -- Create profile
    INSERT INTO profiles (id, display_name, timezone)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 'Asia/Shanghai');

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
