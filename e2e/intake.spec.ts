import { test, expect } from "@playwright/test";

test.describe("Intake Form", () => {
  test("loads intake page and shows step 1", async ({ page }) => {
    await page.goto("/intake");
    await expect(page.locator("h1")).toContainText(/접수|intake/i);
    await expect(page.locator("text=업무 분야")).toBeVisible();
  });

  test("can select a category", async ({ page }) => {
    await page.goto("/intake");
    const categoryButton = page.locator("button, [role=radio], [role=option]").first();
    if (await categoryButton.isVisible()) {
      await categoryButton.click();
    }
  });
});
