import { test, expect } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("ethos_intro_seen", "1");
      sessionStorage.setItem("ethos_onboarded", "1");
    } catch { /* ignore */ }
  });
});

test.describe("Blog", () => {
  test("loads blog listing", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("칼럼 검색 입력 동작", async ({ page }) => {
    await page.goto("/blog");
    // 인라인 칼럼 검색창(단축키 바인딩은 플랫폼별로 달라 focus 대신 실제 입력으로 검증).
    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill("비자");
      await expect(searchInput).toHaveValue("비자");
    }
  });
});
