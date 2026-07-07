import { test, expect } from "@playwright/test";

test.describe("Services Page", () => {
  test("서비스 페이지 로드", async ({ page }) => {
    const res = await page.goto("/services");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("서비스 페이지에 CTA 존재", async ({ page }) => {
    await page.goto("/services");
    // 상담/문의 CTA 버튼
    const cta = page.locator("a, button").filter({ hasText: /상담|문의|시작/ });
    expect(await cta.count()).toBeGreaterThan(0);
  });
});
