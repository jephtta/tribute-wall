import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display the home page with title and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Celebrate the people who matter most");
    await expect(page.locator("text=Create a Wall")).toBeVisible();
  });

  test("should have sign in link", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Sign In")).toBeVisible();
  });

  test("should have create wall button in header", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header").locator("text=Create Wall")).toBeVisible();
  });

  test("should navigate to sign in page", async ({ page }) => {
    await page.goto("/");
    await page.locator("text=Sign In").click();
    await expect(page).toHaveURL("/auth/signin");
  });

  test("should navigate to create page (redirects to signin when unauthenticated)", async ({ page }) => {
    await page.goto("/");
    await page.locator("text=Create a Wall").click();
    await expect(page).toHaveURL(/\/(create|auth\/signin)/);
  });

  test("should display feature cards (Create, Share, Celebrate)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h3", { hasText: "Create" })).toBeVisible();
    await expect(page.locator("h3", { hasText: "Share" })).toBeVisible();
    await expect(page.locator("h3", { hasText: "Celebrate" })).toBeVisible();
  });

  test("should display footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toContainText("Built with love");
  });

  test("should display Tribute Wall brand in header", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header").locator("text=Tribute Wall")).toBeVisible();
  });
});
