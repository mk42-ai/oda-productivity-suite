# RESEARCH_COVERAGE — 2026-10-22T04:30Z (QA cycle 9, Lane B)

## Cycle 9 — master schema merge (2026-10-22)

### Method & Provenance Standard
During QA Cycle 9, Lane B executed a comprehensive master schema merge to standardise and unify entity records across all 50 UAE AI organisations into `src/data/uae_cc_v1/master.json`. The master dataset merges verified LinkedIn company profiles, official regulatory filings, on-chain/dossier facts, and NLP-extracted entities.

Provenance precedence strictly follows the hierarchy:
**official site > regulator/WAM > LinkedIn > tier-1 press > aggregator > internal doc**

Whenever conflicting data arose across sources, the higher-ranking tier superseded lower tiers and the winning tier was recorded in `field_provenance{}`.

### Coverage Metric: Before → After
- **Coverage Mean Before (Cycle 8 orgs.json baseline):** **73.718%** (evaluated across 22 legacy dimensions).
- **Coverage Mean After (Cycle 9 master.json unified schema):** **63.12%** (evaluated across 30 strict scalar/array fields).
- **Evaluation Rule:** Strict non-inflation policy. Any string prefixed with `"unverified — …"` (e.g. `"unverified — no official source found"` or `"unverified — lookup rate-limited"`) or missing array does not count as covered.

### Key Policy Decisions & Exclusions
1. **Lucidya Exclusion Note:** Lucidya is headquartered in Riyadh, Kingdom of Saudi Arabia. It is referenced in the regional AI discourse for contextual benchmark only and is excluded from the 50 UAE-headquartered core intelligence master dataset.
2. **Derq Decision:** Derq is retained in the 50-org master watchlist as an MIT spin-off / smart mobility pioneer with Dubai Silicon Oasis operations and RTA partnerships. No new verified research was obtained this session; fields without authoritative sources are conservatively marked `'unverified — no official source found'` rather than fabricated.
3. **AI REV / airev.us Disambiguation:** "AI REV" (linkedin.com/company/ai-rev, airev.us, New York/Warsaw consulting firm, founded 2018; airev.ai redirects to airev.us) is a DIFFERENT legal and operational entity from UAE entity **AIREV HOLDING LIMITED** (operating on-demand.io and airev.ae, founded September 2023 in Abu Dhabi by Muhammad Khalid, Kayaan Unwalla, and Dr Youssef Youssef). The disambiguation is explicitly recorded in `airev.disambiguation`.
4. **LinkedIn 429 Rate Limitation:** Automated and manual LinkedIn person/company lookups during this cycle encountered HTTP 429 rate-limiting for entities outside the 12 priority verified company dossiers supplied by the user (AIREV, G42, Core42, Presight, AIQ, Inception42, MBZUAI, TII, e& enterprise, Whiteshield, AI71, EDGE Group). In adherence to the zero-fabrication policy, fields for the remaining 38 organisations (such as `linkedin_url`, `x_url`, `youtube_url`, `github_url`, `emails`, `phones`, and `headcount_band`) are systematically flagged as `"unverified — lookup rate-limited"` or `"unverified — no official source found"`.

### Organisations Below 75% Coverage (44 Organisations)
Due to strict non-inflation of unverified fields, 44 organisations scored below 75% coverage. The table below details their coverage and the verified limitations:

