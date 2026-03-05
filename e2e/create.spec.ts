import { test, expect } from "@playwright/test";

test.describe("Create Wall Page", () => {
  test("should redirect unauthenticated users to sign in", async ({ page }) => {
    await page.goto("/create");
    // Should redirect to sign in page since user is not authenticated
    await page.waitForURL("/auth/signin", { timeout: 10_000 });
    await expect(page).toHaveURL("/auth/signin");
  });
});
