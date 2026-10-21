# QA Closure Cycle 5 — Lane A Finding: Inspector Plan/Run Tabs

## 1. Conclusion: NEVER-LITERAL

Based on comprehensive git history and diff analysis between tag `uae-navy-gold-fallback-20261021` (commit `2008923`) and HEAD (`15305a6`):

**Finding**: **NEVER-LITERAL** (no `role="tab"` Plan/Run tabs ever existed in the inspector drawer).

### Git Evidence Summary
1. **Diff in `inspector-drawer.tsx` (`2008923` vs `HEAD`)**:
   - The only differences were:
     - Updating `InspectorToggle` button styling (`className` and moving the "Inspector" label into `<span className="sr-only">Inspector</span>`).
     - Adjusting desktop drawer width from `lg:w-[420px]` to `lg:w-[360px]`.
   - Neither commit had any tablist, tab buttons, or tab panels in `inspector-drawer.tsx`.
2. **Surface mapping at `2008923`**:
   - The **"Plan"** surface lived solely in the main chat/run view as `plan-stepper`:
     `<section className="od-steps" data-testid="plan-stepper" data-state={plan.provisional ? "provisional" : "ready"} aria-label="Plan">`
     accompanied by OnDemand status log blocks.
   - `run-rail.tsx` in `2008923` explicitly documented:
     `{/* Plan checklist intentionally NOT here: it lives only in the run view (data-testid=run-view, plan-stepper). */}`.
   - The **"Run"** surface was `run-header` in `chat-shell.tsx`:
     `<div className="oiu-run__header" data-testid="run-header" data-live={live ? "true" : "false"} aria-label="Run">`
     along with the inspector's `run-rail` card (`<Card data-testid="run-rail">`).
3. **`role="tab"` grep across the tree**:
   - `git grep -n -iE 'role="tab"|data-testid="(inspector-tab|plan-tab|run-tab|tab-)' 2008923 -- uae-ai-command-centre/src`:
     Only returned the CSS reset rule in `globals.css` (`:where(..., [role="tab"], ...)`).
   - `git grep -n -iE 'role="tab"|data-testid="(inspector-tab|plan-tab|run-tab)' 816aaae -- bcapital-portfolio-intelligence/web/src`:
     Tabs existed solely in `company-quick-view-drawer.tsx` for company drawer tabs (Overview, Team, Financials, etc.), never for Plan/Run.
4. Raw command transcripts have been captured and saved to:
   `app/qa/2026-10-21-cycle5/laneA/git-evidence.txt`

---

## 2. Implementation: Restoring Plan & Run Tabs in 360px Inspector

Per the mission brief, literal "Plan" and "Run" tabs have been cleanly and non-destructively implemented in the inspector slide-over:

### File Paths
- **`app/src/components/chat/inspector-tabs.tsx`** (NEW):
  - Defines `InspectorTabs` with WAI-ARIA `role="tablist"` (`aria-label="Run panel"`, `data-testid="inspector-tabs"`).
  - Two buttons with `role="tab"`:
    - `data-testid="inspector-tab-plan"`, text: `"Plan"`, `aria-selected`, `aria-controls="inspector-panel-plan"`.
    - `data-testid="inspector-tab-run"`, text: `"Run"`, `aria-selected`, `aria-controls="inspector-panel-run"`.
  - Full keyboard navigation: `ArrowLeft`, `ArrowRight`, `Home`, and `End` support with automatic focus transfer to the newly active tab button.
  - Defines `InspectorPlanPanel`:
    - Connects to the live stream store via `useStreamSelector` from `@/components/chat/open-intelligent-ui/chat-shell`.
    - Selects `s.plan` (`{ objective: string | null; steps: PlanStep[]; provisional?: boolean } | null`) and `s.od?.statusLogs?.length`.
    - Renders objective (`data-testid="inspector-plan-objective"`) and an ordered list of steps (`data-testid="inspector-plan-steps"`) with state indicator dots (`done` #0D0D0D, `running` #2563EB pulsing, `failed` #DC2626, `pending` #D4D4D4).
    - When no plan is present, displays exact empty state text:
      `"No plan for this run yet — the planner's steps appear here while a run streams."`
- **`app/src/components/chat/inspector-drawer.tsx`** (MODIFIED):
  - Retains `lg:w-[360px]` on the slide-over `<aside id="chat-inspector" data-testid="chat-inspector">`.
  - Places `InspectorTabs` at the top of `data-testid="inspector-body"` above all panels and sections.
  - Hosts both tab panels:
    - `data-testid="inspector-panel-run"`: hosts `<RunRail />` (active by default).
    - `data-testid="inspector-panel-plan"`: hosts `<InspectorPlanPanel />`.
  - **Crucial gate preservation**: "Organisation context" (`inspector-context`) and "Model & plugins" (`inspector-plugins`) sections are **always rendered below the tab panels** and never hidden behind tabs. `sidebar-plugins` with `plugin-toggle` remains rendered and visible by default when the inspector opens, ensuring E2E scenario F payload gates pass.
  - Re-exports `InspectorTabs`, `InspectorPlanPanel`, and `InspectorTabKey`.

### Default Tab & Test IDs
- **Default selected tab**: `"run"` (`activeTab = "run"`).
- **Tablist / Tab Test IDs**:
  - `data-testid="inspector-tabs"`
  - `data-testid="inspector-tab-plan"`
  - `data-testid="inspector-tab-run"`
- **Panel Test IDs**:
  - `data-testid="inspector-panel-run"`
  - `data-testid="inspector-panel-plan"`
- **Plan Checklist Test IDs**:
  - `data-testid="inspector-plan"`
  - `data-testid="inspector-plan-objective"`
  - `data-testid="inspector-plan-steps"`
  - `data-testid="inspector-plan-step"`
  - `data-testid="plan-empty-state"`
- **Preserved Existing Test IDs**:
  - `chat-inspector`, `inspector-toggle`, `inspector-backdrop`, `inspector-close`, `inspector-body`, `run-rail`, `dev-disclosure`, `inspector-context`, `inspector-plugins`, `sidebar-model`, `sidebar-plugins`, `company-picker`, `company-chip`, etc.

### Design Tokens
- Light-only palette (zero dark-mode / navy / gold / emerald tokens):
  - Selected tab text: `#0D0D0D`, bottom border: 2px `#0D0D0D`.
  - Unselected tab text: `#737373`, bottom border: 2px `transparent`.
  - Tab hover background: `#F9F9F9`.
  - Borders: `#E5E5E5`.
  - Focus ring: `focus-visible:outline-2 focus-visible:outline-ring` (accent `#2563EB` retained for focus outline).
  - No gradients, no theme toggle.

---

## 3. Type-check Result

Executed: `cd app && npx tsc --noEmit`
Output:
```
npm notice run uae-ai-command-centre@1.0.0 npx
npm notice run 'tsc' --noEmit
```
**Exit Code: 0** (Zero TypeScript compilation errors).

---

## 4. Visual Proof & Screenshots Note

screenshots of the open inspector at 1440x900 and 390x844 are captured by the coordinator after the rebuild/deploy (not possible in this lane: running server is the pre-change build)