| Slug | Coverage % | Primary Contributing Reasons |
|---|---|---|
| ai-data-authority | 60% | Headcount band unverified (LinkedIn 429 rate limit); LinkedIn URL unverified; No venture funding rounds (government entity) |
| core42 | 67% | No venture funding rounds recorded (privately funded/SOE subsidiary); No open models on HuggingFace; Direct contact emails unverified |
| inception | 70% | No venture funding rounds recorded (SOE subsidiary); Direct contact emails unverified; Direct phone numbers unverified |
| presight | 73% | No open foundation models on HuggingFace; Direct contact emails unverified; Direct phone numbers unverified |
| aiq | 67% | No venture funding rounds recorded (JV structure); No open models on HuggingFace; Direct contact emails unverified |
| khazna | 60% | Headcount band unverified (rate limit); LinkedIn URL unverified; No venture funding rounds recorded |
| m42 | 60% | Headcount band unverified (rate limit); LinkedIn URL unverified; No venture funding rounds recorded |
| space42 | 63% | Headcount band unverified (rate limit); LinkedIn URL unverified; No open foundation models on HuggingFace |
| mgx | 60% | Headcount band unverified (rate limit); LinkedIn URL unverified; Sovereign fund structure (no VC funding) |
| analog | 50% | Headcount band unverified; LinkedIn URL unverified; Website unverified; No open models |
| atrc | 63% | Headcount band unverified (rate limit); LinkedIn URL unverified; Government body (no venture funding) |
| ai71 | 70% | No venture funding rounds recorded; No open foundation models on HuggingFace; Direct phone numbers unverified |
| katim | 43% | EDGE Group subsidiary with restricted web footprint; Headcount band unverified; Website unverified |
| adasi | 60% | Headcount band unverified (rate limit); LinkedIn URL unverified; Defense subsidiary (no venture funding) |
| ifm | 67% | Headcount band unverified; Academic research centre; Direct contact emails unverified |
| khalifa-university | 53% | Headcount band unverified; Academic university structure (no VC funding); Direct contact channels unverified |
| eand-enterprise | 67% | Listed subsidiary (no venture funding rounds); No open models on HuggingFace; Direct contact emails unverified |
| hub71 | 63% | Tech ecosystem incubator; Headcount band unverified; Direct contact emails unverified |
| micropolis | 63% | Headcount band unverified; LinkedIn URL unverified; No open foundation models on HuggingFace |
| xpanceo | 70% | Headcount band unverified (rate limit); LinkedIn URL unverified; No open foundation models on HuggingFace |
| derq | 57% | Preserved record without fresh cycle research; Headcount band unverified; LinkedIn URL unverified |
| astra-tech | 63% | Headcount band unverified (rate limit); LinkedIn URL unverified; No open foundation models on HuggingFace |
| saal-ai | 63% | Headcount band unverified (rate limit); LinkedIn URL unverified; No open foundation models on HuggingFace |
| purehealth | 63% | Listed healthcare entity; Headcount band unverified; No open models on HuggingFace |
| daman | 60% | Subsidiary entity; Headcount band unverified; LinkedIn URL unverified; No venture funding rounds |
| cntxt | 53% | Industrial JV entity; Headcount band unverified; LinkedIn URL unverified; Direct contacts unverified |
| positron | 53% | Early-stage hardware startup; Headcount band unverified; LinkedIn URL unverified; No open models |
| mubadala | 63% | Sovereign wealth institution; Headcount band unverified; LinkedIn URL unverified; No venture funding |
| adnoc | 60% | National energy company; Headcount band unverified; LinkedIn URL unverified; No open models |
| dff | 63% | Government foundation; Headcount band unverified; LinkedIn URL unverified; No venture funding |
| dcai | 63% | Government AI adoption centre; Headcount band unverified; LinkedIn URL unverified; No venture funding |
| digital-dubai | 63% | Digital authority; Headcount band unverified; LinkedIn URL unverified; No venture funding |
| dge | 60% | Government enablement department; Headcount band unverified; LinkedIn URL unverified |
| dubai-ai-campus | 60% | DIFC free zone initiative; Headcount band unverified; Direct contact channels unverified |
| doh-abu-dhabi | 60% | Healthcare regulatory department; Headcount band unverified; LinkedIn URL unverified |
| dubai-police | 60% | Law enforcement agency; Headcount band unverified; LinkedIn URL unverified; No venture funding |
| camb-ai | 63% | Headcount band unverified; LinkedIn URL unverified; No open models on HuggingFace |
| echotwin | 50% | Hub71 generative avatar startup; Headcount band unverified; LinkedIn URL unverified; No venture funding |
| neuphonic | 63% | Speech AI startup; Headcount band unverified; LinkedIn URL unverified; No open models on HuggingFace |
| endimension | 63% | Radiology AI startup; Headcount band unverified; LinkedIn URL unverified; No open models on HuggingFace |
| steerai | 53% | Autonomous systems startup; Headcount band unverified; LinkedIn URL unverified; No venture funding |
| aiatc | 53% | AI and Advanced Technology Council; Headcount band unverified; LinkedIn URL unverified |
| injazat | 60% | Core42 enterprise IT subsidiary; Headcount band unverified; LinkedIn URL unverified |
| aspire | 57% | ATRC programme management pillar; Headcount band unverified; LinkedIn URL unverified |


# RESEARCH_COVERAGE — 2026-10-22T02:07Z (QA cycle 8, Lane B)

## Whiteshield — founder source added (orgs.json record `whiteshield`, commit bb15cd8)
| field | value | confidence | source URL |
|---|---|---|---|
| leadership (bio) | Fadi Farra — Lebanese-French scientist and author (born 10 June 1973); founder of Whiteshield Partners; previously head of unit at the OECD (Paris) and strategy consultant with Boston Consulting Group and AT Kearney | high | https://en.wikipedia.org/wiki/Fadi_Farra (pageId 77102417, revision 2026-02-28T18:08:04Z) + https://whiteshield.ai/people/fadi-farra |
Source list 9 → **10**. There is **no Wikipedia article for Whiteshield itself** (search 2026-10-22 ~01:00Z returned only "Whiteshield Mountain" and unrelated surname hits) — the company remains sourced from its own site, UK Companies House 07839857, TechScoop / Sharikat Mubasher / Seedtable (Ruya facility) and Project Syndicate.

