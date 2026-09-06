import { test, expect } from "@playwright/test";

const email = process.env.E2E_ADMIN_TEST_EMAIL;
const password = process.env.E2E_ADMIN_TEST_PASSWORD;

test.skip(
  !email || !password,
  "E2E_ADMIN_TEST_EMAIL/PASSWORD not set - skipping admin-role tests (see .env.example, scripts/create-e2e-admin.mjs).",
);

/**
 * Phase 7 (§6/§8/§12): every prior phase's e2e coverage only ever logged
 * in as the `staff` fixture, so admin/manager-gated actions (warehouse.
 * manage, catalogue.manage) were verified by RLS + unit/component tests
 * but never actually exercised end-to-end in a real browser. This closes
 * that gap using a real, dedicated `admin`-role fixture
 * (scripts/create-e2e-admin.mjs) against the same live Supabase project
 * every other e2e spec runs against.
 *
 * Uses a synthetic, clearly-named warehouse the test itself creates and
 * soft-deletes (empty, so the cascade-delete RPC succeeds immediately) -
 * never touches the real "Demo Warehouse" fixture or any real business
 * data, mirroring inventory.spec.ts's own "E2E-TEST-" prefix precedent.
 */
test("admin can create, edit, and soft-delete a warehouse end-to-end", async ({
  page,
}) => {
  const warehouseName = `E2E Admin Test Warehouse ${Date.now()}`;
  const renamedTo = `${warehouseName} (edited)`;

  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/warehouse");
  const addButton = page.getByRole("button", { name: "Add warehouse" });
  await expect(addButton).toBeVisible();

  // Create.
  await addButton.click();
  await page.getByLabel("Name").fill(warehouseName);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page).toHaveURL(/\/warehouse\/[^/]+$/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: warehouseName }),
  ).toBeVisible();

  // Edit - back on the list, since the detail header has no inline rename.
  await page.goto("/warehouse");
  const row = page.getByRole("row", { name: new RegExp(warehouseName) });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Edit warehouse" }).click();
  const nameInput = page.getByLabel("Name");
  await nameInput.fill(renamedTo);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("row", {
      name: new RegExp(renamedTo.replace(/[()]/g, "\\$&")),
    }),
  ).toBeVisible();

  // Delete - empty warehouse, so the cascade RPC succeeds immediately
  // rather than reporting parts blocking removal.
  const renamedRow = page.getByRole("row", {
    name: new RegExp(renamedTo.replace(/[()]/g, "\\$&")),
  });
  await renamedRow.getByRole("button", { name: "Delete warehouse" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Warehouse deleted")).toBeVisible();
  await expect(
    page.getByRole("row", {
      name: new RegExp(renamedTo.replace(/[()]/g, "\\$&")),
    }),
  ).not.toBeAttached();
});

/**
 * Same admin fixture, catalogue side (phase7.md §8's "edit a catalogue
 * brand" example) - create + soft-delete a synthetic brand, never
 * touching the real Godrej/Voltas brands imported in Phase 5.
 */
test("admin can create and soft-delete a catalogue brand end-to-end", async ({
  page,
}) => {
  const brandName = `E2E Admin Test Brand ${Date.now()}`;

  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/catalogue/brands");
  const addButton = page.getByRole("button", { name: "Add brand" });
  await expect(addButton).toBeVisible();

  await addButton.click();
  await page.getByLabel("Name").fill(brandName);
  await page.getByRole("button", { name: "Add" }).click();
  const row = page.getByRole("row", { name: new RegExp(brandName) });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: /delete/i }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(row).not.toBeAttached();
});

test("admin can export catalogue parts as CSV", async ({ page, request }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const cookies = await page.context().cookies();
  const response = await request.get("/admin/catalogue-export", {
    headers: {
      cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; "),
    },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/csv");
  const body = await response.text();
  expect(body.split("\r\n")[0]).toBe(
    "part_number,name,brand,category,sub_category,assembly_group,is_fastener,capacity_range_kg,oem_reference,description,verification_status",
  );
});

/**
 * Import happy path using a synthetic, clearly-named part (same "E2E
 * Admin Test" prefix convention as the warehouse/brand tests above) -
 * verifies the report shows one real insert, then cleans the part up via
 * the catalogue UI's own soft-delete rather than leaving test data behind.
 */
test("admin can import a catalogue part from CSV", async ({ page }) => {
  const partNumber = `E2E-ADMIN-IMPORT-${Date.now()}`;
  const partName = `E2E Admin Test Import Part ${Date.now()}`;
  const csv =
    "part_number,name,brand,category,sub_category,assembly_group,is_fastener,capacity_range_kg,oem_reference,description,verification_status\n" +
    `${partNumber},${partName},,,,,0,,,,unverified\n`;

  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/admin/import-export");
  await page.getByRole("button", { name: "Choose file" }).click();
  const fileChooserInput = page.locator('input[type="file"]');
  await fileChooserInput.setInputFiles({
    name: "import.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv, "utf-8"),
  });
  await expect(page.getByText(/1 imported/)).toBeVisible({ timeout: 20_000 });

  await page.goto("/catalogue/parts");
  await page.getByRole("searchbox").fill(partNumber);
  const row = page.getByRole("row", { name: new RegExp(partName) });
  await expect(row).toBeVisible();
  await row.getByRole("link", { name: partName }).click();
  await page
    .getByRole("button", { name: /delete/i })
    .first()
    .click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
});

const staffEmail = process.env.E2E_SUPABASE_TEST_EMAIL;
const staffPassword = process.env.E2E_SUPABASE_TEST_PASSWORD;

test("non-admin is redirected away from the admin section", async ({
  page,
}) => {
  test.skip(
    !staffEmail || !staffPassword,
    "E2E_SUPABASE_TEST_EMAIL/PASSWORD not set - skipping.",
  );

  await page.goto("/login");
  await page.getByLabel("Email").fill(staffEmail!);
  await page.getByLabel("Password").fill(staffPassword!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/admin/import-export");
  await expect(page).toHaveURL(/\/dashboard$/);
});
