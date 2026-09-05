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
**Phase 2 of 7 — Core UI + Dashboard: IN PROGRESS.** The user split it
into five sub-phases; each reads the previous ones' output:

- **2a — Schema + Data Foundation: COMPLETE** (spec: `phase2a.md`). No UI.
- **2b — Dashboard KPI Cards: COMPLETE** (spec: `phase2b.md`).
- 2c — Stock Movement Chart + Recent Activity: NOT STARTED — **this is
  where the next session picks up.**
- 2d — Low-Stock Table: NOT STARTED.
- 2e — Global Search: NOT STARTED (saved for last, self-contained).

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

## Next steps

1. **2c — Stock Movement Chart + Recent Activity** is next. Ask the
   user for `phase2c.md` before starting (same pattern as 2a/2b).
2. 2c will need real `stock_movements` data to chart — currently only
   the two Phase 1 seed rows exist live. Don't fabricate movement/
   activity history to make the widgets "look" populated.
3. Follow `CLAUDE.md` §20's Phase Workflow for each sub-phase.
4. Commit hygiene: split every sub-phase's changes into multiple
   logically-scoped commits (schema/infra/feature/tests/docs) as they're
   made, rather than one large checkpoint commit at the end — standing
   instruction from the user as of Phase 2a's wrap-up.

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
