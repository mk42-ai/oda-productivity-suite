# 5-agent QA sweep (headless Playwright, 1440×900 + 390×844)
`BASE_URL=https://<preview> SHOT_DIR=proof/qa-<date> ROUND=r1 node scripts/uae/qa/agent1.mjs` (repeat for agents 1–5; they are independent and can run in parallel).
1 branding/disclaimer/residue · 2 watchlist/dossiers/search/filter/compare/logos · 3 Sentiment Universe + source-URL HTTP status · 4 executive chat (5 demo questions) + briefing · 5 OnDemand contracts, loading/error/empty states, perf, original 816aaae unchanged.
Agent 5 needs ON_DEMAND_API_KEY, GITHUB_TOKEN, VERCEL_TOKEN and VERCEL_TEAM_ID in the environment (they are never printed). Results go to `$QA_OUT/results-<agent>-<round>.json` (default /tmp).
