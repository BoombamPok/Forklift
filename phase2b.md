# ForkStock — Phase 2b
# Dashboard KPI Cards

## Status

Phase: 2b of 7 (sub-phase of Phase 2 — Core UI + Dashboard)
Priority: HIGH
Depends on: Phase 2a (Dashboard Data Foundation) — must be complete. This
sub-phase calls the four query functions 2a built; it does not write new
data-access logic beyond what's noted in §6.
Followed by: 2c (stock movement chart + recent activity), 2d (low-stock
table), 2e (global search).

This document is self-contained. A session can be given `CLAUDE.md` and
this file alone and understand what to build — but should confirm 2a's
functions and ADRs actually exist before starting (see §3).

---

## 0. Tooling Available for This Work

The following are available in this environment and should be used where
relevant — do not skip them in favor of writing everything by hand from
scratch:

- **`taste` skill**: use it while building/reviewing any UI in this
  sub-phase, applying its guidance to the KPI card layout, spacing,
  qualifier/tooltip treatment, and loading skeleton.
- **UI/UX Max Pro plugin**: this auto-triggers on relevant UI work in this
  environment, so no explicit invocation is needed — just be aware it may
  surface review feedback on the KPI card work and should be heeded.
- **Motion (motion.dev / formerly Framer Motion)**: use it for any
  animation in this sub-phase — e.g. the KPI cards' loading→loaded
  transition, and the appearance of the cost-data qualifier — rather than
  ad hoc CSS transitions. Keep animation restrained and purposeful,
  consistent with `CLAUDE.md`'s "avoid decorative UI" direction: motion
  should clarify a state change (loading → data arrived), not decorate
  for its own sake. If Motion is not already a project dependency, add it
  deliberately (it is a reasonable, justified addition given this
  instruction — not one of the "unnecessary dependencies" `CLAUDE.md` §9
  warns against).

This note applies to every UI-building sub-phase from here forward (2b,
2c, 2d, 2e, and beyond) — not just this one.

---

## 1. Mission

Replace the four placeholder `KpiCard`s on `/dashboard` (currently all
showing `—`) with real, live numbers sourced from Phase 2a's query
functions: inventory item count, inventory value, low-stock count,
out-of-stock count.

This sub-phase is UI wiring plus one presentation decision (cost-value
role visibility). It does not touch the chart, activity feed, low-stock
table, or search — those are 2c, 2c, 2d, and 2e respectively.

---

## 2. Why This Sub-Phase Exists

Phase 1 intentionally shipped the dashboard with `KpiCard`s hardcoded to
`—` (see the comment in `src/app/(app)/dashboard/page.tsx`) because no
query logic existed yet and no schema supported a low-stock concept.
Phase 2a just built and tested that data layer in isolation. This
sub-phase's only job is to connect the two — the smallest possible slice
of Phase 2 that turns "the dashboard looks like a product" into "the
dashboard tells the truth."

---

## 3. Starting State

Before starting, confirm these exist (from Phase 2a):

- Migration adding `min_stock` (nullable integer) to `inventory_parts`.
- ADR `0007-inventory-min-stock-threshold.md` and
  `0008-inventory-valuation-cost-basis.md` in `docs/decisions/`.
- Four server-side, unit-tested query functions: `getInventoryItemCount()`,
  `getInventoryValue()` (returning `{ value, excludedCount }`),
  `getLowStockCount()`, `getOutOfStockCount()`.

If any of these are missing, 2a is not actually done — stop and complete
it first rather than re-deriving the queries inline here.

Also already in place from Phase 1:

- `/dashboard` page (`src/app/(app)/dashboard/page.tsx`) rendering a
  4-across responsive `KpiCard` grid, currently all `value="—"`.
- `KpiCard` component (`src/components/shared/kpi-card.tsx`) accepting
  `label`, `value`, `icon` props.
- Role/permission model: `current_user_role()` in Postgres,
  TypeScript-side capability mirror in `src/lib/permissions` (per Phase 1
  ADRs), four roles: Admin, Manager, Staff, Read-Only.

