# Cycle 6 — 84-check suite (HTTPS preview) + payload gate A–G (local HTTP build)

Lane: 84-CHECK + LOCAL PAYLOAD · read-only (no git writes, no source/spec/markdown edits) · evidence only under `qa/2026-10-21-cycle6/suite84/` and `qa/2026-10-21-cycle6/payload-local/`.

## Target
- Preview under test: **https://sb-1p1cmfeo08vc.vercel.run** (deployed from HEAD **1c2953c**).
- Working tree at run time: `git rev-parse HEAD` = **7c860b7** (one docs/colour-residue commit on top of 1c2953c, committed 2026-10-21T21:59:23Z while agent4 was running; 6 files / 12 lines — `brand-icons.ts`, `plugin-icons.ts`, `plugin-favicon.tsx`, `chat-shell.tsx`, `shell.css`, `artifacts/page.tsx`). The agents hit the remote preview, so 7c860b7 does not affect Part 1.
- Harness: `scripts/uae/qa/agent1..5.mjs` + `lib.mjs` (playwright-core + system Chromium, 1440×900 + 390×844 + server checks). Command per agent:
  `BASE_URL=https://sb-1p1cmfeo08vc.vercel.run SHOT_DIR=qa/2026-10-21-cycle6/suite84/shots ROUND=c6 QA_OUT=qa/2026-10-21-cycle6/suite84 timeout 900 node scripts/uae/qa/agentN.mjs | tee qa/2026-10-21-cycle6/suite84/agentN.log`
- Agent 5 secrets (ON_DEMAND_API_KEY, GITHUB_TOKEN, VERCEL_TOKEN, VERCEL_TEAM_ID) were present in the shell environment; nothing was printed.

## Part 1 — 84-check suite, round `c6` (sequential, UTC)

| Agent | Scope | Window (UTC) | Pass / total |
|---|---|---|---|
| agent1-branding | routes, disclaimer, residue (DOM / title+meta / network / metadata endpoints) | 21:56:45 → 21:57:26 | **11/11** |
| agent2-watchlist | 50 cards, logos authentic-or-marked, search, empty state, type filter, compare, 50 dossiers, mobile dossier | 21:57:34 → 21:58:36 | **14/14** |
| agent3-sentiment | 196 bubbles, hover tooltip, click-through link, filters, time playback, pulse 24h/7d/30d, source-URL HTTP status | 21:58:44 → 21:59:18 | **13/13** |
| agent4-chat | 5 demo questions × 2 viewports, briefing-generate × 2, scheduled-panel × 2 | 21:59:24 → 22:02:28 | **13/14** |
| agent5-contracts | 15 OnDemand/app contracts, loading/error/empty states × 2, perf × 3 × 2, original 816aaae unchanged × 3 | 22:02:37 → 22:03:53 | **32/32** |
| **Overall** | | 21:56:45 → 22:03:53 | **83/84** |

Results JSON: `results-agent{1-branding,2-watchlist,3-sentiment,4-chat,5-contracts}-c6.json`; logs `agent1..5.log`; screenshots `shots/*.jpg`.

### The one failing check (round c6)

`agent4-chat · q3 · 1440x900 · ts 2026-10-21T21:59:52.379Z · shot shots/agent4-chat-c6-q3-1440x900.jpg` — detail string verbatim:

> "What is driving negative sentiment about AI employment?" → HTTP 200, 23444 ms, 418 chars, Verified=true Interpretation=true, 0 inline links + 0 citation chips; sources:

Assertion in `agent4.mjs:21`: `pass = !err && md.length > 200 && verified && interp && links.length + chips > 0`. Everything held except `links + chips > 0`: the answer streamed, was ≥200 chars, carried the Verified / Interpretation split, and showed **no** chat-error (the coverage-notice handling works — no "Response failed" card) — but that particular turn rendered zero inline source links and zero citation chips.

- The same question at 390×844 forty seconds later passed: `613 chars, 2 inline links + 2 citation chips; sources: www.tii.ae, mbzuai.ac.ae`.
- **Diagnostic re-run of agent4 only** (`ROUND=c6rerun`, 22:04:53 → 22:07:05Z, `results-agent4-chat-c6rerun.json`, `agent4-rerun.log`): **14/14** — q3@1440×900: `823 chars, 2 inline links + 2 citation chips; sources: gulfbusiness.com, www.g42.ai`. (Kept as a separate round; the official c6 JSON is untouched.)
- **Classification: upstream / non-deterministic** — the Perplexity plugin is out of credits (coverage notice path), so grounding comes from the curated uae_cc_v1 payload via the LLM; on this one turn the model emitted a shorter answer (418 chars) with no citation markup, so the UI had nothing to render as chips. Not a rendering regression (chips render on the other 9 chat turns and on the rerun), not an environment issue (HTTP 200, 23 s, no error card). **App-hardening candidate (not a cycle-6 bug):** if the product rule is "every grounded answer carries ≥1 curated citation", the server could append a fallback curated source when the model returns none; otherwise the agent4 assertion is stricter than the current contract under credit outage.

### Baseline comparison (previous cycle, 3a07efb, reported 83/84)

