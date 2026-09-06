# ForkStock — Phase 5
# Catalogue + Vehicle Compatibility

## Status

Phase: 5 of 7
Priority: HIGH
Depends on: Phase 1 (schema) + Phase 3 (inventory linking) + Phase 4
(warehouse) — all complete. Unusually for this phase, **the real
catalogue data is already imported and live** (see §2) — this phase
builds the UI/management layer on top of data that already exists,
rather than importing it.

## Tooling

Use the **`taste`** skill for any UI work here. The **UI/UX Max Pro**
plugin auto-triggers on relevant UI work — heed its feedback. Use
**Motion** (already a dependency) for meaningful transitions — restrained,
not decorative. For any new component this phase needs (e.g. a
compatibility editor, a brand/category management form beyond what
existing shadcn/ui primitives already cover), use the **shadcn skill**
and **shadcn MCP** to fetch/generate the correct component
source/registry blocks rather than hand-rolling markup that duplicates
what shadcn already provides — this is tooling for pulling in components
correctly, not a change to the project's existing shadcn/ui-based stack.

---

## 1. Mission

Build the browsing, search, and management UI for the catalogue: brands,
categories, models, model families, parts, cross-references, and
part↔model compatibility — all reading and writing data that's already
live in the database. Also build the catalogue-only → inventory
"promotion" workflow (turning a catalogue-only part into a real stocked
item).

---

## 2. Starting State (verified against the real repo — read this carefully,
## it changes what this phase needs to do)

**The real catalogue CSV is already imported and live**, done ahead of
schedule at the user's request during Phase 2 prep (`docs/decisions/0008`,
`scripts/import-master-catalogue.mjs`, committed `d1695d9`). Confirmed
live in the database:

- 2 real brands: Godrej, Voltas/OM.
- 9 real forklift models.
- 284 real catalogue parts.
- 979 real compatibility links.
- Cross-references parsed and imported (with the one known gap: rows
  citing a brand with no actual code, e.g. `"HYDAX -"`, correctly
  recorded nothing rather than a fabricated blank reference).
- Multi-source parts (14 of 284) correctly modeled via a real
  `catalogue_part_sources` join table (not a single nullable FK).

