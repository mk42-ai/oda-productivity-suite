# Lane B (cycle 6) — Layout spec: inspector run panel (Plan / Run tabs)

Base: https://sb-1rpldsghtcd5.vercel.run (HTTPS sandbox of HEAD `3a07efb`, real OnDemand key; Perplexity plugin in availability backoff → `data-plugin-state=unavailable` chips + coverage notice, which is fine for this lane).
Main pass 2026-10-21T21:15:16Z → 21:16:13Z (UTC); live-plan probe 21:29:47Z → 21:30:18Z (after the 21:29 UTC backoff retry). Harness: playwright-core + `/usr/bin/chromium` headless, settings primed in `localStorage["uaecc.settings.v1"]` (same shape as `e2e/helpers.ts` `primeSettings`), entry `/chat?skip=1`. Numbers: `laneB-measurements.json`.

Threads seeded (all reached `[data-testid=run-timer][data-state=frozen]`, 0 client errors):
1. 1440×900 — "Compare TII and MBZUAI on open-model releases in 2026, then list three risks, then draft a one-paragraph brief" (20.2 s wall, timer 15 428 ms)
2. 1440×900 — "Build a timeline of AIREV partnerships 2025–2026, then assess which matter most for sovereign AI, then summarise" (5.3 s wall)
3. 390×844 (fresh context, isMobile+hasTouch) — prompt 1 again (21.7 s wall, timer 17 893 ms)
4. 1440×900 live-plan probe — "Rank G42, Core42 and Space42 by 2026 sovereign-compute announcements, then list two dependencies each, then write a three-sentence brief" (31.9 s, Plan tab open while streaming)

## (a) Layout spec — inspector run panel

| Item | Spec (source) | Measured 1440×900 | Measured 390×844 | Verdict |
|---|---|---|---|---|
| `aside#chat-inspector` (`data-testid=chat-inspector`, `aria-label="Inspector"`) | desktop right overlay `lg:w-[360px] lg:h-dvh`; mobile bottom sheet `inset-x-0 bottom-0 max-h-[85dvh] rounded-t-xl` — `src/components/chat/inspector-drawer.tsx:60-63` | x 1080 y 0 **w 360** h 900, `data-open=true`, visible | x 0 y 127 **w 390** h 717 (≤ 717 = 85 % of 844), visible | PASS |
| Opened by | `[data-testid=inspector-toggle]` (`aria-controls=chat-inspector`, `aria-expanded`) — `inspector-drawer.tsx:31` | works | works | PASS |
| Tablist | `role="tablist" aria-label="Run panel" data-testid="inspector-tabs"` — `src/components/chat/inspector-tabs.tsx:41-47` | 1 found, x 1093 y 69 w 335 h 30 | 1 found, x 12 y 197 w 366 h 30 | PASS |
| Tab 1 | `role=tab id=inspector-tab-plan data-testid=inspector-tab-plan aria-controls=inspector-panel-plan`, label **"Plan"** — `inspector-tabs.tsx:48-66` | name "Plan", x 1093 y 69 w 49 h 30, aria-selected=false (tabindex −1) initially | name "Plan", x 12 y 197 w 49 h 30, aria-selected=false | PASS |
| Tab 2 | `role=tab id=inspector-tab-run data-testid=inspector-tab-run aria-controls=inspector-panel-run`, label **"Run"** — `inspector-tabs.tsx:67-85` | name "Run", x 1146 y 69 w 46 h 30, aria-selected=**true** (default; `inspector-drawer.tsx:50` `useState<InspectorTabKey>("run")`) | name "Run", x 65 y 197 w 46 h 30, aria-selected=true | PASS |
| Keyboard nav | onKeyDown on the tablist: ArrowLeft/ArrowRight toggle between the two tabs and move focus; Home → Plan; End → Run — `inspector-tabs.tsx:19-38` (roving tabindex 0/−1 at :55/:74) | focus Plan → ArrowRight ⇒ Run aria-selected=true, focus on `inspector-tab-run`; ArrowLeft ⇒ Plan selected/focused; End ⇒ Run; Home ⇒ Plan | identical | PASS |
| Plan panel | `role=tabpanel id=inspector-panel-plan data-testid=inspector-panel-plan hidden={activeTab!=="plan"}` → `<InspectorPlanPanel/>` — `inspector-drawer.tsx:80-89`; panel = **live plan checklist from the stream store**: `useStreamSelector((s) => s.plan)` → objective (`inspector-plan-objective`) + `<ol data-testid=inspector-plan-steps>` of `inspector-plan-step` with state dots (done/running/failed/pending), else `plan-empty-state` — `inspector-tabs.tsx:90-136` (store: `chat-shell.tsx:150` `useStreamSelector`, plan written at `chat-shell.tsx:230-236`, reset to `IDLE` per run at `:1267`) | click Plan ⇒ aria-selected=true, panel visible x 1093 y 111 w 335 h 100, Run panel hidden. After the runs had frozen the panel showed `plan-empty-state` ("No plan for this run yet — the planner's steps appear here while a run streams."), 0 steps. **Live probe (Plan tab open during streaming): objective + 1 `inspector-plan-step` ("Comparing compute announcements") visible from t≈5.2 s until frozen at 31.9 s** (`inspector-plan-tab-live-1440x900.png`) | click Plan ⇒ selected, panel x 12 y 239 w 366 h 100, empty-state text (post-run) | PASS (populated while streaming; empty after settle — see note) |
| Run panel | `role=tabpanel id=inspector-panel-run data-testid=inspector-panel-run` → `<RunRail/>` — `inspector-drawer.tsx:70-79`; run-rail card `<Card data-testid="run-rail">` with model line, `run-plugin` chips (`data-plugin-state` queued/running/done/unavailable) and `dev-disclosure` — `src/components/chat/run-rail.tsx:19-24` | click Run ⇒ aria-selected=true, Plan panel hidden; `run-rail` visible x 1093 y 111 w 335 h 164; text "This run · GPT-5.6 Luna · reasoning medium"; 1 chip `data-plugin-state=unavailable` ("unavailable — skipped (availability backoff, next retry 21:29 UTC)"). Live probe: chip `running` for t 0.7–10.3 s then `unavailable` | `run-rail` visible x 12 y 239 w 366 h 141; 1 chip `unavailable` | PASS |
| Escape closes | `inspector-drawer.tsx:52-56` | `data-open=false` after Escape | same | PASS |
| Client errors (pageerror / console.error) | — | 0 | 0 | PASS |

