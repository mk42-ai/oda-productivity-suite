# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-smoke.spec.ts >> live smoke 1440x900 >> route /reputation
- Location: e2e/live-smoke.spec.ts:30:11

# Error details

```
Error: /reputation

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 404
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=e3]:
    - note "Disclaimer" [ref=e4]:
      - generic [ref=e5]: UAE AI Intelligence — Concept Demonstration
      - generic [aria-hidden] [ref=e6]: ·
      - generic [ref=e7]: Not an official government system
      - generic [ref=e8]: · Public-source data, as of 21 Oct 2026 · No government logo or endorsement implied
    - generic [ref=e9]:
      - complementary "Primary navigation" [ref=e10]:
        - generic [ref=e11]:
          - link "UAE AI Command Centre Concept demonstration UAE AI National Intelligence Command Centre — concept demonstration, not an official government system Home" [ref=e12] [cursor=pointer]:
            - /url: /overview
            - generic [ref=e13]:
              - generic [ref=e15]:
                - generic [ref=e16]: UAE AI Command Centre
                - generic [ref=e17]: Concept demonstration
              - generic [ref=e18]: UAE AI National Intelligence Command Centre — concept demonstration, not an official government system
            - generic [ref=e19]: Home
          - button "Collapse navigation" [expanded] [ref=e21] [cursor=pointer]
        - navigation "Primary" [ref=e25]:
          - link "National Overview" [ref=e26] [cursor=pointer]:
            - /url: /overview
          - link "Watchlist" [ref=e33] [cursor=pointer]:
            - /url: /watchlist
          - link "Sentiment Universe" [ref=e39] [cursor=pointer]:
            - /url: /sentiment
          - link "News Intelligence" [ref=e47] [cursor=pointer]:
            - /url: /news
          - link "Tech Radar" [ref=e52] [cursor=pointer]:
            - /url: /radar
          - link "Ecosystem Graph" [ref=e61] [cursor=pointer]:
            - /url: /graph
          - link "Executive Chat" [ref=e69] [cursor=pointer]:
            - /url: /chat
          - link "National Briefing" [ref=e73] [cursor=pointer]:
            - /url: /briefing
          - link "Artifacts" [ref=e78] [cursor=pointer]:
            - /url: /artifacts
          - link "Methodology" [ref=e83] [cursor=pointer]:
            - /url: /methodology
          - link "Settings" [ref=e87] [cursor=pointer]:
            - /url: /settings
        - button "Search organisations (Ctrl or Cmd + K)" [ref=e92]:
          - generic [ref=e95]: Search ⌘K
        - generic [ref=e96]:
          - button "Switch to dark mode" [ref=e97]:
            - generic [ref=e100]: Dark
          - generic "namespace uae_cc_v1 · generated 2026-10-21T04:30:00Z" [ref=e102]:
            - generic [ref=e103]:
              - text: Namespace
              - code [ref=e105]: uae_cc_v1
            - generic [ref=e106]: 50 orgs · 196 voices · 105 news
      - generic [ref=e107]:
        - main [ref=e108]:
          - status [ref=e109]:
            - heading "Page not found" [level=1] [ref=e110]
            - paragraph [ref=e111]: The link may be old, or the page moved. The National Overview is one click away.
            - generic [ref=e112]:
              - link "National Overview" [ref=e113] [cursor=pointer]:
                - /url: /overview
              - link "Watchlist" [ref=e114] [cursor=pointer]:
                - /url: /watchlist
        - contentinfo [ref=e115]:
          - generic [ref=e116]:
            - generic [ref=e117]:
              - strong [ref=e118]: Concept Demonstration — not an official government system.
              - text: Public sources only · no government logo or endorsement implied.
            - generic [ref=e119]:
              - text: Data namespace uae_cc_v1 · as of 2026-10-21 ·
              - link "Methodology & limitations" [ref=e120] [cursor=pointer]:
                - /url: /methodology
            - generic [ref=e121]: "Intelligence engine: OnDemand (AIREV)"
            - generic [ref=e124]:
              - text: v1.0.0 · local · last updated
              - time [ref=e125]: 2026-10-21 10:29 UTC
  - region "Notifications alt+T"
  - alert [ref=e126]
```

# Test source

