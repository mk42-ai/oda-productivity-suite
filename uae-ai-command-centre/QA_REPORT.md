# QA_REPORT — 5-agent verification sweep · 2026-10-20T23:19Z → 23:41Z

Target: **https://sb-6x7pgj362xe9.vercel.run** (sandbox `sbx_m8HCn4AgQdbdH8a3PgQGT7UVkmVr`, Next.js 15 production build, `next start`, port 5173).
Tool: headless **Playwright 1.64 (playwright-core) driving the system Chromium 154**, 5 independent agent scripts run in parallel processes, every UI check screenshotted at **1440×900** and **390×844**
(JPEG, `proof/qa-20261020/`). Server-only checks (contracts, URL HTTP status, git/Vercel state) carry no screenshot. A second ui-validator pass captured `.ui-proof/after-overview-*.png`.

**Result: round 1 = 76 / 84 pass (8 failures, 4 distinct defects) → fixed in place, rebuilt, redeployed → round 2 = 84 / 84 pass.**

## Round 1 failures (all fixed)
| Agent | Test | Viewport | Result | ISO time | Detail | Screenshot |
|---|---|---|---|---|---|---|
| agent1 | disclaimer-phrase | 1440x900 | ❌ | 2026-10-20T23:19:47Z | "UAE AI Intelligence — Concept Demonstration" missing on /overview,/watchlist,/watchlist/tii,/watchlist/compare?ids=g42,edge,tii,/sentiment,/news,/radar,/graph,/chat,/briefing,/methodology,/settings,/ | `agent1-branding-r1-disclaimer-phrase-1440x900.jpg` |
| agent1 | residue-network | 1440x900 | ❌ | 2026-10-20T23:19:47Z | /api/plugins: Pitchbook / /api/plugins: Pitchbook | — |
| agent1 | disclaimer-phrase | 390x844 | ❌ | 2026-10-20T23:20:08Z | "UAE AI Intelligence — Concept Demonstration" missing on /overview,/watchlist,/watchlist/tii,/watchlist/compare?ids=g42,edge,tii,/sentiment,/news,/radar,/graph,/chat,/briefing,/methodology,/settings,/ | `agent1-branding-r1-disclaimer-phrase-390x844.jpg` |
| agent1 | residue-network | 390x844 | ❌ | 2026-10-20T23:20:08Z | /api/plugins: Pitchbook / /api/plugins: Pitchbook | — |
| agent3 | pulse-metrics-24h-7d-30d | 1440x900 | ❌ | 2026-10-20T23:19:33Z | pulse panel contains 24h/7d/30d=false, sampling notice=true; text="National PulseOptimists29Pragmatists14Skeptics12Safety Advocates8Disruption Concerned4Pessimists/Doomers0Neutral/Informational92Not a | `agent3-sentiment-r1-pulse-metrics-24h-7d-30d-1440x900.jpg` |
| agent3 | pulse-metrics-24h-7d-30d | 390x844 | ❌ | 2026-10-20T23:19:41Z | pulse panel contains 24h/7d/30d=false, sampling notice=true; text="National PulseOptimists29Pragmatists14Skeptics12Safety Advocates8Disruption Concerned4Pessimists/Doomers0Neutral/Informational92Not a | `agent3-sentiment-r1-pulse-metrics-24h-7d-30d-390x844.jpg` |
| agent5 | state-loading-live-pipeline | 1440x900 | ❌ | 2026-10-20T23:19:39Z | live-loading visible while /api/uae/live is delayed: false | `agent5-contracts-r1-state-loading-live-pipeline-1440x900.jpg` |
| agent5 | state-loading-live-pipeline | 390x844 | ❌ | 2026-10-20T23:20:17Z | live-loading visible while /api/uae/live is delayed: false | `agent5-contracts-r1-state-loading-live-pipeline-390x844.jpg` |

