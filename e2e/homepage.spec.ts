import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("renders hero and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator('a[href="/intake"]')).toBeVisible();
  });

  test("navigates to services page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/services"]');
    await expect(page).toHaveURL(/\/services/);
  });
});
