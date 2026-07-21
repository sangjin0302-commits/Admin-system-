import { test, expect } from "@playwright/test";

// 첫 방문 인트로/온보딩 오버레이가 submit 클릭을 가로채므로 재방문 상태로 세팅.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("ethos_intro_seen", "1");
      sessionStorage.setItem("ethos_onboarded", "1");
    } catch { /* ignore */ }
  });
});

test.describe("Quick Check", () => {
  test("loads AI pre-check page", async ({ page }) => {
    await page.goto("/quick-check");
    await expect(page.locator("h1")).toContainText("AI 사전 진단");
    await expect(page.locator("textarea").first()).toBeVisible();
  });

  test("shows error for short input", async ({ page }) => {
    await page.goto("/quick-check");
    await page.fill("textarea", "짧은");
    await page.locator('button[type="submit"]:visible').first().click();
    await expect(page.locator("text=10자").first()).toBeVisible();
  });
});