---

## 4. Decision Required: Cost-Value Visibility

`getInventoryValue()` is cost-basis (`quantity * purchase_cost`), which
exposes what the business paid for its stock — commercially sensitive in
a way item counts and low-stock counts are not.

**Recommend**: show the Inventory Value KPI card only to Admin and
Manager roles. Staff and Read-Only see the other three KPI cards (Item
count, Low stock, Out of stock) in a 3-across layout instead of 4, rather
than showing a blank/hidden fourth slot or a fake `—`.

If this recommendation is overridden, implement the override instead and
record it as ADR `0009-inventory-value-kpi-visibility.md`. Either way,
this decision must be recorded, not silently assumed.

---

## 5. Scope

### Included

- Fetch all four KPI values server-side on the `/dashboard` page (Server
  Component data fetching — no client-side Supabase calls, per Phase 1's
  server-components-only ADR).
- Render real values in the existing `KpiCard` grid:
  - **Inventory items** — plain count.
  - **Inventory value** — currency-formatted cost-basis sum; if
    `excludedCount > 0`, show a small qualifier (e.g. a subtle note or
    tooltip: "N items missing cost data, not included") rather than
    silently presenting a number that looks complete but isn't.
  - **Low stock** — count of parts at or below their configured
    threshold.
  - **Out of stock** — count of parts at zero quantity.
- Apply the Decision Required outcome from §4 (role-based visibility of
  the value card).
- Loading state: use the existing `LoadingState`/skeleton pattern while
  server data resolves (Next.js `loading.tsx` for the route, or a
  Suspense boundary around the KPI row — engineering judgment, consistent
  with whatever pattern Phase 1 already established for this route
  segment).
- Error state: if any query fails, the affected KPI card (or the whole
  row, if a shared fetch) shows the existing `ErrorState` component, not
  a broken card or a silently wrong number.
- Empty state: an empty database (fresh install, zero inventory) must
  show real zeros or `—`, per the existing null-vs-zero convention —
  zero items is a true `0`, not `—`; a `min_stock`-based low-stock count
  of `0` when there's no inventory at all is also a true `0`, not an
  error.

### Explicitly Not Included

- Stock movement chart (2c).
- Recent activity feed (2c).
- Low-stock table (2d).
- Global search (2e).
- Any new query logic beyond what 2a already built — if a gap is found
  (e.g. 2a's function signature doesn't quite fit the UI need), fix it
  minimally in 2a's file, don't duplicate query logic here.

---

## 6. Detailed Requirements

- Keep `/dashboard` as a Server Component; call the four query functions
  directly in the page (or a small server-side data-loading function
  colocated with the page) — do not introduce TanStack Query for this,
  since there's no client-side interactivity/refetching need yet (KPI
  cards are not currently expected to auto-refresh; a manual page reload
  is sufficient for this sub-phase).
- The "No data yet" `Alert` currently shown unconditionally on
  `/dashboard` should become conditional: show it only when
  `getInventoryItemCount()` is `0` (genuinely empty system), not
  permanently. Once real inventory exists, that alert should disappear.
- Currency formatting: use a consistent, existing convention if one
  exists in the codebase (check `src/lib/utils.ts`); if none exists yet,
  add a small formatting helper there rather than inlining
  `Intl.NumberFormat` calls ad hoc in the component.
- Respect the existing responsive grid already defined in Phase 1's
  dashboard (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) — adjust to
  `lg:grid-cols-3` only for the roles that don't see the value card, per
  §4.

---

## 7. User Workflows

1. **Admin/Manager opens the dashboard** → sees item count, cost-basis
   inventory value (with an honest qualifier if some cost data is
   missing), low-stock count, out-of-stock count — all real.
2. **Staff/Read-Only opens the dashboard** → sees item count, low-stock
   count, out-of-stock count in a 3-card layout; no inventory-value card
   at all (not a blanked-out or `—` card — simply absent).
3. **Fresh install, zero inventory** → dashboard shows a genuine "No data
   yet" message and honest zero/`—` KPIs, no fabricated placeholder
   numbers.

