# 0004: Server Components + Server Actions, no separate API layer

## Status

Accepted (Phase 1).

## Context

CLAUDE.md §10 explicitly lists "separate backend services" and
"abstractions that solve problems we do not have" as things to avoid,
and asks for centralized, predictable data access.

## Decision

- Server Components read data by calling `lib/supabase/server.ts`'s
  client directly — no internal REST/GraphQL layer between the UI and
  Supabase.
- Mutations are Server Actions, colocated per feature
  (`features/<name>/actions.ts`), each returning the one shared shape:
  `ActionResult<T> = { success: true; data: T } | { success: false; error: { message: string } }`
  (`src/lib/errors.ts`) — never throwing raw errors across the
  server/client boundary.
- Errors are classified centrally (`toErrorKind`, `toSafeErrorMessage` in
  `lib/errors.ts`) before they reach a component, so raw Postgres/Supabase
  error text never reaches a user (CLAUDE.md §53).

## Consequences

- No `app/api/*` route handlers exist for CRUD - only `src/proxy.ts`
  (session refresh) and the eventual `(auth)/auth/callback` route
  (email confirmation redirects) are framework-required exceptions.
- Every future feature's data access should follow this same pattern:
  a `schema.ts` (Zod), a Server Component or two for reads, an
  `actions.ts` for writes. Deviating (e.g. adding a bespoke API route for
  a feature) should have a specific reason, not just familiarity.
