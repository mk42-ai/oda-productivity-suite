# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> Accessibility (axe, WCAG 2.0/2.1 A+AA) >> company: no serious/critical violations
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