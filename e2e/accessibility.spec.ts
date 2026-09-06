import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const email = process.env.E2E_SUPABASE_TEST_EMAIL;
const password = process.env.E2E_SUPABASE_TEST_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_TEST_EMAIL;
const adminPassword = process.env.E2E_ADMIN_TEST_PASSWORD;

test.skip(
  !email || !password,
  "E2E_SUPABASE_TEST_EMAIL/PASSWORD not set - skipping live accessibility scan (see .env.local).",
);

/**
 * Phase 7 (§4/§9): automated WCAG 2.1 AA scanning (axe-core) across every
 * major workflow page, against the live Supabase project's real data -
 * catches labeling/contrast/landmark/aria regressions a manual pass could
 * miss, and re-runs on every CI push to main so a future phase can't
 * silently regress accessibility. This complements, not replaces, the
 * manual keyboard-nav/focus-trap check below - axe cannot verify that Tab
 * order or focus behavior is actually usable, only that markup is
 * structurally correct.
 */
async function scan(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return results.violations;
}

function describeViolations(violations: unknown[]): string {
  return JSON.stringify(violations, null, 2);
}

test.describe("WCAG 2.1 AA automated scan", () => {
  test("login page", async ({ page }) => {
    await page.goto("/login");
    const violations = await scan(page);
    expect(violations, describeViolations(violations)).toEqual([]);
  });

  test("dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    const violations = await scan(page);
    expect(violations, describeViolations(violations)).toEqual([]);
  });

  test("inventory list", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/inventory");
    await expect(
      page.getByRole("heading", { name: "Inventory" }),
    ).toBeVisible();
    const violations = await scan(page);
    expect(violations, describeViolations(violations)).toEqual([]);
  });

  test("warehouse list", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/warehouse");
    await expect(
      page.getByRole("heading", { name: "Warehouses" }),
    ).toBeVisible();
    const violations = await scan(page);
    expect(violations, describeViolations(violations)).toEqual([]);
  });

  test("catalogue parts list", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/catalogue/parts");
    const violations = await scan(page);
    expect(violations, describeViolations(violations)).toEqual([]);
  });

  test("reports overview", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/reports");
    const violations = await scan(page);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});

/**
 * Manual keyboard/focus-trap check (phase7.md §4's "dialogs/sheets trap
 * focus correctly ... verify, don't assume") - axe can't detect this, but
 * Radix's Dialog primitive (underlying components/ui/dialog.tsx) should
 * already provide it. This proves it against a real dialog rather than
 * trusting the primitive blindly.
 */
test("a dialog traps focus and Escape closes it, returning focus to the trigger", async ({
  page,
}) => {
  test.skip(
    !adminEmail || !adminPassword,
    "E2E_ADMIN_TEST_EMAIL/PASSWORD not set - the Add warehouse dialog needs warehouse.manage, which the staff fixture doesn't have.",
  );

  await page.goto("/login");
  await page.getByLabel("Email").fill(adminEmail!);
  await page.getByLabel("Password").fill(adminPassword!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/warehouse");
  const trigger = page.getByRole("button", { name: "Add warehouse" });
  await trigger.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("Name")).toBeFocused();

  // Tabbing forward from the last focusable element wraps back inside
  // the dialog rather than escaping to the page behind it.
  await page.getByRole("button", { name: "Add", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
