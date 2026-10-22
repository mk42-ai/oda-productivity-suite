# Lane A — shareable link / env vars — preconditions check 2026-10-22T01:36:37Z
| Precondition | Result |
|---|---|
| Vercel token in executor env | present (REST: project read, env list, deployments list all 200) |
| Authenticated `vercel` CLI session | **no** — the `vercel` binary is a policy shim ("BLOCKED by platform policy") |
| `ONDEMAND_API_KEY` in executor env | **absent** (only the platform's own `ON_DEMAND_API_KEY`, a container credential that must not be copied onto the user's project) |
| `ONDEMAND_BASE_URL` in executor env | **absent** (same note) |
| Project `oda-productivity-suite` env vars | 0 at 01:26:54Z, 01:36:37Z, 01:53Z (`{"envs":[],"hiddenProductionEnvCount":0}`) |
| Sensitive values readable from `ondemand-hq` via API | no (`decrypted:false`, cycle 7) |
Decision: do NOT guess values; manual dashboard step documented in NEXT_ACTIONS.md #1 (2026-10-22T02:07Z). Alias probes with the bypass header: GET /health 200 (`ondemand_key:false`, commit 961d04c), POST /api/chat 200 → `no_key` (see ../vercel/alias-*.{json,sse}).
