# Turn 10 — monthly PitchBook sync: creation + first run

- Workflow: `6acd90f89a17f57debac8a9f` — B Capital — Monthly PitchBook Portfolio Sync — cron `0 0 6 1 * *` (5-field `0 6 1 * *`, 1st of every month at 06:00 UTC) — active=True — created 2026-10-13T02:01:28Z
- Superseded weekly workflow `6aca3d3faeef8927baa25a05` (B Capital — PitchBook weekly enrichment): deactivated (isActive=false)
- First run execution `6acd90fdaeef8927baa26857`: status success, 2026-10-13T02:01:33Z → 2026-10-13T02:06:07Z (274s); node timings {'load-portfolio': 13315, 'pitchbook-pull': 258582, 'analyzer-0': 22}
- Delivered 136 records → POST /pitchbook/sync/webhook → run `pbsync-20261013-020607-b2c8`: companies_refreshed 136, fields_populated 1887, empty_state_count 833, errors []
- Data yield of this run: 13 fields with values (1 company), 2027 marked not_available — nothing fabricated; prior store values retained.
