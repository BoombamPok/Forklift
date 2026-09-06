# ForkStock — Phase 4
# Warehouse Management

## Status

Phase: 4 of 7
Priority: HIGH
Depends on: Phase 1 (schema/foundation) + Phase 3 (Inventory + Parts) —
both complete. Phase 3 already consumes the warehouse hierarchy (box
picker on the part form); Phase 4 builds the management/browsing UI for
that same hierarchy.

## Tooling

Use the **`taste`** skill for any UI work here. The **UI/UX Max Pro**
plugin auto-triggers on relevant UI work — heed its feedback. Use
**Motion** (already a dependency) for meaningful transitions — restrained,
not decorative.

## Note on scope

A real catalogue CSV (brand/part/model/compatibility data) was provided
around this time — that's Phase 5 (Catalogue + Vehicle Compatibility)
territory, not this phase. Do not let catalogue import work leak into
Phase 4; flag it for Phase 5 if it comes up mid-build.

---

## 1. Mission

Make the physical warehouse a first-class, manageable feature: create/
edit/soft-delete warehouses, racks, shelves, and boxes; browse the
hierarchy and see what's actually stored where; support stock transfers
between locations at the warehouse-management level (distinct from
Phase 3's per-part Transfer movement, which already exists — this phase
is about *browsing and managing the structure itself*, not re-litigating
the movement workflow).

---

## 2. Starting State (verified against the real repo)

- Schema (Phase 1, unchanged): `warehouses` (`id`, `name` unique,
  `address`, `deleted_at`) → `racks` (`warehouse_id`, `code`, unique per
  warehouse) → `shelves` (`rack_id`, `code`, unique per rack) → `boxes`
  (`shelf_id`, `code`, unique per shelf) → `deleted_at`. No hardcoded
  counts anywhere; fully data-driven per `CLAUDE.md` §4/phase1.md §32.
- `inventory_parts.box_id` (nullable) is the only link from inventory
  into this hierarchy — a part may have no box assigned yet.
- Route stubs already exist: `/warehouse` (list/overview placeholder),
  `/warehouse/racks/[id]`, `/warehouse/boxes/[id]` — all currently
  placeholders. **No `/warehouse/shelves/[id]` stub exists yet** — add it
  this phase; the nesting was simply not stubbed in Phase 1.
- `getBoxOptions()` in `src/features/inventory/queries.ts` already
  flattens the full hierarchy into `Warehouse / Rack / Shelf / Box`
  labeled options for Phase 3's part-form Combobox — this is the proven
  pattern (flat fetch, join in JS, no PostgREST embeds) to extend, not
  replace.
- `src/lib/permissions`: `warehouse.view` (all roles) and
  `warehouse.manage` (admin, manager only — staff/read-only do not
  manage the structure) already defined and ready to enforce.
- Real inventory now exists in the live project from Phase 3's own
  testing (a handful of real parts, at least one test part with real
  stock movements) — Phase 4's occupancy views will show genuine, if
  sparse, data from day one rather than an empty system.
- Shared components ready to reuse: `DataTable`, `Form`, `ConfirmDialog`,
  `EmptyState`, `ErrorState`, `LoadingState`, `Combobox`, breadcrumb
  pattern (if established — check `src/components/shared` for one; if
  none exists, this phase's nested browsing is the first place hierarchy
  breadcrumbs are actually needed).

---

## 3. Goals

1. Full CRUD (create/edit/soft-delete) for warehouses, racks, shelves,
   and boxes, respecting the `warehouse.manage` permission boundary.
2. A browsable hierarchy: warehouse list → racks in a warehouse → shelves
   in a rack → boxes on a shelf → parts in a box.
3. Occupancy visibility: how many boxes exist per shelf/rack/warehouse,
   how many are empty vs. holding parts, without inventing a fake
   "capacity" concept the schema doesn't have.
4. A part's current location, already shown on its Phase 3 detail page,
   should link into this phase's browsing views (and vice versa — a
   box's detail page should list the parts currently in it).

---

## 4. Scope

### Included

- `/warehouse`: list of warehouses (name, address, rack count, real
  occupancy summary) with create/edit/soft-delete (admin/manager only).
- `/warehouse/[id]` (new route — the warehouse detail/rack-browser page;
  currently only `/warehouse/racks/[id]` and `/warehouse/boxes/[id]`
  stubs exist, with no warehouse-level detail page): racks within that
  warehouse, create/edit/soft-delete a rack.
- `/warehouse/racks/[id]`: real implementation — shelves within that
  rack, create/edit/soft-delete a shelf.
- `/warehouse/shelves/[id]` (new route, not yet stubbed): boxes on that
  shelf, create/edit/soft-delete a box.
