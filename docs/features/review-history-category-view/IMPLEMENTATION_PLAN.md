# IMPLEMENTATION PLAN: Review History & Category View

## Phase 0: Baseline & Specs ✅
- Read repository docs
- Create spec files
- Run baseline tests (fixed 1 timezone-dependent test)
- Branch: `feat/review-history-category-view`

## Phase 1: Review History Data & Statistics

### Files
- `src/lib/utils/review-stats.ts` — NEW: Pure functions for review statistics
  - `calculateReviewStreak()` — current & longest streak
  - `calculateMonthlyReviewSummary()` — avg score/mood/energy/completion, count
- `src/__tests__/unit/review-stats.test.ts` — NEW: 10+ tests
- `src/lib/repositories/interfaces.ts` — Add `delete` to `IDailyReviewRepository`
- `src/lib/repositories/indexeddb-impl.ts` — Implement `delete`
- `src/lib/repositories/supabase-impl.ts` — Implement `delete` (if exists)

### No DB migration needed
Reviews table already has all necessary fields.

## Phase 2: Review History Pages

### Files
- `src/app/reviews/page.tsx` — NEW: Review history page with mode toggle
- `src/components/reviews/review-calendar.tsx` — NEW: Month calendar view
- `src/components/reviews/review-timeline.tsx` — NEW: Timeline list view
- `src/components/reviews/review-detail.tsx` — NEW: Detail drawer/dialog
- `src/components/reviews/review-summary.tsx` — NEW: Monthly summary stats
- `src/components/reviews/review-history-link.tsx` — NEW: "查看历史" link button
- `src/components/layout/nav-data.tsx` — Add "复盘记录" to secondary nav
- `src/app/today/page.tsx` — Add "查看历史" link on review card
- `src/app/insights/page.tsx` — Add "查看全部评价" link

### Route
- `/reviews` — new page, added to layout

## Phase 3: Category View Data Model

### Files
- `src/lib/utils/task-grouping.ts` — NEW: Pure functions
  - `groupTasksByTag()` — group by tag_id
  - `groupTasksByTimeBucket()` — overdue/today/next7days/later/undated/done
  - `calculateCategoryStats()` — per-category completion rates
- `src/__tests__/unit/task-grouping.test.ts` — NEW: 14+ tests

## Phase 4: Category View UI

### Files
- `src/components/calendar/category-view.tsx` — NEW: Main category view
- `src/components/calendar/category-header.tsx` — NEW: Category header with stats
- `src/components/calendar/category-task-card.tsx` — NEW: Task card in category
- `src/components/calendar/presentation-mode-toggle.tsx` — NEW: Time/Category toggle
- `src/app/calendar/page.tsx` — Add presentation mode state + toggle
- `src/components/calendar/calendar-header.tsx` — Add mode toggle

### Desktop Layout
- 2-3 column responsive grid or single column list (user toggleable)

### Mobile Layout
- Horizontal tag selector or accordion

## Phase 5: Cross-category Movement

### Files
- `src/components/calendar/category-dnd.tsx` — NEW: Drag-drop wrapper
- `src/components/calendar/move-to-category-menu.tsx` — NEW: Mobile menu action
- `src/hooks/use-category-dnd.ts` — NEW: DnD hook reusing @dnd-kit

## Phase 6: Visual Polish

### Files
- `src/app/globals.css` — Design variable refinements
- `src/app/today/page.tsx` — Welcome area
- `src/components/calendar/task-chip.tsx` — Card hierarchy improvements
- Various components — Progress indicators, empty states, micro-interactions
- Dark mode audit across all pages

## Phase 7: Regression & Docs

### Files
- `README.md` — Update feature list
- `PROJECT_STATUS.md` — Update progress
- `DECISIONS.md` — Record decisions
- `FUTURE_ROADMAP.md` — Update

### Quality Gates
- `npm run lint` — 0 errors
- `npx tsc --noEmit` — 0 errors
- `npx vitest run` — All pass
- `npm run build` — Success
- `npx playwright test` — All pass
- Browser console — No new errors

## Risks
1. DnD complexity may cause regressions in existing calendar DnD
2. Mobile category UX needs careful testing
3. Dark mode consistency across many new components
4. Date/timezone edge cases with review dates

## Rollback
- Feature branch; can be discarded if major issues found
- Each phase is independently committable
- No destructive DB changes
