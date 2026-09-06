import { test, expect } from "@playwright/test";

const email = process.env.E2E_SUPABASE_TEST_EMAIL;
const password = process.env.E2E_SUPABASE_TEST_PASSWORD;

test.skip(
  !email || !password,
  "E2E_SUPABASE_TEST_EMAIL/PASSWORD not set - skipping live-auth tests (see .env.local).",
);

// Real Godrej data from the already-imported master catalogue (ADR
// 0008/docs/decisions/0008-real-catalogue-import.md) - "confidence: A"
// rows map to verification_status "verified", and this row's
// capacity_range_kg is stored verbatim as "1500-3000" (per-row, not a
// derived per-model figure).
const REAL_PART_NUMBER = "02326191";
const REAL_MODEL_NAME = "GX 150 D";

/**
 * Exercises the catalogue browsing/search/compatibility UI (phase5.md)
 * against the live Supabase project's real, already-imported Godrej/
 * Voltas data - same "use the real data, don't fabricate a fixture"
 * precedent as warehouse.spec.ts. The e2e fixture account is role
 * `staff` (catalogue.view but not catalogue.manage, and inventory.create
 * per lib/permissions), so this also confirms management controls are
 * absent while Promote to inventory is present.
 *
 * The "Promote to inventory" click stops short of submitting the create
 * form. Actually creating an inventory_parts row linked to this real
 * catalogue part would make a genuine Godrej spare part falsely appear
 * "in stock" in the live project the user actually runs their business
 * on - unlike inventory.spec.ts's synthetic "E2E-TEST-" part (which adds
 * an isolated, unmistakably-fake row), promoting a *real* catalogue
 * part would misrepresent real business data. This test instead
 * confirms the handoff itself: clicking through lands on `/inventory/
 * new` with the catalogue link and known fields genuinely pre-filled
 * from the real catalogue record, which is what phase5.md's "reuses the
 * actual create flow" requirement is actually about - see PROGRESS.md.
 */
test("browses Godrej to a model's compatible parts, searches for a real part, and confirms the promote-to-inventory handoff", async ({
  page,
}) => {
  // This test is the first to hit five brand-new dynamic routes
  // (/catalogue, /catalogue/brands, /catalogue/models, /catalogue/
  // models/[id], /catalogue/parts, /catalogue/parts/[id]) in one run -
  // each needs its own dev-mode first compile, which individually can
  // approach the per-navigation 20s allowance elsewhere in this file;
  // the default 30s *test* timeout doesn't leave room for several of
  // those back to back.
  test.setTimeout(120_000);

  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Generous on a cold dev server - the very first request through
  // Next's auth middleware/action can take longer than the default 5s.
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

  await page.goto("/catalogue/brands");
  await expect(
    page.getByRole("button", { name: "Add brand" }),
  ).not.toBeAttached();
  await page.getByRole("link", { name: "Godrej", exact: true }).click();

  await expect(page).toHaveURL(/\/catalogue\/models\?brandId=/, {
    timeout: 20_000,
  });
  await expect(
    page.getByRole("button", { name: "Add model" }),
  ).not.toBeAttached();

  await page.getByRole("link", { name: REAL_MODEL_NAME }).click();
  await expect(page).toHaveURL(/\/catalogue\/models\/[^/]+$/, {
    timeout: 20_000,
  });
  await expect(
    page.getByRole("heading", { name: REAL_MODEL_NAME }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).not.toBeAttached();

  const compatRow = page.getByRole("row", {
    name: new RegExp(REAL_PART_NUMBER),
  });
  await expect(compatRow).toBeVisible();
  await expect(compatRow.getByText("Verified")).toBeVisible();
  await expect(compatRow.getByText("1500-3000")).toBeVisible();

  await page.goto("/catalogue/parts");
  await page.getByPlaceholder(/search part number/i).fill(REAL_PART_NUMBER);
  const partLink = page.getByRole("link", {
    name: new RegExp(REAL_PART_NUMBER),
  });
  await expect(partLink).toBeVisible({ timeout: 10_000 });
  await partLink.click();

  await expect(page).toHaveURL(/\/catalogue\/parts\/[^/]+$/, {
    timeout: 20_000,
  });
  await expect(page.getByText(REAL_PART_NUMBER)).toBeVisible();
  // "Verified" also appears once per compatible model below (this part
  // fits four Godrej models) - the header badge is the first instance.
  await expect(page.getByText("Verified").first()).toBeVisible();
  await expect(page.getByText("Brand: Godrej")).toBeVisible();
  await expect(page.getByText("1500-3000")).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit" })).not.toBeAttached();
  await expect(
    page.getByRole("button", { name: "Add compatible model" }),
  ).not.toBeAttached();

  const promoteLink = page.getByRole("link", {
    name: "Promote to inventory",
  });
  await expect(promoteLink).toBeVisible();
  await promoteLink.click();

  await expect(page).toHaveURL(/\/inventory\/new\?catalogueId=/, {
    timeout: 20_000,
  });
  await expect(page.getByLabel("Part number")).toHaveValue(REAL_PART_NUMBER);
  await expect(page.getByLabel("Name")).toHaveValue("BEARING - ROLLER");
});
