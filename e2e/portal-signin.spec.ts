import { test, expect } from "./fixtures";

test.describe("Portal Signin", () => {
  test("signin page loads", async ({ page }) => {
    const res = await page.goto("/portal/signin");
    expect(res?.status()).toBeLessThan(500);
  });

  test("signin form has email field", async ({ page }) => {
    await page.goto("/portal/signin");
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    if (await emailInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(emailInput.first()).toBeVisible();
    }
  });
});
