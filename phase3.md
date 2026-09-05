# ForkStock — Phase 3
# Inventory + Parts

## Status

Phase: 3 of 7
Priority: HIGH
Depends on: Phase 1 (foundation) + Phase 2 (dashboard/search) — both
complete and verified. This phase builds the real inventory module the
dashboard/search have been pointing at since Phase 2.

## Tooling

Use the **`taste`** skill for any UI work here. The **UI/UX Max Pro**
plugin auto-triggers on relevant UI work — heed its feedback. Use
**Motion** (already a dependency) for meaningful transitions (row
add/remove, form submit states) — restrained, not decorative.

---

## 1. Mission

Build the real inventory module: a full, filterable/sortable parts table,
a real part detail page, create/edit part forms, and the Stock In / Out /
Transfer / Adjust / Damaged / Returned workflows — all backed by the
schema and ledger that already exist. This is the phase where ForkStock
stops being a dashboard shell and becomes a tool people actually use to
manage stock.

---

## 2. Starting State (verified against the real repo)

- `inventory_parts`: `id`, `catalogue_part_id` (nullable FK), `part_number`,
  `name`, `box_id` (nullable FK), `quantity` (trigger-maintained, never
  written directly — insert forces `quantity = 0`, opening stock must go
  through `stock_movements`), `purchase_cost`, `selling_price`, `status`
  (`active`/`discontinued`/`damaged`), `notes`, `min_stock` (nullable,
  added in 2a), `deleted_at`.
- `stock_movements`: insert-only ledger (`movement_type` ∈ `in`/`out`/
  `transfer`/`adjust`/`damaged`/`returned`, `quantity_change`,
  `from_box_id`/`to_box_id`, `reason`, `created_by` — server-set via
  trigger, cannot be spoofed by the client). No UPDATE/DELETE RLS policy
  exists on this table — history is permanent.
- `part_images`: `inventory_part_id`, `storage_path`, `uploaded_by`
  (server-set via trigger).
- Warehouse hierarchy (`warehouses`→`racks`→`shelves`→`boxes`) exists and
  is populated in the live project, but its own management UI is Phase
  4's job — Phase 3 only needs to let users *pick* a box for a part, not
  manage the hierarchy itself.
- `src/lib/permissions/index.ts` already defines the exact permissions
  this phase enforces: `inventory.view`, `inventory.create`,
  `inventory.edit`, `inventory.delete`, `inventory.adjust`,
  `inventory.transfer` — mapped per role (admin/manager: all; staff: view/
  create/edit/adjust/transfer, no delete; read_only: view only). RLS
  independently enforces the same boundary server-side — this phase must
  keep both in agreement, not just the UI-level table.
- Route stubs already exist: `/inventory` (`page.tsx`) and
  `/inventory/[id]` (`page.tsx`) — currently placeholders. Search (Phase
  2e) already links in-stock results to `/inventory/[id]`, so that route
  is already user-facing via search, not just a stub to fill in later.
- Shared components ready to reuse: `DataTable` (TanStack Table v8),
  `Form` (RHF + Zod field primitives), `ConfirmDialog`, `EmptyState`,
  `ErrorState`, `LoadingState`, `StatusBadge`, `Combobox`, toast pattern.
- Real catalogue data is live (284 parts, brands, models, compatibility)
  — Phase 3's "link to catalogue" picker should query real
  `catalogue_parts`, not placeholder data.
- Currently near-zero real inventory rows exist in the live project (a
  couple of seed/sample parts only) — this phase's own testing will be
  the first real volume of inventory activity in the live system.

---

## 3. Goals

1. A real, paginated, sortable, filterable inventory table at
   `/inventory` — replacing the placeholder.
2. A real part detail page at `/inventory/[id]` — replacing the
   placeholder, matching what search already links to.
3. Create and edit part forms, with the catalogue-link decision (§5)
   built in from the start.
4. All six stock movement types implemented as real workflows, each
   writing to `stock_movements` and never touching `quantity` directly.
5. Soft-delete (never hard-delete) for parts, respecting the permission
   model already in place.
6. Duplicate-part detection at creation time.
7. Part images: upload/view/remove, using Supabase Storage per the Phase
   1 storage foundation.

---

## 4. Scope

### Included

- Inventory list: `DataTable` with server-side pagination, column sort
  (part number, name, quantity, status), filters (status, low-stock/
  out-of-stock, catalogue-linked vs. inventory-only).
- Inventory list reuses/extends the same search-adjacent query patterns
  from Phase 2 (flat queries, joined in JS — same precedent as 2a/2c/2e)
  rather than introducing PostgREST embeds.
