# Cycle 6 — FULL Playwright run against the HTTPS sandbox

- **Target:** `https://sb-1p1cmfeo08vc.vercel.run` (sandbox serving **1c2953c**, real OnDemand key; Perplexity web-research plugin upstream out of credits → answers stream with a coverage notice).
- **Working tree at run time:** `7c860b7` = 1c2953c + one src-only commit (welcome-chip contrast `#737373→#5D5D5D`, "Portfolio Plugin" wording). `git diff 1c2953c..7c860b7 -- e2e playwright.config.ts` is **empty** → the specs executed are exactly the 1c2953c specs. The sandbox does **not** carry 7c860b7 (see the three /chat contrast failures).
- **Runner:** 1 CPU, `--workers=1 --timeout=150000`, Chromium `/usr/bin/chromium`, `timeout 1500`-class wall caps per shard (`run-all.sh`). No shard hit its cap. Run window 21:57:06 → 22:23:57 UTC (≈27 min incl. the single re-run pass).
- **`npx playwright test --list`:** **199 tests in 36 files** (needs `PROOF_DIR` set, otherwise `navigation-retry-proof.spec.ts` throws at import and the list is 0). Desktop 177 · mobile 6 · mobile-ux 2 · qa-final 2 · qa-final-mobile 2 · plus the payload spec re-executed once more at 390 (7 extra executions, not in the 199).

## Totals (first execution of each of the 199 listed tests)

| pass | fail | env-skip (spec `test.skip`) | not-run | Σ |
|---:|---:|---:|---:|---:|
| **157** | **17** | **25** | **0** | **199** |

After the single permitted re-run of 8 failures (4 passed again, 4 still fail): **161 pass-at-least-once / 13 hard fail / 25 env-skip**.
Hard-fail by class: upstream-perplexity 3 · stale-spec 3 · app-bug 3 (already fixed at 7c860b7, not deployed) · environment 4 (ffmpeg). Flaky-once (passed on re-run): 4 — of which run-panel-mobile is the still-open **app-bug** (intermittent).

## Per-shard table

| shard | project(s) | spec files | tests | pass | fail | skip | duration | UTC start → end | log / json |
|---|---|---|---:|---:|---:|---:|---|---|---|
| s1 | desktop | a11y, axe-sweep, routes-clean, live-smoke, navigation-e2e, qa-routes, copy-and-rail, keyboard-nav, context-sync, chat-error-retry, navigation-retry-proof, settings, release, title-ellipsis | 108 | 103 | 5 | 0 | 6m17s | 21:57:06 → 22:03:23 | `s1.log` / `s1.json` |
| s2 | desktop | chat, qa-chat-timing, run-panel-a11y, run-panel-acceptance, run-panel-visual, run-panel-working-header, thinking-json-filter, thinking-pinned-working-row, thread-reopen, session-continuity | 20 | 12 | 7 | 1 | 7m26s | 22:03:23 → 22:10:49 | `s2.log` / `s2.json` |
| s3 | desktop + mobile | nav-stress, run-panel-mobile (mobile), upload, upload-e2e, upload-journeys, upload-artifacts, pdf-inline-render, voice | 51 | 26 | 1 | 24 | 3m38s | 22:10:49 → 22:14:27 | `s3.log` / `s3.json` |
| s3p1440 | desktop | chat-intelligent-ui-payloads (PW_VIEWPORT=1440x900) | 7 | 7 | 0 | 0 | 1m13s | 22:14:27 → 22:15:40 | `s3p1440.log` / `.json`, `payload-1440/` |
| s3p390 | desktop | chat-intelligent-ui-payloads (PW_VIEWPORT=390x844) — second execution, not in the 199 | (7) | 7 | 0 | 0 | 1m14s | 22:15:40 → 22:16:54 | `s3p390.log` / `.json`, `payload-390/` |
| s4 | mobile + mobile-ux + desktop | mobile.spec (mobile ×5), run-ux.spec (desktop ×2, mobile-ux ×2) | 9 | 5 | 4 | 0 | 17s | 22:16:54 → 22:17:11 | `s4.log` / `s4.json` |
| s5 | qa-final + qa-final-mobile | qa-final.spec (QA_LABEL=c6full) | 4 | 4 | 0 | 0 | 3m54s | 22:17:11 → 22:21:05 | `s5.log` / `s5.json`, `qa-final/c6full/` (40 files) |
| rerun | desktop + mobile | single re-run of 6 failures | 6 | 2 | 4 | 0 | 1m11s | 22:22:20 → 22:23:31 | `rerun.log` / `rerun.json` |
| rerun2 | desktop | single re-run of 2 failures (grep collision fix) | 2 | 2 | 0 | 0 | 14s | 22:23:43 → 22:23:57 | `rerun2.log` / `rerun2.json` |