**Schema, as it actually exists today** (Phase 1 original +
`20260905090000_catalogue_import_columns.sql`'s additions):

- `brands` (`id`, `name` unique, soft-delete).
- `categories` (`id`, `name` unique, soft-delete).
- `catalogue_model_families` (`brand_id`, `name`, soft-delete).
- `catalogue_models` (`brand_id`, `model_family_id` nullable, `name`,
  `model_code`, **`fuel_type`** — added during import, genuinely constant
  per model in the real data — soft-delete).
- `catalogue_parts` (`part_number` — not unique, business identifier only
  per `CLAUDE.md` §11 — `name`, `brand_id`, `category_id`,
  **`sub_category`, `assembly_group`, `is_fastener`, `capacity_range_kg`**
  — all added during import — `oem_reference`, `description`,
  `verification_status` ∈ `unverified`/`verified`/`uncertain`, default
  `unverified`, soft-delete).
- `catalogue_part_sources` (join table: a part can cite multiple source
  catalogues — replaces the original single `source_id` FK).
- `cross_refs` (`catalogue_part_id`, `cross_reference_number`, `source`).
- `compatibility` (join table: `catalogue_part_id` ↔ `catalogue_model_id`,
  `verification_status`, `notes`).

**Important, deliberate data-modeling decision from the import** (ADR
0008) that this phase must respect, not "fix": `capacity_range_kg` is
stored **verbatim per part row**, not derived into one canonical
per-model number — the same model can legitimately show different
ranges on different part rows depending on which other models that row
also lists. Do not build a UI that implies a single fixed capacity per
model; show the value as recorded per part, or as a range/list when a
model's parts disagree.

**Route stubs**: `/catalogue`, `/catalogue/parts`, `/catalogue/models`,
`/catalogue/models/[id]` all exist as placeholders. **No
`/catalogue/brands`, `/catalogue/parts/[id]`, or a compatibility-editing
surface exist yet** — add what's needed.

**Inventory linkage**: `inventory_parts.catalogue_part_id` (nullable) has
existed since Phase 1 and Phase 3's part form already includes a
catalogue-link Combobox. This phase does not change that linking
mechanism — it builds the catalogue-side management that makes linking
meaningful (browsing what's linkable, seeing compatibility) and the
reverse "promote to inventory" shortcut (§4).

**Permissions**: `src/lib/permissions` already defines `catalogue.view`
(all roles) and `catalogue.manage` (admin, manager — same tier as
`warehouse.manage`).

---

## 3. Goals

1. Browse brands, model families, and models — with real compatibility
   counts, not placeholders.
2. Browse and search catalogue parts — filterable by brand, category,
   model, fastener flag, verification status.
3. A real catalogue part detail page showing cross-references,
   compatibility (which models it fits, with verification status), and
   whether it's currently linked to any inventory item(s).
4. Manage (create/edit/soft-delete) brands, categories, model families,
   models, catalogue parts, cross-references, and compatibility links —
   respecting `catalogue.manage`.
5. A catalogue-only → inventory "promotion" shortcut: from a catalogue
   part with no inventory link yet, jump straight into Phase 3's create-
   inventory-part flow with the catalogue link pre-filled.
6. Preserve the verification-status distinction throughout the UI — never
   let an `unverified` or `uncertain` record display as if it were
   confirmed fact.

---

## 4. Scope

### Included

- `/catalogue`: overview — brand list with real model/part counts.
- `/catalogue/brands` (new route): full brand list with create/edit/
  soft-delete.
- `/catalogue/models`: real model list (currently a placeholder),
  filterable by brand, showing model family and fuel type.
- `/catalogue/models/[id]`: real model detail (currently a placeholder)
  — model family, fuel type, and every catalogue part compatible with
  it (from `compatibility`), each showing verification status.
- `/catalogue/parts`: real, searchable/filterable part list (part number,
  name, brand, category, fastener flag, verification status).
- `/catalogue/parts/[id]` (new route): part detail — OEM reference,
  cross-references, source(s) (via `catalogue_part_sources`), compatible
  models (via `compatibility`, each showing its own verification
  status), `capacity_range_kg` shown as recorded (per §2's ADR 0008
  constraint — do not collapse it into a single derived number), and a
  clear indicator of whether any live `inventory_parts` row is linked to
  this catalogue part (linking to that inventory detail page if so, or
  showing the "Promote to inventory" action from §4/goal 5 if not).
- Category management: a simple create/edit/soft-delete surface — likely
  a section within `/catalogue` or its own small route (engineering
  judgment; don't over-build a separate elaborate page for a single flat
  list).
- Compatibility management: add/remove a part↔model link, set/change its
  `verification_status`, optional notes — from either the part detail
  page or the model detail page (pick one primary surface; the other can
  link to it rather than duplicating the editor).
- "Promote to inventory" shortcut: a button on an unlinked catalogue
  part's detail page that opens Phase 3's create-inventory-part form
  with `catalogue_part_id` (and reasonable defaults: part_number, name)
  pre-filled — reuses Phase 3's existing create flow, does not
  reimplement it.
- Verification-status display: a consistent badge/indicator (reuse
  `StatusBadge` conventions) wherever a catalogue part or compatibility
  link appears, distinguishing `verified` from `unverified`/`uncertain`
  at a glance.

### Explicitly Not Included

- Re-running or modifying the already-completed catalogue import — that
  data is live; this phase builds UI on top of it, not a second import
  pipeline. If a *future* catalogue CSV/import is wanted, that's a new,
  separate ask — flag it as a question rather than building
  general-purpose import tooling speculatively.
- Deriving or "fixing" `capacity_range_kg` into one canonical per-model
  number — ADR 0008 already decided against this deliberately; respect
  it.
- Full reporting/analytics on catalogue data (e.g. "most-requested
  models") — Phase 6.
- QR/barcode anything.
- Any Sales/Purchases/Suppliers/Customers/Invoicing concept.
- Changing Phase 3's inventory-part form's existing catalogue-link
  Combobox mechanism — this phase adds a *shortcut into* that same form,
  not a replacement for it.

---

## 5. Decision Required: Compatibility Editing Surface

§4 asks for compatibility management from "either" the part or model
detail page. Recommend: **the part detail page is the primary editor**
(add/remove models this part fits, set verification status per link),
since a part typically has fewer, more specific compatibility edits to
make at once than a model does (a model can have dozens of compatible
parts; editing them all from the model side is a heavier UI). The model
detail page shows the same compatibility data read-only, with a link
back to each part's detail page to edit from there.

If overridden, implement the override and record it in
`docs/decisions/`.

---

## 6. Detailed Requirements

- All writes go through Server Actions, consistent with the existing
  architecture — no new API route handlers.
- Every write checks `catalogue.manage` server-side, in addition to
  RLS — confirm the Phase 1 catalogue RLS policies already match this
  boundary (admin/manager write, all roles read); if not, a small RLS
  migration is needed, following the hardening-migration pattern already
  used twice.
- Part search/filter should follow the same flat-query, join-in-JS
  convention established in Phases 2–4 (no PostgREST embeds) for
  consistency, unless the catalogue's join complexity (part → brand,
  category, sources, cross-refs, compatibility → models) genuinely
  makes that impractical — if so, document the deviation rather than
  silently introducing a different pattern.
- The "Promote to inventory" shortcut must pass through Phase 3's actual
  `createInventoryPart` Server Action / form component — not a
  duplicate, simplified version of it.
- Never let the UI display `capacity_range_kg`, `fuel_type`, or any
  other catalogue attribute as more certain than the data actually is —
  e.g. if a model's compatible parts disagree on capacity range (which
  ADR 0008 explains can genuinely happen), show what's actually recorded
  per part, not an averaged or "primary" value invented for display
  purposes.

---

## 7. User Workflows

1. **Manager browses by brand** → sees Godrej and Voltas/OM, drills into
   a model family, then a specific model, and sees every part compatible
   with it and how confident that compatibility is.
2. **Staff searches the catalogue for a part** → finds it by part number,
   OEM reference, or cross-reference; sees whether it's already stocked
   (linked to inventory) or catalogue-only.
3. **Staff finds a catalogue-only part the business now wants to stock**
   → uses "Promote to inventory," lands in Phase 3's create form with the
   catalogue link and known fields pre-filled, completes the rest (box,
   cost, opening stock) as usual.
4. **Manager corrects a compatibility record** → changes an `uncertain`
   link to `verified` (or removes an incorrect one) from the part detail
   page, with the change immediately reflected on the model's page too.
5. **Admin adds a new brand/category** ahead of future catalogue growth
   (per `CLAUDE.md` §5's expectation the catalogue will grow well beyond
   284 parts) — a simple, unhurried CRUD flow, not a bulk-import feature.

---

## 8. Data Requirements

No new tables expected. Confirm RLS on
`brands`/`categories`/`catalogue_model_families`/`catalogue_models`/
`catalogue_parts`/`cross_refs`/`compatibility`/`catalogue_part_sources`
matches `catalogue.view`/`catalogue.manage` — fix via migration if not,
following the established hardening-migration pattern.

---

## 9. UI / UX Requirements

- Follow existing design tokens, table, and form conventions — no new
  visual language.
- Verification-status badges reuse existing semantic tokens consistently
  wherever they appear (part list, part detail, model detail,
  compatibility editor).
- The catalogue's scale (`CLAUDE.md` §5: expect ~1,500–2,000 parts
  eventually, not just the current 284) means the parts list must be
  genuinely paginated/searchable from day one — do not build something
  that only works at current volume.
