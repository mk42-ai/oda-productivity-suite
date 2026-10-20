# NEXT_ACTIONS (priority order) — 2026-10-20T23:50Z
1. **Before the 09:00 GST demo (05:00Z):** the preview sandbox expires ≈04:10Z. Run `npm run resume -- --deploy` (or `scripts/resume-mission.sh deploy`) at ~07:30 GST, then re-run QA agent 1 + 4 (brand + chat) against the new URL. Update `MISSION_STATE.json → new.preview_url`.
2. Check the 00:00Z / 02:00Z ingest fires and the 02:30Z briefing fire. Use `npm run workflows -- status` or the Overview "Live pipeline" panel. The scheduled (cron) runs of ingest and briefing are NOT yet observed. Only manual API runs and the checkpoint cron have been verified.
3. Durable write-back: add an authenticated webhook delivery (`delivery[].channel = "webhook"`, documented in post_workflow), or have a permanent app poll and write ingest increments into a real store (Vercel Blob/KV). This turns the execution-store reads into persisted uae_cc_v1 rows. It needs a permanent deployment URL, and sandbox URLs rotate.
4. Permanent deployment of `uae-ai-command-centre/` as its own Vercel project. Do NOT reuse `bcapital-portfolio-intelligence-8zsb` (its framework is `services` and must stay untouched).
5. Merge/review the PR, then re-run the preserved `e2e/` Playwright specs after refreshing selectors that still target the pre-UAE chat UI.
6. Native social ingestion (the X MCP plugin is inactive upstream) and coverage uplift for the 6 low-coverage orgs (KATIM, Khalifa University, ASPIRE, CAMB.AI, CNTXT AI, AIATC).
7. Perf: `/chat` first-load JS is 906 kB. Lazy-load the 3D graph and voice stacks.
