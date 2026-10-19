# Navigation E2E fix — 2026-10-15

Branch: `fix/navigation-crashes-20261014`
Checkpoint before changes: commit `ecf08e6`, tag `pre-navigation-fix-20261015`
Baseline preserved: reverted chat at `b33be278` (`1ed4247`) plus discreet-retry CSS fix.

## What was broken (verbatim findings)

1. `/signals` — no page route existed. Backend `GET /signals` (`src/app.ts:413`) and
   `getSignals()` in `web/src/lib/api.ts` existed and Overview/Chat consumed them, but
   navigating to `/signals` returned the real 404. Prior turns flagged this PENDING
   rather than faking it.
2. Company quick-preview `#news` anchor — `company-quick-view-drawer.tsx` linked to
   `/company/${slug}#news`, but the company page News card had no `id="news"`, so the
   hash anchored nowhere.
3. Quick-preview drawer focus — `CompanyQuickViewDrawer` handled Escape/backdrop/close
   correctly, but never moved focus into the dialog on open nor restored focus to the
   opener on close.
4. Nav active state — `nav.tsx` used `path.startsWith(match ?? href)`; `/overviewXYZ`
   would highlight Overview, and non-Companies items highlighted on prefix siblings.
5. Collapsed-rail accessibility — collapsed nav links relied on `title` only
   (`aria-label` missing).
6. `/social` prefetch — next.config/nav disabled prefetch for `/social` with a stale
   ERR_ABORTED rationale; removed so first click is not a cold server render.
7. Discreet retry DOM leak — the baseline CSS hid `.openui-agent-thread-error` and the
   notice's Details fold via `display:none`, but `chat-shell.tsx` still rendered the raw
   upstream message (`The answer could not be completed`) inside the hidden `<details>`,
   so it was present in `body.innerHTML`. User-visible text was clean; DOM was not.
8. Stale error-retry spec — `e2e/chat-error-retry.spec.ts` asserted the phrase
   "Something interrupted that answer."; the preserved baseline notice is
   `Response failed · Retry`. The spec, not the preserved UI, was wrong.
9. Missing navigation regression spec — no single Playwright spec covered every route,
   nav click-through, back/forward, deep links, refresh, mobile menu, 3 bad URLs,
   drawer close/return, scroll/active states, and chat/retry together.

## What was fixed

- `web/src/app/signals/page.tsx` (new): real `/signals` page rendering live backend
  `GET /signals` rows (company link → `/company/[slug]`, sector, score, percentile,
  label) with an honest offline empty state linking back to Overview. Nav item added
  (`nav-signals`, Activity icon) in `web/src/components/shell/nav.tsx`.
- `web/src/app/company/[slug]/page.tsx`: News card now `id="news"` + `scroll-mt-24`;
  `globals.css` adds `html { scroll-behavior: smooth; }` (auto under
  `prefers-reduced-motion`).
- `company-quick-view-drawer.tsx`: on open, captures `document.activeElement` and
  focuses the close button; on unmount/close, returns focus to the opener if still
  connected — same pattern already used by `SidePane`.
- `nav.tsx`: active state now `path === href || (match && (path === match ||
  path.startsWith(match + "/")))`; every link carries `aria-label={label}`;
  `/social` prefetch restored (only `/chat` stays `prefetch={false}` for bundle size).
- `chat-shell.tsx`: raw upstream error message is no longer rendered at all — the
  `oiu-error__details` fold and its message variable were removed. The notice is
  exactly `Response failed · Retry`; the CSS guard
  (`.chat-shell .openui-agent-thread-error { display: none !important; }`) is kept.
- Specs: fixed `chat-error-retry.spec.ts` expectation to the preserved
  `Response failed` copy; added `e2e/navigation-e2e.spec.ts` and
  `e2e/navigation-retry-proof.spec.ts` (forced-failure → discreet notice → Retry
  resubmits → recovered answer, with screenshots at 1440x900 and 390x844).

## Preserved verbatim (not touched)

- Reverted chat UI with NO Intelligent UI / deliverables shelf / run rail / settings
  drawer / IUI renderer added back. The directory name `open-intelligent-ui/` is the
  legacy baseline path from `b33be278`; no shelf/rail/drawer/renderer components were
  reintroduced.
- Virtualized thinking/activity, rAF-coalesced state, scroll anchoring, performance
  metrics in the chat shell; interactive GROWTH tile (`growth-values.tsx` via
  onboarding); ATB run, credits fixture (`/api/chat/creds` untouched); discreet
  `Response failed · Retry` notice hiding `.openui-agent-thread-error` raw text.
- `/` → `/overview` remains the `next.config.ts` 307 redirect plus the `page.tsx`
  fallback; `/health` remains the Next edge proxy to Hono `/health`.

## Non-disruptive logic

All fixes are additive or local: one new route file, one `id` attribute, one focus
effect mirroring the existing SidePane pattern, a stricter boolean in Nav, and the
removal of a hidden DOM node. No route, contract (`/api/chat`, `/api/chat/creds`),
reducer, SSE handling, or data fallback was changed. `listCompanies/getSignals`
snapshot fallbacks are reused as-is, so pages render honestly when the backend is down.

## Test matrix (Playwright / headless Chromium, local Next 5173 + Hono 4000)

