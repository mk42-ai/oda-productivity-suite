# Lane E5 QA Route Reload, Console Errors, and Viewport Verification Report

- **Target Base**: `https://sb-6u0rv43z1luy.vercel.run`
- **UTC Start**: 2026-10-22T04:52:04.336Z
- **UTC End**: 2026-10-22T04:55:32.378Z
- **Total Rows Tested**: 44 (22 routes × 2 viewports)

## 1. Executive Summary

- **HTTP 200 Responses**: 42 / 44
- **HTTP 404 Expected Responses**: 2 / 44 (route `/this-route-does-not-exist`)
- **Redirects Verified**: 2 / 2 (route `/chat-od` → `/chat`)
- **Total Filtered Console Errors**: 4

## 2. Route Verification Table

| Route | VP | Status | Reload Status | Same H1 | Console Errors | Breadcrumb | Active Rail |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/overview` | 1440 | 200 | 200 | yes | 0 | no | `nav-overview` |
| `/watchlist` | 1440 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/watchlist/airev` | 1440 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/watchlist/g42` | 1440 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/watchlist/tii` | 1440 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/watchlist/whiteshield` | 1440 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/watchlist/dubai-police` | 1440 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/watchlist/compare?ids=g42,edge,tii` | 1440 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/news` | 1440 | 200 | 200 | yes | 0 | yes | `nav-news` |
| `/news?org=airev` | 1440 | 200 | 200 | yes | 0 | yes | `nav-news` |
| `/radar` | 1440 | 200 | 200 | yes | 0 | yes | `nav-radar` |
| `/graph` | 1440 | 200 | 200 | yes | 0 | yes | `nav-graph` |
| `/sentiment` | 1440 | 200 | 200 | yes | 0 | yes | `nav-sentiment` |
| `/chat` | 1440 | 200 | 200 | yes | 0 | no | `nav-chat` |
| `/chat-od` | 1440 | 200 | 200 | yes | 0 | no | `nav-chat` |
| `/briefing` | 1440 | 200 | 200 | yes | 0 | yes | `nav-briefing` |
| `/methodology` | 1440 | 200 | 200 | yes | 0 | yes | `nav-methodology` |
| `/artifacts` | 1440 | 200 | 200 | yes | 0 | yes | `nav-artifacts` |
| `/plugins` | 1440 | 200 | 200 | yes | 0 | yes | `none` |
| `/settings` | 1440 | 200 | 200 | yes | 0 | yes | `nav-settings` |
| `/docs/interactive-ui` | 1440 | 200 | 200 | yes | 0 | yes | `none` |
| `/this-route-does-not-exist` | 1440 | 404 | 404 | yes | 2 | yes | `none` |
| `/overview` | 390 | 200 | 200 | yes | 0 | no | `nav-overview` |
| `/watchlist` | 390 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/watchlist/airev` | 390 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/watchlist/g42` | 390 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/watchlist/tii` | 390 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/watchlist/whiteshield` | 390 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/watchlist/dubai-police` | 390 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/watchlist/compare?ids=g42,edge,tii` | 390 | 200 | 200 | yes | 0 | yes | `nav-watchlist` |
| `/news` | 390 | 200 | 200 | yes | 0 | yes | `nav-news` |
| `/news?org=airev` | 390 | 200 | 200 | yes | 0 | yes | `nav-news` |
| `/radar` | 390 | 200 | 200 | yes | 0 | yes | `nav-radar` |
| `/graph` | 390 | 200 | 200 | yes | 0 | yes | `nav-graph` |
| `/sentiment` | 390 | 200 | 200 | yes | 0 | yes | `nav-sentiment` |
| `/chat` | 390 | 200 | 200 | yes | 0 | no | `nav-chat` |
| `/chat-od` | 390 | 200 | 200 | yes | 0 | no | `nav-chat` |
| `/briefing` | 390 | 200 | 200 | yes | 0 | yes | `nav-briefing` |
| `/methodology` | 390 | 200 | 200 | yes | 0 | yes | `nav-methodology` |
| `/artifacts` | 390 | 200 | 200 | yes | 0 | yes | `nav-artifacts` |
| `/plugins` | 390 | 200 | 200 | yes | 0 | yes | `none` |
| `/settings` | 390 | 200 | 200 | yes | 0 | yes | `nav-settings` |
| `/docs/interactive-ui` | 390 | 200 | 200 | yes | 0 | yes | `none` |
| `/this-route-does-not-exist` | 390 | 404 | 404 | yes | 2 | yes | `none` |

