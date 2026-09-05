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

**Phase 1 of 7 — Architecture + UX Foundation**
Spec: `phase1.md`

Status: **In progress.** Approved implementation plan:
`/root/.claude/plans/splendid-conjuring-pony.md`. Executing per that plan's
checkpoint order — see "Repo state" below for what's actually landed.

Phases: 1) Architecture + UX Foundation → 2) Core UI + Dashboard →
3) Inventory + Parts → 4) Warehouse Management →
5) Catalogue + Vehicle Compatibility → 6) Operations + BI →
7) Security + Testing + Hardening + Launch.

Do not start Phase 2+ work until Phase 1's acceptance criteria (see
`phase1.md`) are met and confirmed.

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
- Claude Code plugins installed: `ui-ux-pro-max`, `mattpocock-skills`.
- Reference catalogue data (the old Hook Locator consolidation report
  mentioned in `phase1.md` §5) is not present in this repo. Proceeding
  without it per user decision — Phase 1 doesn't need real data, only
  schema foundation + clearly-marked dev seed data.

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

Done: tooling, design system + primitives, application shell, Supabase
client code + migrations, and live auth/RLS verification against a real
project (see `git log` for the checkpoint commits).

Remaining: docs (README, ADRs) → final Phase 1 validation report against
`phase1.md` §59/§60, then stop at the phase boundary — no Phase 2 work.