| Suite | Viewport | Result |
|---|---|---|
| navigation-e2e: routes /, /overview, /companies, /social, /signals, /docs/interactive-ui | 1440x900 | PASS (6/6) |
| navigation-e2e: 3 bad URLs real 404 | 1440x900 | PASS |
| navigation-e2e: nav click-through, active states, back/forward, refresh | 1440x900 | PASS |
| navigation-e2e: company link, breadcrumb back, drawer close focus/scroll return, #news anchor | 1440x900 | PASS |
| navigation-e2e: GROWTH tile expand | 1440x900 | PASS |
| navigation-e2e: chat non-empty, POST /api/chat 200 | 1440x900 | PASS |
| navigation-e2e: mobile routes, nav scroll, no horizontal overflow, mobile 404 | 390x844 | PASS |
| chat-error-retry: forced failure discreet notice, Retry resubmits, recovered | 1440x900 | PASS |
| navigation-retry-proof: retry screenshots | 1440x900 + 390x844 | PASS (2/2) |
| `tsc --noEmit` / `next build` | — | PASS / PASS |
| `ONDEMAND_API_KEY` in `.next/static` | — | 0 hits |

Screenshot proof (`.ui-proof/`): `nav-root/overview/companies/social/signals/docs-interactive-ui-1440x900.png`,
`nav-*-390x844.png`, `nav-click-companies`, `nav-drawer-open/closed`,
`nav-company-detail`, `nav-company-news-anchor`, `nav-growth-open`,
`nav-notfound1-3-1440x900`, `nav-retry-error/recovered-{1440x900,390x844}`.

## Honest pending / notes

- Subagents: 5 delegates were dispatched but all returned turn-capped with no report;
  the audit was completed by the lead agent. No subagent findings are claimed.
- GitHub push: this environment had no `GITHUB_TOKEN`/SSH auth (`fatal: could not read
  Username for 'https://github.com'`); checkpoint commit/tag and fix commit are made
  locally and push must be retried where credentials exist. Not faked.
- `/chat-od`, `/compare`, `/news`, `/pitchbook`, `/artifacts`, `/settings`,
  `/onboarding` routes exist and build; the requested matrix above covers the routes
  named in the task plus their navigation paths.

## Live smoke re-verification — 2026-10-15 (deployed URL only)

Deployed URL: https://sb-5hfud9w5lt6s.vercel.run (sandbox `sbx_lIX5wQab0CjAkqNd6esCqKLlBaZ0`, Next 5173 + Hono 4000)
Spec: `web/e2e/live-smoke.spec.ts` (Playwright/Chromium, fresh browser per test, `primeSettings`)

First pass: 18/20 — the discreet-retry test failed the strict DOM check:
`DOM_PROBE {"htmlHasRaw":true,"lib":[{"display":"none","visible":false,"text":"Something went wrongThe answer could not be completed"}]}`.
The library's own hidden `.openui-agent-thread-error` node still carried the raw upstream
message in the DOM (invisible, `display:none`, but present in `innerHTML`).

Minimal fix (only file changed): `web/src/components/chat/open-intelligent-ui/chat-shell.tsx`
- Added `discreetErrorAdapter()` wrapping `agUIAdapter()`: `RUN_ERROR` events are re-emitted
  with `message: "Response failed"` (code preserved) so the raw message never reaches the
  thread store or DOM.
- `CE.error` and `teeStream` RUN_ERROR / fetch-failure paths now store the generic
  `"Response failed"` instead of the upstream message.
- No change to virtualized thinking/activity, rAF-coalesced state, scroll anchoring,
  performance metrics, GROWTH tile, `/docs/interactive-ui`, or the recorder.
Rebuilt (`tsc --noEmit` 0, `next build` 0), copied that one file into the running sandbox,
restarted Next, and re-ran the full live matrix.

Final result: **20/20 PASS** at both viewports. Post-fix probe:
`DOM_PROBE {"htmlHasRaw":false,"lib":[{"display":"none","visible":false,"text":"Something went wrongResponse failed"}]}`.

| Check | 1440x900 | 390x844 |
|---|---|---|
| `/` (307 → `/overview`, final 200) | PASS | PASS |
| `/overview` 200, no errors, no h-overflow | PASS | PASS |
| `/companies` 200, no errors, no h-overflow | PASS | PASS |
| `/social` 200, no errors, no h-overflow | PASS | PASS |
| `/docs/interactive-ui` 200 (Synergy matrix) | PASS | PASS |
| `/this-route-does-not-exist-smoke` → real 404 | PASS | PASS |
| Nav links + browser back/forward | PASS | PASS |
| Preserved surfaces: docs + interactive GROWTH tile | PASS | PASS |
| Chat: actual `POST /api/chat` 200 + non-empty answer | PASS | PASS |
| Discreet retry: forced failure, no raw in DOM, Retry recovers | PASS | PASS |

Screenshot proof (`.ui-proof/`, attached to the turn):
`live-root/overview/companies/social/docs-interactive-ui-{1440x900,390x844}.png`,
`live-notfound-{1440x900,390x844}.png`, `live-backforward-{1440x900,390x844}.png`,
`live-growth-{1440x900,390x844}.png`, `live-chat-{1440x900,390x844}.png`,
`live-retry-error-{1440x900,390x844}.png`, `live-retry-recovered-{1440x900,390x844}.png`.

## Nav polish + stress pass — 2026-10-16

