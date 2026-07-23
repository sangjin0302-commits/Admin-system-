import { test, expect } from "@playwright/test";

test.describe("About Page", () => {
  test("소개 페이지 로드 + 히어로", async ({ page }) => {
    const res = await page.goto("/about");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("세 가지 가치(Logos·Pathos·Ethos) 노출", async ({ page }) => {
    await page.goto("/about");
    const body = page.locator("body");
    await expect(body).toContainText("Logos");
    await expect(body).toContainText("Pathos");
    await expect(body).toContainText("Ethos");
  });

  test("컬러 시스템 섹션 + HEX 코드 노출", async ({ page }) => {
    await page.goto("/about");
    const body = page.locator("body");
    // 브랜드 컬러 스와치의 HEX 값이 렌더되어야 함
    await expect(body).toContainText("#1B2B6B");
    await expect(body).toContainText("#B8972A");
    // 근거 카드(학술 출처)
    await expect(body).toContainText("Labrecque");
  });

  test("CTA(무료 검토/접수) 링크 존재", async ({ page }) => {
    await page.goto("/about");
    const intake = page.locator('a[href*="/intake"]');
    expect(await intake.count()).toBeGreaterThan(0);
  });

  test("영문(lang=en) 전환 시 영어 카피 노출", async ({ page }) => {
    await page.goto("/about?lang=en");
    const body = page.locator("body");
    await expect(body).toContainText("About Us");
    await expect(body).toContainText("Color as a Stance");
    // 영문 CTA도 lang=en 유지
    const enIntake = page.locator('a[href*="/intake?lang=en"]');
    expect(await enIntake.count()).toBeGreaterThan(0);
  });
});
