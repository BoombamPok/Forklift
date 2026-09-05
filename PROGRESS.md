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
**Phase 2 of 7 — Core UI + Dashboard: NOT STARTED — this is where the next session picks up.**

Phases: 1) Architecture + UX Foundation → 2) Core UI + Dashboard →
3) Inventory + Parts → 4) Warehouse Management →
5) Catalogue + Vehicle Compatibility → 6) Operations + BI →
7) Security + Testing + Hardening + Launch.

Phase 1 spec: `phase1.md` (done, verified, code-reviewed). Phase 1's
implementation plan (historical reference, not needed to continue):
`/root/.claude/plans/splendid-conjuring-pony.md`.

**⚠ OPEN QUESTION before starting Phase 2**: there is no `phase2.md` in
the repo. For Phase 1 the user supplied a detailed spec file the same
way `phase1.md` exists; ask whether they have an equivalent for Phase 2,
or whether to plan it from `CLAUDE.md` §19's one-line description ("Core
UI + Dashboard") plus the dashboard mockup discussed below. Follow
`CLAUDE.md` §20's Phase Workflow (read CLAUDE.md → read phase2.md →
inspect repo → plan → implement → verify → document → stop at boundary)
once that's resolved.

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

## Next steps

Phase 1 is done: tooling, design system + primitives, application shell,
Supabase client code + migrations, live auth/RLS verification, docs
(README + 8 ADRs), a full code-review hardening pass, and a real
catalogue data import — all committed (15 commits, see `git log`), all
local + live verification passing (typecheck/lint/format/build/unit
tests/e2e all green as of the last commit).

1. Resolve the phase2.md question above.
2. For the Phase 2 dashboard specifically: KPI cards will still show
   empty/"—" states honestly, since Phase 2 doesn't add real inventory
   records — only the "Popular Forklift Models" style widget can use
   real data today (the imported catalogue). Don't fabricate inventory
   numbers to make the mockup's look "work" before Phase 3 adds real
   stock.
3. Follow `CLAUDE.md` §20's Phase Workflow from there.

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
