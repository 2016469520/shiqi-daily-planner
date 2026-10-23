# IMPLEMENTATION_PLAN.md

## Phase 1: Fix Data Display Bugs

### Files to modify:
- `src/components/reviews/daily-review-form.tsx` — Add 0 option to ScoreSelect, fix falsy value handling
- `src/lib/utils/stats.ts` — Ensure 0 values included in averages
- `src/lib/utils/review-stats.ts` — Ensure 0 values included
- `src/components/schedule/task-list-item.tsx` — Check tag display
- `src/components/calendar/category-view.tsx` — Check tag display
- Global audit for `[object Object]` and source code rendering

### Tests:
- Completion rate 0 save/load test
- Tag display test (no source code)
- Null vs 0 distinction test

## Phase 2: Countdown Data Layer

### Migration:
- `supabase/migrations/005_countdowns.sql`

### Files:
- `src/types/index.ts` — Countdown type
- `src/lib/repositories/interfaces.ts` — ICountdownRepository
- `src/lib/repositories/indexeddb-impl.ts` — IndexedDB impl
- `src/lib/repositories/supabase-impl.ts` — Supabase impl
- `src/lib/db/indexeddb.ts` — DB v3 upgrade
- `src/hooks/use-countdowns.ts` — Query hooks
- `src/lib/utils/countdown.ts` — Date calculation

## Phase 3: Countdown UI
- `src/components/countdowns/countdown-card.tsx`
- `src/components/countdowns/home-countdowns.tsx`
- `src/components/countdowns/countdown-inline-create.tsx`
- `src/app/countdowns/page.tsx`

## Phase 4: Focus Data Layer

### Migration:
- `supabase/migrations/006_focus_sessions.sql`

### Files:
- `src/types/index.ts` — FocusSession type
- `src/lib/repositories/interfaces.ts` — IFocusRepository
- `src/lib/repositories/indexeddb-impl.ts`
- `src/lib/repositories/supabase-impl.ts`
- `src/lib/db/indexeddb.ts` — DB v3 upgrade
- `src/lib/focus/state-machine.ts` — Focus state machine
- `src/lib/focus/timer.ts` — Wall-clock timer logic
- `src/hooks/use-focus.ts` — Focus hook

## Phase 5: Focus UI
- `src/components/focus/focus-timer.tsx`
- `src/components/focus/focus-start.tsx`
- `src/components/focus/focus-history.tsx`
- Focus entry points in task cards, detail panel

## Phase 6: Focus Statistics
- `src/lib/utils/focus-stats.ts`
- `src/components/focus/focus-stats-view.tsx`
- Integrate into `/insights`

## Phase 7: Habit Samples
- `src/lib/constants.ts` — RECOMMENDED_HABITS
- `src/hooks/use-recommended-habits.ts`
- `src/components/habits/home-habits-summary.tsx`
- `src/components/habits/habit-heatmap.tsx`
- `src/lib/utils/habit-stats-enhanced.ts`

## Phase 8: Home Page Integration
- `src/app/schedule/page.tsx` — Restructure layout
- `src/components/schedule/schedule-right-panel.tsx` (desktop)
- Collapse state persistence

## Phase 9: Regression & Release
- Run all tests, lint, build
- Git commit, push, Vercel verify