- `/warehouse/boxes/[id]`: real implementation — this specific box's
  code/location chain, and the list of `inventory_parts` currently
  assigned to it (linking to each part's Phase 3 detail page).
- Breadcrumb navigation reflecting the real hierarchy position
  (Warehouse / Rack / Shelf / Box) at every level.
- Occupancy counts: e.g. "12 of 16 boxes have parts assigned" at the
  shelf/rack/warehouse level — computed from real `inventory_parts.box_id`
  data, not a fabricated capacity figure (`CLAUDE.md` §13: don't invent
  business data — there is no "box capacity" concept in the schema, so
  don't display one).
- Soft-delete for any level, with a clear warning if the location (or
  anything beneath it) currently holds parts — deleting a box that still
  has parts assigned should require explicit acknowledgment, not silently
  orphan those parts' `box_id` references.
- Location move: a way to move a part from this phase's box detail page
  as a shortcut into Phase 3's existing Transfer movement flow (reuse the
  existing `recordStockMovement` Server Action and Transfer form — do not
  build a second, parallel way to change a part's box that bypasses the
  movement ledger).

### Explicitly Not Included

- Catalogue import/management (Phase 5) — the CSV mentioned above is
  explicitly out of scope here.
- QR/barcode location labels — permanent V1 exclusion.
- A fabricated "capacity per box" or "max items per box" concept — the
  schema has no such column; do not invent one without it being a real,
  decided requirement (flag as a question if it turns out to be wanted).
- Full reporting (e.g. "warehouse occupancy over time" trend charts) —
  Phase 6. This phase shows current, real occupancy only.
- Changing Phase 3's per-part Transfer workflow itself — this phase
  reuses it, doesn't redesign it.

---

## 5. Decision Required: Soft-Delete Cascade Behavior

Racks/shelves/boxes currently cascade-delete at the *hard*-delete
foreign-key level (`on delete cascade`), but this phase implements
*soft* delete (`deleted_at`), which the FK cascade doesn't touch at all —
soft-deleting a rack does nothing to its shelves/boxes automatically.

**Recommend**: soft-deleting a rack/shelf must also soft-delete
everything beneath it in the same transaction (deleting a rack
soft-deletes its shelves and their boxes), and must be blocked (or
require an extra explicit confirmation step) if any box beneath it still
has `inventory_parts` assigned — surface exactly which parts are affected
so the user can reassign or transfer them first rather than being
blocked with no explanation.

If overridden (e.g. product wants independent soft-delete per level with
no cascade), implement the override and record it in
`docs/decisions/`.

---

## 6. Detailed Requirements

- All writes (create/edit/soft-delete at any level) go through Server
  Actions, consistent with the existing architecture — no new API route
  handlers.
- Every write checks `warehouse.manage` server-side in addition to RLS —
  confirm RLS currently allows admin/manager to write to
  `warehouses`/`racks`/`shelves`/`boxes` and staff/read-only only to
  read; if RLS doesn't yet match this boundary, that's a schema/RLS gap
  to fix via a small migration, not something to route around in the UI
  layer alone.
- Extend `getBoxOptions()`'s flattening pattern (or refactor it into a
  shared hierarchy-fetching utility both Phase 3's box picker and this
  phase's browsing views call) rather than writing a second, separate
  hierarchy-flattening implementation — this is the reuse opportunity the
  starting state sets up.
- Code uniqueness is already enforced by DB constraints
  (`unique(warehouse_id, code)`, etc.) — surface constraint violations as
  clear form errors ("A rack with this code already exists in this
  warehouse"), not raw Postgrest errors.
- Occupancy counts must be computed queries (real counts against real
  `inventory_parts.box_id`), not client-side approximations that could
  drift from the truth.

---

## 7. User Workflows

1. **Admin sets up a new warehouse** → creates the warehouse, then adds
   racks, then shelves, then boxes, building out the structure before any
   inventory needs to reference it.
2. **Manager browses to find where something is** → starts at
   `/warehouse`, drills into a rack, a shelf, a box, and sees exactly
   which parts are physically there.
3. **Staff looks up a part's location from its detail page (Phase 3)** →
   clicks through into this phase's box view to see everything else
   stored alongside it.
4. **Manager decommissions a rack** → attempts soft-delete, sees which
   boxes/parts are affected if any, and either reassigns those parts
   first or confirms the cascade per §5's resolved decision.
5. **Manager moves a part to a new box** → from the box detail page (or
   the part detail page), triggers a Transfer — the same Phase 3
   movement flow, not a new one — and both pages reflect the change.

---

## 8. Data Requirements

No new tables. Confirm whether RLS policies for
`warehouses`/`racks`/`shelves`/`boxes` already match the
`warehouse.manage` boundary (§6) — if not, a small RLS migration is
needed, following the same pattern as prior hardening migrations.

---

## 9. UI / UX Requirements

- Follow existing design tokens/spacing/table conventions — no new
  visual language.
- Breadcrumbs at every nested level (Warehouse / Rack / Shelf / Box),
  each segment a real link.
- Occupancy shown as a simple, honest ratio or badge (e.g. "8/12 boxes
  occupied"), not a chart — this phase is about structure and browsing,
  not analytics (Phase 6 owns charts/trends).
- Soft-delete confirmation dialogs (existing `ConfirmDialog`) must state
  plainly what's affected, per §5's resolved cascade behavior.
- Create/edit forms follow existing `Form`/RHF+Zod conventions.
- Loading/empty/error states on every new data-fetching surface.

---

## 10. Permissions

- `warehouse.view` — all roles: can browse the full hierarchy read-only.
- `warehouse.manage` — admin, manager only: create/edit/soft-delete at
  any level. Staff/read-only see no action buttons at all (absent, not
  disabled — consistent with the Phase 2/3 precedent).
- The Transfer-shortcut action (§4) inherits Phase 3's existing
  `inventory.transfer` permission (admin, manager, staff) — not
  `warehouse.manage` — since it's fundamentally a stock movement, not a
  structural change to the warehouse.

---

## 11. Validation & Error Handling

- Duplicate code within the same parent (rack code within a warehouse,
  etc.) surfaces as a clear form error backed by the existing unique
  constraints.
- Soft-deleting a location with parts still assigned follows the §5
  decision exactly — never silently orphan a part's `box_id`.
- Occupancy queries must handle a genuinely empty hierarchy (fresh
  install, or a warehouse with zero racks yet) with the existing
  `EmptyState`, not an error.

---

## 12. Testing Requirements

- Unit tests: hierarchy-flattening/occupancy-calculation logic,
  cascade/soft-delete-blocking logic per §5.
- Component tests: each CRUD form (warehouse/rack/shelf/box), role-gated
  action visibility, breadcrumb rendering at each level, occupancy
  badge rendering.
- Integration/DB tests: confirm RLS matches `warehouse.manage` boundary;
  confirm soft-delete cascade behavior matches the resolved §5 decision.
- E2E: create a warehouse → rack → shelf → box chain, confirm browsing
  works end-to-end, confirm a part can be assigned to a box (via Phase
  3's existing flow) and appears on that box's detail page. Same
  live-data discipline as Phases 2/3 — use clearly-marked test data, and
  note in `PROGRESS.md` whatever is left behind rather than silently
  leaving it.

---

## 13. Definition of Done

- [ ] Full CRUD for warehouses, racks, shelves, boxes, respecting
      `warehouse.manage`.
- [ ] `/warehouse`, `/warehouse/[id]` (new), `/warehouse/racks/[id]`,
      `/warehouse/shelves/[id]` (new), `/warehouse/boxes/[id]` all real,
      not placeholders.
- [ ] Breadcrumb navigation works at every level.
- [ ] Real occupancy counts shown, no fabricated capacity concept.
- [ ] Box detail page lists real parts assigned to it, linking to Phase
      3's part detail pages.
- [ ] Location-move shortcut reuses Phase 3's existing Transfer
      movement — no parallel box-change path introduced.
- [ ] Soft-delete cascade behavior matches the resolved §5 decision,
      recorded in `docs/decisions/` if overridden.
- [ ] RLS confirmed (or fixed via migration) to match
      `warehouse.manage`/`warehouse.view`.
- [ ] Typecheck, lint, format, build, unit, component, and e2e tests all
      pass.
- [ ] No catalogue import/management, QR/barcode, or
      Sales/Purchases/Suppliers/Customers features introduced.

---

## 14. Dependencies

Requires Phase 1's schema/RLS and Phase 3's inventory module (box picker
pattern, Transfer movement flow) exactly as currently built.

---

## 15. Phase Boundary

Must NOT be built this phase:

- Catalogue/brand/model/compatibility management or the CSV import
  (Phase 5).
- Full reporting/occupancy-trend analytics (Phase 6).
- QR/barcode, Sales/Purchases/Suppliers/Customers/Invoicing — never.

---

## 16. Handoff to Next Phase

Phase 5 (Catalogue + Vehicle Compatibility) inherits a stable inventory
+ warehouse foundation to link catalogue data against — and can finally
import the CSV catalogue data now sitting ready, using
`inventory_parts.catalogue_part_id` and the existing catalogue schema
from Phase 1, without needing anything further from this phase.
