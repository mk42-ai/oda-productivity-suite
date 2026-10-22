# QA Verifier E2 Report — Chat Layout Spec and Payload Gate A–G

- **Date / Cycle**: 2026-10-22 Cycle 9
- **Lane**: E2
- **HEAD Commit**: `b91d69c`
- **UTC Start**: 2026-10-22 04:38:30 UTC
- **UTC End**: 2026-10-22 04:55:00 UTC
- **Targets Evaluated**:
  - **HTTPS Preview**: `https://sb-6u0rv43z1luy.vercel.run`
  - **Local (`next start`)**: `http://127.0.0.1:5190`

---

## 1. Measured Layout Spec vs Spec

All numbers measured directly via `qa/2026-10-22-cycle9/tools/layout-spec-probe.mjs` and `qa/2026-10-22-cycle9/tools/rail-persist-probe.mjs` against the HTTPS preview target.

| Component / Dimension | Spec | Measured | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Nav Rail (Expanded)** | 224 px | 224 px | PASS | Measured via getBoundingClientRect width |
| **Nav Rail (Collapsed)** | 64 px | 64 px | PASS | Measured via getBoundingClientRect width |
| **/chat First Paint Rail** | 64 px (default collapsed, no CLS) | 64 px | PASS | Clean paint without shift on initial navigation |
| **/chat Rail Persistence** | Persisted across reload | 224 px after reload when toggled; 64 px when toggled back | PASS | Stored under route group key `uaecc.nav.rail.chat` |
| **Pages Rail Persistence** | Persisted across reload | 224 px default, 64 px when toggled, persists across reload | PASS | Stored under route group key `uaecc.nav.rail` |
| **Rail Route Group Isolation** | Independent keys per group | Verified (`uaecc.nav.rail` vs `uaecc.nav.rail.chat`) | PASS | Cycle-9 enhancement: /chat maintains collapsed state independently of other pages |
| **Top Bar Height** | 52 px | 52 px | PASS | Measured on `.openui-agent-thread-header` |
| **Conversation Column** | 800 px | 800 px | PASS | Measured on `.openui-agent-welcome-screen` (800 px), `.oiu-composer` (800 px), `.openui-agent-thread-messages` (800 px) |
| **Inspector Width (Desktop)** | 360 px | 360 px | PASS | Measured on `[data-testid="chat-inspector"]` at 1440x900 |
| **Inspector Tabs** | Literal Plan / Run (`role="tab"`) | Present (`inspector-tab-plan`, `inspector-tab-run`) | PASS | Both tabs selectable; `aria-selected` toggles; respective panels mount |
| **Mobile Drawer Width** | 280 px | 280 px | PASS | Measured on `[data-testid="rail-drawer"]` at 390x844; overlay present |
| **Citation Preview Width** | ≤ 318 px at 390 viewport | 109 px max preview width (101 px visible hover) | PASS | Well within mobile boundaries |
| **Mobile Run-View Overflow** | `scrollWidth` = `clientWidth` (318 = 318) | `rvScroll`: 318 px, `rvClient`: 318 px | PASS | Zero horizontal run-view overflow at 390x844 |

---

## 2. Payload Gate A–G Results

Each scenario evaluated across 2 viewports (Desktop `1440x900` and Mobile `390x844`) against both HTTPS preview and Local `127.0.0.1:5190`.

### Summary by Target and Viewport

| Target | Viewport | Passed | Failed | Scenarios Passed | Scenarios Failed | Flaky Re-runs |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **HTTPS Preview** | 1440x900 (Desktop) | 7 / 7 | 0 / 7 | A, B, C, D, E, F, G | None | None |
| **HTTPS Preview** | 390x844 (Mobile) | 6 / 7 | 1 / 7 | A, B, C, D, E, F | G | Scenario G re-run failed (0/2 on G) |
| **Local (5190)** | 1440x900 (Desktop) | 7 / 7 | 0 / 7 | A, B, C, D, E, F, G | None | None |
| **Local (5190)** | 390x844 (Mobile) | 6 / 7 | 1 / 7 | A, B, C, D, E, F | G | Scenario G re-run failed (0/2 on G) |
| **Total Unique** | | **26 / 28** runs | **2 / 28** runs | **13 / 14** unique scenarios | **1 / 14** unique scenarios | |

### Detailed Breakdown by Scenario

