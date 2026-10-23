# Migration 冲突和习惯页面崩溃 — 修复记录

## 问题现象

1. **Migration 008 报错**: 执行 `008_focus_timer_mode.sql` 时出现 `ERROR: 42710: constraint "chk_focus_timer_mode" for relation "focus_sessions" already exists`
2. **习惯页面崩溃**: 生产网页中"习惯"页面显示 "This page couldn't load"

---

## 阶段一：仓库检查结果

### Migration 文件分析

| 文件 | 原状态 | 问题 |
|------|--------|------|
| `007_difficulty_due_at.sql` | 使用 `ADD COLUMN IF NOT EXISTS` 但 inline CHECK 不可独立检查 | 部分执行后无法安全重跑 |
| `008_focus_timer_mode.sql` | `ADD CONSTRAINT` 无 `IF NOT EXISTS` | **根因：重跑时报 42710** |
| `009_measurement_type_add_minutes_hours.sql` | DO 块删除旧约束+创建新约束 | 基本安全但缺少存在性检查 |

### 代码检查结果

- **habits 页面组件**: `src/app/habits/page.tsx` + `src/components/habits/habit-checkin.tsx`
- **home 页习惯组件**: `src/components/habits/home-habits-summary.tsx`
- **类型定义**: `MeasurementType = 'boolean' | 'count' | 'duration' | 'minutes' | 'hours' | 'numeric'`
- **Supabase Repository**: `src/lib/repositories/supabase-impl.ts` — 无数据验证/转换层
- **IndexedDB Repository**: `src/lib/repositories/indexeddb-impl.ts` — 无数据验证/转换层

### 发现的问题

1. ⚠️ 无 `error.tsx` 错误边界：运行时渲染错误导致 Next.js 默认 "This page couldn't load"
2. ⚠️ `HabitCheckin` 组件未处理 `useQuery` 错误状态（只检查 `isLoading`）
3. ⚠️ `HomeHabitsSummary` 组件同样未处理查询错误状态
4. ⚠️ Supabase client 创建时检查 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`，但 auth-provider 只检查前者（两者不一致）

---

## 阶段二：生产 Supabase 诊断 SQL

**请在 Supabase SQL Editor 中执行以下完整诊断脚本，将全部结果返回给我。**

```sql
-- ============================================================
-- 诊断脚本：Migration 007/008/009 生产状态检查（全部只读）
-- ============================================================

-- 1. focus_sessions 所有约束
SELECT '--- focus_sessions constraints ---' AS section;
SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public' AND rel.relname = 'focus_sessions'
ORDER BY con.conname;

-- 2. focus_sessions.timer_mode 列信息
SELECT '--- focus_sessions.timer_mode column ---' AS section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'focus_sessions'
  AND column_name = 'timer_mode';

-- 3. focus_sessions 中 timer_mode 实际值分布
SELECT '--- focus_sessions.timer_mode values ---' AS section;
SELECT timer_mode, count(*) AS cnt FROM focus_sessions GROUP BY timer_mode;

-- 4. tasks 所有约束（检查 difficulty）
SELECT '--- tasks constraints ---' AS section;
SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public' AND rel.relname = 'tasks'
  AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%difficulty%'
ORDER BY con.conname;

-- 5. tasks.difficulty 列信息
SELECT '--- tasks.difficulty column ---' AS section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tasks'
  AND column_name = 'difficulty';

-- 6. tasks.due_at 列信息
SELECT '--- tasks.due_at column ---' AS section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tasks'
  AND column_name = 'due_at';

-- 7. habits 所有约束（检查 measurement_type）
SELECT '--- habits constraints ---' AS section;
SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public' AND rel.relname = 'habits'
  AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%measurement_type%'
ORDER BY con.conname;

-- 8. habits.measurement_type 实际值分布
SELECT '--- habits.measurement_type values ---' AS section;
SELECT measurement_type, count(*) AS cnt FROM habits GROUP BY measurement_type;

-- 9. 检查是否有不符合目标约束的历史数据
SELECT '--- habits with unexpected measurement_type ---' AS section;
SELECT id, name, measurement_type, created_at
FROM habits
WHERE measurement_type NOT IN ('boolean', 'count', 'duration', 'minutes', 'hours', 'numeric');

