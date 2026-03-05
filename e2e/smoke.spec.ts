import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("app loads and returns HTTP 200", async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
  });

  test("main page renders without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("sign in page is reachable", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.locator("text=Welcome Back")).toBeVisible();
  });

  test("primary CTA is visible on home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Create a Wall")).toBeVisible();
  });

  test("API health check - walls endpoint responds", async ({ request }) => {
    const response = await request.get("/api/walls");
    // Returns 401 (auth required) but confirms API is running
    expect(response.status()).toBe(401);
  });
});
