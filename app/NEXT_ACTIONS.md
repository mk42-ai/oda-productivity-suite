# NEXT_ACTIONS (priority order) — 2026-10-21T04:42Z
0. **Push** (needs GITHUB_TOKEN with Contents write): `git push origin uae-ai-command-centre` (today's commits: root-dir fix + patches) and `git push origin refs/tags/bcap-pre-uae-20261020T2130Z`. The push will trigger a Vercel git preview that now resolves Root Directory `app` (verify it goes READY instead of NOW_SANDBOX_WORKER_ROOTDIR_NOT_EXIST). Then tag the demo build `uae-cc-demo-20261021`.
1. Set `ONDEMAND_API_KEY` as a Vercel **preview-scoped** env var on project prj_wXz5xY3PNULypuwepaqu1XKa6sP1 for branch `uae-ai-command-centre` only (never production/main) so git previews can reach OnDemand; the project currently has 0 env vars.
2. Disable Vercel Authentication for that preview or share via the sandbox URL; sandbox expires ≈05:47Z — re-run `npm run resume -- --deploy` before the 09:00 GST demo.
3. Re-run QA agent 3 + 5 after each redeploy (`BASE_URL=<preview> node scripts/uae/qa/agentN.mjs`). Agent 5's original-branch check needs GITHUB_TOKEN.
4. Durable write-back of ingest increments (webhook delivery or Vercel Blob/KV) — unchanged from previous turn.
5. Coverage uplift for low-coverage orgs (KATIM, Khalifa University, ASPIRE, CAMB.AI, CNTXT AI, AIATC); Derq: no new research this session (kept, fields 'unavailable').
6. Perf: lazy-load 3D graph and voice stacks on /chat (906 kB first-load JS).
