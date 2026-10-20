Transforms the latest functional build (816aaae, rollback tag `bcap-pre-uae-20261020T2130Z`) into the **UAE AI National Intelligence Command Centre — Concept Demonstration** (not an official government system).

- Concept identity (no government logo; identity check OFFICIAL_ASSET_NOT_PERMITTED / NOT_FOUND), persistent disclaimer, light/dark, retina assets
- Fresh data namespace `uae_cc_v1`: 50 org dossiers (mean coverage 72.4%), 159 OnDemand-classified public statements, 91 news events, 161 relationships, 153 HF models
- Surfaces: National Overview, Watchlist + dossiers + compare, Sentiment Universe, News Intelligence, Tech Radar, Ecosystem Graph, Executive Chat (verified facts vs interpretation), National AI Briefing, Methodology
- Preserved: virtualized thinking/activity, rAF-coalesced stream store, scroll anchoring, perf metrics, /docs/interactive-ui, Playwright/perf recorder, credits failure path, run rail, ONDEMAND SETTINGS
- Purge: residual scan (code + rendered DOM + network) = 0 hits
See ARCHITECTURE_MAP.md, API_HEALTH.md, QA_REPORT.md, RESEARCH_COVERAGE.md.

## Update 2026-10-20T23:50Z — durable workflows + 5-agent QA
- 3 OnDemand Agents Flow Builder cron workflows created and **active**: ingest `6ad7f32d5e60695bc4d052cb` (`0 0 */2 * * *`), National AI Briefing `6ad7f32e5e60695bc4d052d2` (`0 30 2 * * *` = 06:30 GST) and checkpoint `6ad7f32e5e60695bc4d052d7` (`0 */30 * * * *`). All three executed successfully; the checkpoint also fired on its own schedule at 23:30:00Z.
- `GET /api/uae/live` and an Overview "Live pipeline" panel read the latest executions, with provenance on every record. The Briefing page shows the latest scheduled briefing.
- `npm run resume` is an idempotent resume script; `npm run workflows` manages the workflows.
- QA: 5 Playwright agents at 1440×900 + 390×844. Round 1 passed 76/84; after fixes (brand line, retired previous-tenant plugin filtered from /api/plugins, pulse 24h/7d/30d, 2 dead source URLs disabled, compare-tray padding) round 2 passed **84/84**. Details are in QA_REPORT.md; screenshots are in `proof/qa-20261020/`.
- Original build at 816aaae is unchanged (branch, tag and Vercel project verified).