Σ listed tests executed = 108+20+51+7+9+4 = **199** ✔.

The 25 `env-skip`s are the spec's own `test.skip`: 24 in s3 (`/api/artifacts` → `backend:"not_provisioned"` for namespace `uae_cc_v1` on this sandbox → upload-journeys ×11, upload-artifacts ×6, upload-e2e ×2 (+2 "other viewport half"), pdf-inline-render ×3 "no PDF/office artifact in this backend") and 1 in s2 (run-panel-a11y "Working band … when present" — no band rendered).

## Failure table (17 first-run failures, each with exactly one class)

| # | spec › test (project) | first run | re-run | class | evidence |
|---|---|---|---|---|---|
| 1 | a11y.spec › chat: no serious/critical violations (desktop) | fail | not re-run (deterministic) | **app-bug — fixed at 7c860b7, sandbox still 1c2953c** | axe `color-contrast` serious on `span.oiu-welcome__chip-score` ("Company", "Research centre") — `#737373` on `#f7f8f9` = 4.46:1. HEAD 7c860b7 `shell.css:128` sets `#5D5D5D` (7.0:1); sandbox CSS still serves `#737373` (curl-verified). Will pass on redeploy. |
| 2 | axe-sweep.spec › /chat?skip=1 @1440x900 | fail | — | **app-bug — fixed at 7c860b7, not deployed** | same rule, `.oiu-welcome__chip:nth-child(1) > .oiu-welcome__chip-score`, 5 nodes |
| 3 | axe-sweep.spec › /chat?skip=1 @390x844 | fail | — | **app-bug — fixed at 7c860b7, not deployed** | same, 5 nodes |
| 4 | live-smoke.spec › live smoke 390x844 › chat actual request 200 + answer | fail | **pass** (rerun2, 1.7s) | environment (flake, passed on single re-run) | `pageerror: Minified React error #418` (hydration text mismatch) once; answer itself 200. ⚠ watch-item: same #418 also hit #5 in the same minute. |
| 5 | settings.spec › editing the user id persists to localStorage | fail | **pass** (rerun, 1.4s) | environment (flake, passed on single re-run) | same React #418 pageerror, assertion "no client-side page/console errors" |
| 6 | chat.spec › answer streams incrementally via SSE with plugin activity and sources | fail | fail (rerun) | **upstream-perplexity** | `first activity within 5 s` — 5688 ms, re-run 6780 ms. First plugin activity frame is gated on the Perplexity plugin, which currently errors out of credits before any activity. |
| 7 | qa-chat-timing.spec › @ desktop › two turns in one thread: timings, tool card, session reuse | fail | not re-run | **upstream-perplexity** | `turn1 tool-card transitions non-empty` expected >0, got 0 — no tool card without a working web-research plugin |
| 8 | qa-chat-timing.spec › @ mobile › same | fail | not re-run | **upstream-perplexity** | identical assertion, 0 transitions |
| 9 | run-panel-a11y.spec › every visible disclosure head is a focusable button/summary with a brand-green focus ring | fail | fail | **stale-spec** | annotation `0 visible of 1` — `HEAD_SEL` (`.oiu-think__head, .oiu-outputs__head, .oiu-srcs__head, .oiu-summary__head, .oiu-thinking__head, .oiu-payload__sum, details>summary`) only matched the hidden Threads `<summary>`. The error-context snapshot shows the live run DID render a focusable `button "Loading Thinking"` — the od-chat `StatusAccordion` (Tailwind classes) used by `OdStatusView`; legacy `ThinkingBlock` (`.oiu-think__head`) only mounts when `!odView` (saved turns). Selector list predates the od-view. |
| 10 | run-panel-a11y.spec › Tab order reaches the disclosure heads with the green ring | fail | fail | **stale-spec** | `no head reached by Tab` — same selector list |
| 11 | run-panel-a11y.spec › .oiu-think__head text contrast vs effective background ≥ 4.5:1 | fail | fail | **stale-spec** | `locator('.oiu-think__head').first()` not found in 30 s — element no longer rendered on live runs |
| 12 | thinking-pinned-working-row.spec › mobile 390×844 › Thinking pinned at top … | fail | **pass** (rerun2, 10.2s) | environment (flake, passed on single re-run) | `live run settled as done, not failed` — received `failed` (the live upstream turn errored once); desktop sibling passed first time |
| 13 | run-panel-mobile.spec › a11 run panel @ 390×844 › no horizontal overflow; working rows ≤ 72 px (mobile) | fail | **pass** (rerun, 14.3s) | **app-bug (open, now intermittent)** | `streaming: run-view scrollWidth` expected ≤ 319, received **332** — identical numbers to Lane C (`.oiu-cite__preview` tooltip, `position:absolute; width:max-content; max-width:260px`). `.oiu-cite__preview` CSS is unchanged in 1c2953c and 7c860b7; it reproduces whenever a citation chip renders during streaming, which with Perplexity out of credits is now hit-or-miss (1 of 2 runs). Still open. |
| 14 | run-ux.spec › upload: 3 images + PDF + DOCX … (desktop) | fail (182 ms) | not re-run | environment | `browserContext.newPage: Executable doesn't exist at …/ms-playwright/ffmpeg-1013/ffmpeg-linux` — spec forces `video: on`; no ffmpeg on this runner (`npx playwright install ffmpeg` needed) |
| 15 | run-ux.spec › report: Thinking top → Working … (desktop) | fail | — | environment | same ffmpeg |
| 16 | run-ux.spec › upload … (mobile-ux) | fail | — | environment | same ffmpeg |
| 17 | run-ux.spec › report … (mobile-ux) | fail | — | environment | same ffmpeg |

