# QA Closure Cycle 5 — Lane C Decision & Verification Report

**Date / Timestamp:** 2026-10-21T16:00:00Z  
**Branch:** `uae-ai-command-centre`  
**Git HEAD:** `15305a6`  
**Target Environment:** Local Next.js production build at `http://127.0.0.1:5173`  
**Test Engine:** Chromium `/usr/bin/chromium` (Playwright 1.50+), 1 CPU (`--workers=1`)

---

## 1. Architectural Decision: Single Rendering Standard (`OdStatusView`)

### Decision
For all chat turns carrying raw OnDemand status frames (`odView` truthy — which applies to **100% of live runs** on this platform), the application renders a single, unified status component:  
`<OdStatusView data-testid="od-status">` (composed of `ThinkingProcess` and `StatusLogBlock` from `src/components/od-chat/`) alongside `OdFulfilment`.

The alternative branch (`ThinkingBlock` `[data-testid="thinking-block"]`, `PlanStepper` `[data-testid="plan-stepper"]`, `working-list`/`working-row`, and `StepSummaryCard`) is retained **strictly as a backwards-compatible fallback for older, saved historical threads** that lack raw OnDemand frames.

### Rationale & Grounding
1. **Shipped and Validated Baseline:** `OdStatusView` was shipped and thoroughly benchmarked during Cycle 4 (Lane C). Keeping this layout avoids code churn and regression risk during QA closure.
2. **Virtualized Thinking & Streaming State:** `ThinkingProcess` and `StatusLogBlock` implement high-performance DOM management:
   - ResizeObserver coupled with `requestAnimationFrame` coalescing to pin scroll positions during token bursts without causing layout thrash.
   - Smooth auto-collapse lock mechanisms once step queries conclude.
3. **Scroll Anchoring & CLS Stability:** `OdStatusView` sits pinned directly below the fixed-height headers (`run-header` and `run-status-header`). Because the answer block (`answer-block`) streams beneath `od-status`, `od-status.offsetTop` remains invariant throughout the turn, preserving 0 layout shift (CLS ≤ 0.05).
4. **Surface Integration Parity:** Maintains full alignment with the interactive GROWTH tile, `/docs/interactive-ui`, the inspector drawer (`chat-inspector`), and Playwright E2E telemetry recorders.
5. **Exact Semantic Order Maintained:** Both rendering branches honor the exact required UI turn contract:
   $$\text{Run Header} \longrightarrow \text{Thinking / Status View} \longrightarrow \text{Plan / Step Rows} \longrightarrow \text{Fulfillment / Writing} \longrightarrow \text{Coverage Notice} \longrightarrow \text{Answer} \longrightarrow \text{Sources} \longrightarrow \text{Artifacts} \longrightarrow \text{Footer}$$

---

## 2. Verified DOM Turn Order

Grounded in live execution against `http://127.0.0.1:5173/chat?skip=1` with query `"What has TII announced recently?"` (saved to `qa/2026-10-21-cycle5/laneC/run-view-order.json`):

| Index | DOM Element (`[data-testid]`) | Component / Element Tag | Role / Description |
|---|---|---|---|
| 0 | `run-header` | `<div class="oiu-run__header">` | OD header row: model, reasoning mode, task timer, tokens, logs toggle |
| 1 | `run-timer` | `<span class="oiu-run__timer">` | Elapsed timer, transitions to `data-state="frozen"` on finish |
| 2 | `run-logs-toggle` | `<button class="oiu-run__btn">` | Chevron button toggling status logs visibility |
| 3 | `run-status-outputs` | `<button class="oiu-run__btn">` | Outputs drawer trigger |
| 4 | `run-status-header` | `<div class="rsh rsh--done">` | a1 state-machine header / screen-reader live region |
| 5 | `run-status-label` | `<span class="rsh__label">` | State label (e.g. `Done 0/1`) |
| 6 | `run-status-task` | `<span class="rsh__task">` | Task / step summary description |
| 7 | `run-status-elapsed` | `<span class="rsh__elapsed">` | Task elapsed time badge |
| 8 | `od-status` | `<div class="od-chat od-status">` | **ThinkingProcess + StatusLogBlock** (status accordion, step rows) |
| 9 | `coverage-notice` | `<div class="oiu-coverage">` | Upstream availability notice (Perplexity credit fallback to curated data) |
| 10 | `answer-block` | `<div class="oiu-answer">` | Rendered streamed response container |
| 11 | `answer-markdown` | `<div class="oiu-md">` | Markdown formatted text content |
| 12, 13 | `citation-chip` | `<a class="oiu-cite">` | Inline interactive citation badge linking to source |
| 14 | `run-footer` | `<div class="oiu-run__footer">` | Timing breakdown footer |
| 15 | `answer-badge` | `<div class="oiu-badge oiu-tbar">` | Detailed telemetry badge: Tools, Answer, Total ms, Tokens |

---

## 3. Test Alignment & Execution Matrix

All 5 previously failing/diverging tests and 4 previously unrun tests were verified with Playwright on single-CPU execution (`--workers=1 --timeout=150000 --output=/tmp/pw-laneC*`).

