import { test, expect } from "./fixtures";

test.describe("Admin Case Detail", () => {
  test("case detail requires auth", async ({ page }) => {
    const response = await page.goto("/admin/cases/fake-id");
    // 세션 인증 구성 시 /admin/login 리다이렉트(200), 미구성 시 401 — 둘 다 "차단".
    expect(response?.status() === 401 || /\/admin\/login/.test(page.url())).toBeTruthy();
  });

  test("case detail API requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/cases/fake-id");
    expect(res.status()).toBe(401);
  });
});
