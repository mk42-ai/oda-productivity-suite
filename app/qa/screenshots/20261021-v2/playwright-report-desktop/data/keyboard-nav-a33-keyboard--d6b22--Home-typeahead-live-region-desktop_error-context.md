# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: keyboard-nav.spec.ts >> a33 keyboard nav >> companies: roving tabindex, arrows, Home, typeahead, live region
- Location: e2e/keyboard-nav.spec.ts:21:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('company-row-link').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByTestId('company-row-link').first() with timeout 15000ms
  - waiting for getByTestId('company-row-link').first()

```

```yaml
- link "Skip to main content":
  - /url: "#main"
- note "Disclaimer": UAE AI Intelligence — Concept Demonstration Not an official government system · Public-source data, as of 21 Oct 2026 · No government logo or endorsement implied
- complementary "Primary navigation":
  - link "UAE AI Command Centre Concept demonstration UAE AI National Intelligence Command Centre — concept demonstration, not an official government system Home":
    - /url: /overview
  - button "Collapse navigation" [expanded]
  - navigation "Primary":
    - link "National Overview":
      - /url: /overview
    - link "Watchlist":
      - /url: /watchlist
    - link "Sentiment Universe":
      - /url: /sentiment
    - link "News Intelligence":
      - /url: /news
    - link "Tech Radar":
      - /url: /radar
    - link "Ecosystem Graph":
      - /url: /graph
    - link "Executive Chat":
      - /url: /chat
    - link "National Briefing":
      - /url: /briefing
    - link "Artifacts":
      - /url: /artifacts
    - link "Methodology":
      - /url: /methodology
    - link "Settings":
      - /url: /settings
  - button "Search organisations (Ctrl or Cmd + K)": Search ⌘K
  - button "Switch to dark mode": Dark
  - text: Namespace
  - code: uae_cc_v1
  - text: 50 orgs · 196 voices · 105 news
- main:
  - status:
    - heading "Page not found" [level=1]
    - paragraph: The link may be old, or the page moved. The National Overview is one click away.
    - link "National Overview":
      - /url: /overview
    - link "Watchlist":
      - /url: /watchlist
