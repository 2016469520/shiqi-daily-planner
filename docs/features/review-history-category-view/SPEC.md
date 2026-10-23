# SPEC: Daily Review History & Category Task View

## User Problem

1. After saving a daily review, users can only see today's review on the Today page. They cannot browse, search, or analyze past reviews.
2. Tasks are only viewable by time (month/week/day). Users with many tagged tasks cannot see their workload grouped by category.
3. The current UI feels monotonous with insufficient visual hierarchy and interaction feedback.

## Feature Scope

### In Scope
- **Daily Review History**: Calendar month view + timeline list view of all past reviews
- **Review Detail**: View full review details, edit, delete with confirmation
- **Review Summary Stats**: Monthly averages, streaks
- **Category Task View**: Present tasks grouped by tag, with time-based sub-groups
- **Cross-category Move**: Drag tasks between categories (desktop) + menu action (mobile)
- **Visual Polish**: Design variables, welcome area, card hierarchy, progress indicators, empty states, micro-interactions, dark mode checks

### Out of Scope
- Charts/graphs for review trends (statistical summaries only)
- AI-powered review suggestions
- Export review data as report
- Custom category views (beyond tag-based grouping)
- Full redesign/brand refresh
- Weather API or external data integration
- New database tables (reuse existing schema)

## User Flows

### Review History
1. Navigate to /reviews from sidebar (desktop) or Today page "View History" link (mobile)
2. See monthly summary stats at top
3. Toggle between calendar and timeline modes
4. Calendar: Click date to view/edit review, or create review for blank dates
5. Timeline: Scroll through reviews, filter by month/score/mood/text
6. Click review to open detail drawer/dialog
7. Edit or delete from detail view

### Category View
1. On calendar page, toggle "按时间" / "按分类" mode
2. In category mode, see tasks grouped by tag + "未分类" section
3. Each category shows header with stats, tasks in time buckets
4. Click task to open existing TaskEditDialog
5. Click "新建" to create task with tag pre-selected
6. Desktop: Drag tasks between categories
7. Mobile: Use "移动到分类" menu action

## Data Requirements

### Review History
- Reuse `IDailyReviewRepository.getByDate()` and `getByDateRange()`
- No new database tables needed
- Pagination via limit/offset on getByDateRange
- Delete via upsert with cleared fields or new `delete` method

### Category View
- Reuse `ITaskRepository.getByDateRange()` and `filter()`
- Group tasks client-side by tag_id
- No data duplication

## Route Design

- `/reviews` — Review history page (new)
- Existing routes unchanged
- Category view is a presentation mode within `/calendar`, not a new route

## Desktop vs Mobile

### Desktop
- Sidebar: Add "复盘记录" nav item in secondary section
- Category view: 2-3 column grid or single-column list (toggleable)
- Review detail: Side drawer

### Mobile
- Entry: "View History" link on Today page review card header + Insights page
- Category view: Horizontal tag selector or accordion
- Review detail: Full-screen page or bottom sheet
- Bottom nav: Keep 5 items, do NOT add 6th

## Edge Cases & Empty States

- No reviews yet: Show empty state with "写下今天的评价" CTA
- Filter returns no results: "当前筛选没有匹配记录" + clear filter button
- Future dates in review calendar: Disabled, no review allowed
- All categories empty: Show empty state
- Category with 0 tasks (hidden): Hide when "隐藏空分类" is on

## Acceptance Criteria

1. Can view, edit, and delete historical reviews
2. Calendar month view shows review status per day
3. Timeline shows reverse-chronological reviews with filters
4. Category view groups tasks by tag correctly
5. Cross-category drag-and-drop works on desktop
6. Mobile has alternative "move to category" action
7. Visual polish improves hierarchy without breaking existing flows
8. All existing functionality (calendar, habits, tags, reminders, PWA) still works
9. TypeScript: 0 errors
10. ESLint: 0 errors
11. All tests pass
12. Production build succeeds
