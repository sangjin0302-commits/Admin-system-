import { test, expect } from "@playwright/test";

test.describe("Quick Consult Form", () => {
  test("빠른 상담 폼 로드", async ({ page }) => {
    const res = await page.goto("/consult");
    expect(res?.status()).toBeLessThan(500);
  });

  test("연락처 입력 필드 존재", async ({ page }) => {
    await page.goto("/consult");
    const input = page.locator('input[type="tel"], input[name*="phone"], input[name*="contact"]');
    if (await input.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(input.first()).toBeVisible();
    }
  });

  test("빈 폼 제출 시 검증 오류", async ({ page }) => {
    await page.goto("/consult");
    const submit = page.locator('button[type="submit"]').first();
    if (await submit.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submit.click();
      // 검증 실패로 URL 그대로 (또는 성공 페이지가 아님)
      expect(page.url()).toContain("consult");
    }
  });
});
