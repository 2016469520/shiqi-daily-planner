# TEST PLAN: Task-First Home

## Unit Tests
1. Today task grouping (morning/afternoon/evening)
2. Overdue task identification
3. Future 7-day grouping
4. Undated task handling
5. Soft-deleted task exclusion
6. Cancelled task handling
7. Today completion rate calculation
8. Focus task derivation from priority
9. Category grouping
10. Quick-add default date/time
11. Auto-save debounce logic
12. Date not affected by UTC offset

## Component Tests
- Schedule page loads with today's tasks
- Quick-add expands inline (no dialog)
- Quick-add saves and shows task in list
- Quick-add cancels and clears
- Click task opens detail panel (desktop)
- Switch task updates detail panel
- Inline status change
- Inline tag change  
- Overdue task operations
- Category view within schedule
- Empty states
- Reduced motion support

## Playwright E2E

### Scenario 1: Default Landing
1. Login → verify on /schedule
2. Nav shows "日程" first
3. Today's tasks visible

### Scenario 2: Quick Add
1. Click quick-add input
2. Type title
3. Set tag
4. Save → task appears
5. No dialog opened

### Scenario 3: Desktop Detail Panel
1. Click task → right panel opens
2. Modify title → auto-saves
3. Change tag → auto-saves
4. Switch to another task
5. Return → changes persist

### Scenario 4: Mobile Detail
390×844: Click task → full-screen detail → edit → back → list updated

### Scenario 5: Overdue
1. Create past incomplete task
2. See in overdue section
3. Move to today
4. Verify in today list

### Scenario 6: Calendar Preserved
1. Nav to /calendar
2. Month/week/day switch works
3. Tasks display correctly
4. Detail uses same system

### Scenario 7: Visual & Responsive
1440×900, 1024×768, 390×844; light/dark; no overflow
