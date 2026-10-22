# Lane A — COLOUR PASS results (cycle 6, 2026-10-21)

Scope: `app/src` only (no e2e/tests/qa/md/src-data edits; nothing committed). Audit = 6/3-digit hex scan, grey = max−min channel ≤ 2, allow-list {2563EB, B91C1C, 991B1B}.

## OFF-RAMP TOTAL
| | before | after |
|---|---|---|
| OFF-RAMP TOTAL | **815** | **4** |

Raw audits: `offramp-before.txt`, `offramp-after.txt` (same dir).

## Per-file before → after
| file | before | after |
|---|---|---|
| src/components/chat/open-intelligent-ui/shell.css | 318 | 0 |
| src/components/artifacts/artifacts.css | 121 | 0 |
| src/components/chat/voice/voice.css | 54 | 0 |
| src/components/media/media.css | 49 | 0 |
| src/styles/tokens.css | 34 | 4 |
| src/styles/chips.css | 28 | 0 |
| src/lib/sector-color.ts | 21 | 0 |
| src/components/chat/run-status-header.css | 18 | 0 |
| src/components/chat/company-picker.tsx | 18 | 0 |
| src/components/chat/open-intelligent-ui/response-theme.ts | 15 | 0 |
| src/components/uae/live-pipeline.tsx | 11 | 0 |
| src/components/uae/eco-graph.tsx | 10 | 0 |
| src/components/chat/voice/voice-dock.tsx | 10 | 0 |
| src/components/chat/open-intelligent-ui/attachments.css | 9 | 0 |
| src/components/uae/briefing-client.tsx | 8 | 0 |
| src/components/chat/open-intelligent-ui/response-theme.css | 7 | 0 |
| src/lib/data-source.ts | 7 | 0 |
| src/lib/uae/data.ts | 6 | 0 |
| src/lib/sentiment-tone.ts | 6 | 0 |
| src/lib/color.ts | 6 | 0 |
| src/components/od-chat/chat-component.tsx | 5 | 0 |
| src/components/charts/heatmap-ssr.tsx | 5 | 0 |
| src/components/chat/company-picker.css | 5 | 0 |
| src/lib/hue-audit.ts | 4 | 0 |
| src/components/ui/plugin-favicon.tsx | 4 | 0 |
| src/app/docs/interactive-ui/page.tsx | 3 | 0 |
| src/components/shell/copy-link-button.tsx | 3 | 0 |
| src/lib/plugin-icons.ts | 3 | 0 |
| src/components/shell/popstate-guard.tsx | 2 | 0 |
| src/components/chat/open-intelligent-ui/chat-shell.tsx | 2 | 0 |
| src/app/radar/page.tsx | 2 | 0 |
| src/components/shell/route-progress.tsx | 2 | 0 |
| src/components/ui/badge.tsx | 2 | 0 |
| src/app/methodology/page.tsx | 2 | 0 |
| src/components/charts/sentiment-line.tsx | 2 | 0 |
| src/lib/brand-icons.ts | 2 | 0 |
| src/components/charts/sparkline.tsx | 1 | 0 |
| src/components/chat/inspector-tabs.tsx | 1 | 0 |
| src/components/chat/run-rail.tsx | 1 | 0 |
| src/components/od-chat/status-log-block.tsx | 1 | 0 |
| src/lib/format.ts | 1 | 0 |
| src/components/chat/plugin-panel.tsx | 1 | 0 |
| src/app/watchlist/[id]/page.tsx | 1 | 0 |
| src/components/uae/bits.tsx | 1 | 0 |
| src/components/chat/open-intelligent-ui/thread-nav-store.ts | 1 | 0 |
| src/components/od-chat/shimmer-text.tsx | 1 | 0 |
| src/components/ui/chevron.tsx | 1 | 0 |

## Justified remainder (4, all in `src/styles/tokens.css`, `html.dark` block only)
| line | token | hex | why kept |
|---|---|---|---|
| 204 | `--link` (dark) | #60A5FA | Dark-theme equivalent of the single allowed accent #2563EB (link/focus ring only). #2563EB fails AA on #212121 (3.0:1); #60A5FA is 6.9:1. Dark theme is feature-flagged off (theme-toggle forces light). |
| 205 | `--ring` (dark) | #60A5FA | Same — focus ring on dark surfaces. |
| 227 | `--danger` (dark) | #E06C6C | Dark-theme danger red for genuine error states (#B91C1C is 2.9:1 on #212121 — fails AA). |
| 228 | `--danger-soft` (dark) | #F19A9A | Dark-theme danger-soft text pair. |

Light theme (the only shipped theme) is now 100 % grayscale + #2563EB (link/focus) + #B91C1C/#991B1B (errors).