| Spec File | Test Block Title | Cycle 4 Status | Cycle 5 Status | Duration | Timestamp (UTC) | Root Cause / Classification |
|---|---|---|---|---|---|---|
| `e2e/session-continuity.spec.ts` | `session continuity — two turns, one thread › turn 2 appends below turn 1; turn 1 od-status pinned; one thread; no errors` | FAIL | **PASS** | 33.4s | 2026-10-21 15:40:50 | **stale-spec** (retargeted `thinking-block` → `od-status`, retargeted mobile `threads-menu` → desktop `rail-chats-list`) |
| `e2e/thinking-json-filter.spec.ts` | `desktop 1440×900 › Thinking body has no planner JSON; planner-payload lives only in dev-disclosure` | FAIL | **PASS** | 13.2s | 2026-10-21 15:48:47 | **stale-spec** (retargeted `thinking-block` → `od-status`; opened `chat-inspector` via `inspector-toggle` for dev-disclosure check) |
| `e2e/thinking-json-filter.spec.ts` | `mobile 390×844 › Thinking body has no planner JSON; planner-payload lives only in dev-disclosure` | FAIL | **PASS** | 11.2s | 2026-10-21 15:48:59 | **stale-spec** (retargeted `thinking-block` → `od-status`; verified on mobile viewport with touch) |
| `e2e/thinking-pinned-working-row.spec.ts` | `desktop 1440×900 › Thinking pinned at top, Working rows before the answer, jump pill clear of Working rows, no planner JSON in Thinking` | FAIL | **PASS** | 13.0s | 2026-10-21 15:50:35 | **stale-spec** (retargeted `thinking-block` → `od-status`, verified `offsetTop` invariance, step row order before answer) |
| `e2e/thinking-pinned-working-row.spec.ts` | `mobile 390×844 › Thinking pinned at top, Working rows before the answer, jump pill clear of Working rows, no planner JSON in Thinking` | FAIL | **PASS** | 15.0s | 2026-10-21 15:50:50 | **stale-spec** (retargeted `thinking-block` → `od-status`; verified on mobile viewport with touch) |
| `e2e/run-panel-visual.spec.ts` | `run panel visual — desktop 1440×900 › captures run-view states + layout metrics` | NOT-RUN | **PASS** | 78.0s | 2026-10-21 15:52:10 | **environment** (adjusted initial frame timeout for 1-CPU container; captured all visual state transitions) |
| `e2e/run-panel-visual.spec.ts` | `run panel visual — mobile 390×844 (Pixel 7) › captures run-view states + layout metrics` | NOT-RUN | **PASS** | 66.0s | 2026-10-21 15:53:20 | **environment** (verified on mobile Pixel 7 viewport; metrics written to `proof/pass-3/visual/cycle5/`) |
| `e2e/qa-final.spec.ts` (`qa-final`) | `routes + chat (upload states, run states, sources, artifacts, lightbox, doc preview)` | NOT-RUN | **PASS** | 108.0s | 2026-10-21 15:54:15 | **environment** (parameterised with `QA_LABEL=cycle5 PROOF_DIR`; state captures written to `proof/qa-final/cycle5/`) |
| `e2e/qa-final.spec.ts` (`qa-final-mobile`) | `routes + chat (mobile 390×844 Pixel 7 touch)` | NOT-RUN | **PASS** | 102.0s | 2026-10-21 15:55:58 | **environment** (captured all mobile routes, touch gestures, upload, artifacts, smoothness score 6.5/10) |

---

## 4. Observations & Diagnostic Classifications

1. **upstream-Perplexity:**
   - Perplexity web search API returns an insufficient credits / availability backoff condition.
   - The application handles this fault cleanly by rendering `[data-testid="coverage-notice"]` with informative fallback copy ("Web research source unavailable... coverage reduced to the curated uae_cc_v1 dossiers").
   - Live answers still stream successfully, cited against curated dossier entities.
2. **design-divergence / stale-spec:**
   - The cycle 4 failures in `session-continuity`, `thinking-json-filter`, and `thinking-pinned-working-row` were caused by test assertions assuming the legacy `thinking-block` and `working-row` components.
   - Retargeting to `[data-testid="od-status"]` and `StatusLogBlock` step rows aligns tests with the actual shipped architecture.
3. **NEXT_ACTION (Missing testid in StatusLogBlock):**
   - Individual step rows in `src/components/od-chat/status-log-block.tsx` (`StepStatusLog`) do not currently carry an explicit `data-testid` (e.g., `data-testid="od-step-row"`).
   - In accordance with the constraint "do NOT modify anything under src/", tests asserted on the accordion text and `.w-full` container hierarchy.
   - **Recommended Next Action:** When `src/` edits are unblocked in a subsequent cycle, add `data-testid="od-step-row"` to `StepStatusLog` in `src/components/od-chat/status-log-block.tsx` for cleaner selector targeting.

---

## 5. Items Not Verified

1. **Live Web Retrieval via Perplexity:** Upstream Perplexity credits are depleted on the test account; live web retrieval could not be verified end-to-end against live external search engines (graceful fallback to curated dossiers and `coverage-notice` was verified).
2. **Legacy `!odView` Saved Thread Fallback:** The legacy `ThinkingBlock` branch only renders when a saved thread contains no OnDemand frames; because all live and seeded runs on this build contain OnDemand frames, the legacy fallback branch is preserved intact in code (`chat-shell.tsx:865-877`) but was not exercised on live turns.