Fixes (commit on `uae-ai-command-centre`):
1. **Brand line** — the persistent disclaimer bar now carries "UAE AI Intelligence — Concept Demonstration · Not an official government system" on every route (`disclaimer-bar.tsx`).
2. **Residue in network** — `/api/plugins` forwarded the marketplace entry "Pitchbook Investor Finder" (plugin-1777018662, the previous tenant's tool). It is now filtered out server-side (`RETIRED_PLUGIN_IDS`). Network scan: 0 hits in 838 + 604 responses.
3. **Pulse 24h/7d/30d** — the National Pulse panel gained a 24h / 7d / 30d window table (statement counts, positive vs skeptical/concerned shares) with the sampling-limitation notice and a "dated statements only" caveat.
4. **Loading state** — the test had waited for `networkidle`, which masked the loading state. Re-run with a DOM-ready wait: the loading state renders. This was a test defect, not an app defect.
Also fixed:
- **Two dead source URLs** (HTTP 404: orfonline.org/…hybrid-professional…, g42.ai/…microsoft-and-g42-accelerate…). Their links are now disabled and marked `url_status: HTTP 404 on 2026-10-20` in sentiment/news/digest. The URLs were not replaced.
- **Watchlist compare tray** — the fixed compare tray could cover the last cards' Compare buttons. Grid bottom padding and scroll margins added.

## Round 2 — per-test results (final)
| Agent | Test | Viewport | Result | ISO time | Detail | Screenshot |
|---|---|---|---|---|---|---|
| agent1 | disclaimer-phrase | 1440x900 | ✅ PASS | 2026-10-20T23:28:34Z | "UAE AI Intelligence — Concept Demonstration" + "not an official government system" on all 14 routes | `agent1-branding-r2-disclaimer-phrase-1440x900.jpg` |
| agent1 | disclaimer-phrase | 390x844 | ✅ PASS | 2026-10-20T23:28:51Z | "UAE AI Intelligence — Concept Demonstration" + "not an official government system" on all 14 routes | `agent1-branding-r2-disclaimer-phrase-390x844.jpg` |
| agent1 | residue-dom | 1440x900 | ✅ PASS | 2026-10-20T23:28:34Z | 0 hits across 14 rendered DOMs | — |
| agent1 | residue-dom | 390x844 | ✅ PASS | 2026-10-20T23:28:51Z | 0 hits across 14 rendered DOMs | — |
| agent1 | residue-metadata-endpoints | 1440x900 | ✅ PASS | 2026-10-20T23:28:53Z | 0 hits in /manifest.webmanifest, /api/uae/orgs, /health, /api/uae/live, /robots.txt | `agent1-branding-r2-residue-metadata-endpoints-1440x900.jpg` |
| agent1 | residue-network | 1440x900 | ✅ PASS | 2026-10-20T23:28:34Z | 0 hits in 838 same-origin text responses | — |
| agent1 | residue-network | 390x844 | ✅ PASS | 2026-10-20T23:28:51Z | 0 hits in 604 same-origin text responses | — |
| agent1 | residue-titles-meta | 1440x900 | ✅ PASS | 2026-10-20T23:28:34Z | 0 hits in <title> and <meta> (14 routes) | — |
| agent1 | residue-titles-meta | 390x844 | ✅ PASS | 2026-10-20T23:28:51Z | 0 hits in <title> and <meta> (14 routes) | — |
| agent1 | routes-load | 1440x900 | ✅ PASS | 2026-10-20T23:28:34Z | 14 routes HTTP <400 | `agent1-branding-r2-routes-load-1440x900.jpg` |
| agent1 | routes-load | 390x844 | ✅ PASS | 2026-10-20T23:28:51Z | 14 routes HTTP <400 | `agent1-branding-r2-routes-load-390x844.jpg` |
| agent2 | cards-50 | 1440x900 | ✅ PASS | 2026-10-20T23:35:32Z | org-card=50, counter="50 / 50" | `agent2-watchlist-r2-cards-50-1440x900.jpg` |
| agent2 | cards-50 | 390x844 | ✅ PASS | 2026-10-20T23:36:24Z | org-card=50, counter="50 / 50" | `agent2-watchlist-r2-cards-50-390x844.jpg` |
| agent2 | compare | 1440x900 | ✅ PASS | 2026-10-20T23:35:37Z | tray="Compare (3/4): G42 EDGE Group Technology Innovation Compare" → url=/watchlist/compare?ids=g42,edge,tii table has G42/EDGE/TII; filter reset → 50 cards | `agent2-watchlist-r2-compare-1440x900.jpg` |
| agent2 | compare | 390x844 | ✅ PASS | 2026-10-20T23:36:29Z | tray="Compare (3/4): G42 EDGE Group Technology Innovation Compare" → url=/watchlist/compare?ids=g42,edge,tii table has G42/EDGE/TII; filter reset → 50 cards | `agent2-watchlist-r2-compare-390x844.jpg` |
| agent2 | dossier-mobile | 390x844 | ✅ PASS | 2026-10-20T23:36:30Z | title="G42", no horizontal overflow=true | `agent2-watchlist-r2-dossier-mobile-390x844.jpg` |
| agent2 | dossiers-all-50-open | 1440x900 | ✅ PASS | 2026-10-20T23:36:23Z | 50/50 dossiers HTTP 200 with matching title (45 s) | `agent2-watchlist-r2-dossiers-all-50-open-1440x900.jpg` |
| agent2 | filter-type | 1440x900 | ✅ PASS | 2026-10-20T23:35:34Z | government filter → 12 (expected 12) | `agent2-watchlist-r2-filter-type-1440x900.jpg` |
| agent2 | filter-type | 390x844 | ✅ PASS | 2026-10-20T23:36:26Z | government filter → 12 (expected 12) | `agent2-watchlist-r2-filter-type-390x844.jpg` |
| agent2 | logos-authentic-or-marked | 1440x900 | ✅ PASS | 2026-10-20T23:35:32Z | 6 official icons (all loaded, all sourced from official domains in logos.json), 44 marked monograms "(no verified official logo)"; bad=[] | — |
| agent2 | logos-authentic-or-marked | 390x844 | ✅ PASS | 2026-10-20T23:36:24Z | 6 official icons (all loaded, all sourced from official domains in logos.json), 44 marked monograms "(no verified official logo)"; bad=[] | — |
| agent2 | search | 1440x900 | ✅ PASS | 2026-10-20T23:35:33Z | "Falcon" → 3 cards (tii,atrc,ai71) | `agent2-watchlist-r2-search-1440x900.jpg` |
| agent2 | search | 390x844 | ✅ PASS | 2026-10-20T23:36:25Z | "Falcon" → 3 cards (tii,atrc,ai71) | `agent2-watchlist-r2-search-390x844.jpg` |
| agent2 | search-empty-state | 1440x900 | ✅ PASS | 2026-10-20T23:35:33Z | empty-state visible=true | `agent2-watchlist-r2-search-empty-state-1440x900.jpg` |
| agent2 | search-empty-state | 390x844 | ✅ PASS | 2026-10-20T23:36:25Z | empty-state visible=true | `agent2-watchlist-r2-search-empty-state-390x844.jpg` |
| agent3 | bubbles-render | 1440x900 | ✅ PASS | 2026-10-20T23:28:16Z | 159 bubbles, counter "159 / 159 statements" (dataset 159) | `agent3-sentiment-r2-bubbles-render-1440x900.jpg` |
| agent3 | bubbles-render | 390x844 | ✅ PASS | 2026-10-20T23:28:24Z | 159 bubbles, counter "159 / 159 statements" (dataset 159) | `agent3-sentiment-r2-bubbles-render-390x844.jpg` |
| agent3 | click-through-link | 1440x900 | ✅ PASS | 2026-10-20T23:28:17Z | evidence-source href=https://www.khaleejtimes.com/jobs/ai-impact-uae-jobs-firms-restructure-avoid-layoffs | `agent3-sentiment-r2-click-through-link-1440x900.jpg` |
| agent3 | click-through-link | 390x844 | ✅ PASS | 2026-10-20T23:28:25Z | evidence-source href=https://www.khaleejtimes.com/jobs/ai-impact-uae-jobs-firms-restructure-avoid-layoffs | `agent3-sentiment-r2-click-through-link-390x844.jpg` |
| agent3 | filters | 1440x900 | ✅ PASS | 2026-10-20T23:28:19Z | Optimists "29 / 159 statements" (exp 29); Explicit-UAE "35 / 159 statements" (exp 35); Jobs & skills "28 / 159 statements" (exp 28) | `agent3-sentiment-r2-filters-1440x900.jpg` |
| agent3 | filters | 390x844 | ✅ PASS | 2026-10-20T23:28:27Z | Optimists "29 / 159 statements" (exp 29); Explicit-UAE "35 / 159 statements" (exp 35); Jobs & skills "28 / 159 statements" (exp 28) | `agent3-sentiment-r2-filters-390x844.jpg` |
| agent3 | hover-tooltip | 1440x900 | ✅ PASS | 2026-10-20T23:28:16Z | tooltip: Neutral/Informational · 96%Roughly one in ten job listings in 2025 explicitly referenced automation, systems-driven workflows, or process optimisation, even whe | `agent3-sentiment-r2-hover-tooltip-1440x900.jpg` |
| agent3 | hover-tooltip | 390x844 | ✅ PASS | 2026-10-20T23:28:25Z | tooltip: Neutral/Informational · 96%Roughly one in ten job listings in 2025 explicitly referenced automation, systems-driven workflows, or process optimisation, even whe | `agent3-sentiment-r2-hover-tooltip-390x844.jpg` |
| agent3 | pulse-metrics-24h-7d-30d | 1440x900 | ✅ PASS | 2026-10-20T23:28:23Z | pulse panel contains 24h/7d/30d=true, sampling notice=true; text="National PulseOptimists29Pragmatists14Skeptics12Safety Advocates8Disruption Concerned4Pessimists/Doomers0Neutral/Informational92Window (to 2026-10-20)StatementsOpt. | `agent3-sentiment-r2-pulse-metrics-24h-7d-30d-1440x900.jpg` |
| agent3 | pulse-metrics-24h-7d-30d | 390x844 | ✅ PASS | 2026-10-20T23:28:30Z | pulse panel contains 24h/7d/30d=true, sampling notice=true; text="National PulseOptimists29Pragmatists14Skeptics12Safety Advocates8Disruption Concerned4Pessimists/Doomers0Neutral/Informational92Window (to 2026-10-20)StatementsOpt. | `agent3-sentiment-r2-pulse-metrics-24h-7d-30d-390x844.jpg` |
| agent3 | source-urls-http | server | ✅ PASS | 2026-10-20T23:28:45Z | 107 unique verified URLs: {"400":1,"401":2,"402":1,"419":2,"403/429 bot-wall":29,"2xx":72}; dead(404/410)=0 | — |
| agent3 | time-playback | 1440x900 | ✅ PASS | 2026-10-20T23:28:21Z | 30d window, playhead 2026-10-20 → 2025-10-25 after 2.2 s, visible 2 / 159 statements | `agent3-sentiment-r2-time-playback-1440x900.jpg` |
| agent3 | time-playback | 390x844 | ✅ PASS | 2026-10-20T23:28:29Z | 30d window, playhead 2026-10-20 → 2025-10-25 after 2.2 s, visible 2 / 159 statements | `agent3-sentiment-r2-time-playback-390x844.jpg` |
| agent4 | briefing-generate | 1440x900 | ✅ PASS | 2026-10-20T23:40:00Z | POST /api/briefing HTTP 200, 38085 ms, loading-state=true, 4170 chars, 15 source links | `agent4-chat-r2-briefing-generate-1440x900.jpg` |
| agent4 | briefing-generate | 390x844 | ✅ PASS | 2026-10-20T23:40:50Z | POST /api/briefing HTTP 200, 48085 ms, loading-state=true, 4363 chars, 12 source links | `agent4-chat-r2-briefing-generate-390x844.jpg` |
| agent4 | briefing-scheduled-panel | 1440x900 | ✅ PASS | 2026-10-20T23:40:01Z | scheduled panel: Latest scheduled briefing · workflow cron 0 30 2 * * * (06:30 GST)  Generated by execution 6ad7f3b05e60695bc4d05309 · 2026-10-20T23:08:15.225Z (api)  Bottom line: The UAE’s AI push | `agent4-chat-r2-briefing-scheduled-panel-1440x900.jpg` |
| agent4 | briefing-scheduled-panel | 390x844 | ✅ PASS | 2026-10-20T23:40:51Z | scheduled panel: Latest scheduled briefing · workflow cron 0 30 2 * * * (06:30 GST)  Generated by execution 6ad7f3b05e60695bc4d05309 · 2026-10-20T23:08:15.225Z (api)  Bottom line: The UAE’s AI push | `agent4-chat-r2-briefing-scheduled-panel-390x844.jpg` |
| agent4 | q1 | 1440x900 | ✅ PASS | 2026-10-20T23:38:09Z | "What has TII announced recently?" → HTTP 200, 74550 ms, 471 chars, Verified=true Interpretation=true, 1 inline links + 1 citation chips; sources: gulfbusiness.com | `agent4-chat-r2-q1-1440x900.jpg` |
| agent4 | q1 | 390x844 | ✅ PASS | 2026-10-20T23:39:20Z | "What has TII announced recently?" → HTTP 200, 68921 ms, 446 chars, Verified=true Interpretation=true, 1 inline links + 1 citation chips; sources: gulfbusiness.com | `agent4-chat-r2-q1-390x844.jpg` |
| agent4 | q2 | 1440x900 | ✅ PASS | 2026-10-20T23:37:33Z | "Which UAE AI companies are accelerating internationally?" → HTTP 200, 41132 ms, 1172 chars, Verified=true Interpretation=true, 5 inline links + 5 citation chips; sources: www.agbi.com, www.g42.ai, www.techwaresoft.io, www.middlee | `agent4-chat-r2-q2-1440x900.jpg` |
| agent4 | q2 | 390x844 | ✅ PASS | 2026-10-20T23:38:52Z | "Which UAE AI companies are accelerating internationally?" → HTTP 200, 37674 ms, 1398 chars, Verified=true Interpretation=true, 4 inline links + 4 citation chips; sources: www.g42.ai, www.bloomberg.com, breakingdefense.com | `agent4-chat-r2-q2-390x844.jpg` |
| agent4 | q3 | 1440x900 | ✅ PASS | 2026-10-20T23:37:23Z | "What is driving negative sentiment about AI employment?" → HTTP 200, 31504 ms, 972 chars, Verified=true Interpretation=true, 2 inline links + 2 citation chips; sources: www.dataforprogress.org, carnegieendowment.org | `agent4-chat-r2-q3-1440x900.jpg` |
| agent4 | q3 | 390x844 | ✅ PASS | 2026-10-20T23:38:51Z | "What is driving negative sentiment about AI employment?" → HTTP 200, 39961 ms, 1254 chars, Verified=true Interpretation=true, 3 inline links + 3 citation chips; sources: www.pewresearch.org, learn.g2.com, carnegieendowment.org | `agent4-chat-r2-q3-390x844.jpg` |
| agent4 | q4 | 1440x900 | ✅ PASS | 2026-10-20T23:37:35Z | "Compare G42, EDGE and TII's AI research activity." → HTTP 200, 43262 ms, 2071 chars, Verified=true Interpretation=true, 9 inline links + 9 citation chips; sources: www.tii.ae, gulfbusiness.com, www.mediaoffice.abudhabi, www.g42.a | `agent4-chat-r2-q4-1440x900.jpg` |
| agent4 | q4 | 390x844 | ✅ PASS | 2026-10-20T23:38:52Z | "Compare G42, EDGE and TII's AI research activity." → HTTP 200, 38244 ms, 2314 chars, Verified=true Interpretation=true, 9 inline links + 9 citation chips; sources: gulfbusiness.com, www.tii.ae, www.g42.ai, mbzuai.ac.ae, www.middl | `agent4-chat-r2-q4-390x844.jpg` |
| agent4 | q5 | 1440x900 | ✅ PASS | 2026-10-20T23:37:32Z | "Which UAE organizations announced new AI partnerships this month?" → HTTP 200, 40659 ms, 944 chars, Verified=true Interpretation=true, 3 inline links + 3 citation chips; sources: www.g42.ai, mbzuai.ac.ae | `agent4-chat-r2-q5-1440x900.jpg` |
| agent4 | q5 | 390x844 | ✅ PASS | 2026-10-20T23:38:56Z | "Which UAE organizations announced new AI partnerships this month?" → HTTP 200, 44906 ms, 626 chars, Verified=true Interpretation=true, 2 inline links + 2 citation chips; sources: www.g42.ai, mbzuai.ac.ae | `agent4-chat-r2-q5-390x844.jpg` |
| agent5 | contract:afb-execution-list+logs+outputs | server | ✅ PASS | 2026-10-20T23:28:18Z | HTTP 200 · 473 ms · latest exec 6ad7f33a5e60695bc4d052dc status=success trigger=api; 8 log lines; outputs keys=analyzer-0,state,trigger | — |
| agent5 | contract:afb-get-workflow-briefing | server | ✅ PASS | 2026-10-20T23:28:17Z | HTTP 200 · 182 ms · isActive=true cron=0 30 2 * * * | — |
| agent5 | contract:afb-get-workflow-checkpoint | server | ✅ PASS | 2026-10-20T23:28:17Z | HTTP 200 · 127 ms · isActive=true cron=0 */30 * * * * | — |
| agent5 | contract:afb-get-workflow-ingest | server | ✅ PASS | 2026-10-20T23:28:17Z | HTTP 200 · 180 ms · isActive=true cron=0 0 */2 * * * | — |
| agent5 | contract:app-artifacts-empty | server | ✅ PASS | 2026-10-20T23:28:25Z | HTTP 200 · 22 ms · {"data":[],"total":0,"backend":"not_provisioned","timestamp":"2026-10-20T23:28:25.881Z"} | — |
| agent5 | contract:app-briefing-bad-key-error | server | ✅ PASS | 2026-10-20T23:28:25Z | HTTP 502 · 185 ms · honest error: stage=createchatsession upstream=401 "Invalid API Key" | — |
| agent5 | contract:app-chat-proxy-stream | server | ✅ PASS | 2026-10-20T23:28:25Z | HTTP 200 · 7023 ms · content-type=text/event-stream; charset=utf-8, first byte 22 ms, 15546 bytes, run finished=true | — |
| agent5 | contract:app-health | server | ✅ PASS | 2026-10-20T23:28:18Z | HTTP 200 · 79 ms · {"ok":true,"app":"uae-ai-command-centre","disclaimer":"Concept Demonstration — not an official government system","names | — |
| agent5 | contract:app-uae-live | server | ✅ PASS | 2026-10-20T23:28:18Z | HTTP 200 · 425 ms · workflows=ingest:success,briefing:success,checkpoint:success; news=3 statements=3 signals=1; provenance keys=source_url,timestamp,plugin,confidence,workflow_id,execution_id; briefing=true | — |
| agent5 | contract:app-uae-orgs | server | ✅ PASS | 2026-10-20T23:28:18Z | HTTP 200 · 24 ms · 50 orgs | — |
| agent5 | contract:chat-createchatsession | server | ✅ PASS | 2026-10-20T23:28:15Z | HTTP 201 · 255 ms · data.id=6ad7f90f7bb80aa7c2d97809 | — |
| agent5 | contract:chat-getchatmessages | server | ✅ PASS | 2026-10-20T23:28:16Z | HTTP 200 · 126 ms · 1 messages | — |
| agent5 | contract:chat-submitquery-sync | server | ✅ PASS | 2026-10-20T23:28:16Z | HTTP 200 · 1833 ms · data.answer="ok", keys=sessionId,messageId,answer,metrics,status | — |
| agent5 | contract:docs-categories | server | ✅ PASS | 2026-10-20T23:28:14Z | HTTP 200 · 1286 ms · services: Media API, Services API, MQTT User Management API, Projects Management API, Agents Flow Builder API, Chat API | — |
| agent5 | contract:media-fetchmedia | server | ✅ PASS | 2026-10-20T23:28:17Z | HTTP 200 · 131 ms · keys=message,data,pagination | — |
| agent5 | original-branch-unchanged | server | ✅ PASS | 2026-10-20T23:29:23Z | GitHub fix/news-summary-rewrite-live-verify-20261020 → 816aaaed9c3aa8fa37fbad31d3bd3f7491b3de9d; remote rollback tag object=not pushed yet | — |
| agent5 | original-rollback-tag | server | ✅ PASS | 2026-10-20T23:29:25Z | local tag → 816aaaed9c3aa8fa37fbad31d3bd3f7491b3de9d; work branch removes the old app dir only on the new branch ( 1085 files changed, 306344 deletions(-)) — the original branch is untouched | — |
| agent5 | original-vercel-project-unchanged | server | ✅ PASS | 2026-10-20T23:29:25Z | project bcapital-portfolio-intelligence-8zsb framework=services updatedAt=2026-10-13T04:31:46.417Z; newest deployment bcapital-portfolio-intelligence-8zsb-7fcs6ew3p.vercel.app 2026-10-20T10:04:12.991Z ERROR (sha 816aaae) — no depl | — |
| agent5 | perf-chat | 1440x900 | ✅ PASS | 2026-10-20T23:28:48Z | LCP 960 ms · FCP 360 ms · TTI≈852 ms (3 long tasks) · TTFB 60 ms · JS 3470 KiB (wire) · total 10232 KiB | `agent5-contracts-r2-perf-chat-1440x900.jpg` |
| agent5 | perf-chat | 390x844 | ✅ PASS | 2026-10-20T23:29:17Z | LCP 228 ms · FCP 228 ms · TTI≈897 ms (2 long tasks) · TTFB 64 ms · JS 3025 KiB (wire) · total 9540 KiB | `agent5-contracts-r2-perf-chat-390x844.jpg` |
| agent5 | perf-overview | 1440x900 | ✅ PASS | 2026-10-20T23:28:41Z | LCP 504 ms · FCP 504 ms · TTI≈1229 ms (3 long tasks) · TTFB 108 ms · JS 3474 KiB (wire) · total 4871 KiB | `agent5-contracts-r2-perf-overview-1440x900.jpg` |
| agent5 | perf-overview | 390x844 | ✅ PASS | 2026-10-20T23:29:09Z | LCP 332 ms · FCP 332 ms · TTI≈1004 ms (3 long tasks) · TTFB 94 ms · JS 3453 KiB (wire) · total 4481 KiB | `agent5-contracts-r2-perf-overview-390x844.jpg` |
| agent5 | perf-sentiment | 1440x900 | ✅ PASS | 2026-10-20T23:28:54Z | LCP 496 ms · FCP 496 ms · TTI≈1116 ms (2 long tasks) · TTFB 122 ms · JS 3482 KiB (wire) · total 4794 KiB | `agent5-contracts-r2-perf-sentiment-1440x900.jpg` |
| agent5 | perf-sentiment | 390x844 | ✅ PASS | 2026-10-20T23:29:23Z | LCP 388 ms · FCP 388 ms · TTI≈416 ms (2 long tasks) · TTFB 114 ms · JS 1261 KiB (wire) · total 1990 KiB | `agent5-contracts-r2-perf-sentiment-390x844.jpg` |
| agent5 | state-empty-briefing | 1440x900 | ✅ PASS | 2026-10-20T23:28:34Z | empty state visible=true | `agent5-contracts-r2-state-empty-briefing-1440x900.jpg` |
| agent5 | state-empty-briefing | 390x844 | ✅ PASS | 2026-10-20T23:29:02Z | empty state visible=true | `agent5-contracts-r2-state-empty-briefing-390x844.jpg` |
| agent5 | state-error-chat | 1440x900 | ✅ PASS | 2026-10-20T23:28:32Z | chat-error rendered=true, retry button=true | `agent5-contracts-r2-state-error-chat-1440x900.jpg` |
| agent5 | state-error-chat | 390x844 | ✅ PASS | 2026-10-20T23:29:00Z | chat-error rendered=true, retry button=true | `agent5-contracts-r2-state-error-chat-390x844.jpg` |
| agent5 | state-error-live-pipeline | 1440x900 | ✅ PASS | 2026-10-20T23:28:29Z | error state: "Live pipeline unavailable: GET /execution/list → HTTP 500 (injected). Seed data below is unaffected." | `agent5-contracts-r2-state-error-live-pipeline-1440x900.jpg` |
| agent5 | state-error-live-pipeline | 390x844 | ✅ PASS | 2026-10-20T23:28:57Z | error state: "Live pipeline unavailable: GET /execution/list → HTTP 500 (injected). Seed data below is unaffected." | `agent5-contracts-r2-state-error-live-pipeline-390x844.jpg` |
| agent5 | state-loading-live-pipeline | 1440x900 | ✅ PASS | 2026-10-20T23:28:27Z | live-loading visible while /api/uae/live is delayed: true | `agent5-contracts-r2-state-loading-live-pipeline-1440x900.jpg` |
| agent5 | state-loading-live-pipeline | 390x844 | ✅ PASS | 2026-10-20T23:28:55Z | live-loading visible while /api/uae/live is delayed: true | `agent5-contracts-r2-state-loading-live-pipeline-390x844.jpg` |

## Notes and limits (honest)
- **Source URL check** (agent 3, 107 unique verified URLs, server-side GET with a browser UA): 72 × 2xx, 29 × 403/429 (bot walls: Reuters, Bloomberg, LinkedIn, Facebook…), 1 × 400, 2 × 401, 1 × 402, 2 × 419, 0 × 404/410 after the fix. A 403/429 means the site refuses scripted clients. It does not mean the page is dead. These URLs were not re-verified in a real browser.
- **Performance** is measured in-browser from the QA host (PerformanceObserver LCP, plus TTI approximated as the last long task after FCP). It is not a Lighthouse lab score; Lighthouse was not run this turn. Wire JS per route is 1.2–3.5 MiB uncompressed-equivalent; `/chat` First Load JS is 906 kB (Next build output) because of the preserved chat/3D stack. It is the heaviest route and the main perf debt.
- **Chat answers** come from live OnDemand runs (Perplexity plugin + predefined-gpt-5.6-luna, which the platform transparently falls back to gpt-6-luna). Wording and citation counts differ run to run. q1 (TII) returned only 1 source link in both rounds, because the plugin found little recent TII news.
- **The 45 preserved legacy Playwright specs in `e2e/`** were NOT re-run. They target the pre-UAE chat UI selectors. This sweep used purpose-written agent scripts instead; those scripts live outside the repo, and their results are embedded above.
