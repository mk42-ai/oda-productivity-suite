# RESUME_PROMPT
Resume the "UAE AI National Intelligence Command Centre — Concept Demonstration" mission.
State: `uae-ai-command-centre/mission_state.json` (+ MISSION_STATE.md, CHECKPOINTS.md, NEXT_ACTIONS.md).
Repo `mk42-ai/oda-productivity-suite`; original SHA 816aaaed9c3aa8fa37fbad31d3bd3f7491b3de9d; rollback tag `bcap-pre-uae-20261020T2130Z`; work branch `uae-ai-command-centre` (app in `uae-ai-command-centre/`).
1. If the branch is not on GitHub yet: clone the original at 816aaae, then apply this branch from the downloadable ZIP, or run `scripts/resume-mission.sh push` with a GITHUB_TOKEN (Contents + Pull requests write).
2. `scripts/resume-mission.sh build && BASE_URL=<preview> scripts/resume-mission.sh scan` must stay at 0 hits.
3. `scripts/resume-mission.sh deploy` prints SANDBOX_ID / SANDBOX_PORT / PREVIEW_URL.
4. Re-run the 5 chat acceptance questions (mission/chat_test_results.json) and the ui-validator sweep (QA_REPORT.md) against the new preview.
Rules: preserve first, repair second, extend third; no framework swap; never expose credentials; never invent live data; keep the disclaimer "Concept Demonstration — not an official government system".