```ts
  1   | import { test, expect, primeSettings, captureErrors, noHorizontalOverflow } from "./helpers";
  2   | import fs from "node:fs";
  3   | import path from "node:path";
  4   | 
  5   | const PROOF = process.env.PROOF_DIR || path.join(process.cwd(), "..", "..", ".ui-proof");
  6   | fs.mkdirSync(PROOF, { recursive: true });
  7   | const HAS_KEY = !!(process.env.ONDEMAND_API_KEY ?? process.env.ON_DEMAND_API_KEY ?? "");
  8   | const RAW = "the answer could not be completed";
  9   | const FAIL = [`data: ${JSON.stringify({type:"RUN_STARTED",threadId:"t",runId:"r1"})}`,`data: ${JSON.stringify({type:"RUN_ERROR",message:"The answer could not be completed",code:"upstream_http"})}`,"data: [DONE]",""].join("\n")+"\n";
  10  | const OK = [`data: ${JSON.stringify({type:"RUN_STARTED",threadId:"t",runId:"r2"})}`,`data: ${JSON.stringify({type:"TEXT_MESSAGE_START",messageId:"m1"})}`,`data: ${JSON.stringify({type:"TEXT_MESSAGE_CONTENT",messageId:"m1",delta:"Retry succeeded: Technology Innovation Institute is a geothermal company in the portfolio."})}`,`data: ${JSON.stringify({type:"TEXT_MESSAGE_END",messageId:"m1"})}`,`data: ${JSON.stringify({type:"RUN_FINISHED",threadId:"t",runId:"r2"})}`,"data: [DONE]",""].join("\n")+"\n";
  11  | 
  12  | const ROUTES = [
  13  |   { p: "/", name: "root", final: "/overview" },
  14  |   { p: "/overview", name: "overview" },
  15  |   { p: "/companies", name: "companies" },
  16  |   { p: "/social", name: "social" },
  17  |   { p: "/signals", name: "signals" },
  18  |   { p: "/reputation", name: "reputation" },
  19  |   { p: "/docs/interactive-ui", name: "docs-interactive-ui" },
  20  | ] as const;
  21  | /** Snapshot-demo markers that must never surface again (the removed Lambda snapshot / Intelligent-UI payload demos). */
  22  | const DEMO = /Analyze Lambda|Lambda snapshot|latest funding, news citations|TOP CONTRIBUTING CITATIONS|PORTFOLIO COMPANY & SENTIMENT PROVENANCE|snapshot demo/i;
  23  | 
  24  | for (const vp of [{ w: 1440, h: 900, label: "1440x900" }, { w: 390, h: 844, label: "390x844" }] as const) {
  25  |   test.describe(`live smoke ${vp.label}`, () => {
  26  |     test.use({ viewport: { width: vp.w, height: vp.h } });
  27  |     test.beforeEach(async ({ page }) => { await primeSettings(page); });
  28  | 
  29  |     for (const r of ROUTES) {
  30  |       test(`route ${r.p}`, async ({ page }) => {
  31  |         const errs = captureErrors(page);
  32  |         const resp = await page.goto(r.p);
> 33  |         expect(resp?.status(), r.p).toBe(200);
      |                                     ^ Error: /reputation
  34  |         await page.waitForLoadState("networkidle").catch(() => {});
  35  |         if ("final" in r && r.final) await expect(page).toHaveURL(new RegExp(r.final.replace("/", "\\/") + "$"));
  36  |         expect(await page.locator("body").innerText()).not.toHaveLength(0);
  37  |         expect(await noHorizontalOverflow(page), "no horizontal overflow").toBe(true);
  38  |         await page.screenshot({ path: path.join(PROOF, `live-${r.name}-${vp.label}.png`) });
  39  |         expect(errs).toEqual([]);
  40  |       });
  41  |     }
  42  | 
  43  |     test("bad urls are 404", async ({ page }) => {
  44  |       for (const [i, b] of ["/this-route-does-not-exist-smoke", "/companies/nope/definitely-bad", "/company/does-not-exist-zz"].entries()) {
  45  |         const resp = await page.goto(b);
  46  |         expect(resp?.status(), b).toBe(404);
  47  |         await expect(page.getByText(/not found/i).first()).toBeVisible();
  48  |         if (i === 0) await page.screenshot({ path: path.join(PROOF, `live-notfound-${vp.label}.png`) });
  49  |       }
  50  |     });
  51  | 
  52  |     test("nav links + back/forward", async ({ page }) => {
  53  |       const errs = captureErrors(page);
  54  |       await page.goto("/overview");
  55  |       const nav = page.getByTestId("primary-nav");
  56  |       await nav.getByTestId("nav-companies").scrollIntoViewIfNeeded();
  57  |       await nav.getByTestId("nav-companies").click(); await expect(page).toHaveURL(/\/companies/);
  58  |       await nav.getByTestId("nav-social").scrollIntoViewIfNeeded();
  59  |       await nav.getByTestId("nav-social").click(); await expect(page).toHaveURL(/\/social/);
  60  |       await page.goBack(); await expect(page).toHaveURL(/\/companies/);
  61  |       await page.goForward(); await expect(page).toHaveURL(/\/social/);
  62  |       await expect(nav.getByTestId("nav-social")).toHaveAttribute("aria-current", "page");
  63  |       await page.screenshot({ path: path.join(PROOF, `live-backforward-${vp.label}.png`) });
  64  |       expect(errs).toEqual([]);
  65  |     });
  66  | 
  67  |     test("preserved surfaces: docs + GROWTH", async ({ page }) => {
  68  |       await page.goto("/docs/interactive-ui");
  69  |       await expect(page.locator("body")).toContainText(/Synergy matrix|Why the chat is interactive/i);
  70  |       await primeSettings(page, { onboarded: false, companies: [] });
  71  |       await page.goto("/onboarding?skip=1");
  72  |       const first = page.locator('[data-testid="growth-value"]').first();
  73  |       await expect(page.locator('[data-testid="growth-grid"]')).toBeVisible();
  74  |       await first.click(); await expect(first).toHaveAttribute("aria-expanded", "true");
  75  |       await page.screenshot({ path: path.join(PROOF, `live-growth-${vp.label}.png`) });
  76  |     });
  77  | 
  78  |     test("no snapshot/Lambda demo on playground or chat", async ({ page }) => {
  79  |       await page.goto("/docs/interactive-ui");
  80  |       await expect(page.getByTestId("synergy-table")).toBeVisible();
  81  |       const docs = await page.locator("body").innerText();
  82  |       expect(docs).not.toMatch(DEMO);
  83  |       expect(await page.locator('[data-testid*="snapshot"], [data-testid*="provenance-deck"], [data-testid*="payload-"]').count()).toBe(0);
  84  |       await page.screenshot({ path: path.join(PROOF, `live-playground-no-snapshots-${vp.label}.png`) });
  85  |       await page.goto("/chat?skip=1");
  86  |       await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 30_000 });
  87  |       const starters = await page.getByTestId("welcome-starters").innerText().catch(() => "");
  88  |       expect(starters).not.toMatch(/lambda|snapshot/i);
  89  |       expect(await page.locator("body").innerText()).not.toMatch(DEMO);
  90  |       await page.screenshot({ path: path.join(PROOF, `live-chat-no-snapshots-${vp.label}.png`) });
  91  |     });
  92  | 
  93  |     test("company #news deep link lands on the news section", async ({ page }) => {
  94  |       const errs = captureErrors(page);
  95  |       await page.goto("/company/tii#news");
  96  |       await expect.poll(async () => page.locator("#news").evaluate((el) => Math.round(el.getBoundingClientRect().top)), { timeout: 15_000 }).toBeLessThan(vp.h);
  97  |       await page.screenshot({ path: path.join(PROOF, `live-news-anchor-${vp.label}.png`) });
  98  |       expect(errs).toEqual([]);
  99  |     });
  100 | 
  101 |     test("chat actual request 200 + answer", async ({ page }) => {
  102 |       test.skip(!HAS_KEY, "no ONDEMAND key in runner env");
  103 |       const errs = captureErrors(page);
  104 |       let status = 0;
  105 |       page.on("response", (r) => { if (r.url().includes("/api/chat") && r.request().method() === "POST") status = r.status(); });
  106 |       await page.goto("/chat?skip=1");
  107 |       await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 30_000 });
  108 |       await page.getByTestId("composer-input").fill("Tell me about Technology Innovation Institute in one line.");
  109 |       await page.getByTestId("composer-send").click();
  110 |       await expect.poll(() => status, { timeout: 90_000 }).toBe(200);
  111 |       await expect(page.locator("body")).toContainText(/Fervo/i, { timeout: 90_000 });
  112 |       await page.screenshot({ path: path.join(PROOF, `live-chat-${vp.label}.png`) });
  113 |       expect(errs).toEqual([]);
  114 |     });
  115 | 
  116 |     test("discreet retry: forced failure, no raw in DOM, retry recovers", async ({ page }) => {
  117 |       let posts = 0;
  118 |       await page.route("**/api/chat", async (route) => {
  119 |         if (route.request().method() === "POST") { posts++; await route.fulfill({ status: 200, contentType: "text/event-stream", body: FAIL }); } else await route.continue();
  120 |       });
  121 |       await page.goto("/chat?skip=1");
  122 |       await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 30_000 });
  123 |       await page.getByTestId("composer-input").fill("Tell me about Technology Innovation Institute in one line.");
  124 |       await page.getByTestId("composer-send").click();
  125 |       const notice = page.getByTestId("chat-error");
  126 |       await expect(notice).toBeVisible({ timeout: 30_000 });
  127 |       await expect(notice).toContainText("Response failed");
  128 |       await expect(page.getByTestId("chat-error-retry")).toBeVisible();
  129 |       const innerText = (await page.locator("body").innerText()).toLowerCase();
  130 |       expect(innerText).not.toContain(RAW);
  131 |       const domProbe = await page.evaluate((raw) => {
  132 |         const html = document.documentElement.innerHTML.toLowerCase();
  133 |         const lib = Array.from(document.querySelectorAll(".openui-agent-thread-error")).map((el) => {
```