---

## 8. Data Requirements

None new — this sub-phase consumes 2a's functions and schema as-is. No
migration, no new tables/columns.

---

## 9. UI / UX Requirements

- Visual treatment of the KPI cards themselves (colors, spacing, icon
  usage) is already established by the existing `KpiCard` component and
  Phase 1's design tokens — do not restyle it in this sub-phase.
- The qualifier for incomplete cost data (§5) should be unobtrusive — a
  small caption line or an info icon with a tooltip, not an alert banner
  competing with the genuine "No data yet" empty-state alert.
- Loading state should avoid layout shift: reserve the same card
  dimensions during loading as after data resolves (skeleton matching
  final card shape, per Phase 1 §25's "no layout jumping after load"
  rule).

---

## 10. Permissions

- Role check for the Inventory Value card happens server-side (the page
  itself decides whether to fetch/render it based on the authenticated
  user's role via the existing permissions module), not just a
  client-side CSS hide — a Staff user should not receive the value in the
  server response at all, consistent with `CLAUDE.md` §12's "authorization
  must be enforced server-side."
- No other permission changes this sub-phase.

---

## 11. Validation & Error Handling

- If `getInventoryValue()` throws (e.g. Supabase unreachable), the value
  card shows `ErrorState`, and this must not prevent the other three KPI
  cards from rendering if their queries succeeded — fetch independently
  or use `Promise.allSettled`, not a single all-or-nothing fetch that
  takes down the whole row on one failure.
- Never let a query error silently render as `0` or `—` — those are
  meaningful "verified empty" and "unknown/not configured" states
  respectively, not "the request failed."

---

## 12. Testing Requirements

- Component tests: `KpiCard` row renders correct values given mocked
  query results; renders 3-card layout for Staff/Read-Only, 4-card for
  Admin/Manager; renders the cost-data qualifier when `excludedCount > 0`;
  renders `ErrorState` when a query rejects.
- Integration test: dashboard page server-renders correct KPI values
  against seeded fixture data (extend whatever fixture/seeding approach
  Phase 1's tests already use).
- E2E: extend `e2e/smoke.spec.ts` (or add a small dashboard-specific spec)
  to confirm the dashboard shows real seeded numbers after login, and
  confirm a Staff-role login does not see the inventory-value card (this
  may reuse the existing `staff` role e2e fixture noted in `PROGRESS.md`).
- No test needed for chart/activity/table/search — out of scope here.

---

## 13. Definition of Done

- [ ] All four KPI cards on `/dashboard` show real, live data (or honest
      `0`/`—`), no hardcoded placeholders remain.
- [ ] Inventory Value card is visible only to Admin/Manager, per the
      resolved §4 decision, enforced server-side.
- [ ] Cost-data-incomplete qualifier appears when applicable.
- [ ] "No data yet" alert is conditional on genuine emptiness, not
      permanent.
- [ ] Loading/empty/error states implemented for the KPI row using
      existing shared components.
- [ ] ADR 0009 recorded if the §4 recommendation was overridden.
- [ ] Typecheck, lint, format, build, unit, component, and e2e tests all
      pass.
- [ ] No changes made to the chart, activity feed, low-stock table, or
      search areas of the dashboard.

---

## 14. Dependencies

- Requires Phase 2a's migration, ADRs, and four query functions to exist
  exactly as specified there.

---

## 15. Phase Boundary

Must NOT be built in this sub-phase:

- Stock movement chart wiring (2c).
- Recent activity feed wiring (2c).
- Low-stock table (2d).
- Global search (2e).
- Any new aggregate/query logic beyond minor fixes to 2a's existing
  functions.

---

## 16. Handoff to Next Sub-Phase (2c)

2c can start with:

- A dashboard page that already fetches data server-side and handles
  loading/error states — 2c extends the same page with two more widgets
  following the same fetch/loading/error conventions established here.
- A proven role-visibility pattern (§10) that 2c can reuse if the
  activity feed or chart ever needs similar gating.
