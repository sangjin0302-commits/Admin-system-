import { test, expect } from "@playwright/test";

test.describe("Blog Detail", () => {
  test("blog detail page loads (may be 404 for fake slug)", async ({ page }) => {
    const res = await page.goto("/blog/fake-post");
    // 실제 없는 slug라면 404, 있으면 200 — 500이면 문제
    expect(res?.status()).toBeLessThan(500);
  });

  test("first blog post detail from list", async ({ page }) => {
    await page.goto("/blog");
    const firstLink = page.locator('a[href^="/blog/"]').first();
    if (await firstLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstLink.click();
      await expect(page.locator("main, article")).toBeVisible();
    }
  });
});
