# Lane B — full 192-test table (cycle 4, compiled 2026-10-21T14:22Z from baseline-192.json + cycle-4 re-runs)

Baseline (13:05Z, cycle 3) **138 pass / 16 fail / 23 env-skip / 15 not-run** (baseline-192.json reconstructs 137/17 because it carries the s1 settings.spec failure that the s1c re-run at 13:00:30Z already turned green — counted as pass here).

Cycle 4: **145 pass / 18 fail / 25 env-skip / 4 not-run**. Tests not re-run this cycle keep their baseline status (upstream-perplexity bucket not re-run against the Lane D build).

| class | count |
|---|---|
| pass | 138 |
| env-skip | 23 |
| harness-fixed | 5 |
| upstream-perplexity | 6 |
| stale-spec | 5 |
| live-od-view divergence | 5 |
| not-run-by-design | 4 |
| environment/triage | 2 |
| stale-rewritten | 2 |
| environment | 2 |

## Remaining failures by name and class

| spec | project | test | class |
|---|---|---|---|
| chat.spec.ts | desktop | answer streams incrementally via SSE with plugin activity and sources | upstream-perplexity |
| qa-chat-timing.spec.ts | desktop | two turns in one thread: timings, tool card, session reuse | upstream-perplexity |
| qa-chat-timing.spec.ts | desktop | two turns in one thread: timings, tool card, session reuse | upstream-perplexity |
| run-panel-a11y.spec.ts | desktop | every visible disclosure head is a focusable <button>/<summary> with a | upstream-perplexity |
| run-panel-a11y.spec.ts | desktop | Tab order reaches the disclosure heads with the green ring | upstream-perplexity |
| run-panel-a11y.spec.ts | desktop | .oiu-think__head text contrast vs effective background ≥ 4.5:1 | upstream-perplexity |
| run-panel-acceptance.spec.ts | desktop | thinking auto-expand, anchored header, brand chip, checklist plan, no  | stale-spec |
| run-panel-acceptance.spec.ts | desktop | thinking auto-expand, anchored header, brand chip, checklist plan, no  | stale-spec |
| run-panel-visual.spec.ts | desktop | captures run-view states + layout metrics | environment/triage |
| run-panel-visual.spec.ts | desktop | captures run-view states + layout metrics | environment/triage |
| run-panel-working-header.spec.ts | desktop | one source of truth for "Working…" across a live ≥2-tool run (desktop) | stale-spec |
| run-panel-working-header.spec.ts | desktop | one source of truth for "Working…" across a live ≥2-tool run (mobile) | stale-spec |
| session-continuity.spec.ts | desktop | turn 2 appends below turn 1; turn 1 thinking-block pinned; one thread; | live-od-view divergence |
| thinking-json-filter.spec.ts | desktop | Thinking body has no planner JSON; planner-payload lives only in dev-d | live-od-view divergence |
| thinking-json-filter.spec.ts | desktop | Thinking body has no planner JSON; planner-payload lives only in dev-d | live-od-view divergence |
| thinking-pinned-working-row.spec.ts | desktop | Thinking pinned at top, Working rows before the answer, jump pill clea | live-od-view divergence |
| thinking-pinned-working-row.spec.ts | desktop | Thinking pinned at top, Working rows before the answer, jump pill clea | live-od-view divergence |
| thread-reopen.spec.ts | desktop | reload → recent thread listed → click → messages restored; ?thread dee | stale-spec |

Runs: `s2-large-budget.log` (14:0x Z, `--workers=1 --timeout=150000`, 11 previously not-run tests + run-panel-acceptance desktop → 12 fail), `fixed-rerun.log` (nav-stress @390 9/9, voice 3/4, run-ux 4 fail), `fixed-rerun-2.log` (voice 4/4, run-ux 4 env-skip). qa-final ×4 stay not-run by design (state-capture projects).

## Full table

