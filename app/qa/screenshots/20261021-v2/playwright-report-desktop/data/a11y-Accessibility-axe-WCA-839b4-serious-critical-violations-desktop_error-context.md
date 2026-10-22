# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> Accessibility (axe, WCAG 2.0/2.1 A+AA) >> chat: no serious/critical violations
- Location: e2e/a11y.spec.ts:6:9

# Error details

```
Error: [
 {
  "id": "color-contrast",
  "impact": "serious",
  "help": "Elements must meet minimum color contrast ratio thresholds",
  "nodes": [
   "<span class=\"hidden opacity-75 lg:inline\">· Public-source data, as of 21 Oct 2026 · No government logo or endorsement implied</span>"
  ]
 }
]

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 58

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f9f9f9",
+               "contrastRatio": 3.55,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#848484",
+               "fontSize": "8.6pt (11.5px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.55 (foreground color: #848484, background color: #f9f9f9, font size: 8.6pt (11.5px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div role=\"note\" aria-label=\"Disclaimer\" data-testid=\"disclaimer-bar\" class=\"sticky top-0 z-[55] ...\" style=\"background:var(--dis...\">",
+                 "target": Array [
+                   ".top-0",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.55 (foreground color: #848484, background color: #f9f9f9, font size: 8.6pt (11.5px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"hidden opacity-75 lg:inline\">· Public-source data, as of 21 Oct 2026 · No government logo or endorsement implied</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".opacity-75",
+         ],
+       },
+     ],
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
- generic [ref=e1]:
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
        - button "New chat" [ref=e85]
        - button "Search organisations (Ctrl or Cmd + K)" [ref=e87]:
          - generic [ref=e90]: Search ⌘K
        - button "Switch to dark mode" [ref=e92]
      - main [ref=e96]:
        - generic [ref=e98]:
          - generic [ref=e99]:
            - generic [ref=e103]:
              - generic [ref=e106]:
                - generic [ref=e107]:
                  - heading "Executive Intelligence Chat" [level=1] [ref=e108]
                  - generic [ref=e110]: Concept Demonstration
                - generic [ref=e111]:
                  - button "New chat" [ref=e112] [cursor=pointer]
                  - button "Open artifacts" [ref=e115] [cursor=pointer]
                  - button "Open inspector" [ref=e117] [cursor=pointer]:
                    - generic [ref=e119]: Inspector
              - generic [ref=e121]:
                - heading "Executive Intelligence Chat" [level=2] [ref=e122]
                - paragraph [ref=e123]: Concept Demonstration — not an official government system · answers split Verified facts vs Interpretation, with citations
                - list "Context organisations" [ref=e124]:
                  - listitem [ref=e125]:
                    - text: G42
                    - generic [ref=e127]: Company
                  - listitem [ref=e128]:
                    - text: Space42 PLC
                    - generic [ref=e130]: Company
                  - listitem [ref=e131]:
                    - text: Technology Innovation Institute
                    - generic [ref=e133]: Research centre
                  - listitem [ref=e134]:
                    - text: EDGE Group
                    - generic [ref=e136]: Company
                  - listitem [ref=e137]:
                    - text: Mohamed bin Zayed University of Artificial Intelligence
                    - generic [ref=e139]: University
                - generic [ref=e140]:
                  - button "TII announcements What has TII announced recently?" [ref=e141] [cursor=pointer]:
                    - generic [ref=e143]:
                      - strong [ref=e144]: TII announcements
                      - generic [ref=e145]: What has TII announced recently?
                  - button "International acceleration Which UAE AI companies are accelerating internationally?" [ref=e146] [cursor=pointer]:
                    - generic [ref=e148]:
                      - strong [ref=e149]: International acceleration
                      - generic [ref=e150]: Which UAE AI companies are accelerating internationally?
                  - button "Employment sentiment What is driving negative sentiment about AI employment?" [ref=e151] [cursor=pointer]:
                    - generic [ref=e153]:
                      - strong [ref=e154]: Employment sentiment
                      - generic [ref=e155]: What is driving negative sentiment about AI employment?
                  - button "Compare research Compare G42, EDGE and TII's AI research activity." [ref=e156] [cursor=pointer]:
                    - generic [ref=e158]:
                      - strong [ref=e159]: Compare research
                      - generic [ref=e160]: Compare G42, EDGE and TII's AI research activity.
                  - button "New partnerships Which UAE organizations announced new AI partnerships this month?" [ref=e161] [cursor=pointer]:
                    - generic [ref=e163]:
                      - strong [ref=e164]: New partnerships
                      - generic [ref=e165]: Which UAE organizations announced new AI partnerships this month?
              - generic [ref=e167]:
                - generic [ref=e168]:
                  - button [aria-hidden]
                  - button "Attach a file" [ref=e170] [cursor=pointer]
                  - textbox "Message" [active] [ref=e173]:
                    - /placeholder: Ask about UAE AI organisations, news or sentiment…
                  - button "Start voice mode (full duplex)" [ref=e175] [cursor=pointer]
                  - button "Send message" [disabled] [ref=e179]
                - paragraph [ref=e182]: GPT-5.6 Luna · Enter to send
                - paragraph [ref=e183]: "Context: 5 organisations — Mohamed bin Zayed University of Artificial Intelligence, G42, Technology Innovation Institute, EDGE Group, Space42 PLC"
                - paragraph [ref=e184]: "Intelligence engine: OnDemand"
                - status [ref=e185]
            - paragraph [ref=e186]:
              - text: GPT-5.6 Luna ·
              - generic [ref=e190]: Perplexity
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
                      - 'button "Perplexity: queued"':
                        - img "Perplexity"
                - group:
                  - generic "Developer details"
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
                            - 'generic "Perplexity: selected"': selected
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
  - alert [ref=e191]
```

# Test source

```ts
  1  | import AxeBuilder from "@axe-core/playwright";
  2  | import { test, expect, SCREENS } from "./helpers";
  3  | 
  4  | test.describe("Accessibility (axe, WCAG 2.0/2.1 A+AA)", () => {
  5  |   for (const s of SCREENS) {
  6  |     test(`${s.name}: no serious/critical violations`, async ({ page }, testInfo) => {
  7  |       await page.goto(s.path);
  8  |       await expect(page.locator("main, [role=main]").first()).toBeVisible();
  9  |       await page.waitForLoadState("networkidle").catch(() => {});
  10 |       const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  11 |       const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
  12 |       testInfo.annotations.push({
  13 |         type: "axe",
  14 |         description: JSON.stringify(r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }))),
  15 |       });
  16 |       expect(
  17 |         bad,
  18 |         JSON.stringify(
  19 |           bad.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.html) })),
  20 |           null,
  21 |           1,
  22 |         ),
> 23 |       ).toEqual([]);
     |         ^ Error: [
  24 |     });
  25 |   }
  26 | });
  27 | 
```