# API_HEALTH — OnDemand (verified with real calls)

## A. Agents Flow Builder — durable scheduled workflows (2026-10-20T22:55Z → 23:44Z)
Live docs used: `GET /config/v1/public/docs/categories` returned 6 services (Media, Services, MQTT User Mgmt, Projects Mgmt, **Agents Flow Builder (19 ops)**, **Chat (7 ops)**). Specs read via `GET /config/v1/public/docs/reference/api/<slug>`:
`post_workflow`, `get_workflow`, `get_workflow-id`, `patch_workflow-id`, `post_workflow-id-activate`, `post_workflow-id-deactivate`, `post_workflow-id-execute`, `get_execution-list`, `get_execution-executionid`, `get_execution-executionid-logs`, `get_execution-executionid-node-outputs`, `createchatsession`, `submitquery`, `fetchmedia`, `createmediaurl`. Server `https://api.on-demand.io/automation/api`, header `apikey`.
**There is no streaming log endpoint in the public docs.** "Stream workflow logs" is implemented by polling `GET /execution/{id}/logs` every 4 s until the execution is terminal (`scripts/uae/workflows.mjs run <kind> --wait` / `logs <id>`).
Undocumented limits seen: `GET /workflow/?limit=100` → 400 "requested result count exceeded limit" (max 50). Node type `o_analyzer` (sink) is accepted though not in the enum. Empty `delivery: []` is accepted (logs "delivery stage not found; ending execution", status success).

| Workflow | ID | Cron (6-field, UTC) | 5-field equivalent | Activation | isActive (GET) | Next runs (UTC, ISO) |
|---|---|---|---|---|---|---|
| uae_cc_v1 ingest — news + sentiment 7-class + entities + org signals | `6ad7f32d5e60695bc4d052cb` | `0 0 */2 * * *` | `0 */2 * * *` | POST /activate → 200 | **true** | 2026-10-21T00:00:00Z, 02:00:00Z, 04:00:00Z |
| National AI Briefing — daily 06:30 GST | `6ad7f32e5e60695bc4d052d2` | `0 30 2 * * *` | `30 2 * * *` | POST /activate → 200 | **true** | 2026-10-21T02:30:00Z (= 06:30 GST), 2026-10-22T02:30:00Z |
| Mission checkpoint — every 30 min | `6ad7f32e5e60695bc4d052d7` | `0 */30 * * * *` | `*/30 * * * *` | POST /activate → 200 | **true** | 2026-10-21T00:00:00Z, 00:30:00Z, 01:00:00Z |

Scheduler timezone = UTC. Evidence: the account's existing cron `0 0 6 * * *` fired at 2026-10-20T06:00:00.654Z, and our checkpoint cron fired at **2026-10-20T23:30:00.803Z**. The briefing cron is therefore set to 02:30 UTC = 06:30 GST.

### Verification runs (execute → log stream → node outputs)
| Workflow | executionID | Trigger | Execute HTTP | Status | Duration | Log excerpt (polled /logs) | Output |
|---|---|---|---|---|---|---|---|
| checkpoint | `6ad7f33a5e60695bc4d052dc` | api (manual) | 200 (423 ms) | **success** | 846 ms | `state … executed successfully in 32 ms` → `analyzer-0 … executed successfully` → `delivery stage not found; ending execution` | 4,461-char JSON snapshot (MISSION_STATE + CHECKPOINTS + NEXT_ACTIONS) |
| checkpoint | `6ad7f978b28e35aa11d85525` | **cron** (first scheduled fire) | — | **success** | 145 ms | `workflow execution started` → `state … 58 ms` → `analyzer-0 … 62 ms` → end | proves the schedule fires on its own |
| ingest (1st) | `6ad7f340b28e35aa11d854e9` | api | 200 (1079 ms) | success | 35.9 s | news/voices/classify all executed | **empty** `{"items":[]}`: the "last 72 hours" prompt made the model reject every result because its own notion of today's date differs. Fixed by asking for newest-first items with real publication dates and no date window (PATCH /workflow → 200). |
| ingest (2nd) | `6ad7f3af5e60695bc4d05305` | api | 200 | **success** | 91.9 s | `classify … executed successfully in 13801 ms` → analyzer → end | 3 news + 3 attributable statements (all with source URLs, verbatim flag, plugin, confidence), 7-class labels, entities → org_ids, 1 org signal (g42), `dropped_no_url: 0` |
| briefing (1st) | `6ad7f3415e60695bc4d052e4` | api | 200 (306 ms) | success | 70.4 s | — | dated itself "27 September 2026" with no verified items (same date issue), so it was superseded |
| briefing (2nd) | `6ad7f3b05e60695bc4d05309` | api | 200 (624 ms) | **success** | 175.1 s | `briefing … executed successfully in 174400 ms` → analyzer → end | 7,524-char cited briefing, 12 source URLs, Verified/Interpretation split, disclaimer line; served on /briefing ("Latest scheduled briefing") |

