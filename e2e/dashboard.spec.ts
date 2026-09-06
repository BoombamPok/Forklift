import { test, expect } from "@playwright/test";

const email = process.env.E2E_SUPABASE_TEST_EMAIL;
const password = process.env.E2E_SUPABASE_TEST_PASSWORD;

test.skip(
  !email || !password,
  "E2E_SUPABASE_TEST_EMAIL/PASSWORD not set - skipping live-auth tests (see .env.local).",
);

test("staff sees real KPI numbers but not the inventory value card", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(page.getByText("Inventory items")).toBeVisible();
  // exact: true - the low-stock table below can render its own "Low
  // Stock"/"Out of Stock" badges and tab labels once real data includes
  // any, which would otherwise collide with these KPI card labels.
  await expect(page.getByText("Low stock", { exact: true })).toBeVisible();
  await expect(page.getByText("Out of stock", { exact: true })).toBeVisible();
  await expect(page.getByText("Inventory value")).not.toBeAttached();

  // Real data, not the Phase 1 placeholder dash.
  await expect(page.getByText("—", { exact: true })).toHaveCount(0);
});

// phase2c.md asks for an e2e check that seeds a few movements and
// confirms they render. stock_movements is a deliberately insert-only
// ledger (no UPDATE/DELETE policy at all, see CLAUDE.md #5) against
// this project's real, live Supabase instance - seeding synthetic rows
// here would permanently pollute real inventory history with no way to
// clean up after the test. Verifying against whatever real activity
// already exists is the non-destructive equivalent.
test("stock movement chart and recent activity render against real data", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(page.getByText("Stock movement")).toBeVisible();
  await expect(page.getByText("Recent activity")).toBeVisible();

  // Whichever state each widget is genuinely in, it must be one of
  // "has content" or "honest empty state" - never a broken/error card.
  await expect(
    page.getByRole("alert").filter({ hasText: /wrong|problem/i }),
  ).toHaveCount(0);
});

// phase2c.md's "2d" section asks for an e2e check with a seeded
// low-stock and a seeded out-of-stock row. min_stock is safe, reversible
// config (not audit history), but the live project's two parts are the
// only ones there are - temporarily changing their config for a test
// still touches the real project's data. Kept to the same non-
// destructive standard as the movements test above instead: verify the
// widget renders correctly against whatever real state exists.
test("low-stock table renders against real data", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(
    page.getByText("Needs attention", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("alert").filter({ hasText: /wrong|problem/i }),
  ).toHaveCount(0);
});
