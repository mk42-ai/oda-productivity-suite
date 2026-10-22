# Lane C — live rail / Plan / Run verification (cycle 4)

Base: http://127.0.0.1:5173 (HEAD c005420, real OnDemand key). Pass 1 2026-10-21T13:55:03.811Z → 2026-10-21T13:58:01.436Z; pass 2 2026-10-21T13:58:02.113Z → 2026-10-21T13:58:10.851Z (UTC). Scripts: /tmp/laneC-qa.mjs, /tmp/laneC-pass2.mjs (playwright-core, /usr/bin/chromium).

## What the "Plan" and "Run" surfaces are (honest note)
There are **no literal Plan/Run tabs**. `plan-stepper` lives only in the `!odView` branch of `RunView`; every live run on this build carries raw OnDemand frames, so `OdStatusView` (`[data-testid=od-status]`) renders instead and **`plan-stepper` never mounts on a live run** (same outcome as cycle 3, different cause: not plan_required:false but the od-frame branch). All 5 multi-step prompts produced a **1-step** OnDemand plan.
- **Plan tab** := `[data-testid=od-status]` inside the last `[data-testid=run-view]` (planning text + per-step accordion row + plugin chip), shown/hidden by `[data-testid=run-logs-toggle]`.
- **Run tab** := `aside#chat-inspector` (via `[data-testid=inspector-toggle]`) → `[data-testid=run-rail]` "This run" card with `[data-testid=dev-disclosure]` open.

## Measured px (1440×900)
| Item | Spec | Measured | Result |
|---|---|---|---|
| nav rail initial on /chat (no stored key) | 64 (collapsed by design) | 64 | PASS |
| nav rail after rail-toggle (expanded) | 224 | 224, uaecc.nav.rail=expanded | PASS |
| nav rail after hard reload | 224 persisted | 224, key=expanded | PASS |
| nav rail after 2nd toggle (collapsed) | 64 | 64 | PASS |
| top bar .openui-agent-thread-header height | 52 | 52 | PASS |
| [data-testid=chat-topbar] inner bar height | (inner) — | 32 | PASS |
| conversation column .openui-agent-thread-messages width | 800 | 800 | PASS |
| composer .oiu-composer width | 800 | 800 | PASS |
| inspector aside#chat-inspector width (open) | 360 | 360 (x=1080) | PASS |
| inspector closed off-canvas | x=1440 | x=1440 | PASS |
| run-rail card width | — | 335 | PASS |
| rail thread items after seeding | ≥5 | 5 | PASS |
| rail thread items after reload | ≥5 | 5 | PASS |
| run-view scrollWidth ≤ clientWidth (logs open) | ≤ | 720 vs 712 | FAIL |
| run-view scrollWidth ≤ clientWidth (logs closed) | ≤ | 712 vs 712 | PASS |
| document scrollWidth | 1440 | 1440 | PASS |

## Measured px (390×844)
| Item | Spec | Measured | Result |
|---|---|---|---|
| rail drawer width | 280 (max 85vw) | 280 (max-width 331.5px) | PASS |
| rail overlay present | yes | 1 × 390×844 | PASS |
| drawer thread items | ≥5 | 5 | PASS |
| inspector as bottom sheet | w 390, h ≤ 85dvh | w 390, h 717 (max-height 717.4px), y 127, backdrop true | PASS |
| run-view scrollWidth ≤ clientWidth (logs open) | ≤ | 316 vs 308 | FAIL |
| document scrollWidth | 390 | 390 (drawer open 390) | PASS |