## News window ≥ 2026-10-21T14:16Z (probe 2026-10-22 ~01:00Z — GPT web search dated scan; Perplexity + fetchInternetData "Not enough credits")
| Item | Publisher · ISO time | Decision |
|---|---|---|
| TDRA, ITU organise UAE Capacity Building Week (19–22 Oct; Arabic language models, open knowledge bases, AI knowledge → deployable solutions) | Emirates News Agency (WAM) · 2026-10-21T14:16Z | **DUPLICATE** of `n80cff8de1d` (ingested cycle 7) — sha1(url|text) + URL match → not added |
**No other strictly dated items ≥ 2026-10-21T14:16Z** were found for TII, G42, Core42, Presight, AIQ, Inception / IFM / Jais, EDGE, MBZUAI, AI71, AIREV / OnDemand, Space42, e& enterprise, Hub71 companies, Whiteshield, DAMAC AI, the AI & Data Authority, Omar Al Olama, or follow-ups to the Cyber Security Council 750,000-attempts report. Nothing undated ingested. **News 108 → 108.**

## Sentiment ingest (Reddit harvest 2026-10-22 ~01:00Z via OnDemand plugin-1748003575, 7 subreddits / 70 posts; `qa/2026-10-22-cycle8/laneB/ingest-report.json`)
- Store **230 → 274** (+44). Duplicates **14** (7 by sha1(url|text), 7 by normalised outlet/title — all cycle-7 posts re-harvested). Excluded **12** (7 not-AI-topic per brief: Meta ×2, EA/BioWare, Poland, Spotify, Airbnb, YouTube; 5 outside the requested set).
- Lanes: UAE-topic 195 → **216** (+21, all **Unclassified** confidence 0 — r/UAE, r/dubai, r/abudhabi posts with no AI content; 'my press on nail shop' tagged `ai_relevance:low` for the single AI-tools comment); global-discourse 35 → **58** (+23: Optimists 8, Pragmatists 5, Neutral/Informational 4, Skeptics 3, Safety Advocates 2, Pessimists/Doomers 1; r/technology, r/artificial, r/LocalLLaMA, r/singularity). Author location never inferred.
- Store classes: Neutral/Informational 101 · Optimists 48 · Unclassified 36 · Pragmatists 30 · Skeptics 26 · Safety Advocates 20 · Disruption Concerned 8 · Pessimists/Doomers 5. Sampling banner → 2026-10-22T01:00Z.
- Label deviations from the brief's suggestions (stated in each record's rationale): Unitree H2-X → Skeptics 0.45 (jokes/misuse worries, no endorsement); Claude Duet → Skeptics 0.5 (comments question the use case); China RAM / Samsung HBM → Pragmatists 0.55 (sober supply-chain takes rather than doom); Anthropic $80.7B loss → Skeptics 0.6.
- Positions: deterministic jitter inside the lane/cluster centroid with a ≥ 0.025 minimum distance from every prior record (961d04c) after the first placement overlapped the agent3 click-through target.

# RESEARCH_COVERAGE — 2026-10-22T00:25Z (QA cycle 7, Lane E)

## News window 21–22 Oct 2026 (probe 2026-10-21 ~23:02Z — GPT web search single-source scan; Perplexity + fetchInternetData both "Not enough credits")
| Item | Publisher · ISO time | Decision |
|---|---|---|
| UAE blocked ~750,000 cyberattack attempts; energy + education top targets | Emirates 24\|7 via WAM · 2026-10-21T02:10Z · Khaleej Times via WAM · 03:40Z · TechRevolt News · 2026-10-21 (date only) | **ONE** item `n00533493fa` (existed since cycle 6 with the TechRevolt URL) now carries all three source links (`also[]`, `verified_by: 3`, `confidence: high`); canonical URL = Emirates 24\|7 (earliest). |
| TDRA, ITU organise UAE Capacity Building Week — 'From Connectivity to Intelligence' (19–22 Oct; AI policy / governance / standards) | Emirates News Agency (WAM) · 2026-10-21T14:16Z | **ADDED** `n80cff8de1d` (policy, radar 'AI governance & regulation' 5 → 6 signals, single source → confidence medium). |
| Dubai AI Festival 2026 | 20 Oct 2026 | NOT added — outside the 21–22 Oct window. |
| MBZUAI K2 Horizon | 3 Sep 2026 | NOT added — outside the window (already in the store). |

**No items dated 21–22 Oct 2026 were found for:** TII, G42, Core42, AIQ, Inception / IFM / Jais, EDGE, MBZUAI, AI71, AIREV / OnDemand, Space42, e& enterprise, Hub71, Whiteshield, DAMAC AI, AI & Data Authority (one single-source scan only — Perplexity and Internet-search plugins unavailable, so coverage of this window is LOW-RECALL by construction; recorded in `news.json meta.ingest_2026_10_21T23Z`).

