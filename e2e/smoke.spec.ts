import { test, expect } from "@playwright/test";

test("login page renders without error", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "ForkStock" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});
