# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-smoke.spec.ts >> live smoke 390x844 >> nav links + back/forward
- Location: e2e/live-smoke.spec.ts:52:9

# Error details

```
Test timeout of 240000ms exceeded.
```

```
Error: locator.scrollIntoViewIfNeeded: Test timeout of 240000ms exceeded.
Call log:
  - waiting for getByTestId('primary-nav').getByTestId('nav-companies')

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
    - generic [ref=e7]:
      - navigation "Mobile navigation" [ref=e8]:
        - generic [ref=e9]:
          - button "Open navigation" [ref=e10] [cursor=pointer]
          - link "UAE AI Command Centre Concept demonstration UAE AI National Intelligence Command Centre — concept demonstration, not an official government system Home" [ref=e12] [cursor=pointer]:
            - /url: /overview
            - generic [ref=e13]:
              - generic [ref=e15]:
                - generic [ref=e16]: UAE AI Command Centre
                - generic [ref=e17]: Concept demonstration
              - generic [ref=e18]: UAE AI National Intelligence Command Centre — concept demonstration, not an official government system
            - generic [ref=e19]: Home
        - button "Switch to dark mode" [ref=e21]
      - dialog [aria-hidden]:
        - generic:
          - link:
            - /url: /overview
            - generic:
              - generic:
                - generic: UAE AI Command Centre
                - generic: Concept demonstration
              - generic: UAE AI National Intelligence Command Centre — concept demonstration, not an official government system
            - generic: Home
          - button
        - generic:
          - navigation:
            - link:
              - /url: /overview
              - generic: National Overview
            - link:
              - /url: /watchlist
              - generic: Watchlist
            - link:
              - /url: /sentiment
              - generic: Sentiment Universe
            - link:
              - /url: /news
              - generic: News Intelligence
            - link:
              - /url: /radar
              - generic: Tech Radar
            - link:
              - /url: /graph
              - generic: Ecosystem Graph
            - link:
              - /url: /chat
              - generic: Executive Chat
            - link:
              - /url: /briefing
              - generic: National Briefing
            - link:
              - /url: /artifacts
              - generic: Artifacts
            - link:
              - /url: /methodology
              - generic: Methodology
            - link:
              - /url: /settings
              - generic: Settings
        - generic:
          - button:
            - generic: Dark
          - generic:
            - generic:
              - text: Namespace
              - code: uae_cc_v1
            - generic: 50 orgs · 196 voices · 105 news
      - generic [ref=e24]:
        - main [ref=e25]:
          - generic [ref=e26]:
            - generic [ref=e27]:
              - generic [ref=e28]:
                - paragraph [ref=e29]: National Overview · as of 21 Oct 2026
                - heading "UAE AI National Intelligence Command Centre" [level=1] [ref=e30]
                - paragraph [ref=e31]: A concept demonstration of how public-source signals about the UAE AI ecosystem — organisations, announcements, models and public discourse — can be fused into one command view. Every figure links back to its source; gaps are shown as gaps.
              - generic [ref=e32]:
                - link "Generate National AI Briefing" [ref=e33] [cursor=pointer]:
                  - /url: /briefing
                - link "Ask the analyst" [ref=e34] [cursor=pointer]:
                  - /url: /chat
            - generic [ref=e35]:
              - link [ref=e36] [cursor=pointer]:
                - /url: /watchlist
                - paragraph [ref=e37]: Organisations
                - paragraph [ref=e38]: "50"
                - paragraph [ref=e39]: 34 independent ecosystems (parents ⊃ subsidiaries de-duplicated)
              - link [ref=e40] [cursor=pointer]:
                - /url: /methodology
                - paragraph [ref=e41]: Research coverage
                - paragraph [ref=e42]: 73%
                - paragraph [ref=e43]: 45/50 with a verified source URL
              - link [ref=e44] [cursor=pointer]:
                - /url: /sentiment
                - paragraph [ref=e45]: Public statements
                - paragraph [ref=e46]: "196"
                - paragraph [ref=e47]: 43 explicit-UAE · 15 platforms
              - link [ref=e48] [cursor=pointer]:
                - /url: /news
                - paragraph [ref=e49]: News events
                - paragraph [ref=e50]: "105"
                - paragraph [ref=e51]: 27 in the last 30 days
              - link [ref=e52] [cursor=pointer]:
                - /url: /radar
                - paragraph [ref=e53]: Open models (HF)
                - paragraph [ref=e54]: "154"
                - paragraph [ref=e55]: tiiuae · inception42 · IFM · MBZUAI
              - link [ref=e56] [cursor=pointer]:
                - /url: /graph
                - paragraph [ref=e57]: Relationships
                - paragraph [ref=e58]: "168"
                - paragraph [ref=e59]: 104 nodes
            - generic [ref=e60]:
              - generic [ref=e61]:
                - generic [ref=e62]:
                  - heading "National Pulse — public discourse by class" [level=2] [ref=e63]
                  - link "Open Sentiment Universe →" [ref=e64] [cursor=pointer]:
                    - /url: /sentiment
                - img "Class distribution" [ref=e65]:
                  - 'generic "Optimists: 37" [ref=e66]'
                  - 'generic "Pragmatists: 20" [ref=e67]'
                  - 'generic "Skeptics: 19" [ref=e68]'
                  - 'generic "Safety Advocates: 14" [ref=e69]'
                  - 'generic "Disruption Concerned: 8" [ref=e70]'
                  - 'generic "Pessimists/Doomers: 3" [ref=e71]'
                  - 'generic "Neutral/Informational: 95" [ref=e72]'
                - list [ref=e73]:
                  - listitem [ref=e74]:
                    - generic [ref=e75]: Optimists
                    - generic [ref=e77]: "37"
                  - listitem [ref=e78]:
                    - generic [ref=e79]: Pragmatists
                    - generic [ref=e81]: "20"
                  - listitem [ref=e82]:
                    - generic [ref=e83]: Skeptics
                    - generic [ref=e85]: "19"
                  - listitem [ref=e86]:
                    - generic [ref=e87]: Safety Advocates
                    - generic [ref=e89]: "14"
                  - listitem [ref=e90]:
                    - generic [ref=e91]: Disruption Concerned
                    - generic [ref=e93]: "8"
                  - listitem [ref=e94]:
                    - generic [ref=e95]: Pessimists/Doomers
                    - generic [ref=e97]: "3"
                  - listitem [ref=e98]:
                    - generic [ref=e99]: Neutral/Informational
                    - generic [ref=e101]: "95"
                - paragraph [ref=e102]:
                  - strong [ref=e103]: "Sampling disclaimer:"
                  - text: Sentiment records are a purposive sample of public, attributable statements gathered via OnDemand research plugins (Perplexity, GPT Search, Internet search, Reddit/HN pages surfaced by those tools) between 2025-08 and 2026-10-20. It is NOT a population survey and does not measure national opinion.
                - paragraph [ref=e104]: "Jobs & skills is the most contested topic: 35 statements, of which 9 skeptical or disruption-concerned."
              - generic [ref=e105]:
                - heading "Watchlist composition" [level=2] [ref=e107]
                - list [ref=e108]:
                  - listitem [ref=e109]:
                    - generic [ref=e110]: company
                    - generic [ref=e113]: "20"
                  - listitem [ref=e114]:
                    - generic [ref=e115]: subsidiary
                    - generic [ref=e118]: "14"
                  - listitem [ref=e119]:
                    - generic [ref=e120]: government
                    - generic [ref=e123]: "12"
                  - listitem [ref=e124]:
                    - generic [ref=e125]: research centre
                    - generic [ref=e128]: "2"
                  - listitem [ref=e129]:
                    - generic [ref=e130]: university
                    - generic [ref=e133]: "2"
                - paragraph [ref=e134]:
                  - text: "Identity check:"
                  - strong [ref=e135]: OFFICIAL_ASSET_NOT_PERMITTED / NOT_FOUND
                  - text: — no government logo is used; this is a concept identity.
                - paragraph [ref=e136]:
                  - text: "Policy anchor: the UAE Cabinet created the"
                  - link "Artificial Intelligence and Data Authority" [ref=e137] [cursor=pointer]:
                    - /url: /watchlist/ai-data-authority
                  - text: on 2026-06-14, led by H.E. Omar Sultan Al Olama.
            - generic [ref=e138]:
              - generic [ref=e139]:
                - generic [ref=e140]:
                  - heading "Latest signals (last 30 days)" [level=2] [ref=e141]
                  - link "All news →" [ref=e142] [cursor=pointer]:
                    - /url: /news
                - list [ref=e143]:
                  - listitem [ref=e144]:
                    - time [ref=e145]: 2026-12-07
                    - generic [ref=e146]:
                      - link "GITEX GLOBAL 2026 scheduled for 7–11 December 2026 at Expo City Dubai (moved from October / DWTC)" [ref=e147] [cursor=pointer]:
                        - /url: https://www.gitex.com
                      - paragraph [ref=e148]: GITEX · —
                  - listitem [ref=e149]:
                    - time [ref=e150]: 2026-10-15
                    - generic [ref=e151]:
                      - generic "source URL not verified in the research corpus — link disabled" [ref=e152]:
                        - text: Jais 3 announced
                        - superscript [ref=e153]: unverified
                      - paragraph [ref=e154]: source unverified · —
                  - listitem [ref=e155]:
                    - time [ref=e156]: 2026-10-15
                    - generic [ref=e157]:
                      - link "UAE launches Jais 3 Arabic-native AI" [ref=e158] [cursor=pointer]:
                        - /url: https://gulfnews.com/uae/uae-launches-jais-3-arabic-native-ai-for-speech-writing-and-agents-1.500711935
                      - paragraph [ref=e159]: Gulf News · Inception (Inception42, G42), Mohamed bin Zayed University of Artificial Intelligence
                  - listitem [ref=e160]:
                    - time [ref=e161]: 2026-10-15
                    - generic [ref=e162]:
                      - link "Jais 3 Arabic-native AI model announced" [ref=e163] [cursor=pointer]:
                        - /url: https://gulfnews.com/uae/uae-launches-jais-3-arabic-native-ai-for-speech-writing-and-agents-1.500711935
                      - paragraph [ref=e164]: Gulf News · Inception (Inception42, G42), Mohamed bin Zayed University of Artificial Intelligence
                  - listitem [ref=e165]:
                    - time [ref=e166]: 2026-10-15
                    - generic [ref=e167]:
                      - link "MBZUAI’s Institute of Foundation Models and Inception42 launch Jais 3" [ref=e168] [cursor=pointer]:
                        - /url: https://mbzuai.ac.ae/news-events/news/mbzuais-institute-foundation-models-inception42-launch-jais-3-arabic-native-ai
                      - paragraph [ref=e169]: MBZUAI · Cerebras Systems, Inception (Inception42, G42), Mohamed bin Zayed University of Artificial Intelligence
                  - listitem [ref=e170]:
                    - time [ref=e171]: 2026-10-14
                    - generic [ref=e172]:
                      - link "Inception describes AI-assisted investment and procurement workflows at SIF 2026" [ref=e173] [cursor=pointer]:
                        - /url: https://www.bignewsnetwork.com/news/279374613/microsoft-uae-g42-explore-human-led-agent-operated-businesses-at-sif-2026
                      - paragraph [ref=e174]: WAM · Inception (Inception42, G42)
                  - listitem [ref=e175]:
                    - time [ref=e176]: 2026-10-07
                    - generic [ref=e177]:
                      - generic "source URL not verified in the research corpus — link disabled" [ref=e178]:
                        - text: Falcon-Emirati 7B announced
                        - superscript [ref=e179]: unverified
                      - paragraph [ref=e180]: source unverified · Technology Innovation Institute
                  - listitem [ref=e181]:
                    - time [ref=e182]: 2026-10-07
                    - generic [ref=e183]:
                      - link "Falcon-Emirati model launched" [ref=e184] [cursor=pointer]:
                        - /url: https://gulfbusiness.com/en/2026/artificial-intelligence/uae-tii-falcon-emirati-arabic-ai-model/
                      - paragraph [ref=e185]: Gulf Business · Advanced Technology Research Council, Technology Innovation Institute
              - generic [ref=e186]:
                - heading "Most-cited organisations" [level=2] [ref=e188]
                - list [ref=e189]:
                  - listitem [ref=e190]:
                    - link "G42 — icon from official domain G42 29 news" [ref=e191] [cursor=pointer]:
                      - /url: /watchlist/g42
                      - img "G42 — icon from official domain" [ref=e192]
                      - generic [ref=e193]: G42
                      - generic [ref=e194]: 29 news
                  - listitem [ref=e195]:
                    - link "Khazna Data Centers Khazna Data Centers 11 news" [ref=e196] [cursor=pointer]:
                      - /url: /watchlist/khazna
                      - img "Khazna Data Centers" [ref=e197]: KD
                      - generic [ref=e198]: Khazna Data Centers
                      - generic [ref=e199]: 11 news
                  - listitem [ref=e200]:
                    - link "M42 M42 9 news" [ref=e201] [cursor=pointer]:
                      - /url: /watchlist/m42
                      - img "M42" [ref=e202]: M
                      - generic [ref=e203]: M42
                      - generic [ref=e204]: 9 news
                  - listitem [ref=e205]:
                    - link "Mohamed bin Zayed University of Artificial Intelligence Mohamed bin Zayed University of Artificial Intelligence 8 news" [ref=e206] [cursor=pointer]:
                      - /url: /watchlist/mbzuai
                      - img "Mohamed bin Zayed University of Artificial Intelligence" [ref=e207]: MB
                      - generic [ref=e208]: Mohamed bin Zayed University of Artificial Intelligence
                      - generic [ref=e209]: 8 news
                  - listitem [ref=e210]:
                    - link "Core42 Core42 8 news" [ref=e211] [cursor=pointer]:
                      - /url: /watchlist/core42
                      - img "Core42" [ref=e212]: C
                      - generic [ref=e213]: Core42
                      - generic [ref=e214]: 8 news
                  - listitem [ref=e215]:
                    - link "Technology Innovation Institute Technology Innovation Institute 7 news" [ref=e216] [cursor=pointer]:
                      - /url: /watchlist/tii
                      - img "Technology Innovation Institute" [ref=e217]: TI
                      - generic [ref=e218]: Technology Innovation Institute
                      - generic [ref=e219]: 7 news
                  - listitem [ref=e220]:
                    - link "Inception (Inception42, G42) Inception (Inception42, G42) 6 news" [ref=e221] [cursor=pointer]:
                      - /url: /watchlist/inception
                      - img "Inception (Inception42, G42)" [ref=e222]: I
                      - generic [ref=e223]: Inception (Inception42, G42)
                      - generic [ref=e224]: 6 news
                  - listitem [ref=e225]:
                    - link "Micropolis Robotics — icon from official domain Micropolis Robotics 6 news" [ref=e226] [cursor=pointer]:
                      - /url: /watchlist/micropolis
                      - img "Micropolis Robotics — icon from official domain" [ref=e227]
                      - generic [ref=e228]: Micropolis Robotics
                      - generic [ref=e229]: 6 news
            - generic [ref=e230]:
              - paragraph [ref=e231]: "Intelligence engine: OnDemand (AIREV) · Agents Flow Builder execution store"
              - generic [ref=e233]:
                - heading "Live pipeline — scheduled OnDemand workflows" [level=2] [ref=e234]
                - generic [ref=e237]: namespace uae_cc_v1
              - generic [ref=e238]:
                - generic [ref=e239]:
                  - paragraph [ref=e240]:
                    - text: ingest
                    - code [ref=e241]: 0 0 */2 * * *
                  - paragraph [ref=e242]: "last run: success · 51 min ago (cron)"
                  - paragraph [ref=e243]: "next: 2026-10-21 12:00 UTC"
                  - paragraph [ref=e244]: workflow 6ad7f32d5e60695bc4d052cb
                - generic [ref=e245]:
                  - paragraph [ref=e246]:
                    - text: briefing
                    - code [ref=e247]: 0 30 2 * * *
                  - paragraph [ref=e248]: "last run: success · 6 h ago (api)"
                  - paragraph [ref=e249]: "next: 2026-10-22 02:30 UTC"
                  - paragraph [ref=e250]: workflow 6ad7f32e5e60695bc4d052d2
                - generic [ref=e251]:
                  - paragraph [ref=e252]:
                    - text: checkpoint
                    - code [ref=e253]: 0 */30 * * * *
                  - paragraph [ref=e254]: "last run: success · 21 min ago (cron)"
                  - paragraph [ref=e255]: "next: 2026-10-21 11:00 UTC"
                  - paragraph [ref=e256]: workflow 6ad7f32e5e60695bc4d052d7
              - generic [ref=e257]:
                - generic [ref=e258]:
                  - paragraph [ref=e259]: Newest ingested news (11)
                  - list [ref=e260]:
                    - listitem [ref=e261]:
                      - link "New intelligence powers government, scientific discovery and critical infrastructure at Ai Everything Abu Dhabi" [ref=e262] [cursor=pointer]:
                        - /url: https://iot-now.com/2026/10/05/158707-ai-everything-abu-dhabi-government-scientific-discovery-critical-infrastructure/
                      - generic [ref=e267]: IoT Now · 2026-10-05 · via Perplexity · conf 0.98
                    - listitem [ref=e268]:
                      - link "Abu Dhabi’s Inception42 adds AI to boardroom decisions" [ref=e269] [cursor=pointer]:
                        - /url: https://www.agbi.com/ai/2026/10/abu-dhabis-inception42-adds-ai-to-boardroom-decisions/
                      - generic [ref=e274]: AGBI · date n/a · via Perplexity · conf 0.98
                    - listitem [ref=e275]:
                      - 'link "The UAE Artificial Intelligence and Data Authority: What It Means for AI, Data, and Digital Governance" [ref=e276] [cursor=pointer]':
                        - /url: https://www.glaco.com/blog/the-uae-artificial-intelligence-and-data-authority-what-it-means-for-ai-data-and-digital-governance/
                      - generic [ref=e281]: GLA & Company · 2026-08-27 · via Perplexity · conf 0.98
                    - listitem [ref=e282]:
                      - link "e& UAE Launches Business Pro AI Plans With Microsoft Copilot for SMEs" [ref=e283] [cursor=pointer]:
                        - /url: https://techafricanews.com/2026/08/24/eand-uae-business-pro-ai-microsoft-copilot-smes/
                      - generic [ref=e288]: TechAfrica News · 2026-08-24 · via Perplexity · conf 0.98
                    - listitem [ref=e289]:
                      - link "UAE plans agentic AI integration across half of government operations" [ref=e290] [cursor=pointer]:
                        - /url: https://www.foxnews.com/tech/united-arab-emirates-plans-ai-run-government-within-two-years
                      - generic [ref=e295]: Fox News · date n/a · via Perplexity · conf 0.98
                    - listitem [ref=e296]:
                      - link "UAE’s Top AI Firm G42 Considers Selling Majority Stake to US Companies" [ref=e297] [cursor=pointer]:
                        - /url: https://finance.yahoo.com/technology/ai/articles/uae-top-ai-firm-g42-143857969.html
                      - generic [ref=e302]: Yahoo Finance · date n/a · via Perplexity · conf 0.98
                - generic [ref=e303]:
                  - paragraph [ref=e304]: Newest classified statements (5)
                  - list [ref=e305]:
                    - listitem [ref=e306]:
                      - text: Safety Advocates — “The UAE is investing heavily in artificial intelligence, but many businesses are struggling to keep the technology safe.”
                      - link "unattributed · analyticsinsight.ae" [ref=e308] [cursor=pointer]:
                        - /url: https://www.analyticsinsight.ae/news/uaes-ai-boom-faces-a-governance-test-as-98-of-security-teams-report-risks
                    - listitem [ref=e309]:
                      - text: Neutral/Informational — “Organisations operating in the UAE should understand both what has changed and what remains to be determined.”
                      - link "unattributed · glaco.com" [ref=e311] [cursor=pointer]:
                        - /url: https://www.glaco.com/blog/the-uae-artificial-intelligence-and-data-authority-what-it-means-for-ai-data-and-digital-governance/
                    - listitem [ref=e312]:
                      - text: Optimists — “The UAE was committed to developing “a more efficient, agile, and proactive global government model” that leverages”
                      - link "Sheikh Mohammed bin Rashid · globalgovernmentforum.com" [ref=e314] [cursor=pointer]:
                        - /url: https://www.globalgovernmentforum.com/uae-creates-dedicated-artificial-intelligence-and-data-authority-to-build-government-of-the-future/
                    - listitem [ref=e315]:
                      - text: Optimists — “ICP revealed plans to transform 50% of its sectors, services, and operations into autonomous and AI-led models within the next two years.”
                      - link "unattributed · alarabiyagroup.ae" [ref=e317] [cursor=pointer]:
                        - /url: https://alarabiyagroup.ae/uae-ai-government-push-residents-businesses/
                    - listitem [ref=e318]:
                      - text: Optimists — “The United States and the United Arab Emirates have signed an agreement that will help vault the Gulf country to become a rising power in artificial intelligenc…”
                      - link "unattributed · nytimes.com" [ref=e320] [cursor=pointer]:
                        - /url: https://www.nytimes.com/2025/05/15/us/politics/ai-us-abu-dhabi.html
              - paragraph [ref=e321]: "Provenance on every record: source URL, run timestamp 2026-10-21T10:02:24.416Z, plugin, confidence, execution 6ad88d20c2cfee207e8f4204. Records without a source URL are dropped (0 this run). Live records are additive to the curated seed and are not merged into its counts."
            - generic [ref=e322]:
              - generic [ref=e323]:
                - heading "Technology & Innovation Radar — snapshot" [level=2] [ref=e324]
                - link "Open radar →" [ref=e325] [cursor=pointer]:
                  - /url: /radar
              - generic [ref=e326]:
                - generic [ref=e327]:
                  - paragraph [ref=e328]: Agentic AI in government
                  - paragraph [ref=e329]: assess · 18 signals · latest 2026-10-15
                - generic [ref=e330]:
                  - paragraph [ref=e331]: AI data centres & compute
                  - paragraph [ref=e332]: assess · 17 signals · latest 2026-10
                - generic [ref=e333]:
                  - paragraph [ref=e334]: Arabic & sovereign LLMs
                  - paragraph [ref=e335]: adopt · 15 signals · latest 2026-10-15
                - generic [ref=e336]:
                  - paragraph [ref=e337]: AI chips & export controls
                  - paragraph [ref=e338]: adopt · 15 signals · latest 2026-10-20
                - generic [ref=e339]:
                  - paragraph [ref=e340]: Robotics & autonomy
                  - paragraph [ref=e341]: adopt · 11 signals · latest 2026-09-30
                - generic [ref=e342]:
                  - paragraph [ref=e343]: Health & document AI
                  - paragraph [ref=e344]: adopt · 10 signals · latest 2026-10-07
                - generic [ref=e345]:
                  - paragraph [ref=e346]: Sovereign cloud
                  - paragraph [ref=e347]: adopt · 6 signals · latest 2026-09
                - generic [ref=e348]:
                  - paragraph [ref=e349]: AI governance & regulation
                  - paragraph [ref=e350]: adopt · 5 signals · latest 2026-10-07
        - contentinfo [ref=e351]:
          - generic [ref=e352]:
            - generic [ref=e353]:
              - strong [ref=e354]: Concept Demonstration — not an official government system.
              - text: Public sources only · no government logo or endorsement implied.
            - generic [ref=e355]:
              - text: Data namespace uae_cc_v1 · as of 2026-10-21 ·
              - link "Methodology & limitations" [ref=e356] [cursor=pointer]:
                - /url: /methodology
            - generic [ref=e357]: "Intelligence engine: OnDemand (AIREV)"
            - generic [ref=e360]:
              - text: v1.0.0 · local · last updated
              - time [ref=e361]: 2026-10-21 10:29 UTC
  - region "Notifications alt+T"
  - alert [ref=e362]
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
  33  |         expect(resp?.status(), r.p).toBe(200);
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
> 56  |       await nav.getByTestId("nav-companies").scrollIntoViewIfNeeded();
      |                                              ^ Error: locator.scrollIntoViewIfNeeded: Test timeout of 240000ms exceeded.
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
  134 |           const s = getComputedStyle(el as HTMLElement); return { display: s.display, visible: s.display !== "none" && !!(el as HTMLElement).offsetParent, text: (el as HTMLElement).innerText?.slice(0, 80) };
  135 |         });
  136 |         return { htmlHasRaw: html.includes(raw), lib };
  137 |       }, RAW);
  138 |       console.log("DOM_PROBE", JSON.stringify(domProbe));
  139 |       expect(domProbe.htmlHasRaw, "raw upstream error must not be in DOM").toBe(false);
  140 |       expect(domProbe.lib.every((b) => !b.visible)).toBe(true);
  141 |       await page.screenshot({ path: path.join(PROOF, `live-retry-error-${vp.label}.png`) });
  142 |       await page.unroute("**/api/chat");
  143 |       await page.route("**/api/chat", async (route) => {
  144 |         if (route.request().method() === "POST") { posts++; await route.fulfill({ status: 200, contentType: "text/event-stream", body: OK }); } else await route.continue();
  145 |       });
  146 |       const before = posts;
  147 |       await page.getByTestId("chat-error-retry").click();
  148 |       await expect.poll(() => posts).toBeGreaterThan(before);
  149 |       await expect(page.locator("body")).toContainText("Retry succeeded: Technology Innovation Institute", { timeout: 30_000 });
  150 |       await expect(notice).toHaveCount(0);
  151 |       await page.screenshot({ path: path.join(PROOF, `live-retry-recovered-${vp.label}.png`) });
  152 |     });
  153 |   });
  154 | }
  155 | 
```