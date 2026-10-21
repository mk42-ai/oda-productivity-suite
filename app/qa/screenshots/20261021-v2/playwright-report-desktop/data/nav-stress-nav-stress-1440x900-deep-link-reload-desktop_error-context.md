# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: nav-stress.spec.ts >> nav stress @1440x900 >> deep-link-reload
- Location: e2e/nav-stress.spec.ts:94:9

# Error details

```
Error: /companies

expect(received).toBeLessThan(expected)

Expected: < 400
Received:   404
```

```
Error: /companies reload

expect(received).toBeLessThan(expected)

Expected: < 400
Received:   404
```

```
Error: /social

expect(received).toBeLessThan(expected)

Expected: < 400
Received:   404
```

```
Error: /social reload

expect(received).toBeLessThan(expected)

Expected: < 400
Received:   404
```

```
Error: /signals

expect(received).toBeLessThan(expected)

Expected: < 400
Received:   404
```

```
Error: /signals reload

expect(received).toBeLessThan(expected)

Expected: < 400
Received:   404
```

```
Error: /reputation

expect(received).toBeLessThan(expected)

Expected: < 400
Received:   404
```

```
Error: /reputation reload

expect(received).toBeLessThan(expected)

Expected: < 400
Received:   404
```

```
Error: /company/tii

expect(received).toBeLessThan(expected)

Expected: < 400
Received:   404
```

```
Error: /company/tii reload

expect(received).toBeLessThan(expected)

Expected: < 400
Received:   404
```

```
Error: /company/tii#news reload

expect(received).toBeLessThan(expected)

Expected: < 400
Received:   404
```

# Page snapshot

```yaml
- generic [active] [ref=f20e1]:
  - link "Skip to main content" [ref=f20e2] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=f20e3]:
    - note "Disclaimer" [ref=f20e4]:
      - generic [ref=f20e5]: UAE AI Intelligence — Concept Demonstration
      - generic [aria-hidden] [ref=f20e6]: ·
      - generic [ref=f20e7]: Not an official government system
      - generic [ref=f20e8]: · Public-source data, as of 21 Oct 2026 · No government logo or endorsement implied
    - generic [ref=f20e9]:
      - complementary "Primary navigation" [ref=f20e10]:
        - generic [ref=f20e11]:
          - link "UAE AI Command Centre Concept demonstration UAE AI National Intelligence Command Centre — concept demonstration, not an official government system Home" [ref=f20e12] [cursor=pointer]:
            - /url: /overview
            - generic [ref=f20e13]:
              - generic [ref=f20e15]:
                - generic [ref=f20e16]: UAE AI Command Centre
                - generic [ref=f20e17]: Concept demonstration
              - generic [ref=f20e18]: UAE AI National Intelligence Command Centre — concept demonstration, not an official government system
            - generic [ref=f20e19]: Home
          - button "Collapse navigation" [expanded] [ref=f20e21] [cursor=pointer]
        - navigation "Primary" [ref=f20e25]:
          - link "National Overview" [ref=f20e26] [cursor=pointer]:
            - /url: /overview
          - link "Watchlist" [ref=f20e33] [cursor=pointer]:
            - /url: /watchlist
          - link "Sentiment Universe" [ref=f20e39] [cursor=pointer]:
            - /url: /sentiment
          - link "News Intelligence" [ref=f20e47] [cursor=pointer]:
            - /url: /news
          - link "Tech Radar" [ref=f20e52] [cursor=pointer]:
            - /url: /radar
          - link "Ecosystem Graph" [ref=f20e61] [cursor=pointer]:
            - /url: /graph
          - link "Executive Chat" [ref=f20e69] [cursor=pointer]:
            - /url: /chat
          - link "National Briefing" [ref=f20e73] [cursor=pointer]:
            - /url: /briefing
          - link "Artifacts" [ref=f20e78] [cursor=pointer]:
            - /url: /artifacts
          - link "Methodology" [ref=f20e83] [cursor=pointer]:
            - /url: /methodology
          - link "Settings" [ref=f20e87] [cursor=pointer]:
            - /url: /settings
        - button "Search organisations (Ctrl or Cmd + K)" [ref=f20e92]:
          - generic [ref=f20e95]: Search ⌘K
        - generic [ref=f20e96]:
          - button "Switch to dark mode" [ref=f20e97]:
            - generic [ref=f20e100]: Dark
          - generic "namespace uae_cc_v1 · generated 2026-10-21T04:30:00Z" [ref=f20e102]:
            - generic [ref=f20e103]:
              - text: Namespace
              - code [ref=f20e105]: uae_cc_v1
            - generic [ref=f20e106]: 50 orgs · 196 voices · 105 news
      - generic [ref=f20e107]:
        - main [ref=f20e108]:
          - status [ref=f20e109]:
            - heading "Page not found" [level=1] [ref=f20e110]
            - paragraph [ref=f20e111]: The link may be old, or the page moved. The National Overview is one click away.
            - generic [ref=f20e112]:
              - link "National Overview" [ref=f20e113] [cursor=pointer]:
                - /url: /overview
              - link "Watchlist" [ref=f20e114] [cursor=pointer]:
                - /url: /watchlist
        - contentinfo [ref=f20e115]:
          - generic [ref=f20e116]:
            - generic [ref=f20e117]:
              - strong [ref=f20e118]: Concept Demonstration — not an official government system.
              - text: Public sources only · no government logo or endorsement implied.
            - generic [ref=f20e119]:
              - text: Data namespace uae_cc_v1 · as of 2026-10-21 ·
              - link "Methodology & limitations" [ref=f20e120] [cursor=pointer]:
                - /url: /methodology
            - generic [ref=f20e121]: "Intelligence engine: OnDemand (AIREV)"
            - generic [ref=f20e124]:
              - text: v1.0.0 · local · last updated
              - time [ref=f20e125]: 2026-10-21 10:29 UTC
  - region "Notifications alt+T"
  - alert [ref=f20e126]
```

