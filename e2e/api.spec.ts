import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test.describe("Authentication boundaries", () => {
    test("POST /api/walls should return 401 without auth", async ({ request }) => {
      const response = await request.post("/api/walls", {
        data: { title: "Test Wall" },
      });
      expect(response.status()).toBe(401);
    });

    test("GET /api/walls should return 401 without auth", async ({ request }) => {
      const response = await request.get("/api/walls");
      expect(response.status()).toBe(401);
    });

    test("PATCH /api/walls/non-existent should return 401 without auth", async ({ request }) => {
      const response = await request.patch("/api/walls/non-existent-id-12345", {
        data: { title: "Updated" },
      });
      expect(response.status()).toBe(401);
    });

    test("DELETE /api/walls/non-existent should return 401 without auth", async ({ request }) => {
      const response = await request.delete("/api/walls/non-existent-id-12345");
      expect(response.status()).toBe(401);
    });
  });

  test.describe("Public endpoints", () => {
    test("GET /api/walls/non-existent should return 404 or 500", async ({ request }) => {
      const response = await request.get("/api/walls/non-existent-id-12345");
      // 404 when Firebase is configured, 500 when credentials unavailable
      expect([404, 500]).toContain(response.status());
    });

    test("POST /api/walls/non-existent/tributes should return 404 or 500", async ({ request }) => {
      const response = await request.post("/api/walls/non-existent-id-12345/tributes", {
        data: { displayName: "Test", message: "Hello" },
      });
      // 404 when Firebase is configured, 500 when credentials unavailable
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

  test.describe("Input validation", () => {
    test("POST /api/walls with invalid token should return 500", async ({ request }) => {
      const response = await request.post("/api/walls", {
        headers: { Authorization: "Bearer invalid-token" },
        data: {},
      });
      expect(response.status()).toBe(500);
    });

    test("POST tribute without displayName should return 400, 404, or 500", async ({ request }) => {
      const response = await request.post("/api/walls/non-existent-id/tributes", {
        data: { message: "Hello" },
      });
      // 400 (validation), 404 (wall not found), or 500 (Firebase unavailable)
      expect([400, 404, 500]).toContain(response.status());
    });

    test("POST tribute without message or media should return 400, 404, or 500", async ({ request }) => {
      const response = await request.post("/api/walls/non-existent-id/tributes", {
        data: { displayName: "Test" },
      });
      // 400 (validation), 404 (wall not found), or 500 (Firebase unavailable)
      expect([400, 404, 500]).toContain(response.status());
    });
  });
});
