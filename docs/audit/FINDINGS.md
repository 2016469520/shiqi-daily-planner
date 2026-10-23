# Findings

## P1-001: Local Demo Mode Was Not Reachable With Supabase Env Vars

- Phenomenon: local production build showed login, but entering the app in local demo/IndexedDB mode was not possible when Supabase public env vars were configured.
- Reproduction: run the app with `.env.local`, open `/login`, attempt to use the local/offline path, then navigate to `/schedule`; the app redirects back to `/login`.
- Root cause: `isDemoMode` only became true when `NEXT_PUBLIC_SUPABASE_URL` was absent. There was no explicit demo-mode action, and `RepoProvider` chose Supabase whenever env vars existed.
- Impact: local IndexedDB demo path did not satisfy the product deployment model and blocked browser verification of core features without a live login.
- Fix: added explicit `enterDemoMode`, persisted a demo user, and routed demo users to IndexedDB repositories.
- Modified files: `src/providers/auth-provider.tsx`, `src/providers/repo-provider.tsx`, `src/app/login/page.tsx`, `e2e/tasks.spec.ts`.
- Test: added Playwright coverage for entering demo mode and surviving refresh.
- Status: fixed locally.
- Supabase involved: no schema change.
- Production release involved: yes, after push/deploy.

## P1-002: Security Headers Were Missing

- Phenomenon: `next.config.ts` had no response header policy.
- Reproduction: inspect `next.config.ts` or local response headers before the fix.
- Root cause: Next config was empty.
- Impact: weaker browser hardening for clickjacking, MIME sniffing, referrer leakage, and browser permission surfaces.
- Fix: added conservative headers that do not block Next inline scripts: `frame-ancestors`, `base-uri`, `object-src`, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`, `Strict-Transport-Security`, and `Service-Worker-Allowed`.
- Modified files: `next.config.ts`.
- Test: production build passed after config change.
- Status: fixed locally.
- Supabase involved: no.
- Production release involved: yes.

## P1-003: Service Worker Could Cache Non-Supabase User-Specific GET Responses

- Phenomenon: service worker skipped Supabase calls but default network-first branch cached arbitrary successful GET responses.
- Reproduction: inspect `public/sw.js` default fetch handler.
- Root cause: cache decision only checked `response.ok`.
- Impact: future app/auth/API GET endpoints could be cached even when user-specific.
- Fix: skip `/api/`, `/auth/`, and `/auth/v1/`; avoid caching responses with `Cache-Control: no-store` or `private`.
- Modified files: `public/sw.js`.
- Test: production build passed after change.
- Status: fixed locally.
- Supabase involved: no.
- Production release involved: yes.

## P1-004: Schedule Date Range Omitted Inbox Tasks

- Phenomenon: schedule views compute an inbox/undated section, but the page fetched only date-ranged tasks, so tasks with `task_date = null` could disappear from the schedule context.
- Reproduction: create or edit a task so it has no scheduled date, then open `/schedule`.
- Root cause: schedule used `getByDateRange`; both repository implementations excluded null dates from range filters.
- Impact: inbox tasks were harder to recover from the task-first schedule flow, especially in local demo mode.
- Fix: added `includeUndated` to task filters, made schedule fetch date-ranged plus undated tasks, updated null-date typing and UI guards, and scoped task/tag React Query keys by user.
- Modified files: `src/app/schedule/page.tsx`, `src/lib/repositories/*`, `src/types/index.ts`, calendar/schedule/search/stat consumers, and E2E tests.
- Test: added repository coverage for undated range filtering and Playwright CRUD coverage that clears a task date and verifies it remains visible through the schedule inbox.
- Status: fixed locally.
- Supabase involved: no schema change.
- Production release involved: yes.

## P2-001: Local Quality Scripts Were Incomplete

- Phenomenon: package scripts lacked standard `typecheck`, `test`, `test:e2e`, `test:coverage`, and `check`.
- Reproduction: inspect `package.json` baseline scripts.
- Root cause: tools existed but were not wired into package scripts.
- Impact: contributors and CI had to invoke ad hoc commands.
- Fix: added scripts backed by existing TypeScript, Vitest, Playwright, and build configuration.
- Modified files: `package.json`, `.github/workflows/ci.yml`.
- Test: targeted scripts and CI-equivalent local commands were run.
- Status: fixed locally.

## P2-002: Existing E2E Coverage Was Too Shallow

- Phenomenon: 28 baseline Playwright tests passed but mostly verified login and redirects.
- Reproduction: inspect `e2e/*.spec.ts`.
- Root cause: tests asserted page availability more than core data workflows.
- Impact: task, habit, focus, countdown, review, and settings regressions could pass E2E.
- Fix: added demo-mode persistence, schedule task CRUD, undated/inbox visibility, and today/week/all plus category grouping E2E coverage.
- Status: improved; non-schedule workflows remain in `ROADMAP.md`.

## P2-003: Lint Warnings Are Numerous

- Phenomenon: `npm run lint` passed with 91 warnings.
- Reproduction: run `npm run lint`.
- Root cause: unused imports/variables, hook dependency warnings, and React Hook Form watch calls that React Compiler skips.
- Impact: lower maintainability and risk of stale closures in timer/habit code.
- Fix: not fully addressed in this pass; warnings are categorized in baseline.
- Status: deferred.

## P3-001: Dependency Audit Has a Moderate Next/PostCSS Finding

- Phenomenon: `npm audit --audit-level=moderate` reports Next depending on vulnerable PostCSS.
- Reproduction: run `npm audit --audit-level=moderate`.
- Root cause: advisory is in Next's bundled dependency chain.
- Impact: moderate XSS advisory in CSS stringify path.
- Fix: did not run `npm audit fix --force` because it would downgrade Next to `9.3.3`. CI uses high-severity audit gate until a compatible Next patch is adopted.
- Status: deferred for dependency update.
