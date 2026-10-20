# RESUME_PROMPT

## One command (idempotent)
```bash
cd oda-productivity-suite/uae-ai-command-centre && npm run resume            # add `-- --deploy` to recreate the preview if it is down
```
`scripts/uae/resume.mjs` reads the latest checkpoint. It uses local `MISSION_STATE.json` if present; otherwise it uses the newest successful execution of the OnDemand checkpoint workflow `6ad7f32e5e60695bc4d052d7`. It then:
1. GETs the 3 workflows and re-creates/activates any that are missing or inactive (`workflows.mjs ensure`: PATCH by id, else POST, then /activate).
2. Re-syncs the checkpoint snapshot into the checkpoint workflow.
3. Health-checks the preview and, with `--deploy`, creates a new sandbox (prints SANDBOX_ID / SANDBOX_PORT / PREVIEW_URL).
4. Reports git branch/HEAD vs origin and whether the rollback tag is on GitHub.

Every step is check-then-act, so running it twice changes nothing the second time.

Needs: `ONDEMAND_API_KEY` (or `ON_DEMAND_API_KEY`). For `--deploy` it also needs `VERCEL_TOKEN`, `VERCEL_TEAM_ID` and `VERCEL_PROJECT_ID`. Other commands: `npm run workflows -- status | run <ingest|briefing|checkpoint> --wait | logs <executionId>`.

## One prompt (paste into a new agent session)
> Resume the "UAE AI National Intelligence Command Centre — Concept Demonstration" mission in repo mk42-ai/oda-productivity-suite, branch `uae-ai-command-centre` (app in `uae-ai-command-centre/`). Load the `github` skill and check out that branch. Run `npm ci && npm run resume -- --deploy` in the app directory. Read MISSION_STATE.json, NEXT_ACTIONS.md, API_HEALTH.md and QA_REPORT.md. Then execute NEXT_ACTIONS in order: verify the scheduled workflow fires with `npm run workflows -- status`, re-run the 5-agent QA against the new preview, and fix regressions in place. Rules: the original B Capital build at 816aaae (tag `bcap-pre-uae-20261020T2130Z`, branch `fix/news-summary-rewrite-live-verify-20261020`, Vercel project `bcapital-portfolio-intelligence-8zsb`) must stay unchanged. Never synthesize opinions or URLs. Keep "UAE AI Intelligence — Concept Demonstration · Not an official government system" on every route. Never print credentials. Do not regenerate the app.

## What is and is not verified (2026-10-20T23:50Z)
- ✅ The 3 workflows exist and `GET /workflow/{id}` returns `isActive: true` with the intended cron.
- ✅ Each workflow was executed through the API and finished `success`; logs and node outputs were read.
- ✅ The checkpoint workflow **fired by itself on schedule** at 2026-10-20T23:30:00.803Z (execution `6ad7f978b28e35aa11d85525`, success).
- ⏳ The ingest workflow (first fire 2026-10-21T00:00Z) and the briefing workflow (02:30Z) have **not yet fired on schedule** while I was watching. Only their manual runs are verified.
- ⚠️ The checkpoint workflow stores the snapshot that was last synced into its node (by `resume`/`ensure`). OnDemand cannot read this repo, so a scheduled fire re-persists the latest synced state. It does not capture edits made since the last sync.
- ⚠️ Ingest output is persisted in OnDemand's execution store and surfaced by `/api/uae/live`. It is not written back into the committed seed JSON.
- ✅ Branch pushed (commits 6f39f7d, 30cce79+) and PR #7 open: https://github.com/mk42-ai/oda-productivity-suite/pull/7. ⚠️ The rollback tag is local only.
- ✅ `resume.mjs` was run twice (second run: "all 3 active — no change").
