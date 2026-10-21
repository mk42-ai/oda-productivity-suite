# QA Cycle 6 — Lane C (TESTS) results

**Date:** 2026-10-21, runs 21:12–21:37 UTC · **Branch:** `uae-ai-command-centre` @ `3a07efb` (HEAD, no git writes by this lane)
**Target:** HTTPS sandbox preview `https://sb-1rpldsghtcd5.vercel.run` (OnDemand key present; Perplexity web-research plugin upstream OUT OF CREDITS → every live turn streams an answer + `coverage-notice`)
**Harness:** `npx playwright test … --project=<p> --workers=1 --timeout=150000 --reporter=list,json`, Chromium 155 `/usr/bin/chromium`, 1 CPU. Logs + JSON: `qa/2026-10-21-cycle6/laneC/*.log|*.json`.

## 1. Every test run this lane (chronological)

| Spec | Test title | Project / viewport | Result | Dur | UTC | Classification |
|---|---|---|---|---|---|---|
| run-panel-acceptance.spec.ts | run-panel acceptance — desktop 1440×900 › anchored run-header, od-status, inspector drawer, coverage notice, no raw JSON | desktop 1440 | pass | 25.0s | 21:13:08 | fixed-spec (cycle 5 rewrite verified: 0 Portfolio/plugin-1791713636 refs) |
| run-panel-acceptance.spec.ts | run-panel acceptance — mobile 390×844 › (same) | desktop 390 | pass | 14.2s | 21:13:33 | fixed-spec (was cycle-4 not-run) |
| run-panel-working-header.spec.ts | Working header invariant @ desktop › one source of truth for "Working…" | desktop 1440 | pass | 12.8s | 21:13:47 | fixed-spec (c6: last `thinking-block` fallback → `od-status`) |
| run-panel-working-header.spec.ts | Working header invariant @ mobile › (same) | desktop 390 | pass | 12.8s | 21:14:00 | fixed-spec |
| thread-reopen.spec.ts | reload → recent thread listed → click → messages restored; ?thread deep link | desktop 1440 | pass | 10.0s | 21:14:13 | fixed-spec (rail-chats-list/rail-chat-item at ≥1024; `threads-menu` only in the <1024 branch — correct, it still ships in chat-shell.tsx:1347 `lg:hidden`) |
| session-continuity.spec.ts | turn 2 appends below turn 1; turn 1 od-status pinned; one thread; no errors | desktop 1440 | pass | 19.8s | 21:14:50 | fixed-spec (verified od-status + rail-chats-list retarget) |
| thinking-json-filter.spec.ts | desktop 1440×900 › Thinking body has no planner JSON; planner-payload only in dev-disclosure | desktop 1440 | pass | 11.4s | 21:15:10 | fixed-spec (c6 added `run-logs-toggle` aria-expanded flip + `answer-markdown` no-raw-JSON) |
| thinking-json-filter.spec.ts | mobile 390×844 › (same) | desktop 390 | pass | 14.5s | 21:15:22 | fixed-spec |
| thinking-pinned-working-row.spec.ts | desktop 1440×900 › Thinking pinned at top, Working rows before the answer, … | desktop 1440 | fail → **pass** | 27.7s / 10.7s | 21:15:36 / 21:16:55 | fixed-spec (my first c6 draft asserted `run-status-label` *visible*; `.chat-shell .rsh` is an sr-only live region (shell.css:893) → assert attached + role=status + non-empty label + data-state=done) |
| thinking-pinned-working-row.spec.ts | mobile 390×844 › (same) | desktop 390 | fail → **pass** | 25.3s / 13.3s | 21:16:05 / 21:17:06 | fixed-spec (same) |
| chat-intelligent-ui-payloads.spec.ts | A–G (7 scenarios) | desktop 1440 | 7/7 pass | 1.2m | 21:19:56–21:21:10 | fixed-spec (protocol fix §2; first attempt A failed on Chromium Local-Network-Access CORS → added launch args) |
| chat-intelligent-ui-payloads.spec.ts | A–G (7 scenarios) | desktop 390 | 6/7 then F+G rerun **pass** | 52s + 37s | 21:21:17–21:23:08 | F@390 flaked once: `plugin-toggle` click did not flip `aria-checked` (17.0s, 21:21:51); identical rerun passed (16.8s) — classified **environment** (1-CPU timing on a radix switch), not app-bug; G was skipped by serial mode and passed on rerun |
| qa-final.spec.ts | qa-final [c6] › routes: console + page errors per route | qa-final 1440 | pass | 15.2s | 21:23:39 | was not-run-by-design (c4/c5 docs); runs fine with `QA_LABEL=c6` → `proof/qa-final/c6/` |
| qa-final.spec.ts | qa-final [c6] › chat: upload states, run states, sources, artifacts, lightbox, doc preview | qa-final 1440 | pass | 101.4s | 21:23:54 | (same) |
| qa-final.spec.ts | qa-final [c6] › routes … | qa-final-mobile 390 | pass | 16.1s | 21:25:36 | (same) |
| qa-final.spec.ts | qa-final [c6] › chat … | qa-final-mobile 390 | pass | 94.6s | 21:25:53 | (same) |
| keyboard-nav.spec.ts | watchlist cards keyboard-reachable w/ accent ring · nav rail Tab+arrows | desktop | 2/2 pass | 2.5s/2.2s | 21:29:33 | refreshed (optional) |
| run-panel-visual.spec.ts | desktop 1440×900 › captures run-view states + layout metrics | desktop | pass | 66.5s | 21:29:38 | was cycle-4 not-run; `VISUAL_LABEL=cycle6` → `proof/pass-3/visual/cycle6/` |
| run-panel-visual.spec.ts | mobile 390×844 (Pixel 7) › (same) | desktop | pass | 71.6s | 21:30:45 | (same) |
| nav-stress.spec.ts | 9 cases @1440 + 9 cases @390 (incl. drawer-open-nav @390) | desktop | 18/18 pass | 2.5m | 21:32:06–21:34:33 | refreshed (optional) |
| run-panel-mobile.spec.ts | a11 run panel @ 390×844 › no horizontal overflow; working rows ≤ 72 px; header/footer wrap | mobile | **fail** | 14.3s | 21:34:46 | **app-bug (UI, src/ owned by another lane)** — `run-view` scrollWidth 332 > clientWidth 318 at 390 px. Probe: the overflowing node is `.oiu-cite__preview` (hover tooltip of `citation-chip`, `position:absolute; width:max-content; max-width:260px`, opacity 0) extending to x=382 past the run-view right edge; the document itself does not overflow (docScroll 390 = inner). Fix hint for Lane A/B: clamp the preview (`max-width: min(260px, calc(100vw - 32px))` + `right:0` near edge) or `overflow-x: clip` on `.oiu-answer`. Not re-run (deterministic, same numbers streaming & settled). |

