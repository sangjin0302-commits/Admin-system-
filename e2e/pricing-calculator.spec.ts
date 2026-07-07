import { test, expect } from "@playwright/test";

test.describe("Pricing Calculator", () => {
  test("가격 계산기 페이지 로드", async ({ page }) => {
    const res = await page.goto("/pricing");
    expect(res?.status()).toBeLessThan(500);
  });

  test("가격/견적 관련 텍스트 노출", async ({ page }) => {
    await page.goto("/pricing");
    const priceText = page.locator("body").filter({ hasText: /견적|가격|비용|만원|원/ });
    expect(await priceText.count()).toBeGreaterThan(0);
  });
});
