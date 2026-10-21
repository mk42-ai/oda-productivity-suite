# QA_REPORT — 2026-10-21 white restyle (5-agent Playwright sweep + contrast/h-scroll/residue sweep)
Preview under test: https://sb-54yh1uujw0kw.vercel.run (sandbox sbx_k8lbUZ7s5ISiX1o5VkZphOtOrEZD, HEAD eeba60b). Previous preview for BEFORE shots: local build of 4d0be39 (the Vercel preview https://oda-productivity-suite-3kdb4ehd6-schoolhack-web-team.vercel.app is SSO-protected → 302). Screenshots: `qa/screenshots/20261021-white/` (before-*/after-*: overview, watchlist, dossier-tii, sentiment (+hover, +drilldown), news, radar, graph, chat (+rail expanded/collapsed), briefing, methodology × 1440×900 + 390×844).

## Existing 84-check suite (round "white", 09:50–09:56Z)
| Agent | 1440×900 | 390×844 | server | Total |
|---|---|---|---|---|
| agent1-branding | 6/6 | 5/5 | – | 11/11 |
| agent2-watchlist | 7/7 | 7/7 | – | 14/14 |
| agent3-sentiment | 6/6 | 6/6 | 1/1 | 13/13 |
| agent4-chat | 7/7 | 7/7 | – | 14/14 |
| agent5-contracts | 7/7 | 7/7 | 18/18 | 32/32 |
| **Total** | **33/33** | **32/32** | **19/19** | **84/84** |
Failures: none. Raw results: `qa/screenshots/20261021-white/results-agent*-white.json`.