Totals this lane: **57 executions · 53 pass · 4 fail** (2 fail were my own draft assertion, fixed; 1 flake passed on rerun; 1 genuine app-bug run-panel-mobile). Upstream-Perplexity: **0 failures** — every live spec tolerates the `coverage-notice` ("unavailable") path and none required real web sources.

## 2. Payload gate matrix (HTTPS preview, paced stream over HTTPS) — `payload-https/pass2-results.jsonl` + 14 PNGs

| Scenario | 1440×900 | 390×844 |
|---|---|---|
| A deliverables (artifact card + Outputs) | pass 21:20:00Z | pass 21:21:21Z |
| B pipeline & waiting | pass 21:20:08Z | pass 21:21:29Z |
| C citations / Sources / safe anchors | pass 21:20:10Z | pass 21:21:31Z |
| D root-first paint, no broken img, no overflow | pass 21:20:15Z | pass 21:21:35Z |
| E between-step summaries, scroll anchoring | pass 21:20:31Z | pass 21:21:51Z |
| F settings & plugin caps (REAL backend) | pass 21:20:47Z | pass 21:22:48Z (rerun; first try 21:21:51Z flake) |
| G forced 500 → notice; Retry → 200 (REAL backend) | pass 21:21:10Z | pass 21:23:08Z |

**14/14**, all `http_status: 200`, zero failing rows. F/G hit the real backend and pass with the coverage notice (no web sources needed).

