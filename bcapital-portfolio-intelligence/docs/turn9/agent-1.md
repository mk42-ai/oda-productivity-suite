# Agent 1 (A1) — Neutral Chip Tokens

- started_at: 2026-10-13T00:05:36Z
- completed_at: 2026-10-13T00:09:55Z
- branch: t9/a1

## Files touched
- `web/src/styles/chips.css`
- `web/src/components/companies/companies-gallery.css`
- `web/src/components/companies/companies-gallery.tsx`
- `web/src/components/social/social.css`
- `web/src/components/social/social-feed.tsx`

## Summary
- Defined unified neutral chip tokens in `chips.css` (`--chip-bg`, `--chip-ink`, `--chip-border`, `--chip-count`, `--chip-active-bg`, `--chip-active-ink`, `--chip-hover-bg`, `--chip-radius`, `--chip-height`) and a base `.chip` class with `aria-pressed="true"` active state, `:hover`, `:focus-visible` (2px #0AC985 ring), and `.chip__count` / `span` styling.
- Standardised `.cg-chip` in `companies-gallery.css` to use the neutral chip token set, removing gradient backgrounds, sector border/fill mix, and colored box shadows.
- Updated sector filter buttons in `companies-gallery.tsx` to include class `chip`, removed inline `--cg-from`/`--cg-to` styles, while strictly preserving counts and timeline/card implementations.
- Standardised `.bs-tabs button` and `.bs-shell .bs-tabs button` in `social.css` to neutral token variables, removing brand green overrides on chips.
- Removed inline `--bs-from`/`--bs-to` styles from sector filter buttons in `social-feed.tsx`, removed TikTok from provider chips, and retained all testids (`bs-provider-tab`, `bs-sector-tab`) and `aria-pressed`.
- Inspected `web/src/components/news/news-feed.tsx` and verified it uses native Select elements without sector hues or pastel chip styles, leaving it unchanged per spec.

## How verified
- Grep verified that no `--cg-from` / `--bs-from` references remain in chip rules for `companies-gallery.css` or `social.css`.
- TypeScript verification passed with zero errors (`cd web && timeout 600 npx tsc --noEmit -p tsconfig.json`).
- Git diff inspection confirmed changes are isolated strictly to owned rules and elements.

## What could not be done + why
- None; all owned files and chip specifications were addressed within the scope and action constraints.

## Recommendations
- Consider refactoring `.cg-chip` and `.bs-tabs button` into reusable shared `<Chip>` component in future turn if permitted.
