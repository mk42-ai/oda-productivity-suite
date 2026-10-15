import { defineConfig } from "@playwright/test";
/** Pass-2 payload harness + regression sweep config: one worker, serial, BASE_URL = live preview, PW_VIEWPORT selects the viewport. */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";
export default defineConfig({
  testDir: ".",
  testMatch: /chat-intelligent-ui-payloads\.spec\.ts|regression-sweep\.spec\.ts|_dbg\.spec\.ts/,
  timeout: 240_000,
  expect: { timeout: 20_000 },
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "../ui-proof/playwright-results.json" }]],
  use: {
    baseURL: BASE_URL,
    trace: "off",
    screenshot: "off",
    launchOptions: { executablePath: process.env.CHROME_PATH || "/usr/bin/chromium", args: ["--no-sandbox", "--disable-dev-shm-usage"] },
  },
});