No test was re-run more than once. Traces/screenshots for every failure: `/tmp/pw-full-<shard>/` (error-context.md + trace.zip), not copied into the repo.

## The 18 cycle-4 failures — reclassification (cycle-4 class → cycle-6 result)

| # | spec › test | cycle-4 class | cycle-6 result | cycle-6 class |
|---|---|---|---|---|
| 1 | chat.spec › answer streams incrementally via SSE with plugin activity and sources | upstream-perplexity | fail ×2 (5.7 s / 6.8 s first activity) | upstream-perplexity (unchanged) |
| 2 | qa-chat-timing › two turns … @ desktop | upstream-perplexity | fail (0 tool-card transitions) | upstream-perplexity (unchanged) |
| 3 | qa-chat-timing › two turns … @ mobile | upstream-perplexity | fail | upstream-perplexity (unchanged) |
| 4 | run-panel-a11y › every visible disclosure head is a focusable button… | upstream-perplexity | fail ×2 | **→ stale-spec** (heads ARE rendered as od-chat accordion buttons; `HEAD_SEL` never matches them — not an upstream problem) |
| 5 | run-panel-a11y › Tab order reaches the disclosure heads | upstream-perplexity | fail ×2 | **→ stale-spec** |
| 6 | run-panel-a11y › .oiu-think__head text contrast ≥ 4.5:1 | upstream-perplexity | fail ×2 | **→ stale-spec** (`.oiu-think__head` not mounted on live od-view runs) |
| 7 | run-panel-acceptance › desktop 1440×900 | stale-spec | **pass** (14.5 s) | fixed-spec (rewritten to "anchored run-header, od-status, inspector drawer, coverage notice, no raw JSON") |
| 8 | run-panel-acceptance › mobile 390×844 | stale-spec | **pass** (24.2 s) | fixed-spec |
| 9 | run-panel-working-header › desktop | stale-spec | **pass** (11.4 s) | fixed-spec (no longer asserts ≥2 tool rows incl. Portfolio plugin) |
| 10 | run-panel-working-header › mobile | stale-spec | **pass** (13.1 s) | fixed-spec |
| 11 | thread-reopen › reload → recent thread listed → click → restored; ?thread deep link | stale-spec | **pass** (27.9 s) | fixed-spec (uses the rail thread list at 1440) |
| 12 | session-continuity › turn 2 appends below turn 1; turn 1 od-status pinned | live-od-view divergence | **pass** (20.6 s) | fixed-spec (asserts `od-status` instead of thinking-block) |
| 13 | thinking-json-filter › desktop | live-od-view divergence | **pass** (14.1 s) | fixed-spec |
| 14 | thinking-json-filter › mobile | live-od-view divergence | **pass** (11.7 s) | fixed-spec |
| 15 | thinking-pinned-working-row › desktop | live-od-view divergence | **pass** (11.1 s) | fixed-spec |
| 16 | thinking-pinned-working-row › mobile | live-od-view divergence | fail once (live run ended `failed`), **pass** on re-run | fixed-spec; the one miss = environment flake |
| 17 | run-panel-visual › desktop (ENOENT concurrent outputDir) | environment | **pass** (1.2 m) | fixed (separate `--output` dirs per shard) |
| 18 | run-panel-visual › mobile | environment | **pass** (1.2 m) | fixed |

