# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: axe-sweep.spec.ts >> axe sweep @1440x900 >> /settings @1440x900: no serious/critical (WCAG 2.2 AA)
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
          - generic [ref=e109]:
            - generic [ref=e110]:
              - heading "Settings" [level=1] [ref=e111]
              - paragraph [ref=e112]: ONDEMAND SETTINGS — credentials stay in this browser (localStorage x-ondemand-key, forwarded through /api/ondemand/*). Every AI call goes through the OnDemand API via the same-origin proxy.
            - button "Copy link to this page" [ref=e114]
          - generic [ref=e118]:
            - generic [ref=e119]:
              - generic [ref=e120]:
                - generic [ref=e122]:
                  - generic [ref=e123]: UAE AI Command Centre
                  - generic [ref=e124]: Concept demonstration
                - generic [ref=e125]: UAE AI National Intelligence Command Centre — concept demonstration, not an official government system
              - generic [ref=e126]: "Intelligence engine: OnDemand (AIREV)"
              - paragraph [ref=e128]: ONDEMAND SETTINGS · Concept demonstration
            - generic [ref=e129]:
              - generic [ref=e130]:
                - heading "OnDemand connection" [level=2] [ref=e131]
                - paragraph [ref=e132]:
                  - text: The server proxy
                  - code [ref=e133]: /api/ondemand/*
                  - text: authenticates to
                  - code [ref=e134]: api.on-demand.io
                  - text: with the server-side key (server env only, never shipped to the browser). A pasted key is forwarded as
                  - code [ref=e135]: x-ondemand-key
                  - text: and takes precedence. Nothing is logged.
              - generic [ref=e136]:
                - generic [ref=e137]:
                  - generic [ref=e138]: OnDemand apikey (optional override)
                  - textbox "OnDemand apikey (optional override)" [ref=e139]: lRezcv0rPOoxRDFCenyAp9M6XARbxzzv
                  - paragraph [ref=e140]: Chat already works with the server-side key. Paste your own key only if you want requests billed to your account; it stays in this browser.
                - button "Test connection" [ref=e142]
                - generic [ref=e143]:
                  - generic [ref=e144]: externalUserId
                  - textbox "externalUserId" [ref=e145]: INV-001
                  - paragraph [ref=e146]: Groups your chat sessions on OnDemand.
                - generic [ref=e147]:
                  - paragraph [ref=e148]: "Model (fixed): GPT-5.6 Luna"
                  - paragraph [ref=e149]:
                    - text: endpointId
                    - code [ref=e150]: predefined-gpt-5.6-luna
                    - text: · reasoningMode
                    - code [ref=e151]: medium
                    - text: · responseMode
                    - code [ref=e152]: stream
                    - text: . The bridge sends exactly this configuration on every query — there is no model fallback chain and no per-user override.
            - generic [ref=e153]:
              - generic [ref=e154]:
                - heading "Plugins used in chat" [level=2] [ref=e155]
                - paragraph [ref=e156]:
                  - text: The selected OnDemand plugins are sent as
                  - code [ref=e157]: pluginIds
                  - text: on the session and on every query.
                  - code [ref=e158]: Perplexity · plugin-1722260873
                  - text: is pinned and always on; the rest are per-session toggles. If a plugin fails upstream the chat shows a red error card — no other plugin is ever substituted.
              - region "Plugins" [ref=e160]:
                - heading "Plugins (40 available · 1 on this turn)" [level=3] [ref=e161]
                - paragraph [ref=e165]: live directory · 40 plugins · selection applies per turn
                - searchbox "Search all plugins" [ref=e166]
                - paragraph [ref=e167]: Showing 40 of 186
                - list [ref=e168]:
                  - listitem [ref=e169]:
                    - generic [ref=e170]:
                      - img "Perplexity" [ref=e171]
                      - generic [ref=e172]:
                        - paragraph [ref=e173]:
                          - generic [ref=e174]: Perplexity
                          - generic [ref=e175] [cursor=pointer]: general
                          - generic [ref=e176] [cursor=pointer]: locked on
                          - 'generic "Perplexity: selected" [ref=e179] [cursor=pointer]': selected
                        - paragraph [ref=e180]: plugin-1722260873
                        - paragraph [ref=e181]: Live web research with cited sources — pinned, always on.
                    - switch "Perplexity (locked on)" [checked] [disabled] [ref=e182]
                  - listitem [ref=e183]:
                    - generic [ref=e184]:
                      - img "Internet" [ref=e185]
                      - generic [ref=e186]:
                        - paragraph [ref=e187]:
                          - generic [ref=e188]: Internet
                          - generic [ref=e189] [cursor=pointer]: research
                          - 'generic "Internet: connected" [ref=e190] [cursor=pointer]': connected
                        - paragraph [ref=e191]: plugin-1713924030
                        - paragraph [ref=e192]: "General web search: weather, news, current events."
                    - switch "Use Internet this turn" [ref=e193] [cursor=pointer]
                  - listitem [ref=e194]:
                    - generic [ref=e195]:
                      - img "GPT Search" [ref=e196]
                      - generic [ref=e197]:
                        - paragraph [ref=e198]:
                          - generic [ref=e199]: GPT Search
                          - generic [ref=e200] [cursor=pointer]: research
                          - 'generic "GPT Search: connected" [ref=e201] [cursor=pointer]': connected
                        - paragraph [ref=e202]: plugin-1741871229
                        - paragraph [ref=e203]: GPT-4o web-grounded research and verification.
                    - switch "Use GPT Search this turn" [ref=e204] [cursor=pointer]
                  - listitem [ref=e205]:
                    - generic [ref=e206]:
                      - img "X Search Agent" [ref=e207]
                      - generic [ref=e208]:
                        - paragraph [ref=e209]:
                          - generic [ref=e210]: X Search Agent
                          - generic [ref=e211] [cursor=pointer]: general
                          - 'generic "X Search Agent: connected" [ref=e212] [cursor=pointer]': connected
                        - paragraph [ref=e213]: plugin-1751872652
                        - paragraph [ref=e214]: Real-time X (Twitter) search by date range, country and handle.
                    - switch "Use X Search Agent this turn" [ref=e215] [cursor=pointer]
                  - listitem [ref=e216]:
                    - generic [ref=e217]:
                      - generic [aria-hidden] [ref=e218]: X
                      - generic [ref=e219]:
                        - paragraph [ref=e220]:
                          - generic [ref=e221]: X
                          - generic [ref=e222] [cursor=pointer]: general
                          - 'generic "X: suggested" [ref=e223] [cursor=pointer]': suggested
                        - paragraph [ref=e224]: plugin-1785777296
                        - paragraph [ref=e225]: "X MCP server: post, search, manage the account."
                    - switch "Use X this turn" [ref=e226] [cursor=pointer]
                  - listitem [ref=e227]:
                    - generic [ref=e228]:
                      - generic [aria-hidden] [ref=e229]: T
                      - generic [ref=e230]:
                        - paragraph [ref=e231]:
                          - generic [ref=e232]: Tiktok
                          - generic [ref=e233] [cursor=pointer]: general
                          - 'generic "Tiktok: connected" [ref=e234] [cursor=pointer]': connected
                        - paragraph [ref=e235]: plugin-1716372717
                        - paragraph [ref=e236]: TikTok scraping for platform analysis.
                    - switch "Use Tiktok this turn" [ref=e237] [cursor=pointer]
                  - listitem [ref=e238]:
                    - generic [ref=e239]:
                      - generic [aria-hidden] [ref=e240]: I
                      - generic [ref=e241]:
                        - paragraph [ref=e242]:
                          - generic [ref=e243]: Instagram User Info Extracter
                          - generic [ref=e244] [cursor=pointer]: general
                          - 'generic "Instagram User Info Extracter: connected" [ref=e245] [cursor=pointer]': connected
                        - paragraph [ref=e246]: plugin-1716164040
                        - paragraph [ref=e247]: Instagram profile information by username.
                    - switch "Use Instagram User Info Extracter this turn" [ref=e248] [cursor=pointer]
                  - listitem [ref=e249]:
                    - generic [ref=e250]:
                      - generic [aria-hidden] [ref=e251]: I
                      - generic [ref=e252]:
                        - paragraph [ref=e253]:
                          - generic [ref=e254]: Instagram
                          - generic [ref=e255] [cursor=pointer]: general
                          - 'generic "Instagram: suggested" [ref=e256] [cursor=pointer]': suggested
                        - paragraph [ref=e257]: plugin-1785987361
                        - paragraph [ref=e258]: Instagram Business account management and insights.
                    - switch "Use Instagram this turn" [ref=e259] [cursor=pointer]
                  - listitem [ref=e260]:
                    - generic [ref=e261]:
                      - generic [aria-hidden] [ref=e262]: "Y"
                      - generic [ref=e263]:
                        - paragraph [ref=e264]:
                          - generic [ref=e265]: YouTube Data API v3 - Captions
                          - generic [ref=e266] [cursor=pointer]: general
                          - 'generic "YouTube Data API v3 - Captions: suggested" [ref=e267] [cursor=pointer]': suggested
                        - paragraph [ref=e268]: plugin-1784356219
                        - paragraph [ref=e269]: YouTube caption tracks and transcripts.
                    - switch "Use YouTube Data API v3 - Captions this turn" [ref=e270] [cursor=pointer]
                  - listitem [ref=e271]:
                    - generic [ref=e272]:
                      - generic [aria-hidden] [ref=e273]: R
                      - generic [ref=e274]:
                        - paragraph [ref=e275]:
                          - generic [ref=e276]: Reddit Posts
                          - generic [ref=e277] [cursor=pointer]: marketing
                          - 'generic "Reddit Posts: connected" [ref=e278] [cursor=pointer]': connected
                        - paragraph [ref=e279]: plugin-1748003575
                        - paragraph [ref=e280]: Subreddit posts and comments for community / retail-investor sentiment.
                    - switch "Use Reddit Posts this turn" [ref=e281] [cursor=pointer]
                  - listitem [ref=e282]:
                    - generic [ref=e283]:
                      - img "Linkedin Search" [ref=e284]
                      - generic [ref=e285]:
                        - paragraph [ref=e286]:
                          - generic [ref=e287]: Linkedin Search
                          - generic [ref=e288] [cursor=pointer]: research
                          - 'generic "Linkedin Search: connected" [ref=e289] [cursor=pointer]': connected
                        - paragraph [ref=e290]: plugin-1718116202
                        - paragraph [ref=e291]: LinkedIn profile lookup (its tool returned 404 in the 2026-10-09 verification run).
                    - switch "Use Linkedin Search this turn" [ref=e292] [cursor=pointer]
                  - listitem [ref=e293]:
                    - generic [ref=e294]:
                      - img "US Stock Fundamental Analysis" [ref=e295]
                      - generic [ref=e296]:
                        - paragraph [ref=e297]:
                          - generic [ref=e298]: US Stock Fundamental Analysis
                          - generic [ref=e299] [cursor=pointer]: general
                          - 'generic "US Stock Fundamental Analysis: connected" [ref=e300] [cursor=pointer]': connected
                        - paragraph [ref=e301]: plugin-1716429542
                        - paragraph [ref=e302]: Real-time prices, movers, institutional holdings, balance sheets for US stocks.
                    - switch "Use US Stock Fundamental Analysis this turn" [ref=e303] [cursor=pointer]
                  - listitem [ref=e304]:
                    - generic [ref=e305]:
                      - img "US Stock Technical Analysis" [ref=e306]
                      - generic [ref=e307]:
                        - paragraph [ref=e308]:
                          - generic [ref=e309]: US Stock Technical Analysis
                          - generic [ref=e310] [cursor=pointer]: finance
                          - 'generic "US Stock Technical Analysis: connected" [ref=e311] [cursor=pointer]': connected
                        - paragraph [ref=e312]: plugin-1716434059
                        - paragraph [ref=e313]: RSI, MACD and moving averages for US stocks.
                    - switch "Use US Stock Technical Analysis this turn" [ref=e314] [cursor=pointer]
                  - listitem [ref=e315]:
                    - generic [ref=e316]:
                      - img "Quarterly financial report data tool" [ref=e317]
                      - generic [ref=e318]:
                        - paragraph [ref=e319]:
                          - generic [ref=e320]: Quarterly financial report data tool
                          - generic [ref=e321] [cursor=pointer]: data
                          - 'generic "Quarterly financial report data tool: suggested" [ref=e322] [cursor=pointer]': suggested
                        - paragraph [ref=e323]: plugin-1770369833
                        - paragraph [ref=e324]: Knowledge agent with quarterly financial data.
                    - switch "Use Quarterly financial report data tool this turn" [ref=e325] [cursor=pointer]
                  - listitem [ref=e326]:
                    - generic [ref=e327]:
                      - generic [aria-hidden] [ref=e328]: A
                      - generic [ref=e329]:
                        - paragraph [ref=e330]:
                          - generic [ref=e331]: Abu Dhabi Business RAG
                          - generic [ref=e332] [cursor=pointer]: general
                          - 'generic "Abu Dhabi Business RAG: connected" [ref=e333] [cursor=pointer]': connected
                        - paragraph [ref=e334]: plugin-1723063792
                        - paragraph [ref=e335]: The Abu Dhabi Business RAG Agent provides essential insights into starting and operating a business in Abu Dhabi. It covers business registration, regulations, and the role of Abu Dhabi Global Market (ADGM) in supporting sustainable finance. This agent is a helpful guide for entrepreneurs and professionals navigating the business landscape in Abu Dhabi.
                    - switch "Use Abu Dhabi Business RAG this turn" [ref=e336] [cursor=pointer]
                  - listitem [ref=e337]:
                    - generic [ref=e338]:
                      - img "AI Budget Insight Agent" [ref=e339]
                      - generic [ref=e340]:
                        - paragraph [ref=e341]:
                          - generic [ref=e342]: AI Budget Insight Agent
                          - generic [ref=e343] [cursor=pointer]: finance
                          - 'generic "AI Budget Insight Agent: connected" [ref=e344] [cursor=pointer]': connected
                        - paragraph [ref=e345]: plugin-1749230481
                        - paragraph [ref=e346]: An agent that assist APCO’s proposal teams by providing data-driven budget recommendations for client proposals, based on historical project data, market trends, and contextual inputs — with the goal of improving pricing accuracy, consistency, and competitiveness.
                    - switch "Use AI Budget Insight Agent this turn" [ref=e347] [cursor=pointer]
                  - listitem [ref=e348]:
                    - generic [ref=e349]:
                      - img "AI Search" [ref=e350]
                      - generic [ref=e351]:
                        - paragraph [ref=e352]:
                          - generic [ref=e353]: AI Search
                          - generic [ref=e354] [cursor=pointer]: general
                          - 'generic "AI Search: connected" [ref=e355] [cursor=pointer]': connected
                        - paragraph [ref=e356]: plugin-1740745780
                        - paragraph [ref=e357]: An agent that utilizes the Tavily API to fetch and present search results in a clear format, helping users navigate through data effortlessly.
                    - switch "Use AI Search this turn" [ref=e358] [cursor=pointer]
                  - listitem [ref=e359]:
                    - generic [ref=e360]:
                      - generic [aria-hidden] [ref=e361]: A
                      - generic [ref=e362]:
                        - paragraph [ref=e363]:
                          - generic [ref=e364]: Air Quality Tool
                          - generic [ref=e365] [cursor=pointer]: general
                          - 'generic "Air Quality Tool: connected" [ref=e366] [cursor=pointer]': connected
                        - paragraph [ref=e367]: plugin-1737061205
                        - paragraph [ref=e368]: An agent that offers air quality information for a specific location
                    - switch "Use Air Quality Tool this turn" [ref=e369] [cursor=pointer]
                  - listitem [ref=e370]:
                    - generic [ref=e371]:
                      - generic [aria-hidden] [ref=e372]: A
                      - generic [ref=e373]:
                        - paragraph [ref=e374]:
                          - generic [ref=e375]: Appeal Document Generation Tool
                          - generic [ref=e376] [cursor=pointer]: data
                          - 'generic "Appeal Document Generation Tool: connected" [ref=e377] [cursor=pointer]': connected
                        - paragraph [ref=e378]: plugin-1760089621
                        - paragraph [ref=e379]: Tool for creating F1 appeals using a templated word document (docx). The document is produced as a URL for download.
                    - switch "Use Appeal Document Generation Tool this turn" [ref=e380] [cursor=pointer]
                  - listitem [ref=e381]:
                    - generic [ref=e382]:
                      - generic [aria-hidden] [ref=e383]: A
                      - generic [ref=e384]:
                        - paragraph [ref=e385]:
                          - generic [ref=e386]: Article-Generator
                          - generic [ref=e387] [cursor=pointer]: marketing
                          - 'generic "Article-Generator: connected" [ref=e388] [cursor=pointer]': connected
                        - paragraph [ref=e389]: plugin-1731682618
                        - paragraph [ref=e390]: This generates article based on keywords.
                    - switch "Use Article-Generator this turn" [ref=e391] [cursor=pointer]
                  - listitem [ref=e392]:
                    - generic [ref=e393]:
                      - generic [aria-hidden] [ref=e394]: A
                      - generic [ref=e395]:
                        - paragraph [ref=e396]:
                          - generic [ref=e397]: AskMira
                          - generic [ref=e398] [cursor=pointer]: finance
                          - 'generic "AskMira: connected" [ref=e399] [cursor=pointer]': connected
                        - paragraph [ref=e400]: plugin-1747633703
                        - paragraph [ref=e401]: An agent that provides detailed insights into the Emirates Annual Report Financial Summary, helping users understand key financial metrics and trends.
                    - switch "Use AskMira this turn" [ref=e402] [cursor=pointer]
                  - listitem [ref=e403]:
                    - generic [ref=e404]:
                      - generic [aria-hidden] [ref=e405]: B
                      - generic [ref=e406]:
                        - paragraph [ref=e407]:
                          - generic [ref=e408]: Billboard Charts
                          - generic [ref=e409] [cursor=pointer]: general
                          - 'generic "Billboard Charts: connected" [ref=e410] [cursor=pointer]': connected
                        - paragraph [ref=e411]: plugin-1717479423
                        - paragraph [ref=e412]: Displays artists and their songs based on their Billboard ranking, keeping users updated on popular music trends and rankings.
                    - switch "Use Billboard Charts this turn" [ref=e413] [cursor=pointer]
                  - listitem [ref=e414]:
                    - generic [ref=e415]:
                      - generic [aria-hidden] [ref=e416]: B
                      - generic [ref=e417]:
                        - paragraph [ref=e418]:
                          - generic [ref=e419]: Blender MCP
                          - generic [ref=e420] [cursor=pointer]: general
                          - 'generic "Blender MCP: connected" [ref=e421] [cursor=pointer]': connected
                        - paragraph [ref=e422]: plugin-1785414914
                        - paragraph [ref=e423]: It enables users to create, edit, animate, simulate, and render high-quality 3D content for games, films, architecture, product design, and visual effects.
                    - switch "Use Blender MCP this turn" [ref=e424] [cursor=pointer]
                  - listitem [ref=e425]:
                    - generic [ref=e426]:
                      - generic [aria-hidden] [ref=e427]: B
                      - generic [ref=e428]:
                        - paragraph [ref=e429]:
                          - generic [ref=e430]: Bnfits Nearby Benefits
                          - generic [ref=e431] [cursor=pointer]: data
                          - 'generic "Bnfits Nearby Benefits: connected" [ref=e432] [cursor=pointer]': connected
                        - paragraph [ref=e433]: plugin-1774869628
                        - paragraph [ref=e434]: "Tool Name: Get Nearby Benefits What it does: Finds the best deals, discounts, and offers available near your current location — across categories like food, hotels, flights, fuel, groceries, fashion, jewellery, and more. The agent scans up to 100 benefits around you and surfaces the most relevant ones based on where you are. What the agent needs from you: Your location (latitude & longitude — this is picked up automatically if location access is enabled) Your user ID (handled automatically in the background) Optionally, a category if you want deals filtered to a specific area — e.g. \"Show me food deals near me\" or \"Any fuel offers nearby?\" What the agent delivers: A list of nearby benefit offers with deal details, brand names, and how far they are from you Offers grouped by category so you can browse easily Redemption info — promo codes, links, or instructions on how to claim the deal Validity dates so you know what's still active Example things you can ask: \"What benefits are available near me?\" \"Any food deals close by?\" \"Show me hotel offers in my area\" \"What fuel discounts can I use right now?\""
                    - switch "Use Bnfits Nearby Benefits this turn" [ref=e435] [cursor=pointer]
                  - listitem [ref=e436]:
                    - generic [ref=e437]:
                      - generic [aria-hidden] [ref=e438]: C
                      - generic [ref=e439]:
                        - paragraph [ref=e440]:
                          - generic [ref=e441]: copilot-faq-bot
                          - generic [ref=e442] [cursor=pointer]: general
                          - 'generic "copilot-faq-bot: connected" [ref=e443] [cursor=pointer]': connected
                        - paragraph [ref=e444]: plugin-1788455571
                        - paragraph [ref=e445]: Calls Copilot agent OnDemand FAQ Bot and returns its reply.
                    - switch "Use copilot-faq-bot this turn" [ref=e446] [cursor=pointer]
                  - listitem [ref=e447]:
                    - generic [ref=e448]:
                      - generic [aria-hidden] [ref=e449]: C
                      - generic [ref=e450]:
                        - paragraph [ref=e451]:
                          - generic [ref=e452]: copilot-resume-tester
                          - generic [ref=e453] [cursor=pointer]: general
                          - 'generic "copilot-resume-tester: connected" [ref=e454] [cursor=pointer]': connected
                        - paragraph [ref=e455]: plugin-1788452449
                        - paragraph [ref=e456]: Sends user messages to Copilot agent OnDemand Resume Tester and returns replies over Native app conversation API.
                    - switch "Use copilot-resume-tester this turn" [ref=e457] [cursor=pointer]
                  - listitem [ref=e458]:
                    - generic [ref=e459]:
                      - generic [aria-hidden] [ref=e460]: C
                      - generic [ref=e461]:
                        - paragraph [ref=e462]:
                          - generic [ref=e463]: Crop Suggestion
                          - generic [ref=e464] [cursor=pointer]: general
                          - 'generic "Crop Suggestion: connected" [ref=e465] [cursor=pointer]': connected
                        - paragraph [ref=e466]: plugin-1717467138
                        - paragraph [ref=e467]: This agent will suggest the optimal crop based on data analysis. It takes into account specific contents of nitrogen, phosphorus, potassium, pH level, humidity, and other environmental factors. This agent also provides detailed recommendations for crop selection, tailored to the unique conditions of your soil and climate, ensuring the best possible yield and sustainability.
                    - switch "Use Crop Suggestion this turn" [ref=e468] [cursor=pointer]
                  - listitem [ref=e469]:
                    - generic [ref=e470]:
                      - generic [aria-hidden] [ref=e471]: C
                      - generic [ref=e472]:
                        - paragraph [ref=e473]:
                          - generic [ref=e474]: CropHealthGuard
                          - generic [ref=e475] [cursor=pointer]: general
                          - 'generic "CropHealthGuard: connected" [ref=e476] [cursor=pointer]': connected
                        - paragraph [ref=e477]: plugin-1726273822
                        - paragraph [ref=e478]: CropHealthGuard is an expert agent designed to help farmers and gardeners maintain healthy crops by providing advice on pest control, disease prevention, and treatment of common crop issues. It offers real-time solutions to protect crops from potential damage and improve yield.
                    - switch "Use CropHealthGuard this turn" [ref=e479] [cursor=pointer]
                  - listitem [ref=e480]:
                    - generic [ref=e481]:
                      - generic [aria-hidden] [ref=e482]: C
                      - generic [ref=e483]:
                        - paragraph [ref=e484]:
                          - generic [ref=e485]: Crypto Analytics
                          - generic [ref=e486] [cursor=pointer]: general
                          - 'generic "Crypto Analytics: connected" [ref=e487] [cursor=pointer]': connected
                        - paragraph [ref=e488]: plugin-1715935086
                        - paragraph [ref=e489]: Retrieves latest price and market data for cryptocurrencies in USD, ideal for comprehensive tracking and analysis by crypto enthusiasts.
                    - switch "Use Crypto Analytics this turn" [ref=e490] [cursor=pointer]
                  - listitem [ref=e491]:
                    - generic [ref=e492]:
                      - generic [aria-hidden] [ref=e493]: C
                      - generic [ref=e494]:
                        - paragraph [ref=e495]:
                          - generic [ref=e496]: Crypto-Description
                          - generic [ref=e497] [cursor=pointer]: general
                          - 'generic "Crypto-Description: connected" [ref=e498] [cursor=pointer]': connected
                        - paragraph [ref=e499]: plugin-1717420060
                        - paragraph [ref=e500]: Provides information on the top 5 cryptocurrencies, aiding in understanding market trends and investment decisions.
                    - switch "Use Crypto-Description this turn" [ref=e501] [cursor=pointer]
                  - listitem [ref=e502]:
                    - generic [ref=e503]:
                      - generic [aria-hidden] [ref=e504]: C
                      - generic [ref=e505]:
                        - paragraph [ref=e506]:
                          - generic [ref=e507]: Currency Converter
                          - generic [ref=e508] [cursor=pointer]: general
                          - 'generic "Currency Converter: connected" [ref=e509] [cursor=pointer]': connected
                        - paragraph [ref=e510]: plugin-1726241050
                        - paragraph [ref=e511]: This agent helps you convert amounts between different currencies using the latest exchange rates. Just provide the currencies and the amount, and it will give you the converted value.
                    - switch "Use Currency Converter this turn" [ref=e512] [cursor=pointer]
                  - listitem [ref=e513]:
                    - generic [ref=e514]:
                      - generic [aria-hidden] [ref=e515]: D
                      - generic [ref=e516]:
                        - paragraph [ref=e517]:
                          - generic [ref=e518]: Digital Dubai Authority
                          - generic [ref=e519] [cursor=pointer]: research
                          - 'generic "Digital Dubai Authority: connected" [ref=e520] [cursor=pointer]': connected
                        - paragraph [ref=e521]: plugin-1784190637
                        - paragraph [ref=e522]: A 15-page reference that compiles Dubai/UAE AI governance content — the full Dubai AI Principles and Ethics Guidelines, article-by-article digests of the Dubai Data Law, PDPL, and DIFC Regulation 10, the UAE AI Charter's 12 principles, official source links, and a compliance review checklist — for building a RAG-based AI compliance agent.
                    - switch "Use Digital Dubai Authority this turn" [ref=e523] [cursor=pointer]
                  - listitem [ref=e524]:
                    - generic [ref=e525]:
                      - generic [aria-hidden] [ref=e526]: D
                      - generic [ref=e527]:
                        - paragraph [ref=e528]:
                          - generic [ref=e529]: Docu Sign
                          - generic [ref=e530] [cursor=pointer]: general
                          - 'generic "Docu Sign: connected" [ref=e531] [cursor=pointer]': connected
                        - paragraph [ref=e532]: plugin-1742247897
                        - paragraph [ref=e533]: An intelligent agent that streamlines the document signing process by integrating with DocuSign. It provides a user-friendly interface to manage, track, and automate electronic signatures efficiently. To get started, sign in at https://bit.ly/4lckK54 and update the configuration with the access token.
                    - switch "Use Docu Sign this turn" [ref=e534] [cursor=pointer]
                  - listitem [ref=e535]:
                    - generic [ref=e536]:
                      - generic [aria-hidden] [ref=e537]: D
                      - generic [ref=e538]:
                        - paragraph [ref=e539]:
                          - generic [ref=e540]: Document Template Tool
                          - generic [ref=e541] [cursor=pointer]: general
                          - 'generic "Document Template Tool: connected" [ref=e542] [cursor=pointer]': connected
                        - paragraph [ref=e543]: plugin-1769932182
                        - paragraph [ref=e544]: Tool for creating documents from templates and extracting template variables
                    - switch "Use Document Template Tool this turn" [ref=e545] [cursor=pointer]
                  - listitem [ref=e546]:
                    - generic [ref=e547]:
                      - img "Dubai Courts - Legal Research" [ref=e548]
                      - generic [ref=e549]:
                        - paragraph [ref=e550]:
                          - generic [ref=e551]: Dubai Courts - Legal Research
                          - generic [ref=e552] [cursor=pointer]: research
                          - 'generic "Dubai Courts - Legal Research: connected" [ref=e553] [cursor=pointer]': connected
                        - paragraph [ref=e554]: plugin-1784196787
                        - paragraph [ref=e555]: This tool contains index of UAE and Dubai legislation, regulations and Cassation precedent that enables Dubai Courts' legal research agents to return citable, verifiable answers.
                    - switch "Use Dubai Courts - Legal Research this turn" [ref=e556] [cursor=pointer]
                  - listitem [ref=e557]:
                    - generic [ref=e558]:
                      - img "Elevan Labs Agent" [ref=e559]
                      - generic [ref=e560]:
                        - paragraph [ref=e561]:
                          - generic [ref=e562]: Elevan Labs Agent
                          - generic [ref=e563] [cursor=pointer]: general
                          - 'generic "Elevan Labs Agent: connected" [ref=e564] [cursor=pointer]': connected
                        - paragraph [ref=e565]: plugin-1789123753
                        - paragraph [ref=e566]: A powerful voice automation agent that can convert text to speech, clone and manage voices, transcribe audio, transform speech between voices, and generate custom sound effects using ElevenLabs' AI audio platform.
                    - switch "Use Elevan Labs Agent this turn" [ref=e567] [cursor=pointer]
                  - listitem [ref=e568]:
                    - generic [ref=e569]:
                      - img "Email" [ref=e570]
                      - generic [ref=e571]:
                        - paragraph [ref=e572]:
                          - generic [ref=e573]: Email
                          - generic [ref=e574] [cursor=pointer]: general
                          - 'generic "Email: connected" [ref=e575] [cursor=pointer]': connected
                        - paragraph [ref=e576]: plugin-1722285968
                        - paragraph [ref=e577]: Sends emails to specified email addresses with customisable subject and content, facilitating email communications.
                    - switch "Use Email this turn" [ref=e578] [cursor=pointer]
                  - listitem [ref=e579]:
                    - generic [ref=e580]:
                      - img "Email Memory" [ref=e581]
                      - generic [ref=e582]:
                        - paragraph [ref=e583]:
                          - generic [ref=e584]: Email Memory
                          - generic [ref=e585] [cursor=pointer]: marketing
                          - 'generic "Email Memory: connected" [ref=e586] [cursor=pointer]': connected
                        - paragraph [ref=e587]: plugin-1746704424
                        - paragraph [ref=e588]: This agent will send mail to unique email taht aren't stored.
                    - switch "Use Email Memory this turn" [ref=e589] [cursor=pointer]
                  - listitem [ref=e590]:
                    - generic [ref=e591]:
                      - img "Emcan Knowledge Base" [ref=e592]
                      - generic [ref=e593]:
                        - paragraph [ref=e594]:
                          - generic [ref=e595]: Emcan Knowledge Base
                          - generic [ref=e596] [cursor=pointer]: general
                          - 'generic "Emcan Knowledge Base: connected" [ref=e597] [cursor=pointer]': connected
                        - paragraph [ref=e598]: plugin-1788522248
                        - paragraph [ref=e599]: Provides official and up-to-date information about EmCan, Emarat’s loyalty program. Use it to retrieve, explain, summarize, or answer questions about EmCan FAQs, Terms & Conditions, EmCoins, earning and redeeming points, membership tiers and tier benefits, rewards, point expiry, Earn QR and Redeem QR usage, account and membership rules, eligibility conditions, partner benefits, and products or services that are excluded from earning or redeeming loyalty points. It is suitable for both specific EmCan questions and general requests for information, explanations, summaries, or guidance about the EmCan loyalty program and its official policies.
                    - switch "Use Emcan Knowledge Base this turn" [ref=e600] [cursor=pointer]
                  - listitem [ref=e601]:
                    - generic [ref=e602]:
                      - generic [aria-hidden] [ref=e603]: E
                      - generic [ref=e604]:
                        - paragraph [ref=e605]:
                          - generic [ref=e606]: EmCan Member Data Salesforce
                          - generic [ref=e607] [cursor=pointer]: data
                          - 'generic "EmCan Member Data Salesforce: connected" [ref=e608] [cursor=pointer]': connected
                        - paragraph [ref=e609]: plugin-1788707289
                        - paragraph [ref=e610]: Looks up the signed in EmCan member's personal Emcan points, tier, cases, vouchers, partners, and last transaction. Never take a membership number from the user or the model; always use the session member-id header.
                    - switch "Use EmCan Member Data Salesforce this turn" [ref=e611] [cursor=pointer]
                - paragraph [ref=e612]: Applies to your next question — nothing is substituted if a plugin fails.
            - generic [ref=e613]:
              - generic [ref=e614]:
                - heading "Default chat context" [level=2] [ref=e615]
                - paragraph [ref=e616]: Watchlist organisations attached to new chat threads (namespace uae_cc_v1).
              - generic [ref=e618]:
                - paragraph [ref=e619]: Default chat context organisations
                - generic [ref=e620]:
                  - generic [ref=e621]:
                    - generic [ref=e622]: Companies
                    - generic "5 of 5 selected" [ref=e623]: 5/5
                  - generic "Selected companies" [ref=e624]:
                    - group "Mohamed bin Zayed University of Artificial Intelligence, University" [ref=e626]:
                      - img "Mohamed bin Zayed University of Artificial Intelligence" [ref=e627]: M
                      - generic [ref=e628]: Mohamed bin Zayed University of Artificial Intelligence
                      - button "Remove Mohamed bin Zayed University of Artificial Intelligence from context" [ref=e629] [cursor=pointer]
                    - group "G42, Company" [ref=e634]:
                      - img "G42" [ref=e636]
                      - generic [ref=e637]: G42
                      - button "Remove G42 from context" [ref=e638] [cursor=pointer]
                    - group "Technology Innovation Institute, Research centre" [ref=e643]:
                      - img "Technology Innovation Institute" [ref=e644]: T
                      - generic [ref=e645]: Technology Innovation Institute
                      - button "Remove Technology Innovation Institute from context" [ref=e646] [cursor=pointer]
                    - group "EDGE Group, Company" [ref=e651]:
                      - img "EDGE Group" [ref=e652]: E
                      - generic [ref=e653]: EDGE Group
                      - button "Remove EDGE Group from context" [ref=e654] [cursor=pointer]
                    - group "Space42 PLC, Company" [ref=e659]:
                      - img "Space42 PLC" [ref=e660]: S
                      - generic [ref=e661]: Space42 PLC
                      - button "Remove Space42 PLC from context" [ref=e662] [cursor=pointer]
                  - generic [ref=e666]:
                    - generic [ref=e667]: Add a company
                    - combobox "Add a company" [disabled] [ref=e668]
                  - status [ref=e669]: Remove a company to add another.
            - generic [ref=e670]:
              - heading "Local data" [level=2] [ref=e672]
              - generic [ref=e673]:
                - button "Reset all local settings" [ref=e675]
                - paragraph [ref=e676]: Help is always in this same place (Settings → bottom of every page). Nothing here is sent anywhere except the OnDemand proxy.
        - contentinfo [ref=e677]:
          - generic [ref=e678]:
            - generic [ref=e679]:
              - strong [ref=e680]: Concept Demonstration — not an official government system.
              - text: Public sources only · no government logo or endorsement implied.
            - generic [ref=e681]:
              - text: Data namespace uae_cc_v1 · as of 2026-10-21 ·
              - link "Methodology & limitations" [ref=e682] [cursor=pointer]:
                - /url: /methodology
            - generic [ref=e683]: "Intelligence engine: OnDemand (AIREV)"
            - generic [ref=e686]:
              - text: v1.0.0 · local · last updated
              - time [ref=e687]: 2026-10-21 10:29 UTC
  - region "Notifications alt+T"
  - alert [ref=e688]
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