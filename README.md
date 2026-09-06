# ForkStock

A desktop-first inventory management application for a forklift/vehicle
spare-parts business: catalogue, warehouse locations, stock, stock
history, and business reporting, built so staff can quickly answer *"do
we have this part, and where is it?"*

See `CLAUDE.md` for the full product/architecture rules this project
follows. `phase1.md` through `phase7.md` are this project's detailed,
phase-by-phase specs (all seven are complete — see `PROGRESS.md` for
what was actually built in each). `docs/decisions/` records the
non-obvious calls made along the way; `docs/LAUNCH_CHECKLIST.md` is the
human-run checklist for taking this to real production use.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix primitives, Lucide icons)
- **Supabase** — Postgres, Auth, Storage, Row Level Security
- **TanStack Table** for data tables, **Recharts** for reporting charts
- **React Hook Form** + **Zod** for forms/validation
- **Vitest** + **React Testing Library** for unit/component tests
- **Playwright** + **axe-core** for end-to-end and accessibility tests
- **GitHub Actions** for CI, **Vercel** for hosting

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in from your Supabase project (see below)
npm run dev
```

App runs at http://localhost:3000.

### Environment variables

See `.env.example` for the full list with comments. In short:

| Variable | Where it's used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | your project's URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + server | safe to expose; same privilege as the old "anon" key |
| `SUPABASE_SECRET_KEY` | server only | bypasses RLS; never import it into a Client Component (enforced by `import "server-only"` in `src/lib/supabase/admin.ts`) |
| `E2E_SUPABASE_TEST_EMAIL`/`PASSWORD` | e2e only | a `staff`-role fixture account; e2e specs that need it skip themselves if unset |
| `E2E_ADMIN_TEST_EMAIL`/`PASSWORD` | e2e only | an `admin`-role fixture account (`scripts/create-e2e-admin.mjs` provisions one); admin-only e2e coverage skips itself if unset |

Get the Supabase values from your project's **Connect** dialog (URL +
publishable key) and **Project Settings → API Keys** (secret key).
Supabase is retiring the older anon/service_role key names by end of
2026 — use the publishable/secret ones shown above.

Without `.env.local`, the app still runs: auth/session logic degrades
gracefully (middleware passes requests through, the account menu shows a
placeholder) rather than crashing, so the shell stays browsable while you
set up a project. `npm run build` also succeeds with no environment
variables set at all — verified, not assumed (Phase 7).

## Development commands

```bash
npm run dev           # start the dev server
npm run build         # production build
npm run start         # run the production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run format        # Prettier --write
npm run format:check  # Prettier --check
npm run test          # Vitest (unit/component)
npm run test:watch    # Vitest watch mode
npm run test:e2e      # Playwright
```

Run `npm run typecheck && npm run lint && npm run format:check && npm run test && npm run build`
before pushing — CI runs the identical commands (see below), so a clean
local run means a clean CI run.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull
request:

- **`verify`** job: `typecheck`, `lint`, `format:check`, `test` (Vitest),
  `build` — the exact commands above, nothing CI-only that could drift
  from what you run locally.
- **`e2e`** job: Playwright, against the **live** Supabase project this
  app is configured for. Only runs on a push to `main` (not every PR),
  since it exercises real data over the network rather than a local/
  ephemeral database — a deliberate choice, not an oversight. It builds
  a production bundle first and runs `next start` against it (not `next
  dev`), both because that's what's actually deployed and because dev
  mode's per-route first-hit compile was a real source of flaky
  timeouts in a cold CI container.

**Required repository secrets** for the `e2e` job to run (Settings →
Secrets and variables → Actions): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
`E2E_SUPABASE_TEST_EMAIL`/`PASSWORD`, `E2E_ADMIN_TEST_EMAIL`/`PASSWORD`.
Until these are set, the `e2e` job will fail on push to `main` — the
`verify` job (typecheck/lint/format/unit tests/build) does not need any
secrets and will pass regardless.

## Deployment

Target is Vercel, project `forklift`, linked to
`github.com/BoombamPok/Forklift` (confirmed via `vercel git connect`).
**Status as of Phase 7, and this needs a person to actually check**:
every deployment through the Phase 6 commit (`27fb8a7`) has a
`githubCommitSha` in its metadata and landed within minutes of the
matching push, which is real evidence auto-deploy was working — but
Phase 7's own push did **not** produce a new deployment after several
minutes of waiting, which breaks that pattern. `gitProviderOptions.
createDeployments` still reads `enabled` on the project, so the
*setting* is on; something else (a GitHub App permission change, a
dropped webhook — not diagnosable from here without GitHub dashboard/
API access this environment doesn't have) may have quietly stopped
delivery. **Check Vercel's Project Settings → Git page directly**, and
if it's genuinely not connected, reconnect it there or run
`vercel --prod` for a one-off manual deploy in the meantime. This is
the same "stale deployed URL" risk this project has hit once before —
now caught again rather than assumed fixed just because it worked in
the past.

Set the same environment variables from `.env.example` in the Vercel
project settings (Production/Preview/Development as appropriate — the
publishable key and URL are needed at build time since Next.js inlines
`NEXT_PUBLIC_*` values into the client bundle). Apply migrations to the
target Supabase project before deploying a build that depends on new
schema.

## Database workflow

Schema lives as ordered SQL files in `supabase/migrations/`, applied in
filename order. Each migration is a self-contained, reviewable change —
see the file names for what each one does (roles/profiles, catalogue
schema, inventory schema, the stock-movement trigger, RLS policies, the
audit-log function, storage, and later hardening/feature migrations
through Phase 4).

**Applying migrations** — with the [Supabase CLI](https://supabase.com/docs/guides/cli)
linked to your project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste the files (in order) into the SQL Editor in the Supabase
dashboard if you don't have the CLI set up.

**Real catalogue data** — `supabase/reference-data/` holds real (not
fabricated) parts-catalogue source files as they're provided.
`scripts/import-master-catalogue.mjs` imports
`godrej-voltas-master-catalogue.csv` (284 real Godrej/Voltas parts, 9
forklift models, 979 compatibility links) using the secret key — run it
with `node scripts/import-master-catalogue.mjs` after migrations are
applied. It's idempotent and safe to re-run. See `docs/decisions/0008`
for the schema decisions this data required.

**Seed data** — `supabase/seed.sql` has clearly-fictional development
data (prefixed `Sample `/`Demo `) demonstrating all three valid
catalogue/inventory states described in `CLAUDE.md` §3. It is **not**
real business data. Apply it the same way as a migration, after the
schema exists.

**E2E fixture accounts** — `scripts/create-e2e-admin.mjs` provisions the
synthetic `admin`-role account e2e tests need (mirrors how the `staff`
fixture, `e2e-tests@forkstock.dev`, was created in Phase 1). Both are
real Supabase Auth users but not real people — never use a real
teammate's credentials for this.

**Regenerating types** — `src/types/database.ts` is hand-authored to
match the migrations. Once you have the Supabase CLI + Docker (for
`--local`) or a linked project (`--linked`), regenerate it for real:

```bash
supabase gen types --linked > src/types/database.ts
```

### Key architectural decisions in the schema

- **Catalogue and inventory are separate zones** with a nullable FK
  between them (`inventory_parts.catalogue_part_id`) — catalogue-only,
  catalogue+inventory, and inventory-only parts are all valid.
- **`inventory_parts.quantity` is never written directly.** A trigger
  (`apply_stock_movement`) maintains it from `stock_movements` inserts,
  and a second trigger (`guard_inventory_quantity`) rejects any other
  attempt to change it. `stock_movements` itself has no UPDATE/DELETE
  RLS policy — it's an append-only ledger.
- **One `current_user_role()` function backs every RLS policy** — avoids
  duplicating `auth.uid()` logic per table and avoids recursive RLS on
  `profiles` (it's `SECURITY DEFINER`).
- **`audit_logs` is written only through `log_audit_event()`** (also
  `SECURITY DEFINER`) — no direct INSERT policy needed on the table.
- **No table has a hard-delete RLS policy** — every "delete" is
  `UPDATE ... SET deleted_at`, and the warehouse hierarchy's delete
  cascades atomically via `SECURITY INVOKER` Postgres functions that
  block entirely (no partial delete) if any live part is still assigned
  anywhere in the subtree.

See `docs/decisions/` for the fuller rationale on these and every other
non-obvious decision made across all seven phases, including Phase 7's
security/accessibility hardening (`docs/decisions/0013`).

## Testing

- `npm run test` — unit/component tests (Vitest + RTL), 240+ tests
  across every feature module and shared component.
- `npm run test:e2e` — Playwright, against the live Supabase project.
  Most specs skip themselves if the relevant fixture credentials aren't
  set in `.env.local`:
  - `e2e/smoke.spec.ts` — the login page renders, no credentials needed.
  - `e2e/auth.spec.ts`, `e2e/inventory.spec.ts`, `e2e/warehouse.spec.ts`,
    `e2e/catalogue.spec.ts`, `e2e/dashboard.spec.ts`,
    `e2e/reports.spec.ts`, `e2e/search.spec.ts` — the `staff` fixture,
    covering every major workflow's read/write permission boundary.
  - `e2e/admin.spec.ts` — the `admin` fixture, covering admin/manager-
    only actions (create/edit/soft-delete a warehouse, create/soft-
    delete a catalogue brand) end-to-end, closing a gap every earlier
    phase's own notes flagged as unverified.
  - `e2e/accessibility.spec.ts` — an automated axe-core WCAG 2.1 AA scan
    across every major page, plus a manual keyboard/focus-trap check on
    a real dialog.

## Accessibility

Target is WCAG 2.1 AA (`CLAUDE.md` §17). `e2e/accessibility.spec.ts`
runs an automated axe-core scan against six major pages on every CI run
against `main`, and a manual focus-trap/focus-restore check. Phase 7's
review found and fixed four real issues — color contrast on the primary
orange accent and the success badge, missing accessible names on bare
filter `Select` triggers, an invalid `aria-controls` reference on a
filter-only `Tabs` control, and a Radix focus-restore bug affecting
every `Dialog`/`AlertDialog`/`Sheet` in the app — see
`docs/decisions/0013` for the full detail on each.

## Architecture overview

```
src/
  app/
    (auth)/login/           # public route
    (app)/                  # protected routes, wrapped in AppShell
      dashboard/            # KPIs, stock-movement chart, low-stock table
      inventory/            # list, detail, create/edit, stock movements, images
      catalogue/            # brands, models, parts, compatibility
      warehouse/            # warehouses/racks/shelves/boxes hierarchy
      reports/              # 8 read-only BI reports
      admin/                # role-gated; user/role management is DB-side only (no UI) — see docs/LAUNCH_CHECKLIST.md
  components/
    ui/                     # shadcn primitives
    layout/                 # Sidebar, Header, AppShell, AccountMenu, GlobalSearch
    shared/                 # EmptyState, ErrorState, DataTable, KpiCard, etc.
  features/
    auth/ inventory/ catalogue/ warehouse/ reports/ search/ dashboard/
                             # schema (Zod) + queries + Server Actions, per feature
  lib/
    supabase/               # browser/server/admin client factories
    auth/                   # getCurrentUser, requireUser, requireRole
    permissions/            # role -> permission capability model
    errors.ts               # safe error classification
    nav.ts                  # single source of truth for sidebar nav
