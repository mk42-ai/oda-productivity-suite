# QA_REPORT — 2026-10-20T22:40Z
Target: https://sb-z90e15nd4zdq.vercel.run (Next.js production build, `next start`).
Tool: ui-validator (`ui_validate.py`, headless Chromium) — 1440×900 and 390×844, viewport screenshots in `.ui-proof/` (uploaded with this turn).

| Surface | Assertions (all also: "Concept Demonstration" present, "B Capital"/"Portfolio Intelligence" absent) | 1440 | 390 |
|---|---|---|---|
| /overview | national-pulse panel, sampling disclaimer | ✅ | ✅ |
| /watchlist | org cards, "50 / 50"; government filter click | ✅ | ✅ |
| /watchlist/tii | briefing panel, Timeline | ✅ | ✅ |
| /watchlist/compare?ids=g42,edge,tii | compare table | ✅ | ✅ |
| /sentiment | bubbles, "Not a population survey"; 30d window → playhead | ✅ | ✅ |
| /news | news items | ✅ | ✅ |
| /radar | radar blips, HuggingFace panel, no horizontal overflow (fixed) | ✅ | ✅ |
| /graph | canvas rendered | ✅ | ✅ |
| /chat | welcome, 5 acceptance starters | ✅ | ✅ |
| /briefing | generate button; live POST /api/briefing 200 in 31 s | ✅ | ✅ |
| /methodology, /settings, /docs/interactive-ui | identity check text, ONDEMAND SETTINGS + plugin id | ✅ | ✅ |

Mobile overflow check (`scrollWidth <= innerWidth`) passed on overview, watchlist, dossier, sentiment, news, radar (after fix), graph, briefing.
Fixed during QA: `/api/artifacts` 502 (no store) → honest `not_provisioned` empty list; missing `/brand/icons/*` 404s restored; radar mobile overflow (`min-w-0`).
Chat acceptance: 5/5 HTTP 200, first event 81–107 ms, total 25–80 s, all with "Verified facts" + "Interpretation" sections; 4/5 with markdown source links (G42/EDGE/TII comparison cited bare `<url>` links).
Not run this turn: the preserved Playwright suite (`e2e/`, 45 specs) — @playwright/test browsers are not installed in this container; specs were de-tenanted (selectors/names) but need a follow-up run. The performance recorder (`e2e/perf/record-run.mjs`) is preserved.
Note: the Bright Data live browser was unavailable (CDP endpoint HTTP 502), so no Chrome-MCP walkthrough was possible.
