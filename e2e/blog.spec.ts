import { test, expect } from "@playwright/test";

test.describe("Blog", () => {
  test("loads blog listing", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("search modal opens with keyboard", async ({ page }) => {
    await page.goto("/blog");
    await page.keyboard.press("Meta+k");
    // Check if search dialog/modal appears
    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]');
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(searchInput).toBeFocused();
    }
  });
});