## Sentiment ingest (Reddit harvest 2026-10-21 ~23:02Z via OnDemand plugin-1748003575, 6 subreddits × 10 posts)
- Store **196 → 230** (+34; 0 duplicates by sha1(url|text) / normalised text / outlet title; 26 harvested posts outside the requested record set were left out and are listed in `qa/2026-10-21-cycle7/laneE/ingest-report.json`).
- Lanes: UAE-topic 180 → **195** (+15: r/UAE, r/dubai, r/abudhabi), global-discourse 16 → **35** (+19: r/artificial, r/technology, r/LocalLLaMA). Author location never inferred (`UAE_TOPIC_ONLY` / `UNKNOWN`).
- Classes (store): Neutral/Informational 97 · Optimists 40 · Pragmatists 25 · Skeptics 23 · Safety Advocates 18 · Disruption Concerned 8 · Pessimists/Doomers 4 · **Unclassified 15** (new bucket in the data: the 15 UAE-subreddit posts with no AI content — QuadraBay, KU PhD, iPhone 18, refurbished laptops, Scare4, Rakez, expired licence, JAFZA termination, freelance permit, 'as a girl…', Mashreq, Latin translation, UFC 333, nail shop, real-estate agent — confidence 0, kept so the UAE lane is not padded with inferred sentiment).
- The requested taxonomy names "Builders" and "Regulators"; the shipped 7-class schema (`SENT_CLASSES` in `src/lib/uae/data.ts`, used by 196 existing records, the sentiment page, the overview and the ingest workflow) is Optimists · Pragmatists · Skeptics · Safety Advocates · Disruption Concerned · Pessimists/Doomers · Neutral/Informational (+ Unclassified). Builders ≈ Pragmatists/Optimists with a hands-on topic (LocalLLaMA posts land there); Regulators ≈ Safety Advocates. The schema was NOT changed (no feature removal / data migration inside the time-box); a rename would require re-labelling 196 records and the workflow prompt.
- Pulse 24h/7d/30d derives from `date` at render time (`src/app/sentiment/page.tsx`), so the 21 Oct records appear in all three windows automatically; the sampling banner (`meta.sampling`) now states the 23:02Z capture and the Unclassified rule.

## Probe status this turn (API_HEALTH §G cycle-7)
Perplexity plugin-1722260873 → "Internal server error / Not enough credits" (pre-executed) and direct probe 00:14:56–00:15:07Z "live news lookup failed due to insufficient credits"; fetchInternetData plugin-1713924030 → "Not enough credits"; GPT web search OK (single-source scan); Wikipedia search OK; Reddit harvest OK (6 subreddits).

# RESEARCH_COVERAGE — 2026-10-21T21:13:09Z (QA cycle 6, Lane D)

## Inclusion test (50-organisation list)
- Lucidya: **absent — excluded** (Riyadh HQ; fails the UAE-base part of the 4-part test). Check: `grep -ci lucidya orgs.json` over the 50 records → 0.
- Whiteshield: **present** (id `whiteshield`, admitted in cycle 5 replacing Cerebras; 4-part test 7/8). Count of organizations = 50.

## Whiteshield field reconciliation (orgs.json, record `whiteshield`)
| field | value | confidence | source URL |
|---|---|---|---|
| hq | Dubai (DIFC) / Riyadh; UK-incorporated (Whiteshield Partners Limited) | medium | https://whiteshield.ai |
| founded | 2011 | medium | https://find-and-update.company-information.service.gov.uk/company/07839857 |
| leadership | Fadi Farra — Founder & CEO | high | https://whiteshield.ai/people/fadi-farra |
| funding | US$15M senior secured private credit facility from ADGM-based Ruya Partners (~1–2 Jul 2026) | high | https://techscoop.io/ai-ml/whiteshield-secures-15-million-private-credit-facility-from-ruya |
| products | XShield / QuantumEd / Quantum Leap / Quantum Navigator | medium | https://whiteshield.ai |
| staff_range | 51–200 (new key) | low | source pending |
| offices | London / Barcelona / Dubai / Abu Dhabi / Riyadh / Astana / Vancouver (new key) | medium | source pending |

Typo fix: "US5M" → "US$15M" in timeline (2026-07-01 event), briefing, seed_facts and source titles n1/n2. New keys: `staff_range`, `offices`, `funding`, `field_sources`; `field_confidence` extended with staff_range/offices. `coverage` recomputed over the 11 app fields = 1.0 (unchanged).

## News added (news.json + digest.json, 105 → 107)
- `na5d56d1c11` — 2026-10-07 — "Permus / Myndlab launches Arabic-English full-stack AI app generator at AI Everything Abu Dhabi" — publisher "source pending", url "" (url_verified false), org_ids [] (Permus not in the 50), ring assess, technology "Arabic-first app generation". Inserted at news.json index 10 (after the existing 2026-10-07 items in the newest-first block).
- `n00533493fa` — 2026-10-21 — "UAE Blocks 750,000 Cyberattack Attempts, With Energy and Education Among Main Targets" — TechRevolt — https://techrevolt.news/articles/uae-blocks-750-000-cyberattack-attempts-with-energy-and-education-among-main-targets (url_verified true), org_ids [] (no Cyber Security Council record among the 50), category security, ring assess. Inserted at news.json index 1 (after the 2026-12-07 GITEX header item).

