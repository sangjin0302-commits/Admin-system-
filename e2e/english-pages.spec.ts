import { test, expect } from "./fixtures";

// 외국인 방문 경로: 공개 페이지가 ?lang=en 에서 실제 영어 카피를 렌더하는지 검증.
test.describe("English public pages", () => {
  test("fees(요금) 영문", async ({ page }) => {
    const res = await page.goto("/fees?lang=en");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toContainText("Fee Guide");
    // 요금 CTA가 lang=en 유지
    const enIntake = page.locator('a[href*="/intake?lang=en"]');
    expect(await enIntake.count()).toBeGreaterThan(0);
  });

  test("contact(오시는 길) 영문", async ({ page }) => {
    const res = await page.goto("/contact?lang=en");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toContainText("Directions");
  });

  test("careers(채용) 영문", async ({ page }) => {
    const res = await page.goto("/careers?lang=en");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toContainText("Administrative Attorneys");
  });

  test("한국어 기본값은 유지", async ({ page }) => {
    await page.goto("/fees");
    await expect(page.locator("body")).not.toContainText("Fee Guide — Reference Pricing by Area");
  });
});

// 웹은 국문·영문만 제공 — ar/jp/vn 폐지, 접근 시 404 고정.
test.describe("Removed languages return 404", () => {
  for (const path of ["/ar", "/jp", "/vn"]) {
    test(`${path} → 404`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(404);
    });
  }
});
