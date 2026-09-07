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
**Phase 4 of 7 — Warehouse Management: COMPLETE.**
**Phase 5 of 7 — Catalogue + Vehicle Compatibility: COMPLETE.**
**Phase 6 of 7 — Operations + Business Intelligence: COMPLETE.**
**Phase 7 of 7 — Security + Testing + Hardening + Launch: COMPLETE.**
See the Phase 7 section below for full detail. **ForkStock V1 is
feature-complete, reviewed, hardened, and documented — there is no
Phase 8.**

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

## Phase 5 — Catalogue + Vehicle Compatibility (done)

Spec: `phase5.md` (saved to the repo root). Unusually for this phase,
the real Godrej/Voltas catalogue (284 parts, 2 brands, 9 models, 979
compatibility links) was already imported ahead of schedule during
Phase 2 prep (ADR 0008) — this phase built the browsing/search/CRUD UI
on top of that already-live data, not a second import pipeline.

- **No migration needed.** phase5.md §8 assumed RLS might need fixing
  to match `catalogue.view`/`catalogue.manage` — checked
  `20260905060400_rls_policies.sql` and
  `20260905070000_harden_rls_and_triggers.sql` directly and found every
  catalogue table (`brands`, `categories`, `catalogue_model_families`,
  `catalogue_models`, `catalogue_parts`, `cross_refs`, `compatibility`,
  `catalogue_part_sources`) already has the correct admin/manager-write,
  everyone-reads split policies. Documented as a deviation rather than
  silently skipped.
