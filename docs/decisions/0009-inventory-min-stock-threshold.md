# 0009: `inventory_parts.min_stock` as a nullable low-stock threshold

## Status

Accepted (Phase 2a).

## Context

The Phase 2 dashboard needs a "low stock" KPI, but `inventory_parts` had
no per-part threshold to compare quantity against. `phase2a.md` §4.1
required a decision on the column's name, nullability, and default.

## Decision

- Added `inventory_parts.min_stock integer`, with
  `check (min_stock is null or min_stock >= 0)`.
- Named `min_stock`, not `reorder_point` — this domain model has no
  purchasing/reorder workflow, and the name shouldn't imply one.
- **Nullable, no default.** `null` means "no threshold configured for
  this part", distinct from a threshold of `0` (which would mean "flag
  only when literally out of stock"). Existing/new rows default to
  `null`, never `0`, so a part is never silently misclassified as "will
  never be low stock" just because nobody has set a threshold yet.

## Consequences

- The low-stock KPI (`getLowStockCount()`, see `docs/decisions/0010`)
  only counts parts where `min_stock` is explicitly set — parts without
  a configured threshold are excluded from that count entirely, not
  treated as "fine."
- A future inventory-editing UI (Phase 3) needs a way to set/clear this
  per part; until then every part reads as `null`/unconfigured.
- Verified live: existing seed rows kept `min_stock = null` after the
  migration ran, not `0`.
