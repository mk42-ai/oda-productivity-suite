import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "https://sb-6u0rv43z1luy.vercel.run";
const OUT_DIR = process.argv[3] || "qa/2026-10-22-cycle9/laneE1";
fs.mkdirSync(OUT_DIR, { recursive: true });

const results = {
  timestamp: new Date().toISOString(),
  base: BASE,
  watchlist: {
    logoCount: 0,
    monogramCount: 0,
    totalCards: 0,
    allLogosGrayscale1: false,
    logoFilterValues: [],
    monogramDetails: [],
    firstCardHoverBeforeFilter: null,
    firstCardHoverAfterFilter: null,
    hoverUnGrayscalePass: false
  },
  chromatic: {
    routes: {}
  }
};

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"]
});

try {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try {
      localStorage.setItem("uaecc.settings.v1", JSON.stringify({
        onboarded: true,
        apikey: "",
        externalUserId: "INV-001",
        model: "predefined-deepseek-flash",
        theme: "light",
        companies: ["tii", "g42"]
      }));
    } catch {}
  });

  // Part 1: /watchlist check
  console.log(`Checking /watchlist at ${BASE}/watchlist ...`);
  await page.goto(`${BASE}/watchlist`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Evaluate logos and monograms
  const wlData = await page.evaluate(() => {
    const logos = Array.from(document.querySelectorAll('[data-testid="org-logo"]'));
    const monograms = Array.from(document.querySelectorAll('[data-testid="org-monogram"]'));

    const logoDetails = logos.map((el, i) => {
      const cs = getComputedStyle(el);
      const parentCard = el.closest('[data-card], .card, a, div.rounded, li, tr') || el.parentElement;
      return {
        index: i,
        tagName: el.tagName,
        src: el.getAttribute("src"),
        alt: el.getAttribute("alt"),
        filter: cs.filter,
        opacity: cs.opacity,
        hasGrayscale1: cs.filter.includes("grayscale(1)")
      };
    });

    const monogramDetails = monograms.map((el, i) => {
      const parentCard = el.closest('[data-card], .card, a, div.rounded, li, tr') || el.parentElement;
      const text = (parentCard ? parentCard.textContent : el.textContent).replace(/\s+/g, " ").trim();
      return {
        index: i,
        text: el.textContent.trim(),
        cardSnippet: text.slice(0, 60)
      };
    });

    return {
      logoCount: logos.length,
      monogramCount: monograms.length,
      logoDetails,
      monogramDetails
    };
  });

  results.watchlist.logoCount = wlData.logoCount;
  results.watchlist.monogramCount = wlData.monogramCount;
  results.watchlist.totalCards = wlData.logoCount + wlData.monogramCount;
  results.watchlist.allLogosGrayscale1 = wlData.logoDetails.every(l => l.hasGrayscale1);
  results.watchlist.logoFilterValues = [...new Set(wlData.logoDetails.map(l => l.filter))];
  results.watchlist.monogramDetails = wlData.monogramDetails;

  console.log(`Watchlist logos: ${wlData.logoCount}, monograms: ${wlData.monogramCount}, all grayscale(1): ${results.watchlist.allLogosGrayscale1}`);

  // Hover test on the first org card containing a logo
  const firstLogo = page.locator('[data-testid="org-logo"]').first();
  const filterBefore = await firstLogo.evaluate(el => getComputedStyle(el).filter);
  results.watchlist.firstCardHoverBeforeFilter = filterBefore;

  // Hover parent card or container of the first logo
  const firstCard = page.locator('li:has([data-testid="org-logo"]), [data-card]:has([data-testid="org-logo"]), a:has([data-testid="org-logo"]), div.rounded:has([data-testid="org-logo"])').first();
  await firstCard.hover();
  await page.waitForTimeout(300); // allow 150ms transition to settle

  const filterAfter = await firstLogo.evaluate(el => getComputedStyle(el).filter);
  results.watchlist.firstCardHoverAfterFilter = filterAfter;
  results.watchlist.hoverUnGrayscalePass = filterAfter.includes("grayscale(0)") || filterAfter === "none";

  console.log(`Hover test on first card: before="${filterBefore}" -> after="${filterAfter}" (pass: ${results.watchlist.hoverUnGrayscalePass})`);

  // Part 2: Chromatic scan on /watchlist/airev, /plugins, /graph
  const chromaticRoutes = ["/watchlist/airev", "/plugins", "/graph"];

  for (const r of chromaticRoutes) {
    console.log(`Scanning route for chromatic elements: ${BASE}${r}`);
    await page.goto(`${BASE}${r}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(800);

    const scanData = await page.evaluate(() => {
      const parse = (c) => {
        if (!c) return null;
        // Handle oklch or color formats if present
        if (c.startsWith("oklch")) {
          // parse oklch numbers: oklch(L C H [/ A])
          const parts = c.match(/[\d.]+/g);
          if (!parts || parts.length < 3) return null;
          return { type: "oklch", raw: c, l: parseFloat(parts[0]), c: parseFloat(parts[1]), h: parseFloat(parts[2]) };
        }
        const m = c.match(/[\d.]+/g);
        if (!m || m.length < 3) return null;
        const a = m.length > 3 ? parseFloat(m[3]) : 1;
        if (a === 0) return null;
        return { type: "rgb", raw: c, rgb: [+m[0], +m[1], +m[2]] };
      };

      const hex = ([r, g, b]) => "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
      const allowedHex = new Set(["#2563EB", "#B91C1C"]);

      const isChromaticRgb = (rgb) => {
        const diff = Math.max(...rgb) - Math.min(...rgb);
        return diff > 2 && !allowedHex.has(hex(rgb));
      };

      const elements = [];
      const nodes = document.querySelectorAll("body *");
      for (const el of nodes) {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (el.tagName === "IMG" || el.closest("img, picture, video, canvas")) continue;

        for (const prop of ["color", "backgroundColor"]) {
          const val = cs[prop];
          const parsed = parse(val);
          if (!parsed) continue;

          if (parsed.type === "rgb") {
            if (isChromaticRgb(parsed.rgb)) {
              elements.push({
                tag: el.tagName.toLowerCase(),
                className: typeof el.className === "string" ? el.className.slice(0, 100) : "",
                property: prop,
                computedValue: val,
                hex: hex(parsed.rgb),
                type: "rgb",
                text: el.textContent.trim().slice(0, 60)
              });
            }
          } else if (parsed.type === "oklch") {
            // In OKLCH, chroma C indicates color saturation. C < 0.01 is essentially neutral grey.
            // Let's record OKLCH values whether grey or chromatic
            const isNeutralOklch = parsed.c < 0.01;
            elements.push({
              tag: el.tagName.toLowerCase(),
              className: typeof el.className === "string" ? el.className.slice(0, 100) : "",
              property: prop,
              computedValue: val,
              oklchChroma: parsed.c,
              isNeutralOklch,
              type: "oklch",
              text: el.textContent.trim().slice(0, 60)
            });
          }
        }
      }

      return {
        elementCount: nodes.length,
        hits: elements
      };
    });

    results.chromatic.routes[r] = scanData;
    console.log(`Route ${r}: total scanned=${scanData.elementCount}, hits=${scanData.hits.length}`);
  }

} finally {
  await browser.close();
}

const outPath = path.join(OUT_DIR, "gate4-results.json");
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`Wrote results to ${outPath}`);