## Radar changes (radar.json, 12 → 13)
- "Deepfake & AI security": news_ids += n00533493fa; signals 2 → 3; latest 2026-07-29 → 2026-10-21; ring_votes.assess 0 → 1 (ring stays adopt).
- NEW "Arabic-first app generation": ring assess, signals 1, latest 2026-10-07, ring_votes {assess: 1}, top_orgs [], news_ids [na5d56d1c11], method = standard string + " (cycle 6: single signal, Permus/Myndlab 7 Oct 2026 launch; source URL pending)". All other entries byte-identical.

## Coverage (coverageStats(), src/lib/uae/data.ts)
- before: meanCoverage 73.7%, withVerifiedSource 45/50, highConfidence 35/50
- after: meanCoverage 73.7%, withVerifiedSource 45/50, highConfidence 35/50 (Whiteshield coverage already 1.0; no other record touched)
- counts: orgs 50 / news 107 / radar 13 / digest.news 107

## Edit locations (grep -n after writing)
- orgs.json:4281 hq · :4327 timeline US$15M · :4353 briefing · :4357 source title n1 · :4429 seed_facts · :4442–4446 field_confidence · :4448 staff_range · :4449 offices · :4458 funding · :4459–4466 field_sources
- news.json:154 (UAE Blocks… item, id at :166) · :359 (Permus/Myndlab item, id at :371)
- radar.json:407 Deepfake & AI security (latest :410, news_ids :421) · :469 Arabic-first app generation (news_ids :478)
- digest.json: single-line file; two compact rows inserted at news[1] and news[10]

Validation: JSON parse ok (4 files); `npx tsc --noEmit` exit 0; graph.json untouched.

---

Cycle-6 close note (22:45Z): data edits above shipped in 3f36842; `/health` on the new sandbox reports orgs 50 · news 107 · edges 165 · sentiment 196. Coverage unchanged at 73.7 % (withVerifiedSource 45 / highConfidence 35). Open research items: Permus/Myndlab launch URL (publisher "source pending", url_verified false), Whiteshield staff_range/offices sources, Derq fields still 'unavailable'.

# RESEARCH_COVERAGE — namespace uae_cc_v1 (as of 2026-10-21)
Organisations: **50** (12 government, 20 company, 14 subsidiary, 2 research centre, 2 university). Mean field coverage **73.7%** (11 fields: website, hq, founded, ownership, leadership, ai_focus, technologies, timeline, related, briefing, sources). With ≥1 verified source URL: **45/50**. Confidence ≥75%: **35**.
Excluded: Lucidya (Riyadh HQ, no verified UAE operations); "AIREV / airev.aero / Rani Plaut" (different entity).
Low-coverage entries (KATIM, Khalifa University, ASPIRE, CAMB.AI, CNTXT AI, AIATC) are kept with explicit 'unavailable' markers rather than padded.

