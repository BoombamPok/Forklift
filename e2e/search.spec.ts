import { test, expect } from "@playwright/test";

const email = process.env.E2E_SUPABASE_TEST_EMAIL;
const password = process.env.E2E_SUPABASE_TEST_PASSWORD;

test.skip(
  !email || !password,
  "E2E_SUPABASE_TEST_EMAIL/PASSWORD not set - skipping live-auth tests (see .env.local).",
);

// Unlike the dashboard's movement/low-stock e2e tests, this one needs no
// non-destructive workaround: search is read-only, so it's safe to
// search for a real seeded part number and assert on the real result.
test("searching a real part number finds it, tagged as in stock", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const search = page.getByPlaceholder("Search parts, brands, models…");
  await search.click();
  await search.fill("SAMPLE-0001");

  const result = page.getByRole("option", { name: /Sample Oil Filter/ });
  await expect(result).toBeVisible();
  await expect(result.getByText("In Stock")).toBeVisible();
});

test("an empty query shows no dropdown, and a no-match query shows a distinct no-results state", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(page.getByRole("listbox")).not.toBeAttached();

  const search = page.getByPlaceholder("Search parts, brands, models…");
  await search.click();
  await search.fill("zzz-no-such-part-zzz");

  await expect(
    page.getByText("No results for “zzz-no-such-part-zzz”."),
  ).toBeVisible();
});
