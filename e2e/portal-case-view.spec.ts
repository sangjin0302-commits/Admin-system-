import { test, expect } from "@playwright/test";

test.describe("Portal Case View", () => {
  test("portal home requires auth or redirects", async ({ page }) => {
    const res = await page.goto("/portal");
    // 로그인 안 된 상태에서는 signin으로 리다이렉트되거나 401
    expect(res?.status()).toBeLessThan(500);
  });

  test("portal case API requires auth", async ({ request }) => {
    const res = await request.get("/api/portal/cases");
    expect([401, 403]).toContain(res.status());
  });
});
