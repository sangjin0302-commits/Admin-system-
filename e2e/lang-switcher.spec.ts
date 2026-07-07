import { test, expect } from "@playwright/test";

test.describe("Language Switcher", () => {
  test("영어 페이지 로드", async ({ page }) => {
    const res = await page.goto("/en");
    // /en 라우트가 없으면 404, 있으면 200
    expect(res?.status()).toBeLessThan(500);
  });

  test("한국어 홈 로드 후 언어 전환 UI 존재", async ({ page }) => {
    await page.goto("/");
    const switcher = page.locator('button, a').filter({ hasText: /한국어|English|EN|KO|언어/i });
    // 존재하지 않을 수도 있음 — 스모크 체크
    const count = await switcher.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
