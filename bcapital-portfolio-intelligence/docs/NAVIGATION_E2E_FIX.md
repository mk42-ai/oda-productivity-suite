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
