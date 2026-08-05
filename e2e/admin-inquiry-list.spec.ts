import { test, expect } from "./fixtures";

test.describe("Admin Inquiry List", () => {
  test("list page requires auth", async ({ page }) => {
    const response = await page.goto("/admin/inquiries");
    // 세션 인증 구성 시 /admin/login 리다이렉트(200), 미구성 시 401 — 둘 다 "차단".
    expect(response?.status() === 401 || /\/admin\/login/.test(page.url())).toBeTruthy();
  });

  test("inquiry list API requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/inquiries");
    expect(res.status()).toBe(401);
  });

  test("inquiry list with filters requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/inquiries?status=NEW&sort=recent");
    expect(res.status()).toBe(401);
  });
});
