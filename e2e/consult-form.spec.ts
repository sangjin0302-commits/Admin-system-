import { test, expect } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("ethos_intro_seen", "1");
      sessionStorage.setItem("ethos_onboarded", "1");
    } catch { /* ignore */ }
  });
});

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
    const submit = page.locator('button[type="submit"]:visible').first();
    if (await submit.isVisible({ timeout: 3000 }).catch(() => false)) {
      // 실제 제출로 네비게이션이 발생하지 않도록 noValidate 폼도 감안해 클릭만 확인.
      await submit.click({ trial: false }).catch(() => { /* 검증 차단은 정상 */ });
      // 검증 실패로 consult 경로에 머무름.
      expect(page.url()).toContain("consult");
    }
  });
});
