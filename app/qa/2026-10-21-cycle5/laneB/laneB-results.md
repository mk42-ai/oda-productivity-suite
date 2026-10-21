# Lane B QA Closure Cycle 5 Results

**Date / Time:** 2026-10-21 (All runs executed between 15:48 and 15:51 UTC)  
**Environment:** Next.js @ `http://127.0.0.1:5173` (BASE_URL), Chromium @ `/usr/bin/chromium`  
**Git HEAD:** `15305a6` on branch `uae-ai-command-centre`  
**Lane:** Lane B (QA Closure Cycle 5 — stale Portfolio/threads-menu Playwright specs + residue sweep)

---

## 1. Test Results Summary

All 5 test scenarios across the 3 rewritten specs passed 100% green:

| Spec File | Test Name | Viewport / Project | Status | Duration | Run Timestamp (UTC) |
|---|---|---|---|---|---|
| `e2e/run-panel-acceptance.spec.ts` | run-panel acceptance — desktop 1440×900 | 1440×900 (`desktop`) | **PASSED** | 16.6s | 2026-10-21 15:48:45 |
| `e2e/run-panel-acceptance.spec.ts` | run-panel acceptance — mobile 390×844 | 390×844 (`desktop`) | **PASSED** | 17.0s | 2026-10-21 15:49:02 |
| `e2e/run-panel-working-header.spec.ts` | run panel Working header invariant @ desktop | 1440×900 (`desktop`) | **PASSED** | 14.8s | 2026-10-21 15:49:50 |
| `e2e/run-panel-working-header.spec.ts` | run panel Working header invariant @ mobile | 390×844 (`desktop`) | **PASSED** | 13.7s | 2026-10-21 15:50:04 |
| `e2e/thread-reopen.spec.ts` | reload → recent thread listed → click → messages restored; ?thread deep link | 1440×900 (`desktop`) | **PASSED** | 22.5s | 2026-10-21 15:50:50 |

---

## 2. Assertion Changes Breakdown

### A. `e2e/run-panel-acceptance.spec.ts`
- **Prompt:** "What has TII announced recently?" sent via `getByTestId("composer-input")` and `getByTestId("composer-send")`.
- **Invariant 1 (Stale -> Rewritten):**
  - *Stale:* Checked `thinking-block` collapsed during first 3s and auto-expanding after Portfolio plugin working row (`plugin-1791713636`).
  - *Rewritten (cycle 5):* Asserts `run-view` exists and `run-header` precedes `od-status` (or `run-status-header`) in DOM order.
- **Invariant 2 (Stale -> Rewritten):**
  - *Stale:* Checked `run-status-header` precedes `thinking-block` and offsetTop moves ≤ 2 px.
  - *Rewritten (cycle 5):* Asserts `run-header` offsetTop relative to `run-view` is stable (moves ≤ 2 px) across ≥ 20 samples while streaming.
- **Invariant 3 (Stale -> Rewritten):**
  - *Stale:* Checked Portfolio plugin row carries UAE AI Command Centre `/brand/` chip.
  - *Rewritten (cycle 5):* Asserts inspector opens via `inspector-toggle` (`chat-inspector[data-open=true]`), width ≤ 360 at 1440×900, and `run-rail` (`data-testid="run-rail"`) is visible.
- **Invariant 4 (Stale -> Rewritten):**
  - *Stale:* Checked `plan-stepper` contains ≥ 1 plan-step and no raw JSON.
  - *Rewritten (cycle 5):* Asserts `od-status` and `run-view` text contains no raw planner JSON (`PLAN_RAW_RE` / `RAW_JSON_RE`).
- **Invariant 5 (Stale -> Rewritten):**
  - *Stale:* Checked answer-block present, planner-payload visible after dev-disclosure.
  - *Rewritten (cycle 5):* Asserts run settles (`run-timer[data-state=frozen]` or `run-view[data-live=false]`), `answer-block` present, and if `coverage-notice` is present it contains "unavailable" with NO "Response failed" text.
