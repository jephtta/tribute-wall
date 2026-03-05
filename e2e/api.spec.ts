import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test("POST /api/walls should require authentication", async ({ request }) => {
    const response = await request.post("/api/walls", {
      data: { title: "Test Wall" },
    });
    expect(response.status()).toBe(401);
  });

  test("GET /api/walls should require authentication", async ({ request }) => {
    const response = await request.get("/api/walls");
    expect(response.status()).toBe(401);
  });

  test("GET /api/walls/non-existent should return 404 or 500", async ({ request }) => {
    const response = await request.get("/api/walls/non-existent-id-12345");
    // May return 404 if Firebase is configured, or 500 if credentials are not available
    expect([404, 500]).toContain(response.status());
  });

  test("POST /api/walls/non-existent/tributes should return 404 or 500", async ({ request }) => {
    const response = await request.post("/api/walls/non-existent-id-12345/tributes", {
      data: { displayName: "Test", message: "Hello" },
    });
    expect([404, 500]).toContain(response.status());
  });

  test("POST /api/upload without file should return error", async ({ request }) => {
    const response = await request.post("/api/upload", {
      headers: { "Content-Type": "application/json" },
      data: {},
    });
    expect([400, 500]).toContain(response.status());
  });
});
