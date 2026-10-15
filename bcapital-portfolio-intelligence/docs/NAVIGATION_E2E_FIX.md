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
