# Security Notes

## Frontend

- No `dangerouslySetInnerHTML` hits were found in `src`.
- User text is generally rendered through React text nodes.
- Error handling still includes several empty `catch` blocks and should be tightened where failures affect persistence.

## Authentication

- Cloud mode uses Supabase auth.
- Local demo mode now has an explicit action and stores only a local demo user marker in `localStorage`.
- Signing out from demo mode clears the demo marker and returns to cloud-capable login mode.

## Headers

Added in `next.config.ts`:

- `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

Full script CSP was intentionally not added because nonce/hash wiring was not implemented and a strict script policy would likely break Next runtime scripts.

## Service Worker

- Supabase requests are not cached.
- `/api/`, `/auth/`, and `/auth/v1/` requests are not cached.
- Responses with `Cache-Control: no-store` or `private` are not cached.

## Supabase

- Migration files enable RLS and constrain user data with `auth.uid()`.
- Production schema/RLS was not verified in Supabase because authenticated project access was not available during this pass.

## Secrets

- `.env.local` is present locally and is ignored by Git.
- No secret values were added to docs or commits.
