import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  // 첫 방문 인트로 스플래시 + 온보딩 툴팁은 세션 최초 1회 노출되며 클릭을 가로챈다.
  // 이 스펙은 네비게이션 동작을 검증하는 것이므로, 재방문 상태로 세팅해 오버레이를 끈다.
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("ethos_intro_seen", "1");
        sessionStorage.setItem("ethos_onboarded", "1");
      } catch { /* ignore */ }
    });
  });

  test("renders hero and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
    // 데스크톱 nav + 모바일 하단 nav 등 nav가 복수이므로 first()로 존재만 확인.
    await expect(page.locator("nav").first()).toBeVisible();
    await expect(page.locator('a[href="/intake"]').first()).toBeVisible();
  });

  test("navigates to services page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
    // 데스크톱 헤더의 "업무분야" 링크를 명시 타겟(메가메뉴 opacity-0 링크 오클릭 방지).
    const nav = page.getByRole("link", { name: "업무분야", exact: true }).first();
    await nav.click();
    await page.waitForURL(/\/services/);
    await expect(page).toHaveURL(/\/services/);
  });
});
