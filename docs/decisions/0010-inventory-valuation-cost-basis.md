# 0010: Inventory value KPI uses cost basis, not retail value

## Status

Accepted (Phase 2a).

## Context

The Phase 2 dashboard needs an "inventory value" KPI. `inventory_parts`
carries both `purchase_cost` and `selling_price` per row, so the metric
could mean either "what we paid" or "what we could sell it for" —
`phase2a.md` §4.2 required picking one.

## Decision

- `getInventoryValue()` computes **cost basis**:
  `sum(quantity * purchase_cost)` across non-deleted `inventory_parts`
  rows. This is the standard "inventory value" meaning in operations/
  accounting contexts, and matches what the business actually has
  capital tied up in.
- Rows with a `null` or negative `purchase_cost` are excluded from the
  sum (not treated as `0`, which would understate nothing while actually
  hiding missing data) and counted in a returned `excludedCount` so the
  UI can flag the number as incomplete rather than presenting it as
  exact. A negative `purchase_cost` is a data-quality issue, not an
  application error — it's logged and excluded, not thrown.
- A retail-value metric (`sum(quantity * selling_price)`) is not built
  now — CLAUDE.md §19 scopes multi-metric business intelligence to
  Phase 6. If it's wanted later it's an additive function, not a change
  to this one.

## Consequences

- `getInventoryValue()` returns `{ value, excludedCount }`, not a bare
  number, so 2b's KPI card can show "value may be incomplete" instead of
  silently presenting a partial sum as complete.
- Any future second valuation metric should be its own function, not a
  parameter added to this one.
