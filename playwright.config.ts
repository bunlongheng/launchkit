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
  // A phone project as well as desktop: a 2 column layout that truncated its labels
  // at 390px shipped because nothing in CI ever looked at a narrow viewport.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Chromium at iPhone dimensions rather than WebKit: the point is catching layout
    // and clipping regressions at a narrow viewport, and it keeps CI to 1 browser
    // download. WebKit also rejects the clipboard permissions this suite grants.
    { name: "iphone", use: { ...devices["iPhone 14"], browserName: "chromium" } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // In CI, exercise the built output rather than the dev server, otherwise
        // nothing ever loads the bundle that actually ships.
        command: process.env.CI ? "npm run start" : "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
