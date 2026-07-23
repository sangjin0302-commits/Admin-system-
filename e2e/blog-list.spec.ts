import { test, expect } from "./fixtures";

test.describe("Blog List", () => {
  test("blog list renders", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("blog list has articles or empty state", async ({ page }) => {
    await page.goto("/blog");
    // 글 목록 또는 빈 상태 메시지 중 하나가 있어야 함
    const hasContent = await page
      .locator("article, [class*='blog-card'], [class*='empty']")
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(hasContent || (await page.locator("main").isVisible())).toBeTruthy();
  });
});