- contentinfo:
  - strong: Concept Demonstration — not an official government system.
  - text: Public sources only · no government logo or endorsement implied. Data namespace uae_cc_v1 · as of 2026-10-21 ·
  - link "Methodology & limitations":
    - /url: /methodology
  - text: "Intelligence engine: OnDemand (AIREV) v1.0.0 · local · last updated"
  - time: 2026-10-21 10:29 UTC
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1  | import { test, expect } from "./helpers";
  2  | 
  3  | /** a33 — roving tabindex + typeahead on /companies, arrow-key nav on the rail, brand-green (#0AC985) focus rings everywhere. */
  4  | const activeInfo = () => {
  5  |   const el = document.activeElement as HTMLElement | null;
  6  |   const cs = el ? getComputedStyle(el) : null;
  7  |   return { testid: el?.dataset.testid ?? null, name: el?.textContent?.trim() ?? "", outline: cs?.outlineColor ?? "", width: cs?.outlineWidth ?? "" };
  8  | };
  9  | const isBlue = (rgb: string) => {
  10 |   const m = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/); if (!m) return false;
  11 |   const [r, g, b] = [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255];
  12 |   const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min; if (d < 0.15) return false;
  13 |   let h = 0; if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
  14 |   h = (h * 60 + 360) % 360; const s = max === 0 ? 0 : d / max;
  15 |   return h >= 190 && h <= 260 && s > 0.15;
  16 | };
  17 | 
  18 | test.describe("a33 keyboard nav", () => {
  19 |   test.use({ viewport: { width: 1440, height: 900 } });
  20 | 
  21 |   test("companies: roving tabindex, arrows, Home, typeahead, live region", async ({ page }) => {
  22 |     await page.goto("/companies?skip=1");
  23 |     const links = page.getByTestId("company-row-link");
> 24 |     await expect(links.first()).toBeVisible();
     |                                 ^ Error: expect(locator).toBeVisible() failed
  25 |     // exactly one row link is tabbable
  26 |     expect(await page.locator('[data-testid="company-row-link"][tabindex="0"]').count()).toBe(1);
  27 |     // Tab until the first row link is focused (toolbar controls come first)
  28 |     let info = { testid: null as string | null, name: "", outline: "", width: "" };
  29 |     for (let i = 0; i < 20 && info.testid !== "company-row-link"; i++) { await page.keyboard.press("Tab"); info = await page.evaluate(activeInfo); }
  30 |     expect(info.testid).toBe("company-row-link");
  31 |     const firstName = info.name;
  32 |     for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowDown");
  33 |     await page.waitForTimeout(150);
  34 |     info = await page.evaluate(activeInfo);
  35 |     expect(info.testid).toBe("company-row-link");
  36 |     expect(info.outline).toContain("10, 201, 133");
  37 |     expect(info.name).not.toBe(firstName);
  38 |     expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.index)).toBe("3");
  39 |     await expect(page.getByTestId("companies-live")).toHaveText(/Row 4 of \d+/);
  40 |     expect(await page.locator('[data-testid="company-row-link"][tabindex="0"]').count()).toBe(1);
  41 |     await page.keyboard.press("Home");
  42 |     await page.waitForTimeout(200);
  43 |     info = await page.evaluate(activeInfo);
  44 |     expect(info.testid).toBe("company-row-link");
  45 |     expect(info.name).toBe(firstName);
  46 |     // typeahead: "f" → next company starting with F (skipped if the portfolio has none)
  47 |     const hasF = await page.evaluate(() => JSON.parse(document.querySelector('[data-testid="companies-data"]')!.textContent!).some((n: string) => /^f/i.test(n)));
  48 |     test.skip(!hasF, "no company starting with F");
  49 |     await page.keyboard.press("f");
  50 |     await page.waitForTimeout(250);
  51 |     info = await page.evaluate(activeInfo);
  52 |     expect(info.testid).toBe("company-row-link");
  53 |     expect(info.name.toUpperCase().startsWith("F")).toBe(true);
  54 |     expect(info.outline).toContain("10, 201, 133");
  55 |   });
  56 | 
  57 |   test("nav rail: Tab + arrows, no blue focus ring anywhere", async ({ page }) => {
  58 |     await page.goto("/overview?skip=1");
  59 |     await expect(page.getByTestId("nav-overview")).toBeVisible();
  60 |     const seen: { testid: string | null; outline: string }[] = [];
  61 |     for (let i = 0; i < 14; i++) {
  62 |       await page.keyboard.press("Tab");
  63 |       const info = await page.evaluate(activeInfo);
  64 |       seen.push({ testid: info.testid, outline: info.outline });
  65 |       expect(isBlue(info.outline), `blue focus ring on ${info.testid}: ${info.outline}`).toBe(false);
  66 |       if (info.testid === "nav-settings") break;
  67 |     }
  68 |     expect(seen.some((s) => s.testid === "nav-overview")).toBe(true);
  69 |     await page.getByTestId("nav-overview").focus();
  70 |     await page.keyboard.press("ArrowDown");
  71 |     expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.testid)).toBe("nav-companies");
  72 |     await page.keyboard.press("End");
  73 |     expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.testid)).toBe("nav-settings");
  74 |     await page.keyboard.press("ArrowDown");
  75 |     expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.testid)).toBe("nav-overview");
  76 |     await page.keyboard.press("Home");
  77 |     const home = await page.evaluate(activeInfo);
  78 |     expect(home.testid).toBe("nav-overview");
  79 |     expect(home.outline).toContain("10, 201, 133");
  80 |   });
  81 | });
  82 | 
```