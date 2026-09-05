# 0002: Inventory quantity is trigger-maintained, never written directly

## Status

Accepted (Phase 1).

## Context

CLAUDE.md §5 requires stock changes to go through a proper movement
record, never a silent quantity mutation. It also asks (§18) for
efficient reads — recomputing quantity by summing the entire movement
history on every page load doesn't scale.

## Decision

- `inventory_parts.quantity` is a plain integer column, but the *only*
  thing allowed to change it is the `apply_stock_movement()` trigger,
  which fires `AFTER INSERT` on `stock_movements` and applies
  `quantity_change` to the matching row.
- A second trigger, `guard_inventory_quantity()` (`BEFORE UPDATE` on
  `inventory_parts`), rejects any update that changes `quantity` unless
  it's nested inside another trigger (`pg_trigger_depth() > 1` — i.e.
  called from `apply_stock_movement()`, not directly by a client).
- `stock_movements` has RLS policies for `SELECT` and `INSERT` only — no
  `UPDATE`/`DELETE` policy exists, so the ledger is append-only from the
  API's perspective regardless of role.

## Consequences

- Reading current quantity is a single indexed column read, not an
  aggregate over history.
- The audit trail can't be silently rewritten, even by a bug in
  application code — the database itself refuses the write.
- Any future "bulk adjust" or "stock take" feature must express its
  effect as one or more `stock_movements` rows (type `adjust`), not a
  direct `UPDATE`.
- Verified live: a direct `UPDATE inventory_parts SET quantity = 999`
  against the real project raised
  `inventory_parts.quantity cannot be changed directly - insert a
  stock_movements row instead`, while the seed data's opening stock
  (10 and 25 units) was in fact set purely by inserting `stock_movements`
  rows.
