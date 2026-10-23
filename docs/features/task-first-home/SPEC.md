# SPEC: Task-First Home Redesign

## Why

The current app is calendar-centric:
- Default route `/` redirects to `/calendar`
- Primary nav starts with "日历"
- Users must navigate to a specific date to see tasks
- Creating/editing tasks requires dialogs
- The calendar grid dominates even when users just want to see their tasks

## New Information Architecture

### Primary
**日程** (`/schedule`) — default landing page
> "What should I do now and next?"

### Secondary  
**日历** (`/calendar`) — time distribution view
> "How are my tasks distributed across time?"

### Supporting
- **习惯** (`/habits`) — habit tracking
- **复盘** (`/reviews`) — review history
- **统计** (`/insights`) — analytics
- **设置** (`/settings`) — preferences

## Navigation

### Desktop sidebar order
1. 日程 (Schedule)
2. 日历 (Calendar)
3. 习惯 (Habits)
4. 复盘 (Reviews)
5. 统计 (Insights)
6. 设置 (Settings)

Inbox: accessible from schedule page or secondary nav

### Mobile bottom nav (5 items)
1. 日程
2. 日历
3. 习惯
4. 复盘
5. 设置

Stats: accessible from reviews page or more menu

## Schedule Page Structure

### Top Overview (compact)
- Time-based greeting (早上好/下午好/晚上好)
- Date + weekday
- Today's task count: "还有 N 项计划"
- Completion: done/total + mini progress ring
- Overdue count if any
- Next upcoming task hint

### Quick Add
- Inline input: "+ 添加一项计划……"
- Expands inline on focus (NOT a dialog)
- Fields: title (required), date, period, tag, priority
- Enter to save, Esc to cancel
- Mobile: keyboard-aware

### Today Focus
- Up to 3 high-priority/urgent tasks highlighted
- Stronger visual weight but not garish
- Priority-derived by default

### Today Tasks by Period
- 上午 / 下午 / 晚上 sections
- Task cards with: checkbox, title, tag color strip, priority icon, time, subtask progress, indicators
- Inline completion (checkbox)
- Click to open detail panel (desktop) or full page (mobile)
- Drag to reorder within/between periods

### Overdue
- Past-date incomplete tasks
- Actions: move to today, move to tomorrow, pick date, complete, cancel
- Hidden when empty

### Upcoming
- Tomorrow, next 7 days, later
- Compact preview
- "查看更多" to expand

### Inbox
- Tasks without date
- Compact entry: "收集箱 N"
- Expand to set date/period/tag, complete, delete

## Task Detail: No More Dialogs

### Desktop
- Right-side fixed panel (side panel)
- Left list stays visible
- Click different task → panel updates
- Fields: inline editable (title, status, tag, priority, date, period, estimated time)
- Complex: recurrence, subtasks, reminders in expanded sections
- Auto-save with debounce
- Delete: confirmation dialog only

### Mobile
- Full-screen page or full sheet
- Back button at top
- Same inline editing
- Fixed bottom action area
- No drawer-in-drawer

## Dialog Reduction Policy
- ❌ No dialog for: create task, edit task, view task, change status, change tag
- ✅ Dialog only for: delete task, delete tag, irreversible operations, import overwrite

## Views within Schedule Page
Toggle: 今天 | 近期 | 全部 | 按分类

- **今天**: Focus + periods + overdue + upcoming + inbox
- **近期**: Today → tomorrow → this week → next week → later
- **全部**: All tasks with search, filter, sort
- **按分类**: Tag-grouped with time buckets (reuse existing category view)

## Calendar Page (Preserved)
- Month, week, day views remain
- Drag-and-drop remains
- Task clicks use same detail panel/page system
- New task uses same quick-add system

## Out of Scope
- Kanban board view
- Gantt chart
- Team/collaboration features
- AI task suggestions
- External calendar sync (Google, Outlook)
- Full redesign of settings/habits/reviews pages

## Acceptance Criteria
1. Login lands on `/schedule`, not `/calendar`
2. First nav item is "日程"
3. Quick-add does not open a dialog
4. Desktop: clicking task opens right panel
5. Mobile: clicking task opens full-screen detail
6. Calendar still fully functional at `/calendar`
7. All existing data intact
8. TypeScript 0 errors, ESLint 0 errors
9. All tests pass, build succeeds
