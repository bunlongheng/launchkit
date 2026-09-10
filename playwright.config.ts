import { defineConfig, devices } from "@playwright/test";

// Point E2E_BASE_URL at a deployed URL to run the same suite against production;
// with it unset the config boots the local dev server itself.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3046";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run dev", url: baseURL, reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