One-liner: **12 of 18 now pass (10 fixed-spec + 2 environment fixed), 3 remain upstream-perplexity, 3 run-panel-a11y reclassified from upstream-perplexity → stale-spec.**

## Payload gate A–G on HTTPS (chat-intelligent-ui-payloads.spec, real backend for F/G)

| payload | 1440×900 | 390×844 |
|---|---|---|
| A — deliverables: artifact card + Outputs | ✓ 3.2 s | ✓ 3.0 s |
| B — pipeline & waiting: plan-stepper, live header + timer, working rows, step summary | ✓ 8.0 s | ✓ 9.9 s |
| C — citations: publisher chips, Sources list, safe anchors | ✓ 2.5 s | ✓ 2.4 s |
| D — root-first: run skeleton before first delta; no broken images; no overflow | ✓ 4.0 s | ✓ 3.9 s |
| E — between-step summaries keep thinking/working mounted; scroll anchoring | ✓ 17.1 s | ✓ 15.9 s |
| F — settings & plugin caps (REAL backend) | ✓ 14.1 s | ✓ 14.8 s |
| G — forced /api/chat 500 → discreet notice; Retry → 200 (REAL backend); cross-app sweep | ✓ 21.7 s | ✓ 22.0 s |
| **total** | **7/7** | **7/7** |

Evidence: `payload-1440/pass2-results.jsonl` + 7 PNGs, `payload-390/pass2-results.jsonl` + 7 PNGs (every row `"pass":true`, `"errors":[]`, http 200).

## Other evidence written
- `qa-final/c6full/` — 40 files copied from `proof/qa-final/c6full/` (qa-log.ndjson, console-errors.json, smoothness.json, state PNGs ×2 viewports); both qa-final projects 4/4 green.
- `proof-navret/` — navigation-retry-proof screenshots (PROOF_DIR).
- `timeline.txt` — UTC start/end + rc per shard; `run-all.sh` — the exact shard driver.

## Exact commands

