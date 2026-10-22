# QA Cycle 9 — Lane E3 Sweep Report

**Target Preview:** `https://sb-6u0rv43z1luy.vercel.run`  
**Git HEAD:** `b91d69c`  
**Execution Environment:** Playwright-Core + Chromium (`/usr/bin/chromium`), dual viewport (1440×900 desktop, 390×844 mobile)  
**Run Mode:** Two complete consecutive passes (`ROUND=c9a` and `ROUND=c9b`), Agents 1, 2, 3, 5 executed in parallel, Agent 4 executed solo  
**Generated Date:** 2026-10-22T04:52:00Z  

---

## 1. Executive Summary

Lane E3 completed two full sweeps of the 84-check QA suite against the live preview deployment of HEAD `b91d69c` on Vercel Sandbox.

| Metric | Round 1 (`c9a`) | Round 2 (`c9b`) | Status |
| :--- | :---: | :---: | :---: |
| **Agent 1** (Branding, Disclaimer, Zero Tenant Residue) | 11 / 11 | 11 / 11 | 100% PASS |
| **Agent 2** (Watchlist, Dossiers, Search, Filter, Compare, Logos) | 12 / 14 | 12 / 14 | 2 Failures (`spec-stale`) |
| **Agent 3** (Sentiment Universe, Playback, Source URL Status) | 13 / 13 | 13 / 13 | 100% PASS |
| **Agent 4** (Executive Chat 5 Demo Qs, Briefing Generation) | 14 / 14 | 14 / 14 | 100% PASS |
| **Agent 5** (OnDemand Contracts, Loading/Error States, Perf, 816aaae Parity) | 32 / 32 | 32 / 32 | 100% PASS |
| **TOTAL** | **82 / 84 (97.6%)** | **82 / 84 (97.6%)** | **Reproducible Parity** |

Both runs exhibited 100% determinism. Across both rounds:
- **0 app bugs** detected.
- **2 failing checks** in Agent 2 (`logos-authentic-or-marked` on 1440×900 and 390×844), both classified as **spec-stale (cycle-9 feature)** due to Cycle 9 introducing Tier-2 Wikimedia brand logos and native lazy loading.
- Upstream Perplexity web-research plugin backoff was handled gracefully by Agent 4 streaming fallbacks, achieving 14/14 passes on both rounds.

---

## 2. UTC Execution Timelines

### Round 1 (`ROUND=c9a`)
Parallel phase: Agents 1, 2, 3, 5 launched at 04:40:46Z. Solo phase: Agent 4 launched at 04:42:33Z.

| Agent | Scope / Focus | Start (UTC) | End (UTC) | Duration | Exit Code | Pass Rate |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Agent 1** | Branding / Disclaimer / Residue | 2026-10-22T04:40:46Z | 2026-10-22T04:41:54Z | 1m 08s | 0 | 11 / 11 |
| **Agent 2** | Watchlist & Dossiers & Logos | 2026-10-22T04:40:46Z | 2026-10-22T04:42:23Z | 1m 37s | 0 | 12 / 14 |
| **Agent 3** | Sentiment Universe & URLs | 2026-10-22T04:40:46Z | 2026-10-22T04:41:25Z | 0m 39s | 0 | 13 / 13 |
| **Agent 5** | Contracts, States, Perf, Branch | 2026-10-22T04:40:46Z | 2026-10-22T04:42:12Z | 1m 26s | 0 | 32 / 32 |
| **Agent 4** | Chat (5 Qs) & Briefing (Solo) | 2026-10-22T04:42:33Z | 2026-10-22T04:44:54Z | 2m 21s | 0 | 14 / 14 |
| **Round 1 Total** | *All 5 agents* | **2026-10-22T04:40:46Z** | **2026-10-22T04:44:54Z** | **4m 08s** | - | **82 / 84** |

### Round 2 (`ROUND=c9b`)
Parallel phase: Agents 1, 2, 3, 5 launched at 04:46:29Z. Solo phase: Agent 4 launched at 04:48:18Z.