- Part detail page: core fields, current quantity, box location (name/
  code chain, read-only reference to Phase 4's hierarchy — no location
  *editing* UI here beyond picking an existing box), linked catalogue
  part (if any) with a clear "Catalogue Only" vs. "Catalogue + Inventory"
  indicator, images, and a stock movement history table scoped to that
  part (reuses/extends Phase 2c's activity patterns).
- Create/Edit part form: part number, name, box (Combobox against real
  boxes), purchase cost, selling price, status, notes, min_stock,
  optional catalogue link (Combobox against real `catalogue_parts`).
- New part creation always starts at `quantity = 0` (enforced by the
  existing DB trigger) — the create form must immediately prompt for an
  opening Stock In movement as a natural next step, not leave the user
  at zero with no path forward.
- Stock movement workflows, each a form + confirmation where warranted:
  - **Stock In**: quantity, box (defaults to current), reason/reference.
  - **Stock Out**: quantity (validated ≤ current quantity), reason.
  - **Transfer**: quantity, from box (current), to box — quantity
    unchanged at the part level, `from_box_id`/`to_box_id` both set.
  - **Adjust**: signed quantity change, reason (required — an adjustment
    with no reason is a data-integrity problem waiting to happen).
  - **Damaged**: quantity, reason.
  - **Returned**: quantity, reason/reference.
- Soft delete: sets `deleted_at`, requires confirmation, admin/manager
  only per existing permission model (already enforced by both RLS and
  `src/lib/permissions`).
- Duplicate detection: on create, warn (not block) if an existing
  non-deleted `inventory_parts` row shares the same `part_number` — show
  the existing row and let the user decide (proceed anyway, or go edit
  the existing one instead). Do not silently merge.
- Part images: upload to Supabase Storage (bucket/path convention per
  Phase 1's storage ADR), insert a `part_images` row, display a simple
  gallery on the detail page, allow removal (removes the row and the
  storage object).

### Explicitly Not Included

- Warehouse/rack/shelf/box *management* UI (create/edit/delete a
  warehouse, rack, shelf, or box) — Phase 4. Phase 3 only consumes the
  existing hierarchy via a picker.
- Catalogue *management* UI (creating/editing brands, models,
  categories, compatibility) — Phase 5. Phase 3 only reads catalogue
  data for linking/searching.
- Full reporting/analytics beyond what Phase 2's dashboard already shows
  — Phase 6.
- QR/barcode anything — permanent V1 exclusion.
- Bulk import/export of inventory — not specified in `CLAUDE.md` for this
  phase; flag as a question if it turns out to be expected rather than
  building it speculatively.
- Any Sales/Purchases/Suppliers/Customers/Invoicing concept.

---

## 5. Decision Required: Duplicate Part Number Handling

`part_number` has an index but no unique constraint at the database
level (correctly — the same physical part number could legitimately
exist across catalogue vs. inventory, or a business could have
historical duplicates). This phase needs an explicit product decision on
exactly what "duplicate" means for the warning in §4:

**Recommend**: warn (don't block) when creating a new `inventory_parts`
row whose `part_number` exactly matches an existing non-deleted row's
`part_number`. Do not attempt fuzzy/similar-part-number matching in this
phase — that's a data-quality feature that could reasonably grow into
its own effort later, and CLAUDE.md's "duplicate detection and safe
merging are important" (§13) doesn't require solving fuzzy matching now.

If overridden, document the actual rule chosen in `docs/decisions/`.

---

## 6. Detailed Requirements

- All writes (create, edit, movements, soft-delete, image upload/delete)
  go through Server Actions, consistent with the existing Server-
  Components-and-Server-Actions-only architecture (ADR 0004) — no new
  API route handlers.
- Every write path must check the relevant permission
  (`src/lib/permissions`) server-side before attempting the write, in
  addition to RLS — both layers must independently agree, per the
  existing "RLS is the real enforcement boundary" convention already
  documented in that file.
- Stock movement forms must never allow the client to write directly to
  `inventory_parts.quantity` — they only ever insert a `stock_movements`
  row and let the existing trigger (`apply_stock_movement()`) update
  quantity. This is already enforced at the DB level (a direct quantity
  write throws), so a Server Action attempting to bypass it will fail
  loudly in testing — treat that as confirmation the guard works, not a
  bug to route around.
- Reason/notes fields on movements that require them (Adjust, per §4)
  must be enforced both in the Zod schema and treated as a real business
  rule, not just a UI nicety.
- Part detail page's movement history should reuse Phase 2c's
  "plain-language description" convention for consistency (e.g. "Stock
  In: +25 units" rather than a raw enum value).
- Image storage: follow the bucket/path/ownership convention already
  decided in Phase 1's storage ADR — do not invent a new one.

---

## 7. User Workflows

1. **Staff searches for a part (Phase 2e), lands on its detail page** →
   sees current quantity, location, linked catalogue info, and full
   movement history.
2. **Staff receives a delivery** → finds or creates the part, performs a
   Stock In with quantity and a reference, sees quantity update
   immediately, sees the movement appear in the part's history and in
   the dashboard's recent activity (Phase 2c) without any extra work.
3. **Manager notices a discrepancy during a count** → performs an Adjust
   with a required reason; the adjustment is visible in history exactly
   like any other movement, never silently edited into the quantity.
4. **Manager relocates stock** → performs a Transfer between two boxes;
   quantity is unchanged, location updates, and the movement is logged.
5. **Admin discontinues a part** → soft-deletes it; it disappears from
   the default inventory list view but remains in reporting/history and
   is recoverable.
6. **Staff creates a new part that turns out to already exist** → sees
   the duplicate warning before committing, and can choose to go edit the
   existing part instead.

---

## 8. Data Requirements

No new tables. Confirm whether any new column is genuinely needed once
building starts (e.g. if the duplicate-detection UI needs something the
current schema doesn't expose) — if so, treat it the same way 2a treated
schema gaps: a small additive migration plus an ADR, not a silent
workaround.

---

## 9. UI / UX Requirements

- Inventory list and part detail follow the same design tokens, spacing,
  and table conventions established in Phase 1/2 — no new visual
  language introduced.
- Status badges (Active/Discontinued/Damaged, and stock-level badges
  reused from Phase 2d's Low/Critical/Out-of-Stock logic) use existing
  semantic tokens.
- Every stock movement action requiring confirmation (per CLAUDE.md
  §29 — destructive/consequential actions) uses the existing
  `ConfirmDialog`, stating what will happen and whether it's reversible
  (movements are permanent history; soft-delete is reversible by an
  admin/manager).
- Forms follow the existing `Form`/RHF+Zod conventions from Phase 1/2 —
  clear validation messages, loading/disabled states during submit.
- Loading/empty/error states on every new data-fetching surface (list,
  detail, movement history), using the existing shared components.

---

## 10. Permissions

Enforce (both server-side and via existing RLS, which must independently
agree):

- `inventory.view` — all roles.
- `inventory.create` / `inventory.edit` — admin, manager, staff.
- `inventory.delete` — admin, manager only.
- `inventory.adjust` / `inventory.transfer` — admin, manager, staff.
- Read-only sees the list/detail/history but no action buttons at all —
  not disabled buttons, absent ones, consistent with the existing
  dashboard convention (Phase 2b's value-card visibility precedent).

---

## 11. Validation & Error Handling

- Stock Out / Transfer / Damaged cannot reduce quantity below zero —
  validated in the form before submission, and backstopped by the
  existing DB check constraint (`quantity >= 0`) — a rejected DB write
  must surface as a clear form error, not a raw Postgrest error.
- Adjust requires a reason; empty reason is a validation error, not a
  silently-defaulted one.
- Duplicate part-number warning (per §5) is non-blocking but must be
  clearly visible before the user can miss it.
- Image upload failures (storage errors) must not leave an orphaned
  `part_images` row with no actual file, or vice versa — handle the
  two-step write (storage + DB row) so a partial failure is recoverable
  or clearly surfaced, not silently inconsistent.

---

## 12. Testing Requirements

- Unit tests: quantity-validation logic, duplicate-detection query,
  movement-type-specific validation (Adjust's required reason, Stock
  Out's quantity ceiling).
- Component tests: inventory list (loading/empty/error/populated,
  role-based action visibility), part detail page (same), each movement
  form (valid/invalid submission, confirmation flow).
- Integration/DB tests: confirm a direct quantity write still fails (this
  should already be true from Phase 1/2a — a regression test, not new
  behavior); confirm each movement type correctly updates quantity via
  the trigger; confirm soft-delete respects the permission boundary.
- E2E: create a part, perform at least one Stock In and one Stock Out,
  confirm quantity and history update correctly, confirm the part
  appears/disappears from the list appropriately after soft-delete —
  following the same "don't pollute live data without asking" judgment
  applied in Phase 2c/2d (use a clearly-marked test part, and clean it up
  afterward if practical, or ask before leaving persistent test data in
  the live project).

---

## 13. Definition of Done

- [ ] `/inventory` shows a real, paginated, filterable/sortable table.
- [ ] `/inventory/[id]` shows real detail, images, and movement history.
- [ ] Create/edit forms work, including the catalogue-link picker and
      duplicate-part-number warning.
- [ ] All six stock movement types work end-to-end, each writing only to
      `stock_movements`, never to `quantity` directly.
- [ ] Soft-delete works and respects the permission model.
- [ ] Part image upload/view/remove works.
- [ ] Permission boundaries (§10) hold both in the UI and independently
      in RLS.
- [ ] Any schema gap found mid-build is handled via a proper migration +
      ADR, not a workaround.
- [ ] Duplicate-detection decision (§5) resolved and recorded if
      overridden.
- [ ] Typecheck, lint, format, build, unit, component, and e2e tests all
      pass.
- [ ] No warehouse-management, catalogue-management, QR/barcode, or
      Sales/Purchases/Suppliers/Customers features introduced.

---

## 14. Dependencies

Requires Phase 1's schema/RLS/permissions and Phase 2's dashboard/search
foundation exactly as currently built.

---

## 15. Phase Boundary

Must NOT be built this phase:

- Warehouse/rack/shelf/box management (Phase 4).
- Catalogue/brand/model/compatibility management (Phase 5).
- Full reporting suite (Phase 6).
- QR/barcode, Sales/Purchases/Suppliers/Customers/Invoicing — never.

---

## 16. Handoff to Next Phase

Phase 4 (Warehouse Management) inherits: a working box picker/reference
pattern from the part form (proves the UI can consume the warehouse
hierarchy), and real inventory data now populated in boxes, giving Phase
4's occupancy/browsing views real data to display from day one.
