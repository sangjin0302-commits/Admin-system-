import { test, expect } from "./fixtures";

test.describe("Admin Case Detail", () => {
  test("case detail requires auth", async ({ page }) => {
    const response = await page.goto("/admin/cases/fake-id");
    expect(response?.status()).toBe(401);
  });

  test("case detail API requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/cases/fake-id");
    expect(res.status()).toBe(401);
  });
});
