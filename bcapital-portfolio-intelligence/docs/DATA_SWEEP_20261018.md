# DATA_SWEEP_20261018 — mass news sweep for the four /reputation subjects

Run: 2026-10-18 12:29Z → 2026-10-18T13:28:51Z · collectors: Google News RSS (sliding 6-month + 3-month windows, 2015-01-01 → 2026-10-18, en-US/IN/SG/GB, `when:5y/10y`), Bing News RSS (`format=rss&count=100`, 4 markets), GDELT DOC 2.0 (`mode=artlist&maxrecords=250&format=json`, quarterly windows 2017→2026, ≤ 1 request / 6.5 s — the API answers 429 above that), b.capital sitemap index (post/page/team/companies maps, 399 URLs), NewsAPI seeds + the brief's curated URLs. Wayback CDX (`web.archive.org/cdx/search/cdx`) refused the connection from this runner (curl exit 000) and yielded nothing. Headless-Chrome publisher search pages were not run (no browser budget left after the suites).

## Pipeline
1. `collect.py` → `/tmp/sweep/raw/*.jsonl` (raw RSS/JSON rows per subject + per-request `_meta` lines).
2. `normalise.py` → `data/correlation/raw/sweep-<subject>.jsonl` in the batch RawItem schema: `{entity, category, headline, source_url (canonical), canonical_url, original_url, source_name, published_date (ISO-8601), excerpt, entities[], hashtags[], links[], sentiment, language, retrieved_at, related_entity}`. Google News redirect ids are base64-decoded to the publisher URL where the id carries one; canonical = https, no www, tracking params stripped, no trailing slash. Dedupe inside the sweep = sha1(canonical URL + normalised title) OR sha1(publisher + normalised title). Multi-subject items are attributed to EVERY matching subject (one row per subject, `related_entity` set).
3. `scripts/batch-correlation.ts` (unchanged pipeline) ingests `raw/*.jsonl` + the 59 curated factors + the portfolio news/social fan-out → validates → dedupes again (URL+headline, syndicated headline) → ported engine → `web/data/reputation-items.json` + `web/src/data/reputation-batch.json`.
4. `scripts/build-reputation-graph.ts` (new) → `web/data/reputation-graph.json` for the interactive canvas (see below).

## Collector yields (rows fetched → kept after the in-sweep dedupe)
| raw file | rows | requests | HTTP 200 |
|---|---|---|---|
| `bcapital-sitemap.jsonl` | 399 | — | — |
| `bing-b-capital.jsonl` | 35 | — | — |
| `bing-eduardo-saverin.jsonl` | 184 | — | — |
| `bing-karan-mohla-extra.jsonl` | 169 | — | — |
| `bing-karan-mohla.jsonl` | 21 | — | — |
| `bing-raj-ganguly-extra.jsonl` | 201 | — | — |
| `bing-raj-ganguly.jsonl` | 45 | — | — |
| `gdelt-eduardo-saverin.jsonl` | 1118 | 40 | 14 |
| `gdelt-karan-mohla.jsonl` | 8 | 7 | 2 |
| `gdelt-raj-ganguly.jsonl` | 245 | 40 | 17 |
| `gnews-b-capital-extra.jsonl` | 5889 | — | — |
| `gnews-b-capital.jsonl` | 2814 | 288 | 288 |
| `gnews-eduardo-saverin-extra.jsonl` | 2821 | — | — |
| `gnews-eduardo-saverin.jsonl` | 1882 | 192 | 192 |
| `gnews-karan-mohla-extra.jsonl` | 793 | — | — |
| `gnews-karan-mohla-extra2.jsonl` | 944 | — | — |
| `gnews-karan-mohla-extra3.jsonl` | 1382 | — | — |
| `gnews-karan-mohla.jsonl` | 222 | 144 | 144 |
| `gnews-raj-ganguly-extra.jsonl` | 2213 | — | — |
| `gnews-raj-ganguly-extra2.jsonl` | 2901 | — | — |
| `gnews-raj-ganguly-extra3.jsonl` | 2998 | — | — |
| `gnews-raj-ganguly.jsonl` | 413 | 144 | 144 |

In-sweep dedupe: 27,404 rows seen → 22,867 dropped as duplicates (canonical URL / publisher+title), 5 off-subject, 348 multi-subject copies added. Kept per collector: bing-news-rss 350, gdelt-doc-2.0 1349, google-news-rss 2984, newsapi 3, brief-seeds 47, bcapital-sitemap 152.

