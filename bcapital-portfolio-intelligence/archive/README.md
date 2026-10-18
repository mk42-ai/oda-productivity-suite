# archive/ — media and masters kept out of the served bundle

Moved here on 2026-10-17 (Reputation & Prestige + cleanup pass). Nothing under `archive/` is served by Next.js or referenced by
`web/src`, `web/e2e`, `web/tests` or `web/scripts` (verified by grep — see docs/NAVIGATION_E2E_FIX.md → removal manifest).

| Path | Was | Size | Why archived, not deleted |
|---|---|---|---|
| `web-public-assets/bundle/` | `web/public/assets/bundle/` | 22 MB | PNG masters + manifest of the artifact icon bundle (the served 256/512 webps stay in `web/public/assets/artifacts`) |
| `web-public-assets/misc/` | `web/public/assets/misc/` | 8.6 MB | design renders (geothermal variations, bar-chart originals) |
| `web-public-assets/*.png` (6) | `web/public/assets/*.png` | 3.6 MB | glyph renders (voice orb, credentials card, PitchBook synced, browser-action card, new-chat empty, composer ask) |
| `web-public-assets/artifacts-ui/` | `web/public/assets/artifacts-ui/` | 2.5 MB | artifact-document / image / video and upload-attach / upload-failed-retry masters + unreferenced webps |
| `web-public-assets/manifest.json` | `web/public/assets/manifest.json` | 40 KB | provenance manifest of the above |

No film renders existed under `web/public/assets/film` in this branch (checked 2026-10-17); the only large media not needed at runtime was the set above.
