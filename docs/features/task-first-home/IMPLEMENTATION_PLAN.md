# IMPLEMENTATION PLAN: Task-First Home

## Phase 0: Baseline & Specs ✅
- Read all key files, run baselines
- Create spec docs
- Branch: `feat/task-first-home`

## Phase 1: Route & Navigation
- Change root redirect `/` → `/schedule` (was `/calendar`)
- Create `/schedule` page route
- Reorder nav: 日程, 日历, 习惯, 复盘, 统计, 设置
- Move Inbox to secondary nav or schedule page
- Mobile nav: 日程, 日历, 习惯, 复盘, 设置 (5 items)

## Phase 2: Schedule Page Core
- `src/app/schedule/page.tsx` — main page
- `src/components/schedule/schedule-header.tsx` — greeting + date + stats
- `src/components/schedule/quick-add-task.tsx` — inline quick-add
- `src/components/schedule/schedule-view-switcher.tsx` — 今天|近期|全部|按分类
- Data layer: reuse existing repos, no new tables

## Phase 3: Task List Components
- `src/components/schedule/time-period-section.tsx` — morning/afternoon/evening
- `src/components/schedule/task-list-item.tsx` — reusable task card
- `src/components/schedule/today-focus.tsx` — focus area
- `src/components/schedule/overdue-section.tsx` — overdue handling
- `src/components/schedule/upcoming-tasks.tsx` — future preview
- `src/components/schedule/inbox-section.tsx` — inbox in schedule

## Phase 4: Side Detail Panel (Desktop)
- `src/components/schedule/task-detail-panel.tsx` — right side panel
- Inline editing for simple fields
- Auto-save with debounce
- Reuse subtask, recurrence, reminder components

## Phase 5: Mobile Detail Page
- `src/app/tasks/[id]/page.tsx` — full-screen task detail
- Back navigation, inline editing
- No dialog for task editing on mobile

## Phase 6: Full List & Category Views
- "近期" — time-grouped upcoming tasks
- "全部" — all tasks with search/filter
- "按分类" — tag-grouped (reuse existing components)

## Phase 7: Calendar Integration
- Calendar page uses same detail panel
- Calendar "新建" uses same quick-add flow
- Data consistency between schedule and calendar

## Phase 8: Visual Polish
- Page background layers
- Card hierarchy, tag color strips
- Completion feedback animation
- Empty states, dark mode

## Phase 9: Tests & Docs
- Unit tests for new utilities
- Playwright E2E
- Update README, PROJECT_STATUS, DECISIONS
- Git commit & push

## Files to Create (~15 new)
- schedule page + components
- task detail panel
- mobile task detail page

## Files to Modify (~8 existing)
- Root page redirect
- Nav data
- Calendar page (detail integration)
- TaskEditDialog (keep for backward compat)
- Layout/shell if needed
