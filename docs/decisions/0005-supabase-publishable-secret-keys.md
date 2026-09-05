# 0005: Use Supabase's publishable/secret keys, not legacy anon/service_role

## Status

Accepted (Phase 1). Corrected mid-build after user review.

## Context

Supabase is retiring the legacy JWT-based `anon` and `service_role` API
keys in favor of `publishable` (`sb_publishable_...`) and `secret`
(`sb_secret_...`) keys, by end of 2026. The first pass of this codebase
used the legacy names out of habit before any live project existed; the
user caught it and asked directly.

## Decision

- Client code uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (browser +
  server-side RLS-scoped client) and `SUPABASE_SECRET_KEY` (server-only
  admin client), not `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
  `SUPABASE_SERVICE_ROLE_KEY`.
- No other code changed: `createBrowserClient`/`createServerClient`/
  `createClient` from `@supabase/ssr` and `@supabase/supabase-js` accept
  the new key values as a drop-in positional-argument swap - same
  privilege levels, same RLS behavior.

## Consequences

- The Postgres roles RLS policies target (`anon`, `authenticated`,
  `service_role`) are unrelated to this and did **not** change - the key
  rebrand is purely about the client-facing API key artifact, not the
  underlying role/policy model.
- Following Supabase's own current documentation/dashboard naming avoids
  building on a path they're actively deprecating.
