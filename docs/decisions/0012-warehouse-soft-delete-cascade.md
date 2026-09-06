# 0012: Warehouse hierarchy soft-delete cascades, and blocks rather than overrides

## Status

Accepted (Phase 4).

## Context

`racks`/`shelves`/`boxes` have `on delete cascade` foreign keys, but this
app never hard-deletes — every delete is `deleted_at = now()`, which the
FK cascade never touches. `phase4.md` §5 asked for a resolved decision on
what soft-deleting a rack/shelf/warehouse does to what's beneath it, and
what happens if any of it still holds stock.

## Decision

- Soft-deleting a warehouse/rack/shelf cascades onto everything beneath
  it (a rack delete also soft-deletes its shelves and their boxes),
  atomically, via one Postgres function per level
  (`soft_delete_warehouse`/`_rack`/`_shelf`/`_box`,
  `supabase/migrations/20260905120000_warehouse_soft_delete_cascade.sql`)
  rather than several separate client-side `.update()` calls, which
  can't guarantee "all or nothing."
- **Blocks entirely if any non-deleted `inventory_part` is still assigned
  anywhere in the subtree being removed — no override, no partial
  delete.** The function returns the blocking parts (id/part_number/name)
  instead of raising a bare error, so the UI (`LocationDeleteAction`)
  shows exactly which parts need to be moved or reassigned first, each
  linking to its Phase 3 detail page. This resolves `phase4.md`'s two
  offered options ("blocked, or require an extra confirmation step") in
  favor of the simpler, safer one: there's no "delete anyway" path that
  would orphan a part's `box_id`, which CLAUDE.md §13 rules out even with
  explicit acknowledgment.
- Each function independently re-checks `current_user_role() in
  ('admin', 'manager')` before touching anything, the same defense-in-depth
  pattern as `guard_inventory_quantity()` (docs/decisions/0002) — RLS and
  the Server Action's `requireRole("warehouse.manage")` are the real
  enforcement layers, this is a third check in case either is ever
  bypassed.
- Functions are `security invoker` (the default), not `security definer`
  like `log_audit_event` — they run with the caller's own RLS-checked
  privileges rather than elevated ones, since the existing RLS policies
  already permit exactly what these functions need.

## Consequences

- A rack/shelf/warehouse holding any stock anywhere beneath it can never
  be deleted by mistake — the operator must explicitly move/reassign
  every blocking part first, then retry.
- No "restore" UI exists for any level (matching Phase 3's inventory
  parts, which also have no restore UI yet) — a soft-deleted
  warehouse/rack/shelf/box is recoverable only via direct DB access,
  same as an inventory part today.
- Live-verified via a rolled-back transaction against the real project:
  an empty rack→shelf→box chain cascades cleanly (all three get
  `deleted_at`); the same chain with one part assigned to its box is
  fully blocked (zero rows changed, the part returned as the blocker).