Branch `fix/navigation-crashes-20261014`. Checkpoint `4a0d2a6` (tag `pre-nav-polish-20261016`, 2026-10-16T00:20:59Z) →
fix commit `804bacc` (2026-10-16T01:05:56Z) → this doc commit (tag `nav-polish-20261016`).
Live preview: https://sb-4rk0e0ct1kys.vercel.run (sandbox `sbx_29l7onQZG4ie8YGpNIh7GOnhEKq3`; Next `next start` on 0.0.0.0:5173,
Hono `node dist/server.js` on :4000 → `/health` 200 at https://sb-1doz5xxay59a.vercel.run/health). Old session sandbox
`sbx_lIX5wQab0CjAkqNd6esCqKLlBaZ0` (sb-5hfud9w5lt6s, already HTTP 410 / expired) stopped; no other sandbox touched.

Subagents: 5 delegates were dispatched (repro, fixes, snapshot removal, nav UX, regression). All 5 turn-capped without a
report or file changes; per the instruction, the lead agent completed each checklist itself. No subagent findings are claimed.

### Baseline (before changes, `next start` local build)
`tsc --noEmit` exit 0 · `next build` exit 0 (one pre-existing warning: optional `ai` peer of `@openuidev/react-headless`).
New harness `web/e2e/nav-stress.spec.ts`: **16/18** — the only failures were the `#news` anchor at both viewports.
Zero pageerror / console error / hydration warning / unhandled rejection / error-boundary paints / h-overflow in the other 16.

### Crashes / defects found → root cause → fix
| # | Found by | Symptom | Root cause | Fix |
|---|---|---|---|---|
| 1 | stress `news-anchor` (both vps) | `/company/fervo-energy#news` stayed at top (`#news` top=3606px desktop / 7436px mobile), same after the quick-view "news" link | the News card streams in behind `company/[slug]/loading.tsx`; the browser's native anchor jump fires before `#news` exists, App Router does not retry | `shell/route-effects.tsx`: rAF-polls (≤3 s, cancelled by wheel/touch/keys) for the hash target until layout is stable, then `scrollIntoView` — on first load, client nav and `hashchange` |
| 2 | code audit (stress `nav-while-streaming` scenario) | leaving `/chat` mid-answer kept the `/api/chat` SSE + tee reader alive and writing into the stream store after unmount | `fetchLLM` fetch only honoured the library Stop signal | `chat-shell.tsx`: unmount `AbortController` combined with the Stop signal (`AbortSignal.any`); abort on leave settles to idle without painting "Response failed" |
| 3 | audit | drawer / ⌘K palette could survive a client navigation and leave `body{overflow:hidden}` | no route-change close; lock released only by the component's own cleanup | `RouteEffects` broadcasts `bcap:route-change`; quick-view drawer + CommandK close on it; leftover scroll/pointer-events lock released when no modal is open |
| 4 | audit (crash class: `.map` on partial API data) | `/signals` did `sig.data.data` spread + `portfolio.mean`; `listCompanies`/`getNews` returned `r.data.data` unguarded — a `{}` 200 from a cold backend would throw | no shape normalisation of live bodies | `lib/api.ts` normalises `getSignals`/`listCompanies`/`getNews` (arrays always arrays, snapshot fallback); `/signals` guards score/mean with `Number.isFinite` |
| 5 | audit (hydration) | `NewsMiniFeed` used render-time `Date.now()`; `employees.toLocaleString()` locale-dependent | server/client clock + locale drift | clock moved to state + effect (refresh per minute); `toLocaleString("en-US")` |
| 6 | audit (rAF leak) | `companies-list` scroll-restore rAF not cancelled on unmount → stray `scrollTo` on the next page | missing cleanup | `cancelAnimationFrame` in the effect cleanup |
| 7 | audit (raw error text) | `global-error.tsx` rendered `error.message` + digest | — | discreet copy only; shared `components/ui/route-error.tsx` (no message/stack/digest) used by `app/error.tsx` and new `companies/`, `social/`, `signals/` `error.tsx` boundaries |

### Snapshot demos removed
The Lambda snapshot demo from the recording ("Analyze Lambda's latest funding, news citations", Lambda sentiment-provenance card,
Reddit/news/TikTok breakdown, top contributing citations) came from the Intelligent UI layer (`chat-company-provenance-deck.tsx`,
`lib/ondemand/chat-fixtures.ts` "Scenario 1 … (Lambda)", `?fixture=` param, `chat-intelligent-ui-payloads.spec.ts`) which stays removed
(reverted in `1ed4247`). Verified: no `lambda`/`fixture`/`provenance-deck`/`chat-fixtures` reference left in `web/src` (Lambda remains only as
a real portfolio company in `src/data/*.json`). Leftover demo artefacts deleted in `804bacc`:
- `web/ui-proof/payload-{A..G}-{1440x900,390x844}.png` (14 Intelligent-UI payload demo screenshots, incl. the Lambda one, G)
- `web/ui-proof/pass2-{1,2,3}.json`, `pass2-results.jsonl`, `pass2-ttft-fixtures.json`, `playwright-results-{1,2,3}-{1440x900,390x844}.json` (payload-harness ledgers)
- `web/tests/payloads.config.ts`: dead `chat-intelligent-ui-payloads.spec.ts` / `metrics.spec.ts` matchers removed (regression-sweep kept)
Kept on purpose: the 4 generic chat quick prompts (Fervo news / Biggest movers / Compare two / LP update draft — no snapshot, no Lambda),
`/docs/interactive-ui` (Synergy matrix + Performance budget), "PitchBook snapshot" data-provenance labels.

