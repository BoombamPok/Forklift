# ForkStock

A desktop-first inventory management application for a forklift/vehicle
spare-parts business: catalogue, warehouse locations, stock, and
compatibility, built so staff can quickly answer *"do we have this part,
and where is it?"*

See `CLAUDE.md` for the full product/architecture rules this project
follows, and `phase1.md` for the current phase's detailed spec.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix primitives, Lucide icons)
- **Supabase** — Postgres, Auth, Storage, Row Level Security
- **TanStack Table** for data tables
- **React Hook Form** + **Zod** for forms/validation
- **Vitest** + **React Testing Library** for unit/component tests
- **Playwright** for end-to-end tests

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

Get these from your Supabase project's **Connect** dialog (URL +
publishable key) and **Project Settings → API Keys** (secret key).
Supabase is retiring the older anon/service_role key names by end of
2026 — use the publishable/secret ones shown above.

Without `.env.local`, the app still runs: auth/session logic degrades
gracefully (middleware passes requests through, the account menu shows a
placeholder) rather than crashing, so the shell stays browsable while you
set up a project.

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

## Database workflow

Schema lives as ordered SQL files in `supabase/migrations/`, applied
in filename order. Each migration is a self-contained, reviewable
change — see the file names for what each one does (roles/profiles,
catalogue schema, inventory schema, the stock-movement trigger, RLS
policies, the audit-log function, storage).

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

See `docs/decisions/` for the fuller rationale on these and other
Phase 1 decisions.

## Testing

- `npm run test` — unit/component tests (Vitest + RTL). See
  `src/lib/permissions/index.test.ts` and `src/lib/errors.test.ts` for
  examples.
- `npm run test:e2e` — Playwright. `e2e/smoke.spec.ts` just checks the
  login page renders; `e2e/auth.spec.ts` exercises the real
  login → dashboard → sign-out flow against a live Supabase project and
  skips itself if `E2E_SUPABASE_TEST_EMAIL`/`E2E_SUPABASE_TEST_PASSWORD`
  aren't set in `.env.local`. Use a dedicated fixture account for this,
  not a real user's credentials.

## Deployment

Target is Vercel. Set the same environment variables from `.env.example`
in the Vercel project settings (Production/Preview/Development as
appropriate). Apply migrations to the target Supabase project before
deploying a build that depends on new schema.

## Architecture overview

```
src/
  app/
    (auth)/login/           # public route
    (app)/                  # protected routes, wrapped in AppShell
  components/
    ui/                     # shadcn primitives
    layout/                 # Sidebar, Header, AppShell, AccountMenu
    shared/                 # EmptyState, ErrorState, DataTable, etc.
  features/
    auth/                   # schema, Server Actions, LoginForm
  lib/
    supabase/               # browser/server/admin client factories
    auth/                   # getCurrentUser, requireUser, requireRole
    permissions/            # role -> permission capability model
    errors.ts               # safe error classification
    nav.ts                  # single source of truth for sidebar nav
supabase/
  migrations/                # ordered SQL, one concern per file
  seed.sql                     # dev-only fixture data
```

- **Server Components read data directly** via `lib/supabase/server.ts` —
  no separate REST/API layer.
- **Mutations go through Server Actions** (`features/*/actions.ts`),
  always returning `{ success: true, data } | { success: false, error }`
  (see `lib/errors.ts`'s `ActionResult<T>`).
- **RLS is the real authorization boundary.** `lib/permissions` mirrors
  the same capability model in TypeScript for UI-level gating only —
  never the only check.
- **`src/proxy.ts`** (Next.js 16 renamed the old `middleware.ts`
  convention) refreshes the Supabase session and redirects unauthenticated
  visitors away from protected routes.
