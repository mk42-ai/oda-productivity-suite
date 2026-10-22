# Cycle 7 — FULL Playwright run (local production build of c20866c, `next start :5190`, real OnDemand key; Perplexity out of credits)

- Runner: 1 CPU, `--workers=1 --timeout=150000`, system Chromium, shard caps per `run-all.sh`; window **00:23:26 → 00:44:23 UTC** (≈21 min), no shard hit its cap.
- `--list` = **196 tests** (199 − 3 deleted run-panel-a11y tests). Executions = 203 (196 + the payload spec run a second time at 390 px, 7 extra).

## Totals (first execution of each listed test)
| pass | fail | env-skip | not-run | Σ |
|---:|---:|---:|---:|---:|
| **163** | **4** | **29** | **0** | **196** |

Re-run of the one non-upstream failure after a spec fix (a70078b, `--repeat-each=2` → 4/4) → **164 pass / 3 fail / 29 env-skip / 0 not-run**, and all 3 remaining failures are **upstream-perplexity**.

| shard | tests | pass | fail | skip | window |
|---|---:|---:|---:|---:|---|
| s1 (a11y, axe-sweep, routes-clean, live-smoke, navigation-e2e, qa-routes, copy-and-rail, keyboard-nav, context-sync, chat-error-retry, navigation-retry-proof, settings, release, title-ellipsis) | 108 | 107 | 1 | 0 | 00:23:26 → 00:29:07 |
| s2 (chat, qa-chat-timing, run-panel-a11y ×2, run-panel-acceptance, run-panel-visual, run-panel-working-header, thinking-*, thread-reopen, session-continuity) | 17 | 13 | 3 | 1 | 00:29:07 → 00:34:53 |
| s3 (nav-stress, run-panel-mobile, upload*, pdf-inline-render, voice; desktop+mobile) | 51 | 27 | 0 | 24 | 00:34:53 → 00:38:22 |
| s3p1440 payload A–G | 7 | 7 | 0 | 0 | 00:38:22 → 00:39:33 |
| s3p390 payload A–G (extra execution) | (7) | 7 | 0 | 0 | 00:39:33 → 00:40:43 |
| s4 (mobile.spec, run-ux) | 9 | 5 | 0 | 4 | 00:40:43 → 00:40:53 |
| s5 (qa-final ×2 projects, QA_LABEL=c7full) | 4 | 4 | 0 | 0 | 00:40:53 → 00:44:23 |

## Failures (named + classified)
| # | spec › test (project) | class | evidence |
|---|---|---|---|
| 1 | settings.spec › editing the user id persists to localStorage (desktop) | **flake → fixed (a70078b)** | received `"INV-777INV-001"`: fill raced hydration of the controlled input; spec now waits for `toHaveValue("INV-001")`; `--repeat-each=2` 4/4 (`settings-rerun.json`) |
| 2 | chat.spec › answer streams incrementally via SSE with plugin activity and sources (desktop) | **upstream-perplexity** | first run failed on a stale `"What did Fervo"` assertion (old tenant) → retired in cb8bfe9; re-run fails on `first activity within 5 s` = 8 502 ms (first activity frame gated on the Perplexity plugin, out of credits: direct probe 00:15:07Z) |
| 3 | qa-chat-timing.spec › @ desktop › two turns in one thread (desktop) | **upstream-perplexity** | `turn1 tool-card transitions non-empty` = 0 — no tool card while the web-research plugin is skipped/failing |
| 4 | qa-chat-timing.spec › @ mobile › two turns in one thread (desktop) | **upstream-perplexity** | identical assertion, 0 transitions |

## env-skip (29, all spec-declared `test.skip` with reason)
24 × `/api/artifacts` backend `not_provisioned` for namespace uae_cc_v1 (upload-journeys 11, upload-artifacts 5, upload-e2e 4, pdf-inline-render 3, mobile 1) · **4 × run-ux `environment: Playwright ffmpeg binary not installed` (new guard, c20866c — were 4 hard failures in cycles 3–6)** · 1 × run-panel-a11y "no Working… band rendered".

## Cycle-6 → cycle-7 reconciliation (17 → 3)
3 upstream-perplexity (unchanged) · 3 stale run-panel-a11y → **deleted** · 3 chip-score contrast → fixed at 7c860b7 (pass) · 4 ffmpeg → **env-skip** · 4 flaky-once → settings fixed (a70078b), live-smoke 390 / thinking-pinned mobile / run-panel-mobile all **passed first time**; run-panel-mobile additionally 2/2 with `--repeat-each=2` on the HTTPS sandbox (`run-panel-mobile-sandbox.json`, rvScroll 318 = 318 streaming and settled).

## HTTPS sandbox (https://sb-1gnt3nqtj561.vercel.run, 00:42–00:46Z)
Payload A–G 1440 **7/7**; 390 **6/7 + G re-run 1/1** (first G run tripped on one React #418 pageerror during the /graph sweep hop — the same one-off hydration event seen in cycle 6 #4/#5; not reproduced on re-run) → **14/14 HTTPS, 14/14 local**.
