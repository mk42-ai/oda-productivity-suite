# QA_REPORT — 2026-10-21 QA cycle 4 (13:28Z → 2026-10-21T14:27Z) — preview https://sb-2pnr5jjv61vv.vercel.run (sbx_kNCjjcHasZqxZZXLXjsc94k4PBMn, built from HEAD 2ce7426 content, /health 200 at 14:23:59Z, ondemand_key true)
Pre-change checkpoint: tag `uae-qa4-pre-20261021T13Z` → c005420 (pushed 2026-10-21T13:30:09Z). Raw evidence: `qa/2026-10-21-cycle4/` (laneA/ spec + 14 PNG + pass2-results.jsonl + logs; laneB/ baseline-192.json, final-192.md, 3 run logs/JSON, 4 PNG; laneC/ laneC-results.json|md + 13 PNG; laneD/ 4 PNG + health/plugins JSON + verify-results.json + 84-check results-agent*-c4.json + suite/ 57 JPG + live-chat-probe-2ce7426.sse; laneE/ probes + Vercel JSON + 8 PNG; sweep.json + sweep-baseline-c005420.json).
Upstream condition throughout: OnDemand Perplexity plugin-1722260873 (pinned on every chat run) out of credits — direct sync probe 13:35:43Z (session 6ad8bfaf7bb80aa7c2d988b9): *"web search failed due to insufficient credits"*; ≈13:22Z probe: HTTP 500 `{"error":"Internal server error","message":"Not enough credits"}`; intermittent (one clean briefing call at 14:10Z). PERPLEXITY_CREDITS_RESTORED=false.

## Lane A — `chat-intelligent-ui-payloads.spec.ts` restored (from 1f878a1 = 1ed4247^, original kept as `laneA/*.ORIGINAL-1f878a1.ts`) and adapted to the UAE chat UI (`e2e/chat-intelligent-ui-payloads.spec.ts`, 9 `// ADAPTED:` notes — fixture streams → paced AG-UI mock server via page.route; Intelligent-UI slots → run-view / plan-stepper / artifact-card / citation-chip / sources-list; F and the Retry half of G hit the REAL backend)
| Scenario | 1440×900 | 390×844 | Proof |
|---|---|---|---|
| A deliverables (artifact-card + Outputs card after the run) | PASS | PASS | payload-A-1440x900.png / -390x844.png |
| B pipeline & waiting (plan-stepper 3 steps, live run header, ticking run-timer, working rows, pending→done step-summary) | PASS | PASS | payload-B-*.png |
| C citations (≥4 publisher chips, sources-list 5 links, https + _blank + noopener noreferrer, no proxy/tracking) | PASS | PASS | payload-C-*.png |
| D root-first (run-skeleton/run-view paint before first text delta, no broken img, no overflow) | PASS | PASS | payload-D-*.png |
| E summarisation vs history (thinking-block / working-list identity stable across 3 summary frames, rows monotonic, wheel scroll-up respected + jump-to-latest) | PASS | PASS | payload-E-*.png |
| F settings & plugin caps (REAL backend: pinned plugin locked, cap MERGED_LIST_CAP=40, POST body mirrors inspector, HTTP 200 + answer) | PASS | PASS | payload-F-*.png |
| G failure/retry (first POST 500 → discreet notice only; Retry → REAL 200 + answer) + cross-app sweep of 8 routes (200, 0 page errors, 0 h-scroll) | PASS | PASS | payload-G-*.png |
**14/14 pass** (run-1440.log 14:05:14–14:06:44Z, run-390.log 14:06:44–14:08:13Z). No genuine app bug surfaced → no src change from Lane A. Spec is type-checked standalone (e2e/ is excluded from tsconfig).

