# TODO-LATER — DEFERRED — DO NOT RUN THIS RUN

Created 2026-10-14. These items are intentionally deferred and were NOT executed in the
2026-10-14 B Social / mass-pull run.

- [ ] DEFERRED — Check later that all OnDemand workflows use Opus 5.5: audit every
      Flow Builder workflow (daily refresh, pitchbook, media/backup, voice) for its
      endpoint/model config; confirm Opus 5.5 where intended, note any DeepSeek/Qwen
      pinned endpoints that must stay (chat flash + Ask B Social) and why.
- [ ] DEFERRED — Re-check data freshness: verify social-feed generated_at, sentiment
      runs, and news counts are current; re-run refresh if stale; re-check TikTok
      scraper quota reset date (RapidAPI BASIC monthly quota) and Reddit plugin URL
      support before the next mass pull.
- [ ] DEFERRED — Re-attempt POST /chat/v1/batches once OnDemand documents a batch
      operation (2026-10-14: 405 method_not_allowed, no batch slug in live docs).