## Batch (scripts/batch-correlation.ts) — old vs new
| | old (f049349) | new |
|---|---|---|
| ingested | 13,233 | 18,118 |
| rejected | 933 | 933 |
| deduped | 236 | 817 |
| processed (evidence items) | 12,064 | 16,368 |
| news items (processed − portfolio-social) | 1,777 | **6,094** |
Reject reasons: missing_date 928, entity_mismatch 2, not_verified 3, duplicate_syndicated_headline 672, duplicate_url_headline 145 (the 928 `missing_date` rows are the portfolio social posts without a timestamp — unchanged from the previous batch).

### Per subject
| subject | old | new | target | status |
|---|---|---|---|---|
| b-capital | 11,892 | **13,790** | remainder | ✔ |
| eduardo-saverin | 79 | **1,902** | ≥ 1,500 | ✔ |
| raj-ganguly | 50 | **494** | ≥ 600 | ✗ below target |
| karan-mohla | 43 | **182** | ≥ 400 | ✗ below target |

### Per category
| category | old | new |
|---|---|---|
| portfolio-social | 10,287 | 10,274 |
| media-sentiment | 43 | 2,313 |
| portfolio-news | 1,327 | 1,327 |
| aum-fund-size | 54 | 802 |
| track-record | 25 | 434 |
| rankings | 11 | 391 |
| thought-leadership | 178 | 366 |
| exits | 36 | 162 |
| network | 36 | 146 |
| ipos | 28 | 114 |
| geography | 10 | 10 |
| unicorns | 9 | 9 |
| risk-controversy | 9 | 9 |
| sector-leadership | 5 | 5 |
| co-investor-lp-quality | 3 | 3 |
| founder-references | 2 | 2 |
| board-seats | 1 | 1 |

### Per subject × category (new)
- **b-capital**: portfolio-social 10274, portfolio-news 1327, media-sentiment 808, aum-fund-size 555, track-record 273, thought-leadership 216, exits 97, network 78, ipos 74, rankings 72, unicorns 9, co-investor-lp-quality 3, sector-leadership 2, geography 1, risk-controversy 1
- **eduardo-saverin**: media-sentiment 1179, rankings 307, aum-fund-size 137, track-record 85, thought-leadership 75, exits 49, network 34, ipos 26, risk-controversy 8, geography 1, founder-references 1
- **raj-ganguly**: media-sentiment 245, aum-fund-size 80, track-record 50, thought-leadership 49, network 28, exits 14, rankings 9, ipos 8, geography 7, sector-leadership 2, board-seats 1, founder-references 1
- **karan-mohla**: media-sentiment 81, aum-fund-size 30, track-record 26, thought-leadership 26, ipos 6, network 6, rankings 3, exits 2, geography 1, sector-leadership 1

## Correlation over the enlarged corpus
- 4×4 subject matrix (engine weights): [[1, 0.342, 0.328, 0.272], [0.342, 1, 0.353, 0.34], [0.328, 0.353, 1, 0.298], [0.272, 0.34, 0.298, 1]] · counts [[0, 2439, 1549, 298], [2439, 0, 803, 158], [1549, 803, 0, 48], [298, 158, 48, 0]] (old weights topped out at 0.055).
- Interactive graph (`build-reputation-graph.ts`, ported engine unchanged, window 86 400 s, min weight 0.02): 247 nodes (243 publisher / account / company nodes + 4 subject hubs), 2,723 edges (291 touch a subject hub), 5 isolates, trail-invariant violations 0. Registers: B Capital 13,790 items / 154 nodes; Eduardo Saverin 1,902 items / 66 nodes; Raj Ganguly 494 items / 21 nodes; Karan Mohla 182 items / 6 nodes.

## Targets
- ≥ 4,000 unique news items about the four subjects: **6,094 ✔** (plus the untouched 10,274 portfolio social posts; nothing from the previous 12,064 was dropped — the previous batch is a strict subset after re-dedupe: 12,064 → 16,368).
- Eduardo Saverin ≥ 1,500: **1,902 ✔**.
- Raj Ganguly ≥ 600: **494 ✗** — Google News (US/IN/SG/GB, 10 years, 90+ phrasings), Bing News (4 markets) and GDELT were exhausted for the exact name; the remaining public coverage of Raj Ganguly is syndicated copies of the same ~500 stories (22,867 duplicates dropped across the sweep).
- Karan Mohla ≥ 400: **182 ✗** — same exhaustion (Indian business press indexes ~180 distinct stories naming him; the rest are duplicates / press-release mirrors).

Re-run: `python3 collect.py gnews|gdelt|bing|extra|more|more2|bingmore|bingmore2|sitemap` (`scripts/sweep-collect.py` + `scripts/sweep-normalise.py`; the normalised output is committed under `data/correlation/raw/sweep-*.jsonl`), then `node node_modules/tsx/dist/cli.mjs scripts/batch-correlation.ts && node node_modules/tsx/dist/cli.mjs scripts/build-reputation-graph.ts`.
