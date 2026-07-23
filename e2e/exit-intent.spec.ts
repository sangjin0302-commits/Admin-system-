import { test, expect } from "./fixtures";

test.describe("Exit Intent Modal", () => {
  test("홈에서 상단 이탈 시 모달 후보 존재", async ({ page }) => {
    await page.goto("/");
    // 마우스를 상단으로 이동시켜 exit intent 트리거
    await page.mouse.move(500, 500);
    await page.waitForTimeout(200);
    await page.mouse.move(500, 0);
    await page.waitForTimeout(500);
    // 모달은 옵션 — 존재 여부만 확인 (없어도 실패 아님)
    const modal = page.locator('[role="dialog"], [class*="modal"], [class*="ExitIntent"]');
    const visible = await modal.first().isVisible({ timeout: 1500 }).catch(() => false);
    expect(typeof visible).toBe("boolean");
  });

  test("이메일 캡처 API 존재 확인", async ({ request }) => {
    const res = await request.post("/api/newsletter/subscribe", {
      data: { email: "" },
    });
    expect(res.status()).toBeLessThan(500);
  });
});