## 3. Extra Proof Measurements

### (a) `/watchlist` Verification (Desktop 1440 and Mobile 390)

Verification of default sort, 'Name' sort, and 'Coverage' sort on the watchlist grid:

#### Viewport 1440px:
- **Default Sort**: first card `data-org="airev"`, `data-pinned="true"`, `hasPinnedChip=true`
- **Name Sort**: first card `data-org="airev"`, `data-pinned="true"`, `hasPinnedChip=true`
- **Coverage Sort**: first card `data-org="airev"`, `data-pinned="true"`, `hasPinnedChip=true`
- **Logo vs Monogram Counts**: `[data-testid=org-logo]` = 36, `[data-testid=org-monogram]` = 14 (Total = 50)
- **Cropped Screenshot**: `watchlist-top-1440.png` (grid top row clipped)

#### Viewport 390px:
- **Default Sort**: first card `data-org="airev"`, `data-pinned="true"`, `hasPinnedChip=true`
- **Name Sort**: first card `data-org="airev"`, `data-pinned="true"`, `hasPinnedChip=true`
- **Coverage Sort**: first card `data-org="airev"`, `data-pinned="true"`, `hasPinnedChip=true`
- **Logo vs Monogram Counts**: `[data-testid=org-logo]` = 36, `[data-testid=org-monogram]` = 14 (Total = 50)
- **Cropped Screenshot**: `watchlist-top-390.png` (grid top row clipped)

### (b) `/watchlist/airev` Reference Dossier Verification

#### Viewport 1440px:
- **Disambiguation Present**: `[data-testid=airev-disambiguation]` present = true
- **Sources Count**: `[data-testid=airev-sources] li` count = 35
- **Dossier Crosslinks Count**: `[data-testid=dossier-crosslinks] a` count = 6 (expected 6)
- **Org Profile Present**: `[data-testid=org-profile]` present = true
- **Full Page Screenshot**: `airev-dossier-1440.png`

#### Viewport 390px:
- **Disambiguation Present**: `[data-testid=airev-disambiguation]` present = true
- **Sources Count**: `[data-testid=airev-sources] li` count = 35
- **Dossier Crosslinks Count**: `[data-testid=dossier-crosslinks] a` count = 6 (expected 6)
- **Org Profile Present**: `[data-testid=org-profile]` present = true
- **Full Page Screenshot**: `airev-dossier-390.png`

### (c) `/graph` Ecosystem Graph

- **Top connected organisations list links count**: 10 (under `[data-testid=top-connected-list]`)

### (d) `/plugins` Catalogue

- **Plugin rows count**: 14 `[data-testid=plugin-card]` elements

### (e) `/artifacts` WebP and Console Check

- **Console Errors Count**: 0 (0 expected; previous 404 webp confirmed fixed)

### (f) `/chat` Performance and Rail Geometry at 1440px

- **CLS over 3s after load**: 0 (expected ≤ 0.05, pass = true)
- **Rail Width** (`[data-testid=primary-nav]` closest aside): 64px (expected 64px, pass = true)

### (g) `/briefing` Scroll Restoration at 1440px

- **Scroll Position Before Navigation**: 600px
- **Scroll Position After Back Navigation**: 93px
- **Delta (|after - before|)**: 507px (expected tolerance ±20px)
- **Restored**: FAIL
- **Finding Note**: App Router navigation focused `<main id="main">` during route change, resetting/animating scroll position to y=93 instead of preserving y=600.

