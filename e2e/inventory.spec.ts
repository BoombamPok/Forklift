import { test, expect } from "@playwright/test";

const email = process.env.E2E_SUPABASE_TEST_EMAIL;
const password = process.env.E2E_SUPABASE_TEST_PASSWORD;

test.skip(
  !email || !password,
  "E2E_SUPABASE_TEST_EMAIL/PASSWORD not set - skipping live-auth tests (see .env.local).",
);

// Exercises the movement-ledger model (phase3.md) against the live
// Supabase project. Uses a part number prefixed E2E-TEST- so it's
// unmistakably synthetic in the real inventory list, matching the seed
// data's own "Sample "/"Demo " naming convention. stock_movements is a
// deliberately insert-only ledger (ADR 0002, CLAUDE.md #5) with no
// UPDATE/DELETE policy, so this leaves two permanent rows behind - the
// same tradeoff already accepted by the dashboard e2e tests.
//
// The e2e fixture account is role `staff` (see PROGRESS.md), which per
// lib/permissions has inventory.create/edit/adjust/transfer but not
// inventory.delete - so this test can't soft-delete the part it creates
// the way an admin could. It leaves the part active instead, and asserts
// that the Delete action is correctly absent for this role rather than
// faking a cleanup step this account isn't authorized to perform.
test("create a part, record Stock In and Stock Out, and confirm the staff permission boundary", async ({
  page,
}) => {
  const partNumber = `E2E-TEST-${Date.now()}`;

  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/inventory/new");
  await page.getByLabel("Part number").fill(partNumber);
  await page.getByLabel("Name").fill("E2E Test Part");
  await page.getByRole("button", { name: "Create part" }).click();

  // Generous timeout: /inventory/[id] is a dynamic route dev mode hasn't
  // compiled yet the first time a test hits it, which can take well
  // over the default 5s assertion timeout.
  await expect(page).toHaveURL(/\/inventory\/[^/]+\?openMovement=in$/, {
    timeout: 20_000,
  });

  // The create redirect opens the Stock In dialog automatically - every
  // new part starts at quantity 0 (trigger-enforced). Radix marks the
  // rest of the page inert while a dialog is open, so the page heading
  // isn't queryable via role until the dialog closes - assert against
  // the dialog's own content instead.
  await expect(
    page.getByRole("dialog", { name: "Record a stock movement" }),
  ).toBeVisible();
  await expect(page.getByText("Currently 0 in stock.")).toBeVisible();
  const movementDialog = page.getByRole("dialog", {
    name: "Record a stock movement",
  });
  await movementDialog.locator('input[type="number"]').first().fill("10");
  await page.getByRole("button", { name: "Review" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Record movement" })
    .click();

  await expect(page.getByText("Stock In recorded")).toBeVisible();
  await expect(page.locator("p.text-3xl")).toHaveText("10");

  await page.getByRole("button", { name: "Record movement" }).click();
  await movementDialog.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "Stock Out" }).click();
  await movementDialog.locator('input[type="number"]').first().fill("4");
  await page.getByRole("button", { name: "Review" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Record movement" })
    .click();

  await expect(page.getByText("Stock Out recorded")).toBeVisible();
  await expect(page.locator("p.text-3xl")).toHaveText("6");

  await expect(page.getByText(`Received 10 × E2E Test Part`)).toBeVisible();
  await expect(page.getByText(`Shipped 4 × E2E Test Part`)).toBeVisible();

  await expect(page.getByRole("button", { name: "Delete" })).not.toBeAttached();
});
