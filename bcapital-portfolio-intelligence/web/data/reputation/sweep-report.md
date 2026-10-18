# Reputation evidence sweep — report (2026-10-18)

- **Start (ISO 8601 UTC):** 2026-10-18T15:34:53Z
- **Finish (ISO 8601 UTC):** 2026-10-18T17:04:53Z
- **Branch / commit base:** `feat/reputation-graph-engine-20261018` @ `c45e923` (data files only — the application was **not** rebuilt or redeployed)
- **Outputs (web/data/reputation/):** `evidence.json` (6,039 items), `graph.json` (605 nodes / 8,019 edges / 4 registers), `sources.csv` (1,302 domains), this report.

## 1. Per-register counts versus targets

Two counts are given for every register, because they answer different questions. **Kept** is every unique item carrying the register tag after dedup and noise removal. **Text-verified** is the strict subset where the subject's name was actually read in the item's title, excerpt, or the fetched page body — not merely in the query that surfaced it. Targets are compared against *kept*, and the text-verified column is there so nobody mistakes query-bound coverage for confirmed mentions.

| Register | Subject | Target | Kept (unique) | vs target | Text-verified | Query-bound (page unverifiable) | Publisher-scope | Curated / seed |
|---|---|---:|---:|---|---:|---:|---:|---:|
| BCAP-001 | B Capital (firm) | 2,000 | **3,789** | ✅ met | 2,805 | 779 | 187 | 18 |
| BCAP-002 | Eduardo Saverin | 800 | **2,524** | ✅ met | 1,787 | 716 | 0 | 21 |
| BCAP-003 | Raj Ganguly | 600 | **810** | ✅ met | 672 | 134 | 0 | 4 |
| BCAP-004 | Karan Mohla | 500 | **393** | ❌ short by 107 | 320 | 68 | 0 | 5 |
| **Total** | unique items (an item may carry several registers) | ≈4,000 | **6,039** | ✅ met | 4,212 | 1,602 | 187 | 38 |

Register sum (7,516) exceeds total unique (6,039) because 1,150 items carry two or more registers (848 with 2, 277 with 3, 25 with all 4).

### Honest shortfall notes

- **BCAP-004 Karan Mohla — 393 kept vs 500 target (short by 107); 320 text-verified.** This is a real-coverage shortfall, not a collection failure, and it was not padded. Karan Mohla's public footprint is concentrated in Indian startup press (YourStory, Inc42, Entrackr, VCCircle, Moneycontrol, Economic Times, Livemint, Business Standard) over 2014–2026, mostly as a quoted investor in portfolio funding rounds (Chiratae / IDG Ventures India era, then B Capital Ascent). We ran 4 query families × 24 six-month windows × 3 Google News editions (US/IN/SG), 4 Bing markets, GDELT per year 2017–2026, 32 `site:` host restrictions and portfolio-company name queries (SolarSquare, Pando, Locale.ai, CoinDCX, Lenskart, Vserv…). Raw collector rows for the register were 1,322 before dedup; after canonical-URL dedup (the same Economic Times story appears as economictimes.indiatimes.com / m.economictimes.com / timesofindia variants), off-topic removal (Bigg Boss / Karan Johar / Kiara Advani hits on the bare word 'Karan') and page verification (Google-News hits whose fetched page does not contain 'Mohla' were dropped), 393 unique items remain. Closing the remaining gap needs sources we could not reach from this runtime: LinkedIn post/activity archives (HTTP 999), paywalled ET Prime / Mint Premium / Business Standard Premium bodies (403), and podcast transcripts behind Spotify/Apple (feeds 404).

- **BCAP-003 Raj Ganguly — 810 kept vs 600 ✅ (672 text-verified).** Met on both counts after the dated top-up sweep (+656 raw rows).
- **BCAP-002 Eduardo Saverin — 2,524 kept vs 800 ✅ (1,787 text-verified).** Comfortably met; 287 film-noise items (The Social Network / The Social Reckoning / Artificial / Andrew Garfield / Sorkin / Eisenberg, sequels, parodies) were dropped before counting.
- **BCAP-001 B Capital — 3,789 kept vs 2,000 ✅ (2,805 text-verified).** Met. 187 of these are *publisher-scope* items (b.capital team, portfolio-company, guest-author and static pages plus Wayback snapshots) — B Capital's own publications, tagged BCAP-001 without needing the string in the body.

## 2. Dedup & filtering statistics