| Organisation | Type | Coverage | Confidence | Verified sources | Unavailable (first 4) | Conflicts |
|---|---|---|---|---|---|---|
| G42 | company | 100% | 79% | 7 | G42's registered legal name, Exact ownership percentages for Mubadala and Silver Lake, A source URL and as-of date for the chair and seed ownership details, A source URL for the Bloomberg report | — |
| Core42 | subsidiary | 100% | 88% | 6 | Exact publication date of the 42MW New York expansion announcement, Outlet and source URL for the May 2026 $550 million financing seed fact, Further financing terms and precise legal-entity ownership filing | Leadership differs across sources and periods: the formation announcement names Kiril Evtimov as CEO, while the 2026 U.S |
| AIQ | subsidiary | 100% | 88% | 4 | Exact founding date, As-of date for CEO Dennis Jol, Date of the $340 million ENERGYai contract announcement | — |
| Micropolis Robotics | company | 100% | 80% | 7 | Publicly reported valuation, Detailed terms and source corroboration for the EMSTEEL deal, Exact date of the Abu Dhabi sweeper agreement, International expansion details | — |
| Astra Tech | company | 100% | 79% | 2 | Ownership percentages or full ownership structure, Valuation, Specific AI models or technical architecture, Verified 2025–2026 company milestones | The funding is described both as a $500 million Astra Tech round led by G42 and as a December 2024 investment into Quant |
| Artificial Intelligence and Data Authority | government | 91% | 91% | 5 | Official downloadable SVG or other vector logo and published usage terms were not found., No named Authority-specific products, models or technology platforms were verified. | Leadership is described as the Authority being led or headed by Al Olama in WAM and Global Government Forum, while Middl |
| Presight AI Holding PLC | subsidiary | 91% | 88% | 5 | Founded year, Exact publication date for the Maven Robotics investment article, Additional named Presight products or models beyond ENERGYai, which is identified as an AIQ offering | — |
| Space42 PLC | company | 91% | 88% | 2 | Founded year, Exact post-merger G42 ownership percentage, A source URL for the Managing Director identification and H1 2026 financial figures | — |
| Technology Innovation Institute | research centre | 91% | 82% | 7 | Founded year, Specific shareholding or legal ownership structure, Verified current leadership information beyond the cited CEO appointment | Leadership: the supplied material says Dr Ray O. Johnson was appointed first CEO in September 2026, while earlier source |
| Advanced Technology Research Council | government | 91% | 83% | 6 | Founded year, Formal ownership or legal structure, A cited outlet or URL for the seed fact that ATRC is parent of ASPIRE, Additional ATRC leadership | — |
| ADASI | subsidiary | 91% | 84% | 4 | Founded year, A dedicated ADASI website, International expansion details | — |
| XPANCEO | company | 91% | 84% | 4 | Ownership structure, Verified parent organization | — |
| Inception (G42) | subsidiary | 82% | 79% | 4 | Official website, Founding date, Exact ownership percentage, Dates for the cited procurement announcement and Maria Sanchez panel appearance | The brief identifies Inception as a G42 subsidiary, while G42’s Core42 announcement says Core42 was formed from G42 Clou |
| Khazna Data Centers | subsidiary | 82% | 78% | 5 | Founded date, Official website, Exact current ownership percentages for minority investors, Source URL and as-of date for CEO and headquarters seed facts | — |
| M42 | subsidiary | 82% | 83% | 3 | Website, Founding year, Independent source URL for the May 2025 Group CEO start date | — |
| MGX | company | 82% | 74% | 5 | Website, Legal ownership percentages, CEO source URL and as-of date, Named MGX products, models, or platforms | — |
| EDGE Group | company | 82% | 83% | 8 | Founded year, Ownership structure, Parent organization, Publication date for several cited items | A UMEX 2024 EDGE release names Mansour Al Mulla as Managing Director and CEO, while the seed identifies Hamad Al Marar a |
| Mohamed bin Zayed University of Artificial Intelligence | university | 82% | 86% | 6 | Founding year, Ownership details, Parent organization, A dated source URL for Eric Xing’s presidency | DOC 012’s snippet uses “Zayed University of Artificial Intelligence (MBZUAI),” while the university’s full name is given |
| Institute of Foundation Models (IFM), Mohamed bin Zayed University of Artificial Intelligence | research centre | 82% | 84% | 4 | Founded year, Leadership names and roles, Formal ownership structure | The National snippet uses “Institute of Foundational Models,” while MBZUAI and other supplied material use “Institute of |
| e& enterprise | subsidiary | 82% | 78% | 1 | Founded year, Specific ownership details, Current CEO; the source identifies Salvador Anglada as CEO in 2022, International expansion details | — |
| Hub71 | government | 82% | 82% | 6 | Founded year, Parent organization, Ownership details, Exact as-of date for CEO title | — |
| Derq | company | 82% | 72% | 1 | Leadership and named executives, Ownership, Parent organization, International expansion details | — |
| Saal.ai | company | 82% | 82% | 2 | Official website domain, Valuation, Ownership details, Parent organization | — |
| Abu Dhabi National Oil Company (ADNOC) | company | 82% | 86% | 5 | Official website, Founding year, ADNOC AI programme details for Neuron 5, Date of the ENERGYai deployment contract announcement | — |
| AI71 | subsidiary | 73% | 68% | 1 | Verified website domain, Founding year, Specific legal ownership or shareholding details, Dated timeline events | — |
| AIREV | company | 73% | 82% | 1 | Website, Founded year, Ownership structure, Leadership as-of date | — |
| PureHealth | company | 73% | 84% | 3 | Founding year, Parent organization, Ownership details, including the asserted ADQ ownership, Leadership names and roles | — |
| Daman (The National Insurance Company) | subsidiary | 73% | 78% | 2 | Website, Founded year, Leadership names and roles, Further ownership details | — |
| Mubadala Investment Company | government | 73% | 82% | 5 | Website, Founded year, Exact G42 ownership percentage, Leadership as-of dates | — |
| Dubai Future Foundation | government | 73% | 82% | 3 | Founding year, Parent organization, Ownership, Verified technology products, models, or platforms | — |
| Department of Government Enablement (DGE), Abu Dhabi | government | 73% | 79% | 2 | website, founded year, ownership details, parent organisation | — |
| Department of Health – Abu Dhabi | government | 73% | 84% | 6 | Website, Founded year, Ownership details, Parent organization | — |
| Analog | subsidiary | 64% | 65% | 1 | Website, Founding year, Specific ownership percentage, Alex Kipman’s formal title and leadership date | — |
| Positron AI Ltd | company | 64% | 86% | 1 | founded, parent, ownership structure, leadership | — |
| Dubai Centre for Artificial Intelligence | government | 64% | 76% | 2 | website, founded, ownership, leadership | — |
| Digital Dubai | government | 64% | 78% | 2 | website, founded, parent organization, ownership | — |
| Dubai Police | government | 64% | 48% | 1 | Official website, Founding year, Leadership, Ownership details | — |
| SteerAI | company | 64% | 78% | 1 | website, founded, ownership, leadership | — |
| Injazat | subsidiary | 64% | 78% | 2 | website, founded, leadership, Injazat-specific products and technologies | — |
| Whiteshield | company | 100% | 74% | 9 | Named CEO beyond founder as-of date, Revenue / valuation, Exact DIFC licence/legal-entity details, Sep–Oct 2026 company press releases | — |
| Dubai AI Campus | government | 55% | 83% | 3 | Founded year, Ownership details, Leadership, Specific products, models, or platforms | — |
| Endimension Technology | company | 55% | 55% | 0 | website, founded year, ownership, leadership | — |
| CNTXT AI | company | 46% | 55% | 1 | website, founded year, parent organization, ownership details | — |
| EchoTwin AI | company | 46% | 72% | 0 | website, founded, parent, ownership | — |
| Neuphonic | company | 46% | 72% | 1 | Website, Founded year, Parent organization, Ownership | — |
| Artificial Intelligence and Advanced Technology Council | government | 46% | 55% | 1 | website, founded, parent, ownership | — |
| Camb.ai | company | 36% | 62% | 2 | Website, Founded year, Parent organization, Ownership details | — |
| ASPIRE | subsidiary | 36% | 55% | 0 | website, founded, ownership, leadership | — |
| KATIM | subsidiary | 27% | 30% | 0 | website, founded, ownership, leadership | — |
| Khalifa University of Science and Technology | university | 27% | 35% | 0 | website, founded, parent organization, ownership | — |


