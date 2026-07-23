import { test, expect } from "./fixtures";

test.describe("Pricing Calculator", () => {
  test("가격 계산기 페이지 로드", async ({ page }) => {
    // 실제 라우트는 /pricing-calculator. 404면 실패해야 함.
    const res = await page.goto("/pricing-calculator");
    expect(res?.status()).toBeLessThan(400);
  });

  test("가격/견적 관련 텍스트 노출", async ({ page }) => {
    await page.goto("/pricing-calculator");
    const priceText = page.locator("body").filter({ hasText: /견적|가격|비용|만원|원/ });
    expect(await priceText.count()).toBeGreaterThan(0);
  });
});