Note on the Plan panel after a run settles: `InspectorPlanPanel` reads the *live* stream store (`s.plan`), which is reset to `IDLE` (plan:null) when the next run starts and is not re-hydrated from the saved thread meta; the measured empty state after the frozen runs is therefore the designed "live checklist" behaviour, not a missing tab. The populated state is proven by the mid-stream probe (objective "I'll rank G42, Core42, and Space42 by 2026 sovereign-compute announcements, list two dependencies each, and write a three-sentence brief." + step "Comparing compute announcements"). As in cycle 4, every multi-step prompt collapsed to a 1-step OnDemand plan, and the in-thread `plan-step` rows (`od-status` branch) stayed at 0.

Tab names: the real names are exactly **"Plan"** and **"Run"** (`inspector-tabs.tsx:65`, `:84`) — no rename needed; the tablist's accessible name is "Run panel" (`:43`).

## (b) Why cycle-4 Lane C missed them

- Cycle-4 Lane C measured on **HEAD `c005420` (2026-10-21T13:03:33Z)** between **13:55:03Z and 13:58:10Z** and wrote (`qa/2026-10-21-cycle4/laneC/laneC-results.md` line 3 for base/HEAD/timestamps; line 6 "There are **no literal Plan/Run tabs**"; lines 7-8 and 65-66 define the proxies it measured instead: "Plan tab := `[data-testid=od-status]` … toggled by `run-logs-toggle`" and "Run tab := `aside#chat-inspector` … `[data-testid=run-rail]`"). That statement was **correct for c005420**.
- Cycle-5 Lane A's git audit (`qa/2026-10-21-cycle5/laneA/laneA-finding.md` §1 "Conclusion: NEVER-LITERAL", evidence in `git-evidence.txt`) confirmed no `role="tab"` Plan/Run ever existed in the inspector before its change, then **introduced** them in `src/components/chat/inspector-tabs.tsx` (§2 "Implementation").
- Read-only git on this tree, `git -C .. log --format='%h %cI %s' -- app/src/components/chat/inspector-tabs.tsx`:
  ```
  aaaa6e0 2026-10-21T15:59:57Z feat(uae-cc): Lane A — literal Plan / Run tabs in the 360 px inspector (role=tablist, keyboard nav, live plan checklist from the stream store; finding NEVER-LITERAL — no role=tab Plan/Run existed at 2008923); Lane F — Whiteshield … methodology note
  ```
  The file has exactly one commit, **aaaa6e0 at 15:59:57Z — ~2 h after the cycle-4 measurements (13:55–13:58Z)**. The live target of this lane is HEAD `3a07efb` (15:59:58Z, one commit later), which contains it. So cycle-4 did not miss an existing feature; it measured a build in which the tabs did not yet exist, and the gap is a timeline artefact, not a test defect.

## (c) Screenshots (viewport captures)

- `qa/2026-10-21-cycle6/laneB/inspector-plan-tab-1440x900.png` — Plan tab selected, 360 px slide-over (post-run empty state)
- `qa/2026-10-21-cycle6/laneB/inspector-run-tab-1440x900.png` — Run tab selected, `run-rail` with unavailable chip
- `qa/2026-10-21-cycle6/laneB/inspector-plan-tab-390x844.png` — Plan tab in the 390-wide bottom sheet (780×1688 px @2×)
- `qa/2026-10-21-cycle6/laneB/inspector-run-tab-390x844.png` — Run tab in the bottom sheet
- bonus: `qa/2026-10-21-cycle6/laneB/inspector-plan-tab-live-1440x900.png` — Plan tab populated mid-stream (objective + 1 step)

Scripts `_laneB.mjs` / `_live.mjs` were deleted after the run (evidence only). No source, spec or git state was modified.