## Sentiment grayscale ramp (`CLASS_COLOR` in `src/lib/uae/data.ts`; mirrored in `live-pipeline.tsx` — kept local by design so the client bundle does not import the seed JSON)
| class | hex |
|---|---|
| Optimists | #0D0D0D |
| Pragmatists | #2F2F2F |
| Safety Advocates | #5D5D5D |
| Neutral/Informational | #737373 |
| Skeptics | #A3A3A3 |
| Disruption Concerned | #B4B4B4 |
| Pessimists/Doomers | #D4D4D4 |
| Unclassified | #ECECEC |

`sentiment-universe.tsx`: bubble `fillOpacity = 0.25 + 0.6 × class_confidence` when visible (0.06 when filtered out); light shades (max channel ≥ 0xC8) get a #737373 stroke (bubbles, legend dots, tooltip/selection dots via `dotStroke`); caption now reads "size = volume · shade = sentiment class (dark = optimistic → light = pessimistic) · opacity = classifier confidence · position = semantic similarity". `ClassDot` (bits.tsx) and live-pipeline dots carry a #737373 border; distribution bars in /overview and /sentiment got a #E5E5E5 border + #F9F9F9 track so the light segments stay visible. All data-testids unchanged.

## Other mappings applied
- Greens 147B58/047857/0F6447/… → #0D0D0D (fills/ink), E7F2EC/ECFDF5 → #F0F0F0/#F9F9F9, B9D9C9/A7F3D0 → #E5E5E5/#D4D4D4.
- Cool greys (E5E7EB→E5E5E5, 1F2937→2F2F2F, 6B7280→737373, 16181B/111827→0D0D0D, 5C6168/4B5563/475569→5D5D5D, 9CA3AF/94A3B8/9EA2A8→A3A3A3, F3F4F6/F1F2F4/E4E6E9→F0F0F0/E5E5E5, F9FAFB→F9F9F9, D1D5DB/C9CCD1→D4D4D4, 202327/3B3F45/374151→2F2F2F).
- Amber/gold (B45309/B8860B/8A6D1A/946200/CA8A04 → #5D5D5D text; FBF8EE/FFFBEB/FFF8E7 → #F9F9F9; E6E0C8/FCD34D/FDE68A → #D4D4D4; F59E0B → #737373). Briefing coverage banner, oiu-coverage, run-rail "unavailable" reason, art-badge processing, plugin-favicon AMBER fallback → grey.
- Reds: genuine error states EF4444/DC2626/C2410C/C1322C/E02E2A/7F1D1D/B42318 → #B91C1C; soft error surfaces FEF2F2/FFF5F5/FFF1F2/FFF7F5 → #F9F9F9, FECACA → #E5E5E5, FCA5A5 → #D4D4D4, FEE2E2 → #ECECEC (B91C1C on F9F9F9 = 6.3:1 AA). Non-error muted reds A06A6A/C4A6A6/9F1239 → greys; the interactive-ui "Honest failure" card and live-pipeline run-failure text are genuine error states → #B91C1C.
- Focus rings: every `outline: 2px solid #147B58/#047857` on `:focus-visible`, `--iui-focus`, `focus-visible:ring-[…]` → #2563EB. Links untouched (#2563EB).
- Charts: `--chart-1..6` → #0D0D0D #5D5D5D #737373 #A3A3A3 #D4D4D4 #ECECEC; `--sent-*`/`--sentiment-*` → #0D0D0D/#2F2F2F/#737373/#A3A3A3; sentiment-line/sparkline accent 6B7280 → #737373; heatmap ramp stops → ramp greys.
- Sectors: `SECTOR_PALETTE` (sector-color.ts) + `--sector-*` tokens.css triples → neutral fill/ink/soft (graphite 737373/2F2F2F/F0F0F0, plum A3A3A3/5D5D5D/F0F0F0, amber B4B4B4/5D5D5D/F9F9F9, coral D4D4D4/5D5D5D/F0F0F0, teal 8E8E8E/2F2F2F/F0F0F0, olive unchanged, rose 737373/5D5D5D/F9F9F9, slate A3A3A3/5D5D5D/F0F0F0); names/structure/hash fallback kept so hue-audit/sector contracts are intact. company-picker.tsx local palette + company-picker.css chip defaults → greys. chips.css per-sector pastel pills → neutral.
- Radar rings adopt/trial/assess/hold → #0D0D0D/#5D5D5D/#A3A3A3/#D4D4D4 (RINK unchanged: white on adopt/trial = 18.9:1/7.0:1). eco-graph TYPE_COL/REL_COL → greys. route-progress bar → #0D0D0D. od-chat 3bb795 → #0D0D0D; shimmer highlight → #5D5D5D. data-source.ts live/partial chips → grey. plugin-icons monogram → #F0F0F0/#2F2F2F. voice-dock gradient pairs + voice.css CTA gradient → greys. rgba(10,201,133)/rgba(4,120,87)/rgba(17,24,39) glows → rgba(13,13,13).
- AA: no `color: #A3A3A3`/`text-[#A3A3A3]` remains on light surfaces (A3A3A3 reserved for fills/borders); mp-video-placeholder text on #2F2F2F raised to #D4D4D4.
- Comment-only hits (`React #418`, `&#123;` entity, brand-icon notes) reworded so the audit is clean without behavioural change.

## Files changed (`git -C .. diff --stat -- app/src`)
```
 app/src/app/docs/interactive-ui/page.tsx           |   6 +-
 app/src/app/methodology/page.tsx                   |   2 +-
 app/src/app/overview/page.tsx                      |   2 +-
 app/src/app/radar/page.tsx                         |   4 +-
 app/src/app/sentiment/page.tsx                     |   2 +-
 app/src/app/watchlist/[id]/page.tsx                |   2 +-
 app/src/components/artifacts/artifacts.css         | 176 ++++----
 app/src/components/charts/heatmap-ssr.tsx          |   4 +-
 app/src/components/charts/sentiment-line.tsx       |   2 +-
 app/src/components/charts/sparkline.tsx            |   2 +-
 app/src/components/chat/company-picker.css         |  10 +-
 app/src/components/chat/company-picker.tsx         |  20 +-
 app/src/components/chat/inspector-tabs.tsx         |   2 +-
 .../chat/open-intelligent-ui/attachments.css       |  12 +-
 .../chat/open-intelligent-ui/chat-shell.tsx        |   4 +-
 .../chat/open-intelligent-ui/response-theme.css    |  16 +-
 .../chat/open-intelligent-ui/response-theme.ts     |  30 +-
 .../components/chat/open-intelligent-ui/shell.css  | 484 ++++++++++-----------
 .../chat/open-intelligent-ui/thread-nav-store.ts   |   2 +-
 app/src/components/chat/plugin-panel.tsx           |   2 +-
 app/src/components/chat/run-rail.tsx               |   2 +-
 app/src/components/chat/run-status-header.css      |  32 +-
 app/src/components/chat/voice/voice-dock.tsx       |   2 +-
 app/src/components/chat/voice/voice.css            |  72 +--
 app/src/components/media/media.css                 |  68 +--
 app/src/components/od-chat/chat-component.tsx      |   8 +-
 app/src/components/od-chat/shimmer-text.tsx        |   2 +-
 app/src/components/od-chat/status-log-block.tsx    |   2 +-
 app/src/components/shell/copy-link-button.tsx      |   2 +-
 app/src/components/shell/popstate-guard.tsx        |   4 +-
 app/src/components/shell/route-progress.tsx        |   4 +-
 app/src/components/uae/bits.tsx                    |   4 +-
 app/src/components/uae/briefing-client.tsx         |   4 +-
 app/src/components/uae/eco-graph.tsx               |   8 +-
 app/src/components/uae/live-pipeline.tsx           |  24 +-
 app/src/components/uae/sentiment-universe.tsx      |  27 +-
 app/src/components/ui/badge.tsx                    |   2 +-
 app/src/components/ui/chevron.tsx                  |   2 +-
 app/src/components/ui/plugin-favicon.tsx           |   8 +-
 app/src/lib/brand-icons.ts                         |   2 +-
 app/src/lib/color.ts                               |   4 +-
 app/src/lib/data-source.ts                         |   6 +-
 app/src/lib/format.ts                              |   2 +-
 app/src/lib/hue-audit.ts                           |   4 +-
 app/src/lib/plugin-icons.ts                        |   6 +-
 app/src/lib/sector-color.ts                        |  16 +-
 app/src/lib/sentiment-tone.ts                      |  12 +-
 app/src/lib/uae/data.ts                            |  18 +-
 app/src/styles/chips.css                           |  56 +--
 app/src/styles/tokens.css                          |  36 +-
 50 files changed, 617 insertions(+), 606 deletions(-)
```

## Checks (UTC)
```
TSC 2026-10-21T21:49:34Z
tsc exit=0
BUILD_START 2026-10-21T21:49:37Z
build exit=0
BUILD_END 2026-10-21T21:50:25Z
```
- `npx tsc --noEmit` → exit 0 (0 errors), run after every batch.
- `NEXT_TELEMETRY_DISABLED=1 npx next build` → exit 0. Prints the pre-existing warning: `Module not found: Can't resolve 'ai' in …/node_modules/@openuidev/react-headless/dist` (vendored dependency, unrelated to this pass).
- `tests/unit/`: no colour/hue/sector unit test exists (only `plugin-availability*.test.ts`); both run green via `node --experimental-strip-types`.
