import { test, expect } from "@playwright/test";

test("home page renders without error", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/./);
});
