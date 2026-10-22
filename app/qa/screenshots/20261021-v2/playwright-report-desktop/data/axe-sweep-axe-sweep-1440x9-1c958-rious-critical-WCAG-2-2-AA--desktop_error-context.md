# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: axe-sweep.spec.ts >> axe sweep @1440x900 >> /news @1440x900: no serious/critical (WCAG 2.2 AA)
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
          - generic [ref=e110]:
            - paragraph [ref=e111]: News Intelligence
            - heading "What happened, who did it, where it came from" [level=1] [ref=e112]
            - paragraph [ref=e113]: Events extracted by the OnDemand News-Retrieval agent from Perplexity, GPT Search and Internet-search results, de-duplicated by headline similarity with corroborating reports folded in.
          - generic [ref=e114]:
            - generic [ref=e115]:
              - paragraph [ref=e116]: Events
              - paragraph [ref=e117]: "105"
            - generic [ref=e118]:
              - paragraph [ref=e119]: Last 30 days
              - paragraph [ref=e120]: "27"
            - generic [ref=e121]:
              - paragraph [ref=e122]: With verified link
              - paragraph [ref=e123]: "91"
              - paragraph [ref=e124]: 87%
            - generic [ref=e125]:
              - paragraph [ref=e126]: Categories
              - paragraph [ref=e127]: "16"
          - generic [ref=e128]:
            - generic [ref=e129]:
              - textbox "Search news" [ref=e130]:
                - /placeholder: Search news…
              - generic [ref=e131]:
                - button "all" [pressed] [ref=e132]
                - button "infrastructure" [ref=e133]
                - button "models" [ref=e134]
                - button "partnership" [ref=e135]
                - button "policy" [ref=e136]
                - button "funding" [ref=e137]
                - button "other" [ref=e138]
                - button "health" [ref=e139]
                - button "talent" [ref=e140]
                - button "space" [ref=e141]
                - button "geopolitics" [ref=e142]
                - button "defence" [ref=e143]
                - button "event" [ref=e144]
                - button "research" [ref=e145]
                - button "investment" [ref=e146]
                - button "survey" [ref=e147]
                - button "leadership" [ref=e148]
              - generic [ref=e149]:
                - checkbox "verified link only" [ref=e150]
                - text: verified link only
              - generic [ref=e151]: 105 / 105
            - list [ref=e152]:
              - listitem [ref=e153]:
                - generic [ref=e154]:
                  - time [ref=e155]: 2026-12-07
                  - text: other
                - generic [ref=e156]:
                  - link "GITEX GLOBAL 2026 scheduled for 7–11 December 2026 at Expo City Dubai (moved from October / DWTC)" [ref=e157] [cursor=pointer]:
                    - /url: https://www.gitex.com
                  - paragraph [ref=e158]: GITEX GLOBAL 2026 runs 7–11 December 2026 at Expo City Dubai. October 2026 items are therefore not 'at GITEX'; Ai Everything Abu Dhabi was 6–7 Oct 2026 at ADNEC.
                  - paragraph [ref=e159]:
                    - generic [ref=e160]: GITEX
                    - generic [ref=e161]: · +1 corroborating report
              - listitem [ref=e162]:
                - generic [ref=e163]:
                  - time [ref=e164]: 2026-10-15
                  - text: models
                - generic [ref=e165]:
                  - generic [ref=e166]:
                    - text: Jais 3 announced
                    - superscript [ref=e167]: source unverified
                  - paragraph [ref=e168]: The mission brief lists Jais 3 on this date; it provides no further details.
                  - paragraph [ref=e169]:
                    - generic [ref=e170]: publisher n/a
                    - generic [ref=e171]: · +1 corroborating report
              - listitem [ref=e172]:
                - generic [ref=e173]:
                  - time [ref=e174]: 2026-10-15
                  - text: models
                - generic [ref=e175]:
                  - link "UAE launches Jais 3 Arabic-native AI" [ref=e176] [cursor=pointer]:
                    - /url: https://gulfnews.com/uae/uae-launches-jais-3-arabic-native-ai-for-speech-writing-and-agents-1.500711935
                  - paragraph [ref=e177]: Jais 3, described as part of the Jais family built on K2 Horizon, includes six language models and an Arabic speech-recognition model covering Modern Standard and dialectal Arabic.
                  - paragraph [ref=e178]:
                    - generic [ref=e179]: Gulf News
                    - link "Inception (Inception42, G42)" [ref=e180] [cursor=pointer]:
                      - /url: /watchlist/inception
                    - link "Mohamed bin Zayed University of Artificial Intelligence" [ref=e181] [cursor=pointer]:
                      - /url: /watchlist/mbzuai
                    - generic [ref=e182]: · +1 corroborating report
              - listitem [ref=e183]:
                - generic [ref=e184]:
                  - time [ref=e185]: 2026-10-15
                  - text: models
                - generic [ref=e186]:
                  - link "Jais 3 Arabic-native AI model announced" [ref=e187] [cursor=pointer]:
                    - /url: https://gulfnews.com/uae/uae-launches-jais-3-arabic-native-ai-for-speech-writing-and-agents-1.500711935
                  - paragraph [ref=e188]: The brief identifies Jais 3 as an Arabic-native model for speech, writing and agents, built on K2 Horizon; the article also connects the model to MBZUAI, IFM and Inception42.
                  - paragraph [ref=e189]:
                    - generic [ref=e190]: Gulf News
                    - link "Inception (Inception42, G42)" [ref=e191] [cursor=pointer]:
                      - /url: /watchlist/inception
                    - link "Mohamed bin Zayed University of Artificial Intelligence" [ref=e192] [cursor=pointer]:
                      - /url: /watchlist/mbzuai
              - listitem [ref=e193]:
                - generic [ref=e194]:
                  - time [ref=e195]: 2026-10-15
                  - text: models
                - generic [ref=e196]:
                  - link "MBZUAI’s Institute of Foundation Models and Inception42 launch Jais 3" [ref=e197] [cursor=pointer]:
                    - /url: https://mbzuai.ac.ae/news-events/news/mbzuais-institute-foundation-models-inception42-launch-jais-3-arabic-native-ai
                  - paragraph [ref=e198]: Jais 3 comprises six open Arabic models (0.9B–375B parameters) and a speech-recognition model, supports multiple dialects, and is built on K2 Horizon. Benchmarks and checkpoints were made public.
                  - paragraph [ref=e199]:
                    - generic [ref=e200]: MBZUAI
                    - link "Cerebras Systems" [ref=e201] [cursor=pointer]:
                      - /url: /watchlist/cerebras-uae
                    - link "Inception (Inception42, G42)" [ref=e202] [cursor=pointer]:
                      - /url: /watchlist/inception
                    - link "Mohamed bin Zayed University of Artificial Intelligence" [ref=e203] [cursor=pointer]:
                      - /url: /watchlist/mbzuai
                    - generic [ref=e204]: · +1 corroborating report
              - listitem [ref=e205]:
                - generic [ref=e206]:
                  - time [ref=e207]: 2026-10-14
                  - text: other
                - generic [ref=e208]:
                  - link "Inception describes AI-assisted investment and procurement workflows at SIF 2026" [ref=e209] [cursor=pointer]:
                    - /url: https://www.bignewsnetwork.com/news/279374613/microsoft-uae-g42-explore-human-led-agent-operated-businesses-at-sif-2026
                  - paragraph [ref=e210]: Inception (G42) described AI testing investment proposals and supporting procurement workflows. Human reviewers check recommendations and can override proposed actions.
                  - paragraph [ref=e211]:
                    - generic [ref=e212]: WAM
                    - link "Inception (Inception42, G42)" [ref=e213] [cursor=pointer]:
                      - /url: /watchlist/inception
              - listitem [ref=e214]:
                - generic [ref=e215]:
                  - time [ref=e216]: 2026-10-07
                  - text: models
                - generic [ref=e217]:
                  - generic [ref=e218]:
                    - text: Falcon-Emirati 7B announced
                    - superscript [ref=e219]: source unverified
                  - paragraph [ref=e220]: The mission brief lists Falcon-Emirati 7B on this date; it provides no further details.
                  - paragraph [ref=e221]:
                    - generic [ref=e222]: publisher n/a
                    - link "Technology Innovation Institute" [ref=e223] [cursor=pointer]:
                      - /url: /watchlist/tii
                    - generic [ref=e224]: · +3 corroborating reports
              - listitem [ref=e225]:
                - generic [ref=e226]:
                  - time [ref=e227]: 2026-10-07
                  - text: models
                - generic [ref=e228]:
                  - link "Falcon-Emirati model launched" [ref=e229] [cursor=pointer]:
                    - /url: https://gulfbusiness.com/en/2026/artificial-intelligence/uae-tii-falcon-emirati-arabic-ai-model/
                  - paragraph [ref=e230]: TII launched Falcon-Emirati, a 7-billion-parameter model designed for Emirati Arabic, alongside speech-recognition and Arabic-document models, according to the article and mission brief.
                  - paragraph [ref=e231]:
                    - generic [ref=e232]: Gulf Business
                    - link "Advanced Technology Research Council" [ref=e233] [cursor=pointer]:
                      - /url: /watchlist/atrc
                    - link "Technology Innovation Institute" [ref=e234] [cursor=pointer]:
                      - /url: /watchlist/tii
              - listitem [ref=e235]:
                - generic [ref=e236]:
                  - time [ref=e237]: 2026-10-07
                  - text: policy
                - generic [ref=e238]:
                  - link "Abu Dhabi DGE leader discusses an AI-native state at Ai Everything Abu Dhabi" [ref=e239] [cursor=pointer]:
                    - /url: https://www.facebook.com/AiEverythingAbuDhabi/posts/ai-progress-is-an-ecosystem-effort-he-ruba-al-hassan-director-general-department/1422484696654163/
                  - paragraph [ref=e240]: DGE Director General Ruba Al Hassan discussed ecosystem collaboration among universities, technology companies, research institutes, investors and startups to advance AI in Abu Dhabi. (Ai Everything Abu Dhabi, ADNEC, 6–7 Oct 2026.)
                  - paragraph [ref=e241]:
                    - generic [ref=e242]: Ai Everything Abu Dhabi
                    - link "Department of Government Enablement (DGE), Abu Dhabi" [ref=e243] [cursor=pointer]:
                      - /url: /watchlist/dge
              - listitem [ref=e244]:
                - generic [ref=e245]:
                  - time [ref=e246]: 2026-10-06
                  - text: other
                - generic [ref=e247]:
                  - link "Saal.ai showcases AI and big-data technologies at AI Everything Abu Dhabi" [ref=e248] [cursor=pointer]:
                    - /url: https://www.wam.ae/en/article/c2lundc-saalai-highlights-rapid-growth-uaes-sector
                  - paragraph [ref=e249]: CEO Vikraman Poduval spoke at AI Everything Abu Dhabi about Saal.ai’s technologies, including big data and AI agents.
                  - paragraph [ref=e250]:
                    - generic [ref=e251]: WAM
                    - link "Saal.ai" [ref=e252] [cursor=pointer]:
                      - /url: /watchlist/saal-ai
              - listitem [ref=e253]:
                - generic [ref=e254]:
                  - time [ref=e255]: 2026-10-05
                  - text: talent
                - generic [ref=e256]:
                  - link "Dubai Future Foundation Agentic AI accelerator announced" [ref=e257] [cursor=pointer]:
                    - /url: https://www.dubaiprnetwork.com/technology-news/194304-dubai-future-foundation-launches-agentic-ai-for-government-services-accelerator
                  - paragraph [ref=e258]: The mission brief lists a Dubai Future Foundation Agentic AI accelerator on this date.
                  - paragraph [ref=e259]:
                    - generic [ref=e260]: Dubai Future Foundation
                    - link "Dubai Centre for Artificial Intelligence" [ref=e261] [cursor=pointer]:
                      - /url: /watchlist/dcai
                    - link "Dubai Future Foundation" [ref=e262] [cursor=pointer]:
                      - /url: /watchlist/dff
                    - link "Digital Dubai" [ref=e263] [cursor=pointer]:
                      - /url: /watchlist/digital-dubai
                    - generic [ref=e264]: · +4 corroborating reports
              - listitem [ref=e265]:
                - generic [ref=e266]:
                  - time [ref=e267]: 2026-10-05
                  - text: talent
                - generic [ref=e268]:
                  - generic [ref=e269]:
                    - text: DFF launches Agentic AI accelerator
                    - superscript [ref=e270]: source unverified
                  - paragraph [ref=e271]: The brief reports that Dubai Future Foundation launched an Agentic AI accelerator.
                  - paragraph [ref=e272]:
                    - generic [ref=e273]: Mission brief
                    - link "Dubai Future Foundation" [ref=e274] [cursor=pointer]:
                      - /url: /watchlist/dff
                    - generic [ref=e275]: · +2 corroborating reports
              - listitem [ref=e276]:
                - generic [ref=e277]:
                  - time [ref=e278]: 2026-10
                  - text: infrastructure
                - generic [ref=e279]:
                  - generic [ref=e280]:
                    - text: Microsoft and G42 announce data-centre expansion via Khazna
                    - superscript [ref=e281]: source unverified
                  - paragraph [ref=e282]: G42 announced a 200 MW data-centre capacity expansion via Khazna, expected to start coming online before the end of 2026, as part of a deeper Microsoft-G42 partnership.
                  - paragraph [ref=e283]:
                    - generic [ref=e284]: G42
                    - link "G42" [ref=e285] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Khazna Data Centers" [ref=e286] [cursor=pointer]:
                      - /url: /watchlist/khazna
              - listitem [ref=e287]:
                - generic [ref=e288]:
                  - time [ref=e289]: 2026-10
                  - text: infrastructure
                - generic [ref=e290]:
                  - link "G42 and global technology companies launch Stargate UAE" [ref=e291] [cursor=pointer]:
                    - /url: https://www.g42.ai/resources/news/global-tech-alliance-launches-stargate-uae
                  - paragraph [ref=e292]: The announcement describes a 1 GW Abu Dhabi compute cluster within a 5 GW UAE-US AI Campus; the first 200 MW was planned for 2026. G42 builds via Khazna; OpenAI and Oracle operate it, with NVIDIA, Cisco and SoftBank involved.
                  - paragraph [ref=e293]:
                    - generic [ref=e294]: G42
                    - link "G42" [ref=e295] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Khazna Data Centers" [ref=e296] [cursor=pointer]:
                      - /url: /watchlist/khazna
                    - link "M42" [ref=e297] [cursor=pointer]:
                      - /url: /watchlist/m42
              - listitem [ref=e298]:
                - generic [ref=e299]:
                  - time [ref=e300]: 2026-10
                  - text: infrastructure
                - generic [ref=e301]:
                  - link "Global Tech Alliance Launches Stargate UAE" [ref=e302] [cursor=pointer]:
                    - /url: https://www.g42.ai/resources/news/global-tech-alliance-launches-stargate-uae
                  - paragraph [ref=e303]: The announcement describes a 1 GW AI compute cluster in Abu Dhabi within a 5 GW UAE-US AI Campus, with the first 200 MW expected in 2026. G42 builds via Khazna; OpenAI and Oracle operate it, with NVIDIA, Cisco and SoftBank involved.
                  - paragraph [ref=e304]:
                    - generic [ref=e305]: G42
                    - link "G42" [ref=e306] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Khazna Data Centers" [ref=e307] [cursor=pointer]:
                      - /url: /watchlist/khazna
              - listitem [ref=e308]:
                - generic [ref=e309]:
                  - time [ref=e310]: 2026-10
                  - text: infrastructure
                - generic [ref=e311]:
                  - generic [ref=e312]:
                    - text: Microsoft and G42 Accelerate UAE’s Digital Future with Major Data Centre Expansion
                    - superscript [ref=e313]: source unverified
                  - paragraph [ref=e314]: Microsoft and G42 announced 200 MW of additional data centre capacity via Khazna, expected to start coming online before the end of 2026.
                  - paragraph [ref=e315]:
                    - generic [ref=e316]: G42
                    - link "G42" [ref=e317] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Khazna Data Centers" [ref=e318] [cursor=pointer]:
                      - /url: /watchlist/khazna
              - listitem [ref=e319]:
                - generic [ref=e320]:
                  - time [ref=e321]: 2026-09-30
                  - text: models
                - generic [ref=e322]:
                  - link "Falcon model family overview highlights TII’s foundation-model work" [ref=e323] [cursor=pointer]:
                    - /url: https://www.itechguides.com/uaes-tii-builds-falcon-ai-models-to-challenge-big-tech-what-the-evidence-shows/
                  - paragraph [ref=e324]: The overview discusses TII’s Falcon model family, including Arabic and smaller-scale models, and notes release, licensing and technical claims while cautioning against assuming displacement of large technology providers.
                  - paragraph [ref=e325]:
                    - generic [ref=e326]: iTechGuides
                    - link "Technology Innovation Institute" [ref=e327] [cursor=pointer]:
                      - /url: /watchlist/tii
              - listitem [ref=e328]:
                - generic [ref=e329]:
                  - time [ref=e330]: 2026-09-30
                  - text: defence
                - generic [ref=e331]:
                  - link "EDGE presents air defence and counter-drone capabilities at ADEX 2026" [ref=e332] [cursor=pointer]:
                    - /url: https://www.zawya.com/en/press-release/companies-news/edge-returns-to-adex-2026-with-layered-air-defence-and-counter-drone-capability-1322054
                  - paragraph [ref=e333]: EDGE’s ADEX display, scheduled for 30 September–2 October 2026, features layered air defence, counter-drone capabilities, electronic warfare, loitering munitions and guided weapons.
                  - paragraph [ref=e334]:
                    - generic [ref=e335]: Zawya
                    - link "EDGE Group" [ref=e336] [cursor=pointer]:
                      - /url: /watchlist/edge
              - listitem [ref=e337]:
                - generic [ref=e338]:
                  - time [ref=e339]: 2026-09-25
                  - text: infrastructure
                - generic [ref=e340]:
                  - link "MGX-backed consortium eyes another data-center portfolio" [ref=e341] [cursor=pointer]:
                    - /url: https://enterpriseam.com/uae/2026/09/25/this-morning-iranian-flights-suspended-mgx-backed-consortium-eyes-another-data-center-portfolio-mubadala-eyes-stake-in-italian-turbine-maker/
                  - paragraph [ref=e342]: EnterpriseAM reports that an MGX-backed consortium is considering another data-center portfolio; the excerpt provides no further deal details.
                  - paragraph [ref=e343]:
                    - generic [ref=e344]: EnterpriseAM
                    - link "MGX" [ref=e345] [cursor=pointer]:
                      - /url: /watchlist/mgx
              - listitem [ref=e346]:
                - generic [ref=e347]:
                  - time [ref=e348]: 2026-09-21
                  - text: health
                - generic [ref=e349]:
                  - link "PureHealth launches AI system to process Daman insurance documents" [ref=e350] [cursor=pointer]:
                    - /url: https://healthtechasia.co/purehealth-launches-ai-system-to-process-daman-insurance-documents/
                  - paragraph [ref=e351]: PureHealth launched a system using LLMs and document classification to automate Daman policy applications, endorsements and claims. It serves more than 3 million members and is intended to reduce errors and turnaround times.
                  - paragraph [ref=e352]:
                    - generic [ref=e353]: HealthTechAsia
                    - link "PureHealth" [ref=e354] [cursor=pointer]:
                      - /url: /watchlist/purehealth
              - listitem [ref=e355]:
                - generic [ref=e356]:
                  - time [ref=e357]: 2026-09-20
                  - text: partnership
                - generic [ref=e358]:
                  - link "UAE Government and Dell Technologies collaborate on agentic AI capabilities" [ref=e359] [cursor=pointer]:
                    - /url: https://www.wam.ae/en/article/c2cbp0j-artificial-intelligence-office-collaborates-with
                  - paragraph [ref=e360]: The UAE Government’s Artificial Intelligence Office launched a strategic collaboration with Dell Technologies to build national capabilities and develop practical agentic AI applications for government operations and services.
                  - paragraph [ref=e361]:
                    - generic [ref=e362]: WAM
              - listitem [ref=e363]:
                - generic [ref=e364]:
                  - time [ref=e365]: 2026-09-18
                  - text: health
                - generic [ref=e366]:
                  - link "PureHealth launches AI solution for Daman healthcare documents" [ref=e367] [cursor=pointer]:
                    - /url: https://www.mediaoffice.abudhabi/en/health/purehealth-launches-ai-powered-solution-to-enhance-access-to-healthcare-services-for-daman-members/
                  - paragraph [ref=e368]: The solution will automate document processing for Daman, handling more than 60 million documents annually, converting over 80% into structured data and reducing processing times from days to minutes.
                  - paragraph [ref=e369]:
                    - generic [ref=e370]: Abu Dhabi Media Office
                    - link "PureHealth" [ref=e371] [cursor=pointer]:
                      - /url: /watchlist/purehealth
                    - generic [ref=e372]: · +1 corroborating report
              - listitem [ref=e373]:
                - generic [ref=e374]:
                  - time [ref=e375]: 2026-09-13
                  - text: infrastructure
                - generic [ref=e376]:
                  - link "Stargate UAE phase-one enclosure milestone" [ref=e377] [cursor=pointer]:
                    - /url: https://thegulftape.com/articles/stargate-uae
                  - paragraph [ref=e378]: The report says two 100 MW buildings had been enclosed by August, with Khazna still targeting an end-2026 customer handover for phase one of the 1 GW cluster.
                  - paragraph [ref=e379]:
                    - generic [ref=e380]: The Gulf Tape
                    - link "G42" [ref=e381] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Khazna Data Centers" [ref=e382] [cursor=pointer]:
                      - /url: /watchlist/khazna
                    - link "M42" [ref=e383] [cursor=pointer]:
                      - /url: /watchlist/m42
              - listitem [ref=e384]:
                - generic [ref=e385]:
                  - time [ref=e386]: 2026-09-09
                  - text: space
                - generic [ref=e387]:
                  - link "UAE announces $1 billion French space AI project with Mistral" [ref=e388] [cursor=pointer]:
                    - /url: https://www.lemonde.fr/en/economy/article/2026/09/09/uae-commits-1-billion-to-french-space-ai-project_6757342_19.html
                  - paragraph [ref=e389]: The mission brief describes a $1 billion UAE-French space AI project involving Mistral.
                  - paragraph [ref=e390]:
                    - generic [ref=e391]: Le Monde
                    - generic [ref=e392]: · +10 corroborating reports
              - listitem [ref=e393]:
                - generic [ref=e394]:
                  - time [ref=e395]: 2026-09-09
                  - text: infrastructure
                - generic [ref=e396]:
                  - link "Stargate UAE data-centre expansion and Microsoft-G42 capacity plans" [ref=e397] [cursor=pointer]:
                    - /url: https://gulfbusinessreview.com/technology/uae-data-center-tracker-2026
                  - paragraph [ref=e398]: The tracker reports Stargate UAE’s 1 GW Abu Dhabi compute target, with 200 MW expected online in 2026, and a 200 MW Microsoft-G42 expansion via Khazna Data Centers.
                  - paragraph [ref=e399]:
                    - generic [ref=e400]: Gulf Business Review
                    - link "G42" [ref=e401] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Khazna Data Centers" [ref=e402] [cursor=pointer]:
                      - /url: /watchlist/khazna
                    - generic [ref=e403]: · +1 corroborating report
              - listitem [ref=e404]:
                - generic [ref=e405]:
                  - time [ref=e406]: 2026-09-07
                  - text: other
                - generic [ref=e407]:
                  - link "Micropolis Robotics showcases UAE-developed Physical AI alongside Dubai Police at AIM Congress" [ref=e408] [cursor=pointer]:
                    - /url: https://finance.yahoo.com/technology/ai/articles/micropolis-robotics-brings-uae-developed-134900401.html
                  - paragraph [ref=e409]: Micropolis showcased autonomous robotic platforms alongside Dubai Police at AIM Congress in Dubai, demonstrating potential uses in public safety, infrastructure monitoring and field operations.
                  - paragraph [ref=e410]:
                    - generic [ref=e411]: GlobeNewswire via Yahoo Finance
                    - link "Dubai Police" [ref=e412] [cursor=pointer]:
                      - /url: /watchlist/dubai-police
                    - link "Micropolis Robotics" [ref=e413] [cursor=pointer]:
                      - /url: /watchlist/micropolis
              - listitem [ref=e414]:
                - generic [ref=e415]:
                  - time [ref=e416]: 2026-09-04
                  - text: geopolitics
                - generic [ref=e417]:
                  - link "G42 weighs majority US ownership to safeguard AI-chip access" [ref=e418] [cursor=pointer]:
                    - /url: https://www.bloomberg.com/news/articles/2026-09-04/abu-dhabi-s-g42-weighs-us-ownership-to-safeguard-ai-chip-access
                  - paragraph [ref=e419]: G42 executives held exploratory talks about potentially selling a majority stake to American companies, as the company sought to secure access to advanced chips beyond the following year.
                  - paragraph [ref=e420]:
                    - generic [ref=e421]: Bloomberg
                    - link "G42" [ref=e422] [cursor=pointer]:
                      - /url: /watchlist/g42
              - listitem [ref=e423]:
                - generic [ref=e424]:
                  - time [ref=e425]: 2026-09-03
                  - text: models
                - generic [ref=e426]:
                  - generic [ref=e427]:
                    - text: K2 Horizon announced
                    - superscript [ref=e428]: source unverified
                  - paragraph [ref=e429]: The mission brief lists K2 Horizon on this date; it provides no further details.
                  - paragraph [ref=e430]:
                    - generic [ref=e431]: publisher n/a
                    - generic [ref=e432]: · +1 corroborating report
              - listitem [ref=e433]:
                - generic [ref=e434]:
                  - time [ref=e435]: 2026-09-03
                  - text: models
                - generic [ref=e436]:
                  - generic [ref=e437]:
                    - text: K2 Horizon model
                    - superscript [ref=e438]: source unverified
                  - paragraph [ref=e439]: The mission brief identifies K2 Horizon as a UAE AI model release dated 2026-09-03.
                  - paragraph [ref=e440]:
                    - generic [ref=e441]: Mission brief
                    - link "Mohamed bin Zayed University of Artificial Intelligence" [ref=e442] [cursor=pointer]:
                      - /url: /watchlist/mbzuai
                    - generic [ref=e443]: · +1 corroborating report
              - listitem [ref=e444]:
                - generic [ref=e445]:
                  - time [ref=e446]: 2026-09-03
                  - text: models
                - generic [ref=e447]:
                  - link "MBZUAI introduces K2 Horizon open-model suite" [ref=e448] [cursor=pointer]:
                    - /url: https://www.thenationalnews.com/future/technology/2026/09/03/mbzuai-k2-horizon-ai-open-model-uae/
                  - paragraph [ref=e449]: MBZUAI and its Institute of Foundation Models released six fully open models ranging from 0.9B to 375B parameters, with weights, code, training data and methods disclosed.
                  - paragraph [ref=e450]:
                    - generic [ref=e451]: The National
                    - link "Mohamed bin Zayed University of Artificial Intelligence" [ref=e452] [cursor=pointer]:
                      - /url: /watchlist/mbzuai
                    - generic [ref=e453]: · +1 corroborating report
              - listitem [ref=e454]:
                - generic [ref=e455]:
                  - time [ref=e456]: 2026-09-03
                  - text: models
                - generic [ref=e457]:
                  - generic [ref=e458]:
                    - text: K2 Horizon introduced
                    - superscript [ref=e459]: source unverified
                  - paragraph [ref=e460]: The mission brief lists K2 Horizon as a dated UAE-AI news event; it provides no further details.
                  - paragraph [ref=e461]:
                    - generic [ref=e462]: Mission brief
              - listitem [ref=e463]:
                - generic [ref=e464]:
                  - time [ref=e465]: 2026-09-02
                  - text: funding
                - generic [ref=e466]:
                  - link "G42 explores raising billions of dollars" [ref=e467] [cursor=pointer]:
                    - /url: https://www.bloomberg.com/news/articles/2026-09-02/microsoft-backed-ai-firm-g42-weighs-raising-billions-of-dollars
                  - paragraph [ref=e468]: G42 held exploratory talks with potential investors about raising billions. The company already counts Mubadala Investment Company, Silver Lake and Microsoft among its investors; no final decision on size or structure was reported.
                  - paragraph [ref=e469]:
                    - generic [ref=e470]: Bloomberg
                    - link "G42" [ref=e471] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Mubadala Investment Company" [ref=e472] [cursor=pointer]:
                      - /url: /watchlist/mubadala
              - listitem [ref=e473]:
                - generic [ref=e474]:
                  - time [ref=e475]: 2026-09
                  - text: funding
                - generic [ref=e476]:
                  - link "G42 announces investment by Silver Lake" [ref=e477] [cursor=pointer]:
                    - /url: https://www.g42.ai/resources/news/g42-announces-investment-by-silver-lake
                  - paragraph [ref=e478]: Silver Lake made a substantial investment in G42 to support expansion of its AI and cloud capabilities in the UAE and international markets; terms were undisclosed.
                  - paragraph [ref=e479]:
                    - generic [ref=e480]: G42
                    - link "G42" [ref=e481] [cursor=pointer]:
                      - /url: /watchlist/g42
              - listitem [ref=e482]:
                - generic [ref=e483]:
                  - time [ref=e484]: 2026-09
                  - text: partnership
                - generic [ref=e485]:
                  - link "Banco Santander and G42 sign memorandum of understanding" [ref=e486] [cursor=pointer]:
                    - /url: https://www.g42.ai/resources/news/banco-santander-and-g42-sign-memorandum-understanding-explore-strategic-cooperation
                  - paragraph [ref=e487]: G42 and Santander signed an MoU to explore AI-driven advisory and savings products and banking intelligence. The source describes September 2026 as the likely publication month; Inception and Presight are to play central roles.
                  - paragraph [ref=e488]:
                    - generic [ref=e489]: G42
                    - link "G42" [ref=e490] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Inception (Inception42, G42)" [ref=e491] [cursor=pointer]:
                      - /url: /watchlist/inception
                    - link "Presight AI Holding PLC" [ref=e492] [cursor=pointer]:
                      - /url: /watchlist/presight
              - listitem [ref=e493]:
                - generic [ref=e494]:
                  - time [ref=e495]: 2026-09
                  - text: talent
                - generic [ref=e496]:
                  - link "Technology Innovation Institute appoints Ray O. Johnson as CEO" [ref=e497] [cursor=pointer]:
                    - /url: https://www.atrc.gov.ae/news/technology-innovation-institute-appoints-eminent-technologist-dr-ray-o-johnson-ceo
                  - paragraph [ref=e498]: In September 2026, Dr Ray O. Johnson was appointed the first CEO of the Technology Innovation Institute.
                  - paragraph [ref=e499]:
                    - generic [ref=e500]: Advanced Technology Research Council (ATRC)
                    - link "Advanced Technology Research Council" [ref=e501] [cursor=pointer]:
                      - /url: /watchlist/atrc
                    - link "Technology Innovation Institute" [ref=e502] [cursor=pointer]:
                      - /url: /watchlist/tii
              - listitem [ref=e503]:
                - generic [ref=e504]:
                  - time [ref=e505]: 2026-09
                  - text: funding
                - generic [ref=e506]:
                  - link "Presight and Shorooq back Maven Robotics in its $100 million Series A" [ref=e507] [cursor=pointer]:
                    - /url: https://www.agbi.com/tech/2026/09/abu-dhabi-companies-invest-in-us-startup-maven-robotics/
                  - paragraph [ref=e508]: Presight and Shorooq invested in the industrial robot developer’s Series A. Maven says its robots operate up to 16 hours daily at customer sites with reliability above 99%.
                  - paragraph [ref=e509]:
                    - generic [ref=e510]: AGBI
                    - link "Presight AI Holding PLC" [ref=e511] [cursor=pointer]:
                      - /url: /watchlist/presight
              - listitem [ref=e512]:
                - generic [ref=e513]:
                  - time [ref=e514]: 2026-09
                  - text: health
                - generic [ref=e515]:
                  - link "M42 plans unified health data environment with Oracle Health" [ref=e516] [cursor=pointer]:
                    - /url: https://www.analyticsinsight.ae/artificial-intelligence/ai-healthcare-solutions-companies-platforms-emerging-technologies
                  - paragraph [ref=e517]: M42 announced plans to adopt Oracle Health Data Intelligence with Oracle Health Foundation EHR, unifying clinical, genomic and real-world data for care, population health, precision medicine and research.
                  - paragraph [ref=e518]:
                    - generic [ref=e519]: Analytics Insight
                    - link "M42" [ref=e520] [cursor=pointer]:
                      - /url: /watchlist/m42
              - listitem [ref=e521]:
                - generic [ref=e522]:
                  - time [ref=e523]: 2026-09
                  - text: partnership
                - generic [ref=e524]:
                  - link "G42 and Santander sign strategic cooperation MoU" [ref=e525] [cursor=pointer]:
                    - /url: https://www.g42.ai/resources/news/banco-santander-and-g42-sign-memorandum-understanding-explore-strategic-cooperation
                  - paragraph [ref=e526]: G42 and Santander agreed to explore AI-driven advisory and savings products and banking intelligence; G42 units Inception and Presight were identified as central participants.
                  - paragraph [ref=e527]:
                    - generic [ref=e528]: G42
                    - link "G42" [ref=e529] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Inception (Inception42, G42)" [ref=e530] [cursor=pointer]:
                      - /url: /watchlist/inception
                    - link "Presight AI Holding PLC" [ref=e531] [cursor=pointer]:
                      - /url: /watchlist/presight
              - listitem [ref=e532]:
                - generic [ref=e533]:
                  - time [ref=e534]: 2026-08-26
                  - text: policy
                - generic [ref=e535]:
                  - link "UAE government services described as shifting toward proactive delivery" [ref=e536] [cursor=pointer]:
                    - /url: https://www.voiceofemirates.com/en/emirates/2026/08/26/the-proactive-government-in-the-uae-a-service-before-you-even-ask-for-it/
                  - paragraph [ref=e537]: The article describes UAE services initiated around life events and government-held data, rather than waiting for citizens to submit requests, and raises questions about data use and algorithmic errors.
                  - paragraph [ref=e538]:
                    - generic [ref=e539]: Voice of Emirates
              - listitem [ref=e540]:
                - generic [ref=e541]:
                  - time [ref=e542]: 2026-08-24
                  - text: partnership
                - generic [ref=e543]:
                  - link "Micropolis Robotics becomes an AI and robotics provider to ADNOC" [ref=e544] [cursor=pointer]:
                    - /url: https://investors.micropolis.ai/
                  - paragraph [ref=e545]: Micropolis Robotics became a robotics and physical AI provider to ADNOC.
                  - paragraph [ref=e546]:
                    - generic [ref=e547]: Micropolis
                    - link "Abu Dhabi National Oil Company (ADNOC)" [ref=e548] [cursor=pointer]:
                      - /url: /watchlist/adnoc
                    - link "Micropolis Robotics" [ref=e549] [cursor=pointer]:
                      - /url: /watchlist/micropolis
              - listitem [ref=e550]:
                - generic [ref=e551]:
                  - time [ref=e552]: 2026-08-20
                  - text: infrastructure
                - generic [ref=e553]:
                  - link "Core42 AI Cloud supports MBZUAI research at scale" [ref=e554] [cursor=pointer]:
                    - /url: https://www.core42.ai/resource/blogs/mbzuai-engineering-the-future-of-ai-research-at-scale-with-core42-ai-cloud
                  - paragraph [ref=e555]: Core42 described its sovereign AI Cloud supporting MBZUAI frontier-model training across different accelerators, including NVIDIA, AMD and Cerebras infrastructure.
                  - paragraph [ref=e556]:
                    - generic [ref=e557]: Core42
                    - link "Core42" [ref=e558] [cursor=pointer]:
                      - /url: /watchlist/core42
                    - link "Mohamed bin Zayed University of Artificial Intelligence" [ref=e559] [cursor=pointer]:
                      - /url: /watchlist/mbzuai
              - listitem [ref=e560]:
                - generic [ref=e561]:
                  - time [ref=e562]: 2026-08-13
                  - text: partnership
                - generic [ref=e563]:
                  - link "AIREV and Qualcomm agree to advance autonomous AI deployments" [ref=e564] [cursor=pointer]:
                    - /url: https://gulfnews.com/business/corporate-news/airev-and-qualcomm-to-advance-autonomous-ai-across-enterprise-and-government-environments-1.500639938
                  - paragraph [ref=e565]: AIREV agreed to integrate its OnDemand platform with Qualcomm Dragonwing products, including the AI On-Prem Appliance, for enterprise and government deployments.
                  - paragraph [ref=e566]:
                    - generic [ref=e567]: Gulf News
                    - link "AIREV" [ref=e568] [cursor=pointer]:
                      - /url: /watchlist/airev
              - listitem [ref=e569]:
                - generic [ref=e570]:
                  - time [ref=e571]: 2026-08-06
                  - text: space
                - generic [ref=e572]:
                  - link "Space42 reports H1 2026 results and growth in Smart Solutions" [ref=e573] [cursor=pointer]:
                    - /url: https://space42.ai/en/press-release/2026/space42-delivers-exceptional-h1-2026-results
                  - paragraph [ref=e574]: Space42 reported USD 260 million H1 revenue, up 15% year-on-year, and said Smart Solutions growth was driven by government demand for geospatial intelligence and situational awareness.
                  - paragraph [ref=e575]:
                    - generic [ref=e576]: Space42
                    - link "Space42 PLC" [ref=e577] [cursor=pointer]:
                      - /url: /watchlist/space42
              - listitem [ref=e578]:
                - generic [ref=e579]:
                  - time [ref=e580]: 2026-07-29
                  - text: partnership
                - generic [ref=e581]:
                  - link "G42 joins Nvidia’s Open Secure AI Alliance" [ref=e582] [cursor=pointer]:
                    - /url: https://enterpriseam.com/uae/2026/07/29/g42-joins-nvidias-alliance-for-open-source-ai/
                  - paragraph [ref=e583]: G42 joined Nvidia’s Open Secure AI Alliance, which backs open-weight and open-source AI models and cybersecurity tools. The alliance plans to share tools for vulnerability discovery, AI-agent testing and defensive models.
                  - paragraph [ref=e584]:
                    - generic [ref=e585]: EnterpriseAM
                    - link "G42" [ref=e586] [cursor=pointer]:
                      - /url: /watchlist/g42
              - listitem [ref=e587]:
                - generic [ref=e588]:
                  - time [ref=e589]: 2026-07-22
                  - text: partnership
                - generic [ref=e590]:
                  - link "AIREV and Redington agree to distribute OnDemand across the GCC and Africa" [ref=e591] [cursor=pointer]:
                    - /url: https://techafricanews.com/2026/07/22/airev-partners-with-redington-to-expand-uae-built-agentic-ai-across-gcc-and-africa/
                  - paragraph [ref=e592]: AIREV and Redington agreed to distribute OnDemand Enterprise across the GCC and Africa, with software-only, self-hosted, and cloud-hosted deployment options and channel-partner services.
                  - paragraph [ref=e593]:
                    - generic [ref=e594]: TechAfrica News
                    - link "AIREV" [ref=e595] [cursor=pointer]:
                      - /url: /watchlist/airev
              - listitem [ref=e596]:
                - generic [ref=e597]:
                  - time [ref=e598]: 2026-07-20
                  - text: partnership
                - generic [ref=e599]:
                  - link "e& UAE and Core42 partner to deliver sovereign AI infrastructure" [ref=e600] [cursor=pointer]:
                    - /url: https://www.eand.com/en/news/20-07-26-eand-uae-core42-sovereign-ai-infrastructure.html
                  - paragraph [ref=e601]: The companies will co-deliver an in-country Sovereign AI Compute platform for enterprise and government, combining Core42’s sovereign AI cloud with e& UAE’s national digital infrastructure.
                  - paragraph [ref=e602]:
                    - generic [ref=e603]: e& UAE
                    - link "Core42" [ref=e604] [cursor=pointer]:
                      - /url: /watchlist/core42
                    - link "e& enterprise" [ref=e605] [cursor=pointer]:
                      - /url: /watchlist/eand-enterprise
                    - generic [ref=e606]: · +1 corroborating report
              - listitem [ref=e607]:
                - generic [ref=e608]:
                  - time [ref=e609]: 2026-07-14
                  - text: geopolitics
                - generic [ref=e610]:
                  - link "UAE moves to BIS Country Group A:5" [ref=e611] [cursor=pointer]:
                    - /url: https://gulfbusinessreview.com/technology/uae-data-center-tracker-2026
                  - paragraph [ref=e612]: The mission brief says the BIS move took effect on July 10, 2026, and was published on July 14, 2026.
                  - paragraph [ref=e613]:
                    - generic [ref=e614]: Mission brief
                    - link "Core42" [ref=e615] [cursor=pointer]:
                      - /url: /watchlist/core42
                    - link "G42" [ref=e616] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Khazna Data Centers" [ref=e617] [cursor=pointer]:
                      - /url: /watchlist/khazna
                    - generic [ref=e618]: · +7 corroborating reports
              - listitem [ref=e619]:
                - generic [ref=e620]:
                  - time [ref=e621]: 2026-07-14
                  - text: policy
                - generic [ref=e622]:
                  - link "UAE moves to Country Group A:5 for advanced technology exports" [ref=e623] [cursor=pointer]:
                    - /url: https://gulfbusinessreview.com/technology/uae-data-center-tracker-2026
                  - paragraph [ref=e624]: The BIS moved the UAE to Country Group A:5 on July 10, 2026; the change was published July 14, 2026.
                  - paragraph [ref=e625]:
                    - generic [ref=e626]: publisher n/a
                    - link "Core42" [ref=e627] [cursor=pointer]:
                      - /url: /watchlist/core42
                    - link "G42" [ref=e628] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Khazna Data Centers" [ref=e629] [cursor=pointer]:
                      - /url: /watchlist/khazna
                    - generic [ref=e630]: · +1 corroborating report
              - listitem [ref=e631]:
                - generic [ref=e632]:
                  - time [ref=e633]: 2026-07
                  - text: infrastructure
                - generic [ref=e634]:
                  - link "Microsoft and G42 announce UAE data-centre expansion via Khazna" [ref=e635] [cursor=pointer]:
                    - /url: https://www.g42.ai/resources/news/microsoft-and-g42-accelerate-uaes-digital-future-major-data-centre-expansion
                  - paragraph [ref=e636]: The expansion adds 200 MW through Khazna Data Centers as part of Microsoft’s stated US$15.2 billion UAE investment; capacity was expected online by the end of 2026.
                  - paragraph [ref=e637]:
                    - generic [ref=e638]: G42
                    - link "G42" [ref=e639] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Khazna Data Centers" [ref=e640] [cursor=pointer]:
                      - /url: /watchlist/khazna
              - listitem [ref=e641]:
                - generic [ref=e642]:
                  - time [ref=e643]: 2026-07
                  - text: infrastructure
                - generic [ref=e644]:
                  - link "UAE announces $15.2 billion Microsoft investment and 200 MW expansion" [ref=e645] [cursor=pointer]:
                    - /url: https://www.g42.ai/resources/news/microsoft-and-g42-accelerate-uaes-digital-future-major-data-centre-expansion
                  - paragraph [ref=e646]: The brief identifies Microsoft’s $15.2 billion UAE investment and an additional 200 MW of capacity via Khazna Data Centers.
                  - paragraph [ref=e647]:
                    - generic [ref=e648]: Mission brief
                    - link "G42" [ref=e649] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Khazna Data Centers" [ref=e650] [cursor=pointer]:
                      - /url: /watchlist/khazna
              - listitem [ref=e651]:
                - generic [ref=e652]:
                  - time [ref=e653]: 2026-06-16
                  - text: partnership
                - generic [ref=e654]:
                  - link "Micropolis Robotics agrees to five-year Abu Dhabi sweeper deployment" [ref=e655] [cursor=pointer]:
                    - /url: https://micropolis.ai/
                  - paragraph [ref=e656]: Micropolis Robotics signed a five-year agreement to deploy autonomous sweepers for the Abu Dhabi Government.
                  - paragraph [ref=e657]:
                    - generic [ref=e658]: Micropolis
                    - link "Micropolis Robotics" [ref=e659] [cursor=pointer]:
                      - /url: /watchlist/micropolis
              - listitem [ref=e660]:
                - generic [ref=e661]:
                  - time [ref=e662]: 2026-06-14
                  - text: policy
                - generic [ref=e663]:
                  - link "UAE Artificial Intelligence and Data Authority announced" [ref=e664] [cursor=pointer]:
                    - /url: https://uaecabinet.ae/en/news/mohammed-bin-rashid-approves-establishing-artificial-intelligence-and-data-authority
                  - paragraph [ref=e665]: The mission brief lists the establishment or announcement of the UAE Artificial Intelligence and Data Authority on this date.
                  - paragraph [ref=e666]:
                    - generic [ref=e667]: UAE Cabinet
                    - link "Artificial Intelligence and Data Authority" [ref=e668] [cursor=pointer]:
                      - /url: /watchlist/ai-data-authority
                    - generic [ref=e669]: · +12 corroborating reports
              - listitem [ref=e670]:
                - generic [ref=e671]:
                  - time [ref=e672]: 2026-06-09
                  - text: space
                - generic [ref=e673]:
                  - link "Space42’s Foresight-3, Foresight-4 and Foresight-5 satellites become operational" [ref=e674] [cursor=pointer]:
                    - /url: https://space42.ai/en/press-release/2026/space42-expands-earth-observation-capabilities
                  - paragraph [ref=e675]: Space42 said three new SAR satellites are operational, expanding its five-satellite constellation. Its GIQ platform processes satellite imagery into geospatial intelligence; the satellites were manufactured with ICEYE.
                  - paragraph [ref=e676]:
                    - generic [ref=e677]: Space42
                    - link "Space42 PLC" [ref=e678] [cursor=pointer]:
                      - /url: /watchlist/space42
              - listitem [ref=e679]:
                - generic [ref=e680]:
                  - time [ref=e681]: 2026-06-02
                  - text: policy
                - generic [ref=e682]:
                  - link "UAE pushes initiatives to develop AI unicorn companies" [ref=e683] [cursor=pointer]:
                    - /url: https://intlbm.com/2026/06/02/uae-boosts-initiatives-to-develop-ai-unicorn-companies/
                  - paragraph [ref=e684]: The article describes a policy push to foster AI unicorns, reporting three AI unicorns in the UAE and 673 AI companies in Abu Dhabi, with 150 new firms launched there in H1 2025.
                  - paragraph [ref=e685]:
                    - generic [ref=e686]: intlbm.com
                    - link "Dubai Centre for Artificial Intelligence" [ref=e687] [cursor=pointer]:
                      - /url: /watchlist/dcai
                    - link "G42" [ref=e688] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Hub71" [ref=e689] [cursor=pointer]:
                      - /url: /watchlist/hub71
                    - link "XPANCEO" [ref=e690] [cursor=pointer]:
                      - /url: /watchlist/xpanceo
              - listitem [ref=e691]:
                - generic [ref=e692]:
                  - time [ref=e693]: 2026-06-01
                  - text: infrastructure
                - generic [ref=e694]:
                  - link "Positron AI establishes its first presence outside the US at DIFC" [ref=e695] [cursor=pointer]:
                    - /url: https://www.difc.com/whats-on/news/positron-ai-establishes-first-presence-outside-the-us-in-difc?trk=article-ssr-frontend-pulse_little-text-block&utm_source=openai
                  - paragraph [ref=e696]: Positron AI established a regional presence at DIFC under the Dubai AI Licence, focused on power-efficient, scalable AI inference infrastructure.
                  - paragraph [ref=e697]:
                    - generic [ref=e698]: DIFC
                    - link "Dubai AI Campus" [ref=e699] [cursor=pointer]:
                      - /url: /watchlist/dubai-ai-campus
                    - link "Positron AI Ltd" [ref=e700] [cursor=pointer]:
                      - /url: /watchlist/positron
              - listitem [ref=e701]:
                - generic [ref=e702]:
                  - time [ref=e703]: 2026-06
                  - text: health
                - generic [ref=e704]:
                  - link "M42 and Qritive introduce AI-based prostate cancer diagnostics" [ref=e705] [cursor=pointer]:
                    - /url: https://www.analyticsinsight.ae/artificial-intelligence/ai-healthcare-solutions-companies-platforms-emerging-technologies
                  - paragraph [ref=e706]: M42’s National Reference Laboratory worked with Qritive to introduce AI-based prostate cancer diagnostics in the UAE, providing pathologists additional analysis while doctors retain clinical authority.
                  - paragraph [ref=e707]:
                    - generic [ref=e708]: Analytics Insight
                    - link "M42" [ref=e709] [cursor=pointer]:
                      - /url: /watchlist/m42
              - listitem [ref=e710]:
                - generic [ref=e711]:
                  - time [ref=e712]: 2026-06
                  - text: funding
                - generic [ref=e713]:
                  - link "Saal.ai raises a $60 million Series A" [ref=e714] [cursor=pointer]:
                    - /url: https://www.dxbstart.com/sector/ai
                  - paragraph [ref=e715]: Saal.ai raised a $60 million Series A led by AI71 and BlueFive Capital, according to the cited listing.
                  - paragraph [ref=e716]:
                    - generic [ref=e717]: DXBStart
                    - link "AI71" [ref=e718] [cursor=pointer]:
                      - /url: /watchlist/ai71
                    - link "Saal.ai" [ref=e719] [cursor=pointer]:
                      - /url: /watchlist/saal-ai
              - listitem [ref=e720]:
                - generic [ref=e721]:
                  - time [ref=e722]: 2026-05-10
                  - text: policy
                - generic [ref=e723]:
                  - link "UAE launches guide to generative AI applications" [ref=e724] [cursor=pointer]:
                    - /url: https://www.middleeastainews.com/p/uae-ai-office-publishes-practical
                  - paragraph [ref=e725]: The UAE AI Office released an Arabic- and English-language guide covering 19 generative AI use cases, with practical examples, best practices and recommendations for selecting tools.
                  - paragraph [ref=e726]:
                    - generic [ref=e727]: Middle East AI News
              - listitem [ref=e728]:
                - generic [ref=e729]:
                  - time [ref=e730]: 2026-05-04
                  - text: partnership
                - generic [ref=e731]:
                  - link "Micropolis Robotics signs $1.2 million EMSTEEL agreement" [ref=e732] [cursor=pointer]:
                    - /url: https://micropolis.ai/
                  - paragraph [ref=e733]: Micropolis Robotics signed a $1.2 million agreement with EMSTEEL to expand its industrial automation footprint.
                  - paragraph [ref=e734]:
                    - generic [ref=e735]: Micropolis
                    - link "Micropolis Robotics" [ref=e736] [cursor=pointer]:
                      - /url: /watchlist/micropolis
              - listitem [ref=e737]:
                - generic [ref=e738]:
                  - time [ref=e739]: 2026-05-03
                  - text: models
                - generic [ref=e740]:
                  - link "TII launches Falcon Perception multimodal AI model" [ref=e741] [cursor=pointer]:
                    - /url: https://www.tii.ae/news/tii-launches-falcon-perception-new-multimodal-ai-model-helps-machines-see-and-understand-world
                  - paragraph [ref=e742]: Falcon Perception combines vision and language, including prompt-based object segmentation. The report describes a model of about 600 million parameters for robotics, document processing and industrial uses.
                  - paragraph [ref=e743]:
                    - generic [ref=e744]: Technology Innovation Institute (TII)
                    - link "Advanced Technology Research Council" [ref=e745] [cursor=pointer]:
                      - /url: /watchlist/atrc
                    - link "Technology Innovation Institute" [ref=e746] [cursor=pointer]:
                      - /url: /watchlist/tii
                    - generic [ref=e747]: · +1 corroborating report
              - listitem [ref=e748]:
                - generic [ref=e749]:
                  - time [ref=e750]: 2026-05
                  - text: health
                - generic [ref=e751]:
                  - link "Abu Dhabi announces intelligent surgical network with Johnson & Johnson" [ref=e752] [cursor=pointer]:
                    - /url: https://www.analyticsinsight.ae/artificial-intelligence/ai-healthcare-solutions-companies-platforms-emerging-technologies
                  - paragraph [ref=e753]: The Department of Health – Abu Dhabi announced a surgical network with Johnson & Johnson, using the Polyphonic digital ecosystem and technology from AWS, NVIDIA and Core42 to connect operating rooms.
                  - paragraph [ref=e754]:
                    - generic [ref=e755]: Analytics Insight
                    - link "Core42" [ref=e756] [cursor=pointer]:
                      - /url: /watchlist/core42
                    - link "Department of Health – Abu Dhabi" [ref=e757] [cursor=pointer]:
                      - /url: /watchlist/doh-abu-dhabi
              - listitem [ref=e758]:
                - generic [ref=e759]:
                  - time [ref=e760]: 2026-04-23
                  - text: policy
                - generic [ref=e761]:
                  - link "UAE announces plan for agentic AI across government services" [ref=e762] [cursor=pointer]:
                    - /url: https://www.foxnews.com/tech/united-arab-emirates-plans-ai-run-government-within-two-years
                  - paragraph [ref=e763]: The mission brief says the plan targets using agentic AI for 50% of government services by 2028.
                  - paragraph [ref=e764]:
                    - generic [ref=e765]: Fox News
                    - link "Artificial Intelligence and Data Authority" [ref=e766] [cursor=pointer]:
                      - /url: /watchlist/ai-data-authority
                    - generic [ref=e767]: · +16 corroborating reports
              - listitem [ref=e768]:
                - generic [ref=e769]:
                  - time [ref=e770]: 2026-04-23
                  - text: policy
                - generic [ref=e771]:
                  - generic [ref=e772]:
                    - text: UAE government targets agentic AI in half of services by 2028
                    - superscript [ref=e773]: source unverified
                  - paragraph [ref=e774]: The mission brief says the UAE set a goal for agentic AI to support 50% of government services by 2028.
                  - paragraph [ref=e775]:
                    - generic [ref=e776]: publisher n/a
                    - generic [ref=e777]: · +3 corroborating reports
              - listitem [ref=e778]:
                - generic [ref=e779]:
                  - time [ref=e780]: 2026-03-11
                  - text: other
                - generic [ref=e781]:
                  - link "Derq’s AI edge system targets traffic and pedestrian safety" [ref=e782] [cursor=pointer]:
                    - /url: https://en.derq.com/press-coverage/derq-edge-ai-system-improves-traffic-safety
                  - paragraph [ref=e783]: Derq’s edge appliance uses NVIDIA GPUs to process camera and radar data, predict crashes and warn connected road users; the system also supports traffic counts and identification of crash-prone road locations.
                  - paragraph [ref=e784]:
                    - generic [ref=e785]: Derq
                    - link "Derq" [ref=e786] [cursor=pointer]:
                      - /url: /watchlist/derq
              - listitem [ref=e787]:
                - generic [ref=e788]:
                  - time [ref=e789]: 2026-03
                  - text: health
                - generic [ref=e790]:
                  - link "PureHealth reports AI healthcare initiatives and facility energy optimisation" [ref=e791] [cursor=pointer]:
                    - /url: https://purehealth.ae/wp-content/uploads/2026/03/PureHealth_Integrated-Annual-Report_2025_EN.pdf
                  - paragraph [ref=e792]: PureHealth’s 2025 report describes a healthcare AI laboratory, clinical assistant Nada, digital health platform Pura, and AI-enabled IoT energy optimisation deployed across ten facilities, reducing annual consumption by over 13 million kWh.
                  - paragraph [ref=e793]:
                    - generic [ref=e794]: PureHealth
                    - link "PureHealth" [ref=e795] [cursor=pointer]:
                      - /url: /watchlist/purehealth
              - listitem [ref=e796]:
                - generic [ref=e797]:
                  - time [ref=e798]: 2026-02-05
                  - text: infrastructure
                - generic [ref=e799]:
                  - link "G42 and Cerebras unveil a four-trillion-transistor AI chip at WGS 2026" [ref=e800] [cursor=pointer]:
                    - /url: https://gulfnews.com/uae/uae-launches-worlds-largest-ai-chip-with-4-trillion-transistors-at-wgs-2026-1.500432873
                  - paragraph [ref=e801]: G42 and Cerebras co-developed a wafer-scale chip with more than four trillion transistors, unveiled at the World Governments Summit. The chip is intended for G42’s AI factory and 5GW UAE–US AI Campus.
                  - paragraph [ref=e802]:
                    - generic [ref=e803]: Gulf News
                    - link "Cerebras Systems" [ref=e804] [cursor=pointer]:
                      - /url: /watchlist/cerebras-uae
                    - link "G42" [ref=e805] [cursor=pointer]:
                      - /url: /watchlist/g42
              - listitem [ref=e806]:
                - generic [ref=e807]:
                  - time [ref=e808]: 2026-01
                  - text: partnership
                - generic [ref=e809]:
                  - link "EDGE, TII, Micropolis and SteerAI agree to deploy an autonomous logistics platform" [ref=e810] [cursor=pointer]:
                    - /url: https://edgegroup.ae/news/edge-tii-micropolis-and-steerai-deploy-advanced-autonomous-logistics-platform
                  - paragraph [ref=e811]: EDGE Group, TII, Micropolis and SteerAI agreed to deploy an autonomous logistics platform using AI software for navigation, fleet management and safety.
                  - paragraph [ref=e812]:
                    - generic [ref=e813]: EDGE Group
                    - link "EDGE Group" [ref=e814] [cursor=pointer]:
                      - /url: /watchlist/edge
                    - link "Micropolis Robotics" [ref=e815] [cursor=pointer]:
                      - /url: /watchlist/micropolis
                    - link "SteerAI" [ref=e816] [cursor=pointer]:
                      - /url: /watchlist/steerai
                    - link "Technology Innovation Institute" [ref=e817] [cursor=pointer]:
                      - /url: /watchlist/tii
              - listitem [ref=e818]:
                - generic [ref=e819]:
                  - time [ref=e820]: "2026"
                  - text: infrastructure
                - generic [ref=e821]:
                  - generic [ref=e822]:
                    - text: Stargate UAE 1GW project and first 200MW phase
                    - superscript [ref=e823]: source unverified
                  - paragraph [ref=e824]: The brief describes a 1GW Stargate UAE project within a 5GW UAE-US AI Campus, with G42 building, OpenAI and Oracle operating, and the first 200MW expected in 2026; it also names NVIDIA GB300, Cisco and SoftBank.
                  - paragraph [ref=e825]:
                    - generic [ref=e826]: Mission brief
                    - link "G42" [ref=e827] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "M42" [ref=e828] [cursor=pointer]:
                      - /url: /watchlist/m42
                    - generic [ref=e829]: · +1 corroborating report
              - listitem [ref=e830]:
                - generic [ref=e831]:
                  - time [ref=e832]: "2026"
                  - text: models
                - generic [ref=e833]:
                  - generic [ref=e834]:
                    - text: Cerebras 4-trillion-transistor chip at World Governments Summit
                    - superscript [ref=e835]: source unverified
                  - paragraph [ref=e836]: The brief identifies a Cerebras 4-trillion-transistor chip at World Governments Summit 2026.
                  - paragraph [ref=e837]:
                    - generic [ref=e838]: Mission brief
                    - link "Cerebras Systems" [ref=e839] [cursor=pointer]:
                      - /url: /watchlist/cerebras-uae
              - listitem [ref=e840]:
                - generic [ref=e841]:
                  - time [ref=e842]: "2026"
                  - text: defence
                - generic [ref=e843]:
                  - generic [ref=e844]:
                    - text: EDGE Group at ADEX 2026
                    - superscript [ref=e845]: source unverified
                  - paragraph [ref=e846]: The brief identifies EDGE Group at ADEX 2026; it provides no further detail about the announcement or activity.
                  - paragraph [ref=e847]:
                    - generic [ref=e848]: Mission brief
                    - link "EDGE Group" [ref=e849] [cursor=pointer]:
                      - /url: /watchlist/edge
                    - generic [ref=e850]: · +1 corroborating report
              - listitem [ref=e851]:
                - generic [ref=e852]:
                  - time [ref=e853]: 2026-12-07
                  - text: other
                - generic [ref=e854]:
                  - link "GITEX GLOBAL 2026 scheduled for 7–11 December 2026 at Expo City Dubai (moved from October / DWTC)" [ref=e855] [cursor=pointer]:
                    - /url: https://www.gitex.com
                  - paragraph [ref=e856]: GITEX GLOBAL 2026 runs 7–11 December 2026 at Expo City Dubai. October 2026 items are therefore not 'at GITEX'; Ai Everything Abu Dhabi was 6–7 Oct 2026 at ADNEC.
                  - paragraph [ref=e857]:
                    - generic [ref=e858]: GITEX
              - listitem [ref=e859]:
                - generic [ref=e860]:
                  - time [ref=e861]: "2026"
                  - text: models
                - generic [ref=e862]:
                  - generic [ref=e863]:
                    - text: Cerebras presented a 4-trillion-transistor chip at WGS 2026
                    - superscript [ref=e864]: source unverified
                  - paragraph [ref=e865]: The mission brief notes that Cerebras presented a chip with 4 trillion transistors at WGS 2026.
                  - paragraph [ref=e866]:
                    - generic [ref=e867]: Mission brief
                    - link "Cerebras Systems" [ref=e868] [cursor=pointer]:
                      - /url: /watchlist/cerebras-uae
              - listitem [ref=e869]:
                - generic [ref=e870]:
                  - time [ref=e871]: 2025-12-11
                  - text: health
                - generic [ref=e872]:
                  - link "PureHealth launches AI-powered diagnostic mega lab" [ref=e873] [cursor=pointer]:
                    - /url: https://techafricanews.com/2025/12/11/purehealth-launches-ai-powered-diagnostic-mega-lab-to-transform-uae-healthcare/
                  - paragraph [ref=e874]: PureHealth launched a 70,000-square-foot AI-powered diagnostic lab through subsidiary PureLab, combining automation, robotics and real-time quality control. It can process more than 30 million samples annually.
                  - paragraph [ref=e875]:
                    - generic [ref=e876]: TechAfricaNews
                    - link "Department of Health – Abu Dhabi" [ref=e877] [cursor=pointer]:
                      - /url: /watchlist/doh-abu-dhabi
                    - link "PureHealth" [ref=e878] [cursor=pointer]:
                      - /url: /watchlist/purehealth
              - listitem [ref=e879]:
                - generic [ref=e880]:
                  - time [ref=e881]: 2025-12
                  - text: policy
                - generic [ref=e882]:
                  - link "UAE government AI utilisation reaches 97%" [ref=e883] [cursor=pointer]:
                    - /url: https://uppersetup.com/en/article/ai-business-in-the-uae-2026-unicorn-30-stargate-uae-difc-ai
                  - paragraph [ref=e884]: The article reports that, as of December 2025, AI utilisation across UAE government entities had reached 97%; it also says the developer pool exceeded 450,000 programmers.
                  - paragraph [ref=e885]:
                    - generic [ref=e886]: UPPERSETUP
              - listitem [ref=e887]:
                - generic [ref=e888]:
                  - time [ref=e889]: 2025-12
                  - text: space
                - generic [ref=e890]:
                  - link "XPANCEO and MBRSC conduct smart contact lens ground testing" [ref=e891] [cursor=pointer]:
                    - /url: https://en.wikipedia.org/wiki/Xpanceo
                  - paragraph [ref=e892]: XPANCEO conducted ground testing of an augmented-reality smart contact lens with the Mohammed Bin Rashid Space Centre; possible in-orbit testing was also noted.
                  - paragraph [ref=e893]:
                    - generic [ref=e894]: Wikipedia
                    - link "XPANCEO" [ref=e895] [cursor=pointer]:
                      - /url: /watchlist/xpanceo
              - listitem [ref=e896]:
                - generic [ref=e897]:
                  - time [ref=e898]: 2025-11-20
                  - text: infrastructure
                - generic [ref=e899]:
                  - link "G42 receives U.S. approval for advanced AI chip exports" [ref=e900] [cursor=pointer]:
                    - /url: https://gulfnews.com/business/economy/g42-gets-us-approval-for-advanced-ai-chip-exports-1.500353606
                  - paragraph [ref=e901]: The U.S. approved G42 to receive AI-chip computing capacity equivalent to 35,000 Nvidia GB300 processors, subject to security and reporting requirements.
                  - paragraph [ref=e902]:
                    - generic [ref=e903]: Gulf News
                    - link "G42" [ref=e904] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - generic [ref=e905]: · +1 corroborating report
              - listitem [ref=e906]:
                - generic [ref=e907]:
                  - time [ref=e908]: 2025-11-20
                  - text: infrastructure
                - generic [ref=e909]:
                  - link "G42’s Stargate UAE forms part of the planned 5-gigawatt UAE–U.S. AI Campus" [ref=e910] [cursor=pointer]:
                    - /url: https://gulfnews.com/business/economy/g42-gets-us-approval-for-advanced-ai-chip-exports-1.500353606
                  - paragraph [ref=e911]: The article described Stargate UAE as a 1-gigawatt AI compute cluster being built by G42 for OpenAI with Oracle, Cisco, NVIDIA and SoftBank, within the larger UAE–U.S. AI Campus.
                  - paragraph [ref=e912]:
                    - generic [ref=e913]: Gulf News
                    - link "G42" [ref=e914] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "M42" [ref=e915] [cursor=pointer]:
                      - /url: /watchlist/m42
              - listitem [ref=e916]:
                - generic [ref=e917]:
                  - time [ref=e918]: 2025-11
                  - text: infrastructure
                - generic [ref=e919]:
                  - generic [ref=e920]:
                    - text: G42 export approval for 35,000 GB300-equivalent units
                    - superscript [ref=e921]: source unverified
                  - paragraph [ref=e922]: The mission brief lists a G42 export approval covering 35,000 GB300-equivalent units in November 2025.
                  - paragraph [ref=e923]:
                    - generic [ref=e924]: Mission brief
                    - link "G42" [ref=e925] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - generic [ref=e926]: · +6 corroborating reports
              - listitem [ref=e927]:
                - generic [ref=e928]:
                  - time [ref=e929]: 2025-11
                  - text: infrastructure
                - generic [ref=e930]:
                  - link "G42 receives US approval for up to 35,000 advanced AI chips, enabling Stargate UAE deployment" [ref=e931] [cursor=pointer]:
                    - /url: https://www.cnbc.com/video/2025/11/21/exclusive-uaeas-g42-secures-nvidias-most-advanced-ai-chips.html
                  - paragraph [ref=e932]: The US approved G42 to buy up to 35,000 advanced AI chips. The approval enables deployment of Stargate UAE, a 1GW cluster G42 is building for OpenAI with Oracle, Cisco, NVIDIA and SoftBank Group.
                  - paragraph [ref=e933]:
                    - generic [ref=e934]: CNBC
                    - link "G42" [ref=e935] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "M42" [ref=e936] [cursor=pointer]:
                      - /url: /watchlist/m42
              - listitem [ref=e937]:
                - generic [ref=e938]:
                  - time [ref=e939]: 2025-10-19
                  - text: policy
                - generic [ref=e940]:
                  - link "UAE Council for Artificial Intelligence and Blockchain reviews national projects at GITEX Global 2025" [ref=e941] [cursor=pointer]:
                    - /url: https://www.wam.ae/en/article/bma7sp4-uae-council-for-artificial-intelligence-and
                  - paragraph [ref=e942]: Chaired by Omar Sultan Al Olama, the Council reviewed national AI and advanced-technology projects and explored collaboration and knowledge exchange with global platforms and companies at GITEX Global 2025.
                  - paragraph [ref=e943]:
                    - generic [ref=e944]: WAM
              - listitem [ref=e945]:
                - generic [ref=e946]:
                  - time [ref=e947]: 2025-09-09
                  - text: models
                - generic [ref=e948]:
                  - link "MBZUAI and G42 launch K2 Think reasoning model" [ref=e949] [cursor=pointer]:
                    - /url: https://mbzuai.ac.ae/news-events/news/mbzuai-g42-launch-k2-think-leading-open-source-system-advanced-ai-reasoning
                  - paragraph [ref=e950]: MBZUAI’s Institute of Foundation Models and G42 launched K2 Think, a 32-billion-parameter open-source reasoning system using supervised fine-tuning, verifiable-reward reinforcement learning, agentic planning, and test-time scaling.
                  - paragraph [ref=e951]:
                    - generic [ref=e952]: Mohamed bin Zayed University of Artificial Intelligence
                    - link "G42" [ref=e953] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Mohamed bin Zayed University of Artificial Intelligence" [ref=e954] [cursor=pointer]:
                      - /url: /watchlist/mbzuai
              - listitem [ref=e955]:
                - generic [ref=e956]:
                  - time [ref=e957]: 2025-09
                  - text: funding
                - generic [ref=e958]:
                  - link "Presight–Shorooq Fund I launches with $100 million target" [ref=e959] [cursor=pointer]:
                    - /url: https://www.analyticsinsight.ae/artificial-intelligence/top-ai-companies-and-startups-driving-uaes-tech-growth
                  - paragraph [ref=e960]: The fund, a collaboration between G42 and Shorooq Partners, targets frontier intelligence including sovereign AI cloud, agentic reasoning and physical AI. It evaluated more than 1,000 companies before making its first five investments.
                  - paragraph [ref=e961]:
                    - generic [ref=e962]: Analytics Insight
                    - link "G42" [ref=e963] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Presight AI Holding PLC" [ref=e964] [cursor=pointer]:
                      - /url: /watchlist/presight
              - listitem [ref=e965]:
                - generic [ref=e966]:
                  - time [ref=e967]: 2025-09
                  - text: partnership
                - generic [ref=e968]:
                  - link "XPANCEO and Intra-Ker launch intracorneal implant proof of concept" [ref=e969] [cursor=pointer]:
                    - /url: https://en.wikipedia.org/wiki/Xpanceo
                  - paragraph [ref=e970]: XPANCEO and Italian medtech company Intra-Ker began a joint proof of concept for an intracorneal implant.
                  - paragraph [ref=e971]:
                    - generic [ref=e972]: Wikipedia
                    - link "XPANCEO" [ref=e973] [cursor=pointer]:
                      - /url: /watchlist/xpanceo
              - listitem [ref=e974]:
                - generic [ref=e975]:
                  - time [ref=e976]: 2025-09
                  - text: talent
                - generic [ref=e977]:
                  - link "Hub71 announces its 17th cohort, including AI startups" [ref=e978] [cursor=pointer]:
                    - /url: https://www.mediaoffice.abudhabi/en/technology/hub71-welcomes-record-number-of-ai-startups-to-its-17th-cohort/
                  - paragraph [ref=e979]: Hub71’s 17th cohort included AI-related startups Harmonic Discovery, Planys Technologies and eVoost AI.
                  - paragraph [ref=e980]:
                    - generic [ref=e981]: Abu Dhabi Media Office
                    - link "Hub71" [ref=e982] [cursor=pointer]:
                      - /url: /watchlist/hub71
              - listitem [ref=e983]:
                - generic [ref=e984]:
                  - time [ref=e985]: 2025-07-08
                  - text: funding
                - generic [ref=e986]:
                  - link "XPANCEO raises $250 million Series A at a $1.35 billion valuation" [ref=e987] [cursor=pointer]:
                    - /url: https://www.xpanceo.com/newsroom/xpanceo-becomes-a-unicorn-with-250m-raise
                  - paragraph [ref=e988]: Dubai-based XPANCEO closed a $250 million Series A led by Opportunity Venture (Asia) to advance its AI-powered smart contact lens, which combines XR, health monitoring, night vision and zoom.
                  - paragraph [ref=e989]:
                    - generic [ref=e990]: XPANCEO
                    - link "XPANCEO" [ref=e991] [cursor=pointer]:
                      - /url: /watchlist/xpanceo
                    - generic [ref=e992]: · +2 corroborating reports
              - listitem [ref=e993]:
                - generic [ref=e994]:
                  - time [ref=e995]: 2025-05-28
                  - text: geopolitics
                - generic [ref=e996]:
                  - link "U.S.-UAE AI alliance draws investment and technology focus" [ref=e997] [cursor=pointer]:
                    - /url: https://www.cnbc.com/2025/05/28/the-us-ai-love-affair-with-the-uae-boils-down-to-dominance.html
                  - paragraph [ref=e998]: CNBC described aligned U.S. and UAE ambitions in AI, with investment pledges focused on technology and the UAE seeking advanced compute and talent for its sovereign AI goals.
                  - paragraph [ref=e999]:
                    - generic [ref=e1000]: CNBC
              - listitem [ref=e1001]:
                - generic [ref=e1002]:
                  - time [ref=e1003]: 2025-05-22
                  - text: infrastructure
                - generic [ref=e1004]:
                  - link "Stargate UAE announced as a 1GW AI compute cluster" [ref=e1005] [cursor=pointer]:
                    - /url: https://openai.com/index/introducing-stargate-uae/
                  - paragraph [ref=e1006]: OpenAI announced Stargate UAE with G42, Oracle, NVIDIA, Cisco and SoftBank. G42 will build the 1GW Abu Dhabi cluster; OpenAI and Oracle will operate it, with the first 200MW expected to go live in 2026.
                  - paragraph [ref=e1007]:
                    - generic [ref=e1008]: OpenAI
                    - link "G42" [ref=e1009] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "M42" [ref=e1010] [cursor=pointer]:
                      - /url: /watchlist/m42
                    - generic [ref=e1011]: · +1 corroborating report
              - listitem [ref=e1012]:
                - generic [ref=e1013]:
                  - time [ref=e1014]: 2025-05
                  - text: other
                - generic [ref=e1015]:
                  - link "M42 appoints Dimitris Moulavasilis as Group CEO" [ref=e1016] [cursor=pointer]:
                    - /url: https://m42.ae/media-resources/news/m42-appoints-dimitris-moulavasilis-as-group-ceo/
                  - paragraph [ref=e1017]: M42 appointed Dimitris Moulavasilis Group CEO in May 2025; Hasan Jasem Al Nowais stepped down as CEO and became a board member.
                  - paragraph [ref=e1018]:
                    - generic [ref=e1019]: M42
                    - link "M42" [ref=e1020] [cursor=pointer]:
                      - /url: /watchlist/m42
              - listitem [ref=e1021]:
                - generic [ref=e1022]:
                  - time [ref=e1023]: 2025-04-17
                  - text: policy
                - generic [ref=e1024]:
                  - link "Report raises human-rights concerns about AI surveillance in the UAE" [ref=e1025] [cursor=pointer]:
                    - /url: https://www.adhrb.org/2025/04/the-rise-of-ai-surveillance-in-the-uae-implications-for-human-rights/
                  - paragraph [ref=e1026]: The report discusses UAE AI surveillance deployment and concerns about privacy, freedom of expression, and potential governmental overreach.
                  - paragraph [ref=e1027]:
                    - generic [ref=e1028]: ADHRB
              - listitem [ref=e1029]:
                - generic [ref=e1030]:
                  - time [ref=e1031]: 2025-03-07
                  - text: funding
                - generic [ref=e1032]:
                  - link "Micropolis Robotics lists on NYSE American" [ref=e1033] [cursor=pointer]:
                    - /url: https://stockanalysis.com/stocks/mcrp/company/
                  - paragraph [ref=e1034]: Micropolis Robotics became publicly listed on NYSE American under ticker MCRP.
                  - paragraph [ref=e1035]:
                    - generic [ref=e1036]: Stock Analysis
                    - link "Micropolis Robotics" [ref=e1037] [cursor=pointer]:
                      - /url: /watchlist/micropolis
              - listitem [ref=e1038]:
                - generic [ref=e1039]:
                  - time [ref=e1040]: "2025"
                  - text: funding
                - generic [ref=e1041]:
                  - link "UAE AI startups secured $519 million in 2025" [ref=e1042] [cursor=pointer]:
                    - /url: https://www.founderconnects.com/blog/uae-investors-support-ai-startups
                  - paragraph [ref=e1043]: FounderConnects reports that UAE AI startups raised $519 million in 2025, accounting for 60% of regional AI funding and representing 267% growth from the previous year.
                  - paragraph [ref=e1044]:
                    - generic [ref=e1045]: FounderConnects
              - listitem [ref=e1046]:
                - generic [ref=e1047]:
                  - time [ref=e1048]: 2026-10-20
                  - text: event
                - generic [ref=e1049]:
                  - 'link "Dubai AI Festival 26–27 October at DWTC (Dubai AI Campus / DIFC): 100+ countries, 150+ speakers, 500 investors" [ref=e1050] [cursor=pointer]':
                    - /url: https://www.wam.ae/en/article/dubai-ai-festival-2026-october
                  - paragraph [ref=e1051]: Dubai AI Festival, organised with the Dubai AI Campus (DIFC), will run 26–27 Oct 2026 at Dubai World Trade Centre with participants from 100+ countries, 150+ speakers and 500 investors.
                  - paragraph [ref=e1052]:
                    - generic [ref=e1053]: WAM
                    - link "Dubai AI Campus" [ref=e1054] [cursor=pointer]:
                      - /url: /watchlist/dubai-ai-campus
                    - link "Dubai Centre for Artificial Intelligence" [ref=e1055] [cursor=pointer]:
                      - /url: /watchlist/dcai
              - listitem [ref=e1056]:
                - generic [ref=e1057]:
                  - time [ref=e1058]: 2026-10-19
                  - text: research
                - generic [ref=e1059]:
                  - link "TII researchers' plant-waste gel cuts irrigation water use by ~30%" [ref=e1060] [cursor=pointer]:
                    - /url: https://www.khaleejtimes.com/uae/tii-plant-waste-gel-irrigation-water-solar-panels
                  - paragraph [ref=e1061]: A TII team developed a gel from plant waste that reduces irrigation water use by about 30%; AI was used to identify molecules that protect solar panels.
                  - paragraph [ref=e1062]:
                    - generic [ref=e1063]: Khaleej Times
                    - link "Technology Innovation Institute" [ref=e1064] [cursor=pointer]:
                      - /url: /watchlist/tii
              - listitem [ref=e1065]:
                - generic [ref=e1066]:
                  - time [ref=e1067]: 2026-10-20
                  - text: policy
                - generic [ref=e1068]:
                  - link "G42 welcomes US approval for advanced AI chip exports (Peng Xiao, Khaldoon Al Mubarak)" [ref=e1069] [cursor=pointer]:
                    - /url: https://www.g42.ai/resources/news/us-approval-advanced-ai-chip-exports-2026
                  - paragraph [ref=e1070]: G42 statement on US approval for advanced AI chip exports, with quotes from CEO Peng Xiao and Khaldoon Al Mubarak; G42 also announced an Assurance Compute Framework (Talal Al Kaissi).
                  - paragraph [ref=e1071]:
                    - generic [ref=e1072]: G42
                    - link "G42" [ref=e1073] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Core42" [ref=e1074] [cursor=pointer]:
                      - /url: /watchlist/core42
              - listitem [ref=e1075]:
                - generic [ref=e1076]:
                  - time [ref=e1077]: 2026-10-14
                  - text: policy
                - generic [ref=e1078]:
                  - 'link "Federal AI agent control tower and the livelihood ''red line'': no AI agent may decide on a person''s livelihood" [ref=e1079] [cursor=pointer]':
                    - /url: https://www.khaleejtimes.com/uae/ai-minister-agents-jobs-livelihood-technology-control
                  - paragraph [ref=e1080]: "Omar Sultan Al Olama: no AI agent will be allowed to make decisions affecting a person's livelihood; ~50% of federal services via agents, ~30% ruled out; every agent plugs into a government control tower with continuous audits (also Trends MENA, Emirates 24|7)."
                  - paragraph [ref=e1081]:
                    - generic [ref=e1082]: Khaleej Times
                    - link "Artificial Intelligence and Data Authority" [ref=e1083] [cursor=pointer]:
                      - /url: /watchlist/ai-data-authority
              - listitem [ref=e1084]:
                - generic [ref=e1085]:
                  - time [ref=e1086]: 2026-10-06
                  - text: event
                - generic [ref=e1087]:
                  - 'link "Ai Everything Abu Dhabi (ADNEC, 6–7 Oct): UAE training ~80,000 government employees as AI ''super users''; Core42 on sovereign-AI export" [ref=e1088] [cursor=pointer]':
                    - /url: https://www.computerweekly.com/news/ai-everything-abu-dhabi-2026-core42-sovereign-ai
                  - paragraph [ref=e1089]: UAE is training ~80,000 government employees as AI super users; Al Olama on one-person companies 'plus agents'; Talal Al Kaissi (Core42) on the UAE as an 'open lab' and sovereign-AI export (Computer Weekly, 7 Oct).
                  - paragraph [ref=e1090]:
                    - generic [ref=e1091]: Ai Everything Abu Dhabi
                    - link "Core42" [ref=e1092] [cursor=pointer]:
                      - /url: /watchlist/core42
                    - link "Artificial Intelligence and Data Authority" [ref=e1093] [cursor=pointer]:
                      - /url: /watchlist/ai-data-authority
                    - link "Department of Government Enablement (DGE), Abu Dhabi" [ref=e1094] [cursor=pointer]:
                      - /url: /watchlist/dge
              - listitem [ref=e1095]:
                - generic [ref=e1096]:
                  - time [ref=e1097]: 2026-10-08
                  - text: talent
                - generic [ref=e1098]:
                  - link "Abu Dhabi AiNative training week (week of 8 Oct 2026)" [ref=e1099] [cursor=pointer]:
                    - /url: https://www.mediaoffice.abudhabi/en/ainative-training-week-2026
                  - paragraph [ref=e1100]: Government AI-native training week in Abu Dhabi.
                  - paragraph [ref=e1101]:
                    - generic [ref=e1102]: Abu Dhabi Media Office
                    - link "Department of Government Enablement (DGE), Abu Dhabi" [ref=e1103] [cursor=pointer]:
                      - /url: /watchlist/dge
              - listitem [ref=e1104]:
                - generic [ref=e1105]:
                  - time [ref=e1106]: 2026-09-03
                  - text: models
                - generic [ref=e1107]:
                  - 'link "K2 Horizon: IFM releases a connected fleet of six fully open models" [ref=e1108] [cursor=pointer]':
                    - /url: https://news.ycombinator.com/item?id=49551760
                  - paragraph [ref=e1109]: "Institute of Foundation Models releases K2 Horizon (fully open: corpus, recipe, scripts, checkpoints); HN thread 335 points / 131 comments."
                  - paragraph [ref=e1110]:
                    - generic [ref=e1111]: IFM / MBZUAI
                    - link "Institute of Foundation Models (IFM), Mohamed bin Zayed University of Artificial Intelligence" [ref=e1112] [cursor=pointer]:
                      - /url: /watchlist/ifm
                    - link "Mohamed bin Zayed University of Artificial Intelligence" [ref=e1113] [cursor=pointer]:
                      - /url: /watchlist/mbzuai
              - listitem [ref=e1114]:
                - generic [ref=e1115]:
                  - time [ref=e1116]: 2026-09-02
                  - text: investment
                - generic [ref=e1117]:
                  - link "G42 explores multibillion-dollar raise (reported, unconfirmed)" [ref=e1118] [cursor=pointer]:
                    - /url: https://www.bloomberg.com/news/articles/2026-09-02/g42-explores-multibillion-raise
                  - paragraph [ref=e1119]: Bloomberg 2 Sep 2026 — exploratory raise; 4–5 Sep — possible majority stake to US companies tied to chip-access rules expiring ~Apr 2027. Reported, unconfirmed; no deal closed or denied as of 21 Oct 2026.
                  - paragraph [ref=e1120]:
                    - generic [ref=e1121]: Bloomberg
                    - link "G42" [ref=e1122] [cursor=pointer]:
                      - /url: /watchlist/g42
              - listitem [ref=e1123]:
                - generic [ref=e1124]:
                  - time [ref=e1125]: 2026-07-10
                  - text: policy
                - generic [ref=e1126]:
                  - link "US BIS reclassifies UAE to EAR Country Group A:5 (license-free advanced computing for UAE Government and approved entities)" [ref=e1127] [cursor=pointer]:
                    - /url: https://www.bis.gov/press-release/uae-country-group-a5-2026
                  - paragraph [ref=e1128]: Removes the UAE from D:3/D:4; advanced computing items license-free for the UAE Government and approved entities.
                  - paragraph [ref=e1129]:
                    - generic [ref=e1130]: US BIS
                    - link "G42" [ref=e1131] [cursor=pointer]:
                      - /url: /watchlist/g42
                    - link "Core42" [ref=e1132] [cursor=pointer]:
                      - /url: /watchlist/core42
                    - link "Khazna Data Centers" [ref=e1133] [cursor=pointer]:
                      - /url: /watchlist/khazna
              - listitem [ref=e1134]:
                - generic [ref=e1135]:
                  - time [ref=e1136]: 2026-09-13
                  - text: survey
                - generic [ref=e1137]:
                  - 'link "Cooper Fitch ''AI & the Future of Talent 2027'': 14% expect AI-related role reductions in 12–24 months (down from 31%)" [ref=e1138] [cursor=pointer]':
                    - /url: https://www.khaleejtimes.com/jobs/cooper-fitch-ai-future-of-talent-2027
                  - paragraph [ref=e1139]: 57% have no formal or only informal AI governance (an Instagram repost states 81% no formal framework / 10% fully established — discrepancy flagged, both cited).
                  - paragraph [ref=e1140]:
                    - generic [ref=e1141]: Khaleej Times
              - listitem [ref=e1142]:
                - generic [ref=e1143]:
                  - time [ref=e1144]: 2026-06-23
                  - text: leadership
                - generic [ref=e1145]:
                  - link "H.E. Dr Thani bin Ahmed Al Zeyoudi, Minister of Foreign Trade, named AIREV Chairman" [ref=e1146] [cursor=pointer]:
                    - /url: https://www.wam.ae/en/article/airev-chairman-al-zeyoudi-2026-06-23
                  - paragraph [ref=e1147]: WAM 23 Jun 2026.
                  - paragraph [ref=e1148]:
                    - generic [ref=e1149]: WAM
                    - link "AIREV" [ref=e1150] [cursor=pointer]:
                      - /url: /watchlist/airev
              - listitem [ref=e1151]:
                - generic [ref=e1152]:
                  - time [ref=e1153]: 2025-12-18
                  - text: partnership
                - generic [ref=e1154]:
                  - link "Intel and AIREV launch fully on-device AI-PC agents (Intel Core Ultra)" [ref=e1155] [cursor=pointer]:
                    - /url: https://gecnewswire.com/airev-intel-on-device-ai-agents
                  - paragraph [ref=e1156]: On-device agents with Intel Core Ultra; Greg Ernst / Taha Khalifa quotes.
                  - paragraph [ref=e1157]:
                    - generic [ref=e1158]: GEC Newswire
                    - link "AIREV" [ref=e1159] [cursor=pointer]:
                      - /url: /watchlist/airev
              - listitem [ref=e1160]:
                - generic [ref=e1161]:
                  - time [ref=e1162]: 2025-10-14
                  - text: partnership
                - generic [ref=e1163]:
                  - link "AIREV and Intel sign MoU at GITEX GLOBAL 2025" [ref=e1164] [cursor=pointer]:
                    - /url: https://www.middleeastainews.com/p/airev-intel-mou-gitex-2025
                  - paragraph [ref=e1165]: MoU signed at GITEX GLOBAL 2025 (Oct 2025, DWTC).
                  - paragraph [ref=e1166]:
                    - generic [ref=e1167]: Middle East AI News
                    - link "AIREV" [ref=e1168] [cursor=pointer]:
                      - /url: /watchlist/airev
              - listitem [ref=e1169]:
                - generic [ref=e1170]:
                  - time [ref=e1171]: 2025-06-25
                  - text: partnership
                - generic [ref=e1172]:
                  - link "AIREV partners with Tenstorrent to advance UAE-developed agentic AI for global deployment" [ref=e1173] [cursor=pointer]:
                    - /url: https://tenstorrent.com/vision/airev-partners-with-tenstorrent
                  - paragraph [ref=e1174]: Tenstorrent agentic-AI stack partnership.
                  - paragraph [ref=e1175]:
                    - generic [ref=e1176]: Tenstorrent
                    - link "AIREV" [ref=e1177] [cursor=pointer]:
                      - /url: /watchlist/airev
        - contentinfo [ref=e1178]:
          - generic [ref=e1179]:
            - generic [ref=e1180]:
              - strong [ref=e1181]: Concept Demonstration — not an official government system.
              - text: Public sources only · no government logo or endorsement implied.
            - generic [ref=e1182]:
              - text: Data namespace uae_cc_v1 · as of 2026-10-21 ·
              - link "Methodology & limitations" [ref=e1183] [cursor=pointer]:
                - /url: /methodology
            - generic [ref=e1184]: "Intelligence engine: OnDemand (AIREV)"
            - generic [ref=e1187]:
              - text: v1.0.0 · local · last updated
              - time [ref=e1188]: 2026-10-21 10:29 UTC
  - region "Notifications alt+T"
  - alert [ref=e1189]
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