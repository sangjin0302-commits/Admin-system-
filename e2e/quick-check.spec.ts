import { test, expect } from "@playwright/test";

test.describe("Quick Check", () => {
  test("loads AI pre-check page", async ({ page }) => {
    await page.goto("/quick-check");
    await expect(page.locator("h1")).toContainText("AI 사전 진단");
    await expect(page.locator("textarea")).toBeVisible();
  });

  test("shows error for short input", async ({ page }) => {
    await page.goto("/quick-check");
    await page.fill("textarea", "짧은");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=10자")).toBeVisible();
  });
});