- **New feature module** `src/features/catalogue/` (schema/queries/
  actions), following the exact Phase 3/4 pattern. `getCataloguePartList`
  mirrors `getInventoryList`'s own precedent exactly: plain filters
  (brand/category/fastener/verification) run server-side via
  `.range()`, but a free-text search — matching across part_number/
  name/oem_reference *and* cross_refs — fetches every filtered row and
  paginates in JS instead, since combining that many columns via
  PostgREST would need `.or()` (deliberately avoided app-wide, see
  `features/search/actions.ts`'s filter-DSL-injection comment) or a
  view/RPC not justified at this volume. `capacity_range_kg` is
  rendered verbatim per catalogue-part row everywhere it appears (part
  detail, model detail's compatible-parts table) — never averaged or
  derived, per ADR 0008; same treatment for `fuel_type`.
- **Two small shared-lib extractions**, not new abstractions: pulled
  `toIlikePattern` out of `features/search/actions.ts` into
  `src/lib/ilike.ts` (a `"use server"` file can only export async
  functions, and the catalogue parts search needed the same escaping
  logic), and `isUniqueViolation` out of `features/warehouse/actions.ts`
  into `src/lib/errors.ts` (now shared with `features/catalogue/
  actions.ts` rather than a third copy-paste). Also extracted the
  `first(searchParams…)` helper duplicated in `inventory/page.tsx` into
  `src/lib/search-params.ts` (`firstParam`) once the two new catalogue
  list pages needed it too.
- **Routes**: `/catalogue` (real brand overview with real model/part
  counts + inline category management, replacing the Phase 1
  placeholder), `/catalogue/brands` (new — full brand CRUD),
  `/catalogue/models` (real, brand-filterable, replacing the
  placeholder, plus a model-family management section), `/catalogue/
  models/[id]` (real detail — family, fuel type, breadcrumb, read-only
  compatible-parts table, replacing the placeholder), `/catalogue/parts`
  (real, paginated/searchable/filterable list, replacing the
  placeholder), `/catalogue/parts/[id]` (new — full detail: cross-refs,
  sources, compatibility, linked-inventory indicator, Promote to
  inventory), `/catalogue/parts/new` and `/catalogue/parts/[id]/edit`
  (new — `CataloguePartForm`, mirroring `PartForm`'s page-not-dialog
  threshold since it carries 11 fields/two Combobox pickers). Brand/
  category use a new `NameFormDialog` (mirrors `CodeFormDialog`); model
  family/model use their own two dialogs, still short of the page
  threshold. `HierarchyBreadcrumb` reused as-is for Brand → Model
  family → Model.
- **Compatibility editing, resolved per phase5.md §5**: the part detail
  page is the primary editor (add/remove a model, change verification
  status, optional notes) — accepted the spec's own recommendation
  as-is, so no ADR override was needed. The model detail page shows the
  same data read-only with a link back to each part. A duplicate
  part+model link surfaces as "This part is already linked to this
  model" (the DB's own unique constraint, translated), not a raw
  Postgrest error; removing a link goes through `ConfirmDialog`.
- **Promote to inventory** (phase5.md §4 goal #5) is a plain `<Link>`
  from an unlinked catalogue part's detail page to `/inventory/new?
  catalogueId=&partNumber=&name=` — `NewInventoryPartPage` reads those
  three query params and passes them to the *existing* `PartForm` as
  ordinary `defaultValues`. No second create flow: same page, same
  `createPart` Server Action every other new inventory part goes
  through. Gated on `inventory.create` (staff has it), not
  `catalogue.manage`, per phase5.md §10, and hidden once the catalogue
  part already has a live inventory link.
- **Stale link fixed while here**: the global header search
  (`features/search/actions.ts`) hard-coded `href: "/catalogue/parts"`
  for a catalogue-only match, since no detail page existed before this
  phase. Now points at the real `/catalogue/parts/${id}`.
- **Verification status**: a new shared `VerificationBadge`
  (`src/components/shared/verification-badge.tsx`) centralizes the
  `verified`/`unverified`/`uncertain` → tone mapping once, reused
  everywhere a catalogue part or compatibility row appears (parts list,
  part detail, model detail, compatibility editor) rather than
  duplicating the map per file the way `InventoryStatus` labels are.
- **Testing**: 22 new unit/component tests — `catalogue/schema.test.ts`
  (every new zod schema, incl. the optional-field-not-empty-string and
  capacity-range-stays-free-text behaviors), `catalogue/queries.test.ts`
  (`getBrandList`'s count aggregation, and `getModelDetail`'s ADR-0008
  verbatim-per-part-capacity behavior — mock-supabase pattern mirroring
  `warehouse/queries.test.ts`), `verification-badge.test.tsx`, and
  `catalogue-part-actions.test.tsx` (the Promote link's exact
  `href` incl. URL-encoding, its visibility toggling on `canPromote`,
  and Edit/Delete's `canManage` gating). **203 total unit/component
  tests, all green.**
  - **E2E** (`e2e/catalogue.spec.ts`, live Supabase project, `staff`
    fixture): browses `/catalogue/brands` → Godrej → a real model (GX
    150 D) → confirms a real compatible part (Godrej part `02326191`,
    "BEARING - ROLLER") shows "Verified" (confidence A from the import)
    and its own `1500-3000` capacity range; searches `/catalogue/parts`
    for that same real part number and confirms it resolves to the new
    detail page with matching brand/category/verification/capacity;
    confirms every management control (Add brand/model, part Edit, Add
    compatible model) is absent for staff. The "Promote to inventory"
    click deliberately **stops short of submitting** the create form —
    unlike `inventory.spec.ts`'s synthetic `E2E-TEST-`-prefixed part,
    actually creating an `inventory_parts` row linked to this real
    Godrej part would make a genuine spare part falsely appear "in
    stock" in the live project the user runs their actual business on.
    The test instead confirms the handoff itself: landing on
    `/inventory/new?catalogueId=…` with Part number/Name genuinely
    pre-filled from the real catalogue record. No synthetic data was
    left behind by this phase's e2e run.
  - **No live admin/manager CRUD e2e test happened this session** —
    same reason as Phases 3/4: no admin/manager *application* login is
    available, only the `staff` fixture. The create/edit/delete/
    compatibility-editing logic itself is covered by the component
    tests above plus manual code review against the exact Phase 3/4
    action patterns (`requireRole`, `isUniqueViolation`, `ActionResult`).
  - **Incidentally fixed a pre-existing, unrelated flake** in
    `e2e/dashboard.spec.ts`: its KPI-card assertions used
    `getByText("Out of stock")`/`getByText("Low stock")` without
    `exact: true`, which broke once the live project's low-stock table
    had enough real matching rows to render its own "Out of Stock"/"Low
    Stock" badges and tab labels on the same page. Unrelated to this
    phase's actual work, fixed since it was found while running the
    full e2e suite for verification.
- Typecheck, lint, format, build, and all unit/component/e2e tests pass
  — **except** `e2e/dashboard.spec.ts`'s pre-existing `getByText("—",
  { exact: true })).toHaveCount(0)` assertion, which now finds 6 real
  em-dashes elsewhere on the dashboard (legitimate empty-optional-field
  markers from real, grown data — not a Phase 1 placeholder). This is a
  Phase 2 test assumption invalidated by real data growth over time, not
  a Phase 5 regression; left as a known issue rather than redesigning
  Phase 2's dashboard e2e coverage out of scope.

**Out of scope, confirmed against phase5.md §4/§15 and left alone**: a
second/future catalogue import pipeline, full reporting/analytics on
catalogue data (Phase 6), QR/barcode, and any
Sales/Purchases/Suppliers/Customers/Invoicing concept.

## Phase 6 — Operations + Business Intelligence (done)

Spec: `phase6.md` (saved to the repo root). Replaced the `/reports`
placeholder with eight real, read-only BI views built on top of Phase
2's already-live dashboard aggregates and Phases 3–5's real inventory,
warehouse, and catalogue data — no new domain concepts, no new tables.

- **`§5`'s fast/slow-mover definition accepted as-is, no ADR override**:
  rank by `sum(abs(quantity_change))` over non-`transfer` movements in
  the selected range; fast = top 20 by that ranking; slow = live parts
  with zero qualifying movement in the range, ordered by how long
  they've actually been idle (shared with the Stock Aging report via
  `getStockAgingRows`, not a second ordering invented for the movers
  report).
- **New `src/features/reports/` module**: `schema.ts`
  (`parseReportDateRange` — `days`∈{7,30,90} or a Zod-validated custom
  `from`/`to`, defaulting to 30 on anything invalid rather than erroring
  the page), `valuation.ts`, `movements.ts` (shares one range-bound
  `stock_movements` fetch across the type chart/summary and both movers
  lists), `aging.ts` (unbounded by design — "how long has this sat" has
  to look arbitrarily far back), `occupancy.ts`, `catalogue-coverage.ts`,
  and `shared.ts` (`getPartLabelsById` — the brand-resolution lookup
  extracted once a third report needed the exact pattern
  `getLowStockRows` already established).
- **`sumCostBasis` extracted from `getInventoryValue`**
  (`src/features/dashboard/queries.ts`) so the valuation report's
  category/brand breakdowns and the dashboard's own KPI can never
  disagree — one cost-basis formula, not two. The valuation report is
  additionally gated on `canViewInventoryValue` (admin/manager only,
  phase2b's ADR) exactly like the dashboard KPI; staff/read-only see the
  same permission-denied state instead of the report.
- **Three small existing-file exports**, not new abstractions:
  `getBoxPartCounts` (warehouse/queries.ts) and
  `getLinkedCataloguePartIds` (catalogue/queries.ts) were already-correct
  private logic that Phase 6 needed to reuse verbatim rather than
  reimplement; `groupBy` moved from a private helper in
  warehouse/queries.ts to `src/lib/utils.ts` so the new occupancy rollup
  (`getOccupancyRollup`, one pass across every warehouse/rack instead of
  N+1) uses the identical grouping logic instead of a second copy.
  `LowStockRow` gained a `categoryName` field (same derivation path as
  `brandName`) so the new low-stock report's category filter didn't need
  a parallel query — additive, the dashboard widget is unaffected.
- **New shared UI**: `DateRangePicker`
  (`src/components/shared/date-range-picker.tsx`) — presets (7/30/90) +
  an optional native `<input type="date">` custom range, no new
  dependency (no `date-fns`/`react-day-picker`) since a calendar-picker
  library wasn't justified for a "nice to have" per phase6.md §4. Follows
  `InventoryFilters`'s exact URL-is-source-of-truth pattern.
  `MovementTypeBarChart` — the 6-movement-type sibling of the dashboard's
  2-series chart, which is left untouched.
- **Every `ColumnDef`/`DataTable` pair lives in its own small "use
  client" file per report** (`valuation-breakdown-table.tsx`,
  `movement-summary-table.tsx`, `movers-tables.tsx`, `aging-table.tsx`,
  `occupancy-table.tsx`), mirroring `low-stock-report-table.tsx`'s
  existing pattern — a `cell` renderer is a function, and functions
  can't cross the Server→Client Component prop boundary. Caught this
  live against the real dev server (every range/list report crashed with
  "Functions cannot be passed directly to Client Components" until each
  `columns` array moved into its own client file) rather than only via
  typecheck, which doesn't catch this class of RSC-boundary violation.
- **Testing**: 6 new data-layer test files under `src/features/reports/`
  (31 tests) plus `date-range-picker.test.tsx` (5 tests) — 240 total
  unit/component tests, all green. `e2e/reports.spec.ts` (8 tests, live
  Supabase project, `staff` fixture): the overview links to all seven
  reports; the valuation report correctly shows the permission-denied
  state for staff (a real behavior to verify, not a gap — same "no
  admin/manager application login available" limitation documented in
  Phases 3–5); the other six reports render against the real, live data
  already in the project (2 brands, 284 catalogue parts, 979
  compatibility links, real stock movements and warehouse occupancy).
  Manually walked every report page against the live dev server with
  Playwright and screenshots before writing the final e2e spec, which is
  what caught the RSC-boundary bug above.
- Typecheck, lint, format, build, and the full unit/component/e2e suite
  pass — **except** the same pre-existing `e2e/dashboard.spec.ts` em-dash
  flake already documented as a known issue in the Phase 5 entry above
  (unrelated to this phase).

**Out of scope, confirmed against phase6.md §4/§15 and left alone**:
CSV/export tooling, backup/restore, any new summary/materialized table,
QR/barcode, and any Sales/Purchases/Suppliers/Customers/Invoicing
concept.

## Phase 7 — Security + Testing + Hardening + Launch (done)

Spec: `phase7.md` (saved to the repo root). No new product features —
this phase reviewed and hardened the application built across Phases
1–6: security, RLS, CI, deployment, accessibility, performance, test
coverage, and documentation.

- **Security review**: exhaustively checked every exported function in
  every `features/*/actions.ts` calls `requireRole()` before touching
  data (compared exported-function counts against `requireRole`-call
  counts per file, not spot-checked); confirmed `SUPABASE_SECRET_KEY` is
  referenced in exactly one file (`src/lib/supabase/admin.ts`, `import
  "server-only"`-guarded); confirmed every client-visible error message
  (`result.error.message`) traces back to `toSafeErrorMessage()`'s
  sanitized text, never a raw Postgrest/SQL error. **No fixes were
  needed** — the pattern established in Phases 1–6 held up under a real
  audit, not just spot review.
- **RLS re-audit**: all 18 tables checked table-by-table against
  `src/lib/permissions`'s capability model, not just the tables touched
  by the two prior hardening migrations. **No gap found; no new
  migration was needed** — a real, checked outcome, documented as such
  rather than silently skipped (same pattern Phase 5 used when its own
  RLS check came back clean).
- **CI pipeline** (`.github/workflows/ci.yml`, GitHub Actions — this
  project's repo is already on GitHub, no new external service needed):
  a `verify` job (typecheck/lint/format:check/test/build — the exact
  `package.json` scripts) on every push/PR, and a separate `e2e` job
  (Playwright against the live Supabase project) on push to `main`
  only, since it hits real data over the network. **This is the first
  CI this project has ever had** — every prior phase's verification was
  manual. Repo secrets for the `e2e` job still need to be added by the
  user (documented in `docs/LAUNCH_CHECKLIST.md`) — not something an
  agent can do without the GitHub CLI/API access this environment
  doesn't have.
- **CI e2e runs against a production build**, not `next dev` — a real
  finding: dev mode's per-route first-compile was a genuine source of
  flaky first-hit timeouts (reproduced directly, not assumed), which a
  cold CI container would hit on literally every route on every run.
  `playwright.config.ts` now runs `next start` (after a `next build`
  CI step) when `process.env.CI` is set, `next dev` locally otherwise.
- **Deployment verification — a real, still-open finding, not a closed
  gap.** Checked via the Vercel API: every deployment through the Phase
  6 commit (`27fb8a7`) has a matching `githubCommitSha` and landed
  within minutes of its push — real historical evidence auto-deploy was
  working. But pushing this phase's own commits produced **no new
  deployment** after several minutes (checked `vercel ls`, the
  deployments API, and a `BUILDING`/`QUEUED` state query — nothing
  pending or new). `gitProviderOptions.createDeployments` still reads
  `enabled` and `vercel git connect` reports the repo as connected, so
  the *configuration* looks right — something about actual webhook
  delivery may have quietly broken (a GitHub App permission change is a
  common cause), which isn't diagnosable from an environment without
  GitHub dashboard/API access. Documented as an open action item in
  `docs/LAUNCH_CHECKLIST.md` rather than papered over: check Vercel's
  Project Settings → Git page directly, and use `vercel --prod` as a
  manual fallback if needed. This is the exact "stale deployed URL"
  risk the project hit once before, caught again rather than
  re-assumed fixed just because it worked historically.
- **Accessibility review** (`e2e/accessibility.spec.ts`, axe-core WCAG
  2.1 AA scan across 6 pages + a manual keyboard/focus-trap check) found
  and fixed four real issues, all shipped silently across Phases 1–6:
  (1) `--primary`/`--success` color-contrast below 4.5:1 — darkened both
  (same hue/brand identity) with margin, verified via a small WCAG
  luminance script, not eyeballed; (2) bare filter `Select` triggers
  with no accessible name across 5 files — added specific `aria-label`s;
  (3) a filter-only `Tabs` control (`low-stock-table.tsx` ×2) pointing
  `aria-controls` at a nonexistent panel — added empty, `forceMount`+
  `hidden` `TabsContent` panels; (4) **the one non-obvious finding**:
  Radix's own FocusScope-based focus-restore-on-close doesn't reliably
  return focus to a Dialog/AlertDialog/Sheet's trigger in this app's
  stack — reproduced live via Escape/Cancel/X-close, in both `next dev`
  and a production server, with mouse- and keyboard-triggered opens.
  Fixed once, in the three shared primitives
  (`components/ui/dialog.tsx`/`alert-dialog.tsx`/`sheet.tsx`), via a
  corrective focus-capture layer using React's "adjusting state during
  render" pattern (not a ref mutation — the React Compiler's
  `react-hooks/refs` lint rule, enabled in this project, correctly
  rejects that). Full detail and reasoning: `docs/decisions/0013`.
- **Performance review**: audited every loop in every
  `features/*/queries.ts`/`actions.ts` file for N+1 patterns — none
  found, every loop post-processes an already-batched `.in()`/
  `Promise.all()` result. Pagination is real (`.range()`) for the
  inventory/catalogue-parts plain-filter path; the free-text search path
  on those same lists still fetches-all-then-paginates-in-JS, a
  pre-existing Phase 3/5 tradeoff, left as-is. Reports fetch their full
  underlying table(s) unbounded — measured against the real current
  dataset at well under a second per report, **noted but not fixed**
  for CLAUDE.md's stated 1,500–2,000-part ceiling, per §18/§45's
  "don't optimize for a scale that doesn't exist yet."
- **Admin-role e2e coverage** (`e2e/admin.spec.ts`, a real gap every
  prior phase's own notes flagged): provisioned a dedicated `admin`-role
  Supabase Auth fixture (`scripts/create-e2e-admin.mjs`, mirrors how the
  `staff` fixture was created in Phase 1) and added two specs — create/
  edit/soft-delete a synthetic warehouse, and create/soft-delete a
  synthetic catalogue brand — both exercising real admin/manager-gated
  Server Actions end-to-end in a real browser for the first time.
- **Two pre-existing e2e flakes fixed** while running the full suite
  repeatedly for verification: `e2e/dashboard.spec.ts`'s em-dash
  assertion (documented as a known Phase 5 issue — real optional-field
  em-dashes now legitimately appear elsewhere on the page, so the
  assertion was testing the wrong thing; removed, the KPI assertions
  above it already cover the original intent) and
  `e2e/warehouse.spec.ts`'s final navigation assertion missing the
  file's own "generous timeout on first hit to a dynamic route"
  convention (added, matching the other four navigations in the same
  file).
- **Removed the stale `/operations` nav item and placeholder page** —
  it was still claiming "coming in Phase 6" after Phase 6 shipped; its
  promised functionality (record a movement, see the ledger) already
  lives at `/inventory/[id]` and `/reports/movements`. A real, if minor,
  UX-polish finding, not a new feature.
- **Documentation**: `README.md` rewritten to reflect the full
  application (all six product phases, CI, and the confirmed deployment
  story, not just Phase 1's original shape); `.env.example` updated with
  the admin e2e fixture; `docs/LAUNCH_CHECKLIST.md` added — a human-run
  checklist distinguishing what Phase 7 verified live from what still
  needs a person to actually do (adding CI secrets, a final manual pass
  on the deployed URL).
- **Test-data hygiene**: this phase's own repeated manual e2e/debugging
  runs (far more than a normal single verification pass — see below)
  left real accumulated synthetic residue in the live Supabase project:
  17 `E2E-TEST-`-prefixed `inventory_parts` rows and 7
  `E2E Admin Test Brand` rows whose soft-delete had a benign but slow
  (~1-3s) `router.refresh()`-dependent completion that a few of this
  session's own ad-hoc debug scripts didn't wait long enough to observe
  before moving on. All were confirmed as disposable test fixtures (no
  real business data) and soft-deleted directly via the secret-key admin
  client — the same `deleted_at` mechanism the app itself uses, not a
  hard delete. Live-verified after cleanup: no `E2E`-prefixed row remains
  active in `warehouses`, `brands`, `categories`, `catalogue_models`,
  `catalogue_model_families`, `catalogue_parts`, or `inventory_parts`.
  This was environmental (many overlapping manual test/debug runs and,
  at one point, a stale `next start` process serving from a `.next`
  directory rebuilt out from under it) — the underlying delete mechanism
  itself was re-verified correct and reliable across three independent,
  careful checks once the environment was stable.
- Typecheck, lint, format, build, the full 240-test unit/component
  suite, and the full 28-spec e2e suite (run against a production
  build, matching CI) all pass clean.

**Out of scope, confirmed against phase7.md §4/§15 and left alone**: any
new product feature, QR/barcode, Sales/Purchases/Suppliers/Customers/
Invoicing, a full visual redesign of any screen, and load-testing beyond
`CLAUDE.md`'s stated 1,500–2,000-part scale.

## Post-launch UI work (2026-09-06, done)

Small, user-requested UI polish after V1 launch - not a phase, no new
domain concepts, no schema changes.

**Login page - icon-prefixed inputs + industrial accents** (commit
`38858ec`, on top of an earlier same-day password-toggle revamp,
`3dc82ca`): the user shared an unrelated "industrial terminal" login-page
reference (dark cyberpunk RFID/badge-scan aesthetic with fabricated
SOC2/uptime telemetry and Okta/YubiKey SSO). Kept only the
structural/visual ideas that fit `CLAUDE.md` (icon-prefixed email/
password fields, a numbered capability-tile list, a small monospace
eyebrow label using the existing `--font-plex-mono` token) and explicitly
left out the RFID/barcode scan tab (QR/barcode is banned for V1 per
`CLAUDE.md` #14), the fabricated certifications/stats, and the SSO
buttons (only Supabase email/password auth exists - non-functional
buttons would be dead UI presented as real). `login-form.tsx`,
`feature-list.tsx`, `login/page.tsx` touched; no new dependency.

**Dashboard - greeting, quick actions, brand mix, top models** (commits
`901b9af`, `1d9de2c`, `e662402`): the user re-shared the same "Vehicle
Parts Inventory" mockup that was already Phase 2's dashboard reference
(see the Phase 2 section above and `project-forkstock-dashboard-mockup`
memory) and asked to close the remaining visual/functional gap. Added,
all wired to live Supabase data, no fabrication:
- `getInventoryCountByBrand()` (`src/features/dashboard/queries.ts`) -
  same join pattern as the reports module's valuation-by-brand
  breakdown, but item-count-only (no cost), so it needs none of that
  report's value-visibility gating. 3 new unit tests (243 total now, up
  from 240); the shared `queries.test.ts` mock was upgraded from a
  single-chain (`select().is()`) mock to the reports module's more
  flexible per-table chain mock to support the new function's extra
  `catalogue_parts`/`brands` lookups.
- `BrandDonutChart` (`src/components/shared/brand-donut-chart.tsx`) - new
  Recharts donut primitive (centered total + side legend), same
  theme-token-color/custom-tooltip convention as the existing
  stock-movement bar chart. No new dependency (Recharts already
  approved/installed).
- `TopModelsWidget` - ranks catalogue models by the already-existing
  `compatiblePartCount` from Phase 5's `getModelList()`
  (`src/features/catalogue/queries.ts`) - a real compatibility-link
  count, not a fabricated "popularity" metric this app doesn't track.
- `QuickActions` - links to real, already-built pages only (Add part,
  Add catalogue part, Browse warehouse, View reports), each gated by
  `can(role, ...)` from `src/lib/permissions`. No invoicing/sales/CRM
  shortcuts - confirmed out of scope again, same as Phase 2.
- `DashboardGreeting` - a neutral "Welcome back, {name}" + date.
  Deliberately has no time-of-day "Good morning/evening" text: this
  renders in a Server Component, so the hour would be the deployment's
  server timezone, not the viewer's - a real correctness risk, not just
  a style choice, so it was dropped rather than shipped wrong.
- `page.tsx` regrouped into: greeting → KPI row (unchanged) → [stock
  movement chart | quick actions] → [recent activity | brand donut | top
  models] → low-stock table (unchanged). Each new widget keeps the same
  per-widget Suspense-boundary/loading/empty/error convention as the
  existing ones.

Verified: typecheck/lint/format/build/243 unit tests all green; manually
logged into the running dev server (Playwright, admin test account) and
screenshotted the real rendered dashboard at 1600px and 390px - real
catalogue data (Godrej/Voltas-OM brands, DVX-series forklift models) came
through correctly, no console errors, all widgets resolved.

## Admin feature — Users/Roles + Import/Export (2026-09-06, done)

Not a phase (there is no Phase 8) - a real gap closed. `/admin` had shown
a `PlaceholderPage` labeled "Coming in Phase 7" since Phase 1
(`5d4cd5b`), a guess made before the phase plan was finalized. When
Phase 7 actually ran, its own spec was "no new product features" -
hardening only - so the feature the placeholder promised was never built
in any of the 7 phases. The user confirmed this while checking the live
deployed `/admin` page and asked to build it. No new migration was
needed - `profiles`/`app_role` (Phase 1) already covered everything
users/roles needs.

- **Users & Roles** (`/admin/users`, `src/features/admin/{actions,
  queries,schema}.ts`): new users are added by **email invite**
  (`createAdminClient().auth.admin.inviteUserByEmail`), not an
  admin-set password - the invitee sets their own via a new
  `/accept-invite` page (`src/features/auth/components/
  accept-invite-form.tsx`) that the browser's Supabase client
  auto-authenticates from the invite link's URL tokens
  (`detectSessionInUrl`). Required a middleware fix
  (`src/lib/supabase/middleware.ts`): `/accept-invite` needed a *third*
  redirect category (`AUTH_FLOW_PATHS`, exempt from both "must be logged
  in" and "must be logged out" rules) - a plain `PUBLIC_PATHS` entry
  would have bounced an already-authenticated invitee straight to
  `/dashboard` before they could set a password. `getUserList()` merges
  `profiles` (via the regular RLS-scoped client - RLS's "Admins can view
  all profiles" already permits it) with Supabase Auth's
  `admin.listUsers()` (email/last-sign-in/ban state - only the admin API
  has these). Role changes go through the regular client (RLS-gated);
  deactivate/reactivate bans/unbans via the admin API
  (`ban_duration: "876000h"`/`"none"`) rather than deleting the account,
  so historical records referencing that user stay intact. Both
  `updateUserRole` and `setUserActive` refuse to touch the caller's own
  row, and refuse to demote/deactivate the last remaining `admin` -
  never leaves the app with zero admins able to fix it.
- **Import/Export** (`/admin/import-export`, `/admin/catalogue-export`
  GET Route Handler - this app's first-ever API route):
  **catalogue parts only** for V1, not inventory stock records (the
  user's explicit call - avoids risking bulk writes to live stock).
  `catalogue_parts.part_number` is deliberately not unique at the DB
  level ("duplicate detection is an app workflow, not a constraint" -
  `20260905060100_catalogue_schema.sql`), so import never upserts: rows
  matching an existing (brand, part_number) pair are reported as
  skipped, never overwritten - mirrors `scripts/
  import-master-catalogue.mjs`'s own skip-existing behavior. New
  `src/lib/csv.ts` (RFC4180 parse/stringify, ported from that same
  script) rather than adding a dependency.
- **Admin landing page** (`/admin`) now links to the two sections above
  plus the already-built `/warehouse` CRUD (Phase 4) - "warehouse
  configuration" was never rebuilt here, since duplicating working code
  would have contradicted the rest of this change's own reasoning.

Verified: typecheck/lint/format/build/251 unit tests all green (11 new -
`csv.test.ts`, `admin/schema.test.ts`). e2e coverage added to
`e2e/admin.spec.ts`: CSV export returns a well-formed file, a CSV import
happy path (synthetic `E2E Admin Test Import Part`, cleaned up via the
catalogue UI's own soft-delete afterward, same prefix convention as the
warehouse/brand tests above), and a non-admin-redirect check using the
plain `staff` fixture. **Not run against the live Supabase project in
this session** - importing writes a real (synthetic, cleaned-up) row to
the live catalogue, and there's no live-invite test at all, since that
would email a real address; per this project's standing caution around
live-data e2e writes, that's for the user to run or explicitly authorize.
Real invite-email delivery isn't E2E-testable in CI at all (no way to
receive the email) - flagged as a manual step in
`docs/LAUNCH_CHECKLIST.md` instead.

## Maximalist visual redesign (2026-09-07, IN PROGRESS — not a phase)

**This is a deliberate, explicit, user-directed override of CLAUDE.md
§7 ("Design Direction" — restrained industrial SaaS, anti-decoration)
and ADR-0003 (light-only V1, fixed sidebar chrome).** The user asked to
set those aside and rebuild the entire application's visual identity as
a maximalist, animated, 3D-enhanced "premium" experience, confirming via
clarifying questions: (1) scope = the **entire application**, not one
page, (2) 3D = a real react-three-fiber scene, not CSS tricks, (3) full
creative freedom on brand identity. Non-design requirements (WCAG 2.1
AA, desktop-first, auth logic, data integrity) are **not** waived and
have been actively re-verified throughout.

Work is happening on branch **`redesign/maximalist`** (pushed to
`origin`, **not merged to `main`** — main/production are untouched so
far). The full plan (context, token values, 3D architecture, batch
rollout, verification gates) is at
`/root/.claude/plans/serialized-drifting-kurzweil.md` — read it before
continuing this work in a new session.

**Done and verified** (typecheck/lint/format/251 unit tests/production
build/full 31-test Playwright suite all green, except one CSV-import
e2e test independently confirmed to fail identically on unmodified
`main` — a pre-existing native-file-input/browser quirk, unrelated):

- **Batch 0 (foundation)** — added `three`, `@react-three/fiber@^9`
  (the React-19-compatible major), `@react-three/drei`,
  `@react-three/postprocessing`. `src/app/globals.css` flipped
  dark-first: deep graphite-navy canvas, the original warm amber kept as
  hero accent plus a new electric-blue secondary, colored glow shadows,
  a `glass-panel` utility, bigger radius scale. `html` forces the `dark`
  class (no toggle — extends ADR-0003's "fixed chrome" precedent
  app-wide rather than building toggle machinery); the old light palette
  is kept dormant in `:root`, not deleted. Added Bricolage Grotesque as
  `--font-display`/`--font-heading` for headlines only — IBM Plex
  Sans/Mono untouched for body text and part numbers/SKUs.
  `src/components/ui/card.tsx` got a `tone: "flat" | "glass"` prop
  (default `"flat"`, so every existing usage — ~60 call sites —
  upgrades to the new dark tokens for free with zero code changes),
  `button.tsx` got `variant="gradient"`, `table.tsx` got a CSS-only
  hover/header skin pass. New `src/components/premium/` (GradientText,
  MagneticButton, ScrollReveal) and `src/lib/hooks/use-reduced-motion.ts`
  (uses `useSyncExternalStore`, not motion/react's own hook — that one
  reads `matchMedia` during the first client render and caused a real
  SSR hydration mismatch, since fixed). New `src/components/three/`
  scaffold: `scene-canvas.tsx`, `scene-primitives.tsx` (shared abstract
  floating-cluster geometry — deliberately not a literal forklift render,
  no such asset exists), three composed scenes (login/dashboard/hub),
  and `scene-loader.tsx` — the **only** file allowed to call
  `next/dynamic(ssr:false)` for a scene, gating on
  `prefers-reduced-motion`, `lg:`-and-up viewport (desktop-first is not
  waived), and IntersectionObserver lazy-mount, with a static CSS
  poster-fallback otherwise. Confirmed via network trace that the
  ~1MB three.js chunk loads only on routes that actually render a scene.
- **Batch 1 (login + dashboard flagship)** — login page rebuilt as a
  unified glass-panel card with the full `HeroSceneLogin` (floating
  amber/electric metallic-glass cluster, bloom, mouse parallax) and a
  gradient `MagneticButton` submit. Dashboard got a slim, deliberately
  more restrained `HeroSceneDashboard` band behind the greeting — KPI
  cards below need to stay primary, not compete with decoration. This
  also confirmed the token flip cascades through the **whole app** for
  free: sidebar, header, charts, KPI cards, and tables on every other
  page already read as the new dark palette with zero additional edits
  (verified via screenshot on the real dashboard).
- Two real bugs found and fixed while verifying (not just eyeballed —
  caught via pixel-sampling and axe/Playwright): a stacking-context bug
  where `-z-10` on the 3D layer put it behind normal-flow content
  (negative z-index always loses to static/auto content regardless of
  DOM order — fixed with `z-0`/`z-10` instead), and the hydration
  mismatch above. Also fixed a **pre-existing** bug unrelated to this
  redesign, caught by finally re-running `smoke.spec.ts`: the login
  page's "ForkStock" wordmark had been silently demoted to a `<span>` in
  an earlier session, breaking `getByRole("heading",{name:"ForkStock"})`
  — restored as `<h2>`.

- **Batch 2 (hub pages)** — new `src/components/premium/hub-hero.tsx`
  (extracted once `/catalogue`, `/reports`, `/admin` all needed the
  identical glass-panel + `HeroSceneHub` header shape — this codebase's
  usual extract-on-third-caller threshold), wired into all three with
  alternating lead hue (amber for catalogue, electric for
  reports/admin) so they don't look identical. Their link-grid cards
  got `tone="glass"`; catalogue's brand cards (which carry real
  Models/Parts counts, not pure navigation) deliberately stayed flat.
  Verified: 0 axe violations on all three routes (including as an
  admin user), full `catalogue`/`reports`/`admin` e2e suites green
  (same pre-existing CSV-import flake as before, still unrelated), 251
  unit tests, clean build.

- **Batch 3 (inventory + catalogue parts, no 3D)** — dense working
  pages get narrow, targeted refinement rather than uniform decoration:
  `/inventory/[id]`'s single hero-stat (the quantity number) got
  `tone="glass"` + a glow shadow; the one primary page-level CTA on
  each of `/inventory`, `/inventory/new`+`/inventory/[id]/edit`
  (shared `part-form.tsx`), `/catalogue/parts`, and
  `/catalogue/parts/new`+`/catalogue/parts/[id]/edit` (shared
  `catalogue-part-form.tsx`) got `variant="gradient"`. Every
  dialog-internal button (brand/category/model tables, compatibility
  editors, cross-refs, etc. — ~20 call sites surveyed) was deliberately
  left alone: gradient-ing every button in the app is exactly the "AI
  slop" look this redesign is trying to avoid. `/catalogue/parts/[id]`,
  `/catalogue/brands`, `/catalogue/models`, `/catalogue/models/[id]`
  needed no changes beyond what Batch 0's token flip already gives
  every page for free. Confirmed the e2e-critical
  `page.locator("p.text-3xl")` on the inventory detail page still
  resolves. Verified: 0 axe violations, full
  inventory/catalogue/search e2e suites green, 251 unit tests, clean
  build (the two failures seen in a full-suite run — dashboard axe
  sign-in timing, CSV-import strict-mode violation — are the same
  flakes already confirmed unrelated, both pass in isolation).

**Not started yet** — Batch 4 (warehouse hierarchy, 4 levels), Batch 5
(7 report sub-pages), Batch 6 (admin sub-pages + `/accept-invite`,
which still has the pre-redesign light full-bleed layout and will look
inconsistent with `/login` until then).

**Do not merge `redesign/maximalist` to `main` without the user's
explicit, informed go-ahead** — main auto-deploys via Vercel
(`docs/LAUNCH_CHECKLIST.md`), and merging now would ship a real business
tool's login/dashboard in a completely different visual language from
every other page mid-redesign.

## Next steps

The maximalist redesign above is the active thread — continue with
Batch 2 (hub pages) per the plan file, then Batches 3-6. Confirm scope
with the user if resuming after a long gap, since this overrides
documented project direction and its own plan file may have drifted
from reality — reconcile against the actual repo/branch state first.

Separately, unrelated to the redesign: ForkStock V1 (the pre-redesign
feature set) is feature-complete, reviewed, hardened, and documented.
What was left there is entirely for a human to do, tracked in
`docs/LAUNCH_CHECKLIST.md`: add the CI `e2e` job's repository secrets,
run (or authorize) the admin e2e tests and a real invite-email smoke
test against the live Supabase project, and do one final manual
walkthrough on the actual deployed URL before real warehouse staff start
using it.
