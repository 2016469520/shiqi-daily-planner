# Audit Plan

## Priorities

- P0: security, auth bypass, data loss, production unusability.
- P1: core workflow failure, Supabase/IndexedDB inconsistency, broken demo mode, broken persistence.
- P2: UX, responsive, accessibility, performance, stale warnings.
- P3: documentation, maintainability, cleanup.

## Execution Order

1. Safety prep: verify repo, branch, status, backup bundle, tree SHA.
2. Establish baseline: scripts, lint, TypeScript, unit tests, E2E, build, audit, browser checks.
3. Fix P0/P1 issues with focused tests.
4. Add conservative security and CI improvements.
5. Re-run quality gates.
6. Commit and push when network allows.
7. Verify GitHub Actions, Vercel, production browser, and Supabase when authenticated access is available.

## Workstreams

- Auth and security: demo/cloud split, headers, session behavior.
- Data paths: Repository consistency and IndexedDB/Supabase differences.
- UI and responsive: task-first navigation, modal behavior, mobile layout, internal value leaks.
- Tests and CI: make local scripts and CI express real gates.
- PWA: avoid caching private/auth/API responses.
- Release: clear status separation for code, tests, commit, push, deployment, and production verification.
