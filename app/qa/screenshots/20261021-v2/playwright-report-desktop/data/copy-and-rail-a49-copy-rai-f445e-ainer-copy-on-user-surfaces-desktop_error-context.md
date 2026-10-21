# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: copy-and-rail.spec.ts >> a49 copy + rail >> /chat: no lede under the title, no explainer copy on user surfaces
- Location: e2e/copy-and-rail.spec.ts:48:7

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: getByTestId('chat-title')
Expected pattern: /^Chat$/
Received string:  "Executive Intelligence Chat"
Timeout: 15000ms

Call log:
  - Expect "toHaveText" getByTestId('chat-title') with timeout 15000ms
  - waiting for getByTestId('chat-title')
    34 × locator resolved to <h1 data-testid="chat-title" class="oiu-topbar__title" title="Executive Intelligence Chat" aria-label="Executive Intelligence Chat">…</h1>
       - unexpected value "Executive Intelligence Chat"

```

```yaml
- heading "Executive Intelligence Chat" [level=1]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { primeSettings } from "./helpers";
  3  | 
  4  | /**
  5  |  * a49 — copy pass + nav rail contract (desktop 1440×900).
  6  |  *  - rail bounding width ≤224 expanded, ≤64 collapsed after clicking `rail-toggle`; the choice persists across reload; `aria-expanded` tracks it.
  7  |  *  - developer/explainer copy is gone from user surfaces: "Why it's interactive" (only behind dev-disclosure), "Answers stream from".
  8  |  *  - the brand line "Catalysts. Questioners. Visionaries." is still present (onboarding).
  9  |  *  - /chat has no lede paragraph under the title; /overview and /news ledes are short.
  10 |  */
  11 | test.describe("a49 copy + rail", () => {
  12 |   test.use({ viewport: { width: 1440, height: 900 } });
  13 | 
  14 |   test("rail ≤224 expanded / ≤64 collapsed via rail-toggle, persisted", async ({ page }) => {
  15 |     await primeSettings(page);
  16 |     await page.goto("/overview");
  17 |     const rail = page.getByTestId("nav-rail");
  18 |     await expect(rail).toBeVisible();
  19 |     await expect(rail).toHaveAttribute("data-mounted", "true", { timeout: 15_000 });
  20 |     const toggle = page.getByTestId("rail-toggle");
  21 |     await expect(toggle).toBeVisible();
  22 |     // Normalise to expanded first (a previous run may have persisted "collapsed").
  23 |     if ((await rail.getAttribute("data-collapsed")) === "true") await toggle.click();
  24 |     await expect(rail).toHaveAttribute("data-collapsed", "false");
  25 |     await expect(toggle).toHaveAttribute("aria-expanded", "true");
  26 |     await page.waitForTimeout(400);
  27 |     const wExp = (await rail.boundingBox())!.width;
  28 |     expect(wExp, "expanded width ≤224").toBeLessThanOrEqual(224);
  29 |     const railW = await rail.evaluate((el) => getComputedStyle(el).getPropertyValue("--rail-w").trim());
  30 |     expect(railW, "--rail-w css var").toBe("224px");
  31 | 
  32 |     await toggle.click();
  33 |     await expect(rail).toHaveAttribute("data-collapsed", "true");
  34 |     await expect(toggle).toHaveAttribute("aria-expanded", "false");
  35 |     await page.waitForTimeout(400);
  36 |     const wCol = (await rail.boundingBox())!.width;
  37 |     expect(wCol, "collapsed width ≤64").toBeLessThanOrEqual(64);
  38 |     expect(wCol).toBeLessThan(wExp);
  39 | 
  40 |     await page.reload();
  41 |     await expect(rail).toHaveAttribute("data-mounted", "true", { timeout: 15_000 });
  42 |     await expect(rail).toHaveAttribute("data-collapsed", "true");
  43 |     await page.waitForTimeout(400);
  44 |     expect((await rail.boundingBox())!.width, "collapsed persisted across reload").toBeLessThanOrEqual(64);
  45 |     await expect(page.getByTestId("rail-toggle")).toHaveAttribute("aria-expanded", "false");
  46 |   });
  47 | 
  48 |   test("/chat: no lede under the title, no explainer copy on user surfaces", async ({ page }) => {
  49 |     await primeSettings(page);
  50 |     await page.goto("/chat");
  51 |     const title = page.getByTestId("chat-title");
  52 |     await expect(title).toBeVisible({ timeout: 20_000 });
> 53 |     await expect(title).toHaveText(/^Chat$/);
     |                         ^ Error: expect(locator).toHaveText(expected) failed
  54 |     // No PageHeader lede: no <p> directly following an h1 anywhere on the route.
  55 |     const ledes = await page.locator("h1 + p").count();
  56 |     expect(ledes, "no lede paragraph under the /chat title").toBe(0);
  57 |     const body = page.locator("body");
  58 |     // innerText = what the user can read (closed <details> / hidden drawers are excluded).
  59 |     await expect(body).not.toContainText("Answers stream from", { useInnerText: true });
  60 |     await expect(body).not.toContainText("Shift+Enter", { useInnerText: true });
  61 |     // Explainer card only behind the single developer reveal (dev-disclosure in run-rail) — never visible by default.
  62 |     await expect(page.getByTestId("why-interactive")).toBeHidden();
  63 |     await expect(body).not.toContainText("Why it’s interactive", { useInnerText: true });
  64 |     await expect(body).not.toContainText("Why it's interactive", { useInnerText: true });
  65 |     await expect(page.getByTestId("composer-hint")).toContainText("Enter to send");
  66 |   });
  67 | 
  68 |   test("overview/news ledes are short; brand line still present on onboarding", async ({ page }) => {
  69 |     await primeSettings(page);
  70 |     await page.goto("/overview");
  71 |     await expect(page.getByRole("heading", { level: 1, name: "Overview", exact: true })).toBeVisible();
  72 |     const lede = page.locator("h1 + p").first();
  73 |     await expect(lede).toBeVisible();
  74 |     const words = ((await lede.textContent()) ?? "").trim().split(/\s+/).length;
  75 |     expect(words, "overview lede ≤12 words").toBeLessThanOrEqual(12);
  76 | 
  77 |     await page.goto("/news");
  78 |     await expect(page.getByRole("heading", { level: 1, name: "News Pulse" })).toBeVisible();
  79 |     await expect(page.locator("h1 + p").first()).toHaveText(/^\d[\d,]* items · \d+ companies · daily 06:00 UTC$/);
  80 | 
  81 |     // Onboarding (not primed): brand line is kept.
  82 |     const fresh = await page.context().browser()!.newContext({ viewport: { width: 1440, height: 900 } });
  83 |     const p2 = await fresh.newPage();
  84 |     await p2.goto("/");
  85 |     await expect(p2.locator("body")).toContainText("Catalysts. Questioners. Visionaries.", { timeout: 20_000 });
  86 |     await fresh.close();
  87 |   });
  88 | });
  89 | 
```