**Datastore:** the app reads the latest successful execution of each workflow through `GET /api/uae/live` (`src/lib/uae/live.ts` → `/execution/list` + `/execution/{id}/node/outputs`). The OnDemand execution store is the live uae_cc_v1 datastore: append-only, one record set per run.
Every record carries `provenance {source_url, timestamp, plugin, confidence, workflow_id, execution_id}`, and records without an http(s) URL are dropped twice, once in the workflow prompt and once in the reader.
Live records are additive and are **not** merged into the curated seed counts (50 / 159 / 91 / 161 / 153), so seed numbers stay reproducible.
Not done: no write-back into the committed seed JSON, and no blob/DB store. The sandbox has no persistent volume, and the workflow has no webhook delivery to a durable app URL. See NEXT_ACTIONS.

## B. Contract tests — QA agent 5 (round 2, 2026-10-20T23:28Z)
| Contract | HTTP | Latency ms | Schema/assertion |
|---|---|---|---|
| docs-categories | 200 | 1286 | ✅ |
| chat-createchatsession | 201 | 255 | ✅ |
| chat-submitquery-sync | 200 | 1833 | ✅ |
| chat-getchatmessages | 200 | 126 | ✅ |
| media-fetchmedia | 200 | 131 | ✅ |
| afb-get-workflow-ingest | 200 | 180 | ✅ |
| afb-get-workflow-briefing | 200 | 182 | ✅ |
| afb-get-workflow-checkpoint | 200 | 127 | ✅ |
| afb-execution-list+logs+outputs | 200 | 473 | ✅ |
| app-health | 200 | 79 | ✅ |
| app-uae-orgs | 200 | 24 | ✅ |
| app-uae-live | 200 | 425 | ✅ |
| app-chat-proxy-stream | 200 | 7023 | ✅ |
| app-briefing-bad-key-error | 502 | 185 | ✅ |
| app-artifacts-empty | 200 | 22 | ✅ |

Error-path contract: `POST /api/briefing` with an invalid key returns **502** with `{ok:false, stage:"createchatsession", status:401, error:"Invalid API Key"}`. The upstream error is reported as-is and no canned briefing is substituted.

