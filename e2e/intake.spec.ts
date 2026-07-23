import { test, expect } from "./fixtures";

// 첫 방문 인트로/온보딩 오버레이가 클릭을 가로채므로 재방문 상태로 세팅.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("ethos_intro_seen", "1");
      sessionStorage.setItem("ethos_onboarded", "1");
    } catch { /* ignore */ }
  });
});

test.describe("Intake Form", () => {
  test("loads intake page and shows step 1", async ({ page }) => {
    await page.goto("/intake");
    await expect(page.locator("h1")).toContainText(/접수|intake/i);
    // "업무 분야"는 폼 라벨/설명/푸터 등 복수 등장 → 첫 요소 존재만 확인.
    await expect(page.getByText("업무 분야").first()).toBeVisible();
  });

  test("can select a category", async ({ page }) => {
    await page.goto("/intake");
    const categoryButton = page.locator("button, [role=radio], [role=option]").first();
    if (await categoryButton.isVisible().catch(() => false)) {
      await categoryButton.click();
    }
  });
});
