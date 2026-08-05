import { test, expect } from "./fixtures";

test.describe("Admin Features Toggle", () => {
  test("features page requires auth", async ({ page }) => {
    const response = await page.goto("/admin/features");
    // 세션 인증 구성 시 /admin/login 리다이렉트(200), 미구성 시 401 — 둘 다 "차단".
    expect(response?.status() === 401 || /\/admin\/login/.test(page.url())).toBeTruthy();
  });

  test("features API requires auth", async ({ request }) => {
    const response = await request.get("/api/admin/features");
    expect(response.status()).toBe(401);
  });

  test("feature toggle endpoint requires auth", async ({ request }) => {
    const response = await request.post("/api/admin/features", {
      data: { key: "brand_intro", enabled: true },
    });
    expect([401, 403]).toContain(response.status());
  });
});
