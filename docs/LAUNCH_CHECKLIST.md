# ForkStock — Launch Checklist

This is the human-run checklist for taking ForkStock from "feature-
complete and hardened" (end of Phase 7) to real production use by real
warehouse staff. Work through it in order; each item says how it was
verified during Phase 7 and what's left for a person to actually do.

---

## 1. CI is green

- [x] `.github/workflows/ci.yml` exists and runs `typecheck`, `lint`,
      `format:check`, `test`, and `build` on every push/PR (the `verify`
      job) — these are the exact `package.json` scripts, nothing CI-only.
- [x] A second `e2e` job runs the full Playwright suite against the live
      Supabase project, but **only on push to `main`**, against a
      production build (`next build && next start`), not `next dev`.
- [ ] **Action needed:** add these repository secrets (Settings →
      Secrets and variables → Actions) so the `e2e` job can actually run:
      `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
      `SUPABASE_SECRET_KEY`, `E2E_SUPABASE_TEST_EMAIL`/`PASSWORD`,
      `E2E_ADMIN_TEST_EMAIL`/`PASSWORD` (values are already in your local
      `.env.local`). Until this is done, the `verify` job will still pass
      on every push, but the `e2e` job will fail on pushes to `main`.
- [ ] After adding secrets, push to `main` (or re-run the workflow) and
      confirm both jobs go green in the Actions tab.

## 2. Deployment is automatic, not manual

- [x] Confirmed live via the Vercel API: project `forklift`'s
      `gitProviderOptions.createDeployments` is `enabled`, and the most
      recent production deployment's timestamp lines up with the last
      git push to `main` (~3.5 minutes after, well within a normal build
      time) with no manual `vercel` command run in between. This was a
      real, previously-observed gap (a stale deployed URL lagging behind
      git history) — now verified closed, not assumed fixed. Confirm
      this again after Phase 7's own commits land, the same way: compare
      the newest deployment's timestamp against `git log -1`.
- [ ] **Action needed:** confirm Vercel's project environment variables
      (Production scope) match `.env.example` — the CI verification
      above doesn't check the *deployed* environment's actual secrets,
      only that a build succeeds with none set at all (the app degrades
      gracefully without them, per `README.md`).
- [ ] Do one final manual pass through every major workflow (§8 below)
      on the **actual deployed URL**, not just localhost — a stale
      deployment was a real, previously-observed risk in this project.

## 3. Security review

- [x] Every Server Action across every feature (`inventory`, `warehouse`,
      `catalogue`) calls `requireRole()` before touching data — checked
      exhaustively, not spot-checked (verified the exported-function
      count against the `requireRole` call count in each `actions.ts`).
- [x] No raw Postgrest/SQL error, stack trace, or internal identifier
      reaches the browser — every mutation path returns
      `toSafeErrorMessage()`'s sanitized text, and every client-side
      `result.error.message` render was confirmed to originate from that
      sanitized shape, not a raw error object.
- [x] `SUPABASE_SECRET_KEY` is referenced in exactly one file
      (`src/lib/supabase/admin.ts`), which is `import "server-only"`-
      guarded — confirmed via a full-codebase grep, not assumed.
- [x] `searchGlobal` and other unauthenticated-looking Server Actions
      rely on RLS (not an explicit `requireRole`) by design — verified
      this is intentional and safe: an unauthenticated caller hitting
      the action directly gets `anon`-role RLS, which every relevant
      policy already restricts to `authenticated`.

## 4. RLS re-audit

- [x] All 18 tables (`profiles`, the 8 catalogue tables incl.
      `catalogue_part_sources`, the 4 warehouse-hierarchy tables,
      `inventory_parts`, `stock_movements`, `part_images`, `audit_logs`)
      have RLS enabled with policies matching their intended
      `view`/`manage` boundary — re-verified table-by-table against
      every migration, not just the two prior hardening migrations.
      **No gap was found; no new migration was needed.** This is a real,
      checked outcome of the review, not a skipped step.
- [x] Confirmed no table has a `DELETE` policy (soft-delete only, per
      `docs/decisions/0007`) and every attribution column
      (`created_by`/`uploaded_by`) is still server-set via trigger, not
      client-supplied.

## 5. Accessibility review

- [x] Automated WCAG 2.1 AA scan (`e2e/accessibility.spec.ts`, axe-core)
      across login, dashboard, inventory, warehouse, catalogue, and
      reports — **passes clean**, after fixing four real issues found
      during the review (contrast on the primary/success colors, missing
      `aria-label`s on bare filter `Select`s, an invalid `aria-controls`
      on a filter-only `Tabs`, and a Radix dialog focus-restore bug).
      Full detail: `docs/decisions/0013`.
- [x] Manual keyboard/focus-trap check on a real dialog — passes:
      Tab wraps inside the dialog, Escape closes it, and focus correctly
      returns to whatever triggered it.
- [ ] **Not automatable, do this by hand once before launch:** tab
      through the create/edit forms for a part, a warehouse, and a
      catalogue brand using only the keyboard, and confirm every screen
      reader landmark/heading structure reads sensibly with a real
      screen reader (VoiceOver/NVDA) — axe-core catches structural
      violations, not subjective navigation quality.

## 6. Performance review

- [x] No N+1 query pattern found — audited every `for`/`.map()` loop in
      every `features/*/queries.ts` and `features/*/actions.ts` file;
      all of them post-process already-batched `.in()`/`Promise.all()`
      results, none issue a query per iteration.
- [x] Pagination is real (server-side `.range()`) for the inventory and
      catalogue-parts lists' plain-filter path. The free-text search path
      on those same lists fetches all filtered rows and paginates in JS
      — a pre-existing, documented tradeoff from Phases 3/5 (avoids a
      `.or()` filter-string injection surface at a scale, ~300 parts,
      where it doesn't matter yet).
- [x] Reports (`aging`, `valuation`, `movements`, `occupancy`,
      `catalogue-coverage`) fetch their full underlying table(s)
      unbounded — measured against the real, current dataset (a few
      hundred parts, a few thousand movements) at well under a second
      per report. **Noted, not fixed:** at `CLAUDE.md`'s stated
      1,500–2,000-part ceiling with several years of movement history,
      `aging`/`valuation` in particular should be revisited (a `.range()`
      or a materialized rollup) — no speculative optimization was built
      for a scale that doesn't exist yet, per `CLAUDE.md` §18/§45.
- [ ] **Action for later, not before this launch:** if/when real part
      count approaches ~1,000, re-measure `/reports/aging` and
      `/reports/valuation` load time and revisit the above if it's
      become a real, felt problem.

## 7. Test coverage

- [x] `npm run test` — 240 unit/component tests, all green.
- [x] `npm run test:e2e` — 28 Playwright specs, all green (run against a
      production build; see §1).
- [x] Admin-role e2e coverage added (`e2e/admin.spec.ts`) — creates,
      edits, and soft-deletes a synthetic warehouse and a synthetic
      catalogue brand as the `admin` fixture, closing the gap every
      earlier phase's own notes flagged (Phases 3, 4, 5 all shipped
      without any admin/manager-role browser test).

## 8. Manual full-workflow pass (do this on the deployed URL)

Walk through each of these as a real user before calling this launched:

- [ ] Log in, see the dashboard with real KPIs.
- [ ] Search for a real part number, land on its detail page.
- [ ] Create a part, record a Stock In and a Stock Out movement.
- [ ] Browse the warehouse hierarchy down to a box, see the parts in it.
- [ ] Browse the catalogue, view a model's compatible parts.
- [ ] View every report under `/reports`.
- [ ] As an admin/manager account, create/edit/delete a warehouse and a
      catalogue brand (the actions `e2e/admin.spec.ts` automates).
- [ ] Confirm loading/empty/error states look right on a slow connection
      (throttle in devtools) and on a page with genuinely no data yet.

## 9. Documentation

- [x] `README.md` reflects the full application (all six product phases,
      not just Phase 1's original shape), CI, and the confirmed
      deployment story.
- [x] `.env.example` is current, including the admin e2e fixture.
- [x] This checklist exists and is current.

## 10. Known, accepted gaps (not blockers — documented on purpose)

- **No in-app user/role management UI.** An admin changes a user's role
  via the Supabase dashboard/SQL directly. Building this UI would be new
  product-feature scope, which Phase 7 explicitly excludes
  (`CLAUDE.md`/`phase7.md` §3's "no new product features"). If this
  becomes a real operational pain point, it's a candidate for scoping as
  its own small phase later — not a silent omission.
- **No QR/barcode, Sales/Purchases/Suppliers/Customers/Invoicing.** Never
  in scope for V1, at any phase, per `CLAUDE.md` §14 and §19.
- **Reports fetch unbounded at the current (small) data scale** — see §6
  above. Acceptable now, flagged for later.
