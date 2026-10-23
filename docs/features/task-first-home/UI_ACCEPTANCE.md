# UI ACCEPTANCE: Task-First Home

## Must NOT look like
- A calendar app homepage
- A full-page calendar grid
- A dashboard with empty charts

## Must look like
- A task workspace — open it and see what to do today
- Clean, quiet, usable daily

## Top Checklist
- [ ] Landing page shows today's tasks, not a calendar
- [ ] Quick-add is inline input, not a dialog
- [ ] Desktop: click task → right panel opens (list stays visible)
- [ ] Mobile: click task → full-screen detail
- [ ] No dialog for creating, viewing, or editing tasks
- [ ] Calendar still works as secondary view
- [ ] Nav order: 日程 → 日历 → 习惯 → 复盘 → ...

## Visual Standards
- Greeting: time-based, compact
- Progress: small ring or bar, not dominating
- Task cards: tag color strip (left), title prominent, secondary info muted
- Focus tasks: slightly elevated, not garish
- Period sections: subtle background difference
- Completion: check animation, card fades
- All animations <200ms, respect prefers-reduced-motion
- Dark mode: all sections readable
- Mobile: no horizontal overflow, touch targets >= 44px