- Breadcrumbs for the brand → model family → model nesting, consistent
  with Phase 4's `HierarchyBreadcrumb` pattern if it reasonably extends
  to this hierarchy (reuse if it fits; don't force it if the shapes
  differ too much).
- Loading/empty/error states on every new data-fetching surface.

---

## 10. Permissions

- `catalogue.view` — all roles: browse everything read-only.
- `catalogue.manage` — admin, manager only: create/edit/soft-delete at
  any level, edit compatibility. Staff/read-only see no action buttons
  (absent, not disabled — consistent with every prior phase's
  precedent).
- "Promote to inventory" requires `inventory.create` (Phase 3's existing
  permission), not `catalogue.manage` — it's fundamentally creating an
  inventory record, so it should be available to staff, matching who can
  already create inventory parts directly.

---

## 11. Validation & Error Handling

- Unique-constraint violations (brand name, category name, model
  per-brand uniqueness, etc.) surface as clear form errors, matching the
  pattern established in Phase 4's warehouse actions
  (`isUniqueViolation` / per-field messages), not raw Postgrest errors.
- Compatibility link creation should prevent an exact duplicate
  (part+model pair) — already enforced by the existing `unique
  (catalogue_part_id, catalogue_model_id)` constraint; surface it as "This
  part is already linked to this model" rather than a generic error.
