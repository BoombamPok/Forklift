# 0007: Server-enforced attribution, and no `for all` RLS policies

## Status

Accepted. Added during a code review before Phase 2 started, correcting
two gaps in the original Phase 1 migrations.

## Context

Two gaps surfaced in review of the initial schema:

1. Every catalogue/warehouse write policy used
   `create policy ... for all`, which grants `SELECT`/`INSERT`/`UPDATE`/
   `DELETE` together. The intent (soft delete only, per ADR 0001's
   sibling principle in CLAUDE.md §11) was that no role could hard-delete
   these rows - but `for all` silently included `DELETE` anyway, since
   nothing had split it out.
2. `stock_movements.created_by` and `part_images.uploaded_by` were plain
   client-supplied columns. RLS checked the caller's *role* before
   allowing an insert, but never checked that the caller was inserting
   their *own* id into those columns - a staff user could insert a
   movement and attribute it to someone else.

## Decision

- Every RLS write policy is now `for insert` or `for update` explicitly,
  never `for all`. No table gets a `DELETE` policy - "deletion" is
  always a soft delete via `UPDATE ... SET deleted_at`, and now nothing
  can accidentally re-introduce hard delete by using the broader form.
- `created_by`/`uploaded_by`-style attribution columns are set by a
  `BEFORE INSERT` trigger (`set_actor_column()`) that unconditionally
  overwrites them with `auth.uid()`, ignoring whatever the client sent.
  RLS `WITH CHECK` can't safely express "this column must equal the
  caller's id" as cleanly as a trigger can enforce it unconditionally.

## Consequences

- Any new table needing role-gated writes should follow the same
  pattern: separate `INSERT`/`UPDATE` policies, no `DELETE` policy,
  `deleted_at` for soft delete.
- Any new table with an actor/owner column that must be trustworthy
  (not just role-checked) should get the same `BEFORE INSERT` trigger
  pattern rather than relying on `WITH CHECK` alone.
- Verified live: an admin's `DELETE` against `brands` now returns 0 rows
  affected instead of removing data; a staff user's attempt to insert a
  `stock_movements` row with `created_by` set to a different user's id
  was silently corrected to their own id.
