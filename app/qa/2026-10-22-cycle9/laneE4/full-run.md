# Cycle 9 — FULL Playwright run (local production build of b91d69c, `next start :5190`, real OnDemand key; Perplexity out of credits)

- Runner: `--workers=1 --timeout=150000`, system Chromium, shard caps per `run-all.sh`.
- Shards s1, s2, s3 run concurrently (04:41:06 → 04:51:04 UTC), followed by s4 (04:51:30 → 04:51:42 UTC), and s5 (04:52:26 → 04:55:43 UTC).
- Payload specs (`s3p1440` and `s3p390`, 7 tests) skipped in this lane as they are covered by Lane E2 on local+HTTPS.
- Total wall-clock time: **04:41:06 → 04:55:43 UTC** (≈14.6 min), well within the 45-minute budget.
- `--list` = **220 tests** (196 cycle-8 baseline - 7 skipped payload specs + 31 new navigation spec tests).

## Totals (first execution of each listed test)
| pass | fail | env-skip | not-run | Σ |
|---:|---:|---:|---:|---:|
| **179** | **12** | **29** | **0** | **220** |

## Per-Shard Summary
| Shard | Tests | Pass | Fail | Skip | Window (UTC) |
|---|---:|---:|---:|---:|---|
| **s1** (navigation.spec, a11y, axe-sweep, routes-clean, live-smoke, navigation-e2e, qa-routes, copy-and-rail, keyboard-nav, context-sync, chat-error-retry, navigation-retry-proof, settings, release, title-ellipsis) | 139 | 132 | 7 | 0 | 04:41:06 → 04:51:04 |
| **s2** (chat, qa-chat-timing, run-panel-acceptance, run-panel-visual, run-panel-working-header, thinking-*, thread-reopen, session-continuity) | 17 | 13 | 3 | 1 | 04:41:06 → 04:48:06 |
| **s3** (nav-stress, run-panel-mobile, upload*, pdf-inline-render, voice; desktop+mobile) | 51 | 25 | 2 | 24 | 04:41:06 → 04:46:34 |
| **s3p1440 + s3p390** (payload specs) | (14) | - | - | - | *SKIPPED (covered by Lane E2 on local+HTTPS)* |
| **s4** (mobile.spec, run-ux) | 9 | 5 | 0 | 4 | 04:51:30 → 04:51:42 |
| **s5** (qa-final ×2 projects, QA_LABEL=c9full) | 4 | 4 | 0 | 0 | 04:52:26 → 04:55:43 |

---

## New Spec: e2e/navigation.spec.ts
**Result: 31 / 31 passed (100%)**
- Desktop (1440x900) route direct loads (11 routes): overview, watchlist, sentiment, news, radar, graph, chat, briefing, artifacts, methodology, settings (all 11 passed).
- Mobile (390x844) route direct loads + drawer aria-current (11 routes): overview, watchlist, sentiment, news, radar, graph, chat, briefing, artifacts, methodology, settings (all 11 passed).
- Dossier `/watchlist/airev` breadcrumbs and crosslinks (passed).
- `/news?org=airev` filters only items with AIREV chip (passed).
- `/graph` shows top-connected list with >= 10 links (passed).
- `/chat-od` redirects to `/chat` (passed).
- `/plugins` returns 200 with >= 1 plugin row (passed).
- `/artifacts` loads with 0 console errors (passed).
- Mobile drawer focus trap and management (passed).
- `/chat` CLS <= 0.05 at 1440 (passed).
- Focus ring on rail link is `rgb(37, 99, 235)` immediately after focus (no transition) (passed).

---

## Unit Tests
| Command | Result | Notes / Details |
|---|---|---|
| `node --experimental-strip-types tests/unit/logo-sizes.test.ts` | **PASS** | 51 logo manifests verified, 38 vector + 13 raster originals >= 256 px, 512×512, 128×128, 64×64 variants verified. |
| `node --experimental-strip-types tests/unit/plugin-availability.test.ts` | **PASS** | All availability assertions passed. |
| `node --experimental-strip-types tests/unit/plugin-availability-recovery.test.ts` | **PASS** | All recovery & schedule assertions passed. |
| `npm run test:eventmap` | **FAIL** | Stale script in `package.json` referencing missing `../node_modules/tsx` and non-existent `tests/unit/eventmap.test.ts` (legacy pre-UAE project artifact). |
| `npm run test:context` | **FAIL** | Stale script in `package.json` referencing missing `../node_modules/tsx` and non-existent `tests/unit/context-payload.test.ts`. |
| `npm run test:naming` | **FAIL** | Stale script in `package.json` referencing missing `../node_modules/tsx` and non-existent `tests/unit/naming.test.ts`. |
| `npm run test:plugin-icons` | **FAIL** | Stale script in `package.json` referencing missing `../node_modules/tsx` and non-existent `tests/unit/plugin-icons.test.ts`. |
| `npm run test:plan` | **FAIL** | Stale script in `package.json` referencing missing `../node_modules/tsx` and non-existent `tests/unit/plan.test.ts`. |
| `npm run test:sse-replay` | **FAIL** | Stale script in `package.json` referencing missing `../node_modules/tsx` and non-existent `tests/unit/sse-replay.test.ts`. |
| `npm run test:sector-color` | **FAIL** | Stale script in `package.json` referencing missing `../node_modules/tsx` and non-existent `tests/unit/sector-color.test.ts`. |
| `npm run test:sparkline` | **FAIL** | Stale script in `package.json` referencing missing `../node_modules/tsx` and non-existent `tests/unit/sparkline.test.ts`. |
| `npm run test:brand-icons` | **FAIL** | Stale script in `package.json` referencing missing `../node_modules/tsx` and non-existent `tests/unit/brand-icons.test.ts`. |

---