- Removing a compatibility link is a real data change (someone decided
  this part doesn't fit that model after all) — use the existing
  `ConfirmDialog` pattern, not a bare delete button.

---

## 12. Testing Requirements

- Unit tests: filter/search query construction for the parts list,
  verification-status display logic.
- Component tests: brand/model/part list and detail pages
  (loading/empty/error/populated, role-gated actions), compatibility
  editor (add/remove/verification-status change), "Promote to inventory"
  handoff (correct pre-filled values).
- Integration/DB tests: confirm RLS matches the `catalogue.view`/
  `catalogue.manage` boundary.
- E2E: browse from a brand down to a model's compatible parts; search
  for a real imported part (e.g. a known Godrej part number) and confirm
  it appears with correct data; promote a catalogue-only part into
  inventory and confirm the resulting inventory record is correctly
  linked. Use the real, already-imported catalogue data for these
  checks where possible (it's real and live already) rather than
  creating synthetic catalogue fixtures — but avoid leaving new
  synthetic *inventory* test data in the live project without noting it
  in `PROGRESS.md`, consistent with every prior phase.

---

## 13. Definition of Done

- [ ] `/catalogue`, `/catalogue/brands` (new), `/catalogue/models`,
      `/catalogue/models/[id]`, `/catalogue/parts`, `/catalogue/parts/[id]`
      (new) are all real, not placeholders.
- [ ] Full CRUD for brands, categories, model families, models,
      catalogue parts, cross-references, respecting `catalogue.manage`.
- [ ] Compatibility add/remove/verification-status editing works, per
      the resolved §5 decision.
- [ ] "Promote to inventory" shortcut reuses Phase 3's actual create
      flow, not a duplicate.
- [ ] `capacity_range_kg` and other per-row-verbatim fields are never
      displayed as a single derived/averaged fact (ADR 0008 respected).
- [ ] Verification status is visibly distinguished everywhere a
      catalogue record or compatibility link appears.
- [ ] RLS confirmed (or fixed via migration) to match
      `catalogue.view`/`catalogue.manage`.
- [ ] Parts list is genuinely paginated/searchable, tested against real
      volume expectations, not just the current 284 rows.
- [ ] Typecheck, lint, format, build, unit, component, and e2e tests all
      pass.
- [ ] No re-import of catalogue data, no QR/barcode, no
      Sales/Purchases/Suppliers/Customers features introduced.

---

## 14. Dependencies

Requires Phase 1's schema/RLS, the already-completed catalogue import
(ADR 0008), Phase 3's inventory create flow, and Phase 4's warehouse
module exactly as currently built.

---

## 15. Phase Boundary

Must NOT be built this phase:

- A new/second catalogue import pipeline.
- Full reporting/analytics on catalogue data (Phase 6).
- QR/barcode, Sales/Purchases/Suppliers/Customers/Invoicing — never.

---

## 16. Handoff to Next Phase

Phase 6 (Operations + Business Intelligence) inherits a fully browsable,
searchable catalogue with real compatibility data, real verification
status, and a real inventory-linkage picture — enough to build meaningful
reports (e.g. "catalogue coverage," "unlinked catalogue parts," "parts by
verification status") without needing any further catalogue-side work.