### Protocol fix — `e2e/chat-intelligent-ui-payloads.spec.ts`
- L2–5: `import https`, `os`, `execFileSync`.
- L94–120: `BASE_PROTO` resolved in `beforeAll` from `test.info().project.use.baseURL` (fallback `BASE_URL`); `selfSigned()` runs `openssl req -x509 -newkey rsa:2048 -nodes -days 2 -subj /CN=127.0.0.1 -addext subjectAltName=IP:127.0.0.1` into a `mkdtemp` dir; `server = BASE_PROTO === "https" ? https.createServer({key,cert}, handler) : http.createServer(handler)`; handler + pacing unchanged. `mockChat` continues to `` `${BASE_PROTO}://127.0.0.1:${port}/stream?s=${s}` `` (L120).
- L122–129: `test.use({ ignoreHTTPSErrors: true, launchOptions: … args + "--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults,PrivateNetworkAccessForNavigations" })`. Required because Chromium ≥130 blocks a public-https origin fetching `127.0.0.1` ("CORS policy: Permission was denied for this request to access the local network") even when the route is rewritten — without it scenario A still failed on HTTPS (first run 21:18Z). http baseURLs are unaffected.

## 3. Residue over tests (task 5)

| Check | Before | After |
|---|---|---|
| grep1 `b[ ._-]?capital\|\bbcap\b\|plugin-1791713636\|portfolio intelligence\|\bB Social\b` in e2e+tests (excl. portfolio-movers fixture bytes) | 1 (README.md:4 `"plugin-1791713636" (Portfolio Plugin)`) | **0 brand / 0 plugin-id** (README now reads `a former plugin id (retired)`; the same line still matches grep1 only because the Perplexity id `plugin-1722260873` is on it — no B Capital/Portfolio/1791713636 token remains; README lines 30–31 also reworded) |
| grep2 `portfolio` in e2e/**/*.ts + tests/**/*.ts | 6 files (qa-final, run-panel-a11y, navigation-retry-proof, chat-error-retry, live-smoke, run-ux) | **0 files** |
| residual-scan `code:e2e*` / `code:tests*` hits | 15 | 15 — all in binary/recorded fixtures only: `e2e/fixtures/ux/compendium.docx`, `tests/fixtures/upload/compendium.docx` (1AU/Iru/Nalu — it IS the old B Capital compendium DOCX used as a 15 MB upload fixture), `tests/fixtures/sse/portfolio-movers.{bridge.ndjson,upstream.sse}` (recorded SSE, bytes left untouched by instruction). No `.ts`/`.md` test file is hit. Scan total rose 36→52 only because it also walked my new `qa/…/residual-tests-before.json`. |

Rewordings: qa-final "short intelligence brief on Technology Innovation Institute…"; run-panel-a11y "Summarise public sentiment on UAE AI"; run-ux prompt+comment "intelligence brief"; chat-error-retry / navigation-retry-proof / live-smoke OK-delta "…is a UAE research institute on the watchlist." (assertions match on the unchanged prefix "Retry succeeded: Technology Innovation Institute"); live-smoke DEMO regex dropped the `PORTFOLIO COMPANY & SENTIMENT PROVENANCE` alternative. `scripts/uae/residual-scan.mjs` needed **no change** — it already walks e2e/ and tests/ (verified by the `code:e2e/…`/`code:tests/…` hits).
Recommendation (not done, binary fixture): replace both `compendium.docx` copies with a UAE-context DOCX of similar size in a future cycle.

## 4. Diff stat — `git -C .. diff --stat -- app/e2e app/tests app/scripts/uae/residual-scan.mjs`
```
 app/e2e/chat-error-retry.spec.ts             |  2 +-
 app/e2e/chat-intelligent-ui-payloads.spec.ts | 30 +++++++++++++++++++++++-----
 app/e2e/live-smoke.spec.ts                   |  4 ++--
 app/e2e/navigation-retry-proof.spec.ts       |  2 +-
 app/e2e/qa-final.spec.ts                     |  2 +-
 app/e2e/run-panel-a11y.spec.ts               |  2 +-
 app/e2e/run-panel-working-header.spec.ts     | 10 +++++-----
 app/e2e/run-ux.spec.ts                       |  4 ++--
 app/e2e/thinking-json-filter.spec.ts         | 18 +++++++++++++++++
 app/e2e/thinking-pinned-working-row.spec.ts  | 16 +++++++++++++++
 app/tests/fixtures/sse/README.md             |  6 +++---
 11 files changed, 75 insertions(+), 21 deletions(-)
```
Also produced (untracked, intended): `qa/2026-10-21-cycle6/laneC/` (logs, JSON reporters, payload-https/, grep*-{before,after}.txt, residual-tests{,-before}.json), `proof/qa-final/c6/`, `proof/pass-3/visual/cycle6/`, `proof/pass-3/run-panel-acceptance.ndjson` + `working-header-samples.ndjson` appends.
