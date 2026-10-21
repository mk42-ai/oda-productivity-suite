# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-smoke.spec.ts >> live smoke 1440x900 >> nav links + back/forward
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
              - generic [ref=e321]:
                - generic [ref=e322]:
                  - paragraph [ref=e323]:
                    - text: ingest
                    - code [ref=e324]: 0 0 */2 * * *
                  - paragraph [ref=e325]: "last run: success · 44 min ago (cron)"
                  - paragraph [ref=e326]: "next: 2026-10-21 12:00 UTC"
                  - paragraph [ref=e327]: workflow 6ad7f32d5e60695bc4d052cb
                - generic [ref=e328]:
                  - paragraph [ref=e329]:
                    - text: briefing
                    - code [ref=e330]: 0 30 2 * * *
                  - paragraph [ref=e331]: "last run: success · 6 h ago (api)"
                  - paragraph [ref=e332]: "next: 2026-10-22 02:30 UTC"
                  - paragraph [ref=e333]: workflow 6ad7f32e5e60695bc4d052d2
                - generic [ref=e334]:
                  - paragraph [ref=e335]:
                    - text: checkpoint
                    - code [ref=e336]: 0 */30 * * * *
                  - paragraph [ref=e337]: "last run: success · 14 min ago (cron)"
                  - paragraph [ref=e338]: "next: 2026-10-21 11:00 UTC"
                  - paragraph [ref=e339]: workflow 6ad7f32e5e60695bc4d052d7
              - generic [ref=e340]:
                - generic [ref=e341]:
                  - paragraph [ref=e342]: Newest ingested news (11)
                  - list [ref=e343]:
                    - listitem [ref=e344]:
                      - link "New intelligence powers government, scientific discovery and critical infrastructure at Ai Everything Abu Dhabi" [ref=e345] [cursor=pointer]:
                        - /url: https://iot-now.com/2026/10/05/158707-ai-everything-abu-dhabi-government-scientific-discovery-critical-infrastructure/
                      - generic [ref=e350]: IoT Now · 2026-10-05 · via Perplexity · conf 0.98
                    - listitem [ref=e351]:
                      - link "Abu Dhabi’s Inception42 adds AI to boardroom decisions" [ref=e352] [cursor=pointer]:
                        - /url: https://www.agbi.com/ai/2026/10/abu-dhabis-inception42-adds-ai-to-boardroom-decisions/
                      - generic [ref=e357]: AGBI · date n/a · via Perplexity · conf 0.98
                    - listitem [ref=e358]:
                      - 'link "The UAE Artificial Intelligence and Data Authority: What It Means for AI, Data, and Digital Governance" [ref=e359] [cursor=pointer]':
                        - /url: https://www.glaco.com/blog/the-uae-artificial-intelligence-and-data-authority-what-it-means-for-ai-data-and-digital-governance/
                      - generic [ref=e364]: GLA & Company · 2026-08-27 · via Perplexity · conf 0.98
                    - listitem [ref=e365]:
                      - link "e& UAE Launches Business Pro AI Plans With Microsoft Copilot for SMEs" [ref=e366] [cursor=pointer]:
                        - /url: https://techafricanews.com/2026/08/24/eand-uae-business-pro-ai-microsoft-copilot-smes/
                      - generic [ref=e371]: TechAfrica News · 2026-08-24 · via Perplexity · conf 0.98
                    - listitem [ref=e372]:
                      - link "UAE plans agentic AI integration across half of government operations" [ref=e373] [cursor=pointer]:
                        - /url: https://www.foxnews.com/tech/united-arab-emirates-plans-ai-run-government-within-two-years
                      - generic [ref=e378]: Fox News · date n/a · via Perplexity · conf 0.98
                    - listitem [ref=e379]:
                      - link "UAE’s Top AI Firm G42 Considers Selling Majority Stake to US Companies" [ref=e380] [cursor=pointer]:
                        - /url: https://finance.yahoo.com/technology/ai/articles/uae-top-ai-firm-g42-143857969.html
                      - generic [ref=e385]: Yahoo Finance · date n/a · via Perplexity · conf 0.98
                - generic [ref=e386]:
                  - paragraph [ref=e387]: Newest classified statements (5)
                  - list [ref=e388]:
                    - listitem [ref=e389]:
                      - text: Safety Advocates — “The UAE is investing heavily in artificial intelligence, but many businesses are struggling to keep the technology safe.”
                      - link "unattributed · analyticsinsight.ae" [ref=e391] [cursor=pointer]:
                        - /url: https://www.analyticsinsight.ae/news/uaes-ai-boom-faces-a-governance-test-as-98-of-security-teams-report-risks
                    - listitem [ref=e392]:
                      - text: Neutral/Informational — “Organisations operating in the UAE should understand both what has changed and what remains to be determined.”
                      - link "unattributed · glaco.com" [ref=e394] [cursor=pointer]:
                        - /url: https://www.glaco.com/blog/the-uae-artificial-intelligence-and-data-authority-what-it-means-for-ai-data-and-digital-governance/
                    - listitem [ref=e395]:
                      - text: Optimists — “The UAE was committed to developing “a more efficient, agile, and proactive global government model” that leverages”
                      - link "Sheikh Mohammed bin Rashid · globalgovernmentforum.com" [ref=e397] [cursor=pointer]:
                        - /url: https://www.globalgovernmentforum.com/uae-creates-dedicated-artificial-intelligence-and-data-authority-to-build-government-of-the-future/
                    - listitem [ref=e398]:
                      - text: Optimists — “ICP revealed plans to transform 50% of its sectors, services, and operations into autonomous and AI-led models within the next two years.”
                      - link "unattributed · alarabiyagroup.ae" [ref=e400] [cursor=pointer]:
                        - /url: https://alarabiyagroup.ae/uae-ai-government-push-residents-businesses/
                    - listitem [ref=e401]:
                      - text: Optimists — “The United States and the United Arab Emirates have signed an agreement that will help vault the Gulf country to become a rising power in artificial intelligenc…”
                      - link "unattributed · nytimes.com" [ref=e403] [cursor=pointer]:
                        - /url: https://www.nytimes.com/2025/05/15/us/politics/ai-us-abu-dhabi.html
              - paragraph [ref=e404]: "Provenance on every record: source URL, run timestamp 2026-10-21T10:02:24.416Z, plugin, confidence, execution 6ad88d20c2cfee207e8f4204. Records without a source URL are dropped (0 this run). Live records are additive to the curated seed and are not merged into its counts."
            - generic [ref=e405]:
              - generic [ref=e406]:
                - heading "Technology & Innovation Radar — snapshot" [level=2] [ref=e407]
                - link "Open radar →" [ref=e408] [cursor=pointer]:
                  - /url: /radar
              - generic [ref=e409]:
                - generic [ref=e410]:
                  - paragraph [ref=e411]: Agentic AI in government
                  - paragraph [ref=e412]: assess · 18 signals · latest 2026-10-15
                - generic [ref=e413]:
                  - paragraph [ref=e414]: AI data centres & compute
                  - paragraph [ref=e415]: assess · 17 signals · latest 2026-10
                - generic [ref=e416]:
                  - paragraph [ref=e417]: Arabic & sovereign LLMs
                  - paragraph [ref=e418]: adopt · 15 signals · latest 2026-10-15
                - generic [ref=e419]:
                  - paragraph [ref=e420]: AI chips & export controls
                  - paragraph [ref=e421]: adopt · 15 signals · latest 2026-10-20
                - generic [ref=e422]:
                  - paragraph [ref=e423]: Robotics & autonomy
                  - paragraph [ref=e424]: adopt · 11 signals · latest 2026-09-30
                - generic [ref=e425]:
                  - paragraph [ref=e426]: Health & document AI
                  - paragraph [ref=e427]: adopt · 10 signals · latest 2026-10-07
                - generic [ref=e428]:
                  - paragraph [ref=e429]: Sovereign cloud
                  - paragraph [ref=e430]: adopt · 6 signals · latest 2026-09
                - generic [ref=e431]:
                  - paragraph [ref=e432]: AI governance & regulation
                  - paragraph [ref=e433]: adopt · 5 signals · latest 2026-10-07
        - contentinfo [ref=e434]:
          - generic [ref=e435]:
            - generic [ref=e436]:
              - strong [ref=e437]: Concept Demonstration — not an official government system.
              - text: Public sources only · no government logo or endorsement implied.
            - generic [ref=e438]:
              - text: Data namespace uae_cc_v1 · as of 2026-10-21 ·
              - link "Methodology & limitations" [ref=e439] [cursor=pointer]:
                - /url: /methodology
            - generic [ref=e440]: "Intelligence engine: OnDemand (AIREV)"
            - generic [ref=e443]:
              - text: v1.0.0 · local · last updated
              - time [ref=e444]: 2026-10-21 10:29 UTC
  - region "Notifications alt+T"
  - alert [ref=e445]
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