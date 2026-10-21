# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> Accessibility (axe, WCAG 2.0/2.1 A+AA) >> overview: no serious/critical violations
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
                  - paragraph [ref=e325]: "last run: success · 40 min ago (cron)"
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
                  - paragraph [ref=e337]: "last run: success · 10 min ago (cron)"
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