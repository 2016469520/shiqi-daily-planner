# TEST PLAN: Review History & Category View

## Unit Tests

### Review Stats (`src/__tests__/unit/review-stats.test.ts`)
1. Sort reviews by date range
2. Monthly average score
3. Average completion rate
4. Current review streak (consecutive days)
5. Longest review streak
6. Stats with missing scores (null-safe)
7. Month-end and year-crossing dates
8. Timezone does not shift review_date
9. Stats update after deletion
10. Empty array returns safe defaults

### Task Grouping (`src/__tests__/unit/task-grouping.test.ts`)
1. Group by tag
2. Uncategorized tasks (no tag_id)
3. Overdue time bucket
4. Today time bucket
5. Next 7 days bucket
6. Later bucket
7. Completed bucket
8. Cancelled tasks hidden by default
9. Soft-deleted tasks not shown
10. Tag modification updates grouping
11. Moving to uncategorized clears tag_id
12. Category completion rate
13. Empty category handling
14. Sort order rules

## Component Tests
- Review history mode switch (calendar ↔ timeline)
- Calendar date selection
- Review detail open/close
- History review edit form
- Category fold/unfold
- Hide empty categories toggle
- New task in category pre-selects tag
- Mobile "move to category" menu
- Empty states (reviews, categories, tasks)
- Reduced motion preference

## Playwright E2E Scenarios

### Scenario 1: View History Reviews
1. Create reviews for 2 different dates
2. Navigate to /reviews
3. See both reviews in timeline
4. Switch to calendar mode
5. See date markers
6. Open older review detail
7. Edit review
8. Refresh page
9. Verify changes persist

### Scenario 2: Backfill Historical Review
1. Navigate to /reviews
2. Select past blank date in calendar
3. Click "补写评价"
4. Fill and save
5. Verify calendar and timeline both updated

### Scenario 3: Category View
1. Create tasks with 3 different tags
2. Create one untagged task
3. Switch to category mode
4. Verify category counts
5. Verify uncategorized section
6. Click task → edit dialog opens
7. Refresh → data still correct

### Scenario 4: New Task in Category
1. In "科研" category, click "新建"
2. Verify form pre-selects "科研" tag
3. Save task
4. Verify task appears in 科研 category

### Scenario 5: Cross-category Move
1. Drag "学习" task to "工作" category
2. Verify tag updates immediately
3. Switch to time view
4. Open task → verify tag is "工作"
5. Refresh → still correct

### Scenario 6: Mobile (390×844)
1. Open /reviews
2. Toggle calendar/timeline
3. Open review detail
4. Open category view
5. Switch categories
6. Use menu to move task
7. No horizontal overflow
8. Bottom nav does not obstruct content

## Visual Screenshots
- `reviews-desktop-light.png` (1440×900)
- `reviews-desktop-dark.png` (1440×900)
- `reviews-mobile-light.png` (390×844)
- `category-desktop-light.png` (1440×900)
- `category-desktop-dark.png` (1440×900)
- `category-mobile-light.png` (390×844)
- `today-polished-desktop.png` (1440×900)

## Browser Console Checks
- No console errors
- No hydration errors
- No React key warnings
- No 404 resources
- No Service Worker errors
- No missing accessible names
- No async updates after page unload

## Supabase vs IndexedDB
- Both Repository implementations tested
- IndexedDB: Full demo mode coverage
- Supabase: Code path complete (RLS, query structure)