- No `results-agent*-c5*.json` (or any other 83/84 results set) exists under `qa/` or `/tmp`; `qa/2026-10-21-cycle5/` holds lane evidence only (gate-pre payload PNGs/JSONL, laneA–F md/json) and no 84-check JSON. `qa/2026-10-21-cycle6/sweep-baseline-3a07efb.json` is the contrast/h-scroll/residue sweep, not the 84-check suite. None of CHECKPOINTS/MISSION_STATE/QA_REPORT/NEXT_ACTIONS mention an 83/84 round. Latest on-disk 84-check sets: cycle4 laneD `c4` **84/84** (local lane build, 14:11–14:15Z) and `qa/screenshots/20261021-v2` **84/84**; cycle3 `c3` 74/84 (10 agent4 chat fails = "CHAT-ERROR shown", pre coverage-notice).
- So the identity of the 3a07efb failing check cannot be confirmed from artefacts. Given the pattern above (agent4 chat checks are the only non-deterministic ones in the suite while Perplexity credits are exhausted), the most likely 83/84 miss was also a single agent4 chat turn with zero citations; in c6 that same class of miss appears once (q3@1440) and clears on re-run. All 70 deterministic checks (agents 1/2/3/5) pass on both builds.

### Notes requested
- **Coverage notice / Perplexity credits:** agent4 passes its `chat-error` condition on all 10 chat turns (no "Response failed" card); briefing-generate 200 (51.6 s / 45.6 s, 12 / 16 source links) and the scheduled panel (execution 6ad841aab28e35aa11d85744, cron 0 30 2 * * *) pass. agent5 `contract:app-chat-proxy-stream` 200 SSE, run finished=true; `contract:app-briefing-bad-key-error` honest 502 (`stage=createchatsession upstream=401 "Invalid API Key"`).
- **Sentiment greys vs agent3:** agent3 does **not** assert distinct per-class hues — it checks bubble count (196), tooltip text, evidence-source href, filter counts (37/43/35), time-playback, pulse 24h/7d/30d + sampling notice, and source-URL HTTP status. 13/13 on the grayscale ramp; **no spec expectation needs updating** in agent3. (Source-URL status, for the record: 126 unique verified URLs → 2xx 76, 403/429 bot-wall 37, 404/410 6, 400 1, 401 2, 402 1, 419 3 — informational, still PASS by the agent's rule.)
- agent5 `original-vercel-project-unchanged`: `newest deployment undefined null undefined (sha undefined) — no deployment created since the 21:30Z …` — PASS (no new deployment), but the deployment-list fields came back undefined; worth a glance if that check is relied upon.

## Part 2 — payload gate A–G on a LOCAL HTTP build (`next start`, port 5190)

- `.next/BUILD_ID` already present (`7KJPgYN0SqlWOFFbyBWRy`, written 2026-10-21T21:50:14Z) → **no rebuild**. Caveat: that build predates the 7c860b7 source edits (21:59Z) and so corresponds to the 1c2953c tree — i.e. the same code as the preview, which is what this lane was asked to gate.
- Server: `PORT=5190 bash -lc 'set -a; . ./.env; . ./.env.local; set +a; nohup npm run start > /tmp/local-5190.log 2>&1 &'` → `✓ Ready in 729ms`, `GET /health` **200** at 22:07:52Z.
- Command (both viewports): `PW_VIEWPORT=<vp> PAYLOAD_OUT=qa/2026-10-21-cycle6/payload-local BASE_URL=http://127.0.0.1:5190 npx playwright test e2e/chat-intelligent-ui-payloads.spec.ts --project=desktop --workers=1 --timeout=150000 --reporter=list`

| Check | 1440×900 (22:08:03 → 22:09:37Z) | 390×844 (22:09:47 → 22:11:10Z) |
|---|---|---|
| A — deliverables: artifact card + Outputs surfaced after the run | ✓ 3.5 s | ✓ 3.2 s |
| B — pipeline & waiting: plan-stepper, live run header + timer, working rows, step summary | ✓ 8.2 s | ✓ 8.2 s |
| C — citations: publisher chips, Sources list, safe outbound anchors | ✓ 2.6 s | ✓ 2.3 s |
| D — root-first: run skeleton paints before first delta; no broken images; no overflow | ✓ 4.2 s | ✓ 4.3 s |
| E — between-step summaries keep thinking/working mounted; scroll anchoring | ✓ 16.5 s | ✓ 16.1 s |
| F — settings & plugin caps: pinned plugin locked, directory cap, request mirrors inspector (REAL backend) | ✓ 15.0 s | ✓ 14.2 s |
| G — forced /api/chat 500 → discreet notice; Retry → 200 (REAL backend); cross-app sweep | ✓ 41.9 s | ✓ 33.1 s |
| **Total** | **7/7** (1.5 m) | **7/7** (1.4 m) |

**Payload gate: 14/14.** Evidence: `payload-local/run-1440.log`, `run-390.log`, `payload-{A..G}-{1440x900,390x844}.png`, `pass2-results.jsonl`.

## Cleanup
- Local server killed at ≈22:12Z (`next start -H 0.0.0.0 -p 5190` sh wrapper 19550, `next-server` 19551, npm parent 19536) → `curl http://127.0.0.1:5190/health` = 000 (connection refused); `pgrep -af "next-server|next start"` empty.
- No `scripts/uae/qa/agent*.mjs` or `chat-intelligent-ui-payloads` processes of this lane remain. Chromium instances still visible on the pod belong to the **other** lane's `qa/2026-10-21-cycle6/playwright/run-all.sh` (pid 9075, running `nav-stress.spec.ts`/`run-panel-mobile…` under `/tmp/pw-full-*`), not to this lane — left untouched.
- `git status`: no tracked-file modifications from this lane (only pre-existing untracked `proof/*` from another lane).
