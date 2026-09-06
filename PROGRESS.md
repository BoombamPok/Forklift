# ForkStock — Progress / Session Context

This file is the living cross-session memory for ForkStock. `CLAUDE.md` and
`phaseX.md` are static instructions/specs — they don't change as work happens.
This file tracks *actual state*: what exists, what's decided, what's next.

**Update this file whenever you finish a meaningful chunk of work**, so that a
session started after `/clear` (or a brand new session) can resume without
re-deriving context.

---

## How to resume work in a new session

1. Read `CLAUDE.md` (project rules — source of truth for conventions).
2. Read the current `phaseX.md` (this project's detailed spec, see below).
3. Read this file (`PROGRESS.md`) for actual current state.
4. Run `ls -la` / inspect the repo directly — do not trust this file blindly
   if it looks stale; reconcile against reality first.

---

## Current phase

**Phase 1 of 7 — Architecture + UX Foundation: COMPLETE.**
**Phase 2 of 7 — Core UI + Dashboard: COMPLETE.**
**Phase 3 of 7 — Inventory + Parts: COMPLETE.** See the Phase 3 section
below for full detail.
**Phase 4 of 7 — Warehouse Management: COMPLETE.** See the Phase 4
section below for full detail.

The user split Phase 2 into five sub-phases; each read the previous
ones' output:

- **2a — Schema + Data Foundation: COMPLETE** (spec: `phase2a.md`). No UI.
- **2b — Dashboard KPI Cards: COMPLETE** (spec: `phase2b.md`).
- **2c — Stock Movement Chart + Recent Activity: COMPLETE** (spec:
  `phase2c.md`, combined with 2d/2e in one doc - implemented in order).
- **2d — Low-Stock Table: COMPLETE** (spec: `phase2c.md` §"2d").
- **2e — Global Search: COMPLETE** (spec: `phase2c.md` §"2e").

**Phase 2 as a whole is done.** Phase 3 (Inventory + Parts) is also
done — see the dedicated section below.

**A premium visual-polish design pass also happened after Phase 2**,
user-requested directly (not from a phase spec) — see the "Design
pass" section below for full detail. Short version: Space Grotesk is
now `--font-heading`, meaningful icons sit in tone-tinted chips
(success/warning/destructive/info), there's a `MotionStagger` primitive
for cascading card/list entrances, and the login page is a branded
split-screen layout. Reuse these conventions in Phase 3+ UI rather than
inventing new ones — see that section and
`project-forkstock-phase2-patterns` memory for specifics.

Phases: 1) Architecture + UX Foundation → 2) Core UI + Dashboard →
3) Inventory + Parts → 4) Warehouse Management →
5) Catalogue + Vehicle Compatibility → 6) Operations + BI →
7) Security + Testing + Hardening + Launch.

Phase 1 spec: `phase1.md` (done, verified, code-reviewed). Phase 1's
implementation plan (historical reference, not needed to continue):
`/root/.claude/plans/splendid-conjuring-pony.md`. There is no combined
`phase2.md` — the user is providing one spec file per sub-phase
(`phase2a.md`, `phase2b.md` done; `phase2c.md` etc. expected as each
sub-phase starts). Design skills (`ui-ux-pro-max`, `frontend-design`,
`dataviz`, `artifact-design`) are relevant from 2b onward, once there's
UI to build — 2a was schema/query-only.

---

## Repo state (as of 2026-09-05)

- Next.js 16.3.4 / React 19.2.8, TypeScript, Tailwind v4, `src/` dir, npm.
  shadcn/ui (Nova preset: Lucide + Geist, Radix base) with custom design
  tokens in `src/app/globals.css` — light neutral workspace, warm orange
  primary, fixed dark navy `--sidebar-*` chrome (identical in `:root` and
  `.dark` — V1 is light-only, no theme toggle), added success/warning/info
  tokens. Full primitive set in `components/ui/*` + composed
  `components/shared/*` (DataTable on TanStack Table v8, Form field
  primitives for RHF+Zod, EmptyState/ErrorState/LoadingState/ConfirmDialog/
  KpiCard/ChartContainer/Combobox/etc).
- Application shell (fixed sidebar ≥1024px / Sheet drawer below),
  `(app)/` route group with a `PlaceholderPage` stub per business feature
  and one fleshed-out `/dashboard` foundation page. Visually verified via
  Playwright screenshots at 1440/1024/390px.
