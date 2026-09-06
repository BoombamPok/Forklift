import fs from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// The webServer subprocess (`npm run dev`) gets .env.local via Next.js's
// own loader; this process (the test runner itself) doesn't, so tests
// that read process.env.E2E_* need it loaded here too.
if (fs.existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // CI runs against a production build (`next build`, done as its own
    // prior CI step, then `next start`) rather than `next dev` - dev
    // mode compiles each route on its first hit, which is fine locally
    // but was a real source of flaky first-hit timeouts in a fresh CI
    // container with nothing pre-warmed (Phase 7 finding). This also
    // means CI e2e exercises what actually gets deployed, not a dev-only
    // code path.
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
