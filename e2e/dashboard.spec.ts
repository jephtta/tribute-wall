import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("should redirect unauthenticated users to sign in", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("/auth/signin", { timeout: 10_000 });
    await expect(page).toHaveURL("/auth/signin");
  });
});