```bash
cd oda-productivity-suite/app
export BASE_URL=https://sb-1p1cmfeo08vc.vercel.run PROOF_DIR=qa/2026-10-21-cycle6/playwright/proof-navret CHROME_PATH=/usr/bin/chromium
npx playwright test --list            # 199 tests in 36 files
D=qa/2026-10-21-cycle6/playwright; E=e2e
run() { name=$1 cap=$2; shift 2; PLAYWRIGHT_JSON_OUTPUT_NAME=$D/$name.json timeout $cap npx playwright test "$@" --workers=1 --timeout=150000 --reporter=list,json --output=/tmp/pw-full-$name > $D/$name.log 2>&1; }
run s1 1100 $E/a11y.spec.ts $E/axe-sweep.spec.ts $E/routes-clean.spec.ts $E/live-smoke.spec.ts $E/navigation-e2e.spec.ts $E/qa-routes.spec.ts $E/copy-and-rail.spec.ts $E/keyboard-nav.spec.ts $E/context-sync.spec.ts $E/chat-error-retry.spec.ts $E/navigation-retry-proof.spec.ts $E/settings.spec.ts $E/release.spec.ts $E/title-ellipsis.spec.ts --project=desktop
run s2 1100 $E/chat.spec.ts $E/qa-chat-timing.spec.ts $E/run-panel-a11y.spec.ts $E/run-panel-acceptance.spec.ts $E/run-panel-visual.spec.ts $E/run-panel-working-header.spec.ts $E/thinking-json-filter.spec.ts $E/thinking-pinned-working-row.spec.ts $E/thread-reopen.spec.ts $E/session-continuity.spec.ts --project=desktop
run s3 1100 $E/nav-stress.spec.ts $E/run-panel-mobile.spec.ts $E/upload.spec.ts $E/upload-e2e.spec.ts $E/upload-journeys.spec.ts $E/upload-artifacts.spec.ts $E/pdf-inline-render.spec.ts $E/voice.spec.ts --project=desktop --project=mobile
PW_VIEWPORT=1440x900 PAYLOAD_OUT=$D/payload-1440 run s3p1440 600 $E/chat-intelligent-ui-payloads.spec.ts --project=desktop
PW_VIEWPORT=390x844  PAYLOAD_OUT=$D/payload-390  run s3p390  600 $E/chat-intelligent-ui-payloads.spec.ts --project=desktop
run s4 700 $E/mobile.spec.ts $E/run-ux.spec.ts --project=mobile --project=mobile-ux --project=desktop
QA_LABEL=c6full run s5 700 $E/qa-final.spec.ts --project=qa-final --project=qa-final-mobile
# single re-run of failures (once each)
PLAYWRIGHT_JSON_OUTPUT_NAME=$D/rerun.json timeout 900 npx playwright test e2e/chat.spec.ts e2e/live-smoke.spec.ts e2e/settings.spec.ts e2e/thinking-pinned-working-row.spec.ts e2e/run-panel-a11y.spec.ts e2e/run-panel-mobile.spec.ts --project=desktop --project=mobile -g "answer streams|390x844 › chat actual request|editing the user id|mobile 390×844 › Thinking pinned|disclosure head|think__head|no horizontal overflow; working" --workers=1 --timeout=150000 --reporter=list,json --output=/tmp/pw-full-rerun > $D/rerun.log 2>&1
PLAYWRIGHT_JSON_OUTPUT_NAME=$D/rerun2.json timeout 600 npx playwright test e2e/live-smoke.spec.ts e2e/thinking-pinned-working-row.spec.ts --project=desktop -g "live smoke 390x844 chat actual request|mobile 390×844 Thinking pinned" --workers=1 --timeout=150000 --reporter=list,json --output=/tmp/pw-full-rerun2 > $D/rerun2.log 2>&1
cp -r proof/qa-final/c6full $D/qa-final/
```
(`qa-final-helpers.ts` ignores `PROOF_DIR`; it writes to `proof/qa-final/<QA_LABEL>/`, hence the final copy. The `-g` title regex in the first re-run did not match the two "›"-separated titles, so they were re-run once in `rerun2` — still one re-run each.)
