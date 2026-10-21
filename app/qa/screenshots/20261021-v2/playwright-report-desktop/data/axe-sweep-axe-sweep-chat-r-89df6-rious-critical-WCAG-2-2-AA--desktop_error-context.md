# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: axe-sweep.spec.ts >> axe sweep: /chat run panel after one turn @1440x900 >> /chat after-turn: no serious/critical (WCAG 2.2 AA)
- Location: e2e/axe-sweep.spec.ts:117:3

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
        - button "Expand navigation" [ref=e13] [cursor=pointer]
        - navigation "Primary" [ref=e17]:
          - link "National Overview" [ref=e18] [cursor=pointer]:
            - /url: /overview
          - link "Watchlist" [ref=e25] [cursor=pointer]:
            - /url: /watchlist
          - link "Sentiment Universe" [ref=e31] [cursor=pointer]:
            - /url: /sentiment
          - link "News Intelligence" [ref=e39] [cursor=pointer]:
            - /url: /news
          - link "Tech Radar" [ref=e44] [cursor=pointer]:
            - /url: /radar
          - link "Ecosystem Graph" [ref=e53] [cursor=pointer]:
            - /url: /graph
          - link "Executive Chat" [ref=e61] [cursor=pointer]:
            - /url: /chat
          - link "National Briefing" [ref=e65] [cursor=pointer]:
            - /url: /briefing
          - link "Artifacts" [ref=e70] [cursor=pointer]:
            - /url: /artifacts
          - link "Methodology" [ref=e75] [cursor=pointer]:
            - /url: /methodology
          - link "Settings" [ref=e79] [cursor=pointer]:
            - /url: /settings
        - generic [ref=e84]:
          - button "New chat" [ref=e85]
          - button "In one sentence, what does Technology Innovation" [ref=e87]
        - button "Search organisations (Ctrl or Cmd + K)" [ref=e90]:
          - generic [ref=e93]: Search ⌘K
        - button "Switch to dark mode" [ref=e95]
      - main [ref=e99]:
        - generic [ref=e101]:
          - generic [ref=e102]:
            - generic [ref=e106]:
              - generic [ref=e109]:
                - generic [ref=e110]:
                  - heading "In one sentence, what does Technology Innovation" [level=1] [ref=e111]
                  - generic [ref=e113]: Concept Demonstration
                - generic [ref=e114]:
                  - button "New chat" [ref=e115] [cursor=pointer]
                  - button "Open artifacts" [ref=e118] [cursor=pointer]
                  - button "Open inspector" [ref=e120] [cursor=pointer]:
                    - generic [ref=e122]: Inspector
              - generic [ref=e125]:
                - generic [ref=e126]: In one sentence, what does Technology Innovation Institute do?
                - generic [ref=e131]:
                  - generic "Run" [ref=e132]:
                    - generic [ref=e133]: UAE AI Command Centre
                    - generic "Task time" [ref=e134]: 12.3 s
                    - generic [ref=e135]: 5,457 tokens
                    - button "Hide status logs" [expanded] [ref=e136] [cursor=pointer]
                  - status [ref=e139]:
                    - generic: Needs attention
                    - generic [ref=e143]: +12.3 s
                  - generic [ref=e147]:
                    - button "Thinking" [ref=e148] [cursor=pointer]
                    - paragraph [ref=e157]: "{\"title\":\"I'll answer from the supplied context.\\nI’ll keep it to one sentence.\",\"objective\":\"\",\"plan_required\":false,\"plan_skip_reason\":\"The supplied context directly answers the question; no plugin execution is needed.\",\"steps\":[]}"
                  - generic [ref=e160]:
                    - heading "Verified facts" [level=2] [ref=e161]
                    - list [ref=e162]:
                      - listitem [ref=e163]:
                        - text: The Technology Innovation Institute is Abu Dhabi’s applied-research centre under ATRC, working across AI and other advanced-technology fields.
                        - 'link "Source 1: Source" [ref=e164] [cursor=pointer]':
                          - /url: https://en.wikipedia.org/wiki/Technology_Innovation_Institute
                          - generic [ref=e165]: wikipedia
                          - generic [ref=e166]: "1"
                          - tooltip "Source en.wikipedia.org":
                            - generic: Source
                            - generic: en.wikipedia.org
                    - heading "Interpretation" [level=2] [ref=e167]
                    - paragraph [ref=e168]: "Judgement: It turns advanced-technology research into practical capabilities."
                  - region "Sources" [ref=e169]:
                    - button "Sources (1)" [ref=e170] [cursor=pointer]
                  - 'generic "Run timings: Tools 7.1 s, Answer 2.6 s, Total 12.3 s, 5,457 tokens" [ref=e176]':
                    - paragraph [ref=e180]:
                      - generic [ref=e181]: Tools 7.1 s
                      - generic [ref=e182]:
                        - generic [aria-hidden] [ref=e183]: ·
                        - text: Answer 2.6 s
                      - generic [ref=e184]:
                        - generic [aria-hidden] [ref=e185]: ·
                        - text: Total 12.3 s
                      - generic [ref=e186]:
                        - generic [aria-hidden] [ref=e187]: ·
                        - text: 5,457 tokens
              - generic [ref=e189]:
                - generic [ref=e190]:
                  - button [aria-hidden]
                  - button "Attach a file" [ref=e192] [cursor=pointer]
                  - textbox "Message" [ref=e195]:
                    - /placeholder: Ask about UAE AI organisations, news or sentiment…
                  - button "Start voice mode (full duplex)" [ref=e197] [cursor=pointer]
                  - button "Send message" [disabled] [ref=e201]
                - paragraph [ref=e204]: GPT-5.6 Luna · Enter to send
                - paragraph [ref=e205]: "Context: 5 organisations — Mohamed bin Zayed University of Artificial Intelligence, G42, Technology Innovation Institute, EDGE Group, Space42 PLC"
                - paragraph [ref=e206]: "Intelligence engine: OnDemand"
                - status [ref=e207]
            - paragraph [ref=e208]:
              - text: GPT-5.6 Luna ·
              - generic [ref=e212]: Perplexity
          - complementary "Inspector":
            - generic:
              - heading "Inspector" [level=2]
              - button "Close inspector"
            - generic:
              - generic:
                - heading "This run" [level=2]
                - paragraph: GPT-5.6 Luna · reasoning medium
                - list "Plugins in this run":
                  - listitem:
                    - generic:
                      - 'button "Perplexity: done"':
                        - img "Perplexity"
                - group:
                  - generic "Developer details"
                  - text: ▸
              - generic:
                - heading "Organisation context 5 of 5 selected" [level=2]:
                  - generic:
                    - text: Organisation context
                    - generic "5 of 5 selected": 5/5
                - generic:
                  - generic "Selected companies":
                    - generic:
                      - group "Mohamed bin Zayed University of Artificial Intelligence, University":
                        - img "Mohamed bin Zayed University of Artificial Intelligence": M
                        - generic: Mohamed bin Zayed University of Artificial Intelligence
                        - button "Remove Mohamed bin Zayed University of Artificial Intelligence from context"
                    - generic:
                      - group "G42, Company":
                        - generic:
                          - img "G42"
                        - generic: G42
                        - button "Remove G42 from context"
                    - generic:
                      - group "Technology Innovation Institute, Research centre":
                        - img "Technology Innovation Institute": T
                        - generic: Technology Innovation Institute
                        - button "Remove Technology Innovation Institute from context"
                    - generic:
                      - group "EDGE Group, Company":
                        - img "EDGE Group": E
                        - generic: EDGE Group
                        - button "Remove EDGE Group from context"
                    - generic:
                      - group "Space42 PLC, Company":
                        - img "Space42 PLC": S
                        - generic: Space42 PLC
                        - button "Remove Space42 PLC from context"
                  - generic:
                    - generic: Add a company
                    - combobox "Add a company" [disabled]
                  - status: Remove a company to add another.
                - list:
                  - listitem:
                    - generic:
                      - generic:
                        - img "G42"
                      - text: G42
                    - generic: 29 news · 50 voices
                  - listitem:
                    - generic:
                      - img "Space42 PLC": S
                      - text: Space42 PLC
                    - generic: 2 news · 5 voices
                  - listitem:
                    - generic:
                      - img "Technology Innovation Institute": T
                      - text: Technology Innovation Institute
                    - generic: 7 news · 14 voices
                  - listitem:
                    - generic:
                      - img "EDGE Group": E
                      - text: EDGE Group
                    - generic: 3 news · 0 voices
                  - listitem:
                    - generic:
                      - img "Mohamed bin Zayed University of Artificial Intelligence": M
                      - text: Mohamed bin Zayed University of Artificial Intelligence
                    - generic: 8 news · 17 voices
              - generic:
                - heading "Model & plugins" [level=2]
                - paragraph: GPT-5.6 Luna · reasoning medium
                - region "Plugins":
                  - heading "Plugins (40 available · 1 on this turn)" [level=3]
                  - paragraph: live directory · 40 plugins · selection applies per turn
                  - searchbox "Search all plugins"
                  - paragraph: Showing 40 of 186
                  - list:
                    - listitem:
                      - generic:
                        - img "Perplexity"
                        - generic:
                          - paragraph:
                            - generic: Perplexity
                            - generic: general
                            - generic: locked on
                            - 'generic "Perplexity: invoked"': invoked
                      - switch "Perplexity (locked on)" [checked] [disabled]
                    - listitem:
                      - generic:
                        - img "Internet"
                        - generic:
                          - paragraph:
                            - generic: Internet
                            - generic: research
                            - 'generic "Internet: connected"': connected
                      - switch "Use Internet this turn"
                    - listitem:
                      - generic:
                        - img "GPT Search"
                        - generic:
                          - paragraph:
                            - generic: GPT Search
                            - generic: research
                            - 'generic "GPT Search: connected"': connected
                      - switch "Use GPT Search this turn"
                    - listitem:
                      - generic:
                        - img "X Search Agent"
                        - generic:
                          - paragraph:
                            - generic: X Search Agent
                            - generic: general
                            - 'generic "X Search Agent: connected"': connected
                      - switch "Use X Search Agent this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: X
                        - generic:
                          - paragraph:
                            - generic: X
                            - generic: general
                            - 'generic "X: suggested"': suggested
                      - switch "Use X this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: T
                        - generic:
                          - paragraph:
                            - generic: Tiktok
                            - generic: general
                            - 'generic "Tiktok: connected"': connected
                      - switch "Use Tiktok this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: I
                        - generic:
                          - paragraph:
                            - generic: Instagram User Info Extracter
                            - generic: general
                            - 'generic "Instagram User Info Extracter: connected"': connected
                      - switch "Use Instagram User Info Extracter this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: I
                        - generic:
                          - paragraph:
                            - generic: Instagram
                            - generic: general
                            - 'generic "Instagram: suggested"': suggested
                      - switch "Use Instagram this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: "Y"
                        - generic:
                          - paragraph:
                            - generic: YouTube Data API v3 - Captions
                            - generic: general
                            - 'generic "YouTube Data API v3 - Captions: suggested"': suggested
                      - switch "Use YouTube Data API v3 - Captions this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: R
                        - generic:
                          - paragraph:
                            - generic: Reddit Posts
                            - generic: marketing
                            - 'generic "Reddit Posts: connected"': connected
                      - switch "Use Reddit Posts this turn"
                    - listitem:
                      - generic:
                        - img "Linkedin Search"
                        - generic:
                          - paragraph:
                            - generic: Linkedin Search
                            - generic: research
                            - 'generic "Linkedin Search: connected"': connected
                      - switch "Use Linkedin Search this turn"
                    - listitem:
                      - generic:
                        - img "US Stock Fundamental Analysis"
                        - generic:
                          - paragraph:
                            - generic: US Stock Fundamental Analysis
                            - generic: general
                            - 'generic "US Stock Fundamental Analysis: connected"': connected
                      - switch "Use US Stock Fundamental Analysis this turn"
                    - listitem:
                      - generic:
                        - img "US Stock Technical Analysis"
                        - generic:
                          - paragraph:
                            - generic: US Stock Technical Analysis
                            - generic: finance
                            - 'generic "US Stock Technical Analysis: connected"': connected
                      - switch "Use US Stock Technical Analysis this turn"
                    - listitem:
                      - generic:
                        - img "Quarterly financial report data tool"
                        - generic:
                          - paragraph:
                            - generic: Quarterly financial report data tool
                            - generic: data
                            - 'generic "Quarterly financial report data tool: suggested"': suggested
                      - switch "Use Quarterly financial report data tool this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: A
                        - generic:
                          - paragraph:
                            - generic: Abu Dhabi Business RAG
                            - generic: general
                            - 'generic "Abu Dhabi Business RAG: connected"': connected
                      - switch "Use Abu Dhabi Business RAG this turn"
                    - listitem:
                      - generic:
                        - img "AI Budget Insight Agent"
                        - generic:
                          - paragraph:
                            - generic: AI Budget Insight Agent
                            - generic: finance
                            - 'generic "AI Budget Insight Agent: connected"': connected
                      - switch "Use AI Budget Insight Agent this turn"
                    - listitem:
                      - generic:
                        - img "AI Search"
                        - generic:
                          - paragraph:
                            - generic: AI Search
                            - generic: general
                            - 'generic "AI Search: connected"': connected
                      - switch "Use AI Search this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: A
                        - generic:
                          - paragraph:
                            - generic: Air Quality Tool
                            - generic: general
                            - 'generic "Air Quality Tool: connected"': connected
                      - switch "Use Air Quality Tool this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: A
                        - generic:
                          - paragraph:
                            - generic: Appeal Document Generation Tool
                            - generic: data
                            - 'generic "Appeal Document Generation Tool: connected"': connected
                      - switch "Use Appeal Document Generation Tool this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: A
                        - generic:
                          - paragraph:
                            - generic: Article-Generator
                            - generic: marketing
                            - 'generic "Article-Generator: connected"': connected
                      - switch "Use Article-Generator this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: A
                        - generic:
                          - paragraph:
                            - generic: AskMira
                            - generic: finance
                            - 'generic "AskMira: connected"': connected
                      - switch "Use AskMira this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: B
                        - generic:
                          - paragraph:
                            - generic: Billboard Charts
                            - generic: general
                            - 'generic "Billboard Charts: connected"': connected
                      - switch "Use Billboard Charts this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: B
                        - generic:
                          - paragraph:
                            - generic: Blender MCP
                            - generic: general
                            - 'generic "Blender MCP: connected"': connected
                      - switch "Use Blender MCP this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: B
                        - generic:
                          - paragraph:
                            - generic: Bnfits Nearby Benefits
                            - generic: data
                            - 'generic "Bnfits Nearby Benefits: connected"': connected
                      - switch "Use Bnfits Nearby Benefits this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: C
                        - generic:
                          - paragraph:
                            - generic: copilot-faq-bot
                            - generic: general
                            - 'generic "copilot-faq-bot: connected"': connected
                      - switch "Use copilot-faq-bot this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: C
                        - generic:
                          - paragraph:
                            - generic: copilot-resume-tester
                            - generic: general
                            - 'generic "copilot-resume-tester: connected"': connected
                      - switch "Use copilot-resume-tester this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: C
                        - generic:
                          - paragraph:
                            - generic: Crop Suggestion
                            - generic: general
                            - 'generic "Crop Suggestion: connected"': connected
                      - switch "Use Crop Suggestion this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: C
                        - generic:
                          - paragraph:
                            - generic: CropHealthGuard
                            - generic: general
                            - 'generic "CropHealthGuard: connected"': connected
                      - switch "Use CropHealthGuard this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: C
                        - generic:
                          - paragraph:
                            - generic: Crypto Analytics
                            - generic: general
                            - 'generic "Crypto Analytics: connected"': connected
                      - switch "Use Crypto Analytics this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: C
                        - generic:
                          - paragraph:
                            - generic: Crypto-Description
                            - generic: general
                            - 'generic "Crypto-Description: connected"': connected
                      - switch "Use Crypto-Description this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: C
                        - generic:
                          - paragraph:
                            - generic: Currency Converter
                            - generic: general
                            - 'generic "Currency Converter: connected"': connected
                      - switch "Use Currency Converter this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: D
                        - generic:
                          - paragraph:
                            - generic: Digital Dubai Authority
                            - generic: research
                            - 'generic "Digital Dubai Authority: connected"': connected
                      - switch "Use Digital Dubai Authority this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: D
                        - generic:
                          - paragraph:
                            - generic: Docu Sign
                            - generic: general
                            - 'generic "Docu Sign: connected"': connected
                      - switch "Use Docu Sign this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: D
                        - generic:
                          - paragraph:
                            - generic: Document Template Tool
                            - generic: general
                            - 'generic "Document Template Tool: connected"': connected
                      - switch "Use Document Template Tool this turn"
                    - listitem:
                      - generic:
                        - img "Dubai Courts - Legal Research"
                        - generic:
                          - paragraph:
                            - generic: Dubai Courts - Legal Research
                            - generic: research
                            - 'generic "Dubai Courts - Legal Research: connected"': connected
                      - switch "Use Dubai Courts - Legal Research this turn"
                    - listitem:
                      - generic:
                        - img "Elevan Labs Agent"
                        - generic:
                          - paragraph:
                            - generic: Elevan Labs Agent
                            - generic: general
                            - 'generic "Elevan Labs Agent: connected"': connected
                      - switch "Use Elevan Labs Agent this turn"
                    - listitem:
                      - generic:
                        - img "Email"
                        - generic:
                          - paragraph:
                            - generic: Email
                            - generic: general
                            - 'generic "Email: connected"': connected
                      - switch "Use Email this turn"
                    - listitem:
                      - generic:
                        - img "Email Memory"
                        - generic:
                          - paragraph:
                            - generic: Email Memory
                            - generic: marketing
                            - 'generic "Email Memory: connected"': connected
                      - switch "Use Email Memory this turn"
                    - listitem:
                      - generic:
                        - img "Emcan Knowledge Base"
                        - generic:
                          - paragraph:
                            - generic: Emcan Knowledge Base
                            - generic: general
                            - 'generic "Emcan Knowledge Base: connected"': connected
                      - switch "Use Emcan Knowledge Base this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: E
                        - generic:
                          - paragraph:
                            - generic: EmCan Member Data Salesforce
                            - generic: data
                            - 'generic "EmCan Member Data Salesforce: connected"': connected
                      - switch "Use EmCan Member Data Salesforce this turn"
                  - paragraph: Applies to your next question — nothing is substituted if a plugin fails.
  - region "Notifications alt+T"
  - alert [ref=e213]
```

# Test source

```ts
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
  109 |         expect(bad(rep), explain(rep)).toEqual([]);
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
> 136 |     expect(bad(rep), explain(rep)).toEqual([]);
      |                                    ^ Error: [
  137 |   });
  138 | });
  139 | 
```