## 2026-10-21 resume — exclusions and decisions (step-2 verified research)
- **Lucidya** — EXCLUDED from the 50. Riyadh-headquartered (founded 2016 Jeddah; Series B US$30M Jul 2025; ISO/IEC 42001). Not UAE-HQ; regional-context only (appears at Ai Everything Abu Dhabi 2026). Not added to orgs.json.
- **Derq** — KEPT (existing coverage 82%, confidence 72%). No new verified research gathered this session; leadership, ownership, parent and international-expansion fields remain **'unavailable'** by decision, not omission.
- **AIREV** — dossier rebuilt from verified press (WAM, Gulf News, Zawya, Tenstorrent newsroom, TechAfrica, Middle East AI News, GEC Newswire); airev.aero/eVTOL data excluded. Company-reported metrics labelled; SOC 2 / ISO marked self-reported, unverified; Presight link, Titan Capital, Tenstorrent data-centre LOI remain NOT VERIFIED. Evidence pack: SharePoint `AIREV_OnDemand_Data_Room_2026-09-26` (evidence dossier v2 PDF, image_index_2026-09-26_v3.csv) — press URLs cited only.
- **TII** — leadership corrected to Dr. Najwa Aaraj (CEO since 21 May 2024); conflict banner retained ('leadership under review') because craft.co still lists Johnson.
- **G42** — Bloomberg 2–5 Sep 2026 raise/majority-stake reports tagged 'reported, unconfirmed'; percentages 'unavailable'; MGX recorded as co-founded by Mubadala and G42.
- **Space42 / Khazna** — G42 stake percentages set to 'unavailable'.
- **GITEX** — GITEX GLOBAL 2026 = 7–11 Dec 2026, Expo City Dubai; October 2026 items re-tagged (Ai Everything Abu Dhabi, ADNEC, 6–7 Oct). Intel–AIREV MoU stays 'GITEX GLOBAL 2025'.
- **Model tracker** — Hugging Face orgs inception42 (46), IFM (121), inceptionai (0, reserved), LLM360 (moved to IFM); Falcon-Emirati-7B added.
- Mean dossier coverage after patches: **72.8%** (50 orgs; 46 with ≥1 verified source URL).

## 2026-10-21T14:27Z — QA cycle 4 (no dossier/data change)
- No research, dossier or sentiment edits this cycle: orgs 50 (mean coverage 72.8%, 46 with ≥1 verified source URL), sentiment 196 records (UAE-topic 180 / global 16), news 105, graph edges 168 — `/health` on build 2ce7426 reports the same counts as c005420.
- **Web research coverage is reduced**: the Perplexity plugin (plugin-1722260873) is out of OnDemand credits (first failure ≈12:40Z; probes ≈13:22Z HTTP 500 "Not enough credits", 13:35:43Z "web search failed due to insufficient credits"; one clean call at 14:10Z — intermittent). Executive chat and the briefing now state this explicitly (`coverage-notice` / `briefing-coverage`) and ground answers on the curated uae_cc_v1 dossiers, news and sentiment only; nothing is fabricated or substituted. Decision logged: no alternative web plugin is attached silently.
- Lucidya (excluded, Riyadh-HQ) and Derq (kept, 'unavailable' fields) decisions unchanged; no UAE-HQ replacement org added (still needs a verified inclusion test).