| Scenario | HTTPS 1440 | HTTPS 390 | Local 1440 | Local 390 | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | PASS (4.7s) | PASS (5.8s) | PASS (4.3s) | PASS (3.2s) | Deliverables: artifact card + Outputs surfaced after the run |
| **B** | PASS (9.4s) | PASS (10.2s) | PASS (8.5s) | PASS (8.3s) | Pipeline & waiting: plan-stepper, live run header + timer, working rows |
| **C** | PASS (4.6s) | PASS (5.4s) | PASS (3.0s) | PASS (2.6s) | Citations: publisher chips in answer, Sources list, safe anchors |
| **D** | PASS (5.7s) | PASS (6.7s) | PASS (4.5s) | PASS (4.3s) | Root-first: run skeleton paints before first text delta, no broken images/overflow |
| **E** | PASS (17.1s) | PASS (18.1s) | PASS (17.2s) | PASS (16.2s) | Between-step summaries keep thinking/working mounted, scroll anchoring |
| **F** | PASS (12.6s) | PASS (15.1s) | PASS (14.6s) | PASS (15.3s) | Settings & plugin caps: pinned plugin locked, cap enforced, body mirrors inspector (REAL backend) |
| **G** | PASS (39.8s) | FAIL (25.1s, re-run 28.9s) | PASS (27.9s) | FAIL (22.4s, re-run 25.6s) | Forced 500 discreet notice; Retry -> 200 (REAL backend); cross-app sweep |

---

## 3. Run-Panel Mobile Result (`e2e/run-panel-mobile.spec.ts`)

- **Target**: HTTPS Preview (`https://sb-6u0rv43z1luy.vercel.run`)
- **Flags**: `--project=mobile --repeat-each=2 --workers=1`
- **Result**: **2 / 2 PASSED** (39.6s total)
- **Measurements**:
  - Run 1 Streaming: `docScroll`: 390, `inner`: 390, `rvScroll`: 318, `rvClient`: 318, `headerH`: 20, `statusH`: 1, `chatMainH`: 795
  - Run 1 Settled: `docScroll`: 390, `inner`: 390, `rvScroll`: 318, `rvClient`: 318, `headerH`: 20, `statusH`: 1, `chatMainH`: 795
  - Run 2 Streaming: `docScroll`: 390, `inner`: 390, `rvScroll`: 318, `rvClient`: 318, `headerH`: 20, `statusH`: 1, `chatMainH`: 795
  - Run 2 Settled: `docScroll`: 390, `inner`: 390, `rvScroll`: 318, `rvClient`: 318, `headerH`: 20, `statusH`: 1, `chatMainH`: 795
- **Conclusion**: `rvScroll` = 318 px and `rvClient` = 318 px both streaming and settled across both iterations; zero horizontal overflow.

---

## 4. Failure Analysis & Exact Assertion Text

### Scenario G at Mobile Viewport (390x844) on HTTPS and Local

#### Assertion Error Text:
```text
Error: route sweep: HTTP 200, no page errors, no horizontal overflow

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

    at check (e2e/chat-intelligent-ui-payloads.spec.ts:120:108)
    at e2e/chat-intelligent-ui-payloads.spec.ts:367:3
```

#### Diagnostic Breakdown:
- **Chat Functional Behavior**: All chat-specific assertions in Scenario G **passed**:
  - `discreet notice 'Response failed' + Retry only`: **True**
  - `no raw error strings / stack traces / HTTP dumps / modal`: **True**
  - `Retry → a second POST, HTTP 200, non-empty answer`: **True**
  - `no horizontal overflow (chat)`: **True**
  - `zero console/page errors overall (500 noise excluded)`: **True**
- **Cause of Failure**: The failure stems strictly from the post-chat cross-app sweep loop (lines 359–364):
  ```typescript
  sweep[route] = { errors: errs.length - before, overflow: !(await noOverflow(page)), status: res?.status() ?? null };
  rows["route sweep: HTTP 200, no page errors, no horizontal overflow"] = Object.values(sweep).every((r) => r.status === 200 && r.errors === 0 && !r.overflow);
  ```
- **Recorded Sweep Data**:
  - `/overview`: `errors`: 0, `overflow`: false, `status`: 200
  - `/watchlist`: `errors`: 0, `overflow`: false, `status`: 200
  - `/sentiment`: `errors`: 0, `overflow`: false, `status`: 200
  - `/news`: `errors`: 0, `overflow`: false, `status`: 200
  - `/radar`: `errors`: 0, `overflow`: false, `status`: 200
  - **`/graph`**: `errors`: 0, **`overflow`: true**, `status`: 200
  - `/briefing`: `errors`: 0, `overflow`: false, `status`: 200
  - `/methodology`: `errors`: 0, `overflow`: false, `status`: 200
- **Summary**: The `/graph` route triggers horizontal overflow (`scrollWidth > clientWidth + 1`) at `390px` viewport width on both HTTPS and Local targets. The chat surface itself is completely free of overflow.
