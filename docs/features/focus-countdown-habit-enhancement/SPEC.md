# SPEC.md — Focus, Countdown, and Habit Enhancement

## Overview

This specification covers bug fixes, two new features (Countdown Days and Focus Timer), habit sample improvements, and main page integration for the 我的计划日历 (My Plan Calendar) application.

## 1. Existing Bugs to Fix

### 1.1 Completion Rate Cannot Be Set to 0

**Root Cause Analysis**: The `ScoreSelect` component in `daily-review-form.tsx` generates options starting from `step` (e.g., `[10, 20, 30, ..., 100]` for completion rate with step=10). Zero is NOT included in the option list. The user cannot select 0 for subjective_completion.

**Additional falsy-value issues to audit**:
- `estimated_minutes` save logic
- `actual_minutes` save logic
- Habit log `value` field
- Any `value || defaultValue` patterns that incorrectly treat 0 as falsy

### 1.2 Tag Selection Shows Source Code

Tags displayed in selectors may show raw object content or React component source.

**Areas to check**:
- `SelectValue` rendering of SelectItem children in shadcn/ui v4
- Tag color dot rendering
- Tag icon field rendering
- Mobile Drawer vs Desktop Dialog rendering differences

### 1.3 Global Source Code Display Audit

Search for and fix any instances of:
- `[object Object]` in rendered output
- React component source code in DOM
- JSON string visible to users
- Function.toString() output

## 2. Countdown Days Feature

### 2.1 Product Positioning

Countdown days track important events with target dates:
- Thesis submission deadline
- Exam dates
- Project milestones
- Birthdays
- Anniversaries
- Travel dates
- Contract deadlines

### 2.2 Data Model

New table: `countdowns`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users |
| title | TEXT | Event name |
| target_date | DATE | Target date |
| description | TEXT | Optional |
| color | TEXT | Hex color |
| icon | TEXT | Lucide icon name |
| category | TEXT | Optional grouping |
| is_yearly | BOOLEAN | For annual repeats (birthdays) |
| linked_task_id | UUID | Optional FK to tasks |
| show_on_home | BOOLEAN | Show on schedule page |
| is_pinned | BOOLEAN | Pin to top |
| sort_order | INT | Display order |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| archived_at | TIMESTAMPTZ | Soft delete |

### 2.3 Date Calculation Rules

- Future dates: show "还有 N 天" (N days remaining)
- Today: show "就是今天" (It's today)
- Past dates (non-yearly): show "已过去 N 天" (N days past)
- Yearly repeats: calculate next occurrence date
- All calculations use local date (not UTC) to avoid timezone offset

### 2.4 Repository Support

- Both Supabase and IndexedDB implementations
- Offline queue support
- JSON import/export
- Full CRUD + archive + reorder + pin

## 3. Focus Timer Feature

### 3.1 Product Positioning

Focus timer for timed work sessions linked to tasks or standalone.

### 3.2 Data Model

New tables: `focus_sessions`, focus preferences in `user_preferences`

#### focus_sessions

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users |
| task_id | UUID | Optional FK to tasks |
| title | TEXT | Session title |
| mode | TEXT | 'focus', 'short_break', 'long_break' |
| planned_minutes | INT | Planned duration |
| actual_seconds | INT | Actual elapsed seconds |
| started_at | TIMESTAMPTZ | |
| paused_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |
| cancelled_at | TIMESTAMPTZ | |
| status | TEXT | 'ready', 'running', 'paused', 'completed', 'cancelled' |
| pause_count | INT | |
| note | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 3.3 Timer Design

- Use wall-clock timestamps (target_end - now), NOT setInterval accumulation
- Handles tab switching, page freeze, mobile lock screen
- Single active session at a time

### 3.4 Task Linkage

- Start focus from task cards, task detail panel, calendar
- Optionally accumulate actual_seconds to task.actual_minutes
- Task cards show today's focus minutes

## 4. Habit Samples

### 4.1 Recommended Habits

1. **运动 (Exercise)** — duration, 30 min target, 5 days/week
2. **喝水 (Water)** — count, 8 cups target, daily
3. **睡眠 (Sleep)** — duration, 8 hours target, daily
4. **阅读 (Reading)** — duration, 30 min target, daily
5. **早起 (Early Rise)** — boolean, daily

### 4.2 Idempotent Initialization

- Stable template IDs for deduplication
- Check by template_id before creating
- Deleted samples don't auto-restore
- Work with both Supabase and IndexedDB

## 5. Main Page Layout

Schedule remains the primary content. Focus, countdown, and habits are compact auxiliary areas.

### Desktop: 3-column layout
```
Left Nav | Center: Schedule | Right: Focus/Countdown/Habits
```

### Mobile: Single column
```
Greeting → Quick Add → Today Focus → Focus Timer → Morning → Afternoon → Evening → Countdowns → Habits → Overdue → Upcoming
```

## 6. Acceptance Criteria

See UI_ACCEPTANCE.md for detailed criteria.
