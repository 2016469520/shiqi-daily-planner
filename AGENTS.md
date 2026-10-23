<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Rules

- Keep the product task-first: schedules and tasks are primary; calendar views are supporting views.
- Preserve both data paths. Cloud mode uses Supabase; local demo mode uses IndexedDB.
- Do not expose internal enum values, UUIDs, database fields, raw errors, or `[object Object]` in the UI.
- Before editing Next.js behavior, read the relevant local docs under `node_modules/next/dist/docs/`.
- Run `npm run check` before release-oriented changes. Run `npm run test:e2e` when touching auth, navigation, persistence, or user workflows.
- Do not commit `.env*`, keys, tokens, local logs, screenshots, database dumps, or generated Playwright reports.
- Do not add AI attribution, co-author trailers, AI session URLs, or generated-by notes to commits, PRs, or project docs.