### Navigation UX polish
`/` marks Overview active, `/social/people/*` marks B Social, `/company/*` marks Companies (`aria-current="page"`, `isActive()` in nav.tsx);
visible focus ring on nav links; default prefetch on every nav link and the brand link (the `/chat` / brand `prefetch={false}` removed);
mobile nav row scrolls the active item into view (container scroll only); focus moves to `<main id="main">` after client navigation
(preventScroll); App Router keeps scroll-to-top / back-forward restoration; new `signals/loading.tsx` + `docs/interactive-ui/loading.tsx` skeletons.

### Results
| Suite | Local `next start` | Live sandbox |
|---|---|---|
| `nav-stress.spec.ts` (9 scenarios × 2 viewports) | 16/18 before → **18/18** after | **18/18**, 0 events |
| `navigation-e2e.spec.ts` | 12/12 | **12/12** |
| `chat-error-retry.spec.ts` | 1/1 | **1/1** |
| `navigation-retry-proof.spec.ts` (1440x900 + 390x844) | 2/2 | **2/2** |
| `live-smoke.spec.ts` (13 checks × 2 viewports: 6 routes, 3 bad URLs 404, nav + back/forward + aria-current, GROWTH, no-snapshot playground + chat, #news, real chat, forced-failure retry) | — | **26/26** |
| ui-validator (headless Chromium): playground no-snapshots, /signals active nav, both viewports | — | **2/2** |
| `tsc --noEmit` | exit 0 | exit 0 |
| `next build` | exit 0 | exit 0 (sandbox) |
| ONDEMAND_API_KEY value under `.next/static` (`scripts/check-key-leak.mjs`) | 0 / 1751 files | 0 / 1751 files |

Real chat: `POST /api/chat` → 200 with a 641-char Fervo Energy answer (curl) and 200 + answer in the browser at both viewports.
Discreet retry: `DOM_PROBE {"htmlHasRaw":false}` at both viewports; Retry resubmits and recovers.
Repro command: `BASE_URL=<url> web/scripts/run-nav-regression.sh` (never runs `next build`, never prints secrets).

Screenshot proof (`.ui-proof/`): `stress-<scenario>-{1440x900,390x844}.png` (18), `live-*-{1440x900,390x844}.png` incl.
`live-playground-no-snapshots-*`, `live-chat-no-snapshots-*`, `live-news-anchor-*`, `live-signals-*`, `live-chat-*`, `live-retry-error/recovered-*`,
`nav-*` (navigation-e2e/retry-proof), `after-playground-no-snapshots-*`, `after-signals-*` (ui-validator).

---

## Reputation & Prestige + Cleanup 2026-10-17

Checkpoint tag `pre-reputation-cleanup-20261017` = `b9dc032e9470290695353baec465ed344643d948` (pushed 2026-10-17T09:45:04Z; `tsc --noEmit` 0, `next build` 0 before any change).

### Where the "Rillion" correlation engine actually lives
`mk42-ai/rilian-airev-ondemand-deck` (main @ `049cd227`, 2 commits, Vite + Three.js deck) contains **no** correlation / scoring engine — 0 hits for
`correlation`, `correlate`, `reputation`, `prestige`, `score`, `quickChat` on every branch and commit; it only has a sync OnDemand "Ask about the
partnership" drawer. The engine is the **Correlation Engine of `mk42-ai/gulf-io-light-workbench`** (the Rilian Gulf-IO Workbench, master @
`38effe89c7af7e48a3e4dc6ad825fe3f4e2f1932`, v5.1.0 — present on all 9 branches): `src/engine/coordination/*` + `src/views/correlation/*` +
the "ASK · OnDemand" quick-query dock (`src/views/chat/OndemandAskPanel.tsx`, `src/lib/ondemand/*`, proxy `server/ondemand.ts`).