| Stage | Count |
|---|---:|
| Raw records fetched across all collectors (incl. the pre-existing 16,368-row batch corpus minus its 10,274 portfolio-social posts, which never name a subject) | 14,916 |
| Dropped — no usable URL / non-200 collector fetch | 49 |
| Dropped — no subject mention where a text mention was required (portfolio newsrooms, press wires, portfolio news, non-name-bound queries) | 2,401 |
| Dropped — film noise (The Social Network, The Social Reckoning, Artificial, Andrew Garfield, Sorkin, Eisenberg, sequel/parody items) | 287 |
| Duplicates merged by canonical URL (provenance of every duplicate preserved on the survivor) | 5,476 |
| Query-bound items whose fetched page (≥500 chars) named **no** subject — dropped | 645 |
| Query-bound items unverifiable (403/401/999/429/timeout) and off-topic by title or surfaced only by an unquoted query — dropped | 19 |
| **Kept (unique canonical URLs)** | **6,039** |

Page-level verification: 4,867 query-bound items were fetched live (20 workers, 12 s timeout); 2,601 were promoted to `text` because the page body names the subject; 1,602 could not be fetched (paywall / anti-bot: 1,008 × 403, 101 × 401, 78 × LinkedIn 999, 53 × 429, 122 timeouts) and remain tagged `match_basis: query` so consumers can filter them. Date conflicts: 707 items have two or more published dates from different extractors — all are kept under `published_at_conflicts[]` with their source; nothing was averaged. 25 items have no date. 1,690 items carry an author, 3,565 a text excerpt.

