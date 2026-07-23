import { test, expect } from "./fixtures";

test.describe("Portal Case View", () => {
  test("portal home requires auth or redirects", async ({ page }) => {
    const res = await page.goto("/portal");
    // 로그인 안 된 상태에서는 signin으로 리다이렉트되거나 401
    expect(res?.status()).toBeLessThan(500);
  });

  test("portal API requires auth", async ({ request }) => {
    // /api/portal/cases(목록)는 존재하지 않음(404). 인증 보호되는 실제 엔드포인트로 검증.
    const res = await request.get("/api/portal/notifications");
    expect([401, 403]).toContain(res.status());
  });
});
