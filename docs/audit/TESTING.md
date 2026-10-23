# Testing

## Baseline

- `npm run lint`: passed with 91 warnings.
- `npx tsc --noEmit`: passed.
- `npx vitest run`: 12 files, 224 tests passed.
- `npx playwright test`: 28 tests passed.
- `npm run build`: passed.
- `npm audit --audit-level=moderate`: failed with 2 moderate Next/PostCSS findings.

## Added

- `npm run typecheck`
- `npm run test`
- `npm run test:watch`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run check`
- Playwright test for local demo-mode entry and refresh persistence.
- Playwright schedule tests for task CRUD, undated/inbox visibility, and today/week/all plus category grouping combinations.
- Vitest repository test for date-range filtering with optional undated task inclusion.

## Post-Fix Checks Run

- `npm run check`: passed.
- `npm run lint -- e2e/tasks.spec.ts src/providers/auth-provider.tsx src/providers/repo-provider.tsx src/app/login/page.tsx`: passed.
- `npx vitest run src/__tests__/unit/repository.test.ts`: 36 passed.
- `npx playwright test e2e/tasks.spec.ts --project=chromium`: 11 passed.
- `npx playwright test`: 34 passed.
- `npm audit --audit-level=high`: exited successfully; still reports the moderate Next/PostCSS advisory.
- Local production smoke on `http://127.0.0.1:3013`: demo mode opened `/schedule`, refresh persisted, no horizontal overflow at 390x844, and no console errors.

Full final quality gate results are recorded in `FINAL_REPORT.md`.
