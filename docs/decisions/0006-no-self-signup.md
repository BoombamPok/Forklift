# 0006: No self-signup — accounts are admin-provisioned

## Status

Accepted (Phase 1).

## Context

phase1.md §35 explicitly says not to build a complex user-management
admin UI yet, and ForkStock is an internal tool for a specific business's
staff, not a public product people sign up for.

## Decision

The login page (`(auth)/login`) has no "create account" link or sign-up
form. Every `auth.users` row gets a matching `profiles` row automatically
(via the `handle_new_user()` trigger), defaulting to the `staff` role -
but the `auth.users` row itself is created by an admin, either through
the Supabase dashboard (Authentication → Users) or the Admin Auth API,
not through the app's own UI.

## Consequences

- No signup form, email-verification flow, or "forgot your password"
  flow needs building in Phase 1 - that's real UI scope this decision
  removes.
- A real user-management screen (invite, deactivate, change role from the
  app itself rather than the Supabase dashboard) is future scope - the
  `/admin` route is currently a placeholder for exactly that
  (`src/app/(app)/admin/page.tsx`).
- New users' default role is `staff`, the least-privileged non-viewer
  role - an admin must explicitly promote them (e.g.
  `UPDATE profiles SET role = 'admin' WHERE id = ...`) to grant more
  access. Nobody is over-privileged by default.
