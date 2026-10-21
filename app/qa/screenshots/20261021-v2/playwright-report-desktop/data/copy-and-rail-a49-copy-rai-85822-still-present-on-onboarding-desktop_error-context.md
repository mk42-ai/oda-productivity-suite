# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: copy-and-rail.spec.ts >> a49 copy + rail >> overview/news ledes are short; brand line still present on onboarding
- Location: e2e/copy-and-rail.spec.ts:68:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Overview', exact: true, level: 1 })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Overview', exact: true, level: 1 }) with timeout 15000ms
  - waiting for getByRole('heading', { name: 'Overview', exact: true, level: 1 })

```

```yaml
- link "Skip to main content":
  - /url: "#main"
- note "Disclaimer": UAE AI Intelligence — Concept Demonstration Not an official government system · Public-source data, as of 21 Oct 2026 · No government logo or endorsement implied
- complementary "Primary navigation":
  - link "UAE AI Command Centre Concept demonstration UAE AI National Intelligence Command Centre — concept demonstration, not an official government system Home":
    - /url: /overview
  - button "Collapse navigation" [expanded]
  - navigation "Primary":
    - link "National Overview":
      - /url: /overview
    - link "Watchlist":
      - /url: /watchlist
    - link "Sentiment Universe":
      - /url: /sentiment
    - link "News Intelligence":
      - /url: /news
    - link "Tech Radar":
      - /url: /radar
    - link "Ecosystem Graph":
      - /url: /graph
    - link "Executive Chat":
      - /url: /chat
    - link "National Briefing":
      - /url: /briefing
    - link "Artifacts":
      - /url: /artifacts
    - link "Methodology":
      - /url: /methodology
    - link "Settings":
      - /url: /settings
  - button "Search organisations (Ctrl or Cmd + K)": Search ⌘K
  - button "Switch to dark mode": Dark
  - text: Namespace
  - code: uae_cc_v1
  - text: 50 orgs · 196 voices · 105 news
