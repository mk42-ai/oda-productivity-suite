# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: context-sync.spec.ts >> context line + POST /api/chat systemContext mirror the inspector chips (remove one company)
- Location: e2e/context-sync.spec.ts:20:5

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /^Context: 5 companies — /
Received string:  "Context: 5 organisations — Mohamed bin Zayed University of Artificial Intelligence, G42, Technology Innovation Institute, EDGE Group, Space42 PLC"
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
                  - heading "Plugins (14 available · 1 on this turn)" [level=3]
                  - paragraph: loading live directory… showing curated (14)
                  - searchbox "Search all plugins"
                  - paragraph: Showing 14 of 14
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
                            - 'generic "Internet: suggested"': suggested
                      - switch "Use Internet this turn"
                    - listitem:
                      - generic:
                        - img "GPT Search"
                        - generic:
                          - paragraph:
                            - generic: GPT Search
                            - generic: research
                            - 'generic "GPT Search: suggested"': suggested
                      - switch "Use GPT Search this turn"
                    - listitem:
                      - generic:
                        - img "X Search Agent"
                        - generic:
                          - paragraph:
                            - generic: X Search Agent
                            - generic: general
                            - 'generic "X Search Agent: suggested"': suggested
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
                            - 'generic "Tiktok: suggested"': suggested
                      - switch "Use Tiktok this turn"
                    - listitem:
                      - generic:
                        - generic [aria-hidden]: I
                        - generic:
                          - paragraph:
                            - generic: Instagram User Info Extracter
                            - generic: general
                            - 'generic "Instagram User Info Extracter: suggested"': suggested
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
                            - 'generic "Reddit Posts: suggested"': suggested
                      - switch "Use Reddit Posts this turn"
                    - listitem:
                      - generic:
                        - img "Linkedin Search"
                        - generic:
                          - paragraph:
                            - generic: Linkedin Search
                            - generic: research
                            - 'generic "Linkedin Search: suggested"': suggested
                      - switch "Use Linkedin Search this turn"
                    - listitem:
                      - generic:
                        - img "US Stock Fundamental Analysis"
                        - generic:
                          - paragraph:
                            - generic: US Stock Fundamental Analysis
                            - generic: general
                            - 'generic "US Stock Fundamental Analysis: suggested"': suggested
                      - switch "Use US Stock Fundamental Analysis this turn"
                    - listitem:
                      - generic:
                        - img "US Stock Technical Analysis"
                        - generic:
                          - paragraph:
                            - generic: US Stock Technical Analysis
                            - generic: finance
                            - 'generic "US Stock Technical Analysis: suggested"': suggested
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
                  - paragraph: Applies to your next question — nothing is substituted if a plugin fails.
  - region "Notifications alt+T"
  - alert [ref=e191]
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
> 30 |   expect(before).toMatch(/^Context: 5 companies — /);
     |                  ^ Error: expect(received).toMatch(expected)
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
  79 |   await expect(line).toHaveText("Context: none — pick up to 5 companies in the inspector", { timeout: 30_000 });
  80 |   const ws = await line.evaluate((el) => getComputedStyle(el).whiteSpace);
  81 |   expect(ws).not.toBe("nowrap");
  82 | });
  83 | 
```