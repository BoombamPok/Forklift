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

- Git repo initialized (`main` branch). No commits yet — first checkpoint
  commit ("chore: initialize Next.js project") about to be made.
- Next.js scaffolded via `create-next-app`: TypeScript, App Router,
  Tailwind CSS v4, ESLint, `src/` dir, npm, import alias `@/*`.
  Next 16.3.4 / React 19.2.8. `npm run build`, `npm run lint`,
  `npm run typecheck` all pass clean on the untouched scaffold.
- Vitest + React Testing Library, Playwright (one smoke test), Prettier
  wired into ESLint — all passing.
- shadcn/ui initialized (Nova preset: Lucide icons + Geist fonts, Radix
  base). Design tokens customized in `src/app/globals.css`: light neutral
  workspace, warm orange primary, fixed dark navy `--sidebar-*` tokens
  (same values in `:root` and `.dark` — chrome never changes with theme),
  added success/warning/info semantic tokens shadcn doesn't ship by
  default. `next-themes` deliberately removed (no dark-mode toggle in V1).
  TanStack Table pinned to v8 (v9 installs by default but is a ground-up
  API rewrite, not yet the well-supported version CLAUDE.md calls for).
  Full primitive set built: all shadcn base components plus composed
  `components/shared/*` (SearchInput, IconButton, EmptyState, ErrorState,
  LoadingState, ConfirmDialog, StatusBadge, KpiCard, ChartContainer,
  Combobox, DataTable, Form field primitives for React Hook Form + Zod).
- Application shell built: fixed dark sidebar (desktop ≥1024px) /
  Sheet-based drawer (<1024px), header with page title + disabled search
  placeholder, account menu in sidebar footer (shows neutral "Account"
  placeholder + person icon until Step 5 wires real session data — no
  fabricated user name/email). `(app)/` route group renders every
  business-feature route as `<PlaceholderPage phase={N}>` (no auth guard
  yet — that's wired in Step 5 alongside Supabase). `/dashboard` is the one
  fleshed-out foundation page: KPI cards, chart container, activity list,
  all showing "—"/empty states rather than fabricated numbers. `/` redirects
  to `/dashboard`. Visually verified via Playwright screenshots at
  1440/1024/390px — matches the premium-industrial-SaaS direction, mobile
  drawer collapses correctly. Also fixed `next.config.ts` `devIndicators`
  position (default bottom-left collided with the sidebar's account menu).
- Supabase client architecture done: `lib/supabase/{client,server,admin}.ts`,
  `src/proxy.ts` (renamed from `middleware.ts` — Next.js 16 deprecated that
  file convention), `lib/auth/{get-current-user,require-role}.ts`,
  `lib/permissions/` (role/permission model + tests), `lib/errors.ts`
  (safe error classification + tests). Login route is fully built (real
  form, Server Action) and the `(app)` layout fetches the real user
  server-side — but none of it can be exercised end-to-end without a live
  project. Everything degrades gracefully without credentials (middleware
  passes through, `getCurrentUser()` returns null) — verified by screenshot
  that the shell/login still render correctly with no `.env.local` present.
  `(app)/layout.tsx` is `force-dynamic` (was getting statically prerendered
  with a baked-in "signed out" shell otherwise).
- Full database schema written as ordered SQL migrations in
  `supabase/migrations/` + `supabase/seed.sql` (clearly-fictional dev data)
  — **not yet applied to any project**, since none exists yet. Includes the
  trigger-maintained `inventory_parts.quantity` + guard trigger blocking
  direct writes to it, `current_user_role()` backing all RLS policies, and
  `log_audit_event()` for the audit log. `types/database.ts` is hand-authored
  to match these migrations until `supabase gen types` can generate it for
  real against a live project.
- All local verification passing: typecheck, lint (one benign React
  Compiler warning on TanStack Table, not a real issue), Prettier, 11 unit
  tests, Playwright e2e smoke test, production build, and every route
  (including dynamic `[id]` routes) manually checked at 200.
- **Blocked on the user creating a Supabase project** — next step is
  walking them through the dashboard (their choice earlier this session)
  to get `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  `SUPABASE_SERVICE_ROLE_KEY` into `.env.local`, then apply the migrations,
  regenerate `types/database.ts` for real, and verify auth/RLS live.
- Claude Code plugins installed: `ui-ux-pro-max` (UI/UX design skill set),
  `mattpocock-skills` (TDD, code review, domain modeling, etc.).
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
package manager; git commits at each build checkpoint.

---

## Next steps

Done: tooling, shadcn/ui + design tokens + UI primitives, application
shell/navigation, Supabase client code, database migrations + seed, local
verification (all 6 checkpoint commits landed, see `git log`).

Remaining, in order: **user creates a Supabase project (blocked here)** →
apply migrations to it + regenerate `types/database.ts` for real → wire
and verify auth/RLS live → testing pass → docs (README, ADRs) → final
Phase 1 validation report against `phase1.md` §59/§60.