### Ported files → Rilian origin (verbatim unless noted)
| Ported file (this repo, `web/…`) | Rilian origin (`gulf-io-light-workbench/…`) | Change |
|---|---|---|
| `src/lib/reputation/engine/engine.ts` | `src/engine/coordination/engine.ts` | import path only (`../../types` → `./rilian-types`) |
| `src/lib/reputation/engine/objects.ts` | `src/engine/coordination/objects.ts` | none |
| `src/lib/reputation/engine/temporal.ts` | `src/engine/coordination/temporal.ts` | none |
| `src/lib/reputation/engine/types.ts` | `src/engine/coordination/types.ts` | import path only |
| `src/lib/reputation/engine/rilian-types.ts` | `src/types.ts` (Platform, PLATFORMS, BadgePattern, Post) | extracted declarations, verbatim |
| `src/lib/reputation/ondemand/sse.ts` | `src/lib/ondemand/sse.ts` | none |
| `src/lib/reputation/ondemand/prompts.ts` | `src/lib/ondemand/prompts.ts` | none |
| `src/lib/reputation/ondemand/context.ts` | `src/lib/ondemand/context.ts` | DEF-027 whole-dataset section (BM25 retrieval over the Rilian corpus) not ported; subject builders verbatim |
| `src/lib/reputation/ondemand/chatModels.ts` | `src/lib/ondemand/chatModels.ts` | snapshot import path only |
| `src/lib/reputation/data/endpoints.snapshot.json` | `src/data/ondemand/endpoints.snapshot.json` | none |
| `src/lib/reputation/ondemand/analystPlugins.ts` | `src/lib/ondemand/analystPlugins.ts` | `WITHHELD_PLUGIN_IDS` = X `plugin-1785777296` (HTTP 400 "agents are inactive" on this account, verified live) |
| `src/lib/reputation/ondemand/askDock.ts` | `src/lib/ondemand/askDock.ts` | dataset-scope helper stubbed (no retrieval corpus); subject path verbatim |
| `src/lib/reputation/ondemand/client.ts` | `src/lib/ondemand/client.ts` | `PROXY_URL` → `/api/reputation/ondemand`; Settings-drawer browser-key opt-in not ported |
| `src/lib/reputation/ondemand/proxy-core.ts` | `server/ondemand.ts` (lines 34–333: denylist, validateBody, sanitisers, upstream bodies, createSession, noKeyBody, healthBody) | Node `req/res` transport removed |
| `src/app/api/reputation/ondemand/route.ts` | `server/ondemand.ts` `handleOndemand` (query + SSE passthrough) | re-expressed as a Next.js Route Handler (`runtime nodejs`, `maxDuration 300`); same frames, same audit line, key server-side only |
| `src/components/reputation/MatrixHeatmap.tsx` | `src/views/correlation/MatrixHeatmap.tsx` | import paths only |
| `src/components/reputation/Communities.tsx` | `src/views/correlation/Communities.tsx` | import paths only |
| `src/components/reputation/Centrality.tsx` | `src/views/correlation/Centrality.tsx` | import paths only |
| `src/components/reputation/model.ts` | `src/views/correlation/model.ts` (edgeLookup, shortText, fmtDelta, UNPROVEN_BANNER, nodeLabel, MODE_PATTERN) | extracted, verbatim |
| `src/components/reputation/rilian-ui.tsx` | `src/ui/index.tsx` (cx, Badge, Bar, EmptyState, IdChip) + `src/ui/BrandIcon.tsx` (`web` branch) | IdChip click → host callback instead of the workbench inspector |
| `src/components/reputation/reputation.css` | `src/styles/tokens.css` (`.badge*`, `.chip`, `.card`, `.table-th/td`, `.bar-*`, tokens) | scoped under `.reputation-engine`; indigo accent → B Capital green |
| `src/components/reputation/ReputationAskPanel.tsx` | `src/views/chat/OndemandAskPanel.tsx` | re-mounted for the four subjects (same ask() path, presets, prompt preview, transcript meta, verbatim HTTP error body) |
| `src/components/reputation/ReputationView.tsx` | `src/views/correlation/index.tsx` + `WhyConnected.tsx` + `Inspector.tsx` (subject publishing) | host view over the ported panels; entity cards new |
| `src/lib/reputation/adapter.ts`, `data/types.ts`, `data/entities.ts`, `assets.ts` | — | NEW: factor → Post mapping (sharedObject→co-share, sourceUrl→co-link, tags→co-hashtag, relatedEntity→co-reply, text→co-text), 4 entities / 59 sourced factors |
| `src/app/reputation/{page,loading,error}.tsx`, `[entity]/{page,not-found}.tsx`, `src/middleware.ts` (matcher) | — | NEW route `/reputation` ("Reputation & Prestige", nav item), real HTTP 404 for unknown ids |

Scoring math unchanged: `edgeWeight = min(1, log2(1+pairs)/log2(9) × clamp(mean idf / idfMax, 0.5, 1) × precision ÷ (1 + syndicationShare))`,
IDF generic cut-off 0.2, precision factors 1/0.8/0.4/0.1 (same-day cap 0.1), Louvain + Brandes betweenness. Run `REP-001`: 59 posts, 4 nodes,
6 edges (every pair), weights 0.047–0.055, 12–15 evidence refs per edge.

### Entities, photos, prompts
| Entity | Photo file | Source URL (HTTP 200, 1080×1350 JPEG, downscaled 400×500, never altered) |
|---|---|---|
| B Capital | `public/assets/reputation/b-capital-logo.png` | `web/public/brand/b-capital-mark.png` (repo brand mark); OnDemand logo copied from `web/public/plugins/ondemand.svg` |
| Eduardo Saverin | `public/assets/reputation/eduardo-saverin.jpg` | https://b.capital/wp-content/uploads/team_member/eduardo_saverin.jpg |
| Raj Ganguly | `public/assets/reputation/raj-ganguly.jpg` | https://b.capital/wp-content/uploads/team_member/raj_ganguly.jpg |
| Karan Mohla | `public/assets/reputation/karan-mohla.jpg` | https://b.capital/wp-content/uploads/team_member/karan_mohla.jpg |
Ambient accents (green-on-white, no text, 12 % opacity) `ambient-{hero,firm-network,leader-backdrop,matrix-texture}.jpg` — sources in
`public/assets/reputation/SOURCES.json`. Factor counts: B Capital 21 · Saverin 14 · Ganguly 13 · Mohla 11 (3 × "Forbes Midas List — not verified").
Starter prompts per card route through `POST /api/reputation/ondemand` (DeepSeek V4.1 default, one Fable 5.1 fallback, 45 s per attempt, pluginIds
Perplexity / Deep Translation / File Retrieval / OnDemand Agent).