## Seeded threads (pass 1, used for all screenshots)
| # | question | ms (first answer) | citations | plan steps (od rows / plan-step) | answer (first 150) |
|---|---|---|---|---|---|
| 1 | Compare TII, MBZUAI and G42 on (1) latest model releases, (2) 2026 partnerships, (3) talen… | 32131 (21601) | 16 | 1 / 0 | Verified facts ComparisonTIIMBZUAIG42Latest model releases listedOn 7 October 2026, reports described launches including Falcon-Emirati 7B and Arabic  |
| 2 | Build a 7-day watch brief: for each of Space42, Core42, Presight list one verified October… | 45196 (37681) | 3 | 1 / 0 | Verified facts Space42 — 14–20 October 2026 event: unavailable in the supplied records. The latest dated item provided is its June 9 announcement that |
| 3 | For EDGE Group and Space42: (1) list their 2026 AI-related announcements, (2) identify sha… | 31634 (22612) | 12 | 1 / 0 | Verified facts Organisation2026 AI-related announcementsRelated 2026 activity in the available sourcesShared partners identifiedEDGE GroupA 2026 AI-re |
| 4 | Produce a three-part briefing on MBZUAI: (a) 2026 research output highlights, (b) industry… | 27136 (21120) | 8 | 1 / 0 | Verified facts 2026 research output highlights On 15 October, MBZUAI’s Institute of Foundation Models and Inception42 launched Jais 3, described in th |
| 5 | Map the UAE sovereign AI compute landscape: step 1 list G42/Core42 data-centre projects an… | 24117 (21110) | 2 | 1 / 0 | Verified facts Rank2026 G42/Core42 data-centre project foundCapacity reportedInternational partner1Core42’s Lake Mariner deployment in New York was re |

## Screenshots (qa/2026-10-21-cycle4/laneC/)
- run-streaming-1-1440x900.png
- run-streaming-2-1440x900.png
- plan-tab-1440x900.png
- run-tab-1440x900.png
- inspector-open-1440x900.png
- rail-collapsed-1440x900.png
- rail-expanded-threads-1440x900.png
- rail-after-reload-1440x900.png
- plan-tab-390x844.png
- run-tab-390x844.png
- inspector-open-390x844.png
- drawer-open-390x844.png
- plan-tab-logs-closed-1440x900.png

## Notes
- Plan surface: there are NO literal Plan/Run tabs in this build. [data-testid=plan-stepper] (PlanStepper) is rendered ONLY in the !odView branch of RunView (chat-shell.tsx ~L841-846). Every live run on c005420 carries raw OnDemand status frames (CE.raw -> odRun), so odView is truthy and RunView renders OdStatusView ([data-testid=od-status]: ThinkingProcess planning text + StatusLogBlock with one StatusAccordion row per plan step + plugin chips) instead. plan-stepper therefore never mounts on a live run regardless of plan size; it can only mount for legacy saved turns without od frames.
- Treated as PLAN tab: the [data-testid=od-status] block inside the last [data-testid=run-view], toggled by [data-testid=run-logs-toggle] (aria-expanded true=open). Treated as RUN tab: aside#chat-inspector opened via [data-testid=inspector-toggle], containing the This run card [data-testid=run-rail] with [data-testid=dev-disclosure] expanded.
- All 5 multi-step prompts produced a 1-step OnDemand plan (single step title e.g. Researching three organisations, one Perplexity chip) — the planner collapsed the multi-part asks into one research step; no run returned >1 step.
- run-view horizontal overflow: with logs open scrollWidth exceeds clientWidth by 8 px at both viewports (desktop 720 vs 712, mobile 316 vs 308); with logs closed 712==712. Cause: OdStatusView wrappers use ml-2 w-full (margin-left 8px + width 100%) in chat-shell.tsx OdStatusView. Document scrollWidth stays 1440/390, so no page-level horizontal scroll.
- Nav rail on /chat with no stored uaecc.nav.rail key starts COLLAPSED (64) by design (setCollapsed(v ? v===collapsed : onChat)). Toggle -> 224 and key=expanded; hard reload keeps 224 and 5 thread items; second toggle -> 64.
- [data-testid=chat-topbar] is the 32px inner bar inside the 52px .openui-agent-thread-header (header y=28..80 under the disclaimer strip).
- run-rail Developer details show real telemetry only for the live run (pass 1: 7,679 tokens, first token 27,499 ms, total 31.6 s, 726 frames); after a thread is re-opened from storage the metrics show dashes (stream-state only).
- Every run ended with the expected upstream Perplexity insufficient-credits condition; answers still streamed with citations (2-16 citation chips).
- Client console: only 6 x Failed to load resource 404 (allow-listed noise); no pageerror.
- Scripts: /tmp/laneC-qa.mjs (seed 5 runs + measurements, pass 1) and /tmp/laneC-pass2.mjs (re-open thread 1 from saved storageState, Plan/Run captures at both viewports). Screenshots overwritten by pass 2 where names collide.