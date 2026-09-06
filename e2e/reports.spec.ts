import { test, expect } from "@playwright/test";

const email = process.env.E2E_SUPABASE_TEST_EMAIL;
const password = process.env.E2E_SUPABASE_TEST_PASSWORD;

test.skip(
  !email || !password,
  "E2E_SUPABASE_TEST_EMAIL/PASSWORD not set - skipping live-auth tests (see .env.local).",
);

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

function expectNoErrorState(page: import("@playwright/test").Page) {
  return expect(
    page.getByRole("alert").filter({ hasText: /wrong|problem/i }),
  ).toHaveCount(0);
}

test("reports overview links to every report", async ({ page }) => {
  await page.goto("/reports");
  await expect(
    page.getByRole("heading", { name: "Reports", level: 2 }),
  ).toBeVisible();

  for (const title of [
    "Inventory valuation",
    "Stock movement",
    "Low stock & out of stock",
    "Fast & slow movers",
    "Stock aging",
    "Warehouse occupancy",
    "Catalogue coverage",
  ]) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }
});

// staff has `reports.view` but not `canViewInventoryValue` (same
// restriction the dashboard KPI already enforces, phase6.md §10) - this
// confirms the report correctly denies cost data by that route too,
// rather than skipping the report untested.
test("valuation report denies cost data to staff, same as the dashboard KPI", async ({
  page,
}) => {
  await page.goto("/reports/valuation");
  await expect(page.getByText("You don't have access to this")).toBeVisible();
});

test("stock movement report renders the full type breakdown against real data", async ({
  page,
}) => {
  await page.goto("/reports/movements");
  await expect(
    page.getByRole("heading", { name: "Stock movement" }),
  ).toBeVisible();
  await expectNoErrorState(page);
});

test("low-stock report renders the full, uncapped list against real data", async ({
  page,
}) => {
  await page.goto("/reports/low-stock");
  await expect(
    page.getByRole("heading", { name: "Low stock & out of stock" }),
  ).toBeVisible();
  await expectNoErrorState(page);
});

test("movers report renders fast and slow sections against real data", async ({
  page,
}) => {
  await page.goto("/reports/movers");
  await expect(page.getByText(/Fast movers/)).toBeVisible();
  await expect(page.getByText("Slow movers", { exact: true })).toBeVisible();
  await expectNoErrorState(page);
});

test("stock aging report renders against real data", async ({ page }) => {
  await page.goto("/reports/aging");
  await expect(
    page.getByRole("heading", { name: "Stock aging" }),
  ).toBeVisible();
  await expectNoErrorState(page);
});

test("warehouse occupancy report renders the real hierarchy", async ({
  page,
}) => {
  await page.goto("/reports/occupancy");
  await expect(
    page.getByRole("heading", { name: "Warehouse occupancy" }),
  ).toBeVisible();
  await expectNoErrorState(page);
});

test("catalogue coverage report renders real linkage and verification counts", async ({
  page,
}) => {
  await page.goto("/reports/catalogue-coverage");
  await expect(
    page.getByRole("heading", { name: "Catalogue coverage" }),
  ).toBeVisible();
  await expect(
    page.getByText("Catalogue parts", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Linked to inventory", { exact: true }),
  ).toBeVisible();
  await expectNoErrorState(page);
});
