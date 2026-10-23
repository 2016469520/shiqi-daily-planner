# Baseline

Date: 2026-07-05
Branch: `codex/full-product-audit-20260705`
Initial HEAD: `7524b20fae6f9f0f9f5d685476270e5791a18a6b`
Initial tree SHA: `6380bebca05ee4fb1191efde972682c275b76a30`
Bundle backup: `C:\Users\huajing\Desktop\claude code默认工作区\my-plan-calendar-backups\plan-calendar-20260705-125949.bundle`

## Repository

- Remote: `https://github.com/2016469520/plan-calender.git`
- `git fetch origin --prune --tags`: failed because GitHub was unreachable from this machine during baseline collection.
- Working tree before edits: clean.

## Runtime

- Node: `v24.16.0`
- npm: `11.13.0`
- Next.js: `16.2.9`
- React: `19.2.4`
- App Router pages: `/`, `/calendar`, `/countdowns`, `/today`, `/insights`, `/login`, `/reviews`, `/inbox`, `/reviews/today`, `/schedule`, `/settings`, `/habits`, `/focus`

## Scripts Before Audit

- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start`
- `lint`: `eslint`
- `deploy`: `npm run build && npx gh-pages -d out -b gh-pages`
- Missing standard scripts at baseline: `typecheck`, `test`, `test:watch`, `test:coverage`, `test:e2e`, `check`

## Baseline Command Results

- `npm run lint`: passed with 91 warnings.
- `npx tsc --noEmit`: passed.
- `npx vitest run`: 12 files passed, 224 tests passed.
- `npm run build`: passed; 14 static app routes generated.
- `npx playwright test`: 28 tests passed, but coverage was mostly login and unauthenticated redirects.
- `npm audit --audit-level=moderate`: failed with 2 moderate findings from Next's bundled `postcss <8.5.10`; `npm audit fix --force` would downgrade Next and was not used.
- `npm outdated --long`: patch updates available for Supabase, Next, React, React DOM, lucide-react, react-hook-form, shadcn; major updates available for Node types, ESLint, TypeScript.

## Browser Baseline

- Existing local Next dev server on port 3000 became unresponsive and logged `EPIPE`.
- Production server from `npm run start -- -p 3011` served `/login` successfully at `http://127.0.0.1:3011/login`.
- Login page rendered without console errors in the local production server.
- Clicking the visible offline/demo affordance did not open the app before the fix when Supabase env vars were present.

## Data Layer

- Repository interfaces cover tasks, subitems, tags, habits, habit logs, daily reviews, templates, user profile/preferences, recurrence exceptions, countdowns, and focus sessions.
- Supabase migrations present: `001` through `009`.
- RLS migrations exist for original tables plus later countdown and focus tables.
- Production Supabase schema was not queried in this pass because no Supabase CLI/session verification was available in the local context.