| spec | test | project | baseline | cycle 4 | class | evidence |
|---|---|---|---|---|---|---|
| a11y.spec.ts | overview: no serious/critical violations | desktop | pass | pass | pass |  |
| a11y.spec.ts | company: no serious/critical violations | desktop | pass | pass | pass |  |
| a11y.spec.ts | news: no serious/critical violations | desktop | pass | pass | pass |  |
| a11y.spec.ts | settings: no serious/critical violations | desktop | pass | pass | pass |  |
| a11y.spec.ts | chat: no serious/critical violations | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /overview @1440x900: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /watchlist @1440x900: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /news @1440x900: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /chat?skip=1 @1440x900: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /artifacts @1440x900: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /settings @1440x900: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /watchlist/tii @1440x900: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /overview @390x844: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /watchlist @390x844: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /news @390x844: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /chat?skip=1 @390x844: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /artifacts @390x844: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /settings @390x844: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /watchlist/tii @390x844: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| axe-sweep.spec.ts | /chat after-turn: no serious/critical (WCAG 2.2 AA) | desktop | pass | pass | pass |  |
| chat-error-retry.spec.ts | forced failure shows only the discreet notice; Retry resubmits and succeeds | desktop | pass | pass | pass |  |
| chat.spec.ts | answer streams incrementally via SSE with plugin activity and sources | desktop | fail | fail | upstream-perplexity |  |
| context-sync.spec.ts | context line + POST /api/chat systemContext mirror the inspector chips (remove o | desktop | pass | pass | pass |  |
| context-sync.spec.ts | empty context → helper copy; mobile 390 wraps the line | desktop | pass | pass | pass |  |
| copy-and-rail.spec.ts | rail ≤224 expanded / ≤64 collapsed via rail-toggle, persisted | desktop | pass | pass | pass |  |
| copy-and-rail.spec.ts | /chat: no lede under the title, no explainer copy on user surfaces | desktop | pass | pass | pass |  |
| copy-and-rail.spec.ts | overview/news ledes are short; brand line present on an unprimed first visit | desktop | pass | pass | pass |  |
| keyboard-nav.spec.ts | watchlist: cards are keyboard-reachable with the accent focus ring | desktop | pass | pass | pass |  |
| keyboard-nav.spec.ts | nav rail: Tab + arrows, only the accent focus ring anywhere | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route / | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /overview | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /watchlist | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /sentiment | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /news | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /radar | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /graph | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /briefing | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /methodology | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /docs/interactive-ui | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | bad urls are 404 | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | nav links + back/forward | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | preserved surfaces: docs + watchlist dossiers | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | no snapshot/Lambda demo on playground or chat | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | dossier #dossier-news deep link lands on the news panel | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | chat actual request 200 + answer | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | discreet retry: forced failure, no raw in DOM, retry recovers | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route / | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /overview | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /watchlist | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /sentiment | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /news | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /radar | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /graph | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /briefing | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /methodology | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | route /docs/interactive-ui | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | bad urls are 404 | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | nav links + back/forward | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | preserved surfaces: docs + watchlist dossiers | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | no snapshot/Lambda demo on playground or chat | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | dossier #dossier-news deep link lands on the news panel | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | chat actual request 200 + answer | desktop | pass | pass | pass |  |
| live-smoke.spec.ts | discreet retry: forced failure, no raw in DOM, retry recovers | desktop | pass | pass | pass |  |
| nav-stress.spec.ts | rapid-nav | desktop | pass | pass | pass |  |
| nav-stress.spec.ts | back-forward-spam | desktop | pass | pass | pass | @1440 (unchanged) |
| nav-stress.spec.ts | deep-link-reload | desktop | pass | pass | pass |  |
| nav-stress.spec.ts | drawer-open-nav | desktop | pass | pass | pass | @1440 (unchanged) |
| nav-stress.spec.ts | nav-while-streaming | desktop | pass | pass | pass | @1440 (unchanged) |
| nav-stress.spec.ts | compare-mid-nav | desktop | pass | pass | pass |  |
| nav-stress.spec.ts | news-anchor | desktop | pass | pass | pass |  |
| nav-stress.spec.ts | radar | desktop | pass | pass | pass | @1440 (unchanged) |
| nav-stress.spec.ts | bad-urls | desktop | pass | pass | pass | @1440 (unchanged) |
| nav-stress.spec.ts | rapid-nav | desktop | pass | pass | pass |  |
| nav-stress.spec.ts | back-forward-spam | desktop | fail | pass | harness-fixed | fixed-rerun.log 9/9 @390 (drawer-aware openNavIfHidden, try/catch storage init, 300 s budgets) |
| nav-stress.spec.ts | deep-link-reload | desktop | pass | pass | pass |  |
| nav-stress.spec.ts | drawer-open-nav | desktop | fail | pass | harness-fixed | fixed-rerun.log 9/9 @390 (drawer-aware openNavIfHidden, try/catch storage init, 300 s budgets) |
| nav-stress.spec.ts | nav-while-streaming | desktop | fail | pass | harness-fixed | fixed-rerun.log 9/9 @390 (drawer-aware openNavIfHidden, try/catch storage init, 300 s budgets) |
| nav-stress.spec.ts | compare-mid-nav | desktop | pass | pass | pass |  |
| nav-stress.spec.ts | news-anchor | desktop | pass | pass | pass |  |
| nav-stress.spec.ts | radar | desktop | fail | pass | harness-fixed | fixed-rerun.log 9/9 @390 (drawer-aware openNavIfHidden, try/catch storage init, 300 s budgets) |
| nav-stress.spec.ts | bad-urls | desktop | fail | pass | harness-fixed | fixed-rerun.log 9/9 @390 (drawer-aware openNavIfHidden, try/catch storage init, 300 s budgets) |
| navigation-e2e.spec.ts | route / renders @desktop | desktop | pass | pass | pass |  |
| navigation-e2e.spec.ts | route /overview renders @desktop | desktop | pass | pass | pass |  |
| navigation-e2e.spec.ts | route /watchlist renders @desktop | desktop | pass | pass | pass |  |
| navigation-e2e.spec.ts | route /sentiment renders @desktop | desktop | pass | pass | pass |  |
| navigation-e2e.spec.ts | route /radar renders @desktop | desktop | pass | pass | pass |  |
| navigation-e2e.spec.ts | route /graph renders @desktop | desktop | pass | pass | pass |  |
| navigation-e2e.spec.ts | route /docs/interactive-ui renders @desktop | desktop | pass | pass | pass |  |
| navigation-e2e.spec.ts | bad urls are real 404 | desktop | pass | pass | pass |  |
| navigation-e2e.spec.ts | nav click-through + active + back/forward + refresh | desktop | pass | pass | pass |  |
| navigation-e2e.spec.ts | dossier link, rail back to overview, #dossier-news anchor | desktop | pass | pass | pass |  |
| navigation-e2e.spec.ts | chat non-empty 200 | desktop | pass | pass | pass |  |
| navigation-e2e.spec.ts | mobile routes + nav scroll + no overflow | desktop | pass | pass | pass |  |
| navigation-retry-proof.spec.ts | retry proof 1440x900 | desktop | pass | pass | pass |  |
| navigation-retry-proof.spec.ts | retry proof 390x844 | desktop | pass | pass | pass |  |
| pdf-inline-render.spec.ts | PDF artifact → side pane renders pdf.js pages (or the preview-unavailable fallba | desktop | pass | pass | pass |  |
| pdf-inline-render.spec.ts | PDF artifact → Artifacts preview pane renders pdf.js pages (or the fallback), on | desktop | pass | pass | pass |  |
| pdf-inline-render.spec.ts | non-PDF office artifact in the side pane shows the preview-unavailable fallback  | desktop | pass | pass | pass |  |
| qa-chat-timing.spec.ts | two turns in one thread: timings, tool card, session reuse | desktop | fail | fail | upstream-perplexity |  |
| qa-chat-timing.spec.ts | two turns in one thread: timings, tool card, session reuse | desktop | fail | fail | upstream-perplexity |  |
| qa-routes.spec.ts | /overview | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /watchlist | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /watchlist/tii | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /watchlist/mbzuai | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /news | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /settings | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /chat | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /watchlist/does-not-exist | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /watchlist with reduced motion: compare tray toggles | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /overview | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /watchlist | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /watchlist/tii | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /watchlist/mbzuai | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /news | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /settings | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /chat | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /watchlist/does-not-exist | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | /watchlist with reduced motion: compare tray toggles | desktop | pass | pass | pass |  |
| qa-routes.spec.ts | collect every org-logo / monogram on /watchlist (≤60 s) | desktop | pass | pass | pass |  |
| release.spec.ts | every SSE frame carries a monotonic seq — no duplicates, no gaps, [DONE] last | desktop | pass | pass | pass |  |
| release.spec.ts | session pre-warm answers with a session id and the shell marks itself ready | desktop | pass | pass | pass |  |
| release.spec.ts | first turn reuses the pre-warmed session (ondemand.session viaHeader=true) | desktop | pass | pass | pass |  |
| routes-clean.spec.ts | /overview → 200, 0 console errors, 0 page errors | desktop | pass | pass | pass |  |
| routes-clean.spec.ts | /watchlist → 200, 0 console errors, 0 page errors | desktop | pass | pass | pass |  |
| routes-clean.spec.ts | /news → 200, 0 console errors, 0 page errors | desktop | pass | pass | pass |  |
| routes-clean.spec.ts | /chat → 200, 0 console errors, 0 page errors | desktop | pass | pass | pass |  |
| routes-clean.spec.ts | /artifacts → 200, 0 console errors, 0 page errors | desktop | pass | pass | pass |  |
| routes-clean.spec.ts | /settings → 200, 0 console errors, 0 page errors | desktop | pass | pass | pass |  |
| run-panel-a11y.spec.ts | every visible disclosure head is a focusable <button>/<summary> with a brand-gre | desktop | fail | fail | upstream-perplexity |  |
| run-panel-a11y.spec.ts | Tab order reaches the disclosure heads with the green ring | desktop | fail | fail | upstream-perplexity |  |
| run-panel-a11y.spec.ts | .oiu-think__head text contrast vs effective background ≥ 4.5:1 | desktop | fail | fail | upstream-perplexity |  |
| run-panel-a11y.spec.ts | Working band (mint gradient) text is ≥ 4.5:1 when present | desktop | pass | pass | pass |  |
| run-panel-a11y.spec.ts | prefers-reduced-motion: .oiu-spin has no animation | desktop | pass | pass | pass |  |
| run-panel-acceptance.spec.ts | thinking auto-expand, anchored header, brand chip, checklist plan, no raw JSON | desktop | fail | fail | stale-spec | asserts working-row[data-plugin=plugin-1791713636] (B Capital Portfolio plugin, not attached in the UAE build) — s2-large-budget.log |
| run-panel-acceptance.spec.ts | thinking auto-expand, anchored header, brand chip, checklist plan, no raw JSON | desktop | not-run | fail | stale-spec | asserts working-row[data-plugin=plugin-1791713636] (B Capital Portfolio plugin, not attached in the UAE build) — s2-large-budget.log |
| run-panel-visual.spec.ts | captures run-view states + layout metrics | desktop | not-run | fail | environment/triage | desktop: ENOENT test-results/ (concurrent Playwright run wiped the shared outputDir → playwright.laneB.config.ts added); mobile: toBeVisible timeout — not reproduced in isolation |
| run-panel-visual.spec.ts | captures run-view states + layout metrics | desktop | not-run | fail | environment/triage | desktop: ENOENT test-results/ (concurrent Playwright run wiped the shared outputDir → playwright.laneB.config.ts added); mobile: toBeVisible timeout — not reproduced in isolation |
| run-panel-working-header.spec.ts | one source of truth for "Working…" across a live ≥2-tool run (desktop) | desktop | not-run | fail | stale-spec | asserts "≥2 tool rows (Perplexity + Portfolio Plugin)" — Portfolio plugin not part of this build |
| run-panel-working-header.spec.ts | one source of truth for "Working…" across a live ≥2-tool run (mobile) | desktop | not-run | fail | stale-spec | asserts "≥2 tool rows (Perplexity + Portfolio Plugin)" — Portfolio plugin not part of this build |
| run-ux.spec.ts | upload: 3 images + PDF + DOCX are stored, retrievable and displayed in chat and  | desktop | skip | env-skip | env-skip |  |
| run-ux.spec.ts | report: Thinking top → Working before action → answer → Sources, PDF stored and  | desktop | skip | env-skip | env-skip |  |
| session-continuity.spec.ts | turn 2 appends below turn 1; turn 1 thinking-block pinned; one thread; no errors | desktop | not-run | fail | live-od-view divergence | expects thinking-block inside the last run-view; live runs render OdStatusView (od-status) when raw OnDemand frames are present (see Lane C) — spec vs app design to decide |
| settings.spec.ts | shows user and backend inputs; model and plugin are fixed (DeepSeek Flash v4.1 · | desktop | pass | pass | pass | s1c re-run 13:00:30Z pass |
| settings.spec.ts | editing the user id persists to localStorage | desktop | pass | pass | pass |  |
| thinking-json-filter.spec.ts | Thinking body has no planner JSON; planner-payload lives only in dev-disclosure | desktop | not-run | fail | live-od-view divergence | same: thinking-block not mounted on live od-frame runs |
| thinking-json-filter.spec.ts | Thinking body has no planner JSON; planner-payload lives only in dev-disclosure | desktop | not-run | fail | live-od-view divergence | same: thinking-block not mounted on live od-frame runs |
| thinking-pinned-working-row.spec.ts | Thinking pinned at top, Working rows before the answer, jump pill clear of Worki | desktop | not-run | fail | live-od-view divergence | DOM order received run-status-header where thinking-block expected (od-status view) |
| thinking-pinned-working-row.spec.ts | Thinking pinned at top, Working rows before the answer, jump pill clear of Worki | desktop | not-run | fail | live-od-view divergence | DOM order received run-status-header where thinking-block expected (od-status view) |
| thread-reopen.spec.ts | reload → recent thread listed → click → messages restored; ?thread deep link | desktop | not-run | fail | stale-spec | expects threads-menu at 1440; desktop threads live in the rail (rail-chats-list) since b37cc78 — threads-menu is the mobile top-bar menu |
| title-ellipsis.spec.ts | thread titles ellipsise + carry the full title (desktop) | desktop | pass | pass | pass |  |
| title-ellipsis.spec.ts | thread titles ellipsise + carry the full title (mobile-390) | desktop | pass | pass | pass |  |
| upload-artifacts.spec.ts | empty Artifacts state renders | desktop | skip | env-skip | env-skip |  |
| upload-artifacts.spec.ts | API: each fixture uploads via /api/media and is listed by /api/artifacts as an u | desktop | skip | env-skip | env-skip |  |
| upload-artifacts.spec.ts | UI: pick → progress → processed → chip → sent → cited → Artifacts → reload | desktop | skip | env-skip | env-skip |  |
| upload-artifacts.spec.ts | blurred memo: agent must say it cannot read it, never invent text | desktop | skip | env-skip | env-skip |  |
| upload-artifacts.spec.ts | failure path shows red state + retry | desktop | skip | env-skip | env-skip |  |
| upload-artifacts.spec.ts | upload chip and Artifacts page have no horizontal overflow | desktop | skip | env-skip | env-skip |  |
| upload-e2e.spec.ts | U1 counters baseline → PDF+PNG paperclip upload → chips ready → artifacts persis | desktop | skip | env-skip | env-skip |  |
| upload-e2e.spec.ts | U2 /artifacts lists both as "input", PDF icon pdf / PNG icon image|chart, counte | desktop | skip | env-skip | env-skip |  |
| upload-e2e.spec.ts | U1 counters baseline → PDF+PNG paperclip upload → chips ready → artifacts persis | desktop | skip | env-skip | env-skip |  |
| upload-e2e.spec.ts | U2 /artifacts lists both as "input", PDF icon pdf / PNG icon image|chart, counte | desktop | skip | env-skip | env-skip |  |
| upload-journeys.spec.ts | PDF: upload → ready → grounded answer cites the file → artifact persisted → surv | desktop | skip | env-skip | env-skip |  |
| upload-journeys.spec.ts | DOCX: compendium.docx (15 MB) → ready → answer about the DOCX → artifact persist | desktop | skip | env-skip | env-skip |  |
| upload-journeys.spec.ts | image: geothermal-plant.png → thumb in chip + under message → grounded descripti | desktop | skip | env-skip | env-skip |  |
| upload-journeys.spec.ts | image: bar-chart.png → thumb in chip + under message → grounded description | desktop | skip | env-skip | env-skip |  |
| upload-journeys.spec.ts | image: blurred-memo.png → thumb in chip + under message → honest 'cannot read' a | desktop | skip | env-skip | env-skip |  |
| upload-journeys.spec.ts | persistence: /artifacts lists the three images as uploads, also after reload | desktop | skip | env-skip | env-skip |  |
| upload-journeys.spec.ts | ui: tool.exe → error chip (red) with retry; retry stays error; remove works; 0-b | desktop | skip | env-skip | env-skip |  |
| upload-journeys.spec.ts | api: POST /api/media with an unsupported extension → 400 unsupported_type | desktop | skip | env-skip | env-skip |  |
| upload-journeys.spec.ts | mobile image: geothermal-plant.png | desktop | skip | env-skip | env-skip |  |
| upload-journeys.spec.ts | mobile image: bar-chart.png | desktop | skip | env-skip | env-skip |  |
| upload-journeys.spec.ts | mobile image: blurred-memo.png | desktop | skip | env-skip | env-skip |  |
| upload.spec.ts | upload: 26 MB file is rejected with 413 too_large | desktop | pass | pass | pass |  |
| upload.spec.ts | upload: tool.exe is rejected with 400 naming the allowed types | desktop | pass | pass | pass |  |
| upload.spec.ts | upload: zephyr-7.md uploads and /api/chat answers 41.7 MWh from it | desktop | pass | pass | pass |  |
| upload.spec.ts | ui: picking zephyr-7.md in the composer shows an attachment chip (ready or error | desktop | pass | pass | pass |  |
| voice.spec.ts | voice relay: POST /api/voice/tts answers ok:true + https audioUrl, or an honest  | desktop | fail | pass | stale-rewritten | rewritten to POST /api/voice/workflow contract; fixed-rerun-2.log 4/4 |
| voice.spec.ts | voice relay: expired/unknown clip token is a 404 and STT rejects a non-audio for | desktop | pass | pass | pass |  |
| voice.spec.ts | voice UI: mic button in the composer → listening (fake mic) or an honest error;  | desktop | fail | pass | stale-rewritten | rewritten to the voice dock; fixed-rerun-2.log 4/4 |
| voice.spec.ts | voice a11y: caption strip is a polite live region and the mic has an accessible  | desktop | pass | pass | pass |  |
| mobile.spec.ts | overview: no horizontal overflow, nav visible, no page errors | mobile | pass | pass | pass |  |
| mobile.spec.ts | company: no horizontal overflow, nav visible, no page errors | mobile | pass | pass | pass |  |
| mobile.spec.ts | news: no horizontal overflow, nav visible, no page errors | mobile | pass | pass | pass |  |
| mobile.spec.ts | settings: no horizontal overflow, nav visible, no page errors | mobile | pass | pass | pass |  |
| mobile.spec.ts | chat: no horizontal overflow, nav visible, no page errors | mobile | pass | pass | pass |  |
| run-panel-mobile.spec.ts | no horizontal overflow; working rows ≤ 72 px; header/footer wrap | mobile | pass | pass | pass |  |
| run-ux.spec.ts | upload: 3 images + PDF + DOCX are stored, retrievable and displayed in chat and  | mobile-ux | fail | env-skip | environment | Artifacts backend guard → skipped (fixed-rerun-2.log) |
| run-ux.spec.ts | report: Thinking top → Working before action → answer → Sources, PDF stored and  | mobile-ux | fail | env-skip | environment | Artifacts backend guard → skipped (fixed-rerun-2.log) |
| qa-final.spec.ts | routes: console + page errors per route | qa-final | not-run | not-run | not-run-by-design |  |
| qa-final.spec.ts | chat: upload states, run states, sources, artifacts, lightbox, doc preview | qa-final | not-run | not-run | not-run-by-design |  |
| qa-final.spec.ts | routes: console + page errors per route | qa-final-mobile | not-run | not-run | not-run-by-design |  |
| qa-final.spec.ts | chat: upload states, run states, sources, artifacts, lightbox, doc preview | qa-final-mobile | not-run | not-run | not-run-by-design |  |
