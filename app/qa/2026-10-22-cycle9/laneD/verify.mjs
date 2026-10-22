import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const OUT_DIR = "/home/appuser/work/6692b763e851d28a036ab30e/6ad835717bb80aa7c2d979d0/oda-productivity-suite/app/qa/2026-10-22-cycle9/laneD";

async function run() {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  console.log("Navigating to http://127.0.0.1:5184/watchlist...");
  await page.goto("http://127.0.0.1:5184/watchlist", { waitUntil: "networkidle" });

  // 1. Check default sort
  const defaultFirstCard = await page.locator("[data-testid=watchlist-grid] [data-testid=org-card]").first();
  const defaultFirstOrg = await defaultFirstCard.getAttribute("data-org");
  const defaultFirstPinned = await defaultFirstCard.getAttribute("data-pinned");
  const defaultHasChip = await defaultFirstCard.locator("[data-testid=pinned-chip]").count() > 0;

  results.tests.defaultSort = {
    firstOrg: defaultFirstOrg,
    pinnedAttr: defaultFirstPinned,
    hasPinnedChip: defaultHasChip,
    pass: defaultFirstOrg === "airev" && defaultFirstPinned === "true" && defaultHasChip,
  };
  console.log("Default sort first card:", defaultFirstOrg, "pass:", results.tests.defaultSort.pass);

  // Take screenshot of watchlist top
  await page.screenshot({ path: path.join(OUT_DIR, "watchlist-top.png") });
  console.log("Saved watchlist-top.png");

  // 2. Check sort by "Name"
  const sortSelect = page.locator("select[aria-label=Sort]");
  await sortSelect.selectOption("name");
  await page.waitForTimeout(500);

  const nameFirstCard = await page.locator("[data-testid=watchlist-grid] [data-testid=org-card]").first();
  const nameFirstOrg = await nameFirstCard.getAttribute("data-org");
  const nameFirstPinned = await nameFirstCard.getAttribute("data-pinned");

  results.tests.nameSort = {
    firstOrg: nameFirstOrg,
    pinnedAttr: nameFirstPinned,
    pass: nameFirstOrg === "airev" && nameFirstPinned === "true",
  };
  console.log("Name sort first card:", nameFirstOrg, "pass:", results.tests.nameSort.pass);

  // 3. Check sort by "Coverage"
  await sortSelect.selectOption("coverage");
  await page.waitForTimeout(500);

  const coverageFirstCard = await page.locator("[data-testid=watchlist-grid] [data-testid=org-card]").first();
  const coverageFirstOrg = await coverageFirstCard.getAttribute("data-org");
  const coverageFirstPinned = await coverageFirstCard.getAttribute("data-pinned");

  results.tests.coverageSort = {
    firstOrg: coverageFirstOrg,
    pinnedAttr: coverageFirstPinned,
    pass: coverageFirstOrg === "airev" && coverageFirstPinned === "true",
  };
  console.log("Coverage sort first card:", coverageFirstOrg, "pass:", results.tests.coverageSort.pass);

  // 4. Navigate to /watchlist/airev
  console.log("Navigating to http://127.0.0.1:5184/watchlist/airev...");
  await page.goto("http://127.0.0.1:5184/watchlist/airev", { waitUntil: "networkidle" });

  const hasDisambiguation = await page.locator("[data-testid=airev-disambiguation]").count() > 0;
  const disambiguationText = hasDisambiguation ? await page.locator("[data-testid=airev-disambiguation]").innerText() : "";

  const sourcesListItems = page.locator("[data-testid=airev-sources] li");
  const sourcesCount = await sourcesListItems.count();

  const hasLinkedinUnavailable = await page.locator("[data-testid=airev-linkedin-unavailable]").count() > 0;

  results.tests.dossier = {
    hasDisambiguation,
    disambiguationSample: disambiguationText.slice(0, 150),
    sourcesCount,
    hasLinkedinUnavailable,
    pass: hasDisambiguation && sourcesCount >= 25 && hasLinkedinUnavailable,
  };
  console.log("Dossier tests:", results.tests.dossier);

  // Take screenshot of airev dossier
  await page.screenshot({ path: path.join(OUT_DIR, "airev-dossier.png") });
  console.log("Saved airev-dossier.png");

  // 5. Check overview page top-orgs panel
  console.log("Navigating to http://127.0.0.1:5184/overview...");
  await page.goto("http://127.0.0.1:5184/overview", { waitUntil: "networkidle" });
  const topOrgsItems = page.locator("[data-testid=top-orgs] li");
  const topOrgsCount = await topOrgsItems.count();
  const topOrgsFirstText = await topOrgsItems.first().innerText();
  const topOrgsHasPinnedChip = await topOrgsItems.first().locator("[data-testid=pinned-chip]").count() > 0;

  results.tests.overview = {
    topOrgsCount,
    topOrgsFirstText,
    topOrgsHasPinnedChip,
    pass: topOrgsCount === 8 && topOrgsFirstText.includes("AIREV") && topOrgsHasPinnedChip,
  };
  console.log("Overview top-orgs test:", results.tests.overview);

  // 6. Check methodology page
  console.log("Navigating to http://127.0.0.1:5184/methodology...");
  await page.goto("http://127.0.0.1:5184/methodology", { waitUntil: "networkidle" });
  const methodologyText = await page.locator("[data-testid=methodology], body").innerText();
  const hasReferenceBullet = methodologyText.includes("Reference dossier: AIREV (OnDemand vendor) is pinned first");
  const hasNajwaAaraj = methodologyText.includes("TII CEO: Dr Najwa Aaraj (since 21 May 2024");

  results.tests.methodology = {
    hasReferenceBullet,
    hasNajwaAaraj,
    pass: hasReferenceBullet && hasNajwaAaraj,
  };
  console.log("Methodology test:", results.tests.methodology);

  // Overall pass
  results.allPassed = Object.values(results.tests).every((t) => t.pass);

  fs.writeFileSync(path.join(OUT_DIR, "verification-result.json"), JSON.stringify(results, null, 2));
  console.log("Wrote verification-result.json. All passed:", results.allPassed);

  await browser.close();
  return results.allPassed ? 0 : 1;
}

run().then((code) => {
  process.exit(code);
}).catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
