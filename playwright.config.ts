import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3737",
    headless: true,
  },
  webServer: {
    command: "npx next dev -p 3737",
    port: 3737,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
