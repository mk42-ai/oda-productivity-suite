# API_HEALTH — OnDemand (verified with real calls)

Docs source: live `GET /config/v1/public/docs/categories` + `GET /config/v1/public/docs/reference/api/<slug>` (read 2026-10-20T21:3xZ).
Categories returned: Media API, Services API, MQTT User Management, Projects Management, Agents Flow Builder (19 ops), Chat API (createchatsession, getchatsessions, getchatsession, getchatmessages, getchatmessage, submitquery, updatelivesessionsettings).
Spec facts used: `POST /chat/v1/sessions` body `externalUserId*`, `pluginIds`; `POST /chat/v1/sessions/{sessionId}/query` body `query*`, `endpointId*`, `responseMode*`, `pluginIds`, `fulfillmentOnly`, `modelConfigs`; auth header `apikey`; Agents Flow Builder host `https://api.on-demand.io/automation/api`.

## Endpoint tests (direct, server key)
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