-- 10. 检查 habits 数据总数
SELECT '--- habits total count ---' AS section;
SELECT count(*) AS total_habits FROM habits;
SELECT count(*) AS active_habits FROM habits WHERE archived_at IS NULL;
```

---

## 阶段三：Migration 修复详情

### Migration 008 修复

**根因**: PostgreSQL 的 `ALTER TABLE ... ADD CONSTRAINT` 不支持 `IF NOT EXISTS` 语法。当 migration 已执行时重复运行会报错 `42710`。

**修复**: 使用 `DO $$ ... $$` 块检查 `pg_constraint` 是否存在 `chk_focus_timer_mode`，仅当不存在时创建。

**关键改动**:
- `ADD COLUMN IF NOT EXISTS timer_mode TEXT` → 先添加可空列
- `UPDATE ... SET timer_mode = 'countdown' WHERE timer_mode IS NULL` → 回填已存在行
- 用 DO 块设置 NOT NULL（捕获已设置的异常）
- 用 DO 块条件添加 CHECK 约束
- `CREATE INDEX IF NOT EXISTS` → 不变

### Migration 007 修复

**问题**: 原 migration 使用 inline CHECK（`ADD COLUMN ... CHECK (...)`），PostgreSQL 自动生成约束名。如果 column 通过 `IF NOT EXISTS` 跳过，则 CHECK 也跳过。无法保证约束存在。

**修复**:
- 先 `ADD COLUMN IF NOT EXISTS`（无 CHECK）
- `UPDATE ... SET difficulty = 'medium' WHERE difficulty IS NULL`
- DO 块设置 NOT NULL
- DO 块条件创建命名约束 `chk_tasks_difficulty`（先清理可能的旧自动命名约束）

### Migration 009 修复

**改进**:
- DO 块删除旧约束前检查是否存在
- DO 块创建新约束前检查 `chk_habits_measurement_type` 是否已存在
- 新增数据验证：检查是否有不符合目标约束的历史数据并 WARNING

---

## 阶段四：习惯页面崩溃修复

### 修复内容

1. **新增 `src/app/habits/error.tsx`**: Next.js App Router 错误边界
   - 显示中文错误信息
   - 提供"重试"按钮
   - 记录错误 digest 用于 Vercel 日志追踪

2. **新增 `src/app/habits/loading.tsx`**: 加载骨架屏
   - 避免数据加载时的空白闪烁

3. **`habit-checkin.tsx`**: 新增查询错误状态处理
   - 解构 `isError` 和 `error` 从 `useQuery`
   - 添加 `retry` 配置（PGRST 错误不重试）
   - 新增错误状态 UI：显示错误摘要 + 重试按钮

4. **`home-habits-summary.tsx`**: 新增查询错误状态处理
   - 解构 `isError` 从 `useQuery`
   - 静默降级：显示"加载失败"标记，不破坏首页布局

---

## 阶段五：生产 Supabase 修复 SQL

**请先执行上述诊断 SQL，将结果反馈后，再执行以下修复 SQL。**

以下 SQL 可安全重复执行（幂等），不会删除任何数据：

```sql
-- ============================================================
-- 修复 SQL：应用 migration 007 改动（幂等，安全重复执行）
-- ============================================================
BEGIN;

-- 1. 添加列（如果不存在）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;

-- 2. 回填 NULL 值
UPDATE tasks SET difficulty = 'medium' WHERE difficulty IS NULL;

-- 3. 设置 NOT NULL 和默认值
DO $$ BEGIN
    ALTER TABLE tasks ALTER COLUMN difficulty SET NOT NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'difficulty already NOT NULL';
END $$;
ALTER TABLE tasks ALTER COLUMN difficulty SET DEFAULT 'medium';

-- 4. 条件创建 CHECK 约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'tasks' AND con.conname = 'chk_tasks_difficulty'
    ) THEN
        -- 删除可能的旧自动命名约束
        BEGIN
            EXECUTE (SELECT 'ALTER TABLE tasks DROP CONSTRAINT ' || quote_ident(con.conname)
                FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid
                WHERE rel.relname = 'tasks' AND con.contype = 'c'
                  AND con.conname != 'chk_tasks_difficulty'
                  AND pg_get_constraintdef(con.oid) LIKE '%difficulty%' LIMIT 1);
        EXCEPTION WHEN others THEN RAISE NOTICE 'No old difficulty constraint';
        END;
        ALTER TABLE tasks ADD CONSTRAINT chk_tasks_difficulty
            CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard'));
    END IF;
END $$;

-- 5. 迁移 priority → difficulty（仅更新仍为默认值的行）
UPDATE tasks SET difficulty = 'easy' WHERE priority = 'low' AND difficulty = 'medium';
UPDATE tasks SET difficulty = 'hard' WHERE priority = 'high' AND difficulty = 'medium';
UPDATE tasks SET difficulty = 'very_hard' WHERE priority = 'urgent' AND difficulty = 'medium';

