-- ============================================================
-- 我的计划日历 — Database Migration 001
-- ============================================================

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ---------- Helper: updated_at trigger ----------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- TABLES
-- ============================================================

-- ---------- profiles ----------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------- tags ----------
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    icon TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_user_sort ON tags(user_id, sort_order);

CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------- tasks ----------
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_date DATE NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('morning', 'afternoon', 'evening')),
    start_time TIME,
    end_time TIME,
    tag_id UUID REFERENCES tags(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
    estimated_minutes INT,
    actual_minutes INT,
    reminder_at TIMESTAMPTZ,
    recurrence_rule JSONB,
    recurrence_parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    order_index INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_date ON tasks(user_id, task_date);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_date_period ON tasks(user_id, task_date, period);
CREATE INDEX idx_tasks_tag_id ON tasks(tag_id);
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------- task_subitems ----------
CREATE TABLE task_subitems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_subitems_task_id ON task_subitems(task_id);
CREATE INDEX idx_task_subitems_user_id ON task_subitems(user_id);

CREATE TRIGGER update_task_subitems_updated_at
    BEFORE UPDATE ON task_subitems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------- recurrence_exceptions ----------
CREATE TABLE recurrence_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('skip', 'modify')),
    modified_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(task_id, exception_date)
);

CREATE INDEX idx_recurrence_exceptions_task_id ON recurrence_exceptions(task_id);
CREATE INDEX idx_recurrence_exceptions_user_id ON recurrence_exceptions(user_id);

-- ---------- habits ----------
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#3b82f6',
    measurement_type TEXT NOT NULL DEFAULT 'boolean' CHECK (measurement_type IN ('boolean', 'count', 'duration', 'numeric')),
    target_value NUMERIC NOT NULL DEFAULT 1,
    unit TEXT,
    schedule_rule JSONB NOT NULL DEFAULT '{"frequency": "daily", "interval": 1}',
    reminder_time TIME,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_habits_user_id ON habits(user_id);

CREATE TRIGGER update_habits_updated_at
    BEFORE UPDATE ON habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------- habit_logs ----------
CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, habit_id, log_date)
);

CREATE INDEX idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_date ON habit_logs(log_date);
CREATE INDEX idx_habit_logs_user_habit_date ON habit_logs(user_id, habit_id, log_date);

CREATE TRIGGER update_habit_logs_updated_at
    BEFORE UPDATE ON habit_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------- daily_reviews ----------
CREATE TABLE daily_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    review_date DATE NOT NULL,
    score INT CHECK (score >= 1 AND score <= 10),
    subjective_completion INT CHECK (subjective_completion >= 0 AND subjective_completion <= 100),
    mood INT CHECK (mood >= 1 AND mood <= 5),
    energy INT CHECK (energy >= 1 AND energy <= 5),
    achievement TEXT,
    unfinished TEXT,
    problems TEXT,
    lessons TEXT,
    tomorrow_focus TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, review_date)
);

CREATE INDEX idx_daily_reviews_user_id ON daily_reviews(user_id);
CREATE INDEX idx_daily_reviews_date ON daily_reviews(review_date);
CREATE INDEX idx_daily_reviews_user_date ON daily_reviews(user_id, review_date);

CREATE TRIGGER update_daily_reviews_updated_at
    BEFORE UPDATE ON daily_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------- task_templates ----------
CREATE TABLE task_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_templates_user_id ON task_templates(user_id);

CREATE TRIGGER update_task_templates_updated_at
    BEFORE UPDATE ON task_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------- user_preferences ----------
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    accent_color TEXT NOT NULL DEFAULT '#3b82f6',
    default_calendar_view TEXT NOT NULL DEFAULT 'month' CHECK (default_calendar_view IN ('month', 'week', 'day')),
    week_starts_on INT NOT NULL DEFAULT 0 CHECK (week_starts_on IN (0, 1, 6)),
    timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    notification_enabled BOOLEAN NOT NULL DEFAULT true,
    compact_mode BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
