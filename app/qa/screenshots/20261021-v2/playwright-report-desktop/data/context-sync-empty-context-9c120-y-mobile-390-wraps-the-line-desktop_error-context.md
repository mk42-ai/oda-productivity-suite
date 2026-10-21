# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: context-sync.spec.ts >> empty context → helper copy; mobile 390 wraps the line
- Location: e2e/context-sync.spec.ts:73:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByTestId('context-line')
Expected: "Context: none — pick up to 5 companies in the inspector"
Received: "Context: whole watchlist — pick organisations in the inspector to focus"
Timeout:  30000ms

Call log:
  - Expect "toHaveText" getByTestId('context-line') with timeout 30000ms
  - waiting for getByTestId('context-line')
    2 × locator resolved to <p data-count="5" aria-live="polite" class="oiu-context-line" data-testid="context-line">Context: 5 organisations — Technology Innovation …</p>
      - unexpected value "Context: 5 organisations — Technology Innovation Institute, G42, EDGE Group, Mohamed bin Zayed University of Artificial Intelligence, Core42"
    61 × locator resolved to <p data-count="0" aria-live="polite" class="oiu-context-line" data-testid="context-line">Context: whole watchlist — pick organisations in …</p>
       - unexpected value "Context: whole watchlist — pick organisations in the inspector to focus"

```

```yaml
- paragraph: "Context: whole watchlist — pick organisations in the inspector to focus"
```

# Test source

```ts
  1  | import { test, expect, type Page } from "@playwright/test";
  2  | import { primeSettings, COMPANIES } from "./helpers";
  3  | 
  4  | /**
  5  |  * unit2 — company context is in sync between the inspector chips, the "Context: N companies — …" line under the composer and the
  6  |  * `context.systemContext` actually POSTed to /api/chat. Removes one chip (MBZUAI), adds none, sends ONE turn with the request
  7  |  * intercepted (body captured, request continued, answer NOT awaited) and asserts the payload names exactly what the context line shows.
  8  |  * Run: cd web && BASE_URL=<frontend> node node_modules/@playwright/test/cli.js test e2e/context-sync.spec.ts --workers=1
  9  |  */
  10 | const NAMES: Record<string, string> = { "mbzuai": "MBZUAI", g42: "G42", "tii": "Technology Innovation Institute", edge: "EDGE Group", writer: "Space42" };
  11 | const namesFromLine = (txt: string) => (txt.split("—")[1] ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  12 | 
  13 | async function openInspector(page: Page) {
  14 |   const drawer = page.getByTestId("chat-inspector");
  15 |   if ((await drawer.getAttribute("data-open")) !== "true") await page.getByTestId("inspector-toggle").click();
  16 |   await expect(drawer).toHaveAttribute("data-open", "true", { timeout: 10_000 });
  17 |   return drawer;
  18 | }
  19 | 
  20 | test("context line + POST /api/chat systemContext mirror the inspector chips (remove one company)", async ({ page }) => {
  21 |   test.setTimeout(120_000);
  22 |   await primeSettings(page);
  23 |   await page.goto("/chat?skip=1");
  24 |   await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 30_000 });
  25 | 
  26 |   const line = page.getByTestId("context-line");
  27 |   await expect(line, "context-line renders under the composer").toBeVisible({ timeout: 15_000 });
  28 |   const before = (await line.textContent()) ?? "";
  29 |   console.log("[context-sync] before:", before);
  30 |   expect(before).toMatch(/^Context: 5 companies — /);
  31 |   for (const slug of COMPANIES) expect(before).toContain(NAMES[slug]);
  32 | 
  33 |   // Remove MBZUAI in the inspector → line updates live (no reload, no send)
  34 |   const drawer = await openInspector(page);
  35 |   const chips = drawer.locator('[data-testid="inspector-context"] [data-testid="company-chip"]');
  36 |   await expect(chips).toHaveCount(5, { timeout: 10_000 });
  37 |   await drawer.getByRole("button", { name: "Remove MBZUAI" }).click();
  38 |   await expect(chips).toHaveCount(4);
  39 |   await expect(line).toHaveText(/^Context: 4 companies — /, { timeout: 5_000 });
  40 |   const after = (await line.textContent()) ?? "";
  41 |   console.log("[context-sync] after remove:", after);
  42 |   expect(after).not.toContain("MBZUAI");
  43 |   const shown = namesFromLine(after);
  44 |   expect(shown).toEqual(["G42", "Technology Innovation Institute", "EDGE Group", "Space42"]);
  45 |   await page.getByTestId("inspector-close").click();
  46 | 
  47 |   // Intercept the POST /api/chat body: capture, continue, do not wait for the answer.
  48 |   let captured: { context?: { systemContext?: string; sessionContext?: { key: string }[]; contextSlugs?: string[] } } | null = null;
  49 |   const got = new Promise<void>((resolve) => {
  50 |     void page.route("**/api/chat", async (route) => {
  51 |       const req = route.request();
  52 |       if (req.method() === "POST" && !captured) { try { captured = req.postDataJSON(); } catch { captured = null; } resolve(); }
  53 |       await route.continue();
  54 |     });
  55 |   });
  56 |   await page.getByTestId("composer-input").fill("One line: which context company has the highest sentiment score?");
  57 |   await page.getByTestId("composer-send").click();
  58 |   await Promise.race([got, page.waitForTimeout(30_000)]);
  59 |   expect(captured, "POST /api/chat body captured").toBeTruthy();
  60 |   const sc = captured!.context?.systemContext ?? "";
  61 |   console.log("[context-sync] systemContext chars:", sc.length, "slugs:", JSON.stringify(captured!.context?.contextSlugs ?? null));
  62 |   for (const n of shown) expect(sc, `systemContext names ${n}`).toContain(n);
  63 |   expect(sc, "removed company must NOT be sent").not.toContain("MBZUAI");
  64 |   expect(sc).toContain("sentiment_score");
  65 |   expect(sc).toContain("sentiment_delta_vs_prior_run");
  66 |   const keys = (captured!.context?.sessionContext ?? []).map((c) => c.key);
  67 |   expect(keys).toEqual(["company:g42", "company:tii", "company:edge", "company:writer"]);
  68 |   // stop the run so the spec does not wait on the model
  69 |   const stop = page.getByTestId("composer-send");
  70 |   if ((await stop.getAttribute("aria-label")) === "Cancel message") await stop.click().catch(() => {});
  71 | });
  72 | 
  73 | test("empty context → helper copy; mobile 390 wraps the line", async ({ page }) => {
  74 |   test.setTimeout(60_000);
  75 |   await page.setViewportSize({ width: 390, height: 844 });
  76 |   await primeSettings(page, { companies: [] });
  77 |   await page.goto("/chat?skip=1");
  78 |   const line = page.getByTestId("context-line");
> 79 |   await expect(line).toHaveText("Context: none — pick up to 5 companies in the inspector", { timeout: 30_000 });
     |                      ^ Error: expect(locator).toHaveText(expected) failed
  80 |   const ws = await line.evaluate((el) => getComputedStyle(el).whiteSpace);
  81 |   expect(ws).not.toBe("nowrap");
  82 | });
  83 | 
```