| Agent | Scope / Focus | Start (UTC) | End (UTC) | Duration | Exit Code | Pass Rate |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Agent 1** | Branding / Disclaimer / Residue | 2026-10-22T04:46:29Z | 2026-10-22T04:47:36Z | 1m 07s | 0 | 11 / 11 |
| **Agent 2** | Watchlist & Dossiers & Logos | 2026-10-22T04:46:29Z | 2026-10-22T04:48:09Z | 1m 40s | 0 | 12 / 14 |
| **Agent 3** | Sentiment Universe & URLs | 2026-10-22T04:46:29Z | 2026-10-22T04:47:12Z | 0m 43s | 0 | 13 / 13 |
| **Agent 5** | Contracts, States, Perf, Branch | 2026-10-22T04:46:29Z | 2026-10-22T04:47:54Z | 1m 25s | 0 | 32 / 32 |
| **Agent 4** | Chat (5 Qs) & Briefing (Solo) | 2026-10-22T04:48:18Z | 2026-10-22T04:50:48Z | 2m 30s | 0 | 14 / 14 |
| **Round 2 Total** | *All 5 agents* | **2026-10-22T04:46:29Z** | **2026-10-22T04:50:48Z** | **4m 19s** | - | **82 / 84** |

---

## 3. Analysis & Classification of Failing Checks

Only 2 checks failed in each round (both belonging to Agent 2):

### Failure 1: Agent 2 `logos-authentic-or-marked` (Viewport: 1440×900)
- **Check Name:** `logos-authentic-or-marked`
- **Agent:** `agent2-watchlist`
- **Viewport:** `1440x900`
- **Log Message:**  
  `36 official icons (all loaded, all sourced from official domains in logos.json), 14 marked monograms "(no verified official logo)"; bad=[{"id":"mbzuai","img":{"src":"/logos/mbzuai/list-64.png","ok":true,"title":"Mohamed bin Zayed University of Artificial Intelligence — icon from official domain"},"mono":null},{"id":"dubai-police","img":{"src":"/logos/dubai-police/list-64.png","ok":true,"title":"Dubai Police — icon from official domain"}...]`
- **Exact Failing Assertion (`agent2.mjs` lines 15–16):**
  ```javascript
  const bad = logo.filter((l) => (l.img && (!l.img.ok || LOGOS[l.id]?.status !== "official")) || (!l.img && !(l.mono && /monogram/i.test(l.mono))));
  await H.record("logos-authentic-or-marked", vp, bad.length === 0, ...);
  ```
- **Classification:** **`spec-stale (cycle-9 feature)`**
- **Technical Explanation:**
  1. In Cycle 9 (Lane C), 37 organisations received verified logos, divided into Tier 1 (`status: "official"` sourced from primary domains, 31 orgs) and Tier 2 (`status: "wikimedia"` sourced from Wikimedia Commons public domain / fair use marks, 6 orgs: `mbzuai`, `dubai-police`, `edge`, `mubadala`, `khalifa-university`, `adnoc`).
  2. The legacy `agent2.mjs` script was written under Cycle 8 assumptions when only `"official"` status entries existed, asserting `LOGOS[l.id]?.status !== "official"`. It consequently flags valid Cycle 9 Tier 2 Wikimedia logos as `"bad"`.
  3. Furthermore, `<OrgLogo>` applies browser-native `loading="lazy"`. Because the test does not scroll through all 50 cards before testing `img.complete && img.naturalWidth > 0`, un-scrolled cards below the fold trigger `!l.img.ok`.

### Failure 2: Agent 2 `logos-authentic-or-marked` (Viewport: 390×844)
- **Check Name:** `logos-authentic-or-marked`
- **Agent:** `agent2-watchlist`
- **Viewport:** `390x844`
- **Log Message:**  
  `36 official icons (all loaded, all sourced from official domains in logos.json), 14 marked monograms "(no verified official logo)"; bad=[{"id":"mbzuai","img":{"src":"/logos/mbzuai/list-64.png","ok":true,"title":"Mohamed bin Zayed University of Artificial Intelligence — icon from official domain"},"mono":null},{"id":"m42","img":{"src":"/logos/m42/list-64.png","ok":false,"title":"M42 — icon from official domain"}...]`
