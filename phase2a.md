# ForkStock — Phase 2a
# Dashboard Data Foundation (Schema + Aggregate Queries)

## Status

Phase: 2a of 7 (sub-phase of Phase 2 — Core UI + Dashboard)
Priority: HIGH
Depends on: Phase 1 (Architecture + UX Foundation) — complete and verified.
Followed by: 2b (KPI cards), 2c (chart + activity), 2d (low-stock table),
2e (global search) — each of which reads the data this sub-phase produces.

This document is self-contained. A session can be given `CLAUDE.md` and
this file alone and understand what to build.

---

## 1. Mission

Establish the data layer the rest of Phase 2 depends on:

1. Add the missing low-stock threshold column to `inventory_parts` via a
   proper migration.
2. Resolve the two open product decisions this requires (valuation
   formula, threshold column shape) and record them as ADRs.
3. Write server-side query/aggregate functions for: inventory item count,
   inventory value, low-stock count, out-of-stock count.

**No UI work happens in this sub-phase.** No dashboard components are
wired up yet — that's 2b onward. This sub-phase's output is a migration,
two ADRs, and a set of tested, reusable server-side functions.

---

## 2. Why This Sub-Phase Exists

Phase 2's dashboard (2b–2e) needs real numbers, but two things block that:
`inventory_parts` has no low-stock threshold column yet, and there's no
agreed inventory valuation formula. Deciding and building these first,
in isolation, means 2b–2e can focus purely on UI wiring against a data
layer that's already correct and tested — rather than each of four
sub-phases independently guessing at schema or re-deriving the same
aggregate query.

---

## 3. Starting State

- `inventory_parts` table exists with: `id`, `catalogue_part_id`
  (nullable), `part_number`, `name`, `box_id`, `quantity` (trigger-guarded,
  never written directly), `purchase_cost`, `selling_price`, `status`,
  `notes`, timestamps, `deleted_at`. **No threshold/reorder column
  exists.**
- `stock_movements` is a real, insert-only ledger (`movement_type`,
  `quantity_change`, `created_at`, etc.) already driving `quantity` via
  the `apply_stock_movement()` trigger.
- All tables are currently empty except dev seed data.
- Migrations live in `supabase/migrations/`, applied via `psql` (Supabase
  CLI login/`db push` not available in this environment — see
  `PROGRESS.md` for why; a different environment may use the CLI
  instead).
- `docs/decisions/` already contains ADRs 0001–0006 from Phase 1 —
  continue that numbering (0007, 0008, ...).
- No dashboard aggregate query functions exist yet anywhere in
  `src/lib` or `src/features`.

---

## 4. Decisions Required (resolve before writing code)

### 4.1 Low-stock threshold column

Add a column to `inventory_parts` representing the quantity below which a
part is considered low stock.

