import { test, expect } from "@playwright/test";

test.describe("Wall Page", () => {
  test("should show not found message for non-existent wall", async ({ page }) => {
    await page.goto("/for/non-existent-wall-12345");
    await expect(page.locator("text=Wall not found")).toBeVisible({ timeout: 10_000 });
  });

  test("should have a Go Home link on not found page", async ({ page }) => {
    await page.goto("/for/non-existent-wall-12345");
    await expect(page.locator("text=Wall not found")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Go Home")).toBeVisible();
  });

  test("should navigate home from not found page", async ({ page }) => {
    await page.goto("/for/non-existent-wall-12345");
    await expect(page.locator("text=Wall not found")).toBeVisible({ timeout: 10_000 });
    await page.locator("text=Go Home").click();
    await expect(page).toHaveURL("/");
  });
});
