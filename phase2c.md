# ForkStock — Phase 2c/2d/2e
# Stock Activity + Low-Stock Table + Global Search

## Status

Sub-phases 2c, 2d, 2e of Phase 2. Depends on 2a (data foundation) and 2b
(KPI cards) being complete. Combined into one doc to keep this focused —
implement in order (2c → 2d → 2e), commit each separately.

## Tooling

Use the **`taste`** skill while building any UI here. The **UI/UX Max
Pro** plugin auto-triggers on relevant UI work — heed its feedback. Use
**Motion** (motion.dev) for meaningful state transitions (data arriving,
list items appearing) — restrained, not decorative. Reuse the Motion
dependency if 2b already added it.

---

## 2c — Stock Movement Chart + Recent Activity

**Build**: a 30-day inbound/outbound bar chart and a recent-activity list
for `/dashboard`, both reading `stock_movements`, both in the existing
`ChartContainer`/`ActivityList` shells.

**New query functions** (server-side, colocated with 2a's):
`getStockMovementSeries()` → `{ date, inbound, outbound }[]`;
`getRecentActivity()` → last ~10 movements joined to
`inventory_parts` (name/part_number) and `profiles` (actor, nullable).

**Decision required** — classifying `transfer`/`adjust` for the chart:
`in`/`returned` = inbound, `out`/`damaged` = outbound (clear). Recommend:
`transfer` excluded from chart (no net quantity change) but still shown
in the activity feed; `adjust` classified by sign of `quantity_change`.
If overridden, document the choice in `docs/decisions/`.

**Rules**: independent loading/error state per widget (a chart failure
must not break the activity feed); genuine empty state with explanatory
copy if zero movements exist (realistic pre-Phase-3); never fabricate
data to fill the chart; no "create movement" UI — read-only; no "View
All" link to a page that doesn't exist yet.

**Tests**: unit tests for the classification logic and join/null
handling; component tests for empty/error/populated states; one e2e
check seeding a few movements and confirming they appear correctly.

---

## 2d — Low-Stock Table

**Build**: a read-only table on `/dashboard` — part name, part number,
linked brand/model (via nullable `catalogue_part_id`), current quantity,
`min_stock`, status badge (`Out of Stock` at qty 0, `Critical` at ≤50% of
`min_stock`, `Low` at ≤100% of `min_stock`; only rows with `min_stock`
set are eligible for Low/Critical, qty-0 rows always show regardless).

Uses the existing `DataTable` + `StatusBadge` components. A basic status
filter is fine (reusable pattern for Phase 3's fuller inventory table) —
don't over-build filtering here.

**Rules**: this is a summary view, not the inventory table — no
sort/paginate-everything, no edit affordances. **No "Restock" button** —
restocking is a Stock In workflow that belongs to Phase 3; don't add a
button with nowhere to go. Handle parts with no `catalogue_part_id`
gracefully (show part-only info, no broken join). Genuine empty state if
nothing is low/out of stock — that's a good outcome, say so plainly
("Nothing needs attention right now"), not a bare "No data."

**Tests**: unit tests for status-threshold logic; component test for
empty/populated/error states; e2e check with a seeded low-stock and a
seeded out-of-stock row rendering the right badges.

---

## 2e — Global Header Search

**Build**: wire the existing `SearchInput` shell into a working search —
query `inventory_parts` (part_number, name) and `catalogue_parts`
(part_number, cross_refs) plus `brands.name`/`catalogue_models.name`,
server-side, debounced. Results in a dropdown under the search bar for
short queries — a dedicated results page only if a dropdown genuinely
isn't enough (engineering judgment; a dropdown likely suffices at this
scope).

Results must visually distinguish **inventory-backed** (has stock/
location) from **catalogue-only** (exists, not stocked) matches — this
is a `CLAUDE.md` §6 requirement, not optional polish.

**Approach**: PostgreSQL only — `ilike`/trigram/`tsvector`, no external
search service, per `CLAUDE.md` §6/§9. Respect existing RLS as-is.

**Rules**: clicking a result with no detail page yet (Phase 3/5
territory) should route to the nearest existing placeholder route — do
not build detail pages early just to make search feel complete. Empty
query → no dropdown. No-results state is distinct from an error state.

**Tests**: unit test for query construction/result-shape logic;
component test for dropdown states (loading/empty/no-results/error/
populated, inventory-vs-catalogue distinction visible); e2e check
searching a seeded part number and confirming it appears correctly
tagged.

---

## Shared Definition of Done (all three)

- [ ] 2c, 2d, 2e each committed separately, each passing typecheck,
      lint, format, build, unit, component, and e2e tests on their own.
- [ ] No Sales/Purchases/Suppliers/Customers/Invoicing concepts anywhere.
- [ ] No QR/barcode anything.
- [ ] No inventory CRUD, warehouse browsing, or catalogue management
      introduced (Phases 3/4/5).
- [ ] Any overridden decision (chart classification) recorded in
      `docs/decisions/`.
- [ ] Dashboard now has all planned widgets (KPIs, chart, activity,
      low-stock table, search) live against real data.

## Handoff to Phase 3

Phase 3 (Inventory + Parts) inherits: a proven `DataTable` pattern
against real data (2d), a proven search foundation to extend into full
inventory search (2e), and a proven independent-widget-fetch pattern
(2c) — all reusable for the full inventory list/detail/CRUD work.
