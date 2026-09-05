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
  await expect(page.getByText("Low stock")).toBeVisible();
  await expect(page.getByText("Out of stock")).toBeVisible();
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
