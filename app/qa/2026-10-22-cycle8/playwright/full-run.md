# Cycle 8 — FULL Playwright run (local production build of bb15cd8/961d04c data, `next start :5190`, real OnDemand key; Perplexity out of credits)

- Runner: 1 CPU, `--workers=1 --timeout=150000`, system Chromium, shard caps per `run-all.sh`; window **01:39:20 → 02:01:57 UTC** (≈22.5 min), no shard hit its cap.
- `--list` = **196 tests** (unchanged from cycle 7). Executions = 203 (196 + the payload spec run a second time at 390 px, 7 extra).

## Totals (first execution of each listed test)
| pass | fail | env-skip | not-run | Σ |
|---:|---:|---:|---:|---:|
| **164** | **3** | **29** | **0** | **196** |

Identical to the cycle-7 close (164 / 3 / 29 / 0); the 3 failures are the same 3 **upstream-perplexity** tests.

| shard | tests | pass | fail | skip | window |
|---|---:|---:|---:|---:|---|
| s1 (a11y, axe-sweep, routes-clean, live-smoke, navigation-e2e, qa-routes, copy-and-rail, keyboard-nav, context-sync, chat-error-retry, navigation-retry-proof, settings, release, title-ellipsis) | 108 | 108 | 0 | 0 | 01:39:20 → 01:46:12 |
| s2 (chat, qa-chat-timing, run-panel-acceptance, run-panel-visual, run-panel-working-header, thinking-*, thread-reopen, session-continuity) | 17 | 13 | 3 | 1 | 01:46:12 → 01:52:22 |
| s3 (nav-stress, run-panel-mobile, upload*, pdf-inline-render, voice; desktop+mobile) | 51 | 27 | 0 | 24 | 01:52:22 → 01:55:57 |
| s3p1440 payload A–G | 7 | 7 | 0 | 0 | 01:55:57 → 01:57:1x |
| s3p390 payload A–G (extra execution) | (7) | 7 | 0 | 0 | → 01:58:3x |
| s4 (mobile.spec, run-ux) | 9 | 5 | 0 | 4 | 01:58:3x → 01:58:42 |
| s5 (qa-final ×2 projects, QA_LABEL=c8full) | 4 | 4 | 0 | 0 | 01:58:42 → 02:01:57 |

## Failures (named + classified)
| # | spec › test (project) | class | evidence |
|---|---|---|---|
| 1 | chat.spec › answer streams incrementally via SSE with plugin activity and sources (desktop) | **upstream-perplexity** | `[data-testid="plugin-activity"]` never attached (15 s) — the web-research plugin is skipped inside the backoff window, so no plugin-activity row renders |
| 2 | qa-chat-timing.spec › @ desktop › two turns in one thread (desktop) | **upstream-perplexity** | `turn1 tool-card transitions non-empty` = 0 |
| 3 | qa-chat-timing.spec › @ mobile › two turns in one thread (desktop) | **upstream-perplexity** | identical assertion, 0 transitions |

## env-skip (29, all spec-declared `test.skip` with reason)
24 × `/api/artifacts` backend `not_provisioned` for namespace uae_cc_v1 (upload-journeys 11, upload-artifacts 5, upload-e2e 4, pdf-inline-render 3, mobile 1) · 4 × run-ux `environment: Playwright ffmpeg binary not installed` · 1 × s2 spec-declared skip.

## HTTPS sandbox (https://sb-4pt9zz78srbe.vercel.run)
Payload A–G over HTTPS: see `payload-https-1440.json` / `payload-https-390.json` (`timeline-https.txt`).