### Canonicalisation
- http→https; `www.`/`amp.` prefixes, `/amp` suffixes, fragments, trailing slashes and `:80` stripped; `utm_*`, `fbclid`, `gclid`, `ref`, `source`, `_branch_match_id` etc. removed; query strings dropped entirely on x.com / reddit / linkedin / instagram.
- Google News RSS links: 5,355 opaque `news.google.com/rss/articles/<id>` ids were resolved to the publisher URL (older `CBMi…` ids by base64, newer ids through Google's `batchexecute` decoder); 5,027 resolved through the decoder and the remaining legacy ids through base64 — 0 opaque `news.google.com` URLs survive in the output.
- Bing News `apiclick.aspx?url=` redirects unwrapped to the target URL.

## 3. Source breakdown

**Platforms (kept items):** web 5,197, linkedin 355, press-wire 253, podcast 159, video 75. **Distinct domains:** 1,302 (one row each in `sources.csv`: domain, platform, item_count, registers, first_published, last_published).

| Collector family (extractor) | Kept items | Notes |
|---|---:|---|
| google-news-rss | 2,615 | turn-3 batch sweep, Google News RSS windows 2015–2026 |
| expansion-google-news-rss | 1,959 | Subagent C expansion: subject × 32 site: hosts, 6-month windows × US/IN/SG editions |
| gdelt-doc-2.0 | 877 | GDELT DOC 2.0 artlist, batch sweep |
| expansion-bing-news-rss | 297 | Bing News RSS, 4 markets |
| bing-news-rss | 202 | batch sweep Bing |
| curated-batch | 179 | 59 curated factors + verified seeds already in the app |
| bcapital-wp-companies | 135 | b.capital WP REST /companies (portfolio registry pages) |
| wayback-archive | 116 | Wayback CDX for b.capital/*, bcapgroup.com, medium.com/b-capital-group → 116 removed/old pages fetched from snapshots |
| bcapital-wp-team | 91 | b.capital WP REST /team |
| bcapital-wp-guest-author | 41 | b.capital guest-author pages |
| expansion-gdelt-doc-2.0 | 37 | GDELT per-year, Mohla/Ganguly top-up |
| bcapital-sitemap | 33 | sitemap_index.xml → 4 child maps, 399 URLs |
| brief-seeds | 31 | seed URLs from the brief |
| press-wire | 31 | PRNewswire/BusinessWire/GlobeNewswire/Accesswire/EIN searches, text-mention required |
| subject-seed-related | 24 | depth-1 related/author links from seeds |
| bcapital-wp-page | 13 | b.capital static pages |
| portfolio-newsroom | 9 | 137-company newsroom/press/blog crawl, text-mention required |
| portfolio-news | 6 | portfolio news items from the batch corpus that name a subject |
| subject-seed | 5 | Subagent C seed pages fetched directly |
| newsapi | 1 | legacy |
| bcapital-wp-post | 1 | b.capital posts (only 1 not already in the batch corpus) |

**Top 25 domains**

| Domain | Platform | Items | Registers | First | Last |
|---|---|---:|---|---|---|
| b.capital | web | 495 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2015-10-05 | 2026-10-18 |
| linkedin.com | linkedin | 240 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2014-07-03 | 2026-10-16 |
| forbes.com | web | 195 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2010-09-22 | 2026-10-15 |
| medium.com | web | 184 | BCAP-001|BCAP-002|BCAP-003 | 2010-10-27 | 2026-10-05 |
| techcrunch.com | web | 155 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2010-09-21 | 2026-09-30 |
| yourstory.com | web | 153 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2012-12-17 | 2026-07-23 |
| bloomberg.com | video|web | 150 | BCAP-001|BCAP-002|BCAP-003 | 2012-05-11 | 2026-10-17 |
| businesswire.com | press-wire | 135 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2016-03-21 | 2026-09-30 |
| inc42.com | web | 119 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2015-01-19 | 2026-10-07 |
| prnewswire.com | press-wire | 113 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2015-12-17 | 2026-10-14 |
| entrackr.com | web | 107 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2017-09-28 | 2026-07-11 |
| fortune.com | web | 103 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2011-01-11 | 2026-10-09 |
| livemint.com | web | 97 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2010-04-02 | 2026-10-09 |
| vccircle.com | web | 94 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2011-07-18 | 2026-08-10 |
| moneycontrol.com | web | 91 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2011-07-19 | 2026-10-12 |
| straitstimes.com | web | 90 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2015-02-09 | 2026-09-03 |
| techinasia.com | web | 79 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2012-05-08 | 2026-07-23 |
| wsj.com | web | 75 | BCAP-001|BCAP-002|BCAP-003 | 2010-09-27 | 2026-10-09 |
| businesstimes.com.sg | web | 74 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2015-06-17 | 2026-10-09 |
| business-standard.com | web | 70 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2014-07-28 | 2026-09-10 |
| cnbc.com | video|web | 69 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2011-03-31 | 2026-10-07 |
| economictimes.indiatimes.com | web | 68 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2015-01-18 | 2026-10-16 |
| dealstreetasia.com | web | 68 | BCAP-001|BCAP-002|BCAP-003|BCAP-004 | 2015-01-21 | 2026-08-31 |
| businessinsider.com | web | 61 | BCAP-001|BCAP-002|BCAP-003 | 2012-05-11 | 2026-09-08 |
| reuters.com | web | 52 | BCAP-001|BCAP-002|BCAP-003 | 2011-01-21 | 2026-08-10 |

**Top domains per register**

- BCAP-001 B Capital (firm): b.capital (491), linkedin.com (145), businesswire.com (119), techcrunch.com (116), yourstory.com (115), medium.com (111), prnewswire.com (107), inc42.com (102), entrackr.com (100), forbes.com (99)
- BCAP-002 Eduardo Saverin: forbes.com (129), bloomberg.com (112), straitstimes.com (86), medium.com (80), linkedin.com (78), techcrunch.com (62), wsj.com (56), businesstimes.com.sg (53), businessinsider.com (47), economictimes.indiatimes.com (46)
- BCAP-003 Raj Ganguly: linkedin.com (82), b.capital (35), m.economictimes.com (24), forbes.com (21), businesswire.com (21), vccircle.com (21), cnbc.com (19), bloomberg.com (18), economictimes.indiatimes.com (17), medium.com (17)
- BCAP-004 Karan Mohla: linkedin.com (56), yourstory.com (34), b.capital (29), business-standard.com (20), inc42.com (19), in.linkedin.com (18), livemint.com (17), m.economictimes.com (14), vccircle.com (14), moneycontrol.com (12)

**Items by publication year (all registers)**

| 2009 | 2010 | 2011 | 2012 | 2013 | 2014 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 | unda |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2 | 22 | 23 | 125 | 20 | 61 | 154 | 169 | 401 | 209 | 370 | 325 | 672 | 530 | 455 | 512 | 736 | 1228 | 25 |

Per register, 2015-01-01 → 2026-10-18 only: BCAP-001 3,768, BCAP-002 2,325, BCAP-003 787, BCAP-004 376. Items dated before 2015 (mostly Saverin/Facebook-era and IDG Ventures India coverage) are kept because they carry provenance and a real date, but they fall outside the brief's window.

## 4. Graph

Built with `scripts/build-reputation-evidence-graph.ts`, which imports `runEngine` from `web/src/lib/reputation/engine/engine.ts` — the Rilian co-occurrence port already serving `/reputation`. The weight formula is the app's own (`edgeWeight = min(1, log2(1+pairs)/log2(9) × clamp(mean idf/idfMax, 0.5, 1) × precision ÷ (1+syndicationShare))`, IDF generic cut-off df/n>0.2, precision 1/0.8/0.4/0.1 with same-day cap 0.1); no new formula was introduced. Params: window 86,400 s, minWeight 0.02, textThreshold 0.6, keepIsolates, minimum 2 items per member node, ≤60 posts per member node and ≤600 per register hub.

| Metric | Value |
|---|---:|
| Items ingested | 6,039 |
| Posts fed to the engine | 7,201 |
| Nodes (4 register hubs + 601 member nodes) | 605 |
| Edges | 8,019 |
| Hub edges (touching a register subject) | 976 |
| Isolates kept | 55 |
| Louvain communities / modularity | 8 / 0.305 |
| Trail-invariant violations | 0 |
| Engine time | 1830 ms |

Node kinds: publisher 545, podcast 24, linkedin-account 9, press-wire 9, author 7, video 7, subject 4. Glyphs (platform): web 552, podcast 24, linkedin 9, press-wire 9, video 7, subject 4. Member nodes per register: BCAP-001 244, BCAP-002 237, BCAP-003 88, BCAP-004 36.

Edge modes observed: co-hashtag 7,615, co-share 3,266, co-text 1,157, co-link 1,003, co-reply 670. Weight range 0.021–0.755. Every edge carries `weight, co_occurrences, min_delta_t, syndication_share, evidence_trail[] (≤24 evidence ids), shared_objects[] (≤8 of mode/object/evidence_a/evidence_b/delta_seconds)`; every node carries `size = evidence_count`, `glyph`, `platform`, `register`, `evidenceIds[]`, degree / weighted_degree / betweenness / community. All evidence ids referenced by nodes resolve in `evidence.json` (0 missing).

Strongest edges: timesofindia.indiatimes.com·b capital ↔ timesofindia.indiatimes.com·saverin (w 0.755, 9 co-occ.); businesswire.com·b capital ↔ businesswire.com·ganguly (w 0.732, 9 co-occ.); economictimes.indiatimes.com·b capital ↔ economictimes.indiatimes.com·saverin (w 0.702, 43 co-occ.); finance.yahoo.com·b capital ↔ finance.yahoo.com·ganguly (w 0.695, 8 co-occ.); livemint.com·b capital ↔ livemint.com·saverin (w 0.69, 19 co-occ.); dealstreetasia.com·b capital ↔ dealstreetasia.com·saverin (w 0.674, 25 co-occ.); business-standard.com·b capital ↔ business-standard.com·saverin (w 0.667, 18 co-occ.); businessinsider.com·b capital ↔ businessinsider.com·saverin (w 0.667, 7 co-occ.).

## 5. Collector log & blockers (per subagent)

Note: the `delegate` tool is not available in this runtime, so the three source families ran as three parallel background collector processes driven by the main agent rather than as separate LLM subagents; the decomposition, rules and outputs are as specified.

- **A — b.capital archive:** WP REST (`/wp-json/wp/v2/` posts 150, pages 20, team 94, companies 135, guest-author 41, bc_events 6), `sitemap_index.xml` → 399 URLs, news-and-insights pagination (19 pages), team pages incl. Ganguly / Saverin / Mohla / Morgan / Jackson, Wayback CDX 4,381 historical captures of b.capital/*, bcapgroup.com and medium.com/b-capital-group → 123 non-live URLs, 116 recovered from snapshots. Fund-close releases (Fund II $820M 2020-06-30, Ascent II $250M 2022-07-19, Growth III $2.1B 2023-01-19, Healthcare I $500M 2023-03-01, Opportunities II $750M 2024-03-19, Ascent III 2026) are present through the batch corpus and press wires. **Blocked:** medium.com/b-capital-group direct (403/404 — recovered via Wayback only).

- **B — portfolio newsrooms + databases:** 136 company domains × RSS / sitemap / news / press / blog probes (8 workers, 8 s timeout) → 107 candidate pages, 9 kept after the text-mention rule; press-wire searches 1,152 raw → 31 kept. **Blocked:** Crunchbase 403, PitchBook 403, BusinessWire search 403 (wire items reached via Google/Bing instead), Dealroom 200 but JS-rendered (no extractable items), evommune.com and khatabook.com newsrooms timed out. The strict rule 'keep only items whose text names B Capital / Saverin / Ganguly / Mohla' is why this family is small — most portfolio press releases do not name the investor.

- **C — per-subject press / podcasts / LinkedIn:** ~75 seed URLs per subject (129 fetched; Bloomberg, BCG, Fortune, Business Times 403/404), depth-1 related links, Google News RSS × 32 `site:` hosts, Bing × 4 markets, GDELT per year, plus the dated 6-month-window top-up for Mohla/Ganguly (US/IN/SG editions). Podcast feeds (LA Venture, Fintech Leaders Substack, Apple/Spotify) returned 403/404; podcast coverage therefore comes from show pages surfaced by search (159 podcast-platform items).

## 6. Schema notes
- Every item: `{id, canonical_url, title, source, author, published_at, platform, text_excerpt, hashtags[], links[], mentions[], registers[], match_basis, provenance[{source_url, fetched_at, extractor, family}], published_at_conflicts?[], page_verification?}`.
- `match_basis` ∈ `text` (subject named in title / excerpt / page body), `query` (surfaced by a quoted subject-name query, page unverifiable), `publisher-scope` (B Capital's own site / archive), `curated`, `seed`.
- `graph.json`: `{run_id, generated_at, engine, params, registers[4], nodes[], edges[], communities, modularity, isolates, stats}`.