## C. Earlier endpoint tests (previous turn, unchanged)
### Endpoint tests (direct, server key)
| Test | Endpoint | Status | Latency ms | Timestamp |
|---|---|---|---|---|
| docs categories | `GET /config/v1/public/docs/categories` | 200 | 843 | 2026-10-20T21:37:14Z |
| docs reference submitquery | `GET /config/v1/public/docs/reference/api/submitquery` | 200 | 510 | 2026-10-20T21:37:14Z |
| endpoints list | `GET /config/v1/public/endpoints` | 200 | 274 | 2026-10-20T21:37:14Z |
| createchatsession | `POST /chat/v1/sessions` | 201 | 324 | 2026-10-20T21:37:15Z |
| submitquery sync (gpt-5.6-luna) | `POST /chat/v1/sessions/6ad7df0b7bb80aa7c2d975a3/query` | 200 | 2158 | 2026-10-20T21:37:17Z |
| submitquery stream (gpt-5.6-luna) | `POST /chat/v1/sessions/6ad7df0b7bb80aa7c2d975a3/query` | 200 | 4445 | 2026-10-20T21:37:21Z |
| createchatsession (Perplexity plugin) | `POST /chat/v1/sessions` | 201 | 382 | 2026-10-20T21:37:22Z |
| submitquery sync + Perplexity plugin-1722260873 | `POST /chat/v1/sessions/6ad7df120bb93a15a0dd35fa/query` | 200 | 64385 | 2026-10-20T21:38:26Z |
| getchatsessions | `GET /chat/v1/sessions` | 200 | 404 | 2026-10-20T21:38:27Z |
| getchatsession | `GET /chat/v1/sessions/6ad7df0b7bb80aa7c2d975a3` | 200 | 386 | 2026-10-20T21:38:27Z |
| getchatmessages | `GET /chat/v1/sessions/6ad7df0b7bb80aa7c2d975a3/messages` | 200 | 334 | 2026-10-20T21:38:27Z |
| fetchmedia | `GET /media/v1/public/file` | 200 | 217 | 2026-10-20T21:38:27Z |
| Agents Flow Builder: list workflows | `GET /workflow/` | 200 | 266 | 2026-10-20T21:38:28Z |
| plugin list | `GET /plugin/v1/list` | 200 | 200 | 2026-10-20T21:38:28Z |

Perplexity plugin call (`plugin-1722260873`) answered honestly that no October 2026 TII item was in its sources and cited the Sep 2026 Qualcomm grant — i.e. the plugin path works and does not fabricate.

## Pipeline calls (sessions/query used to build namespace uae_cc_v1)
124 calls · 124 HTTP 200 · p50 22568 ms · p95 42512 ms · max 47783 ms. Tags: {'probe': 1, 'org': 52, 'sent-extract': 35, 'sent-classify': 8, 'news-extract': 28}. Full log: `mission/ondemand_pipeline_calls.json`.

## Executive Chat acceptance questions (through the deployed app: browser → POST /api/chat → OnDemand stream, endpoint predefined-gpt-5.6-luna + Perplexity)
| Question | HTTP | First event ms | Total ms | Answer chars | Verified/Interpretation split | Cited links | Timestamp |
|---|---|---|---|---|---|---|---|
| What has TII announced recently? | 200 | 94 | 25237 | 876 | ✅ | 3 | 2026-10-20T22:31:22Z |
| Which UAE AI companies are accelerating internationally? | 200 | 107 | 79872 | 1737 | ✅ | 4 | 2026-10-20T22:32:16Z |
| What is driving negative sentiment about AI employment? | 200 | 107 | 30476 | 2300 | ✅ | 5 | 2026-10-20T22:31:27Z |
| Compare G42, EDGE and TII's AI research activity. | 200 | 81 | 28700 | 2258 | ✅ | 0 | 2026-10-20T22:31:25Z |
| Which UAE organizations announced new AI partnerships this month? | 200 | 99 | 57665 | 992 | ✅ | 2 | 2026-10-20T22:31:54Z |

Full answers: `mission/chat_test_results.json`.

## National AI Briefing (POST /api/briefing on the preview)
HTTP 200 · ~31 s · grounded, cited markdown with Verified/Interpretation bullets and the concept disclaimer line.

## Known upstream limits
- `plugin-1785777296` (X MCP) is disabled in the allow-list (earlier sessions showed OnDemand 400 "agents are inactive").
- OnDemand CORS is an origin allow-list (`*.vercel.app`, localhost:3000/5173, app.on-demand.io); `*.vercel.run` previews therefore use the server proxy (`NEXT_PUBLIC_CHAT_TRANSPORT=proxy`).


- Endpoint note (2026-10-20T23:00Z): `GET /config/v1/public/endpoints` lists `predefined-gpt-5.6-luna` as **inactive** with `fallback_endpoint_id: predefined-gpt-6-luna`. Chat and briefing still succeed through the fallback. The new workflows call `predefined-gpt-6-luna` directly.
