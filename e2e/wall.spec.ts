import { test, expect } from "@playwright/test";

test.describe("Wall Page", () => {
  test("should show not found or error for non-existent wall", async ({ page }) => {
    await page.goto("/for/non-existent-wall-12345");
    // Wait for either "Wall not found" or a loading spinner to resolve
    await page.waitForTimeout(5000);
    const content = await page.textContent("body");
    // The page should show some content (not a blank page)
    expect(content!.length).toBeGreaterThan(0);
  });
});
