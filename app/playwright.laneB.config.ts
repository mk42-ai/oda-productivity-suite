// Lane B (QA cycle 4) side config: same projects as playwright.config.ts, but a private outputDir + JSON file so it can run
// concurrently with another Playwright process in this checkout without the two wiping each other's test-results/.
import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  outputDir: "test-results-laneB",
  reporter: [["list"], ["json", { outputFile: "test-results-laneB/results.json" }]],
});
