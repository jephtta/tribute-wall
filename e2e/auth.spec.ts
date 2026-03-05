import { test, expect } from "@playwright/test";

test.describe("Auth Page", () => {
  test("should display sign in form", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.locator("text=Welcome Back")).toBeVisible();
    await expect(page.locator("text=Continue with Google")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("should toggle between sign in and sign up", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.locator("text=Welcome Back")).toBeVisible();
    // Click the underlined "Sign Up" toggle link (not the submit button)
    await page.locator("p button", { hasText: "Sign Up" }).click();
    await expect(page.locator("[data-slot='card-title']", { hasText: "Create Account" })).toBeVisible();
    // Click the underlined "Sign In" toggle link to go back
    await page.locator("p button", { hasText: "Sign In" }).click();
    await expect(page.locator("text=Welcome Back")).toBeVisible();
  });

  test("should show validation on empty form submit", async ({ page }) => {
    await page.goto("/auth/signin");
    const emailInput = page.locator("#email");
    await expect(emailInput).toHaveAttribute("required", "");
  });
});
