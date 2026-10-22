# Residue Sweep — Tests, Fixtures, Scripts, Src, Public, Mission

**Date:** 2026-10-21 (Cycle 5 — Lane B)  
**Branch:** `uae-ai-command-centre` @ HEAD `15305a6`  
**Search Pattern:** `b[ ._-]?capital|\bbcap\b|plugin-1791713636|portfolio intelligence|\bB Social\b` (case-insensitive)

---

## Directory Summary Table (Before vs After)

| Directory | Files Before | Hits Before | Files After | Hits After | Delta (Hits) | Status / Notes |
|---|---|---|---|---|---|---|
| **e2e** | 1 | 1 | 0 | 0 | -1 | **Clean (0 hits)** — `const PORTFOLIO = "plugin-1791713636"` removed from `run-panel-acceptance.spec.ts` |
| **tests / fixtures** | 2 | 17 | 2 | 17 | 0 | Historical SSE fixture recorded 2026-10-11 (`portfolio-movers.bridge.ndjson` + `README.md`) |
| **scripts** | 5 | 8 | 5 | 8 | 0 | Rollback tag & residual scanner pattern definitions (**Exempt**) |
| **src** | 3 | 3 | 3 | 3 | 0 | Legacy constants & retired plugin ID disable-list in `config-public.ts` (src untouched) |
| **public** | 0 | 0 | 0 | 0 | 0 | **Clean (0 hits)** |
| **mission** | 0 | 0 | 0 | 0 | 0 | **Clean (0 hits)** |
| **Total** | 11 | 29 | 10 | 28 | -1 | `e2e` eradicated to 0 hits |

---

## Detailed File Breakdown

### 1. `e2e/` (Lane B Scope)
- **Before:**
  - `e2e/run-panel-acceptance.spec.ts`: 1 hit (line 20: `const PORTFOLIO = "plugin-1791713636";`)
  - `e2e/run-panel-working-header.spec.ts`: 0 hits
  - `e2e/thread-reopen.spec.ts`: 0 hits
- **After:**
  - `e2e/run-panel-acceptance.spec.ts`: **0 hits**
  - `e2e/run-panel-working-header.spec.ts`: **0 hits**
  - `e2e/thread-reopen.spec.ts`: **0 hits**
  - All other files under `e2e/`: **0 hits**
  - **Total e2e hits: 0**

### 2. `tests/fixtures/`
- `tests/fixtures/sse/README.md`: 1 hit
  - `pluginIds: ["plugin-1722260873" (Perplexity), "plugin-1791713636" (Portfolio Plugin)]`
- `tests/fixtures/sse/portfolio-movers.bridge.ndjson`: 16 hits
  - Static SSE bridge recording fixture preserved for regression tests.

### 3. `scripts/` (Exemptions)
- `scripts/resume-mission.sh` (1 hit): `TAG=bcap-pre-uae-20261020T2130Z` — Rollback tag name (**Exempt**).
- `scripts/uae/resume.mjs` (1 hit): `refs/tags/bcap-pre-uae-20261020T2130Z` — Rollback tag reference (**Exempt**).
- `scripts/uae/qa/agent5.mjs` (2 hits): `bcap-pre-uae-20261020T2130Z` — Tag inspection (**Exempt**).
- `scripts/uae/qa/agent1.mjs` (1 hit): `const BRAND = [...]` — Active scanner pattern (**Exempt**).
- `scripts/uae/residual-scan.mjs` (3 hits): Scanner pattern list + `TAG_RE` (**Exempt**).

### 4. `src/` (Constraint: Do Not Modify under src/)
- `src/components/chat/open-intelligent-ui/chat-shell.tsx`: 1 hit (`const PORTFOLIO_PLUGIN = "plugin-1791713636";`)
- `src/lib/plugin-icons.ts`: 1 hit (`export const PORTFOLIO_PLUGIN_ICON_ID = "plugin-1791713636";`)
- `src/lib/ondemand/config-public.ts`: 1 hit (`DISABLED_PLUGIN_IDS = new Set(["plugin-1785777296", "plugin-1791713636"])`)

### 5. `public/` & `mission/`
- Zero hits found.
