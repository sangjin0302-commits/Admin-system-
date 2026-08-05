import { test, expect } from "./fixtures";

test.describe("Admin Dashboard", () => {
  test("requires authentication", async ({ page }) => {
    const response = await page.goto("/admin");
    // 세션 인증 구성 시 /admin/login 리다이렉트(200), 미구성 시 401 — 둘 다 "차단".
    expect(response?.status() === 401 || /\/admin\/login/.test(page.url())).toBeTruthy();
  });

  test("admin API requires auth", async ({ request }) => {
    const response = await request.get("/api/admin/inquiries");
    expect(response.status()).toBe(401);
  });
});