- **Name**: recommend `min_stock` (short, matches common inventory-system
  vocabulary; avoid `reorder_point` unless you want to imply a
  reorder/purchasing workflow that doesn't exist in this domain model).
- **Nullable, no default.** `null` means "no threshold configured for
  this part" — distinct from a threshold of `0`. This mirrors the
  existing dashboard convention of showing `—` for "not yet known" rather
  than a fabricated `0` (see the Phase 1 dashboard page comment).
- **Type**: `integer`, with a `check (min_stock is null or min_stock >= 0)`
  constraint.
- Write this as ADR `0007-inventory-min-stock-threshold.md` following the
  existing ADR format in `docs/decisions/`.

### 4.2 Inventory valuation formula

Decide how "inventory value" is computed for the dashboard KPI.

- Recommend: **cost basis** — `sum(quantity * purchase_cost)` across
  non-deleted `inventory_parts` rows, treating rows with a `null`
  `purchase_cost` as excluded from the sum but flagged (see §6) so the
  number is never silently wrong.
- Do not default to `selling_price` unless the business explicitly wants
  a retail-value KPI instead of a cost-basis one — cost basis is the
  more standard "inventory value" meaning in operations contexts.
- If both are wanted eventually, this sub-phase only needs to build one
  (cost basis) — a second valuation metric is a Phase 6 (Business
  Intelligence) concern, not Phase 2.
- Write this as ADR `0008-inventory-valuation-cost-basis.md`.

If either decision is overridden by the user instead of following the
recommendation, implement the override and document it in the ADR instead
— do not silently pick something different from what's written here.

---

## 5. Scope

### Included

- One new migration: add `min_stock` to `inventory_parts`.
- Two ADRs (0007, 0008) recording the decisions above.
- Server-side (Server Component / Server Action — no client-side
  Supabase queries for this) functions, colocated sensibly (e.g.
  `src/features/dashboard/queries.ts` or similar, matching the existing
  feature-oriented convention):
  - `getInventoryItemCount()` → count of non-deleted `inventory_parts`.
  - `getInventoryValue()` → cost-basis sum per §4.2, plus a flag/count of
    how many rows were excluded due to null `purchase_cost` (so the UI
    can later show "value may be incomplete" rather than pretending
    completeness).
  - `getLowStockCount()` → count where `quantity > 0 and quantity <=
    min_stock` (only counts rows where `min_stock` is set).
  - `getOutOfStockCount()` → count where `quantity = 0`.
- Unit tests for all four functions against a seeded/fixture dataset
  covering: normal rows, rows with null `min_stock`, rows with null
  `purchase_cost`, soft-deleted rows (must be excluded).

### Explicitly Not Included

- No dashboard component changes (2b–2e).
- No UI at all.
- No changes to `stock_movements`, warehouse, or catalogue schemas.
- No permissions/role-gating logic yet (that's noted as a 2b decision,
  since it concerns how the KPI is *displayed*, not how it's computed).
- No search-related work (2e).

---

## 6. Detailed Requirements

- The migration must be additive and backward-compatible: existing seed
  rows in `inventory_parts` get `min_stock = null`, not `0` — do not
  write a default that would silently mark existing parts as "no
  threshold = never low stock" versus "threshold zero = flag only when
  literally out." Null must mean "not configured."
- `getInventoryValue()` should return a small typed result — not just a
  bare number — e.g. `{ value: number; excludedCount: number }` — so
  callers in 2b can decide how to present incompleteness rather than the
  query function silently hiding it.
- All four functions must only read `deleted_at is null` rows (soft-delete
  aware, per `CLAUDE.md` §11).
- All four functions must run server-side (Server Component data fetch or
  Server Action), consistent with the ADR 0004 (server-components-only)
  decision from Phase 1 — no client-side Supabase queries.
- Use the existing typed Supabase server client pattern from
  `src/lib/supabase` — do not create a new client pattern.

---

## 7. Data Requirements

New column:

```
alter table public.inventory_parts
  add column min_stock integer
  check (min_stock is null or min_stock >= 0);
```

(Exact migration filename/timestamp follows the existing convention in
`supabase/migrations/` — continue the naming pattern already used for
Phase 1's seven migrations.)

No other schema changes.

---

## 8. Permissions

- These are read-only aggregate queries. At this sub-phase, do not
  implement role-based restriction on the *values themselves* — that's a
  2b UI-layer decision (whether Staff/Read-Only sees the inventory-value
  KPI at all). This sub-phase just needs the query functions to exist and
  be correct; RLS already governs what the underlying `inventory_parts`
  rows a given role can read, and these aggregates run server-side using
  the authenticated user's session, so RLS is naturally respected without
  extra code.

---

## 9. Validation & Error Handling

- If `getInventoryValue()` finds a part with negative or clearly invalid
  `purchase_cost`, do not throw — this is a data-quality signal, not an
  application error; log it and include it in the exclusion count.
- All four functions must handle the zero-rows case (empty
  `inventory_parts`) and return honest zero/empty results, not errors.
- Supabase connection failures should surface as a typed error the caller
  can distinguish from "zero data" — do not let a network failure look
  like "we have zero inventory."

---

## 10. Testing Requirements

- Unit tests (Vitest, matching existing `src/lib/errors.test.ts`
  convention) for all four query functions using fixture/mocked data
  covering:
  - Normal populated case.
  - Empty table case.
  - Null `min_stock` rows excluded from low-stock count.
  - Null `purchase_cost` rows excluded from value sum but counted in
    `excludedCount`.
  - Soft-deleted (`deleted_at` set) rows excluded from every metric.
- No component or e2e tests needed this sub-phase — there's no UI yet.
- Migration test: confirm existing seed data survives the migration with
  `min_stock` correctly null, not defaulted.

---

## 11. Definition of Done

- [ ] Migration adds `min_stock` to `inventory_parts`, nullable, no
      default, with the check constraint.
- [ ] ADR 0007 (threshold column) and ADR 0008 (valuation formula) exist
      in `docs/decisions/`, following the existing format.
- [ ] Four query functions exist, are server-side only, and are unit
      tested against the cases in §10.
- [ ] Typecheck, lint, format, build, and unit tests all pass.
- [ ] No UI changes made.
- [ ] No Sales/Purchases/Suppliers/Customers/Invoicing concepts
      introduced.

---

## 12. Dependencies

- Requires Phase 1's schema, RLS, and Supabase client setup exactly as
  currently built.

---

## 13. Phase Boundary

Must NOT be built in this sub-phase:

- Any dashboard UI (2b, 2c, 2d).
- Global search (2e).
- Any role-based display gating (belongs with the KPI cards in 2b, since
  it's a presentation decision, not a data decision).

---

## 14. Handoff to Next Sub-Phase (2b)

2b can start immediately with:

- `min_stock` available on every `inventory_parts` row.
- Four tested, typed, server-side functions ready to call directly from
  the dashboard page: `getInventoryItemCount()`, `getInventoryValue()`,
  `getLowStockCount()`, `getOutOfStockCount()`.
- ADRs 0007/0008 to reference when explaining *why* the KPI cards show
  what they show.
