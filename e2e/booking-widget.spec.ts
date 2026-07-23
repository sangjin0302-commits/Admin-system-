import { test, expect } from "./fixtures";

test.describe("Booking Widget", () => {
  test("예약 페이지 로드", async ({ page }) => {
    const res = await page.goto("/booking");
    expect(res?.status()).toBeLessThan(500);
  });

  test("예약 슬롯 API 응답", async ({ request }) => {
    const res = await request.get("/api/booking/slots");
    expect(res.status()).toBeLessThan(500);
  });
});
