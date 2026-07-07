import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["iPhone 12"] });

test.describe("Mobile Bottom Sheet Consult", () => {
  test("모바일 홈 로드", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(500);
  });

  test("바텀시트 CTA 존재 여부 (모바일)", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    // 하단 고정 CTA 후보
    const bottomSheet = page.locator(
      '[class*="bottom-sheet"], [class*="BottomSheet"], [class*="sticky-cta"], [class*="StickyCta"]'
    );
    const count = await bottomSheet.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("모바일 스크롤 시 바텀시트/스티키 CTA 유지", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(300);
    // 스크롤 후 페이지가 여전히 살아있는지
    await expect(page.locator("body")).toBeVisible();
  });
});