## Failures (Named & Classified)

| # | Spec › Test (Project) | Class | Evidence & Details |
|---|---|---|---|
| 1 | `chat.spec.ts` › Analyst chat — streaming › answer streams incrementally via SSE with plugin activity and sources (desktop) | **upstream-Perplexity** | `expect(firstActivityAt!, "first activity within 5 s").toBeLessThanOrEqual(5000)`: Received `5226` ms. Perplexity plugin was skipped inside the backoff window / out of credits, delaying the first streamed activity chunk past 5 s. |
| 2 | `qa-chat-timing.spec.ts` › QA chat timing @ desktop › two turns in one thread: timings, tool card, session reuse (desktop) | **upstream-Perplexity** | `expect(t.cardTransitions.length, "desktop tool-card transitions non-empty").toBeGreaterThan(0)`: Received `0`. Perplexity research plugin skipped due to upstream credits/backoff. |
| 3 | `qa-chat-timing.spec.ts` › QA chat timing @ mobile › two turns in one thread: timings, tool card, session reuse (desktop) | **upstream-Perplexity** | `expect(t.cardTransitions.length, "mobile tool-card transitions non-empty").toBeGreaterThan(0)`: Received `0`. Same upstream Perplexity backoff. |
| 4 | `live-smoke.spec.ts` › live smoke 1440x900 › bad urls are 404 (desktop) | **app bug** | `helpers.ts:74`: `expect(errs, "no client-side page/console errors").toEqual([])`. Received `pageerror: Minified React error #418` (Hydration mismatch) on `/this-route-does-not-exist-smoke`. Caused by new client-side `<Breadcrumbs />` mounted in `PageFrame` (`src/components/shell/page-frame.tsx`) using `usePathname()`, which mismatches server 404 render. |
| 5 | `live-smoke.spec.ts` › live smoke 390x844 › route /graph (desktop) | **app bug** | `live-smoke.spec.ts:40`: `expect(await noHorizontalOverflow(page), "no horizontal overflow").toBe(true)`. Received `false` (`document.documentElement.scrollWidth` = 432 px vs `innerWidth` = 390 px). Caused by the new `<section data-testid="top-connected-list">` in `src/components/uae/eco-graph.tsx` (`grid sm:grid-cols-2` card container extending to right=431.78 px). |
| 6 | `live-smoke.spec.ts` › live smoke 390x844 › bad urls are 404 (desktop) | **app bug** | `helpers.ts:74`: `expect(errs, "no client-side page/console errors").toEqual([])`. Received `pageerror: Minified React error #418` on 404 routes. Same `<Breadcrumbs />` hydration mismatch in `PageFrame`. |
| 7 | `navigation-e2e.spec.ts` › navigation e2e › bad urls are real 404 (desktop) | **app bug** | `navigation-e2e.spec.ts:43`: `expect(errs.filter(e=>!/404/.test(e))).toEqual([])` and `helpers.ts:74`. Received `pageerror: Minified React error #418` on `/this-route-does-not-exist`. Same `<Breadcrumbs />` hydration mismatch in `PageFrame`. |
| 8 | `navigation-e2e.spec.ts` › mobile navigation › mobile routes + nav scroll + no overflow (desktop) | **app bug** | `navigation-e2e.spec.ts:125`: `expect(errs).toEqual([])` after visiting 404 route at 390 px. Received `pageerror: Minified React error #418`. Same `<Breadcrumbs />` hydration mismatch in `PageFrame`. |
| 9 | `qa-routes.spec.ts` › QA routes @ desktop 1440x900 › /watchlist/does-not-exist (desktop) | **app bug** | `qa-routes.spec.ts:119`: `expect(real, "0 console/page errors").toEqual([])`. Received `pageerror: Minified React error #418` on `/watchlist/does-not-exist`. Same `<Breadcrumbs />` hydration mismatch in `PageFrame`. |
| 10 | `qa-routes.spec.ts` › QA routes @ mobile 390x844 › /watchlist/does-not-exist (desktop) | **app bug** | `qa-routes.spec.ts:119`: `expect(real, "0 console/page errors").toEqual([])`. Received `pageerror: Minified React error #418` on `/watchlist/does-not-exist`. Same `<Breadcrumbs />` hydration mismatch in `PageFrame`. |
| 11 | `nav-stress.spec.ts` › bad-urls (desktop) @ 1440x900 | **app bug** | `nav-stress.spec.ts:61`: `expect(real, "stress events in bad-urls @1440x900").toEqual([])`. Received 47 events, all `pageerror: Minified React error #418` on 404 routes (`/no-such-page-xyz`, `/watchlist/nope/definitely-bad`, `/watchlist/does-not-exist-zz`). Same `<Breadcrumbs />` hydration mismatch in `PageFrame`. |
| 12 | `nav-stress.spec.ts` › bad-urls (desktop) @ 390x844 | **app bug** | `nav-stress.spec.ts:61`: `expect(real, "stress events in bad-urls @390x844").toEqual([])`. Received 47 events, all `pageerror: Minified React error #418` on 404 routes. Same `<Breadcrumbs />` hydration mismatch in `PageFrame`. |

---

## Environment Skips (29 total)
- **24 × `/api/artifacts` backend `not_provisioned` for namespace uae_cc_v1**:
  - `upload-journeys.spec.ts`: 11 tests
  - `upload-artifacts.spec.ts`: 6 tests
  - `upload-e2e.spec.ts`: 4 tests
  - `pdf-inline-render.spec.ts`: 3 tests
- **4 × ffmpeg binary not installed**:
  - `run-ux.spec.ts`: 4 tests (video recording required by run-ux)
- **1 × spec-declared skip**:
  - `run-panel-a11y.spec.ts`: 1 test (`no Working… band rendered (no live run)`)
