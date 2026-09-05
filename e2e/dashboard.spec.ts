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
