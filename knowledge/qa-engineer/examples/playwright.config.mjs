// Playwright config (pattern from https://playwright.dev/docs/test-webserver).
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testMatch: /.*\.spec\.mjs/,
  use: { baseURL: "http://localhost:4173", trace: "off" },
  webServer: { command: "node serve-demo.mjs", url: "http://localhost:4173", reuseExistingServer: !process.env.CI },
});
