# B Capital Monthly PitchBook Sync

| | |
| --- | --- |
| Workflow ID | `6acda4fa9a17f57debac8ad5` (Agents Flow Builder, created `2026-10-13T03:26:51Z`, activated `2026-10-13T03:26:55Z`, `isActive: true`) |
| Name | `B Capital Monthly PitchBook Sync` |
| Schedule | cron `0 0 6 1 * *` — Flow Builder uses a **6-field** expression ("the left most place represents seconds"), i.e. 5-field `0 6 1 * *`: **1st of every month at 06:00 UTC**. Next run **2026-11-01T06:00:00Z** (computed; `GET /workflow/{id}` exposes no next-run field). |
| Definition | `workflows/b-capital-monthly-pitchbook-sync.json` (secret redacted as `<INGEST_SECRET>`); creation/activation/validation record in `workflows/b-capital-monthly-pitchbook-sync.created.json` |
| Builder | `tsx workflows/monthly-pitchbook-batch.ts plan | create | execute` |
| API contract used | live docs 2026-10-13 — `POST https://api.on-demand.io/automation/api/workflow/` (201 `{id}`), `POST /workflow/{id}/activate` (200), `GET /workflow/{id}` (`isActive`, `trigger.cron.expression`), `POST /workflow/{id}/execute` (200 `{executionID}`), `GET /execution/{executionID}` (`status`, `startedAtInMilliseconds`, `endedAtInMilliseconds`), `GET /execution/{executionID}/logs`; header `apikey` |

## Steps

The Flow Builder graph is deliberately thin — one `llm` kickoff node (Flow Builder requires ≥ 1 node) whose output is delivered by **webhook** to
`POST {API_BASE}/pitchbook/batch/webhook` (Basic auth `ingest:<INGEST_SECRET>`), plus an **email** delivery to `mk@airev.ae`. The API runs steps a–e
server-side (`src/pitchbook-batch.ts` → `startMonthlySync`), so the pull, the upsert and the backup use exactly the same code as the step 3 run:

| Step | What runs | Where |
| --- | --- | --- |
| a | Load the deduplicated B Capital Group (PitchBook investor **155248-48**) portfolio: `data/portfolio.json` (firm row excluded) joined with `data/pitchbook/match-table.json`; dedupe by `companyId`/pbId, then by normalised name (parentheticals such as "Dream Labs (Business/Productivity Software)" / "Axiom (Palo Alto)" stripped; "Port One Solutions" ≡ "PortOne") → **136 unique companies** (109 with stored ids, 27 by name + website domain) | `buildTargets()` |
| b | Re-run the batch pull with `plugin-1777018662` **getCompanyProfile**. `POST /chat/v1/batches` is probed first; while it answers **405 "Chat batch creation is currently unavailable"** the pull is a client-side batch of documented single sync queries (`POST /chat/v1/sessions` + `POST /chat/v1/sessions/{id}/query`, polling `GET …/messages/{messageId}` only while `processing`) under a local batch id `pbb-<UTC>-<hex>`; **up to 4 attempts per company** (retries at 2 s / 8 s / 30 s on 429 / 5xx / timeouts / empty answers), concurrency 4, 250 ms spacing | `runPitchbookBatch()` |
| c | **Latest-first upsert** into `pitchbook_company_profiles`: newest pull wins per field, each leaf keeps `{source: "pitchbook", batch_id, query_id, fetched_at}` + the PitchBook profile link; null / [] / 404 sections stay the literal **"Not available in PitchBook"**; no match after the retry budget → **"Unmatched in PitchBook"** (Turno); a populated field is never overwritten by an empty state and a populated profile is never replaced by an unmatched one. Every attempt is stored in `pitchbook_batch_queries`, the run in `pitchbook_batch_runs` | `mergeLatestFirst()` |
| d | SHA-256-verified snapshot to OnDemand Media, same convention as `20261013T024931Z` (`b-social-snapshot-<UTC>.sqlite.gz.b64.txt` + ndjson + csv + manifest; each file fetched back and checksummed) — media ids + checksums go to the `backups` table and the run log | `runBackup("monthly-pitchbook-sync")` |
| e | Counts: companies queried / succeeded / failed-unmatched / retried, fields populated, explicit "Not available" count, duration, batch id, snapshot id + sha256 | `GET /pitchbook/batch/status` |

## Reference counts (step 3 run, baseline the monthly sync upserts onto)

Batch `pbb-20261013T020532-3a5c45`, 2026-10-13T02:05:32Z → 02:49:17Z: 158 queries, **135 / 136 populated**, 1 unmatched (Turno, 4 attempts), 0 permanent failures,
**2,896** populated leaves, **1,289** explicit "Not available in PitchBook", Media snapshot **20261013T024931Z** (sqlite media `6acd9c415d7b1c473483fb41`).

## Validation execution

`POST /workflow/6acda4fa9a17f57debac8ad5/execute` → execution `6acda5079a17f57debac8ad9` (triggered 2026-10-13T03:27:04Z, Flow Builder status `success`,
8.5 s: kickoff node + "output delivery completed successfully"). The webhook delivery started the server-side sync at 03:27:12Z — batch `pbb-20261013T032712-bec465`,
136 queried / 134 succeeded / 1 failed (evidation-health, `fetch failed`, earlier profile kept) / 1 unmatched (Turno) / 2 retried (524, 520), batch done 03:55:12Z;
latest-first upsert kept earlier values on 35 companies; store after: **135 populated / 1 unmatched, 3,017 populated fields, 1,168 explicit "Not available in PitchBook"**.
Step d inside the sandbox hit `media upload HTTP 524` on the 60 MB sqlite part; the retry from the workspace produced snapshot
**`20261013T040637Z`** (sqlite media `6acdae53cf3ee6ce347396d3`, sha256 `d2574768d1d2e01b5791e58b512eaaeec970bacfd426c0e9dd63c80c568502b0`, all 4 files verified).
Full record: `b-capital-monthly-pitchbook-sync.created.json` → `server_side_run`.

## Re-pointing

Sandboxes are ephemeral: when the API moves, re-run `API_BASE=<new api url> INGEST_SECRET=… ONDEMAND_API_KEY=… tsx workflows/monthly-pitchbook-batch.ts create`
— it PATCHes the existing workflow (matched by exact name) and re-activates it.
