# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: axe-sweep.spec.ts >> axe sweep @1440x900 >> /artifacts @1440x900: no serious/critical (WCAG 2.2 AA)
- Location: e2e/axe-sweep.spec.ts:104:7

# Error details

```
Error: [
 {
  "id": "color-contrast",
  "impact": "serious",
  "nodes": 1,
  "target": ".opacity-75",
  "help": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright"
 }
]

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 22

- Array []
+ Array [
+   Object {
+     "firstTarget": ".opacity-75",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": 1,
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
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
          - generic [ref=e109]:
            - generic [ref=e111]:
              - heading [level=1] [ref=e112]
              - paragraph [ref=e114]: Every report, image, video and upload across all threads
            - generic [ref=e116]:
              - generic [ref=e117]:
                - group "Filter by type" [ref=e118]:
                  - button "All 0" [pressed] [ref=e119] [cursor=pointer]:
                    - generic [ref=e120]: All
                    - generic [ref=e121]: "0"
                  - button "Documents 0" [ref=e122] [cursor=pointer]:
                    - generic [ref=e123]: Documents
                    - generic [ref=e124]: "0"
                  - button "Images 0" [ref=e125] [cursor=pointer]:
                    - generic [ref=e126]: Images
                    - generic [ref=e127]: "0"
                  - button "Videos 0" [ref=e128] [cursor=pointer]:
                    - generic [ref=e129]: Videos
                    - generic [ref=e130]: "0"
                  - button "Audio 0" [ref=e131] [cursor=pointer]:
                    - generic [ref=e132]: Audio
                    - generic [ref=e133]: "0"
                  - button "Uploads 0" [ref=e134] [cursor=pointer]:
                    - generic [ref=e135]: Uploads
                    - generic [ref=e136]: "0"
                  - button "Generated 0" [ref=e137] [cursor=pointer]:
                    - generic [ref=e138]: Generated
                    - generic [ref=e139]: "0"
                - generic [ref=e140]:
                  - generic [ref=e141]:
                    - generic [ref=e142]: Thread
                    - combobox "Filter by thread" [ref=e143]:
                      - option "All threads" [selected]
                  - generic [ref=e144]:
                    - generic [ref=e145]: Date
                    - combobox "Filter by date" [ref=e146]:
                      - option "Today"
                      - option "7 days"
                      - option "30 days"
                      - option "All time" [selected]
              - generic [ref=e147]:
                - paragraph [ref=e148]: No artifacts yet — reports and uploads from Chat appear here
                - paragraph [ref=e149]: Inputs you attach and files the agent writes are versioned here
                - link "Go to Chat" [ref=e150] [cursor=pointer]:
                  - /url: /chat
        - contentinfo [ref=e153]:
          - generic [ref=e154]:
            - generic [ref=e155]:
              - strong [ref=e156]: Concept Demonstration — not an official government system.
              - text: Public sources only · no government logo or endorsement implied.
            - generic [ref=e157]:
              - text: Data namespace uae_cc_v1 · as of 2026-10-21 ·
              - link "Methodology & limitations" [ref=e158] [cursor=pointer]:
                - /url: /methodology
            - generic [ref=e159]: "Intelligence engine: OnDemand (AIREV)"
            - generic [ref=e162]:
              - text: v1.0.0 · local · last updated
              - time [ref=e163]: 2026-10-21 10:29 UTC
  - region "Notifications alt+T"
  - alert [ref=e164]
```

# Test source

