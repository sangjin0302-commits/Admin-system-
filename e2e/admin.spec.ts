import { test, expect } from "./fixtures";

test.describe("Admin Dashboard", () => {
  test("requires authentication", async ({ page }) => {
    const response = await page.goto("/admin");
    expect(response?.status()).toBe(401);
  });

  test("admin API requires auth", async ({ request }) => {
    const response = await request.get("/api/admin/inquiries");
    expect(response.status()).toBe(401);
  });
});