- **Exact Failing Assertion (`agent2.mjs` lines 15–16):**
  ```javascript
  const bad = logo.filter((l) => (l.img && (!l.img.ok || LOGOS[l.id]?.status !== "official")) || (!l.img && !(l.mono && /monogram/i.test(l.mono))));
  await H.record("logos-authentic-or-marked", vp, bad.length === 0, ...);
  ```
- **Classification:** **`spec-stale (cycle-9 feature)`**
- **Technical Explanation:**
  Identical root cause to Failure 1. On the 390×844 mobile viewport, the vertical viewport bounds cause additional off-screen cards (e.g. `m42`) to remain in lazy-load state prior to user scroll, triggering `!l.img.ok` in combination with the `"wikimedia"` status mismatch.

---

## 4. Agent-by-Agent Verification Highlights

### Agent 1 (11/11 Passed)
- All 14 routes load with HTTP < 400 on both desktop and mobile viewports (`/overview`, `/watchlist`, `/watchlist/tii`, `/watchlist/compare?ids=g42,edge,tii`, `/sentiment`, `/news`, `/radar`, `/graph`, `/chat`, `/briefing`, `/methodology`, `/settings`, `/artifacts`, `/docs/interactive-ui`).
- Dual mandatory disclaimer phrases ("UAE AI Intelligence — Concept Demonstration" and "not an official government system") confirmed present in header disclaimer bar and body text across all 14 routes.
- Zero previous-tenant brand residue found across rendered DOMs, `<title>`, `<meta>` tags, and 840+ same-origin network responses.

### Agent 2 (12/14 Passed, 2 Spec-Stale)
- 50 organisation cards render with `50 / 50` watchlist counter.
- AIREV reference dossier is pinned as card #1 (`data-pinned="true"`).
- Search ("Falcon") returns expected subset (`tii`, `atrc`, `ai71`). Search empty state verified.
- Government filter isolates 12 government organisations correctly.
- Comparison matrix (`/watchlist/compare?ids=g42,edge,tii`) displays multi-org side-by-side table.
- All 50 individual dossiers open successfully with HTTP 200 and matching titles (tested over 79s). Mobile dossier has zero horizontal overflow.

### Agent 3 (13/13 Passed)
- Sentiment Universe renders 274 bubbles matching dataset records.
- Hover tooltips render full evidence text (>30 chars).
- Click-through pins verified source URLs to evidence drawer (`evidence-source href` confirmed).
- Filters (Optimists: 48, Explicit-UAE: 43, Jobs & skills: 41) verified.
- Timeline 30-day playback dynamically filters bubbles. Pulse metrics panel displays 24h, 7d, 30d breakdowns.
- HTTP status check on 128 unique verified URLs: 75 HTTP 2xx, 39 anti-bot walls (403/429), 8 errors/payment, 6 dead (404/410).

### Agent 4 (14/14 Passed)
- All 5 demo questions executed against the live `/api/chat` backend and OnDemand session:
  - Q1: *"What has TII announced recently?"* (HTTP 200, Verified Facts + Interpretation sections confirmed)
  - Q2: *"Which UAE AI companies are accelerating internationally?"* (HTTP 200, citations present)
  - Q3: *"What is driving negative sentiment about AI employment?"* (HTTP 200, citations present)
  - Q4: *"Compare G42, EDGE and TII's AI research activity."* (HTTP 200, 5-6 citation chips + inline links)
  - Q5: *"Which UAE organizations announced new AI partnerships this month?"* (HTTP 200, grounded citations)
- Upstream Perplexity condition (`plugin-1722260873` credit exhaustion) logged as `web-research coverage=upstream` and `web-research coverage=backoff`. App streaming and citations continued without error.
- Briefing generation (`/api/briefing`) generated 4,500+ character executive intelligence synthesis with 16 source links in ~35 seconds. Scheduled panel confirmed execution `6ad841aab28e35aa11d85744`.