## New checks (13 routes × 2 viewports; `contrast-hscroll-residue.json`)
- **No horizontal scroll**: 26/26 pass (document.scrollWidth ≤ innerWidth on every route at both viewports).
- **Residue ("B Capital" / bcapital / b-capital / "B Social")**: DOM 0/26, same-origin network text responses 0 hits, code 0 (the only 2 remaining code matches are history lines in this file describing the scan itself).
- **WCAG AA contrast (computed colours, every visible text node, 4.5:1 body / 3:1 large)**: 6,695 nodes checked, **105 below threshold**. Lowest ratio per page (same offenders repeat on every page):
  - all pages: brand-rail label "Concept demonstration" #8E8E8E on #F9F9F9/#FFFFFF = **3.11:1** (12 px) — the spec'd muted colour; also the page eyebrows (#8E8E8E, 12 px) = 3.11:1 → **NOT AA**; fix = #5D5D5D (7.0:1) or #767676.
  - /radar: ring chip "assess" white on #B8A98F = **2.31:1** → NOT AA.
  - /chat, /settings: company-picker chips reported 2.03:1 — **measurement artefact** (background returned as `color(srgb …)`, which the ratio parser cannot read; visually #44403C on #EDECEC ≈ 9:1). /watchlist "Search watchlist" 1.08:1 and type-filter pills — same artefact (`oklab(…)` background). Treat as NOT VERIFIED rather than failed.
  - /chat 390: "No chats yet" / "No threads yet" #8E8E8E = 3.11:1.
  After excluding the parser artefacts (~22 nodes) the genuine AA misses are the #8E8E8E 12 px labels (~80 nodes) and the radar "assess" chip (6 nodes).

## Not verified this turn (time-box)
- 390 px off-canvas rail drawer open/close + overlay (code landed in nav-rail.tsx; only the closed state is in the 390 screenshots).
- Threads list inside the desktop rail on /chat with existing threads (store wired; QA ran with an empty thread list).
- Dark theme (#212121 scale) rendering; Playwright e2e/ specs (39 files) not re-run against the new DOM.

---
# QA_REPORT — 2026-10-21 resume turn (5-agent headless Playwright sweep, 1440×900 + 390×844)
Preview under test: https://sb-k65qriyznanv.vercel.run (sandbox sbx_JZ5XSymKk2n1Gm8QyxqFQCRjeKa2). Screenshots: `proof/qa-20261021/` (126 files).

| Round | Pass / total | Notes |
|---|---|---|
| r1 (04:37Z, after patches) | 78/84 | agent3 ×4: lane filter defaulted to 'UAE-topic' so counters showed 180/196 (test expects all 196 visible by default) → default set to 'Both lanes'; agent5 ×2: GitHub call sent an empty Bearer header without GITHUB_TOKEN, and the Vercel check counted our own branch's auto-builds (MISSING_SERVICES) as a touch of the original project → assertions corrected |
| r2 (04:44Z) + agent5 r3 (04:46Z) | **82/82** | all 5 agents green |

| Agent | Pass/total |
|---|---|
| agent1-branding | 11/11 |
| agent2-watchlist | 14/14 |
| agent3-sentiment | 13/13 |
| agent4-chat | 12/12 |
| agent5-contracts | 32/32 |

## Coverage (13 pages × 2 viewports)
Routes: /overview, /watchlist, /watchlist/tii, /watchlist/compare, /sentiment, /news, /radar, /graph, /chat, /briefing, /methodology, /settings, /artifacts (+ /docs/interactive-ui). Checks: navigation/HTTP<400, brand line + disclaimer on every route, 50 dossiers + logos, search/filter/compare, bubble render/hover/click drill-down, time windows + playback, lane filter, pulse 24h/7d/30d, chat citations with Verified/Interpretation (4 demo questions via real OnDemand sessions), OnDemand contracts (sessions/query/workflows/executions), loading/error/empty states, perf (LCP ≤ 0.8 s), original project unchanged.
Residual scan (code + rendered DOM + 1,417 same-origin network responses + metadata endpoints): **0 hits** for 'B Capital' / 'bcapital' / 'bcap' / people / product names / 136 portfolio names (rollback tag name exempted).

## Detail
| Agent | Test | Viewport | Result | Time (UTC) | Detail |
|---|---|---|---|---|---|
| agent1-branding | routes-load | 1440x900 | ✅ | 2026-10-21T04:44:14.101Z | 14 routes HTTP <400 |
| agent1-branding | disclaimer-phrase | 1440x900 | ✅ | 2026-10-21T04:44:14.152Z | "UAE AI Intelligence — Concept Demonstration" + "not an official government system" on all 14 routes |
| agent1-branding | residue-dom | 1440x900 | ✅ | 2026-10-21T04:44:14.201Z | 0 hits across 14 rendered DOMs |
| agent1-branding | residue-titles-meta | 1440x900 | ✅ | 2026-10-21T04:44:14.203Z | 0 hits in <title> and <meta> (14 routes) |
| agent1-branding | residue-network | 1440x900 | ✅ | 2026-10-21T04:44:14.206Z | 0 hits in 815 same-origin text responses |
| agent1-branding | routes-load | 390x844 | ✅ | 2026-10-21T04:44:32.854Z | 14 routes HTTP <400 |
| agent1-branding | disclaimer-phrase | 390x844 | ✅ | 2026-10-21T04:44:32.891Z | "UAE AI Intelligence — Concept Demonstration" + "not an official government system" on all 14 routes |
| agent1-branding | residue-dom | 390x844 | ✅ | 2026-10-21T04:44:32.925Z | 0 hits across 14 rendered DOMs |
| agent1-branding | residue-titles-meta | 390x844 | ✅ | 2026-10-21T04:44:32.927Z | 0 hits in <title> and <meta> (14 routes) |
| agent1-branding | residue-network | 390x844 | ✅ | 2026-10-21T04:44:32.929Z | 0 hits in 612 same-origin text responses |
| agent1-branding | residue-metadata-endpoints | 1440x900 | ✅ | 2026-10-21T04:44:35.477Z | 0 hits in /manifest.webmanifest, /api/uae/orgs, /health, /api/uae/live, /robots.txt |
| agent2-watchlist | cards-50 | 1440x900 | ✅ | 2026-10-21T04:43:49.495Z | org-card=50, counter="50 / 50" |
| agent2-watchlist | logos-authentic-or-marked | 1440x900 | ✅ | 2026-10-21T04:43:50.796Z | 6 official icons (all loaded, all sourced from official domains in logos.json), 44 marked monograms "(no verified official logo)"; bad=[] |
| agent2-watchlist | search | 1440x900 | ✅ | 2026-10-21T04:43:51.546Z | "Falcon" → 3 cards (tii,atrc,ai71) |
| agent2-watchlist | search-empty-state | 1440x900 | ✅ | 2026-10-21T04:43:52.197Z | empty-state visible=true |
| agent2-watchlist | filter-type | 1440x900 | ✅ | 2026-10-21T04:43:53.578Z | government filter → 12 (expected 12) |
| agent2-watchlist | compare | 1440x900 | ✅ | 2026-10-21T04:43:57.752Z | tray="Compare (3/4): G42 EDGE Group Technology Innovation Compare" → url=/watchlist/compare?ids=g42,edge,tii table has G42/EDGE/TII; filter reset → 50 cards |
| agent2-watchlist | dossiers-all-50-open | 1440x900 | ✅ | 2026-10-21T04:44:55.994Z | 50/50 dossiers HTTP 200 with matching title (58 s) |
| agent2-watchlist | cards-50 | 390x844 | ✅ | 2026-10-21T04:44:57.846Z | org-card=50, counter="50 / 50" |
| agent2-watchlist | logos-authentic-or-marked | 390x844 | ✅ | 2026-10-21T04:44:58.119Z | 6 official icons (all loaded, all sourced from official domains in logos.json), 44 marked monograms "(no verified official logo)"; bad=[] |
| agent2-watchlist | search | 390x844 | ✅ | 2026-10-21T04:44:58.844Z | "Falcon" → 3 cards (tii,atrc,ai71) |
| agent2-watchlist | search-empty-state | 390x844 | ✅ | 2026-10-21T04:44:59.379Z | empty-state visible=true |
| agent2-watchlist | filter-type | 390x844 | ✅ | 2026-10-21T04:45:00.801Z | government filter → 12 (expected 12) |
| agent2-watchlist | compare | 390x844 | ✅ | 2026-10-21T04:45:04.817Z | tray="Compare (3/4): G42 EDGE Group Technology Innovation Compare" → url=/watchlist/compare?ids=g42,edge,tii table has G42/EDGE/TII; filter reset → 50 cards |
| agent2-watchlist | dossier-mobile | 390x844 | ✅ | 2026-10-21T04:45:05.713Z | title="G42", no horizontal overflow=true |
| agent3-sentiment | bubbles-render | 1440x900 | ✅ | 2026-10-21T04:43:50.787Z | 196 bubbles, counter "196 / 196 statements" (dataset 196) |
| agent3-sentiment | hover-tooltip | 1440x900 | ✅ | 2026-10-21T04:43:51.417Z | tooltip: Neutral/Informational · 96%Roughly one in ten job listings in 2025 explicitly referenced automation, systems-driven workflows, or process optimisation, even whe |
| agent3-sentiment | click-through-link | 1440x900 | ✅ | 2026-10-21T04:43:51.998Z | evidence-source href=https://www.khaleejtimes.com/jobs/ai-impact-uae-jobs-firms-restructure-avoid-layoffs |
| agent3-sentiment | filters | 1440x900 | ✅ | 2026-10-21T04:43:55.468Z | Optimists "37 / 196 statements" (exp 37); Explicit-UAE "43 / 196 statements" (exp 43); Jobs & skills "35 / 196 statements" (exp 35) |
| agent3-sentiment | time-playback | 1440x900 | ✅ | 2026-10-21T04:43:58.146Z | 30d window, playhead 2026-10-21 → 2025-10-26 after 2.2 s, visible 2 / 196 statements |
| agent3-sentiment | pulse-metrics-24h-7d-30d | 1440x900 | ✅ | 2026-10-21T04:43:59.435Z | pulse panel contains 24h/7d/30d=true, sampling notice=true; text="National PulseLanes: UAE-topic 180 · global-discourse 16 (comparator only; excluded from the pulse table below).Optimists37Pragmatists20Skeptics19Safety A |
| agent3-sentiment | bubbles-render | 390x844 | ✅ | 2026-10-21T04:44:01.329Z | 196 bubbles, counter "196 / 196 statements" (dataset 196) |
| agent3-sentiment | hover-tooltip | 390x844 | ✅ | 2026-10-21T04:44:01.846Z | tooltip: Neutral/Informational · 96%Roughly one in ten job listings in 2025 explicitly referenced automation, systems-driven workflows, or process optimisation, even whe |
| agent3-sentiment | click-through-link | 390x844 | ✅ | 2026-10-21T04:44:02.298Z | evidence-source href=https://www.khaleejtimes.com/jobs/ai-impact-uae-jobs-firms-restructure-avoid-layoffs |
| agent3-sentiment | filters | 390x844 | ✅ | 2026-10-21T04:44:04.807Z | Optimists "37 / 196 statements" (exp 37); Explicit-UAE "43 / 196 statements" (exp 43); Jobs & skills "35 / 196 statements" (exp 35) |
| agent3-sentiment | time-playback | 390x844 | ✅ | 2026-10-21T04:44:07.525Z | 30d window, playhead 2026-10-21 → 2025-10-26 after 2.2 s, visible 2 / 196 statements |
| agent3-sentiment | pulse-metrics-24h-7d-30d | 390x844 | ✅ | 2026-10-21T04:44:08.859Z | pulse panel contains 24h/7d/30d=true, sampling notice=true; text="National PulseLanes: UAE-topic 180 · global-discourse 16 (comparator only; excluded from the pulse table below).Optimists37Pragmatists20Skeptics19Safety A |
| agent3-sentiment | source-urls-http | server | ✅ | 2026-10-21T04:44:26.626Z | 126 unique verified URLs: {"400":1,"401":2,"402":1,"419":3,"403/429 bot-wall":37,"2xx":76,"404/410":6}; dead(404/410)=6 e.g. https://www.khaleejtimes.com/jobs/cooper-fitch-ai-future-of-talent-2027 https://news.microsoft. |
| agent4-chat | q1 | 1440x900 | ✅ | 2026-10-21T04:44:22.549Z | "What has TII announced recently?" → HTTP 200, 29101 ms, 665 chars, Verified=true Interpretation=true, 2 inline links + 2 citation chips; sources: www.khaleejtimes.com, gulfbusiness.com |
| agent4-chat | q3 | 1440x900 | ✅ | 2026-10-21T04:44:23.682Z | "What is driving negative sentiment about AI employment?" → HTTP 200, 30368 ms, 1271 chars, Verified=true Interpretation=true, 3 inline links + 3 citation chips; sources: ethanjamesb.substack.com |
| agent4-chat | q4 | 1440x900 | ✅ | 2026-10-21T04:44:35.868Z | "Compare G42, EDGE and TII's AI research activity." → HTTP 200, 42312 ms, 1918 chars, Verified=true Interpretation=true, 6 inline links + 6 citation chips; sources: www.tii.ae, gulfbusiness.com, www.khaleejtimes.com, www |
| agent4-chat | q2 | 1440x900 | ✅ | 2026-10-21T04:44:55.816Z | "Which UAE AI companies are accelerating internationally?" → HTTP 200, 62565 ms, 1285 chars, Verified=true Interpretation=true, 4 inline links + 4 citation chips; sources: www.g42.ai, breakingdefense.com, www.zawya.com,  |
| agent4-chat | q5 | 1440x900 | ✅ | 2026-10-21T04:44:56.063Z | "Which UAE organizations announced new AI partnerships this month?" → HTTP 200, 62639 ms, 977 chars, Verified=true Interpretation=true, 4 inline links + 4 citation chips; sources: mbzuai.ac.ae, www.g42.ai, www.eand.com |
| agent4-chat | q5 | 390x844 | ✅ | 2026-10-21T04:45:32.727Z | "Which UAE organizations announced new AI partnerships this month?" → HTTP 200, 28573 ms, 881 chars, Verified=true Interpretation=true, 3 inline links + 3 citation chips; sources: www.g42.ai, mbzuai.ac.ae |
| agent4-chat | q3 | 390x844 | ✅ | 2026-10-21T04:45:32.993Z | "What is driving negative sentiment about AI employment?" → HTTP 200, 31059 ms, 1184 chars, Verified=true Interpretation=true, 3 inline links + 3 citation chips; sources: www.dataforprogress.org |
| agent4-chat | q4 | 390x844 | ✅ | 2026-10-21T04:45:44.109Z | "Compare G42, EDGE and TII's AI research activity." → HTTP 200, 42195 ms, 2438 chars, Verified=true Interpretation=true, 8 inline links + 8 citation chips; sources: en.wikipedia.org, www.tii.ae, gulfbusiness.com, www.g42 |
| agent4-chat | q1 | 390x844 | ✅ | 2026-10-21T04:45:51.175Z | "What has TII announced recently?" → HTTP 200, 47392 ms, 770 chars, Verified=true Interpretation=true, 2 inline links + 2 citation chips; sources: www.khaleejtimes.com, gulfbusiness.com |
| agent4-chat | q2 | 390x844 | ✅ | 2026-10-21T04:46:18.741Z | "Which UAE AI companies are accelerating internationally?" → HTTP 200, 75151 ms, 1276 chars, Verified=true Interpretation=true, 5 inline links + 5 citation chips; sources: www.g42.ai, breakingdefense.com, www.zawya.com,  |
| agent4-chat | briefing-generate | 1440x900 | ✅ | 2026-10-21T04:46:47.890Z | POST /api/briefing HTTP 200, 27033 ms, loading-state=true, 4536 chars, 13 source links |
| agent4-chat | briefing-scheduled-panel | 1440x900 | ✅ | 2026-10-21T04:46:48.477Z | scheduled panel: Latest scheduled briefing · workflow cron 0 30 2 * * * (06:30 GST)  Generated by execution 6ad841aab28e35aa11d85744 · 2026-10-21T04:38:58.388Z (api)  Bottom line: October’s signals |
| agent5-contracts | contract:docs-categories | server | ✅ | 2026-10-21T04:45:36.352Z | HTTP 200 · 962 ms · services: Media API, Services API, MQTT User Management API, Projects Management API, Agents Flow Builder API, Chat API |
| agent5-contracts | contract:chat-createchatsession | server | ✅ | 2026-10-21T04:45:36.676Z | HTTP 201 · 323 ms · data.id=6ad843707bb80aa7c2d97ba3 |
| agent5-contracts | contract:chat-submitquery-sync | server | ✅ | 2026-10-21T04:45:38.700Z | HTTP 200 · 2023 ms · data.answer="ok", keys=sessionId,messageId,answer,metrics,status |
| agent5-contracts | contract:chat-getchatmessages | server | ✅ | 2026-10-21T04:45:38.810Z | HTTP 200 · 110 ms · 1 messages |
| agent5-contracts | contract:media-fetchmedia | server | ✅ | 2026-10-21T04:45:38.953Z | HTTP 200 · 143 ms · keys=message,data,pagination |
| agent5-contracts | contract:afb-get-workflow-ingest | server | ✅ | 2026-10-21T04:45:39.149Z | HTTP 200 · 196 ms · isActive=true cron=0 0 */2 * * * |
| agent5-contracts | contract:afb-get-workflow-briefing | server | ✅ | 2026-10-21T04:45:39.337Z | HTTP 200 · 188 ms · isActive=true cron=0 30 2 * * * |
| agent5-contracts | contract:afb-get-workflow-checkpoint | server | ✅ | 2026-10-21T04:45:39.517Z | HTTP 200 · 179 ms · isActive=true cron=0 */30 * * * * |
| agent5-contracts | contract:afb-execution-list+logs+outputs | server | ✅ | 2026-10-21T04:45:39.957Z | HTTP 200 · 437 ms · latest exec 6ad83fc8b28e35aa11d85727 status=success trigger=cron; 9 log lines; outputs keys=analyzer-0,state |
| agent5-contracts | contract:app-health | server | ✅ | 2026-10-21T04:45:40.092Z | HTTP 200 · 135 ms · {"ok":true,"app":"uae-ai-command-centre","disclaimer":"Concept Demonstration — not an official government system","names |
| agent5-contracts | contract:app-uae-orgs | server | ✅ | 2026-10-21T04:45:40.128Z | HTTP 200 · 36 ms · 50 orgs |
| agent5-contracts | contract:app-uae-live | server | ✅ | 2026-10-21T04:45:40.796Z | HTTP 200 · 668 ms · workflows=ingest:success,briefing:success,checkpoint:success; news=6 statements=7 signals=6; provenance keys=source_url,timestamp,plugin,confidence,workflow_id,execution_id; briefing=true |
| agent5-contracts | contract:app-chat-proxy-stream | server | ✅ | 2026-10-21T04:45:46.946Z | HTTP 200 · 6149 ms · content-type=text/event-stream; charset=utf-8, first byte 36 ms, 15683 bytes, run finished=true |
| agent5-contracts | contract:app-briefing-bad-key-error | server | ✅ | 2026-10-21T04:45:47.173Z | HTTP 502 · 226 ms · honest error: stage=createchatsession upstream=401 "Invalid API Key" |
| agent5-contracts | contract:app-artifacts-empty | server | ✅ | 2026-10-21T04:45:47.220Z | HTTP 200 · 46 ms · {"data":[],"total":0,"backend":"not_provisioned","timestamp":"2026-10-21T04:45:47.186Z"} |
| agent5-contracts | state-loading-live-pipeline | 1440x900 | ✅ | 2026-10-21T04:45:49.006Z | live-loading visible while /api/uae/live is delayed: true |
| agent5-contracts | state-error-live-pipeline | 1440x900 | ✅ | 2026-10-21T04:45:51.231Z | error state: "Live pipeline unavailable: GET /execution/list → HTTP 500 (injected). Seed data below is unaffected." |
| agent5-contracts | state-error-chat | 1440x900 | ✅ | 2026-10-21T04:45:54.633Z | chat-error rendered=true, retry button=true |
| agent5-contracts | state-empty-briefing | 1440x900 | ✅ | 2026-10-21T04:45:56.448Z | empty state visible=true |
| agent5-contracts | perf-overview | 1440x900 | ✅ | 2026-10-21T04:46:03.437Z | LCP 464 ms · FCP 464 ms · TTI≈1173 ms (3 long tasks) · TTFB 107 ms · JS 3569 KiB (wire) · total 5008 KiB |
| agent5-contracts | perf-chat | 1440x900 | ✅ | 2026-10-21T04:46:11.684Z | LCP 644 ms · FCP 452 ms · TTI≈989 ms (3 long tasks) · TTFB 137 ms · JS 3565 KiB (wire) · total 10325 KiB |
| agent5-contracts | perf-sentiment | 1440x900 | ✅ | 2026-10-21T04:46:18.227Z | LCP 468 ms · FCP 468 ms · TTI≈1128 ms (3 long tasks) · TTFB 164 ms · JS 3577 KiB (wire) · total 4954 KiB |
| agent5-contracts | state-loading-live-pipeline | 390x844 | ✅ | 2026-10-21T04:46:19.065Z | live-loading visible while /api/uae/live is delayed: true |
| agent5-contracts | state-error-live-pipeline | 390x844 | ✅ | 2026-10-21T04:46:21.111Z | error state: "Live pipeline unavailable: GET /execution/list → HTTP 500 (injected). Seed data below is unaffected." |
| agent5-contracts | state-error-chat | 390x844 | ✅ | 2026-10-21T04:46:24.262Z | chat-error rendered=true, retry button=true |
| agent5-contracts | state-empty-briefing | 390x844 | ✅ | 2026-10-21T04:46:25.825Z | empty state visible=true |
| agent5-contracts | perf-overview | 390x844 | ✅ | 2026-10-21T04:46:32.667Z | LCP 332 ms · FCP 332 ms · TTI≈1048 ms (3 long tasks) · TTFB 61 ms · JS 3548 KiB (wire) · total 4596 KiB |
| agent5-contracts | perf-chat | 390x844 | ✅ | 2026-10-21T04:46:40.660Z | LCP 284 ms · FCP 284 ms · TTI≈782 ms (2 long tasks) · TTFB 71 ms · JS 3061 KiB (wire) · total 9578 KiB |
| agent5-contracts | perf-sentiment | 390x844 | ✅ | 2026-10-21T04:46:47.026Z | LCP 464 ms · FCP 464 ms · TTI≈487 ms (2 long tasks) · TTFB 120 ms · JS 1321 KiB (wire) · total 2110 KiB |
| agent5-contracts | original-branch-unchanged | server | ✅ | 2026-10-21T04:46:47.409Z | GitHub fix/news-summary-rewrite-live-verify-20261020 → 816aaaed9c3aa8fa37fbad31d3bd3f7491b3de9d; remote rollback tag object=not pushed yet |
| agent5-contracts | original-rollback-tag | server | ✅ | 2026-10-21T04:46:47.420Z | local tag → 816aaaed9c3aa8fa37fbad31d3bd3f7491b3de9d; work branch removes the old app dir only on the new branch (no diff) — the original branch is untouched |
| agent5-contracts | original-vercel-project-unchanged | server | ✅ | 2026-10-21T04:46:47.855Z | project bcapital-portfolio-intelligence-8zsb framework=services updatedAt=2026-10-13T04:31:46.417Z; newest deployment undefined null undefined (sha undefined) — no deployment created since the 21:30Z rollback point |
