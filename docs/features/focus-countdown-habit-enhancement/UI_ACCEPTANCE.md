# UI_ACCEPTANCE.md

## Core Principles

1. Schedule remains the primary content on home page
2. Countdown and Focus are compact auxiliary areas
3. Minimize modals — use inline forms, side panels, and full-screen mobile views
4. Delete confirmation is the only Dialog
5. Completion rate 0 MUST be visible (progress bar track + number)
6. No source code, JSON, `[object Object]`, or React component source visible anywhere
7. No horizontal overflow on mobile
8. Readable in both light and dark modes
9. Detail-rich but not flashy

## Required Visual Checks

### Schedule Page (Desktop)
- [ ] Schedule is the visual center
- [ ] Focus timer is in right panel, compact
- [ ] Countdown cards are in right panel, compact
- [ ] Habits summary is in right panel, compact
- [ ] Right panel items are collapsible
- [ ] No source code or object text anywhere

### Schedule Page (Mobile 390×844)
- [ ] Today's tasks visible in first viewport
- [ ] Focus can be started and paused
- [ ] Countdowns visible below tasks
- [ ] Habits quick check-in accessible
- [ ] No horizontal overflow
- [ ] Bottom nav not obscured

### Focus Timer
- [ ] Running state: circular progress with remaining time
- [ ] Paused state clearly indicated
- [ ] Breathing effect subtle, respects prefers-reduced-motion
- [ ] No neon colors or giant countdown

### Countdown Cards
- [ ] Small color dot + icon + days remaining
- [ ] "就是今天" for today's events
- [ ] Pinned items slightly enhanced
- [ ] No large gradient cards

### Habits
- [ ] Boolean: checkmark toggle
- [ ] Numeric: +/- quick input
- [ ] Progress shows target vs actual
- [ ] Subtle feedback on daily goal completion

### Empty States
- [ ] No countdowns: icon + message + "Create first" button
- [ ] No focus records: icon + message
- [ ] No recommended habits: icon + message
- [ ] All habits completed: celebration state
- [ ] No stats: icon + message

### Dark Mode
- [ ] All cards readable
- [ ] Tag colors visible
- [ ] Focus progress ring visible
- [ ] Countdown text readable
- [ ] Progress bars have visible track