-- 6. 索引和注释
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(user_id, due_at) WHERE due_at IS NOT NULL;
COMMENT ON COLUMN tasks.priority IS 'Legacy priority field — superseded by difficulty.';

COMMIT;

-- ============================================================
-- 修复 SQL：应用 migration 008 改动（幂等，安全重复执行）
-- ============================================================
BEGIN;

ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS timer_mode TEXT;
UPDATE focus_sessions SET timer_mode = 'countdown' WHERE timer_mode IS NULL;

DO $$ BEGIN
    ALTER TABLE focus_sessions ALTER COLUMN timer_mode SET NOT NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'timer_mode already NOT NULL';
END $$;

ALTER TABLE focus_sessions ALTER COLUMN timer_mode SET DEFAULT 'countdown';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'focus_sessions' AND con.conname = 'chk_focus_timer_mode'
    ) THEN
        ALTER TABLE focus_sessions ADD CONSTRAINT chk_focus_timer_mode
            CHECK (timer_mode IN ('countdown', 'stopwatch'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_focus_sessions_timer_mode
ON focus_sessions(user_id, timer_mode);

COMMIT;

-- ============================================================
-- 修复 SQL：应用 migration 009 改动（幂等，安全重复执行）
-- ============================================================
BEGIN;

-- 删除旧约束（如果存在且有 measurement_type 定义）
DO $$
DECLARE cname text;
BEGIN
    SELECT con.conname INTO cname FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'habits' AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%measurement_type%'
      AND con.conname != 'chk_habits_measurement_type'
    ORDER BY con.conname LIMIT 1;

    IF cname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE habits DROP CONSTRAINT %I', cname);
        RAISE NOTICE 'Dropped old constraint: %', cname;
    END IF;
END $$;

-- 创建新约束（如不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'habits' AND con.conname = 'chk_habits_measurement_type'
    ) THEN
        ALTER TABLE habits ADD CONSTRAINT chk_habits_measurement_type
            CHECK (measurement_type IN ('boolean', 'count', 'duration', 'minutes', 'hours', 'numeric'));
        RAISE NOTICE 'Created chk_habits_measurement_type';
    ELSE
        RAISE NOTICE 'chk_habits_measurement_type already exists';
    END IF;
END $$;

-- 验证数据
DO $$
DECLARE bad_count integer;
BEGIN
    SELECT count(*) INTO bad_count FROM habits
    WHERE measurement_type NOT IN ('boolean', 'count', 'duration', 'minutes', 'hours', 'numeric');
    IF bad_count > 0 THEN
        RAISE WARNING 'Found % rows with unexpected measurement_type', bad_count;
    ELSE
        RAISE NOTICE 'All habits have valid measurement_type';
    END IF;
END $$;

COMMENT ON COLUMN habits.measurement_type IS 'Measurement type: boolean, count, duration, minutes, hours, numeric';

COMMIT;

-- ============================================================
-- 验证查询（执行修复后运行）
-- ============================================================
SELECT '--- Post-fix verification ---' AS section;

SELECT 'focus_sessions timer_mode constraint' AS item,
       con.conname, pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'focus_sessions' AND con.conname = 'chk_focus_timer_mode';

SELECT 'tasks difficulty constraint' AS item,
       con.conname, pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'tasks' AND con.conname = 'chk_tasks_difficulty';

SELECT 'habits measurement_type constraint' AS item,
       con.conname, pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'habits' AND con.conname = 'chk_habits_measurement_type';
```

---

## 状态跟踪

| 项目 | 状态 |
|------|------|
| Migration 007 修复 | ✅ 已修改为幂等版本 |
| Migration 008 修复 | ✅ 已修改为幂等版本 |
| Migration 009 修复 | ✅ 已修改为幂等版本 |
| habits/error.tsx | ✅ 已创建 |
| habits/loading.tsx | ✅ 已创建 |
| HabitCheckin 错误处理 | ✅ 已添加 |
| HomeHabitsSummary 错误处理 | ✅ 已添加 |
| 生产诊断 SQL | ✅ 已生成 |
| 生产修复 SQL | ✅ 已生成 |
| 代码质量检查 | ⏳ 待运行 |
| Git 提交推送 | ⏳ 待执行 |
| 生产 Supabase migration 应用 | 🔴 待用户执行诊断和修复 SQL |
| Vercel 部署验证 | 🔴 待用户验证 |
