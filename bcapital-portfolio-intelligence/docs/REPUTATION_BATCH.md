# Reputation evidence batch (REP-BATCH-001)

`scripts/batch-correlation.ts` builds the evidence set behind `/reputation` and runs it through the ported correlation engine
(`web/src/lib/reputation/engine/engine.ts`, unchanged) and the app's own scoring (`src/scoring.ts`, unchanged).

```
node node_modules/tsx/dist/cli.mjs scripts/batch-correlation.ts        # npm run batch:correlation
node node_modules/tsx/dist/cli.mjs scripts/test-batch-correlation.ts   # npm run test:batch (>= 3,000 items, 0 NaN, 20 assertions)
```

## Inputs
- `data/correlation/raw/*.jsonl` — per-subject collections (B Capital 185 · Saverin 64 · Ganguly 35 · Mohla 32 · brief seeds 21), each
  `{entity, factor, category, headline, source_url, source_name, published_date, sentiment, related_entity?, reject_reason?, retrieved_at, collector}`.
  Collected from the b.capital WordPress REST API (`/wp-json/wp/v2/posts`, `bc_events`), team pages, Wikipedia references (URL + date only) and the seed press URLs.
- `data/portfolio.sqlite` → `news_items` (2,100 rows; 678 without a date) and `web/src/data/social/social-feed.json` (native posts) for the
  136 portfolio companies, fanned out over 10 round-robin shards processed concurrently.
- The 59 curated factors in `web/src/lib/reputation/data/entities.ts` (3 "not verified" Midas rows are logged as rejects, never scored).

## Pipeline
1. Validate in concurrent chunks of 250 (2 retries each) — reject without URL, without date, invalid URL/date, future or pre-2000 date,
   unknown entity, explicit reject (e.g. `ksmhomes.ca` → `entity_mismatch`, a different Karan Mohla).
2. Normalise dates to ISO with precision (second / day / month / year); canonicalise URLs (no `www`, tracking params, hash, trailing slash).
3. Dedupe: subject + canonical URL + normalised headline, then syndicated headline (≥ 40 chars) across URLs — the most credible copy survives.
4. Weight = source credibility tier (`src/scoring.ts` `credibility()`) × recency half-life (365 d at item level).
5. Wilson lower bound (z = 1.96) per subject and per subject × category; conflicts (same fund, different final figures) are surfaced, not averaged.
6. Engine: every item becomes a `Post` (subject handle, ISO ts with precision, url, category + hashtags, fund/company as shared object,
   related subject as reply target) → `runEngine()` with a 24 h window → edges, Louvain communities, Brandes centrality, matrix.
7. Scores: `scorePortfolio()` over the four subjects → reputation 0–100 (14 d half-life, 90 d window, shrink K = 3, Wilson z = 1.96, z-scored
   across subjects). Prestige index 0–100 = Wilson-lower positive share of prestige-category items × log-saturating prestige mass.

Outputs: `data/correlation/items.jsonl`, `rejects.jsonl`, `conflicts.jsonl`, `summary.json`, `web/src/data/reputation-batch.json` (page payload:
summary + precomputed engine result) and `web/data/reputation-items.json` (rows served by `GET /api/reputation/evidence`, never bundled).

## Run 2026-10-18T03:42:24Z
| ingested | rejected | duplicates | processed | chunks | NaN |
|---|---|---|---|---|---|
| 13,233 | 933 | 236 | 12,064 | 53 | 0 |

Reject reasons: missing_date 928, duplicate_syndicated_headline 208, duplicate_url_headline 28, not_verified 3, entity_mismatch 2.
Timings: ingest_ms 439 ms, validate_ms 151 ms, dedupe_ms 142 ms, conflicts_ms 7 ms, engine_ms 990 ms, scores_ms 44 ms, total_ms 1779 ms.

| Subject | Items | Reputation | Confidence | Prestige | Wilson lower |
|---|---|---|---|---|---|
| B Capital | 11,892 | 52 (balanced) | 0.98 | 81 | 0.409 |
| Eduardo Saverin | 79 | 55 (balanced) | 0.36 | 58 | 0.813 |
| Raj Ganguly | 50 | 55 (balanced) | 0.39 | 27 | 0.895 |
| Karan Mohla | 43 | 38 (soft) | 0.00 | 30 | 0.918 |

4×4 entity matrix (engine edge weight, co-occurrences):

| | B Capital | Eduardo Saverin | Raj Ganguly | Karan Mohla |
|---|---|---|---|---|
| B Capital | — | 0.047 (103) | 0.047 (51) | 0.045 (26) |
| Eduardo Saverin | 0.047 (103) | — | 0.055 (31) | 0.032 (4) |
| Raj Ganguly | 0.047 (51) | 0.055 (31) | — | 0.030 (3) |
| Karan Mohla | 0.045 (26) | 0.032 (4) | 0.030 (3) | — |

Conflicting sources:
- **Ascent Fund II**: $250M (Forbes, 2022-07-20) vs $254M (PE Forum, 2022-07-19) vs $250M (B Capital, 2022-07-19) vs $250M (Tech in Asia, 2022-07-01)
- **First fund**: $360M (Bloomberg, 2018-02-09) vs $143.6M (The Edge Malaysia, 2016-05-01)

Caveats: B Capital carries ~98.6% of items because the portfolio news/social feed is attributed to the firm; reputation scores use a 90-day
window, so the leadership subjects (mostly older, date-only evidence) score on thin recent mass — their confidence is reported alongside.

## Verification — 2026-10-18 (live preview https://sb-55tkqdvqksgm.vercel.run, sandbox sbx_568zkVuip1HuYYWj2MomqTKDaFuo)
| Suite | Local | Live |
|---|---|---|
| test-batch-correlation (≥ 3,000 items, 0 NaN) | 20/20 | 20/20 (in sandbox) |
| reputation-e2e (incl. new batch test) | 10/10 | 10/10 |
| navigation-e2e | 12/12 | 12/12 |
| chat-error-retry / retry-proof | 1/1 · 2/2 | 1/1 · 2/2 |
| live-smoke | — | 28/28 |
| nav-stress | 18/18 | 18/18 in 2 of 4 runs; 16–17/18 in the others (React #418 on /news under 10× back/forward spam) |
| tsc --noEmit / next build | 0 / 0 | 0 / 0 |
| ONDEMAND_API_KEY in .next/static | 0 / 1,760 | 0 / 1,760 |
| POST /api/chat | — | 200, 191-char answer |

Open item: the /news #418 under back/forward spam is not fully eliminated on the live sandbox. A pre-hydration popstate guard
(`web/src/components/shell/popstate-guard.tsx`) turns a history traversal that lands before hydration into a full document load; it removed
the failure locally (18/18) and reduced it live, but a race remains when the traversal happens inside the streamed 1.9 MB /news response.