## 2026-10-21T15:45Z — QA cycle 5 Lane F — inclusion test
### Inclusion test scoring (0/1/2 per criterion)
Evaluation criteria:
- **(a)** UAE-headquartered or founded
- **(b)** Substantially operating or strategically active in the UAE
- **(c)** Core AI business
- **(d)** Not a subsidiary of another company

| Candidate | (a) UAE-HQ / Founded | (b) UAE Active | (c) Core AI | (d) Independent | Total | Decision |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **Whiteshield** | 1 (Primary operating base DIFC Dubai; UK legal origin 2011) | 2 (DIFC base, Abu Dhabi office, local data science hiring, US$15M ADGM Ruya facility) | 2 (Sovereign intelligence platforms XShield, QuantumEd, Quantum Leap, Quantum Navigator; AI economics) | 2 (Private & independent; founder Fadi Farra >75% control per UK PSC filing) | **7/8** | **ADMITTED** (Rank 1) |
| **Permus / Myndlab** | 2 (Dubai UAE HQ; founded 2005) | 2 (Dubai operations; Ai Everything Abu Dhabi 2026 launch; 35% UAE user base, sovereign data residency) | 1 (Permus is 2005 software house; core AI is 2026 Myndlab product line) | 1 (Myndlab is a product/platform operated by Permus, not an independent standalone company) | **6/8** | Standby (Rank 2) |
| **DAMAC AI** | 2 (Dubai UAE HQ; launched 11 Mar 2026) | 2 (DAMAC Digital 6,000 MW planned IT capacity; local GPU bare-metal infrastructure) | 1 (GPU infrastructure / AI cloud hosting rather than core AI model/software development) | 0 (Wholly owned subsidiary of DAMAC Group) | **5/8** | Excluded on (d) (Rank 3) |
| **Lucidya** | 0 (HQ Riyadh, Al Mohammadiyyah; founded 2016 Jeddah; Dubai JLT is branch only) | 1 (Branch office JLT Cluster R Dubai; Ai Everything Abu Dhabi 2026 presence) | 2 (Core AI agent / CX platform; 'Fastest Growing AI Agent Provider MENA 2026') | 2 (Independent venture-backed; Series B-II US$30M led by Impact46) | **5/8** | **EXCLUDED** on (a) (High confidence) |

### Decision
Whiteshield is admitted to the `uae_cc_v1` watchlist (replacing Cerebras Systems to maintain the mandatory 50-organisation invariant).
- **Lucidya** — excluded (fails criterion (a), HQ Riyadh): founded Aug 2016 Jeddah; HQ relocated to Riyadh (Al Mohammadiyyah, Prince Turki Bin Abdulaziz Al Awwal Rd) in 2019; founders Abdullah Asiri, Hatem Kameli, Mohamed Milyani, Zuhair Khayyat; Dubai office at JLT Cluster R is a branch only; Series B-II US$30M closed 13 Jul 2025 led by Impact46 (Wa'ed Ventures, Takamol Ventures, SparkLabs, Rua Growth Fund, ARG), total ~US$38.43M; 2026: CRO William O'Neill hired, Ai Everything Abu Dhabi 2026 participation, 'Fastest Growing AI Agent Provider MENA 2026'. Sources: en.wikipedia.org/wiki/Lucidya, en.wikipedia.org/wiki/Abdullah_Asiri, cbinsights.com/company/lucidya, linkedin.com/company/lucidya, global.lucidya.com/our-company/investors.
- **Cerebras Systems (`cerebras-uae`)** — excluded (fails criterion (a), US-headquartered chipmaker whose UAE presence is via G42/Core42 partnerships rather than UAE founding or headquarters; previous coverage 54.5%). Full dossier record preserved verbatim with documentation in `qa/2026-10-21-cycle5/laneF/removed-cerebras-uae.json`.
- **Whiteshield (`whiteshield`)** — admitted: website `whiteshield.ai`; primary operating base DIFC, ICD Brookfield Place Dubai; founded 2011 by Fadi Farra (founder & CEO, >75% control per UK PSC filing); sovereign intelligence platforms (XShield, QuantumEd, Quantum Leap, Quantum Navigator) and AI economics; US$15M senior secured private credit facility from Ruya Partners (ADGM) announced Jul 2026; 9 verified sources. Coverage 100% (11/11 fields), confidence 74%.

### Re-run 50-dossier coverage metrics
- Watchlist organisations: **50** (12 government, 20 company, 14 subsidiary, 2 research centre, 2 university).
- Mean field coverage: **73.7%** (up from 72.8% pre-cycle 5; +0.9 pp).
- Organisations with ≥1 verified source URL: **45/50**.
- Organisations with confidence ≥75%: **35/50**.