supabase/
  migrations/                # ordered SQL, one concern per file
  seed.sql                     # dev-only fixture data
e2e/                          # Playwright specs, one per feature area
docs/
  decisions/                  # ADRs — the non-obvious "why" behind the schema/code
  LAUNCH_CHECKLIST.md          # human-run pre-launch checklist (Phase 7)
```

- **Server Components read data directly** via `lib/supabase/server.ts` —
  no separate REST/API layer.
- **Mutations go through Server Actions** (`features/*/actions.ts`),
  always returning `{ success: true, data } | { success: false, error }`
  (see `lib/errors.ts`'s `ActionResult<T>`), and always call
  `requireRole()` before touching data.
- **RLS is the real authorization boundary.** `lib/permissions` mirrors
  the same capability model in TypeScript for UI-level gating only —
  never the only check. Every table's RLS policy was re-audited in
  Phase 7 against this model with no gaps found (`docs/decisions/0013`
  covers what *was* found and fixed elsewhere in that same review).
- **`src/proxy.ts`** (Next.js 16 renamed the old `middleware.ts`
  convention) refreshes the Supabase session and redirects unauthenticated
  visitors away from protected routes.

## Roles

Four roles (`admin`, `manager`, `staff`, `read_only`), enforced both in
RLS and in `src/lib/permissions` (UI-level convenience, not the real
boundary). There is no in-app UI for managing a user's role — an
admin changes `profiles.role` directly via the Supabase dashboard or SQL.
This is a deliberate, documented gap for V1 (`docs/LAUNCH_CHECKLIST.md`),
not an oversight — building that UI would be new-feature scope Phase 7
explicitly excludes.
