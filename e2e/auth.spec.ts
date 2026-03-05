import { test, expect } from "@playwright/test";

test.describe("Auth Page", () => {
  test("should display sign in form with all elements", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.locator("text=Welcome Back")).toBeVisible();
    await expect(page.locator("text=Continue with Google")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("a", { hasText: "Tribute Wall" })).toBeVisible();
  });

  test("should toggle between sign in and sign up", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.locator("text=Welcome Back")).toBeVisible();
    await page.locator("p button", { hasText: "Sign Up" }).click();
    await expect(page.locator("[data-slot='card-title']", { hasText: "Create Account" })).toBeVisible();
    await page.locator("p button", { hasText: "Sign In" }).click();
    await expect(page.locator("text=Welcome Back")).toBeVisible();
  });

  test("should have required attribute on email and password", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.locator("#email")).toHaveAttribute("required", "");
    await expect(page.locator("#password")).toHaveAttribute("required", "");
  });

  test("should have password field with minLength 6", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.locator("#password")).toHaveAttribute("minlength", "6");
  });

  test("should show sign up description when toggled", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.locator("p button", { hasText: "Sign Up" }).click();
    await expect(page.locator("text=Create an account to manage your tribute walls")).toBeVisible();
  });

  test("should have email input with correct type", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.locator("#email")).toHaveAttribute("type", "email");
  });

  test("should have Tribute Wall link back to home", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.locator("a", { hasText: "Tribute Wall" }).click();
    await expect(page).toHaveURL("/");
  });
});