- main:
  - paragraph: National Overview · as of 21 Oct 2026
  - heading "UAE AI National Intelligence Command Centre" [level=1]
  - paragraph: A concept demonstration of how public-source signals about the UAE AI ecosystem — organisations, announcements, models and public discourse — can be fused into one command view. Every figure links back to its source; gaps are shown as gaps.
  - link "Generate National AI Briefing":
    - /url: /briefing
  - link "Ask the analyst":
    - /url: /chat
  - link "Organisations 50 34 independent ecosystems (parents ⊃ subsidiaries de-duplicated)":
    - /url: /watchlist
    - paragraph: Organisations
    - paragraph: "50"
    - paragraph: 34 independent ecosystems (parents ⊃ subsidiaries de-duplicated)
  - link "Research coverage 73% 45/50 with a verified source URL":
    - /url: /methodology
    - paragraph: Research coverage
    - paragraph: 73%
    - paragraph: 45/50 with a verified source URL
  - link "Public statements 196 43 explicit-UAE · 15 platforms":
    - /url: /sentiment
    - paragraph: Public statements
    - paragraph: "196"
    - paragraph: 43 explicit-UAE · 15 platforms
  - link "News events 105 27 in the last 30 days":
    - /url: /news
    - paragraph: News events
    - paragraph: "105"
    - paragraph: 27 in the last 30 days
  - link "Open models (HF) 154 tiiuae · inception42 · IFM · MBZUAI":
    - /url: /radar
    - paragraph: Open models (HF)
    - paragraph: "154"
    - paragraph: tiiuae · inception42 · IFM · MBZUAI
  - link "Relationships 168 104 nodes":
    - /url: /graph
    - paragraph: Relationships
    - paragraph: "168"
    - paragraph: 104 nodes
  - heading "National Pulse — public discourse by class" [level=2]
  - link "Open Sentiment Universe →":
    - /url: /sentiment
  - img "Class distribution"
  - list:
    - listitem: Optimists 37
    - listitem: Pragmatists 20
    - listitem: Skeptics 19
    - listitem: Safety Advocates 14
    - listitem: Disruption Concerned 8
    - listitem: Pessimists/Doomers 3
    - listitem: Neutral/Informational 95
  - paragraph:
    - strong: "Sampling disclaimer:"
    - text: Sentiment records are a purposive sample of public, attributable statements gathered via OnDemand research plugins (Perplexity, GPT Search, Internet search, Reddit/HN pages surfaced by those tools) between 2025-08 and 2026-10-20. It is NOT a population survey and does not measure national opinion.
  - paragraph: "Jobs & skills is the most contested topic: 35 statements, of which 9 skeptical or disruption-concerned."
  - heading "Watchlist composition" [level=2]
  - list:
    - listitem: company 20
    - listitem: subsidiary 14
    - listitem: government 12
    - listitem: research centre 2
    - listitem: university 2
  - paragraph:
    - text: "Identity check:"
    - strong: OFFICIAL_ASSET_NOT_PERMITTED / NOT_FOUND
    - text: — no government logo is used; this is a concept identity.
  - paragraph:
    - text: "Policy anchor: the UAE Cabinet created the"
    - link "Artificial Intelligence and Data Authority":
      - /url: /watchlist/ai-data-authority
    - text: on 2026-06-14, led by H.E. Omar Sultan Al Olama.
  - heading "Latest signals (last 30 days)" [level=2]
  - link "All news →":
    - /url: /news
  - list:
    - listitem:
      - time: 2026-12-07
      - link "GITEX GLOBAL 2026 scheduled for 7–11 December 2026 at Expo City Dubai (moved from October / DWTC)":
        - /url: https://www.gitex.com
      - paragraph: GITEX · —
    - listitem:
      - time: 2026-10-15
      - text: Jais 3 announced
      - superscript: unverified
      - paragraph: source unverified · —
    - listitem:
      - time: 2026-10-15
      - link "UAE launches Jais 3 Arabic-native AI":
        - /url: https://gulfnews.com/uae/uae-launches-jais-3-arabic-native-ai-for-speech-writing-and-agents-1.500711935
      - paragraph: Gulf News · Inception (Inception42, G42), Mohamed bin Zayed University of Artificial Intelligence
    - listitem:
      - time: 2026-10-15
      - link "Jais 3 Arabic-native AI model announced":
        - /url: https://gulfnews.com/uae/uae-launches-jais-3-arabic-native-ai-for-speech-writing-and-agents-1.500711935
      - paragraph: Gulf News · Inception (Inception42, G42), Mohamed bin Zayed University of Artificial Intelligence
    - listitem:
      - time: 2026-10-15
      - link "MBZUAI’s Institute of Foundation Models and Inception42 launch Jais 3":
        - /url: https://mbzuai.ac.ae/news-events/news/mbzuais-institute-foundation-models-inception42-launch-jais-3-arabic-native-ai
      - paragraph: MBZUAI · Cerebras Systems, Inception (Inception42, G42), Mohamed bin Zayed University of Artificial Intelligence
    - listitem:
      - time: 2026-10-14
      - link "Inception describes AI-assisted investment and procurement workflows at SIF 2026":
        - /url: https://www.bignewsnetwork.com/news/279374613/microsoft-uae-g42-explore-human-led-agent-operated-businesses-at-sif-2026
      - paragraph: WAM · Inception (Inception42, G42)
    - listitem:
      - time: 2026-10-07
      - text: Falcon-Emirati 7B announced
      - superscript: unverified
      - paragraph: source unverified · Technology Innovation Institute
    - listitem:
      - time: 2026-10-07
      - link "Falcon-Emirati model launched":
        - /url: https://gulfbusiness.com/en/2026/artificial-intelligence/uae-tii-falcon-emirati-arabic-ai-model/
      - paragraph: Gulf Business · Advanced Technology Research Council, Technology Innovation Institute
  - heading "Most-cited organisations" [level=2]
  - list:
    - listitem:
      - link "G42 — icon from official domain G42 29 news":
        - /url: /watchlist/g42
        - img "G42 — icon from official domain"
        - text: G42 29 news
    - listitem:
      - link "Khazna Data Centers Khazna Data Centers 11 news":
        - /url: /watchlist/khazna
        - img "Khazna Data Centers": KD
        - text: Khazna Data Centers 11 news
    - listitem:
      - link "M42 M42 9 news":
        - /url: /watchlist/m42
        - img "M42": M
        - text: M42 9 news
    - listitem:
      - link "Mohamed bin Zayed University of Artificial Intelligence Mohamed bin Zayed University of Artificial Intelligence 8 news":
        - /url: /watchlist/mbzuai
        - img "Mohamed bin Zayed University of Artificial Intelligence": MB
        - text: Mohamed bin Zayed University of Artificial Intelligence 8 news
    - listitem:
      - link "Core42 Core42 8 news":
        - /url: /watchlist/core42
        - img "Core42": C
        - text: Core42 8 news
    - listitem:
      - link "Technology Innovation Institute Technology Innovation Institute 7 news":
        - /url: /watchlist/tii
        - img "Technology Innovation Institute": TI
        - text: Technology Innovation Institute 7 news
    - listitem:
      - link "Inception (Inception42, G42) Inception (Inception42, G42) 6 news":
        - /url: /watchlist/inception
        - img "Inception (Inception42, G42)": I
        - text: Inception (Inception42, G42) 6 news
    - listitem:
      - link "Micropolis Robotics — icon from official domain Micropolis Robotics 6 news":
        - /url: /watchlist/micropolis
        - img "Micropolis Robotics — icon from official domain"
        - text: Micropolis Robotics 6 news
  - paragraph: "Intelligence engine: OnDemand (AIREV) · Agents Flow Builder execution store"
  - heading "Live pipeline — scheduled OnDemand workflows" [level=2]
  - text: namespace uae_cc_v1
  - paragraph:
    - text: ingest
    - code: 0 0 */2 * * *
  - paragraph: "last run: success · 43 min ago (cron)"
  - paragraph: "next: 2026-10-21 12:00 UTC"
  - paragraph: workflow 6ad7f32d5e60695bc4d052cb
  - paragraph:
    - text: briefing
    - code: 0 30 2 * * *
  - paragraph: "last run: success · 6 h ago (api)"
  - paragraph: "next: 2026-10-22 02:30 UTC"
  - paragraph: workflow 6ad7f32e5e60695bc4d052d2
  - paragraph:
    - text: checkpoint
    - code: 0 */30 * * * *
  - paragraph: "last run: success · 13 min ago (cron)"
  - paragraph: "next: 2026-10-21 11:00 UTC"
  - paragraph: workflow 6ad7f32e5e60695bc4d052d7
  - paragraph: Newest ingested news (11)
  - list:
    - listitem:
      - link "New intelligence powers government, scientific discovery and critical infrastructure at Ai Everything Abu Dhabi":
        - /url: https://iot-now.com/2026/10/05/158707-ai-everything-abu-dhabi-government-scientific-discovery-critical-infrastructure/
      - text: IoT Now · 2026-10-05 · via Perplexity · conf 0.98
    - listitem:
      - link "Abu Dhabi’s Inception42 adds AI to boardroom decisions":
        - /url: https://www.agbi.com/ai/2026/10/abu-dhabis-inception42-adds-ai-to-boardroom-decisions/
      - text: AGBI · date n/a · via Perplexity · conf 0.98
    - listitem:
      - 'link "The UAE Artificial Intelligence and Data Authority: What It Means for AI, Data, and Digital Governance"':
        - /url: https://www.glaco.com/blog/the-uae-artificial-intelligence-and-data-authority-what-it-means-for-ai-data-and-digital-governance/
      - text: GLA & Company · 2026-08-27 · via Perplexity · conf 0.98
    - listitem:
      - link "e& UAE Launches Business Pro AI Plans With Microsoft Copilot for SMEs":
        - /url: https://techafricanews.com/2026/08/24/eand-uae-business-pro-ai-microsoft-copilot-smes/
      - text: TechAfrica News · 2026-08-24 · via Perplexity · conf 0.98
    - listitem:
      - link "UAE plans agentic AI integration across half of government operations":
        - /url: https://www.foxnews.com/tech/united-arab-emirates-plans-ai-run-government-within-two-years
      - text: Fox News · date n/a · via Perplexity · conf 0.98
    - listitem:
      - link "UAE’s Top AI Firm G42 Considers Selling Majority Stake to US Companies":
        - /url: https://finance.yahoo.com/technology/ai/articles/uae-top-ai-firm-g42-143857969.html
      - text: Yahoo Finance · date n/a · via Perplexity · conf 0.98
  - paragraph: Newest classified statements (5)
  - list:
    - listitem:
      - text: Safety Advocates — “The UAE is investing heavily in artificial intelligence, but many businesses are struggling to keep the technology safe.”
      - link "unattributed · analyticsinsight.ae":
        - /url: https://www.analyticsinsight.ae/news/uaes-ai-boom-faces-a-governance-test-as-98-of-security-teams-report-risks
    - listitem:
      - text: Neutral/Informational — “Organisations operating in the UAE should understand both what has changed and what remains to be determined.”
      - link "unattributed · glaco.com":
        - /url: https://www.glaco.com/blog/the-uae-artificial-intelligence-and-data-authority-what-it-means-for-ai-data-and-digital-governance/
    - listitem:
      - text: Optimists — “The UAE was committed to developing “a more efficient, agile, and proactive global government model” that leverages”
      - link "Sheikh Mohammed bin Rashid · globalgovernmentforum.com":
        - /url: https://www.globalgovernmentforum.com/uae-creates-dedicated-artificial-intelligence-and-data-authority-to-build-government-of-the-future/
    - listitem:
      - text: Optimists — “ICP revealed plans to transform 50% of its sectors, services, and operations into autonomous and AI-led models within the next two years.”
      - link "unattributed · alarabiyagroup.ae":
        - /url: https://alarabiyagroup.ae/uae-ai-government-push-residents-businesses/
    - listitem:
      - text: Optimists — “The United States and the United Arab Emirates have signed an agreement that will help vault the Gulf country to become a rising power in artificial intelligenc…”
      - link "unattributed · nytimes.com":
        - /url: https://www.nytimes.com/2025/05/15/us/politics/ai-us-abu-dhabi.html
  - paragraph: "Provenance on every record: source URL, run timestamp 2026-10-21T10:02:24.416Z, plugin, confidence, execution 6ad88d20c2cfee207e8f4204. Records without a source URL are dropped (0 this run). Live records are additive to the curated seed and are not merged into its counts."
  - heading "Technology & Innovation Radar — snapshot" [level=2]
  - link "Open radar →":
    - /url: /radar
  - paragraph: Agentic AI in government
  - paragraph: assess · 18 signals · latest 2026-10-15
  - paragraph: AI data centres & compute
  - paragraph: assess · 17 signals · latest 2026-10
  - paragraph: Arabic & sovereign LLMs
  - paragraph: adopt · 15 signals · latest 2026-10-15
  - paragraph: AI chips & export controls
  - paragraph: adopt · 15 signals · latest 2026-10-20
  - paragraph: Robotics & autonomy
  - paragraph: adopt · 11 signals · latest 2026-09-30
  - paragraph: Health & document AI
  - paragraph: adopt · 10 signals · latest 2026-10-07
  - paragraph: Sovereign cloud
  - paragraph: adopt · 6 signals · latest 2026-09
  - paragraph: AI governance & regulation
  - paragraph: adopt · 5 signals · latest 2026-10-07
- contentinfo:
  - strong: Concept Demonstration — not an official government system.
  - text: Public sources only · no government logo or endorsement implied. Data namespace uae_cc_v1 · as of 2026-10-21 ·
  - link "Methodology & limitations":
    - /url: /methodology
  - text: "Intelligence engine: OnDemand (AIREV) v1.0.0 · local · last updated"
  - time: 2026-10-21 10:29 UTC
- region "Notifications alt+T"
- alert
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
  53 |     await expect(title).toHaveText(/^Chat$/);
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
> 71 |     await expect(page.getByRole("heading", { level: 1, name: "Overview", exact: true })).toBeVisible();
     |                                                                                          ^ Error: expect(locator).toBeVisible() failed
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