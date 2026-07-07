import { test, expect } from "@playwright/test";

test.describe("Admin Features Toggle", () => {
  test("features page requires auth", async ({ page }) => {
    const response = await page.goto("/admin/features");
    expect(response?.status()).toBe(401);
  });

  test("features API requires auth", async ({ request }) => {
    const response = await request.get("/api/admin/features");
    expect(response.status()).toBe(401);
  });

  test("feature toggle endpoint requires auth", async ({ request }) => {
    const response = await request.post("/api/admin/features", {
      data: { key: "brand_intro", enabled: true },
    });
    expect([401, 403]).toContain(response.status());
  });
});
