# TEST_PLAN.md

## Unit Tests

### Bug Fix Tests
- `completion-zero.test.ts` — Save 0, load 0, display 0%, avg includes 0, null ≠ 0, JSON round-trip, Supabase preserves 0, IndexedDB preserves 0
- `tag-display.test.ts` — Tag selector shows names not objects, no source code in rendered output

### Countdown Tests
- `countdown-dates.test.ts` — Today, tomorrow, yesterday, cross-month, cross-year, leap year Feb 29, yearly repeat, past days, timezone (Singapore, UTC-), no date offset

### Focus Tests
- `focus-state-machine.test.ts` — ready→running→paused→running→completed, ready→running→cancelled, prevent double start
- `focus-timer.test.ts` — Wall-clock calculation, refresh recovery, 0 sec boundary, 1 sec boundary, cross-midnight, timezone invariance

### Habit Tests
- `recommended-habits.test.ts` — Idempotent creation, delete doesn't restore, template_id dedup, Supabase + IndexedDB consistency
- `habit-stats-enhanced.test.ts` — Boolean stats, numeric stats (water 7 cups ≠ 7 completions), target achievement rate, streak calculation

## E2E Tests (Playwright)

1. **completion-zero.spec.ts** — Set completion to 0, save, refresh, verify 0%
2. **tag-display.spec.ts** — Open tag selector, verify names, select "科研", verify card shows "科研"
3. **no-source-code.spec.ts** — Page source doesn't contain `[object Object]`, `function (`, `React.createElement`
4. **countdown-crud.spec.ts** — Create, verify days, refresh, edit, pin, archive
5. **countdown-yearly.spec.ts** — Create yearly, verify next occurrence, cross-year
6. **focus-task.spec.ts** — Start focus from task, pause, resume, complete, verify record
7. **focus-refresh.spec.ts** — Start focus, advance time, refresh, verify same session
8. **focus-standalone.spec.ts** — Start without task, complete, verify in stats
9. **recommended-habits.spec.ts** — Add samples, verify no duplicates, delete, verify no restore
10. **habit-stats.spec.ts** — Log values, verify summary, verify trends
11. **mobile-layout.spec.ts** — 390×844 viewport, verify schedule primary, no overflow

## Visual Screenshots

See UI_ACCEPTANCE.md for required screenshots.