## 4. Screenshot Manifest

### Full-Page Route Screenshots (44 files under `shots/`)

- `shots/overview-1440.png` (/overview at 1440px)
- `shots/watchlist-1440.png` (/watchlist at 1440px)
- `shots/watchlist-airev-1440.png` (/watchlist/airev at 1440px)
- `shots/watchlist-g42-1440.png` (/watchlist/g42 at 1440px)
- `shots/watchlist-tii-1440.png` (/watchlist/tii at 1440px)
- `shots/watchlist-whiteshield-1440.png` (/watchlist/whiteshield at 1440px)
- `shots/watchlist-dubai-police-1440.png` (/watchlist/dubai-police at 1440px)
- `shots/watchlist-compare-ids-g42-edge-tii-1440.png` (/watchlist/compare?ids=g42,edge,tii at 1440px)
- `shots/news-1440.png` (/news at 1440px)
- `shots/news-org-airev-1440.png` (/news?org=airev at 1440px)
- `shots/radar-1440.png` (/radar at 1440px)
- `shots/graph-1440.png` (/graph at 1440px)
- `shots/sentiment-1440.png` (/sentiment at 1440px)
- `shots/chat-1440.png` (/chat at 1440px)
- `shots/chat-od-1440.png` (/chat-od at 1440px)
- `shots/briefing-1440.png` (/briefing at 1440px)
- `shots/methodology-1440.png` (/methodology at 1440px)
- `shots/artifacts-1440.png` (/artifacts at 1440px)
- `shots/plugins-1440.png` (/plugins at 1440px)
- `shots/settings-1440.png` (/settings at 1440px)
- `shots/docs-interactive-ui-1440.png` (/docs/interactive-ui at 1440px)
- `shots/this-route-does-not-exist-1440.png` (/this-route-does-not-exist at 1440px)
- `shots/overview-390.png` (/overview at 390px)
- `shots/watchlist-390.png` (/watchlist at 390px)
- `shots/watchlist-airev-390.png` (/watchlist/airev at 390px)
- `shots/watchlist-g42-390.png` (/watchlist/g42 at 390px)
- `shots/watchlist-tii-390.png` (/watchlist/tii at 390px)
- `shots/watchlist-whiteshield-390.png` (/watchlist/whiteshield at 390px)
- `shots/watchlist-dubai-police-390.png` (/watchlist/dubai-police at 390px)
- `shots/watchlist-compare-ids-g42-edge-tii-390.png` (/watchlist/compare?ids=g42,edge,tii at 390px)
- `shots/news-390.png` (/news at 390px)
- `shots/news-org-airev-390.png` (/news?org=airev at 390px)
- `shots/radar-390.png` (/radar at 390px)
- `shots/graph-390.png` (/graph at 390px)
- `shots/sentiment-390.png` (/sentiment at 390px)
- `shots/chat-390.png` (/chat at 390px)
- `shots/chat-od-390.png` (/chat-od at 390px)
- `shots/briefing-390.png` (/briefing at 390px)
- `shots/methodology-390.png` (/methodology at 390px)
- `shots/artifacts-390.png` (/artifacts at 390px)
- `shots/plugins-390.png` (/plugins at 390px)
- `shots/settings-390.png` (/settings at 390px)
- `shots/docs-interactive-ui-390.png` (/docs/interactive-ui at 390px)
- `shots/this-route-does-not-exist-390.png` (/this-route-does-not-exist at 390px)

### Extra Proof Screenshots

- `watchlist-top-1440.png` (clipped first row of watchlist grid at 1440px)
- `watchlist-top-390.png` (clipped first row of watchlist grid at 390px)
- `airev-dossier-1440.png` (full page reference dossier at 1440px)
- `airev-dossier-390.png` (full page reference dossier at 390px)
