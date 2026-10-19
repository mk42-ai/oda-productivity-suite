# Agent 7 — PitchBook store Media backup + availability module

- **started_at**: `2026-10-13T01:33:46Z`
- **completed_at**: `2026-10-13T01:37:12Z`

## Owned Files
- `src/persist/pitchbook-backup.ts` (NEW)
- `src/pitchbook-availability.ts` (NEW)
- `scripts/pitchbook/backup-store.ts` (NEW)
- `scripts/pitchbook/test-availability.ts` (NEW)
- `docs/turn10/agent-7.md`

## Summary of Changes
- **PitchBook Store Backup (`src/persist/pitchbook-backup.ts`)**:
  - Implemented `backupPitchbookStore(profiles, reason)` which outputs `/tmp/pitchbook-store-<ts>.json` containing `{snapped_at, reason, companies, coverage, profiles}`.
  - Uploads the manifest to OnDemand Media via `storeFile("manifest", tmpFile)` (`application/json` format, named `pitchbook-store-<ts>.json`).
  - Returns `{snapshot_ts, media_id, media_url, sha256, bytes, verified, companies}`.
  - Implemented `listPitchbookBackups(limit, page)` which queries `odList()` and filters backups starting with prefix `pitchbook-store-`.
  - Tolerates runtime absence of `src/persist/pitchbook-store.ts` by taking pure profiles map.
- **Availability Module (`src/pitchbook-availability.ts`)**:
  - Defined `PITCHBOOK_AVAILABILITY_FIELDS` spanning all 20 fields (18 schema fields + `investments_count` + `pitchbook_profile_url`).
  - Implemented `isFieldAvailable(fieldObj)`: field is available only when non-null, non-empty string/array/number and has valid `provenance.source`.
  - Implemented `computeAvailability(profile)` returning `Record<field, "available" | "not_available">`.
  - Implemented `coverageOf(profiles)` per-field breakdown (`{populated, not_available}`).
  - Implemented `emptyStateCount(profiles)` measuring total `not_available` cells across profiles.
  - Implemented `fieldsPopulated(profiles)` measuring total `available` cells across profiles.
  - Re-exported `NOT_AVAILABLE_LABEL = "Not available in PitchBook"`.
- **CLI & Test Scripts**:
  - `scripts/pitchbook/backup-store.ts`: Standalone runner reading `data/pitchbook/profiles.json` and triggering `backupPitchbookStore` with `.env` credential support.
  - `scripts/pitchbook/test-availability.ts`: Unit test suite using `node:assert` verifying null fields, empty arrays, missing provenance, populated fields, all 20 fields, coverage calculations, and empty state counts.

## Verification
- Root typecheck: `npx tsc -p tsconfig.json --noEmit` passed cleanly.
- Unit test: `npx tsx scripts/pitchbook/test-availability.ts` ran and passed all assertions.

## Gaps
- None.