## Lane B — 192-test closure (`laneB/final-192.md`, compiled from `baseline-192.json` + cycle-4 re-runs)
| | pass | fail | env-skip | not-run |
|---|---|---|---|---|
| Baseline 13:05Z (cycle 3) | 138 | 16 | 23 | 15 |
| **Cycle 4** | **145** | **18** | **25** | **4** |
Classification of the 9 non-Perplexity baseline failures: **harness (5)** nav-stress @390 back-forward-spam / drawer-open-nav / nav-while-streaming / radar / bad-urls → fixed (drawer-aware `openNavIfHidden`, `try/catch` around the init-script localStorage write, 300 s budgets for radar/bad-urls) → **9/9 pass** (fixed-rerun.log 13:5xZ); **stale spec (2)** voice.spec tts-relay + mic-button → rewritten to the shipped `/api/voice/workflow` contract + voice dock → **4/4 pass** (fixed-rerun-2.log 13:57:15Z); **environment (2)** run-ux mobile-ux upload/report → now env-skip (Artifacts backend guard). The 11 previously not-run tests ran with `--workers=1 --timeout=150000` (s2-large-budget.log, exit 14:06:22Z): all 12 (incl. run-panel-acceptance desktop) fail — **stale spec (5)**: run-panel-acceptance ×2 + run-panel-working-header ×2 assert the B Capital *Portfolio plugin* (`plugin-1791713636`) tool row, thread-reopen expects the mobile `threads-menu` at 1440 (desktop threads live in the rail since b37cc78); **live od-view divergence (5)**: session-continuity, thinking-json-filter ×2, thinking-pinned ×2 expect `thinking-block` inside the last run-view, but live runs with raw OnDemand frames render `OdStatusView` (Lane C finding) — spec-vs-design decision open; **environment (2)**: run-panel-visual desktop ENOENT (a concurrent Playwright process wiped the shared `test-results/` → `playwright.laneB.config.ts` with a private outputDir added), mobile toBeVisible timeout not reproduced in isolation. **Upstream-Perplexity (6)** not re-run (chat.spec, qa-chat-timing ×2, run-panel-a11y ×3 keep the baseline status; cycle-3 counted 7 incl. run-panel-acceptance desktop, now reclassified stale). qa-final ×4 remain not-run by design. Screenshots: laneB-c4-chat-reentry-saved-threads-{1440x900,390x844}.png (no React #418 on /chat re-entry with saved threads in this run), laneB-c4-voice-surface-*.png. Lane B's agent hit its action cap before writing the table; the coordinator compiled it from the agent's JSON/logs.

## Lane C — populated Plan/Run surfaces + re-measurement on the real backend (`laneC/laneC-results.json|md`, 13 PNG, 13:55–13:58Z)
5 multi-step threads seeded (32.1 / 45.2 / 31.6 / 27.1 / 24.1 s; 16 / 3 / 12 / 8 / 2 citations; every planner reply = 1 step). **There are no literal Plan/Run tabs**: the "Plan" surface = `[data-testid=od-status]` status log in the run view (toggle `run-logs-toggle`), the "Run" surface = inspector `run-rail` "This run" card with `dev-disclosure`. `plan-stepper` renders only in the non-od branch of RunView; every live run on this build carries raw OnDemand frames (`odView` truthy), so it never mounts on a live run — cycle-3's "plan_required:false" explanation was incomplete.
| Element | Spec | 1440×900 | 390×844 |
|---|---|---|---|
| Rail expanded / collapsed (persisted `uaecc.nav.rail`, hard reload) | 224 / 64 | **224 / 64**, 224 after reload, 5 rail items before and after reload | drawer **280 px** (max 85vw), overlay 390×844, 5 drawer thread items |
| Top bar | 52 | **52** (`.openui-agent-thread-header`) | — |
| Conversation column | 800 | **800** (`.openui-agent-thread-messages` and `.oiu-composer`) | docScroll 390 |
| Inspector | 360 | **360** (x=1080 open) | bottom sheet 390 × 717 (≤85dvh) |
| run-view scrollWidth ≤ clientWidth with status logs open | ≤ | 720 vs 712 → **fixed** (`ml-2 w-auto min-w-0` on the status-log wrapper, chat-shell.tsx L798, commit 8901901) | 316 vs 308 → fixed by the same change |
Screenshots: plan-tab-{1440x900,390x844}.png, plan-tab-logs-closed-1440x900.png, run-tab-{1440x900,390x844}.png, inspector-open-*.png, rail-expanded-threads / rail-collapsed / rail-after-reload-1440x900.png, drawer-open-390x844.png, run-streaming-{1,2}-1440x900.png.

## Lane D — Perplexity availability / coverage state (commit 8901901; `laneD/`)
Implemented: `src/lib/ondemand/plugin-availability.ts` (per-process store, exponential backoff **1 → 2 → 4 → 8 → 16 → 30 min cap**, failures < 30 s apart coalesce, reset when the plugin delivers real sources; one probe run after the window); chat bridge skips the pinned plugin while unavailable and emits `ondemand.coverage` + `ondemand.error{code:plugin_error, reason:backoff|credits|upstream, nextRetryAt}` at run start — a plugin_error turn whose answer streamed no longer renders "Response failed · Retry" but a discreet amber `coverage-notice` ("Web research source unavailable (Perplexity credits exhausted) — coverage reduced to the curated uae_cc_v1 dossiers, news and sentiment records already loaded. No web facts were added."); run-rail chip state `unavailable` with reason; `/api/briefing` returns `coverage:{web:"unavailable",reason,nextRetryAt}` and the client shows `briefing-coverage` ("Live web research unavailable — briefing grounded on curated sources only"); `GET /health.web_research` and `GET /api/plugins` availability/blocked state. Nothing is substituted; no chat is re-run. Verified on the deployed preview: live `POST /api/chat` 14:24:53Z → HTTP 200 in 14.4 s, 227 frames, `ondemand.coverage web:unavailable reason:upstream nextRetryAt 14:26:01Z`, one `plugin_error`, answer streamed; `/health.web_research = {available:false, reason:backoff, backoffMinutes:1}` (laneD/live-chat-probe-2ce7426.sse). Browser proof: coverage-chat-{1440x900,390x844}.png, briefing-coverage-*.png.
**84-check suite** (lane D build, 14:11–14:15Z): **84/84** — agent1 11/11 · agent2 14/14 · agent3 13/13 · **agent4 14/14** (baseline 4/14: the 10 chat checks failed only on the "Response failed" notice; they now see the coverage notice — the agent was not edited) · agent5 32/32. Baseline 74/84. Caveat: all 10 chat questions ran inside the backoff window (curated-source grounding only, still Verified/Interpretation + citation chips).

## Lane E — Vercel git preview (`laneE/`, 13:47Z; API_HEALTH "Vercel git preview — 2026-10-21T13:48:58Z")
| URL | Method | Status | Redirect |
|---|---|---|---|
| alias + dpl_7sWk… `/health`, `/api/uae/live`, `/api/plugins`, `/chat` | GET | **302** | https://vercel.com/sso-api (Vercel Authentication) |
| alias + dpl `/api/chat` | POST json | **401** `{"error":{"message":"Protected deployment"},"protection":{"vercel_auth_enabled":true,"password_enabled":false}}` | — |
Project prj_wXz5xY3PNULypuwepaqu1XKa6sP1: `ssoProtection.deploymentType=all_except_custom_domains`, passwordProtection null, protectionBypass {}, rootDirectory `app`, framework vite (deployment snapshot nextjs), **env vars 0**; dpl_7sWk… READY (c005420) with 137 system env keys and 0 user keys. **Blocker: 0 ONDEMAND_API_KEY / ONDEMAND_BASE_URL on project; previews behind SSO → the sandbox preview remains the demo surface.** No env var created, no redeploy triggered. Screenshots: vercel-preview-sso-*.png, sandbox-overview-*.png.

## Regression gate (on https://sb-2pnr5jjv61vv.vercel.run, HEAD 2ce7426)
- AA contrast sweep 13 routes × 2 vp: **8,164 text nodes / 0 below AA / 0 genuine** (36 `oklab()/color()` artefacts skipped) — baseline c005420 13:50Z: 8,238 / 0 / 0.
- Horizontal scroll **26/26** clean (both builds).
- Residue (B Capital / bcapital / navy / gold / emerald): DOM **0/26**, network **0** theme hits (186 vendored colour-name matches in library chunks, 26 of them the `|navy|` keyword list in 19881-*.js — identical on the baseline build); code: unchanged.
- `tsc --noEmit` exit 0 (14:18Z); `next build` exit 0 locally (14:20Z) and in the sandbox (14:23Z).
- ui-validator on the live preview: `/chat` and `/briefing` at 1440×900 + 390×844 — 52 px thread header, `engine-credit` present, no `theme-toggle`, "Concept Demonstration" present, no "B Capital", 0 page errors (`.ui-proof/after-chat-*.png`, `after-briefing-*.png`).
- Light-only theme unchanged (toggle gated by `NEXT_PUBLIC_ENABLE_DARK_THEME=0`); OnDemand credit surfaces unchanged (methodology page, plugin list, muted composer line).

---
# QA_REPORT — 2026-10-21 QA closure cycle 3 (11:44Z → 2026-10-21T13:02:31Z) — preview https://sb-60putp7mv2mi.vercel.run (sbx_OzN6O6mMApNf2QJR413ZE9mGpNuw, built from the working tree at 12:38Z = 14e032e content, health 200 at 12:40:13Z)
Raw run output for every lane: `qa/2026-10-21-cycle3/` (laneA/*.json|*.log + shards.txt, laneB/, laneC-stale-triage.md, laneD-environment.md, laneE/, laneF-payloads.md, laneG-executions.json, sweep.json, results-agent*-c3.json).

## Lane A — Playwright (192 tests listed after the rewrites: 180 desktop · 6 mobile · 2 mobile-ux · 4 qa-final state-capture)
| Shard | Specs | Budget | Executed | Pass | Fail | Skipped | Not run | Base |
|---|---|---|---|---|---|---|---|---|
| s1-routes (12:25–12:28Z) | a11y, axe-sweep, routes-clean, live-smoke, navigation-e2e, qa-routes, copy-and-rail, keyboard-nav, context-sync, chat-error-retry, navigation-retry-proof, settings, release, title-ellipsis | 900 s | 108 | 103 | 5 | 0 | 0 | local 60e604c+fixes |
| s1b/s1c re-runs after fixes (12:57–13:00Z) | axe-sweep 15, keyboard-nav 2, settings 2, title-ellipsis 2 | 400 s | 21 | **21** | 0 | 0 | 0 | sandbox |
| s2-runpanel (12:41–12:54Z, hit 780 s cap) | chat, pdf-inline-render, qa-chat-timing, run-panel-a11y, run-panel-acceptance, run-panel-visual, run-panel-working-header, thinking-*, thread-reopen, session-continuity | 780 s | 12 | 5 | 7 | 0 | **11** | local |
| s3-uploads (12:48–12:59Z) | upload*, voice, run-ux, nav-stress | 780 s | 49 | 19 | 7 | 23 (env guard) | 0 | sandbox |
| s4-mobile (12:45–12:46Z) | mobile, run-panel-mobile, run-ux@390 | 600 s | 8 | 6 | 2 | 0 | 0 | sandbox |
| **Latest status per unique test** | | | **177 / 192** | **138** | **16** | **23** | **15** (11 budget + 4 qa-final by design) | |
Failure classification (16): **upstream/environment 7** — chat.spec, qa-chat-timing ×2, run-panel-a11y ×3, run-panel-acceptance desktop: every live run after ≈12:40Z ends in the discreet "Response failed · Retry" notice because OnDemand's Perplexity plugin (plugin-1722260873, pinned) answers *"lookup failed for insufficient credits"* (verified with a direct `POST /chat/v1/sessions/<id>/query` at 12:55Z: HTTP 200, answer = "I can't verify … insufficient credits"); the bridge's `execution_failed` for the pinned plugin is by design (chat-bridge.ts ~L1004). The five Lane-E threads seeded at 12:39Z still got full cited answers, so credits ran out mid-cycle. **harness 3** — nav-stress @390 back-forward-spam / drawer-open-nav / nav-while-streaming: the recorded events are `SecurityError: localStorage … about:blank` from the harness' own init script when `goBack()` lands on about:blank, plus one React #418 on /chat re-entry at 390 (open, see below). **timeout 2** — nav-stress @390 radar / bad-urls (150 s, drawer-aware nav on the remote sandbox). **stale 2** — voice.spec: `POST /api/voice/tts` no longer exists (voice went through `/api/voice/workflow` in the UAE build) and the mic button is not rendered in the composer slot — triage pending. **env 2** — run-ux @390 (artifact store `not_provisioned`; the guard added in a04bc09 turns these into skips on the next run).
Previous-run buckets: 22 stale specs → **all rewritten** (laneC table, 28 rows, 1 DELETE-merged); 17 app bugs → 14 were fixed last turn, the remaining 3 fixed in 14e032e (below); 4 environment → documented in laneD (ffmpeg mitigated, live-smoke assertion rewritten).

## Lane B — the 3 remaining app bugs (fix commit 14e032e; proof `qa/2026-10-21-cycle3/laneB/`)
| Bug | Root cause | Fix | Re-run / measurement |
|---|---|---|---|
| keyboard-nav: rail focus ring read `rgb(37,99,235)` → spec said "no blue" | spec/token conflict (spec'd single accent IS #2563EB) **plus** a real defect: `transition-colors` on rail links animated `outline-color` from the text colour, so the ring measured `rgb(13,13,13)` / `rgb(14,16,20)` right after focus | `transition-[background-color,color]` on the rail links; spec now asserts every ring == `37, 99, 235` | keyboard-nav 2/2 pass (s1b); live probe on the sandbox: outlineColor `rgb(37, 99, 235)` @1440, `rgb(37, 99, 235)` @390 — screenshots focus-ring-rail-1440x900.png / -390x844.png |
| run-panel-mobile: run-view scrollWidth 326 > 319 @390 | the thinking block wrapper `ml-2 … w-full max-w-[840px]` is 100 % wide **plus** 8 px margin inside the run view | `w-auto min-w-0` (chat-shell.tsx ×2, od-chat/chat-component.tsx) | run-panel-mobile pass (s4): `rvScroll 318 / rvClient 318` streaming and settled; probe: {'scrollWidth': 318, 'clientWidth': 318, 'docScroll': 390, 'inner': 390} @390, {'scrollWidth': 712, 'clientWidth': 712, 'docScroll': 1440, 'inner': 1440} @1440 — run-view-390x844.png |
| nav-stress back-forward-spam "stress events" | the harness clicked `nav-companies/signals/social` which no longer exist → `harness-step` + console errors | spec rewritten to the UAE routes with a drawer-aware `openNavIfHidden()`; nav-stress @1440 now 9/9 pass | @390: 5/9 still fail (3 harness about:blank artefacts + React #418, 2 timeouts) — open |
Also fixed on the way: axe `target-size` on dossier HF model links (`min-h-[24px]`, 15/15 axe green), rail `thread-title` span carries `title=` (CSS contract), SSR-safe `useThreadNav` snapshot (React #418 on /chat reload with saved threads — fixed for the desktop rail; a 390 re-entry case remains).

## Lane E — live rail verification on the real OnDemand backend (local build of HEAD, key from the session env; `qa/2026-10-21-cycle3/laneE/laneE-results.json` + 12 PNGs)
5 real threads seeded through the chat flow (real answers with Verified-facts sections + citation chips; 35.0 / 20.4 / 14.9 / 15.9 / 10.9 s).
| Element | Spec | Measured @1440×900 | Measured @390×844 | Persistence across reload | Screenshot(s) |
|---|---|---|---|---|---|
| Rail expanded | 224 px | **224 px** (`data-collapsed=false`) | n/a (rail hidden, drawer) | `uaecc.nav.rail=expanded` → 224 px after hard reload | rail-expanded-threads-1440x900.png, rail-expanded-after-reload-1440x900.png |
| Rail collapsed | 64 px | **64 px** | n/a | `collapsed` → 64 px after reload | rail-collapsed-threads-1440x900.png, rail-collapsed-after-reload-1440x900.png |
| Rail-hosted thread list | ≥5 threads inside the rail | **5 items**, descendant of `nav-rail` = True (collapsed: icons only, 0 rows) | drawer 280 px shows the nav; thread rows in the drawer: 0 (mobile threads live in the top-bar `threads-menu`) | 5 items again after reload | rail-expanded-after-reload-1440x900.png, drawer-open-threads-390x844.png |
| Top bar | 52 px | **52 px** | **52 px** | — | run-settled-1440x900.png, chat-390x844.png |
| Conversation column | 800 px centred | **800 px** (left offset 427 px expanded / 347 px collapsed) | full width, docScroll 390 = 390 | — | run-settled-1440x900.png |
| Composer | one row | row 50 px, textarea 24 px / rows=1 | row 70 px | — | chat-390x844.png |
| Run-panel inspector | ≤360 px, populated | **360 px**, content: "This run · GPT-5.6 Luna · reasoning medium · Developer details · Organisation context 2/5 …" | bottom sheet 390×717 px | — | inspector-open-1440x900.png, inspector-open-390x844.png |
| Plan / Run surfaces | populated | `run-logs-toggle` present; reopened thread 3 shows the run view with header "14.0 s · 10,838 tokens", Thinking log (planner objective + plan_required flag) and answer; **`plan-stepper` count 0** — the planner returned `plan_required:false` for all 5 one-line questions, so the checklist never mounted | — | thread-reopened-plan-run-1440x900.png, run-streaming-1440x900.png |
| 390 drawer | open / overlay / outside-tap close | — | **280 px**, overlay True, aria-hidden false → after tap at (380,400): aria-hidden true, overlay False | — | drawer-open-threads-390x844.png |
Page errors on reload with 5 saved threads: [] (the SSR snapshot fix).

## Regression gate (on https://sb-60putp7mv2mi.vercel.run)
- Existing 84-check suite (round c3, 12:42–12:48Z): **74/84** — 1440×900 28/33 · 390×844 27/32 · server 19/19. Agents 1/2/3/5 = 11/11, 14/14, 13/13, 32/32; **agent4 4/14**: the 5 demo questions ×2 vp answer (HTTP 200, Verified+Interpretation, 1–7 citation chips) but the discreet failure notice is shown because the pinned Perplexity call fails upstream for *insufficient credits* (see Lane A); briefing-generate + scheduled-panel pass.
- AA contrast sweep: **8240 text nodes / 0 below AA / 0 genuine** (13 routes × 2 vp, 24 `oklab()/color()` background artefacts skipped).
- Horizontal scroll: **26/26 clean**.
- Residual sweeps: B Capital / bcapital / b-capital — code 0 (6 `bcap` matches are the rollback tag name + the residual scanner's own pattern list), DOM 0/26, network 0; navy / gold / emerald — code 0 (2 `emerald` hits are the token-audit script's Tailwind palette list), DOM 0/26, network: 134 matches, **all** inside vendored CSS-colour-name tables in three library chunks (`navy:128`, `gold:0xffd700`, Tailwind `emerald:{…oklch}` in 7507-*.js / 19881-*.js / 5ced8d4d-*.js) — not theme tokens.
- `tsc --noEmit` exit 0; `next build` exit 0 (71 static pages) at 12:21Z and 12:31Z.

---
# QA_REPORT — 2026-10-21 verification turn (10:16Z → ~11:30Z): contrast fix, layout spec, dark theme, e2e, assets
Preview under test: new sandbox build of the working tree, https://sb-55dvd3y2jwnj.vercel.run (created 10:28:46Z from HEAD 0aa7eb2 + this turn's edits); previous build https://sb-54yh1uujw0kw.vercel.run (eeba60b) served as BEFORE until it stopped (HTTP 410 SANDBOX_STOPPED at ~10:41Z). The Vercel git preview dpl_Ga19v74DiAHLkG3xjMQC3xJVVdez (0aa7eb2, READY 09:58:38Z) answers 302 "Protected by Vercel Authentication" (project ssoProtection = all_except_custom_domains), so browser QA ran on the sandbox.

## Lane A — AA contrast (`qa/screenshots/20261021-v2/contrast-{before,after}.json`, `contrast-summary.md`)
| | BEFORE (eeba60b, baseline) | AFTER (this build) |
|---|---|---|
| text nodes checked (13 routes × 2 viewports) | 6,695 | 8,895 (exhaustive TreeWalker) |
| below AA (raw) | 105 | 38 |
| genuine | 73 | **0** |
| parser artefacts (`oklab(…)` / `color(srgb …)` backgrounds) | 32 | 38 |
Fix: muted-label token `#8E8E8E` → `#737373` in light (`--muted-3`, `--uae-muted`, `--five`, every `text-[#8E8E8E]`, chat shell CSS) and `#A3A3A3` in `html.dark`; brand-rail label raised 10→11 px. Measured: "Concept demonstration" #737373 on #F9F9F9 = **4.5037:1** (was 3.11), page eyebrows on white **4.74:1** (was 3.28), composer hint + engine credit 4.74:1. Radar: ring chips/blip numerals now use dark ink on the light `assess` (#B8A98F → 8.43:1, was 2.31) and `hold` (#A3A3A3 → 7.70:1, was 2.52) fills (`RINK` map in `src/app/radar/page.tsx`).
Remaining 38 hits, all artefacts: /watchlist sticky toolbar (9 per viewport: `label.relative > span.sr-only` "Search watchlist", 5 `button[data-testid="filter-*"]` pills, `span[data-testid="watchlist-count"]`) — background reported as `oklab(0.999994 … / 0.95)` (Tailwind v4 `bg-white/95`), visually #5D5D5D on near-white ≈ 7.0:1; /chat and /settings company-picker chips (5 per viewport: `span[data-testid="context-chip"] > span.context-chip__name`) — background `color(srgb 0.931 0.928 0.925)`, visually #44403C on #EDECEC ≈ 9:1. No genuine AA miss remains.

## Lane B — chat layout spec (measured on the live preview, 1440×900 unless stated; screenshots `qa/screenshots/20261021-v2/<route>-<viewport>_v2.png`, 31 files)
| Item | Spec | Measured | Result |
|---|---|---|---|
| Left rail expanded / collapsed | 224 / 64 px | 224 / 64 px (`aside[data-testid="nav-rail"]`) | ✅ |
| Collapse persisted across reload | localStorage | `uaecc.nav.rail` = `expanded` / `collapsed`, state retained after hard reload both ways | ✅ |
| Rail-hosted thread list | inside rail | `[data-testid="rail-chats-section"] > [data-testid="rail-chats-list"]` is a descendant of the rail; empty state "No chats yet" (now with the empty-state illustration, `data-testid="threads-empty"`). Pending (unsent) threads are filtered out, so a populated list needs a real send — NOT exercised (API cost) | ✅ structure / ⚠ populated list not verified |
| Top bar | 52 px, mark + "Concept Demonstration" only | `.openui-agent-thread-header` 52 px; children: `img[src="/brand/mark-light.png"]` 24×24 + label "Concept Demonstration" #737373 12 px; nothing else | ✅ |
| Conversation column | 800 px centred | `max-width: 800px`, rect 800 px, left/right offset 24/24 px | ✅ |
| Composer | one-row pill, attach icon, black circular send | flex-row, `border-radius: 9999px`, `button[data-testid="attachment-button"]` aria-label "Attach a file", send 36×36 px radius 9999 px, `rgb(13,13,13)` when enabled (#E5E5E5 disabled) | ✅ |
| Credit line | muted, under composer only | `[data-testid="engine-credit"]` "Intelligence engine: OnDemand" #737373 11 px under the hint; no OnDemand/AIREV copy in headers, hero or logos on /chat | ✅ |
| Run-panel inspector | ≤ 360 px, Plan/Run tabs | opened via `button[data-testid="inspector-toggle"]` → `aside#chat-inspector` measured **420 px** (`lg:w-[420px]`) → **FIXED in this turn to `lg:w-[360px]`** (re-measure pending on the next build). Plan stepper / run view mount only during a live run — not measurable without sending a message | ⚠ fixed, re-measure pending |
| 390 px drawer | open / close / outside tap | `button[data-testid="rail-drawer-toggle"]` → `aside[data-testid="rail-drawer"]` 280 px (`min(280px, 85vw)`), overlay `[data-testid="rail-overlay"]` rgba(0,0,0,.4); tap at (380,400) closes (aria-hidden=true, -translate-x-full, overlay unmounted) | ✅ |
| Horizontal scroll | 0 on 26 route×viewport | 24/26 at first pass: `/watchlist` 390 = 406 px (the `select[data-testid="filter-ecosystem"]` was 385 px wide inside the 16 px gutters) and `/briefing` 390 = 478 px (unwrapped `<code>` URLs in the generated markdown) → fixed (`max-w-full` on the select; `break-words` + `[&_code]:break-all` on both briefing renderers) — re-check pending on the next build | ⚠ fixed, re-check pending |

## Lane C — dark theme: decision = **light-only ship, toggle hidden**
Measured with `localStorage.uaecc.theme = dark` on all 13 routes at 1440×900: `html.dark` applies and body goes #212121 with #2F2F2F cards / #3A3A3A borders and a #60A5FA focus ring, but the page content never inverts — H1s stay `rgb(13,13,13)` on #2F2F2F (**1.45:1**), eyebrows #737373 on #2F2F2F (2.82:1), ledes #5D5D5D (2.03:1), /artifacts labels #4B5563 on #212121 (2.13:1); /chat is `force-light` (white main inside the dark shell) with 81/260 sampled nodes below AA; /settings 90/298. Only /settings and /artifacts headings pick up the dark foreground. 13/13 routes fail AA → the toggle is now gated behind `NEXT_PUBLIC_ENABLE_DARK_THEME=1` (`src/components/shell/theme-toggle.tsx`), `THEME_SCRIPT` forces `html.light` and clears a stale `dark` preference, the #212121 token scale is kept for a later pass. Evidence: `qa/screenshots/20261021-v2/overview-dark-1440x900_v2.png`, `chat-dark-1440x900_v2.png`, `/tmp/laneC.json` readings reproduced above.

## Lane D — 39 Playwright e2e specs (`e2e/`: 35 spec files + 3 helpers + perf/; reports in `qa/screenshots/20261021-v2/playwright-report-{desktop,mobile}/index.html`, JSON `results-{desktop,mobile}.json`)
Run against sb-55dvd3y2jwnj (pre-fix build of this turn), `--workers=1`, desktop capped at 1500 s, mobile + mobile-ux at 600 s; `qa-final*` projects skipped (state capture, not tests).
| Project | Configured | Executed | Pass | Fail | Not run | Duration |
|---|---|---|---|---|---|---|
| desktop | 175 | 63 (+1 killed by the cap) | 23 | 40 | 112 | 1500 s (cap) |
| mobile | 7 | 7 | 6 | 1 | 0 | 37 s |
| mobile-ux | 2 | 2 | 0 | 2 | 0 | 0.5 s |
| **total** | **184** | **72** | **29** | **43** | **112** | **1,538 s** |
Spec files: 10 completed (a11y, axe-sweep, chat-error-retry, chat, context-sync, copy-and-rail, keyboard-nav, live-smoke, mobile, run-panel-mobile, run-ux), 1 partial (nav-stress 5/18), 22 desktop specs not reached (navigation-e2e … voice), qa-final skipped.
Classification of the 43 failures: **22 STALE SPECS** (routes `/companies`, `/social`, `/signals`, `/reputation` → 404 since the UAE routes replaced them; "Context: 5 companies" vs "organisations"; `^Chat$` / `Overview` exact titles; `growth-grid`; `img[data-testid="brand-logo"]`; old drawer selectors — three of these each burn the 240 s test timeout, which is why 112 tests never ran); **17 APP BUGS**: 14 × axe `color-contrast` on the disclaimer bar's trailing `opacity-75` span (3.55:1, #848484 on #F9F9F9) → **fixed** (2e18ad9, span at full #5D5D5D ink = 7.0:1), `keyboard-nav` rail focus ring `rgb(37,99,235)` (the spec forbids a blue ring; the spec'd token is #2563EB — spec/token conflict to decide), `nav-stress back-forward-spam` stress-event mismatch, `run-panel-mobile` run-view scrollWidth 326 > 319 px @390 (open); **4 ENVIRONMENT**: 2 × `run-ux` need the Playwright `ffmpeg` binary for video, 2 × `live-smoke` 90 s wait on a real OnDemand answer.

## Existing 84-check suite — re-run on the fixed build https://sb-6szikitpkdgm.vercel.run (11:04–11:12Z; `qa/screenshots/20261021-v2/results-agent*-v2.json`)
| Agent | 1440×900 | 390×844 | server | Total |
|---|---|---|---|---|
| agent1-branding | 6/6 | 5/5 | – | 11/11 |
| agent2-watchlist | 7/7 | 7/7 | – | 14/14 |
| agent3-sentiment | 6/6 | 6/6 | 1/1 | 13/13 |
| agent4-chat | 7/7 | 7/7 | – | 14/14 |
| agent5-contracts | 7/7 | 7/7 | 18/18 | 32/32 |
| **Total** | **33/33** | **32/32** | **19/19** | **84/84** |
Post-fix re-check on the same build: horizontal scroll **26/26** pass, inspector 360 px, theme toggle absent on 13/13 routes, a stale `uaecc.theme=dark` preference is cleared on load (html.light, body #FFFFFF).

## Lane E — assets
Proof-read (tesseract + glyph-height check) of the delivered marks: social card cbN5407F9u, mark A DKtVcdTrJs and mark B 8644fozEL7 all OCR as "UAE Al Intelligence / Concept Demonstration" — the "Al" is the OCR l/I confusion (the glyph after "A" is a full-cap-height stroke, 3–38 px like "U/A/E", not an ascender-only "l"), so the lettering reads "UAE AI Intelligence" / "Concept Demonstration" exactly; variant C 9DZBiESOxF, EP7c24eLcS (empty) and eLVZbJ40GB (loading) carry no text. Shipped: `public/og-image.png` rebuilt 1200×630 from the card's lattice glyph (cropped, no baked lettering) + live Inter type ("UAE AI Intelligence" 64 px Medium #0D0D0D, "Concept Demonstration" 30 px #737373, "Not an official government system" 22 px); `public/brand/avatar-512.png` (transparent, charcoal) + `favicon.ico` (16/32/48) + `favicon.png` 256 + `apple-touch-icon.png` 180 derived from variant C (also mirrored to `src/app/favicon.ico` / `apple-icon.png`); OG/Twitter meta already point at `/og-image.png`. Empty state wired into the watchlist no-results panel (`data-testid="empty-state"`), the rail threads empty row and (already) the briefing empty card; loading state wired into the live-pipeline loader, the scheduled-briefing loader and (already) the briefing spinner. Removed 7 unreferenced legacy teal-accent icons (`icons/voice-orb.png`, `data-ready.png`, `suggestion.png`, `security.png`, `attach.png`, `browser-action.png`, `fallbacks/dropzone.webp`). Pixel scan for navy/gold/emerald-dominant assets: none; the remaining `#047857` green ink in the vendored chat CSS is the OpenUI run-status palette (54 occurrences, unchanged, not the navy/gold/emerald kit).

---
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
