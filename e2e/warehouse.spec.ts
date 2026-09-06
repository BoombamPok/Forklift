import { test, expect } from "@playwright/test";

const email = process.env.E2E_SUPABASE_TEST_EMAIL;
const password = process.env.E2E_SUPABASE_TEST_PASSWORD;

test.skip(
  !email || !password,
  "E2E_SUPABASE_TEST_EMAIL/PASSWORD not set - skipping live-auth tests (see .env.local).",
);

/**
 * Exercises the warehouse hierarchy (phase4.md) against the live Supabase
 * project's real "Demo Warehouse / R01 / S01 / B01" chain rather than
 * creating a new one - the e2e fixture account is role `staff`, which per
 * lib/permissions has `warehouse.view` but not `warehouse.manage`, so it
 * can't create/edit/delete a warehouse/rack/shelf/box the way an admin or
 * manager could. This mirrors inventory.spec.ts's own precedent of
 * adapting to what the fixture role can actually do rather than faking a
 * step it isn't authorized to perform.
 *
 * The create/edit/soft-delete cascade behavior (phase4.md §5) is not
 * live-verified end-to-end this session for the same reason Phase 3's
 * admin-only Delete path wasn't: no admin/manager test credentials are
 * available (see PROGRESS.md). That logic is covered instead by
 * `location-delete-action.test.tsx` (both the "deleted" and "blocked by
 * these parts" outcomes) and `queries.test.ts` (the occupancy math);
 * RLS itself already restricts writes on warehouses/racks/shelves/boxes
 * to admin/manager (supabase/migrations/20260905060400_rls_policies.sql).
 */
test("browses the full hierarchy and reaches a real part's detail page, with management controls absent for staff", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/warehouse");
  await expect(
    page.getByRole("button", { name: "Add warehouse" }),
  ).not.toBeAttached();

  // Generous timeouts on the first hit to each dynamic route: dev mode
  // hasn't compiled it yet, which can take well over the default 5s
  // assertion timeout (same reasoning as inventory.spec.ts).
  await page.getByRole("link", { name: "Demo Warehouse" }).click();
  await expect(page).toHaveURL(/\/warehouse\/[^/]+$/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "Demo Warehouse" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add rack" }),
  ).not.toBeAttached();

  await page.getByRole("link", { name: "R01" }).click();
  await expect(page).toHaveURL(/\/warehouse\/racks\/[^/]+$/, {
    timeout: 20_000,
  });
  await expect(page.getByRole("heading", { name: "Rack R01" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Demo Warehouse" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add shelf" }),
  ).not.toBeAttached();

  await page.getByRole("link", { name: "S01" }).click();
  await expect(page).toHaveURL(/\/warehouse\/shelves\/[^/]+$/, {
    timeout: 20_000,
  });
  await expect(page.getByRole("heading", { name: "Shelf S01" })).toBeVisible();
  await expect(page.getByRole("link", { name: "R01" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add box" }),
  ).not.toBeAttached();

  await page.getByRole("link", { name: "B01" }).click();
  await expect(page).toHaveURL(/\/warehouse\/boxes\/[^/]+$/, {
    timeout: 20_000,
  });
  await expect(page.getByRole("heading", { name: "Box B01" })).toBeVisible();
  // Full breadcrumb chain resolves at the leaf level.
  await expect(
    page.getByRole("link", { name: "Demo Warehouse" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "R01" })).toBeVisible();
  await expect(page.getByRole("link", { name: "S01" })).toBeVisible();

  // Box-level structural controls are absent for staff, but the
  // Transfer shortcut is present - it's gated on inventory.transfer
  // (which staff has), not warehouse.manage.
  await expect(page.getByRole("button", { name: "Edit" })).not.toBeAttached();
  await expect(
    page.getByRole("button", { name: "Transfer" }).first(),
  ).toBeVisible();

  const partLink = page.getByRole("link", { name: /SAMPLE-0001/ });
  await expect(partLink).toBeVisible();
  await partLink.click();
  await expect(page).toHaveURL(/\/inventory\/[^/]+$/, { timeout: 20_000 });
});
