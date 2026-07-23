import { test, expect } from "./fixtures";

test.describe("Booking Widget", () => {
  test("예약 페이지 로드", async ({ page }) => {
    // 실제 라우트는 /book-consultation (booking 플래그 locked-on). 404면 실패해야 함.
    const res = await page.goto("/book-consultation");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("예약 슬롯 API 응답", async ({ request }) => {
    const res = await request.get("/api/booking/slots");
    expect(res.status()).toBeLessThan(500);
  });
});