```ts
  9   | import AxeBuilder from "@axe-core/playwright";
  10  | import { test as base, expect, type Page } from "@playwright/test";
  11  | import { primeSettings, hasKey } from "./helpers";
  12  | 
  13  | const LABEL = process.env.AXE_LABEL ?? "before";
  14  | const OUT = path.resolve(__dirname, "..", "proof", "pass-3", "axe", LABEL);
  15  | const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"];
  16  | const ROUTES = ["/overview", "/companies", "/news", "/chat?skip=1", "/artifacts", "/settings", "/company/tii"];
  17  | const VIEWPORTS = [
  18  |   { name: "1440x900", width: 1440, height: 900 },
  19  |   { name: "390x844", width: 390, height: 844 },
  20  | ];
  21  | const CHAT_PROMPT = "In one sentence, what does Technology Innovation Institute do?";
  22  | 
  23  | type Impact = "critical" | "serious" | "moderate" | "minor";
  24  | export type AxeRouteReport = {
  25  |   label: string;
  26  |   route: string;
  27  |   viewport: string;
  28  |   url: string;
  29  |   state: "initial" | "after-turn";
  30  |   tags: string[];
  31  |   generatedUtc: string;
  32  |   counts: Record<Impact, number> & { total: number };
  33  |   passes: number;
  34  |   incomplete: number;
  35  |   violations: { id: string; impact: Impact | null; nodes: number; firstTarget: string; help: string; helpUrl: string; tags: string[] }[];
  36  |   fail: boolean;
  37  | };
  38  | 
  39  | // Own fixture: prime settings (onboarding + api key) but do NOT fail on console errors — this spec reports a11y only.
  40  | const test = base.extend<{ prime: void }>({
  41  |   prime: [
  42  |     async ({ page }, use) => {
  43  |       await primeSettings(page);
  44  |       await use();
  45  |     },
  46  |     { auto: true },
  47  |   ],
  48  | });
  49  | 
  50  | const slug = (s: string) => s.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "root";
  51  | 
  52  | async function audit(page: Page, route: string, viewport: string, state: AxeRouteReport["state"]) {
  53  |   const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  54  |   const counts: AxeRouteReport["counts"] = { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 };
  55  |   const violations = r.violations.map((v) => {
  56  |     const impact = (v.impact ?? null) as Impact | null;
  57  |     if (impact) counts[impact] += 1;
  58  |     counts.total += 1;
  59  |     const t = v.nodes[0]?.target?.[0];
  60  |     return {
  61  |       id: v.id,
  62  |       impact,
  63  |       nodes: v.nodes.length,
  64  |       firstTarget: Array.isArray(t) ? t.join(" >>> ") : String(t ?? ""),
  65  |       help: v.help,
  66  |       helpUrl: v.helpUrl,
  67  |       tags: v.tags,
  68  |     };
  69  |   });
  70  |   const report: AxeRouteReport = {
  71  |     label: LABEL,
  72  |     route,
  73  |     viewport,
  74  |     url: page.url(),
  75  |     state,
  76  |     tags: TAGS,
  77  |     generatedUtc: new Date().toISOString(),
  78  |     counts,
  79  |     passes: r.passes.length,
  80  |     incomplete: r.incomplete.length,
  81  |     violations,
  82  |     fail: counts.critical + counts.serious > 0,
  83  |   };
  84  |   fs.mkdirSync(OUT, { recursive: true });
  85  |   const file = path.join(OUT, `${slug(route)}${state === "after-turn" ? "-after-turn" : ""}-${viewport}.json`);
  86  |   fs.writeFileSync(file, JSON.stringify(report, null, 2));
  87  |   return report;
  88  | }
  89  | 
  90  | async function settle(page: Page) {
  91  |   await expect(page.locator("main, [role=main]").first()).toBeVisible({ timeout: 30_000 });
  92  |   await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
  93  |   await page.waitForTimeout(800);
  94  | }
  95  | 
  96  | const bad = (rep: AxeRouteReport) => rep.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  97  | const explain = (rep: AxeRouteReport) =>
  98  |   JSON.stringify(bad(rep).map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes, target: v.firstTarget, help: v.helpUrl })), null, 1);
  99  | 
  100 | for (const vp of VIEWPORTS) {
  101 |   test.describe(`axe sweep @${vp.name}`, () => {
  102 |     test.use({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.width < 600, isMobile: vp.width < 600 });
  103 |     for (const route of ROUTES) {
  104 |       test(`${route} @${vp.name}: no serious/critical (WCAG 2.2 AA)`, async ({ page }, testInfo) => {
  105 |         await page.goto(route);
  106 |         await settle(page);
  107 |         const rep = await audit(page, route, vp.name, "initial");
  108 |         testInfo.annotations.push({ type: "axe", description: JSON.stringify(rep.counts) });
> 109 |         expect(bad(rep), explain(rep)).toEqual([]);
      |                                        ^ Error: [
  110 |       });
  111 |     }
  112 |   });
  113 | }
  114 | 
  115 | test.describe("axe sweep: /chat run panel after one turn @1440x900", () => {
  116 |   test.use({ viewport: { width: 1440, height: 900 } });
  117 |   test("/chat after-turn: no serious/critical (WCAG 2.2 AA)", async ({ page }, testInfo) => {
  118 |     test.skip(!hasKey(), "ON_DEMAND_API_KEY not set — cannot run a chat turn");
  119 |     await page.goto("/chat?skip=1");
  120 |     await settle(page);
  121 |     const input = page.getByTestId("composer-input");
  122 |     await expect(input).toBeVisible({ timeout: 30_000 });
  123 |     await input.fill(CHAT_PROMPT);
  124 |     await page.getByTestId("composer-send").click();
  125 |     const run = page.getByTestId("run-view").last();
  126 |     // wait for the answer to start, then for streaming to end (bounded)
  127 |     await expect(run.getByTestId("answer-block").first()).toBeVisible({ timeout: 150_000 });
  128 |     const t0 = Date.now();
  129 |     while (Date.now() - t0 < 60_000) {
  130 |       if ((await page.getByTestId("assistant-streaming").count().catch(() => 0)) === 0) break;
  131 |       await page.waitForTimeout(500);
  132 |     }
  133 |     await page.waitForTimeout(1500);
  134 |     const rep = await audit(page, "/chat", "1440x900", "after-turn");
  135 |     testInfo.annotations.push({ type: "axe", description: JSON.stringify(rep.counts) });
  136 |     expect(bad(rep), explain(rep)).toEqual([]);
  137 |   });
  138 | });
  139 | 
```