### Agent 5 (32/32 Passed)
- Live OnDemand API contract tests verified: `docs-categories`, `chat-createchatsession`, `chat-submitquery-sync`, `chat-getchatmessages`, `media-fetchmedia`.
- Autonomous Flow Builder workflows verified active (`afb-get-workflow-ingest`, `afb-get-workflow-briefing`, `afb-get-workflow-checkpoint`, execution logs & node outputs).
- App API routes verified: `/api/health` (HTTP 200), `/api/uae/orgs` (50 orgs), `/api/uae/live` (HTTP 200), `/api/chat` streaming proxy, honest 502 error on bad key, empty state on `/api/artifacts`.
- Simulated error & loading states verified: live pipeline loading indicator, live pipeline 502 error banner, chat 503 error banner with retry button, briefing empty state.
- Performance metrics within SLA:
  - `/overview`: LCP 744–992 ms, FCP 268–480 ms, TTI 2325–2649 ms.
  - `/chat`: LCP 768–1048 ms, FCP 372–496 ms, TTI 2510–3894 ms.
  - `/sentiment`: LCP 860–996 ms, FCP 324–620 ms, TTI 2106–2471 ms.
- Legacy rollback parity: Branch `fix/news-summary-rewrite-live-verify-20261020` commit SHA `816aaaed9c3aa8fa37fbad31d3bd3f7491b3de9d` untouched, local tag `bcap-pre-uae-20261020T2130Z` verified, Vercel project deployment state verified untouched since rollback cutoff.

---

## 5. Artifact Manifest

### JSON Test Result Files (`QA_OUT=qa/2026-10-22-cycle9/laneE3`)
| File | Round | Agent | Checks | Passed | Size (bytes) |
| :--- | :---: | :--- | :---: | :---: | :---: |
| `results-agent1-branding-c9a.json` | `c9a` | `agent1-branding` | 11 | 11 | 2,915 |
| `results-agent2-watchlist-c9a.json` | `c9a` | `agent2-watchlist` | 14 | 12 | 4,835 |
| `results-agent3-sentiment-c9a.json` | `c9a` | `agent3-sentiment` | 13 | 13 | 5,200 |
| `results-agent4-chat-c9a.json` | `c9a` | `agent4-chat` | 14 | 14 | 6,197 |
| `results-agent5-contracts-c9a.json` | `c9a` | `agent5-contracts` | 32 | 32 | 10,160 |
| `results-agent1-branding-c9b.json` | `c9b` | `agent1-branding` | 11 | 11 | 2,915 |
| `results-agent2-watchlist-c9b.json` | `c9b` | `agent2-watchlist` | 14 | 12 | 4,835 |
| `results-agent3-sentiment-c9b.json` | `c9b` | `agent3-sentiment` | 13 | 13 | 5,205 |
| `results-agent4-chat-c9b.json` | `c9b` | `agent4-chat` | 14 | 14 | 6,259 |
| `results-agent5-contracts-c9b.json` | `c9b` | `agent5-contracts` | 32 | 32 | 10,160 |

### Execution Logs
- `timeline-c9a.log`: Round 1 start/end timestamps and exit codes.
- `timeline-c9b.log`: Round 2 start/end timestamps and exit codes.
- `agent1-c9a.log`, `agent1-c9b.log`: Agent 1 stdout/stderr logs.
- `agent2-c9a.log`, `agent2-c9b.log`: Agent 2 stdout/stderr logs.
- `agent3-c9a.log`, `agent3-c9b.log`: Agent 3 stdout/stderr logs.
- `agent4-c9a.log`, `agent4-c9b.log`: Agent 4 stdout/stderr logs.
- `agent5-c9a.log`, `agent5-c9b.log`: Agent 5 stdout/stderr logs.

### Screenshots (`shots/`)
- 114 captured screenshots across both rounds stored in `qa/2026-10-22-cycle9/laneE3/shots/` covering desktop (1440×900) and mobile (390×844) viewports.