- **Supabase is fully live and verified**, not just scaffolded:
  - Project created by the user; credentials in `.env.local` (gitignored).
    Uses Supabase's current **publishable/secret** key naming
    (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`) — the
    older anon/service_role naming is being retired by Supabase end of
    2026; caught and fixed before this ever shipped with the old names.
  - All 7 migrations in `supabase/migrations/` + `supabase/seed.sql`
    applied directly via `psql` (no Docker/CLI-login available in this
    environment, so `supabase db push`/`gen types` weren't usable — see
    below). `types/database.ts` stays hand-authored, confirmed to match
    the live schema (`\dt` listed all 17 tables as expected).
  - Two real users exist: an admin account for the user
    (`pingatravi@gmail.com`) and a synthetic `e2e-tests@forkstock.dev`
    fixture (role `staff`) used only by `e2e/auth.spec.ts`, both created
    via the Supabase Admin Auth API using the secret key.
  - Live-verified, not just structurally trusted: `guard_inventory_quantity`
    rejects a direct `UPDATE ... SET quantity` (tested via psql); RLS
    returns `[]` to anonymous requests on protected tables; the staff
    fixture can read inventory but gets a real `42501` trying to write
    `catalogue_parts`; an admin can read an `audit_logs` row (inserted via
    `log_audit_event()`) that the staff fixture genuinely cannot see.
    Test artifacts cleaned up after.
  - `e2e/auth.spec.ts` covers login → dashboard → account menu → sign-out
    and the unauthenticated-redirect-to-/login case, against the live
    project. All 3 e2e tests + 11 unit tests + typecheck/lint/format/build
    pass.
- **Code review before Phase 2** (`/code-review high`, from the initial
  commit to HEAD) found 10 issues, all fixed and re-verified live:
  `for all` RLS policies included DELETE (contradicted the soft-delete
  design — split into INSERT/UPDATE-only policies); the quantity guard
  trigger only fired on UPDATE, so INSERT could set an arbitrary starting
  quantity (now rejects any non-zero INSERT quantity); staff could
  soft-delete inventory via UPDATE despite the permission model
  withholding that (now trigger-blocked for non-admin/manager);
  stock_movements/part_images attribution columns were client-spoofable
  (now forced server-side via a BEFORE INSERT trigger — verified a
  spoofed `created_by` was silently corrected); `log_audit_event()` was
  callable by read_only (now rejected); missing indexes on ledger FK
  columns (added); `requireRole()` had zero callers (wired into `/admin`,
  verified staff→redirected/admin→allowed); `signOut()` lacked the same
  graceful-degradation try/catch `login()` has (added); `getCurrentUser()`
  wasn't wrapped in React's `cache()` (added); all 25 `components/ui/*`
  files imported `cn` from the npm package directly instead of through
  `@/lib/utils` (standardized — the package itself is shadcn-ui's own
  official one, this was purely an import-path consistency fix). See
  `docs/decisions/0007` and the two "fix:" commits after the docs commit.
- **Real catalogue data imported, ahead of Phase 5.** The user provided
  the actual consolidation report `phase1.md` §5 referenced —
  `supabase/reference-data/godrej-voltas-master-catalogue.csv`: 284 real
  parts, 2 real brands (Godrej, Voltas/OM), 9 real forklift models, 979
  compatibility links — all counts matched what `phase1.md` had already
  cited. Importing it surfaced real schema gaps (`sub_category`,
  `assembly_group`, `is_fastener`, `capacity_range_kg` on
  `catalogue_parts`; `fuel_type` on `catalogue_models`; a proper
  `catalogue_part_sources` join table replacing a single nullable FK,
  since 14/284 rows cite two source catalogues) — see
  `docs/decisions/0008`. Imported via `scripts/import-master-catalogue.mjs`
  (idempotent, re-runnable), verified live: cross-reference parsing,
  multi-source linking, and the one real `is_fastener` flag all spot-checked
  correct against the live data.
- **User-provided vehicle-parts dashboard mockup** clarified real V1
  scope before Phase 2: the business is heavy-lifting-vehicle (forklift)
  spare parts, not passenger cars (the mockup's car-brand content was
  generic/not literal) — confirms `CLAUDE.md`'s existing scope. Sales,
  Purchases, Suppliers, Customers, and invoicing shown in that mockup are
  explicitly **out of scope** — user confirmed keep to `CLAUDE.md`'s
  defined V1 scope (Inventory/Catalogue/Warehouse/Operations/Reports/
  Administration). The mockup's visual density/layout (KPI row, charts,
  low-stock table, activity feed, quick actions) is a good Phase 2
  dashboard reference once real inventory data exists to drive it.
- Claude Code plugins installed: `ui-ux-pro-max`, `mattpocock-skills`.

---

## Decisions log

See the approved plan's "Architectural decisions" section for the full
rationale on each: `/root/.claude/plans/splendid-conjuring-pony.md`.
Summary — folder structure uses `src/` + feature-oriented dirs; Server
Components + Server Actions only (no separate API layer); catalogue/
inventory kept as two DB zones with a nullable FK between them; inventory
quantity is a trigger-maintained column backed by an insert-only
`stock_movements` ledger; RLS backed by one `current_user_role()` Postgres
function; V1 ships light-theme-only with a fixed (non-toggleable) dark
navy sidebar; auth is email/password only, no self-signup UI; npm as
package manager; git commits at each build checkpoint; Supabase's current
publishable/secret key naming, not the legacy anon/service_role names
(user caught this — see the commit titled "fix: use Supabase's
publishable/secret keys..."); migrations applied via direct `psql`
(installed in this environment) using the project's DB password rather
than the Supabase CLI, since CLI login/`db push` needs a personal access
token and `gen types`'s `--db-url` path needs Docker, neither available
here — a real project elsewhere could use either of those instead.

---

## Phase 2a — Schema + Data Foundation (done)

Spec: `phase2a.md`. Delivered, all locally + live verified:

- Migration `supabase/migrations/20260905100000_inventory_min_stock.sql`
  adds `inventory_parts.min_stock integer`, nullable, no default, with
  `check (min_stock is null or min_stock >= 0)` — applied live via
  `psql` and confirmed both existing seed rows kept `min_stock = null`
  (not defaulted to 0), and `\d inventory_parts` shows the column +
  constraint. `types/database.ts` updated to match (Row/Insert).
- ADR `docs/decisions/0009-inventory-min-stock-threshold.md` (threshold
  column) and `0010-inventory-valuation-cost-basis.md` (cost-basis
  valuation) — the spec's suggested numbers (0007/0008) were already
  taken by Phase 1's hardening/import ADRs, so these continue at
  0009/0010 instead.
- `src/features/dashboard/queries.ts`: `getInventoryItemCount()`,
  `getInventoryValue()` (returns `{ value, excludedCount }`, cost basis,
  excludes null/negative `purchase_cost` rows from the sum and logs +
  counts them), `getLowStockCount()` (only counts rows with a configured
  `min_stock`, quantity > 0), `getOutOfStockCount()`. All four share one
  query shape (`select quantity, min_stock, purchase_cost` filtered to
  `deleted_at is null`), each independently server-side and
  independently callable — not combined into one cached call, since
  splitting keeps each trivially unit-testable and the row count doesn't
  yet justify the extra complexity of sharing one request-scoped fetch.
  A query failure throws the raw Postgrest/Auth error rather than
  resolving to zero, so a network failure can't be mistaken for "no
  inventory."
- `src/features/dashboard/queries.test.ts`: 12 unit tests covering
  normal/empty/null-`min_stock`/null-and-negative-`purchase_cost`/
  zero-quantity cases, that the query filters on `deleted_at is null`,
  and that a Postgrest error propagates instead of resolving to 0.
- Needed one test-infra fix along the way: Vitest doesn't understand
  Next.js's `react-server` export condition, so importing `"server-only"`
  (which `queries.ts` does, per ADR 0004) threw outside of the Next.js
  build. Fixed by aliasing `"server-only"` to a no-op shim
  (`vitest.server-only-mock.ts`) in `vitest.config.mts` — the standard
  fix for this, not a workaround specific to this file; any future
  server-only module hits the same issue and is already covered.
- No UI touched. Typecheck/lint/format/build/unit tests all green (22
  total unit tests now, up from 11).

## Phase 2b — Dashboard KPI Cards (done)

Spec: `phase2b.md`. Delivered, all locally + live verified:

- `/dashboard`'s four `KpiCard`s (`src/app/(app)/dashboard/page.tsx` +
  new `dashboard-kpis.tsx`) now render real numbers from 2a's query
  functions instead of a hardcoded `"—"`. Fetched independently via
  `Promise.allSettled` — one query rejecting shows `ErrorState` on just
  that card (verified via a mocked rejection in the component test),
  not a broken row.
- **Decision (phase2b.md §4), followed as recommended, no override**:
  Inventory Value is cost-basis and commercially sensitive, so it's
  visible only to Admin/Manager. New `canViewInventoryValue(role)` in
  `src/lib/permissions/index.ts` — checked server-side in the page
  before the value query is even called, so Staff/Read-Only never
  receive it in the response. Grid drops to 3 columns (`LoadingState`
  gained a matching `columns` prop so the loading skeleton doesn't
  shift layout). Followed as-is, so no new ADR — recorded here per the
  spec's "must be recorded either way."
- Value card shows a tooltip qualifier ("N item(s) missing cost data,
  not included") when `getInventoryValue()`'s `excludedCount > 0`.
- New `formatCurrency()` in `src/lib/utils.ts` — **currency was a real
  open question, asked the user rather than guessing**: INR, whole-rupee
  rounding, Indian digit grouping (`₹12,34,567`). This is now the one
  place money formatting lives; future money displays (reports, etc.)
  should reuse it.
- "No data yet" alert is now conditional on a genuinely empty inventory
  (item count `0`), not permanent.
- Added `motion` as a dependency (`motion/react`) per phase2b.md #0; new
  shared `src/components/shared/motion-fade-in.tsx` gives the KPI row a
  restrained fade-in once its Suspense boundary resolves — reusable for
  2c/2d/2e's own loading transitions rather than one-off per component.
- Two test-infra fixes needed along the way, both general (not
  one-offs): (1) Testing Library's `render()` output was leaking
  between tests — `vitest.config.mts` doesn't set `test.globals: true`,
  so TL's auto-cleanup never fired; fixed with an explicit
  `afterEach(cleanup)` in `vitest.setup.ts`, so every future component
  test file gets it for free. (2) A `Tooltip` needs `TooltipProvider`
  (normally mounted by `app/layout.tsx`), so component tests render
  through a local `TooltipProvider` wrapper.
- Testing: `dashboard-kpis.test.tsx` (7 tests — rendering, role
  omission, qualifier, empty-alert, per-card error isolation);
  `permissions/index.test.ts` and `utils.test.ts` extended; new
  `e2e/dashboard.spec.ts` — live-verified with the staff fixture
  (screenshot-checked at 1440px too): 3-card layout, no value card, no
  `"—"` placeholders remain. **Admin/Manager's 4-card view was not
  live-verified** — no admin e2e credentials exist in this environment
  (only the staff fixture) — that path is covered by the component
  tests instead. 35 total unit/component tests, 4 e2e tests, all green;
  typecheck/lint/format/build all pass.

## Phase 2c — Stock Movement Chart + Recent Activity (done)

Spec: `phase2c.md` (combined doc for 2c/2d/2e — implemented in order,
each committed and verified separately). Delivered:

- `src/features/dashboard/activity.ts`: `getStockMovementSeries()` (30
  continuous UTC-day inbound/outbound buckets) and `getRecentActivity()`
  (last 10 movements, plain-language description, actor name when
  visible). Classification decision (in/returned inbound, out/damaged
  outbound, transfer excluded, adjust by its own sign) followed exactly
  as phase2c.md recommended — no override, so no new ADR, recorded here
  per the same "must be recorded either way" convention as 2b's value-
  visibility decision.
- **Discovered while building the activity join**: `profiles` RLS only
  lets a user see their own row (or an admin see everyone's) — asked
  the user rather than assuming, and they chose to **keep RLS as-is**
  rather than add a policy exposing `full_name` more broadly. So
  `getRecentActivity()`'s actor is `null` both when `created_by` is
  genuinely null and when RLS hides that profile from the current
  viewer — the two are indistinguishable from here by design, and
  never rendered as "Unknown."
- Implemented the join as three flat queries (movements, then
  inventory_parts + profiles by id) rather than a PostgREST embed:
  `types/database.ts` has no `Relationships` metadata for an embed to
  type against, and row volume doesn't justify solving that yet — same
  "fetch flat, join in JS" call as 2a.
- UI: new `StockMovementWidget` (Recharts `StockMovementBarChart` in
  the existing `ChartContainer`) and `RecentActivityWidget` (existing
  `ActivityList`), each its own Suspense boundary on `/dashboard` so
  one widget's failure/latency never affects the other. Added
  `recharts` (CLAUDE.md #9's approved charting library) and
  `formatRelativeTime()` (`src/lib/utils.ts`) for activity timestamps.
- **Live-verified visually** (Playwright screenshot, staff fixture,
  1440px): real chart bars and four real activity rows rendered
  correctly against the live project's actual movement history.
- **e2e scope call**: phase2c.md asked for an e2e test that seeds a few
  movements and confirms they render. `stock_movements` is a
  deliberately insert-only ledger (no UPDATE/DELETE RLS policy at all,
  CLAUDE.md #5) on this project's real, live Supabase instance —
  seeding synthetic rows would permanently pollute real inventory
  history with no way to clean up after. Wrote a non-destructive
  equivalent instead (`e2e/dashboard.spec.ts`): confirms both widgets
  render content-or-honest-empty-state with no error card, against
  whatever real activity already exists.
- Testing: 13 unit tests (`activity.test.ts`) + 7 component tests
  (widget-level empty/error/populated branching) + 2 e2e tests. 59
  total unit/component tests, 5 e2e tests, all green;
  typecheck/lint/format/build all pass.

## Phase 2d — Low-Stock Table (done)

Spec: `phase2c.md` §"2d" (same combined doc). Delivered:

- `src/features/dashboard/low-stock.ts`: `getLowStockRows()` — every
  zero-quantity part plus anything at/below its `min_stock`, same
  qualifying rule as 2a's `getLowStockCount()`/`getOutOfStockCount()`.
  Status is `out_of_stock` / `critical` (≤50% of `min_stock`) / `low`.
  Brand resolved via `inventory_parts.catalogue_part_id →
  catalogue_parts.brand_id → brands.name` (flat queries, same
  fetch-flat-join-in-JS precedent as 2a/2c). **Model deliberately
  omitted**: a catalogue part's model fit is many-to-many via
  `compatibility`, so it doesn't reduce to one column for a summary row.
- UI: `LowStockTable` (client) — `DataTable` + `StatusBadge`, a
  Tabs-based status filter that narrows the already-fetched rows
  client-side (no per-status query, no Restock button, no
  sort/paginate-everything — this is a summary, Phase 3 owns the real
  inventory table). Two distinct empty states: genuinely nothing needs
  attention vs. nothing matches the active filter. `LowStockWidget`
  (server) fetches and handles the error case, own Suspense boundary.
- **Live-verified** (staff fixture): the real live inventory has
  nothing needing attention today, so the genuine empty state renders
  correctly end-to-end. Skipped a live populated/badge check —
  temporarily editing the two real seed parts' `min_stock` just to
  produce one, even though reversible, still means writing to the live
  project's data without being asked; component tests cover every
  status/filter/empty-state combination instead (same call as skipping
  synthetic `stock_movements` seeding in 2c, for a related reason).
- Testing: 8 unit tests (`low-stock.test.ts`) + 8 component tests
  (`low-stock-table.test.tsx`, `low-stock-widget.test.tsx`) + 1 e2e
  test. Added `@testing-library/user-event` (interaction testing for
  the filter tabs) and `recharts`/`motion` continue from 2c/2b. 75
  total unit/component tests, 6 e2e tests, all green;
  typecheck/lint/format/build all pass.

## Phase 2e — Global Header Search (done) — Phase 2 complete

Spec: `phase2c.md` §"2e" (same combined doc). Delivered:

- `src/features/search/actions.ts`: `searchGlobal()`, a Server Action
  (not a route handler — ADR 0004) searching `inventory_parts`
  (part_number/name), `catalogue_parts` (part_number/name/
  oem_reference), `cross_refs` (cross_reference_number), `brands.name`,
  and `catalogue_models.name`. Plain `ilike` per phase2c.md's
  "PostgreSQL only" direction — one `ilike` call per column merged in
  JS, deliberately **not** a single `.or(...)` filter string: `.or()`
  interpolates the raw query into a filter-DSL string PostgREST parses,
  and a user typing `,`/`(`/`)` shouldn't influence how that parses.
  A catalogue part already linked to an inventory row is suppressed
  from the catalogue-only result set (CLAUDE.md #6: inventory-backed vs
  catalogue-only must be visually distinguishable, and the same
  physical part should never appear twice under two different tags).
  Brand/model matches route to the nearest existing placeholder route
  (`/catalogue`, `/catalogue/models/:id`) since Phase 3/5 detail pages
  don't exist yet — no early detail-page building. Results capped at 8.
- `src/components/layout/global-search.tsx`: replaces the disabled
  Phase 1 search input with a working, debounced (250ms) dropdown.
  Hand-rolled ARIA combobox/listbox (not the existing `Combobox`, which
  filters a fixed local option list rather than a debounced server
  call with per-result badges) — full keyboard support (arrows, Enter,
  Escape), `aria-expanded`/`-controls`/`-activedescendant`. Empty query
  shows no dropdown; no-results and error states are distinct copy.
- **Notable implementation detail**: uses React 19's async
  `useTransition` for the loading state rather than a manually-set
  "loading" flag - this repo's eslint config (react-hooks compiler
  rules) flags a synchronous `setState` call inside a `useEffect` body,
  and `isPending` from `useTransition` is the idiomatic replacement.
  Worth knowing about for any future debounced-async-UI work.
- **Live-verified visually** (staff fixture, screenshots): searching
  "sample" correctly showed two In-Stock parts, one Catalogue-Only
  part, two Brand matches, and one Model match, all tagged and
  distinguished correctly; a no-match query showed the distinct
  no-results copy.
- Testing: 10 unit tests (`actions.test.ts`) + 6 component tests
  (`global-search.test.tsx`, fake timers + `act()` to flush the
  debounce/transition) + 2 e2e tests. **Search needed no non-destructive
  testing workaround** (unlike 2c/2d) since it's read-only — the e2e
  tests search a real seeded part number (`SAMPLE-0001`) and assert on
  the real, live result. Added `recharts`chart/`motion`/
  `@testing-library/user-event` carried over from 2b–2d. **91 total
  unit/component tests, 8 e2e tests, all green;
  typecheck/lint/format/build all pass.**

**Phase 2 (Core UI + Dashboard) is now fully complete**: KPI cards,
stock movement chart, recent activity, low-stock table, and global
search are all wired to live data on `/dashboard` and in the header.

## Design pass — premium visual polish (post-Phase 2, done)

The user asked, out of band from the phase specs, to make the app "look
like a premium inventory SaaS" using whatever design resources needed
(`/ui-ux-pro-max:design` → `redesign-existing-projects` skill). Audited
the existing UI and applied targeted upgrades, keeping the established
brand direction (light workspace, dark navy sidebar, warm orange
accent) rather than introducing a new one — CLAUDE.md's own definition
of "premium industrial SaaS" for this project. Not a numbered phase;
purely visual, no new functionality:

- **Fixed two real bugs found during the audit**: site metadata was
  still the literal Next.js starter default ("Create Next App"); and
  `globals.css`'s `--font-sans` token self-referenced instead of
  pointing at the actual Geist variable, so the app had been rendering
  in the browser's default system font the whole time, not Geist.
- Added Space Grotesk as `--font-heading` (previously just aliased to
  the body font) — cascades to every existing `font-heading` usage
  (card titles, dialog/sheet titles, sidebar wordmark, KPI numbers) from
  one token change.
- New branded `icon.svg` favicon (stacked-boxes mark, navy/orange)
  replacing the default Next.js one.
- **Established a semantic icon-chip pattern**: KPI card icons and
  search-result icons sit in a small tinted chip whose color matches
  what the item means (warning for low stock, destructive for out of
  stock, info/success/etc.) — reuse this for any new card/list icon in
  Phase 3+ rather than a flat muted icon color.
- Sidebar logo is now a gradient icon chip (reused on the new login
  page); active nav items get a left accent bar; recent-activity rows
  get a colored dot for inbound/outbound/neutral.
- Chart got a custom-styled tooltip (matching the app's popover, not
  Recharts' default box), gradient bar fills, larger rounded caps.
- New reusable `MotionStagger`/`MotionStaggerItem` (cascading entrance
  for grids/lists of uniform cards) — used for the KPI row so far.
- **Login page redesigned as a branded split-screen layout** (hidden
  below `lg`, since this is desktop-first per CLAUDE.md #8): a dark
  navy panel with the logo, a headline pulled from CLAUDE.md's own
  North Star line, three real feature bullets, and a subtle CSS grid
  pattern + corner glow (no external image assets, no new
  dependencies) — replacing what was a completely generic centered
  card. Kept exactly one `<h1>ForkStock</h1>` regardless of viewport
  width, since `e2e/smoke.spec.ts` asserts on that heading by name at
  the default 1280px test viewport - the desktop/mobile copy differs
  elsewhere on the page instead.
- **Deliberately did not touch**: the Inventory/Catalogue/Warehouse/
  Operations/Reports/Admin `PlaceholderPage` stubs — CLAUDE.md values
  honesty over decoration, and over-designing a "nothing here yet"
  page would misrepresent unbuilt work as more finished than it is.
- Live-verified visually (staff fixture, screenshots) at 1600px, 390px
  mobile, and the mobile nav drawer. 91 unit/component tests, 8 e2e
  tests, all still green after every change; typecheck/lint/format/
  build all pass. 8 commits, each scoped to one visual concern
  (metadata/font, sidebar, motion primitive, KPI cards, activity feed,
  chart, search, login page).

## Next steps (historical — from the end of Phase 2, superseded by the
one at the bottom of this file)

1. ~~Phase 3 (Inventory + Parts) is next.~~ Done — see the Phase 3
   section above.
2. Follow `CLAUDE.md` §20's Phase Workflow for each phase/sub-phase.
3. Commit hygiene: split every phase's changes into multiple
   logically-scoped commits (schema/infra/feature/tests/docs) as they're
   made, rather than one large checkpoint commit at the end — standing
   instruction from the user as of Phase 2a's wrap-up. Held throughout
   all of 2a–2e (dozens of small commits, not five giant ones).
4. **Live-data judgment call, applied consistently in 2c/2d**: don't
   write synthetic or temporary rows/config into this project's live
   Supabase data for test purposes without asking first — even
   reversible config edits — and say so plainly in PROGRESS.md/commits
   when a spec's literal testing ask is skipped for that reason, with a
   non-destructive equivalent test in its place. (2e's search tests
   didn't need this — read-only queries are always safe to test live.)
5. Phase 3 will likely want the `/inventory/[id]` and `/inventory`
   placeholder routes fleshed out for real — 2e's search already links
   to `/inventory/:id` for in-stock parts, so that route existing and
   working is now user-facing, not just a stub.

## Design pass — typography audit (post-Phase 2, done)

The user invoked `/ui-ux-pro-max:ui-styling` out of band asking for a
full redesign audit ("premium, distinctive, human-designed... avoid
AI-slop"), with instructions to audit first rather than blindly
rewrite. Audited every built screen (dashboard, login, app shell/
sidebar/header, and all shared UI primitives — cards, badges, buttons,
tables, empty/error states, search) against the anti-slop checklist in
the command (gradients, glassmorphism, pill-heavy UI, generic
purple/blue, repetitive card grids, unnecessary shadows).

**Conclusion: the app already passes almost all of it.** The prior
premium visual polish pass (see above) already established a
restrained, semantic, non-generic system — no purple/blue, no
glassmorphism, no repetitive card grids, cards use a subtle `ring-1`
border instead of shadows, badges are the only pill-shaped element
(correct convention, not "pill-heavy UI"). Did not blindly rewrite
working, tested UI just to look busy.

**The one real generic tell**: Geist Sans/Mono + Space Grotesk is an
extremely common default pairing in AI-scaffolded Next.js/shadcn apps
— the single thing most likely to read as "AI-generated" despite
everything else being bespoke. Asked the user to choose a replacement
direction (rather than gambling on a whole-product identity call
alone); they picked **IBM Plex Sans + IBM Plex Mono** — a genuinely
industrial-grade family (designed for IBM's enterprise/technical
products), rare in AI-generated app output.

- Swapped the font imports in `src/app/layout.tsx` and the
  `--font-sans`/`--font-mono`/`--font-heading` tokens in
  `globals.css` — headings now share the Plex Sans family (weight/
  tracking does the hierarchy work, no third face needed).
- Put Plex Mono to work wherever the app shows tabular/numeric data —
  the exact "instrument panel" use case IBM Plex Mono is suited for:
  KPI card values, the stock-movement chart tooltip's numbers, and
  part numbers/quantity/min-stock in the low-stock table and global
  search results.
- Swapped the placeholder-page icon from `ConstructionIcon` (a
  generic "under construction" road-sign cliché) to `CircleDashedIcon`
  — still says "not built yet," doesn't remake the placeholder into
  something busier per CLAUDE.md §19's honesty-over-decoration rule.
- **Deliberately left everything else alone** — color palette,
  spacing, card/badge/button shapes, motion, layout, all already
  matched the brief.
- Verified with real Playwright screenshots (not just typecheck) at
  1440px (login, dashboard, search dropdown, a placeholder page) and
  390px mobile (login) against the live Supabase fixture data. 91 unit
  tests + 8 e2e tests still green; typecheck/lint/build all pass.

### If `.env.local` is missing in a new environment

It's gitignored (never committed, and deliberately not reproduced here)
and won't exist if this repo is cloned fresh. Re-create it from
`.env.example` using the same live Supabase project
(`https://jjxvcwsrdeynssrccccx.supabase.co` — ask the user for the
publishable/secret keys again, or find them in the Supabase dashboard
under Project Settings → API Keys). The admin account is
`pingatravi@gmail.com` (ask the user for the password, don't guess it).
The `e2e-tests@forkstock.dev` fixture user (role `staff`) also needs
recreating via the Admin Auth API if lost — see
`e2e/auth.spec.ts`/`E2E_SUPABASE_TEST_EMAIL`/`_PASSWORD` in
`.env.example`; pick a fresh password for it, it doesn't need to match
any prior one.

## Phase 3 — Inventory + Parts (done)

Spec: `phase3.md` (saved to the repo root, matching the phase1/2a/2b/2c
pattern). Delivered the real inventory module the dashboard/search
layer had already been pointing at since Phase 2: a filterable/
sortable/paginated list, a real detail page, create/edit forms with
duplicate-part-number detection, all six stock movement workflows, part
images, and soft-delete — all resting on Phase 1/2a's existing schema,
triggers, and RLS without reinterpreting them.

- **Schema**: one small additive migration,
  `supabase/migrations/20260905110000_part_images_delete_and_storage_path.sql`
  — adds a DELETE policy on `part_images` and on `storage.objects` for
  the `part-images` bucket (same admin/manager/staff role check as the
  existing insert policy). Phase 1 only ever granted SELECT+INSERT
  since no upload UI existed yet; this phase's spec requires upload
  **and remove**. This is a deliberate, documented exception to ADR
  0007's "no table gets a DELETE policy, soft-delete only" rule —
  `part_images` isn't audit/history data the way `stock_movements` is,
  and CLAUDE.md never asks for permanent image history. Recorded as
  **ADR 0011** (`docs/decisions/0011-part-images-storage-path-and-delete.md`),
  which also fixes the storage path convention
  (`{inventory_part_id}/{uuid}.{ext}`).
  Applied to the live project via `psql` (the user provided the DB
  password); both policies confirmed present with `pg_policies` after
  applying. Live-verified end-to-end afterward: uploaded a real image
  to a fresh test part, confirmed it rendered, removed it, confirmed
  both the `part_images` row and the storage object were actually
  gone (`select count(*) ... = 0`) — not just that the UI stopped
  showing it.
- **Movement-type semantics**, resolved during planning since phase3.md
  described them loosely: Stock In (positive `quantity`, optional box —
  defaults to the part's current box, updates `box_id` if changed),
  Stock Out (positive `quantity`, ceiling-checked against current
  stock), Transfer (`quantity_change` is always `0` — this schema
  models one location per part, so a transfer relocates the entire
  current stock rather than moving a sub-quantity; updates `box_id`),
  Adjust (a signed `quantity_change` entered directly, required
  `reason`, floor-checked so the result can't go negative), Damaged
  (positive `quantity`, ceiling-checked, no box field), Returned
  (positive `quantity`, back into the part's current box, not
  user-selectable). One Zod discriminated union
  (`src/features/inventory/schema.ts`) expresses all six shapes so
  validation lives in one typed place; `recordStockMovement`
  (`src/features/inventory/actions.ts`) is the one Server Action for
  all six, switching on `movementType` — every path inserts into
  `stock_movements` only, never writes `inventory_parts.quantity`
  directly (the DB trigger applies it).
- **Duplicate-part-number handling** (§5): exact match only (no fuzzy
  matching), a non-blocking warning banner on the create/edit form
  linking to the existing part — the form can still be submitted as a
  separate part. Decision taken as the spec's own recommendation, not
  overridden.
- **New feature module** `src/features/inventory/` (schema/queries/
  actions), following the exact Phase 2 pattern: Server Components read
  via `queries.ts` (fetch-flat-join-in-JS, no PostgREST embeds), writes
  go through `actions.ts` Server Actions returning `ActionResult<T>`.
  `getInventoryList` uses real server-side pagination (`.range()` +
  `count: "exact"`) for the common case; the stock-level filter
  (low/critical/out-of-stock) falls back to a documented JS-computed
  path since PostgREST can't compare two columns (`quantity` vs
  `min_stock`) in a filter.
- **Routes**: `/inventory` (real list, replacing the Phase 1
  placeholder — now also correctly returns `<ErrorState>` if the query
  throws, a gap fixed during review since it was the one screen not yet
  following CLAUDE.md §16's loading/empty/error/success rule that every
  other screen already followed), `/inventory/new` and
  `/inventory/[id]/edit` (dedicated pages for the ~9-field form, not a
  modal), `/inventory/[id]` (real detail page — quantity/location card,
  catalogue-link card, image gallery, movement history, and the
  Edit/Record-movement/Delete action row, each gated on
  `inventory.edit`/`inventory.adjust`/`inventory.transfer`/
  `inventory.delete` per §10 — absent, not disabled, matching the
  existing dashboard precedent). Every new part starts at `quantity =
  0` (trigger-enforced), so create redirects straight to the detail
  page with `?openMovement=in`, which auto-opens the Stock In dialog
  rather than leaving the user at zero with no next step.
- **Extracted `src/lib/stock-movements.ts`** (`classifyMovement`,
  `describeMovement`) out of `features/dashboard/activity.ts` so the
  part detail page's movement history and the dashboard's activity feed
  share one phrasing convention instead of duplicating it — the reuse
  phase3.md §6 explicitly asked for.
- **A real bug caught and fixed via the e2e test, not by inspection**:
  `PartForm`'s debounced (400ms) duplicate-number check could resolve
  *after* a successful create/save and flag the record just
  created/saved as a duplicate of itself, because the debounce wasn't
  cancelled on submit. Fixed by moving the `clearTimeout`/counter-bump
  into the form's `onSubmit` handler wrapper (had to be structured as a
  wrapping arrow function rather than inline in `onSubmit` itself — the
  React Compiler's `react-hooks/refs` lint rule flags a ref read inside
  a function passed directly to `form.handleSubmit(...)`, which is
  itself invoked at render time).
- **Testing**: 30 new unit/component tests this phase (schema, queries,
  `InventoryTable`, `PartForm` incl. the duplicate banner, `PartActions`
  incl. role-gating and the delete-confirm flow, `StockMovementDialog`
  covering all six movement types' valid/invalid submission and confirm
  flow, `PartImagesGallery` incl. upload/remove and role-gating) — **152
  total unit/component tests, all green**. Two jsdom gaps had no
  existing polyfill in this repo (no test had exercised a Radix
  Select/Combobox with real pointer interaction yet) — added
  `hasPointerCapture`/`setPointerCapture`/`releasePointerCapture`/
  `scrollIntoView` no-op stubs and a `ResizeObserver` stub to
  `vitest.setup.ts`, which any future test using these primitives now
  gets for free.
  - **E2E** (`e2e/inventory.spec.ts`, live Supabase project): creates a
    part numbered `E2E-TEST-<timestamp>`, performs a real Stock In and
    Stock Out through the actual UI, confirms quantity/history update
    correctly, and confirms the Delete action is absent for the `staff`
    fixture role. **This test does not soft-delete the part it
    creates**, unlike the original plan's assumption — the `staff`
    fixture account (per `lib/permissions`) has `inventory.edit`/
    `adjust`/`transfer` but not `inventory.delete`, so it genuinely
    can't perform that step; the plan's assumption that it could was
    wrong, caught while writing the test. The part is left active,
    permanently, in the live project (same accepted tradeoff as the two
    permanent `stock_movements` rows it also leaves — see ADR 0002).
    Soft-deleting it would require the admin account, whose password
    isn't stored.
  - **No live/manual admin-role check happened this session** —
    confirming Delete's visibility live as `pingatravi@gmail.com` would
    need that account's password, which wasn't available (only the DB
    password was, for applying the migration above — a different
    credential). The permission-boundary *logic* itself (role → allowed
    actions) is fully covered by `PartActions`' component tests and by
    RLS policies already reviewed in Phase 1/2a; what's unverified is
    only the live, end-to-end admin path.
- Typecheck, lint, format, build, and all unit/component/e2e tests pass.

**Out of scope, confirmed against phase3.md §4/§15 and left alone**:
warehouse/rack/shelf/box management UI, catalogue management UI, full
reporting, QR/barcode, bulk import/export, any Sales/Purchases/
Suppliers/Customers/Invoicing concept.

## Phase 4 — Warehouse Management (done)

Spec: `phase4.md` (saved to the repo root, matching the phase1/2/3
pattern). Delivered full CRUD + browsing for the
warehouse/rack/shelf/box hierarchy Phase 1 defined and Phase 3 already
consumed (the part form's box picker) — create/edit/soft-delete at every
level, breadcrumb-driven browsing, real occupancy counts, a box's
contents linking back to Phase 3's part detail pages, and a Transfer
shortcut that reuses Phase 3's movement ledger rather than a second way
to change a part's location.

- **Schema**: one additive migration,
  `supabase/migrations/20260905120000_warehouse_soft_delete_cascade.sql`
  — four Postgres functions (`soft_delete_warehouse`/`_rack`/`_shelf`/
  `_box`), no new tables or columns. No RLS changes needed: Phase 1's
  hardening pass already restricted `warehouses`/`racks`/`shelves`/
  `boxes` writes to admin/manager with no DELETE policy at all (soft-
  delete-only), exactly matching this phase's `warehouse.manage`
  boundary — confirmed by reading `20260905060400_rls_policies.sql`/
  `20260905070000_harden_rls_and_triggers.sql` rather than assumed.
  **Applied to the live project via `psql`** (the user provided the DB
  password, now saved in `.env.local` as `SUPABASE_DB_PASSWORD` so a
  future session doesn't need to ask again — not read by the Next.js
  app itself, kept only for direct `psql` use). Confirmed present with
  `\df public.soft_delete_*` after applying.
- **Soft-delete cascade + blocking, resolved per phase4.md §5** — see
  **ADR 0012** (`docs/decisions/0012-warehouse-soft-delete-cascade.md`):
  deleting a warehouse/rack/shelf atomically cascades onto everything
  beneath it via one Postgres function per level, but is **blocked
  entirely** (no override) if any non-deleted `inventory_part` is still
  assigned anywhere in the subtree — the function returns exactly which
  parts are blocking instead of raising a bare error, so
  `LocationDeleteAction` can show them with links into their Phase 3
  detail pages rather than a generic "can't delete." **Live-verified**
  via a rolled-back transaction against the real project: an empty
  rack→shelf→box chain cascades cleanly (all three get `deleted_at` in
  one statement group); the same chain with one part assigned to its box
  is fully blocked (zero rows changed, the part returned as the
  blocker).
- **New feature module** `src/features/warehouse/` (schema/queries/
  actions), following the exact Phase 3 pattern: Server Components read
  via `queries.ts` (fetch-flat-join-in-JS), writes go through
  `actions.ts` Server Actions returning `ActionResult<T>`.
  `fetchFlatHierarchy()` is the one shared flat-fetch-then-join-in-JS
  implementation — `features/inventory/queries.ts`'s `getBoxOptions()`
  was refactored to call it instead of duplicating its own copy
  (phase4.md §6's explicit reuse ask). Occupancy (`boxesOccupied`/
  `boxesTotal` at every level) is computed from real, non-deleted
  `inventory_parts.box_id` assignments — no fabricated "capacity"
  concept, per CLAUDE.md §13/phase4.md §3.
- **Routes**: `/warehouse` (real list, replacing the Phase 1
  placeholder), `/warehouse/[id]` (new — warehouse detail/rack browser;
  no such route existed before this phase), `/warehouse/racks/[id]`
  (real, replacing the placeholder), `/warehouse/shelves/[id]` (new —
  Phase 1 never stubbed this level), `/warehouse/boxes/[id]` (real,
  replacing the placeholder). Every level has a real breadcrumb
  (`HierarchyBreadcrumb`, `src/components/shared/`) with every earlier
  segment a working link. Create/edit for racks/shelves/boxes is a
  dialog (`CodeFormDialog`, one shared component parameterized by
  entity label — a single required `code` field doesn't reach the
  content threshold CLAUDE.md's "avoid unnecessary modals" rule is
  actually about, contrast `PartForm`'s ~9 fields which does warrant a
  page); warehouse create/edit is its own two-field dialog
  (`WarehouseFormDialog`) for the same reason. All management controls
  (`warehouse.manage`) are absent, not disabled, for staff/read-only —
  the same Phase 2/3 precedent. The box detail page's "Transfer" button
  reuses Phase 3's `StockMovementDialog`/`recordStockMovement` verbatim
  (moved from `src/app/(app)/inventory/[id]/` to
  `src/features/inventory/` since it's now used by two route trees, not
  one) rather than building a second, parallel way to change a part's
  box — the movement ledger is still the only thing that ever changes
  `box_id`.
- **Testing**: 29 new unit/component tests this phase — schema
  validation (`warehouse/schema.test.ts`), hierarchy-flattening and the
  real occupancy-calculation math (`warehouse/queries.test.ts`,
  mirroring `inventory/queries.test.ts`'s mock-supabase pattern),
  breadcrumb rendering including the "last segment isn't a link"
  a11y behavior (`hierarchy-breadcrumb.test.tsx`), occupancy badge
  rendering (`occupancy-badge.test.tsx`), role-gated action visibility
  (`warehouse-table.test.tsx`), the `CodeFormDialog` CRUD form incl.
  validation and a duplicate-code error surfaced inline
  (`code-form-dialog.test.tsx`), and — the one piece of real business
  logic in this phase's UI layer — `LocationDeleteAction`'s three
  outcomes: deleted successfully, blocked with exactly the right parts
  listed and linked, and an unrelated failure just toasts an error
  (`location-delete-action.test.tsx`). **181 total unit/component
  tests, all green.**
  - **E2E** (`e2e/warehouse.spec.ts`, live Supabase project): logs in as
    the `staff` fixture and browses the real "Demo Warehouse / R01 / S01
    / B01" chain end-to-end rather than creating a new one — the fixture
    account has `warehouse.view` but not `warehouse.manage` (per
    `lib/permissions`), so it can't create/edit/delete a
    warehouse/rack/shelf/box the way an admin or manager could. Confirms
    every management button (Add warehouse/rack/shelf/box, box-level
    Edit) is absent at every level, confirms the Transfer shortcut *is*
    present on the box detail page (gated on `inventory.transfer`, which
    staff has — not `warehouse.manage`), confirms the breadcrumb chain
    resolves correctly at the leaf level, and confirms a real part
    (`SAMPLE-0001`) links from its box through to its Phase 3 detail
    page. Needed a generous `toHaveURL` timeout on each first-time hit to
    a dynamic route, same reasoning as `inventory.spec.ts`'s existing
    comment about dev-mode compile time.
  - **No live admin/manager CRUD or cascade-delete e2e test happened
    this session** — same reason Phase 3's admin-only Delete path wasn't
    live-checked: no admin/manager *application* login is available
    (only the separate Postgres DB password was, which is what applied
    the migration above). The cascade/blocking *logic* itself was
    instead live-verified directly against Postgres in a rolled-back
    transaction (see ADR 0012), and the client-side outcome-handling
    logic is fully covered by `location-delete-action.test.tsx`; what's
    unverified is only the live, end-to-end admin-in-the-browser path
    for create/edit/delete.
- Typecheck, lint, format, build, and all unit/component/e2e tests pass.

**Out of scope, confirmed against phase4.md §4/§15 and left alone**:
catalogue import/management (the CSV mentioned in the spec is Phase 5),
QR/barcode, a fabricated "capacity per box" concept, occupancy-trend
reporting (Phase 6), and any change to Phase 3's Transfer movement
workflow itself.

## Next steps

Phase 5 (Catalogue + Vehicle Compatibility) per the phase list — read
`CLAUDE.md` §20's workflow and ask the user for `phase5.md` if it hasn't
been provided yet. Per phase4.md §16, Phase 5 can import the real
catalogue CSV mentioned during this phase using
`inventory_parts.catalogue_part_id` and the existing catalogue schema
from Phase 1, without needing anything further from Phase 4.