### Removal manifest (zero references verified by `grep -rn` over `web/src`, `web/e2e`, `web/tests`, `web/scripts`, `next.config.ts`, `package.json`)
| Path | Action | Reason / evidence |
|---|---|---|
| `web/src/components/chat/countdown.tsx` | deleted | `Countdown` imported nowhere (0 refs) |
| `web/src/components/company/pitchbook-view.tsx` | deleted | `PitchbookView` imported nowhere (0 refs) |
| `web/src/components/charts/gauge.tsx` | deleted | `charts/gauge` imported nowhere (0 refs; the lucide `Gauge` icon is unrelated) |
| `web/public/fallbacks/{orb-idle,orb-active,ledger-empty}.webp` | deleted | 0 refs (`img-proxy.ts` only uses news-tile / logo-tile; dropzone kept) |
| `web/public/icons/glyph-qa.json` | deleted | QA output of `scripts/icon-qa.py`, not read at runtime |
| `web/.env.test.example` | deleted | stale env example (referenced only in a 2026-10-11 reconciliation note) |
| `web/ui-proof/*` (22 files) | deleted | committed QA by-products (pass2 json/jsonl/png); specs write to `PROOF_DIR`, never read these |
| `web/package.json` `@radix-ui/react-dialog` | removed | depcheck: unused (0 imports); lockfile updated |
| `web/package.json` `test:e2e:live` | fixed | pinned a dead sandbox URL; now uses `BASE_URL` |
| `web/src/components/reputation/components.ts` | not kept | ported then dropped (connected-components summary not rendered here) |
| `web/public/assets/bundle/` (22 MB), `assets/misc/` (8.6 MB), six glyph PNGs (3.6 MB), `assets/artifacts-ui/{artifact-document,artifact-image,artifact-video,upload-attach,upload-failed-retry}*` (2.5 MB), `assets/manifest.json` | **archived** → `archive/web-public-assets/` | 0 runtime refs; PNG masters / renders kept out of the served bundle (`archive/README.md`). No `web/public/assets/film` existed on this branch. |
Kept (verified still referenced): `@tailwindcss/postcss` + `tailwindcss` (postcss.config.mjs), `src/types/css.d.ts` (TS2882 guard), all Intelligent-UI chat shell files (the chat UI), credits fixture, `/docs/interactive-ui`, Playwright perf recorder.
`web/public`: 93 MB → 44 MB. Lambda-snapshot / Intelligent-UI payload demo markers: 0 in `src` (only the negative assertions in `live-smoke.spec.ts`).

### Fixes found by the suites
- `browser-chat.ts`: the CORS pre-probe now checks OnDemand's documented origin allow-list first — on `*.vercel.run` / `127.0.0.1` the OPTIONS
  preflight could only fail and Chromium logged it as a console error (failed `navigation-e2e › chat non-empty 200` and 4 `nav-stress` scenarios);
  behaviour unchanged (those origins already fell back to `POST /api/chat`).
- Mobile `/reputation`: Centrality table scrolls inside its card (`min-w-0` + `overflow-x-auto`), chips wrap — scrollWidth 430 → ≤ 391 px.

