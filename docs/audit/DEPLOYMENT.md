# Deployment

## Intended Flow

- Push to GitHub `main`.
- GitHub Actions runs quality gates.
- Vercel deploys from `main`.
- Supabase migrations are applied only when non-destructive and verified.

## Current Pass

- Branch: `codex/full-product-audit-20260705`
- Local commit: created on `codex/full-product-audit-20260705`; exact final SHA is reported in the delivery summary because amending this report changes the commit hash.
- Local code changes are committed but not pushed.
- GitHub fetch failed during baseline because `github.com:443` was unreachable.
- GitHub push was retried after connectivity recovered, but failed with `Invalid username or token`; credentials need to be refreshed before pushing.
- GitHub Actions status was not verified.
- Vercel deployment was not triggered or verified.
- Production URL `https://my-plan-calendar.vercel.app` was not smoke-tested in this pass.
- Production Supabase was not migrated or modified.

## Release Gate

Do not claim production readiness until:

- Full local `npm run check` passes.
- Playwright E2E passes.
- Code is committed and pushed.
- GitHub Actions passes.
- Vercel deployment succeeds.
- Production browser smoke passes on desktop and mobile.
- Supabase schema/RLS is verified or explicitly marked unchanged.