- **Invariant 6 & 7:** Preserved `working-band` absent throughout/after settle and 0 client console/page errors.

### B. `e2e/run-panel-working-header.spec.ts`
- **Prompt:** "What has TII announced recently?" sent via `composer-input` / `composer-send`.
- **Tool Row Check (Stale -> Rewritten):**
  - *Stale:* `expect(maxRows, "≥2 tool rows (Perplexity + Portfolio Plugin)").toBeGreaterThanOrEqual(2)` which asserted `[data-testid=working-row]`.
  - *Rewritten (cycle 5):* Removed stale `working-row` count assertion (since live runs render `odView` / `OdStatusView` instead of legacy working-rows).
- **Header Order & Invariants (Rewritten cycle 5):**
  - `run-view` exists; `run-header` precedes `run-status-header` / `od-status` in DOM order (`finalRunHeaderIdx === 0`, `followingIdx > 0`).
  - Anchor offsetTop drift ≤ 2 px across all samples.
  - Interleaved "Working…" text hits: 0 (`interleavedHits === 0`).
  - `working-band` hits: 0 (`bandHits === 0`).
  - Run settles with answer (`finalAnswerChars > 0`).
  - If `coverage-notice` is present, it contains "unavailable" and body contains no "Response failed" text.

### C. `e2e/thread-reopen.spec.ts`
- **Prompt:** "What has TII announced recently?" sent via `composer-input` / `composer-send`.
- **Thread Reopen Check at 1440 px (Stale -> Rewritten):**
  - *Stale:* Looked for `<details data-testid="threads-menu">` which only exists on mobile 390 px top bar (hidden on desktop `lg:`).
  - *Rewritten (cycle 5):* At 1440 px desktop (`viewport.width >= 1024`), recent threads live in left rail: `data-testid="rail-chats-section" > data-testid="rail-chats-list" > data-testid="rail-chat-item"` with `span[data-testid="thread-title"]`. Added fallback to `data-testid="welcome-recent"`.
  - On mobile 390 px (`viewport.width < 1024`), kept `<details data-testid="threads-menu">`.
  - Verifies user message restored and `?thread=<tid>` deep link selects the thread on mount.

---

## 3. Residue Sweep (Before vs After)

Search regex: `b[ ._-]?capital|\bbcap\b|plugin-1791713636|portfolio intelligence|\bB Social\b`

| Scope | Files Before | Hits Before | Files After | Hits After | Delta |
|---|---|---|---|---|---|
| **e2e** | 1 (`run-panel-acceptance.spec.ts`) | 1 | 0 | 0 | -1 |
| **tests / fixtures** | 2 | 17 | 2 | 17 | 0 |
| **scripts** | 5 | 8 | 5 | 8 | 0 (Exempt rollback tag / scanner patterns) |
| **src** | 3 | 3 | 3 | 3 | 0 (Source files untouched) |
| **public** | 0 | 0 | 0 | 0 | 0 |
| **mission** | 0 | 0 | 0 | 0 | 0 |
| **Total** | 11 | 29 | 10 | 28 | -1 |

Detailed table and exemption documentation saved in `qa/2026-10-21-cycle5/laneB/residue-tests.md`.

---

## 4. Anything NOT VERIFIED / Notes
- **Out of credits coverage notice:** In all test runs, the pinned Perplexity plugin (`plugin-1722260873`) correctly emitted `coverage-notice` with reason "upstream" / "backoff", rendered data-testid `coverage-notice` containing "Web research source unavailable", and streamed the answer from local dossiers without failing. All assertions confirmed this behavior.
- **Source code untouched:** No modifications were made under `src/`, maintaining the strict constraint.
- **Untouched specs:** Specs owned by Lane C (`session-continuity`, `thinking-json-filter`, `thinking-pinned-working-row`) were left untouched.
- **Logs saved:** Test execution logs are saved in `qa/2026-10-21-cycle5/laneB/*.log`.