### Results (2026-10-17)
| Suite | Local `next start` (localhost:5173) | Live sandbox `https://sb-1hzinfehg7fe.vercel.run` |
|---|---|---|
| `reputation-e2e.spec.ts` (NEW: 4 cards + real photos naturalWidth>0, 59 factor rows / ≥50 source links, matrix + centrality + communities + WHY CONNECTED, real quick-chat POST → 200 + non-empty answer, real 404) × 2 viewports | **6/6** | **6/6** |
| `navigation-e2e.spec.ts` | 11/12 → 12/12 after the CORS-probe fix | **12/12** |
| `chat-error-retry.spec.ts` | 1/1 | **1/1** |
| `navigation-retry-proof.spec.ts` (1440x900 + 390x844) | 2/2 | **2/2** |
| `live-smoke.spec.ts` (14 checks × 2 viewports, `/reputation` added) | — | **28/28** |
| `nav-stress.spec.ts` | 17/18 | 16/18 → 17/18 / 18/18 on re-run: `back-forward-spam` is **flaky** (React #418 on `/news` during 10× back/forward spam on the live proxy; pre-existing `revalidate=120` page, not touched this pass — see open items) |
| `tsc --noEmit` | exit 0 | exit 0 (sandbox) |
| `next build` | exit 0 | exit 0 (sandbox, `.next/BUILD_ID` present) |
| `ONDEMAND_API_KEY` value under `.next/static` (`scripts/check-key-leak.mjs`) | 0 / 1759 files | 0 / 1759 files |
| ui-validator (headless Chromium): `/reputation` 4 photos loaded, matrix canvas, ask panel, nav `aria-current`, no h-overflow; quick-chat subject loaded after card click — 1440x900 + 390x844 | — | **2/2 runs pass** |

Quick-chat live proof: `POST /api/reputation/ondemand` (`responseMode: stream`) → HTTP 200 `text/event-stream`, 23–89 `fulfillment` frames,
answers 80–310 chars, audit lines `[ondemand-audit] {… "status":200 … "apikey":"<masked>"}`.

Open item: `nav-stress › back-forward-spam` reproduces React #418 on `/news` only under 10× history spam against the live sandbox (1 of 3 runs clean);
`/news` content was not changed in this pass.

Screenshots (`.ui-proof/`): `reputation-page-{1440x900,390x844}.png`, `reputation-card-{b-capital,eduardo-saverin,raj-ganguly,karan-mohla}-{1440x900,390x844}.png`,
`reputation-quickchat-{1440x900,390x844}.png` (Playwright, live), `after-reputation-*`, `after-reputation-quickchat-*` (ui-validator, live), `live-reputation-*` (live-smoke).

## Reputation port re-target + verification — 2026-10-18

Target repo: `mk42-ai/oda-productivity-suite`, app root `bcapital-portfolio-intelligence/` (B Capital Portfolio Intelligence — `web/package.json`
name `bcap-portfolio-intelligence-web`), branch `fix/navigation-crashes-20261014`. Safety tag `pre-bcap-reputation-20261018` → `8021f223`
(pushed 2026-10-18T02:09:35Z). The source workbench `mk42-ai/gulf-io-light-workbench @ 38effe89` was only read (clean working tree, nothing
pushed or deployed from it). Note: `mk42-ai/bcapital-portfolio-intelligence` exists but has no `fix/navigation-crashes-20261014` branch and does not
contain `8021f223`; the branch and commit live in `oda-productivity-suite`, so all work and the push are there.

Changes on top of 8021f223:
- Four uploaded plates self-hosted in `web/public/reputation/` and mapped: hero (Fkray2Nt1A, content on the left half, white scrim),
  firm card backdrop (3Ha2Gnbdlt, B Capital logo on a white pill), leadership backdrop (kmAXRIzvSH, headshot drawn inside the plate's
  empty ring — centre measured at 31.2% / 45.2%, r 15.4% of width), matrix panel texture (gNQTYRN0OI under an 80% white veil).
- Headshots re-downloaded from b.capital into `web/public/reputation/people/`; unused `public/assets/reputation/*` (ambient-*, old copies) removed.
- 59 factors kept; refreshed with the 2026-10-18 sourced facts (Ascent III $500M hard cap + $254M Ascent II, $12B+ AUM, Caproasia $307M/$9B,
  Forbes/Business Standard Opportunities II $750M vs $415M, Bloomberg $2.1B / $360M / $500M talks, b.capital/about leadership + BCG, 130 founders).
- Personalised copy rewritten per entity; workbench framing strings removed from UI and prompts (no "UNPROVEN"/OSINT/"recycled footage").
- Clicking a card's plate loads that entity as the quick-chat subject; ONDEMAND_API_KEY stays server-only (`/api/reputation/ondemand`).
- /news React #418 root cause: `getAllNews()` sorted by date-only `published_at` with ties left in fetch-completion order of 16 concurrent
  workers, so each ISR generation emitted a different item order and a cached document could hydrate against a newer RSC payload. Ties are now
  broken by company slug + id (deterministic). /overview "N min ago" moved to a client clock (second #418 source). #news deep-link scroll
  re-applies for 4 s after landing if hydration resets scroll (live: 1 in 3 cold loads).
- Middleware: `/reputation/*.{jpg,png,…}` passes through as static assets (was rewritten to 404).

Live preview https://sb-4ynhlojce4bm.vercel.run (sandbox `sbx_5jhw8BHaK239aHxTSej6ui83lggX`, Vercel project `prj_iZcctLWyRrr0jXMfAAQYMLHm06jF`;
Hono `node dist/server.js` :4000 → /health 200, Next `next start` 0.0.0.0:5173), built from `bcapital-portfolio-intelligence/web`.

| Suite | Local `next start` | Live |
|---|---|---|
| reputation-e2e | 8/8 | 8/8 |
| navigation-e2e | 12/12 | 12/12 |
| nav-stress | 18/18 | 18/18 (0 events) |
| chat-error-retry | 1/1 | 1/1 |
| navigation-retry-proof | 2/2 | 2/2 |
| live-smoke | — | 28/28 |
| ui-validator (home, /signals, /reputation, card→subject; 1440x900 + 390x844) | — | 4/4 |
| tsc --noEmit / next build | 0 / 0 | 0 / 0 |
| ONDEMAND_API_KEY in .next/static | 0 / 1759 files | 0 / 1759 files |

Quick-chat proxy (live): `createSession` 200, `query` 200 in 7.9 s with a 206-char answer.

## Polish run 1 — 2026-10-18 (cleanup + green brightening + finishing packages)

Safety tag `pre-polish-run1-20261018` → `6a654e1`. Scope kept small (run 1 of 2).

Removal manifest (knip/depcheck output re-verified by grep; nothing from chat, quick-chat proxy, /reputation, scoring, Dream Labs, GROWTH, /docs/interactive-ui or the recorder touched):
| Item | Kind | Why |
|---|---|---|
| `src/components/companies/companies-list.tsx`, `company-card.tsx`, `company-card.css`, `toolbar.css` | dead components + CSS | superseded by `companies-gallery.tsx`; zero importers |
| `src/lib/url-state.ts` + `tests/unit/url-state.test.ts` + `test:url-state` script | dead util + its test | only importer was companies-list.tsx |
| `src/lib/icons.ts` | dead registry | zero importers |
| `public/icons/glyphs/*.svg` (10), `public/icons/glyphs-src/*.png` (10), `public/icons/icon-manifest.json` | stale assets | referenced only by icons.ts / icon-qa.py |
| `scripts/icon-qa.py` | stale QA script | QA'd the deleted glyph sources |
| `DAILY_REFRESH_WORKFLOW_ID` in `web/.env.example` | env key | read nowhere |
depcheck: no unused runtime deps (`tailwindcss`/`@tailwindcss/postcss` are CSS-only false positives). `console.log` in non-chat src: 0.

Tokens: `--brand-green` #0AC985, `--brand-green-ink` #067a52 (AA), `--brand-green-soft`/`-line`, spacing/type/radius/elevation scale and a sentiment colour scale in `styles/tokens.css`, exposed through `@theme` (`bg-brand`, `text-brand-ink`, `rounded-token-md`, …).

Brightening: company-card metrics panel (LAST ROUND / TOTAL RAISED / PITCHBOOK / SENTIMENT) on a light green tint with green labels; overview hero + stat tiles get a 3 px #0AC985 top line, green numbers, real-data green sparklines (portfolio mean per scoring run, news per day) and softened dividers; sentiment values coloured by score (`lib/sentiment-tone.ts`). Category chips unchanged. No blue.

Packages: shadcn/ui CLI v4 (`components.json`, manual config; added command, dialog (command dependency), dropdown-menu, avatar, tabs, sonner — existing skeleton/tooltip kept to preserve their API), `cmdk`, `radix-ui`, `sonner`, `motion` (MotionCard: 6 px entrance + 2 px hover lift, reduced-motion aware, no opacity animation), `nextjs-toploader` (#0AC985, client-only), `lucide-react` (already the only icon set).

## Polish run 2 — 2026-10-18 (finished-product touches + /news #418 root cause)

Safety tag `pre-polish-run2-20261018` → `c5cdb14` (Run 1 HEAD).

### /news React #418 under back/forward spam — root cause
Two independent defects, both reproduced with a reload/back-forward probe and a patched `onRecoverableError` that printed the component stack:
1. **Un-suspended async server slot in the client NavRail.** `BackendStatus` (async server component, pings `/health` with `no-store` on every request) is passed into the client `NavRail` as `status` with no Suspense boundary. Its RSC row can stream in after the shell begins hydrating; NavRail's post-mount `setMounted/setCollapsed` update reached the still-dehydrated slot → #418, component stack `div > aside > NavRail`. Fix: `<Suspense fallback={null}>{status}</Suspense>` in nav-rail.tsx. Probe: 13 errors / 120 reloads before → 0 / 160 after.
2. **History traversal into a half-streamed document.** /news inlined all ~2,100 items twice (HTML + RSC ≈ 1.9 MB). The pre-hydration popstate guard disarmed as soon as the shell hydrated, while /news Suspense boundaries were still streaming, so a back/forward in that window rendered another route into the half-streamed DOM. Fix: (a) the document now ships only the first 120 items (`slimNewsItem`), the full list loads from `GET /api/news/feed` after hydration, in the same deterministic order; (b) the guard stays armed until hydrated **and** window `load`, swallows the traversal (`stopImmediatePropagation`) and does a full document load; (c) `pageshow` with `persisted` reloads a bfcache-restored page that was frozen mid-stream; (d) the onboarding redirect waits for `load`.
Also: feed order is a stable sort (published_at desc → company slug → id); relative times ("5 h ago") render only after mount via `useNow()` (null on server and first client render), so every `suppressHydrationWarning` in the overview tiles and the `<body>` was removed.

### Finished-product touches
Self-hosted illustrations (`public/illustrations/*.webp`, OCR-verified text-free) on 404 / error / global-error / EmptyState (companies no-match, B Social "No verified posts…", signals offline, news filters, company + reputation not-found); OG + Twitter images via next/og over the text-free backdrop (`public/og/og-backdrop.jpg`, 1200×630) with live "B Capital / Portfolio Intelligence" in #1F2328; `icon.tsx` + `apple-icon.tsx` green "B" monogram; unique per-route titles + description/OG/Twitter; ⌘K palette rebuilt on cmdk (pages, 4 reputation subjects, companies) and wired to the sidebar hint; sonner toasts for copy-link, retry and filter reset; tooltips on metric labels; footer build stamp (version · commit · last updated, inlined at build); focus-visible rings, skip link, prefers-reduced-motion (MotionConfig + CSS incl. top-loader); `@vercel/analytics` rendered on Vercel deployments only (no secrets). New spec `e2e/polish-run2.spec.ts`.

## Polish run B — 2026-10-18 (icons/manifest, share card, small touches, /news #418 hardening)

Run A (execution 6ad4a2cd…, status "stopped") pushed only the annotated safety tag `pre-polish-runA-20261018` → e2cbec8; it left no commit. Run B builds on e2cbec8.

- Icons generated from the app-icon master: `app/favicon.ico` (16/32/48), `app/icon.png` (512), `app/apple-icon.png` (180), `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (80 % safe zone); `app/manifest.ts` (theme_color #0AC985); viewport themeColor #0AC985. The generated `icon.tsx`/`apple-icon.tsx` were removed (file icons replace them).
- Share card: new text-free background (34ZZXlWBES) cover-cropped to 1200×630; "B Capital" / "Portfolio Intelligence" rendered as live #1F2328 text in the left empty area (opengraph-image + twitter-image). fiyFCautQo kept out: OCR reads "B Capital | Portfolio Intelligence" correctly, but it has text baked in so it stays a fallback only and is not shipped. ZMNjDXbPnM: text-free version of fiyFCautQo (right half 0.993 correlated), not a refinement of the four illustrations → not used (Run 2 backdrop superseded by 34ZZXlWBES).
- Canonical URLs (`alternates.canonical`) for overview, companies, company/[slug], news, reputation, signals, social, artifacts, chat.
- Nav items wrapped in Radix tooltips; Artifacts "no filter matches" → illustrated EmptyState with Reset + toast; download/export toasts on artifact cards and preview.
- /news #418 hardening: `fmtDate` no longer uses `toLocaleDateString("en-GB")` (ICU builds disagree: "Sep" vs "Sept" → SSR ≠ browser); B Social `publishedTime` and artifacts relative-date fallback made deterministic (UTC, fixed locale); all bare `toLocaleString()` in B Social pinned to en-US; bfcache restore of a hydrated page (`pageshow` persisted) now calls `router.refresh()`.
