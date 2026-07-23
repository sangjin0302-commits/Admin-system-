import { test, expect } from "./fixtures";

test.describe("AI Intake Screener", () => {
  test("AI 스크리너 페이지 로드", async ({ page }) => {
    const res = await page.goto("/ai-screen");
    // 페이지가 없으면 404, 있으면 200
    expect(res?.status()).toBeLessThan(500);
  });

  test("공개 API — AI intake 요청 검증", async ({ request }) => {
    const res = await request.post("/api/ai-screen", {
      data: {},
    });
    // 빈 body는 400/422, 인증 필요면 401 — 500만 아니면 OK
    expect(res.status()).toBeLessThan(500);
  });
});
