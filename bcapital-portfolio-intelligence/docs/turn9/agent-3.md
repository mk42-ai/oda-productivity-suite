# Agent 3 — Defect Fix Pass (A3)

- **started_at**: 2026-10-13T00:06:07Z
- **completed_at**: 2026-10-13T00:10:30Z
- **branch**: t9/a3
- **worktree**: /tmp/wt9/a3

## Files Touched
- `web/src/lib/text-sanitise.ts`
- `web/tests/unit/text-sanitise.test.mjs`
- `web/src/components/company/news-cards.tsx`
- `web/src/components/news/news-feed.tsx`
- `docs/turn9/agent-3.md`

## Summary of Changes
- **Title & Summary Sanitiser**: Implemented `sanitiseTitle` and `sanitiseSummary` in `web/src/lib/text-sanitise.ts` to strip trailing site suffixes (including `| 领英`, `| LinkedIn`, `- X`, `• Reddit`, `| Reuters`, ` - YouTube`, `— TechCrunch`), collapse duplicate whitespace, and strip surrounding quotes. Preserves legitimate internal hyphens and guarantees titles are not stripped to empty.
- **Unit Test Coverage**: Created `web/tests/unit/text-sanitise.test.mjs` with 11 `node:test` test cases testing Chinese suffixes, dash suffixes, bullet suffixes, standard news outlets, quotes, whitespace, and legitimate hyphen preservation.
- **In-Card News Footer**: Moved company link, sentiment score chip, delta chip (hidden when null), and source badge into `<footer className="nc-footer">` inside `NewsCard` in `web/src/components/company/news-cards.tsx`.
- **Source Plugin Label & Tooltip**: Changed bare "legacy" label in `SOURCE_PLUGINS` and badge display to "Earlier workflow sources" with descriptive tooltip `Rows ingested by the earlier multi-plugin workflows (LinkedIn, Reddit, X)`.
- **Floating Line Removal**: Removed the floating external `<p className="mt-1 ...">` metadata line from `web/src/components/news/news-feed.tsx` and threaded props into `NewsCard`.
- **Type Scale Alignment**: Applied 14px/1.35 semibold for headlines (`text-sm font-semibold leading-[1.35]`), 12.5px/1.45 muted for summaries (`text-[12.5px] leading-[1.45] text-muted`), and 11.5px for card footer (`text-[11.5px]`).

## How Verified
- Unit tests: `cd web && node --test tests/unit/text-sanitise.test.mjs` (11 passing tests, 0 failures).
- TypeScript check: `cd web && npx tsc --noEmit -p tsconfig.json` (0 errors).

## What Could Not Be Done + Why
- None. All requirements delivered and verified.

## Recommendations
- Ensure browser QA tests verify font sizes and tooltip presence on the "Earlier workflow sources" badge across both mobile and desktop viewports.
