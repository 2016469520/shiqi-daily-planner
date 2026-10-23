# UI ACCEPTANCE: Review History & Category View

## Visual Principles
- Clean, quiet, readable — suitable for daily long-term use
- Subtle hierarchy through spacing, weight, and muted colors — not heavy decoration
- Dark mode must be readable, not just inverted
- All animations brief and respectful of `prefers-reduced-motion`

## Review History Page

### Monthly Summary
- Small metric cards: reviewed days, avg score, avg completion, avg mood, avg energy
- Current streak + longest streak displayed prominently
- No large charts required; light SVG sparkline acceptable

### Calendar Mode
- Each date cell shows at most: score dot, mood indicator, subtle status marker
- Empty dates: quiet, minimal visual weight
- Today: distinct but subtle border (not bright highlight)
- Selected date: clear selection state
- Month navigation: ← month → with "回到本月" button
- Month picker available

### Timeline Mode
- Reverse chronological list
- Each card: date + weekday, score, completion, mood, energy, achievement, summary excerpt
- Long text truncated with "查看详情" link
- Load more / pagination
- Filter bar: month, score range, mood, "has text summary" toggle
- Clear filters button when any filter active

### Review Detail
- Desktop: Side drawer or Dialog
- Mobile: Full-screen page or bottom sheet
- All fields displayed with labels
- Edit and Delete buttons
- Previous/Next review navigation
- Delete: Confirmation dialog (not just single click)
- Edit: Reuses DailyReviewForm

### Empty State
- Icon (e.g., ClipboardList from Lucide)
- "还没有评价记录" text
- "写下今天的评价" CTA button

## Category View

### Mode Toggle
- "按时间 | 按分类" segmented control near existing view toggle
- Switching preserves last time view (month/week/day)

### Category Cards
- Header: tag name, tag color (left border or dot, NOT full background), task count, completion rate
- Collapse/expand toggle
- "新建" button per category
- Empty categories hidden when toggle active

### Time Buckets within Category
- 已延期 → 今天 → 未来7天 → 更晚 → 未安排日期 → 已完成(可折叠)
- Each bucket header shows count
- Soft-deleted tasks excluded
- Cancelled tasks hidden by default (filterable)

### Task Cards
- Left color strip matching tag color
- Title prominent
- Date, period, estimated time in secondary text
- Priority: icon + text, not just color
- Completed tasks: reduced visual weight but still readable
- Hover: subtle lift
- Focus: visible ring
- Mobile: touch targets ≥ 44px

### Desktop Layout
- Default: 2-3 column responsive grid
- Toggle: grid / list
- No horizontal scroll

### Mobile Layout
- Horizontal scrollable tag selector OR accordion
- One category in focus at a time
- "全部" overview option
- No horizontal overflow
- Bottom nav does not cover content

## Today Page Polish

### Welcome Area
- Greeting based on time of day (早上好/下午好/晚上好)
- Full date with weekday
- Task summary: total / done / completion rate
- "今天最重要的事" hint (optional)

### Period Sections
- Morning: subtle warm/light background
- Afternoon: neutral
- Evening: subtle cool
- Very subtle — barely noticeable in light mode
- Compatible with dark mode

### Task Cards
- Tag color side strip (left border)
- Title hierarchy clear
- Date/time/secondary info muted
- Priority: icon + text
- Completed: muted but readable
- Hover: subtle lift
- Focus: visible ring
- Mobile: adequate tap targets

## Progress Indicators
- Today completion: small progress bar or ring
- Category completion rate: per header
- Subtask ratio displayed
- Calendar month cells: mini completion hints
- Review calendar: score status dots
- Don't overuse — max 2-3 progress indicators per view

## Completion Feedback
- Checkbox: subtle scale or stroke animation
- Card: smooth status transition
- Toast: brief confirmation
- All-tasks-done: subtle celebration (once per day max)
- Respect `prefers-reduced-motion`

## Empty States (Unified)
- Lucide icon or simple CSS graphic
- One-line description
- One relevant action button
- No external illustration resources

## Micro-interactions
- Button press: subtle scale feedback
- Panel expand/collapse: smooth height transition
- Dialog/Drawer: natural enter/exit
- Date switch: subtle fade
- Drag placeholder: visible feedback
- Saving state: spinner or skeleton
- Success state: brief checkmark
- All animations: < 200ms, respect reduced motion

## Dark Mode Checklist
- [ ] Page backgrounds
- [ ] Cards
- [ ] Tags (colors still distinguishable)
- [ ] Score/rating colors
- [ ] Progress bars/rings
- [ ] Inputs
- [ ] Dialogs
- [ ] Drawers
- [ ] Calendar
- [ ] Category view
- [ ] Review history
- [ ] Empty states
