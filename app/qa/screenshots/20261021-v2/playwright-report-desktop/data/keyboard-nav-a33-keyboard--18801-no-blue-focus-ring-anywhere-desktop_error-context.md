# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: keyboard-nav.spec.ts >> a33 keyboard nav >> nav rail: Tab + arrows, no blue focus ring anywhere
- Location: e2e/keyboard-nav.spec.ts:57:7

# Error details

```
Error: blue focus ring on null: rgb(37, 99, 235)

expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Skip to main content" [active] [ref=e2] [cursor=pointer]:
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
            - generic [ref=e110]:
              - generic [ref=e111]:
                - paragraph [ref=e112]: National Overview · as of 21 Oct 2026
                - heading "UAE AI National Intelligence Command Centre" [level=1] [ref=e113]
                - paragraph [ref=e114]: A concept demonstration of how public-source signals about the UAE AI ecosystem — organisations, announcements, models and public discourse — can be fused into one command view. Every figure links back to its source; gaps are shown as gaps.
              - generic [ref=e115]:
                - link "Generate National AI Briefing" [ref=e116] [cursor=pointer]:
                  - /url: /briefing
                - link "Ask the analyst" [ref=e117] [cursor=pointer]:
                  - /url: /chat
            - generic [ref=e118]:
              - link [ref=e119] [cursor=pointer]:
                - /url: /watchlist
                - paragraph [ref=e120]: Organisations
                - paragraph [ref=e121]: "50"
                - paragraph [ref=e122]: 34 independent ecosystems (parents ⊃ subsidiaries de-duplicated)
              - link [ref=e123] [cursor=pointer]:
                - /url: /methodology
                - paragraph [ref=e124]: Research coverage
                - paragraph [ref=e125]: 73%
                - paragraph [ref=e126]: 45/50 with a verified source URL
              - link [ref=e127] [cursor=pointer]:
                - /url: /sentiment
                - paragraph [ref=e128]: Public statements
                - paragraph [ref=e129]: "196"
                - paragraph [ref=e130]: 43 explicit-UAE · 15 platforms
              - link [ref=e131] [cursor=pointer]:
                - /url: /news
                - paragraph [ref=e132]: News events
                - paragraph [ref=e133]: "105"
                - paragraph [ref=e134]: 27 in the last 30 days
              - link [ref=e135] [cursor=pointer]:
                - /url: /radar
                - paragraph [ref=e136]: Open models (HF)
                - paragraph [ref=e137]: "154"
                - paragraph [ref=e138]: tiiuae · inception42 · IFM · MBZUAI
              - link [ref=e139] [cursor=pointer]:
                - /url: /graph
                - paragraph [ref=e140]: Relationships
                - paragraph [ref=e141]: "168"
                - paragraph [ref=e142]: 104 nodes
            - generic [ref=e143]:
              - generic [ref=e144]:
                - generic [ref=e145]:
                  - heading "National Pulse — public discourse by class" [level=2] [ref=e146]
                  - link "Open Sentiment Universe →" [ref=e147] [cursor=pointer]:
                    - /url: /sentiment
                - img "Class distribution" [ref=e148]:
                  - 'generic "Optimists: 37" [ref=e149]'
                  - 'generic "Pragmatists: 20" [ref=e150]'
                  - 'generic "Skeptics: 19" [ref=e151]'
                  - 'generic "Safety Advocates: 14" [ref=e152]'
                  - 'generic "Disruption Concerned: 8" [ref=e153]'
                  - 'generic "Pessimists/Doomers: 3" [ref=e154]'
                  - 'generic "Neutral/Informational: 95" [ref=e155]'
                - list [ref=e156]:
                  - listitem [ref=e157]:
                    - generic [ref=e158]: Optimists
                    - generic [ref=e160]: "37"
                  - listitem [ref=e161]:
                    - generic [ref=e162]: Pragmatists
                    - generic [ref=e164]: "20"
                  - listitem [ref=e165]:
                    - generic [ref=e166]: Skeptics
                    - generic [ref=e168]: "19"
                  - listitem [ref=e169]:
                    - generic [ref=e170]: Safety Advocates
                    - generic [ref=e172]: "14"
                  - listitem [ref=e173]:
                    - generic [ref=e174]: Disruption Concerned
                    - generic [ref=e176]: "8"
                  - listitem [ref=e177]:
                    - generic [ref=e178]: Pessimists/Doomers
                    - generic [ref=e180]: "3"
                  - listitem [ref=e181]:
                    - generic [ref=e182]: Neutral/Informational
                    - generic [ref=e184]: "95"
                - paragraph [ref=e185]:
                  - strong [ref=e186]: "Sampling disclaimer:"
                  - text: Sentiment records are a purposive sample of public, attributable statements gathered via OnDemand research plugins (Perplexity, GPT Search, Internet search, Reddit/HN pages surfaced by those tools) between 2025-08 and 2026-10-20. It is NOT a population survey and does not measure national opinion.
                - paragraph [ref=e187]: "Jobs & skills is the most contested topic: 35 statements, of which 9 skeptical or disruption-concerned."
              - generic [ref=e188]:
                - heading "Watchlist composition" [level=2] [ref=e190]
                - list [ref=e191]:
                  - listitem [ref=e192]:
                    - generic [ref=e193]: company
                    - generic [ref=e196]: "20"
                  - listitem [ref=e197]:
                    - generic [ref=e198]: subsidiary
                    - generic [ref=e201]: "14"
                  - listitem [ref=e202]:
                    - generic [ref=e203]: government
                    - generic [ref=e206]: "12"
                  - listitem [ref=e207]:
                    - generic [ref=e208]: research centre
                    - generic [ref=e211]: "2"
                  - listitem [ref=e212]:
                    - generic [ref=e213]: university
                    - generic [ref=e216]: "2"
                - paragraph [ref=e217]:
                  - text: "Identity check:"
                  - strong [ref=e218]: OFFICIAL_ASSET_NOT_PERMITTED / NOT_FOUND
                  - text: — no government logo is used; this is a concept identity.
                - paragraph [ref=e219]:
                  - text: "Policy anchor: the UAE Cabinet created the"
                  - link "Artificial Intelligence and Data Authority" [ref=e220] [cursor=pointer]:
                    - /url: /watchlist/ai-data-authority
                  - text: on 2026-06-14, led by H.E. Omar Sultan Al Olama.
            - generic [ref=e221]:
              - generic [ref=e222]:
                - generic [ref=e223]:
                  - heading "Latest signals (last 30 days)" [level=2] [ref=e224]
                  - link "All news →" [ref=e225] [cursor=pointer]:
                    - /url: /news
                - list [ref=e226]:
                  - listitem [ref=e227]:
                    - time [ref=e228]: 2026-12-07
                    - generic [ref=e229]:
                      - link "GITEX GLOBAL 2026 scheduled for 7–11 December 2026 at Expo City Dubai (moved from October / DWTC)" [ref=e230] [cursor=pointer]:
                        - /url: https://www.gitex.com
                      - paragraph [ref=e231]: GITEX · —
                  - listitem [ref=e232]:
                    - time [ref=e233]: 2026-10-15
                    - generic [ref=e234]:
                      - generic "source URL not verified in the research corpus — link disabled" [ref=e235]:
                        - text: Jais 3 announced
                        - superscript [ref=e236]: unverified
                      - paragraph [ref=e237]: source unverified · —
                  - listitem [ref=e238]:
                    - time [ref=e239]: 2026-10-15
                    - generic [ref=e240]:
                      - link "UAE launches Jais 3 Arabic-native AI" [ref=e241] [cursor=pointer]:
                        - /url: https://gulfnews.com/uae/uae-launches-jais-3-arabic-native-ai-for-speech-writing-and-agents-1.500711935
                      - paragraph [ref=e242]: Gulf News · Inception (Inception42, G42), Mohamed bin Zayed University of Artificial Intelligence
                  - listitem [ref=e243]:
                    - time [ref=e244]: 2026-10-15
                    - generic [ref=e245]:
                      - link "Jais 3 Arabic-native AI model announced" [ref=e246] [cursor=pointer]:
                        - /url: https://gulfnews.com/uae/uae-launches-jais-3-arabic-native-ai-for-speech-writing-and-agents-1.500711935
                      - paragraph [ref=e247]: Gulf News · Inception (Inception42, G42), Mohamed bin Zayed University of Artificial Intelligence
                  - listitem [ref=e248]:
                    - time [ref=e249]: 2026-10-15
                    - generic [ref=e250]:
                      - link "MBZUAI’s Institute of Foundation Models and Inception42 launch Jais 3" [ref=e251] [cursor=pointer]:
                        - /url: https://mbzuai.ac.ae/news-events/news/mbzuais-institute-foundation-models-inception42-launch-jais-3-arabic-native-ai
                      - paragraph [ref=e252]: MBZUAI · Cerebras Systems, Inception (Inception42, G42), Mohamed bin Zayed University of Artificial Intelligence
                  - listitem [ref=e253]:
                    - time [ref=e254]: 2026-10-14
                    - generic [ref=e255]:
                      - link "Inception describes AI-assisted investment and procurement workflows at SIF 2026" [ref=e256] [cursor=pointer]:
                        - /url: https://www.bignewsnetwork.com/news/279374613/microsoft-uae-g42-explore-human-led-agent-operated-businesses-at-sif-2026
                      - paragraph [ref=e257]: WAM · Inception (Inception42, G42)
                  - listitem [ref=e258]:
                    - time [ref=e259]: 2026-10-07
                    - generic [ref=e260]:
                      - generic "source URL not verified in the research corpus — link disabled" [ref=e261]:
                        - text: Falcon-Emirati 7B announced
                        - superscript [ref=e262]: unverified
                      - paragraph [ref=e263]: source unverified · Technology Innovation Institute
                  - listitem [ref=e264]:
                    - time [ref=e265]: 2026-10-07
                    - generic [ref=e266]:
                      - link "Falcon-Emirati model launched" [ref=e267] [cursor=pointer]:
                        - /url: https://gulfbusiness.com/en/2026/artificial-intelligence/uae-tii-falcon-emirati-arabic-ai-model/
                      - paragraph [ref=e268]: Gulf Business · Advanced Technology Research Council, Technology Innovation Institute
              - generic [ref=e269]:
                - heading "Most-cited organisations" [level=2] [ref=e271]
                - list [ref=e272]:
                  - listitem [ref=e273]:
                    - link "G42 — icon from official domain G42 29 news" [ref=e274] [cursor=pointer]:
                      - /url: /watchlist/g42
                      - img "G42 — icon from official domain" [ref=e275]
                      - generic [ref=e276]: G42
                      - generic [ref=e277]: 29 news
                  - listitem [ref=e278]:
                    - link "Khazna Data Centers Khazna Data Centers 11 news" [ref=e279] [cursor=pointer]:
                      - /url: /watchlist/khazna
                      - img "Khazna Data Centers" [ref=e280]: KD
                      - generic [ref=e281]: Khazna Data Centers
                      - generic [ref=e282]: 11 news
                  - listitem [ref=e283]:
                    - link "M42 M42 9 news" [ref=e284] [cursor=pointer]:
                      - /url: /watchlist/m42
                      - img "M42" [ref=e285]: M
                      - generic [ref=e286]: M42
                      - generic [ref=e287]: 9 news
                  - listitem [ref=e288]:
                    - link "Mohamed bin Zayed University of Artificial Intelligence Mohamed bin Zayed University of Artificial Intelligence 8 news" [ref=e289] [cursor=pointer]:
                      - /url: /watchlist/mbzuai
                      - img "Mohamed bin Zayed University of Artificial Intelligence" [ref=e290]: MB
                      - generic [ref=e291]: Mohamed bin Zayed University of Artificial Intelligence
                      - generic [ref=e292]: 8 news
                  - listitem [ref=e293]:
                    - link "Core42 Core42 8 news" [ref=e294] [cursor=pointer]:
                      - /url: /watchlist/core42
                      - img "Core42" [ref=e295]: C
                      - generic [ref=e296]: Core42
                      - generic [ref=e297]: 8 news
                  - listitem [ref=e298]:
                    - link "Technology Innovation Institute Technology Innovation Institute 7 news" [ref=e299] [cursor=pointer]:
                      - /url: /watchlist/tii
                      - img "Technology Innovation Institute" [ref=e300]: TI
                      - generic [ref=e301]: Technology Innovation Institute
                      - generic [ref=e302]: 7 news
                  - listitem [ref=e303]:
                    - link "Inception (Inception42, G42) Inception (Inception42, G42) 6 news" [ref=e304] [cursor=pointer]:
                      - /url: /watchlist/inception
                      - img "Inception (Inception42, G42)" [ref=e305]: I
                      - generic [ref=e306]: Inception (Inception42, G42)
                      - generic [ref=e307]: 6 news
                  - listitem [ref=e308]:
                    - link "Micropolis Robotics — icon from official domain Micropolis Robotics 6 news" [ref=e309] [cursor=pointer]:
                      - /url: /watchlist/micropolis
                      - img "Micropolis Robotics — icon from official domain" [ref=e310]
                      - generic [ref=e311]: Micropolis Robotics
                      - generic [ref=e312]: 6 news
            - generic [ref=e313]:
              - paragraph [ref=e314]: "Intelligence engine: OnDemand (AIREV) · Agents Flow Builder execution store"
              - generic [ref=e316]:
                - heading "Live pipeline — scheduled OnDemand workflows" [level=2] [ref=e317]
                - generic [ref=e320]: namespace uae_cc_v1
              - paragraph [ref=e321]: Reading the workflow execution store…
            - generic [ref=e324]:
              - generic [ref=e325]:
                - heading "Technology & Innovation Radar — snapshot" [level=2] [ref=e326]
                - link "Open radar →" [ref=e327] [cursor=pointer]:
                  - /url: /radar
              - generic [ref=e328]:
                - generic [ref=e329]:
                  - paragraph [ref=e330]: Agentic AI in government
                  - paragraph [ref=e331]: assess · 18 signals · latest 2026-10-15
                - generic [ref=e332]:
                  - paragraph [ref=e333]: AI data centres & compute
                  - paragraph [ref=e334]: assess · 17 signals · latest 2026-10
                - generic [ref=e335]:
                  - paragraph [ref=e336]: Arabic & sovereign LLMs
                  - paragraph [ref=e337]: adopt · 15 signals · latest 2026-10-15
                - generic [ref=e338]:
                  - paragraph [ref=e339]: AI chips & export controls
                  - paragraph [ref=e340]: adopt · 15 signals · latest 2026-10-20
                - generic [ref=e341]:
                  - paragraph [ref=e342]: Robotics & autonomy
                  - paragraph [ref=e343]: adopt · 11 signals · latest 2026-09-30
                - generic [ref=e344]:
                  - paragraph [ref=e345]: Health & document AI
                  - paragraph [ref=e346]: adopt · 10 signals · latest 2026-10-07
                - generic [ref=e347]:
                  - paragraph [ref=e348]: Sovereign cloud
                  - paragraph [ref=e349]: adopt · 6 signals · latest 2026-09
                - generic [ref=e350]:
                  - paragraph [ref=e351]: AI governance & regulation
                  - paragraph [ref=e352]: adopt · 5 signals · latest 2026-10-07
        - contentinfo [ref=e353]:
          - generic [ref=e354]:
            - generic [ref=e355]:
              - strong [ref=e356]: Concept Demonstration — not an official government system.
              - text: Public sources only · no government logo or endorsement implied.
            - generic [ref=e357]:
              - text: Data namespace uae_cc_v1 · as of 2026-10-21 ·
              - link "Methodology & limitations" [ref=e358] [cursor=pointer]:
                - /url: /methodology
            - generic [ref=e359]: "Intelligence engine: OnDemand (AIREV)"
            - generic [ref=e362]:
              - text: v1.0.0 · local · last updated
              - time [ref=e363]: 2026-10-21 10:29 UTC
  - region "Notifications alt+T"
  - alert [ref=e364]
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
  24 |     await expect(links.first()).toBeVisible();
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
> 65 |       expect(isBlue(info.outline), `blue focus ring on ${info.testid}: ${info.outline}`).toBe(false);
     |                                                                                          ^ Error: blue focus ring on null: rgb(37, 99, 235)
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