# Test source

```ts
  1   | import { test, expect, type Page, type TestInfo } from "@playwright/test";
  2   | import fs from "node:fs";
  3   | import path from "node:path";
  4   | import { primeSettings } from "./helpers";
  5   | 
  6   | /**
  7   |  * Navigation stress harness (2026-10-16). Hammers the App Router with the crash classes seen in production:
  8   |  * rapid nav clicks, back/forward spam, deep-link reloads, navigating with a drawer open, navigating mid-stream,
  9   |  * GROWTH tile mid-navigation, #news anchor, /signals and bad URLs — at 1440x900 and 390x844.
  10  |  *
  11  |  * Every pageerror (with stack), console error, hydration warning, unhandled rejection and error-boundary paint is
  12  |  * recorded as an event (route + stack) instead of failing fast, so one run covers every scenario. Each test then
  13  |  * asserts ZERO events; the JSONL ledger lives in STRESS_OUT (default /tmp/stress) and screenshots in PROOF_DIR.
  14  |  */
  15  | const PROOF = process.env.PROOF_DIR || path.join(process.cwd(), "..", "..", "..", ".ui-proof");
  16  | const OUT = process.env.STRESS_OUT || "/tmp/stress";
  17  | fs.mkdirSync(PROOF, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
  18  | 
  19  | type Ev = { viewport: string; test: string; route: string; kind: string; message: string; stack?: string };
  20  | const NOISE = [/favicon/i, /net::ERR_ABORTED/i, /ERR_BLOCKED_BY_ORB/i, /Failed to load resource.*(404|net::)/i, /status of 404/i, /\[route-error\]|\[global-error\]/];
  21  | const HYDRATION = /hydrat|did not match|Minified React error|#418|#423|#425/i;
  22  | const BOUNDARY = /Application error: a client-side exception|This section hit a problem|Something went wrong/i;
  23  | const ROUTES = ["/", "/overview", "/companies", "/social", "/signals", "/reputation", "/docs/interactive-ui", "/news", "/chat?skip=1", "/company/tii", "/company/tii#news"];
  24  | const BADS = ["/no-such-page-xyz", "/companies/nope/definitely-bad", "/company/does-not-exist-zz"];
  25  | const SSE = ["RUN_STARTED", "TEXT_MESSAGE_START", "TEXT_MESSAGE_CONTENT", "TEXT_MESSAGE_END", "RUN_FINISHED"].map((type) =>
  26  |   `data: ${JSON.stringify(type === "TEXT_MESSAGE_CONTENT" ? { type, messageId: "m", delta: "Stress answer: Technology Innovation Institute is a geothermal developer." } : type.startsWith("RUN") ? { type, threadId: "t", runId: "r" } : { type, messageId: "m" })}\n\n`).join("") + "data: [DONE]\n\n";
  27  | 
  28  | function attach(page: Page, vp: string, name: string) {
  29  |   const ev: Ev[] = [];
  30  |   const push = (kind: string, message: string, stack?: string) => { if (!NOISE.some((r) => r.test(message))) ev.push({ viewport: vp, test: name, route: page.url(), kind, message: message.slice(0, 600), stack: stack?.split("\n").slice(0, 8).join("\n") }); };
  31  |   page.on("pageerror", (e) => push("pageerror", e.message, e.stack));
  32  |   page.on("console", (m) => {
  33  |     const t = m.text(); const loc = m.location(); const where = loc?.url ? `${loc.url}:${loc.lineNumber}` : undefined;
  34  |     if (/UNHANDLED_REJECTION/.test(t)) return push("unhandledrejection", t, where);
  35  |     if (m.type() === "error") return push(HYDRATION.test(t) ? "hydration" : "console.error", t, where);
  36  |     if (m.type() === "warning" && HYDRATION.test(t)) push("hydration", t, where);
  37  |   });
  38  |   return ev;
  39  | }
  40  | async function boundaryCheck(page: Page, ev: Ev[], vp: string, name: string) {
  41  |   const txt = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  42  |   const m = txt.match(BOUNDARY);
  43  |   if (m) ev.push({ viewport: vp, test: name, route: page.url(), kind: "error-boundary", message: m[0] });
  44  | }
  45  | async function step(ev: Ev[], page: Page, vp: string, name: string, label: string, fn: () => Promise<unknown>) {
  46  |   try { await fn(); } catch (e) { ev.push({ viewport: vp, test: name, route: page.url(), kind: "harness-step", message: `${label}: ${(e as Error).message.split("\n")[0]}` }); }
  47  | }
  48  | async function overflow(page: Page) {
  49  |   return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth).catch(() => 0);
  50  | }
  51  | async function finish(page: Page, ev: Ev[], vp: string, name: string, info: TestInfo) {
  52  |   await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  53  |   await boundaryCheck(page, ev, vp, name);
  54  |   const ov = await overflow(page);
  55  |   if (ov > 0) ev.push({ viewport: vp, test: name, route: page.url(), kind: "h-overflow", message: `scrollWidth exceeds clientWidth by ${ov}px` });
  56  |   await page.screenshot({ path: path.join(PROOF, `stress-${name}-${vp}.png`) }).catch(() => {});
  57  |   const real = ev.filter((e) => e.kind !== "harness-step");
  58  |   fs.appendFileSync(path.join(OUT, "events.jsonl"), ev.map((e) => JSON.stringify(e)).join("\n") + (ev.length ? "\n" : ""));
  59  |   fs.appendFileSync(path.join(OUT, "results.jsonl"), JSON.stringify({ viewport: vp, test: name, events: real.length, harness: ev.length - real.length, overflow: ov }) + "\n");
  60  |   info.annotations.push({ type: "events", description: JSON.stringify(ev) });
  61  |   expect(real, `stress events in ${name} @${vp}`).toEqual([]);
  62  | }
  63  | const nav = (page: Page, id: string) => page.locator(`[data-testid="primary-nav"] [data-testid="nav-${id}"]`).first();
  64  | 
  65  | for (const vp of [{ width: 1440, height: 900, label: "1440x900" }, { width: 390, height: 844, label: "390x844" }]) {
  66  |   test.describe(`nav stress @${vp.label}`, () => {
  67  |     test.use({ viewport: { width: vp.width, height: vp.height } });
  68  |     test.beforeEach(async ({ page }) => {
  69  |       await primeSettings(page);
  70  |       await page.addInitScript(() => window.addEventListener("unhandledrejection", (e) => console.error("UNHANDLED_REJECTION " + ((e.reason && (e.reason.stack || e.reason.message)) || String(e.reason)))));
  71  |     });
  72  | 
  73  |     test("rapid-nav", async ({ page }, info) => {
  74  |       const ev = attach(page, vp.label, "rapid-nav");
  75  |       await page.goto("/overview");
  76  |       const ids = ["overview", "watchlist", "sentiment", "news", "radar", "graph", "chat", "briefing", "artifacts", "methodology", "settings"];
  77  |       for (let round = 0; round < 3; round++) for (const id of ids) {
  78  |         await step(ev, page, vp.label, "rapid-nav", `click ${id}`, async () => { await nav(page, id).click({ timeout: 4000, noWaitAfter: true }); await page.waitForTimeout(150); });
  79  |       }
  80  |       await step(ev, page, vp.label, "rapid-nav", "final overview", async () => { await nav(page, "overview").click({ timeout: 4000 }); await expect(page).toHaveURL(/\/overview/); });
  81  |       await finish(page, ev, vp.label, "rapid-nav", info);
  82  |     });
  83  | 
  84  |     test("back-forward-spam", async ({ page }, info) => {
  85  |       const ev = attach(page, vp.label, "back-forward-spam");
  86  |       await page.goto("/overview");
  87  |       for (const id of ["companies", "signals", "social", "news"]) await step(ev, page, vp.label, "back-forward-spam", `nav ${id}`, async () => { await nav(page, id).click({ timeout: 5000 }); await page.waitForURL(new RegExp(id), { timeout: 15000 }); });
  88  |       await step(ev, page, vp.label, "back-forward-spam", "goto docs", () => page.goto("/docs/interactive-ui"));
  89  |       for (let i = 0; i < 10; i++) { await page.goBack({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(100); await page.goForward({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(100); }
  90  |       for (let i = 0; i < 5; i++) await page.goBack({ timeout: 8000 }).catch(() => {});
  91  |       await finish(page, ev, vp.label, "back-forward-spam", info);
  92  |     });
  93  | 
  94  |     test("deep-link-reload", async ({ page }, info) => {
  95  |       const ev = attach(page, vp.label, "deep-link-reload");
  96  |       for (const r of ROUTES) await step(ev, page, vp.label, "deep-link-reload", r, async () => {
  97  |         const res = await page.goto(r); expect.soft(res?.status() ?? 0, r).toBeLessThan(400);
> 98  |         const res2 = await page.reload(); expect.soft(res2?.status() ?? 0, `${r} reload`).toBeLessThan(400);
      |                                                                                           ^ Error: /company/tii#news reload
  99  |         await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  100 |         await boundaryCheck(page, ev, vp.label, "deep-link-reload");
  101 |       });
  102 |       await finish(page, ev, vp.label, "deep-link-reload", info);
  103 |     });
  104 | 
  105 |     test("drawer-open-nav", async ({ page }, info) => {
  106 |       const ev = attach(page, vp.label, "drawer-open-nav");
  107 |       await page.goto("/companies"); await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  108 |       await step(ev, page, vp.label, "drawer-open-nav", "open drawer", async () => {
  109 |         const trig = page.getByTestId("company-quick-view-trigger").first(); await trig.scrollIntoViewIfNeeded(); await trig.click();
  110 |         await expect(page.getByTestId("company-quick-view-drawer")).toBeVisible();
  111 |       });
  112 |       // Navigate while the drawer is open (the drawer overlay covers the rail on mobile → keyboard-free programmatic click on the link).
  113 |       await step(ev, page, vp.label, "drawer-open-nav", "nav while open", async () => { await nav(page, "signals").dispatchEvent("click"); await page.waitForURL(/\/signals/, { timeout: 15000 }); });
  114 |       await step(ev, page, vp.label, "drawer-open-nav", "drawer gone on /signals", async () => expect(page.getByTestId("company-quick-view-drawer")).toHaveCount(0));
  115 |       await step(ev, page, vp.label, "drawer-open-nav", "back", async () => { await page.goBack(); await page.waitForURL(/\/companies/, { timeout: 15000 }); });
  116 |       const locked = await page.evaluate(() => getComputedStyle(document.body).overflow === "hidden" || getComputedStyle(document.documentElement).overflow === "hidden" || document.body.style.pointerEvents === "none");
  117 |       if (locked) ev.push({ viewport: vp.label, test: "drawer-open-nav", route: page.url(), kind: "scroll-lock-leak", message: "body/html still scroll-locked after navigating away from an open drawer" });
  118 |       await step(ev, page, vp.label, "drawer-open-nav", "no drawer after back", async () => expect(page.getByTestId("company-quick-view-drawer")).toHaveCount(0));
  119 |       await finish(page, ev, vp.label, "drawer-open-nav", info);
  120 |     });
  121 | 
  122 |     test("nav-while-streaming", async ({ page }, info) => {
  123 |       const ev = attach(page, vp.label, "nav-while-streaming");
  124 |       await page.route("**/api/chat", async (route) => {
  125 |         if (route.request().method() !== "POST") return route.continue();
  126 |         await new Promise((r) => setTimeout(r, 3000));
  127 |         await route.fulfill({ status: 200, contentType: "text/event-stream", body: SSE }).catch(() => {});
  128 |       });
  129 |       await page.goto("/chat?skip=1");
  130 |       await step(ev, page, vp.label, "nav-while-streaming", "send", async () => { await page.getByTestId("composer-input").fill("Tell me about Technology Innovation Institute in one line."); await page.getByTestId("composer-send").click(); });
  131 |       await page.waitForTimeout(500);
  132 |       await step(ev, page, vp.label, "nav-while-streaming", "nav overview mid-stream", async () => { await nav(page, "overview").click({ timeout: 5000 }); await page.waitForURL(/\/overview/, { timeout: 15000 }); });
  133 |       await page.waitForTimeout(4000);
  134 |       await step(ev, page, vp.label, "nav-while-streaming", "back to chat", async () => { await page.goBack(); await page.waitForURL(/\/chat/, { timeout: 15000 }); });
  135 |       await step(ev, page, vp.label, "nav-while-streaming", "forward", async () => { await page.goForward(); await page.waitForURL(/\/overview/, { timeout: 15000 }); });
  136 |       await finish(page, ev, vp.label, "nav-while-streaming", info);
  137 |     });
  138 | 
  139 |     test("growth-mid-nav", async ({ page }, info) => {
  140 |       const ev = attach(page, vp.label, "growth-mid-nav");
  141 |       await primeSettings(page, { onboarded: false, companies: [] });
  142 |       await page.goto("/onboarding?skip=1");
  143 |       await step(ev, page, vp.label, "growth-mid-nav", "click growth #1", async () => { await page.getByTestId("growth-grid").waitFor(); await page.locator('[data-testid="growth-value"]').first().click({ noWaitAfter: true }); });
  144 |       await step(ev, page, vp.label, "growth-mid-nav", "goto overview mid-animation", () => page.goto("/overview"));
  145 |       await step(ev, page, vp.label, "growth-mid-nav", "back", () => page.goBack());
  146 |       await step(ev, page, vp.label, "growth-mid-nav", "click growth #2", async () => { const b = page.locator('[data-testid="growth-value"]').nth(1); await b.click(); await page.locator('[data-testid="growth-value"]').nth(1).click(); });
  147 |       await step(ev, page, vp.label, "growth-mid-nav", "forward", () => page.goForward());
  148 |       await finish(page, ev, vp.label, "growth-mid-nav", info);
  149 |     });
  150 | 
  151 |     test("news-anchor", async ({ page }, info) => {
  152 |       const ev = attach(page, vp.label, "news-anchor");
  153 |       await page.goto("/company/tii#news");
  154 |       await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  155 |       // The section streams behind loading.tsx; RouteEffects scrolls once it exists. Poll instead of a fixed sleep.
  156 |       let top = 99999;
  157 |       for (let i = 0; i < 60; i++) { top = await page.locator("#news").evaluate((el) => el.getBoundingClientRect().top).catch(() => 99999); if (top >= -4 && top < vp.height) break; await page.waitForTimeout(250); }
  158 |       if (!(top >= -4 && top < vp.height)) ev.push({ viewport: vp.label, test: "news-anchor", route: page.url(), kind: "anchor", message: `#news not in viewport after deep link (top=${Math.round(top)})` });
  159 |       // Client-side path: quick view drawer → "news" link
  160 |       await step(ev, page, vp.label, "news-anchor", "drawer news link", async () => {
  161 |         await page.goto("/companies"); const trig = page.getByTestId("company-quick-view-trigger").first(); await trig.click();
  162 |         const link = page.locator('[data-testid="company-quick-view-drawer"] a[href*="#news"]').first();
  163 |         if (await link.count()) { await link.click(); await page.waitForURL(/#news/, { timeout: 15000 });
  164 |           let t2 = 99999;
  165 |           for (let i = 0; i < 60; i++) { t2 = await page.locator("#news").evaluate((el) => el.getBoundingClientRect().top).catch(() => 99999); if (t2 >= -4 && t2 < vp.height) break; await page.waitForTimeout(250); }
  166 |           if (!(t2 >= -4 && t2 < vp.height)) ev.push({ viewport: vp.label, test: "news-anchor", route: page.url(), kind: "anchor", message: `#news not in viewport after client nav (top=${Math.round(t2)})` }); }
  167 |       });
  168 |       await finish(page, ev, vp.label, "news-anchor", info);
  169 |     });
  170 | 
  171 |     test("signals", async ({ page }, info) => {
  172 |       const ev = attach(page, vp.label, "signals");
  173 |       const r = await page.goto("/signals"); expect.soft(r?.status()).toBe(200);
  174 |       await step(ev, page, vp.label, "signals", "table", async () => expect(page.getByTestId("signals-table").or(page.getByText(/Signal Score unavailable/))).toBeVisible());
  175 |       await page.reload();
  176 |       await step(ev, page, vp.label, "signals", "nav to company + back", async () => { await page.locator('[data-testid="signals-table"] a').first().click(); await page.waitForURL(/\/company\//); await page.goBack(); await page.waitForURL(/\/signals/); });
  177 |       await finish(page, ev, vp.label, "signals", info);
  178 |     });
  179 | 
  180 |     test("bad-urls", async ({ page }, info) => {
  181 |       const ev = attach(page, vp.label, "bad-urls");
  182 |       for (const b of BADS) {
  183 |         const r = await page.goto(b); expect.soft(r?.status(), b).toBe(404);
  184 |         await step(ev, page, vp.label, "bad-urls", `${b} copy`, async () => expect(page.getByText(/Page not found|could not be found|not found/i).first()).toBeVisible());
  185 |       }
  186 |       await step(ev, page, vp.label, "bad-urls", "recover via nav", async () => { await nav(page, "overview").click(); await page.waitForURL(/\/overview/); });
  187 |       await finish(page, ev, vp.label, "bad-urls", info);
  188 |     });
  189 |   });
  190 | }
  191 | 
```