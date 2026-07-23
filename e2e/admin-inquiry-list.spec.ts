import { test, expect } from "./fixtures";

test.describe("Admin Inquiry List", () => {
  test("list page requires auth", async ({ page }) => {
    const response = await page.goto("/admin/inquiries");
    expect(response?.status()).toBe(401);
  });

  test("inquiry list API requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/inquiries");
    expect(res.status()).toBe(401);
  });

  test("inquiry list with filters requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/inquiries?status=NEW&sort=recent");
    expect(res.status()).toBe(401);
  });
});
