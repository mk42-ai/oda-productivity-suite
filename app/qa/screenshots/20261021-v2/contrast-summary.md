# WCAG AA Contrast Sweep Report — Lane A (Before vs After)

**Date**: 2026-10-21  
**Scope**: 13 routes × 2 viewports (1440×900 desktop, 390×844 mobile) = 26 pages  
**Targets**:
- **BEFORE** (previous build): `https://sb-54yh1uujw0kw.vercel.run` (*Sandbox expired returning HTTP 410 SANDBOX_STOPPED at 10:41Z; recorded baseline 105/6,695 from `contrast-hscroll-residue.json` evaluated per prompt instructions*)
- **AFTER** (new build with color fixes): `https://sb-55dvd3y2jwnj.vercel.run` (*HTTP 200 on `/health`, fully verified across all 26 page views*)

---

## 1. Executive Summary & Totals

| Metric | BEFORE Baseline | AFTER (New Build) | Delta / Change |
|---|:---:|:---:|:---|
| **Nodes Checked** | 6,695 | 8,895 | +2,200 (exhaustive text-node traversal) |
| **Total Failures (Raw)** | 105 | 38 | **-67** (-63.8%) |
| **Genuine AA Failures** | **73** | **0** | **-73 (100% ELIMINATED → 0)** |
| **Measurement Artefacts** | 32 | 38 | +6 (CSS modern color spaces) |
| **Horizontal Scroll (hscroll)** | 0 / 26 | 0 / 26 | Clean (0 regressions) |
| **Residue ("B Capital" / bcapital)** | 0 / 26 | 0 / 26 | Clean (0 DOM residue) |

> **Key Finding**: All **73 genuine WCAG AA failures** in the baseline build have been **completely eliminated** (0 genuine failures remain across all 26 page evaluations). All 38 remaining hits are measurement artefacts caused by modern CSS color functions (`oklab(...)` in Tailwind v4 backdrop filter on the watchlist toolbar, and `color(srgb ...)` in component chip backgrounds).

---

## 2. Specific Verification Targets

### (1) Brand-rail Label "Concept demonstration"
- **Element**: Sidebar brand subtitle `aside span.uppercase` ("Concept demonstration")
- **Context / Viewport**: Desktop (1440×900) aside container (`lg:bg-[#F9F9F9]`)
- **Computed Colors**:
  - Foreground: `rgb(115, 115, 115)` (`#737373`) — updated from `#8E8E8E` (`rgb(142, 142, 142)`)
  - Background: `rgb(249, 249, 249)` (`#F9F9F9`)
  - Font: `11px`, `font-weight: 400` (normal text, requiring $\ge 4.5:1$)
- **Exact WCAG 2.x Relative Luminance Calculation**:
  - Relative luminance of `#737373`: $((115/255 + 0.055)/1.055)^{2.4} = 0.1714411007$
  - Relative luminance of `#F9F9F9`: $((249/255 + 0.055)/1.055)^{2.4} = 0.9473065367$
  - Exact Contrast Ratio: $(0.9473065 + 0.05) / (0.1714411 + 0.05) = 0.9973065 / 0.2214411 =$ **`4.503710:1`** (rounds to **4.50:1**)
- **Compliance Status**: **PASSES WCAG AA** (threshold $\ge 4.50:1$).
  - *Exact ratio analysis*: The ratio is **4.5037:1**, which just clears the 4.50:1 AA threshold. On pure white (`#FFFFFF`, mobile topbar background), the ratio is **4.7417:1**.
  - In the BEFORE build (#8E8E8E), this element failed at **3.11:1** on #F9F9F9.

### (2) Page Eyebrows Ratio
- **Element**: Section headers (`SectionHeader` in `src/components/uae/bits.tsx`)
- **Computed Colors**:
  - Foreground: `rgb(115, 115, 115)` (`#737373`) — updated from `#8E8E8E`
  - Background: `rgb(255, 255, 255)` (`#FFFFFF`)
  - Font: `12px` / `14px`, `font-weight: 600`
- **Exact Contrast Ratio**:
  - $(1.0000000 + 0.05) / (0.1714411 + 0.05) = 1.05 / 0.2214411 =$ **`4.741667:1`** (rounds to **4.74:1**)
- **Compliance Status**: **PASSES WCAG AA** (threshold $\ge 4.50:1$).
  - In the BEFORE build (#8E8E8E on white), eyebrows failed across all routes at **3.28:1**.

### (3) /radar Ring Chips "assess" and "hold" (Dark Ink Fix)
- **Element**: Ring badge indicators and blip markers in `src/app/radar/page.tsx`
- **Implementation Fix**: Introduced `RINK = { adopt: "#FFFFFF", trial: "#FFFFFF", assess: "#0D0D0D", hold: "#0D0D0D" }`
- **"assess" Chip** (fill `#B8A98F` / `rgb(184, 169, 143)`):
  - Ink color: `#0D0D0D` (`rgb(13, 13, 13)`)
  - Contrast Ratio: **8.43:1** (previously white text failed at **2.31:1**)
  - Status: **PASSES WCAG AA & AAA**
- **"hold" Chip** (fill `#A3A3A3` / `rgb(163, 163, 163)`):
  - Ink color: `#0D0D0D` (`rgb(13, 13, 13)`)
  - Contrast Ratio: **7.70:1** (previously white text failed at **2.52:1**)
  - Status: **PASSES WCAG AA & AAA**

### (4) /chat Composer Hint and Engine-Credit Line
- **Composer Hint** (`data-testid="composer-hint"`, `.oiu-composer__hint`):
  - Text: "`GPT-5.6 Luna · Enter to send`"
  - Color: `#737373` (`rgb(115, 115, 115)`) on `#FFFFFF`
  - Contrast Ratio: **4.74:1** (previously `#8E8E8E` failed at **3.28:1**)
  - Status: **PASSES WCAG AA**
- **Engine-Credit Line** (`data-testid="engine-credit"`, `.oiu-composer__credit`):
  - Text: "`Intelligence engine: OnDemand`"
  - Color: `#737373` (`rgb(115, 115, 115)`) on `#FFFFFF`
  - Contrast Ratio: **4.74:1**
  - Status: **PASSES WCAG AA**

---

## 3. Route × Viewport Comparison Table

| Route | Viewport | BEFORE Checked | BEFORE Fails (Gen / Art) | AFTER Checked | AFTER Fails (Gen / Art) | Status |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| `/overview` | 1440x900 | 175 | 2 (2 / 0) | 364 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/overview` | 390x844 | 264 | 3 (3 / 0) | 365 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/watchlist` | 1440x900 | 705 | 8 (2 / 6) | 1,058 | 9 (0 / 9) | ✅ 0 genuine fails |
| `/watchlist` | 390x844 | 657 | 9 (3 / 6) | 1,009 | 9 (0 / 9) | ✅ 0 genuine fails |
| `/watchlist/tii` | 1440x900 | 232 | 3 (3 / 0) | 332 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/watchlist/tii` | 390x844 | 233 | 4 (4 / 0) | 332 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/watchlist/compare?ids=g42,edge,tii` | 1440x900 | 93 | 2 (2 / 0) | 113 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/watchlist/compare?ids=g42,edge,tii` | 390x844 | 92 | 3 (3 / 0) | 111 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/sentiment` | 1440x900 | 134 | 2 (2 / 0) | 193 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/sentiment` | 390x844 | 136 | 3 (3 / 0) | 194 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/news` | 1440x900 | 803 | 2 (2 / 0) | 848 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/news` | 390x844 | 805 | 3 (3 / 0) | 849 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/radar` | 1440x900 | 369 | 5 (5 / 0) | 555 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/radar` | 390x844 | 371 | 6 (6 / 0) | 556 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/graph` | 1440x900 | 65 | 2 (2 / 0) | 70 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/graph` | 390x844 | 67 | 3 (3 / 0) | 71 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/chat` | 1440x900 | 137 | 7 (2 / 5) | 278 | 5 (0 / 5) | ✅ 0 genuine fails |
| `/chat` | 390x844 | 233 | 10 (5 / 5) | 293 | 5 (0 / 5) | ✅ 0 genuine fails |
| `/briefing` | 1440x900 | 119 | 2 (2 / 0) | 140 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/briefing` | 390x844 | 121 | 3 (3 / 0) | 141 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/methodology` | 1440x900 | 90 | 2 (2 / 0) | 105 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/methodology` | 390x844 | 92 | 3 (3 / 0) | 106 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/settings` | 1440x900 | 297 | 7 (2 / 5) | 341 | 5 (0 / 5) | ✅ 0 genuine fails |
| `/settings` | 390x844 | 299 | 8 (3 / 5) | 342 | 5 (0 / 5) | ✅ 0 genuine fails |
| `/artifacts` | 1440x900 | 52 | 1 (1 / 0) | 64 | 0 (0 / 0) | ✅ 0 genuine fails |
| `/artifacts` | 390x844 | 54 | 2 (2 / 0) | 65 | 0 (0 / 0) | ✅ 0 genuine fails |

---

## 4. Remaining AFTER Hits Detailed Inventory

Every remaining hit in the AFTER build is classified below (all 38 are measurement artefacts; 0 genuine AA failures):

| # | Route | VP | DOM Path | Text | Ratio | Colour Pair | Type | Reason |
|:---:|:---|:---:|:---|:---|:---:|:---|:---:|:---|
| 1 | `/watchlist` | 1440x900 | `div[data-testid="watchlist"] > div.sticky.z-30 > label.relative.flex-1 > span.sr-only` | Search watchlist | 1.08:1 | `rgb(13, 13, 13) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 2 | `/watchlist` | 1440x900 | `div[data-testid="watchlist"] > div.sticky.z-30 > div.flex.flex-wrap > button[data-testid="filter-company"]` | company | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 3 | `/watchlist` | 1440x900 | `div[data-testid="watchlist"] > div.sticky.z-30 > div.flex.flex-wrap > button[data-testid="filter-subsidiary"]` | subsidiary | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 4 | `/watchlist` | 1440x900 | `div[data-testid="watchlist"] > div.sticky.z-30 > div.flex.flex-wrap > button[data-testid="filter-government"]` | government | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 5 | `/watchlist` | 1440x900 | `div[data-testid="watchlist"] > div.sticky.z-30 > div.flex.flex-wrap > button[data-testid="filter-university"]` | university | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 6 | `/watchlist` | 1440x900 | `div[data-testid="watchlist"] > div.sticky.z-30 > div.flex.flex-wrap > button[data-testid="filter-research-centre"]` | research centre | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 7 | `/watchlist` | 1440x900 | `main#main > div[data-testid="watchlist"] > div.sticky.z-30 > span[data-testid="watchlist-count"]` | 50 | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 8 | `/watchlist` | 1440x900 | `main#main > div[data-testid="watchlist"] > div.sticky.z-30 > span[data-testid="watchlist-count"]` | / | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 9 | `/watchlist` | 1440x900 | `main#main > div[data-testid="watchlist"] > div.sticky.z-30 > span[data-testid="watchlist-count"]` | 50 | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 10 | `/watchlist` | 390x844 | `div[data-testid="watchlist"] > div.sticky.z-30 > label.relative.flex-1 > span.sr-only` | Search watchlist | 1.08:1 | `rgb(13, 13, 13) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 11 | `/watchlist` | 390x844 | `div[data-testid="watchlist"] > div.sticky.z-30 > div.flex.flex-wrap > button[data-testid="filter-company"]` | company | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 12 | `/watchlist` | 390x844 | `div[data-testid="watchlist"] > div.sticky.z-30 > div.flex.flex-wrap > button[data-testid="filter-subsidiary"]` | subsidiary | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 13 | `/watchlist` | 390x844 | `div[data-testid="watchlist"] > div.sticky.z-30 > div.flex.flex-wrap > button[data-testid="filter-government"]` | government | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 14 | `/watchlist` | 390x844 | `div[data-testid="watchlist"] > div.sticky.z-30 > div.flex.flex-wrap > button[data-testid="filter-university"]` | university | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 15 | `/watchlist` | 390x844 | `div[data-testid="watchlist"] > div.sticky.z-30 > div.flex.flex-wrap > button[data-testid="filter-research-centre"]` | research centre | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 16 | `/watchlist` | 390x844 | `main#main > div[data-testid="watchlist"] > div.sticky.z-30 > span[data-testid="watchlist-count"]` | 50 | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 17 | `/watchlist` | 390x844 | `main#main > div[data-testid="watchlist"] > div.sticky.z-30 > span[data-testid="watchlist-count"]` | / | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 18 | `/watchlist` | 390x844 | `main#main > div[data-testid="watchlist"] > div.sticky.z-30 > span[data-testid="watchlist-count"]` | 50 | 3.19:1 | `rgb(93, 93, 93) on oklab(0.999994 0.0000455678 0.0000200868 / 0.95)` | **ARTEFACT** | unparseable background color space (oklab(0.999994 0.0000455678 0.0000200868 / 0.95)) |
| 19 | `/chat` | 1440x900 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | Technology Innovation Institute | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 20 | `/chat` | 1440x900 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | G42 | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 21 | `/chat` | 1440x900 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | EDGE Group | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 22 | `/chat` | 1440x900 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | Mohamed bin Zayed University of Artificial Intelligence | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 23 | `/chat` | 1440x900 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | Core42 | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 24 | `/chat` | 390x844 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | Technology Innovation Institute | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 25 | `/chat` | 390x844 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | G42 | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 26 | `/chat` | 390x844 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | EDGE Group | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 27 | `/chat` | 390x844 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | Mohamed bin Zayed University of Artificial Intelligence | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 28 | `/chat` | 390x844 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | Core42 | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 29 | `/settings` | 1440x900 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | Technology Innovation Institute | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 30 | `/settings` | 1440x900 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | G42 | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 31 | `/settings` | 1440x900 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | EDGE Group | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 32 | `/settings` | 1440x900 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | Mohamed bin Zayed University of Artificial Intelligence | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 33 | `/settings` | 1440x900 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | Core42 | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 34 | `/settings` | 390x844 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | Technology Innovation Institute | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 35 | `/settings` | 390x844 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | G42 | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 36 | `/settings` | 390x844 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | EDGE Group | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 37 | `/settings` | 390x844 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | Mohamed bin Zayed University of Artificial Intelligence | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |
| 38 | `/settings` | 390x844 | `div.cp-chips > span[data-testid="company-chip"] > span[data-testid="context-chip"] > span.context-chip__name` | Core42 | 2.03:1 | `rgb(68, 64, 60) on color(srgb 0.931176 0.927608 0.925059)` | **ARTEFACT** | unparseable background color space (color(srgb 0.931176 0.927608 0.925059)) |

---

## 5. Artifact Verification & Notes

1. **Complete Elimination of Genuine Failures**: All typography color tokens were updated from `#8E8E8E` to `#737373`, providing at least **4.50:1** contrast on `#F9F9F9` (sidebar) and **4.74:1** on `#FFFFFF` (content canvas).
2. **Radar Ring Inks**: The assess and hold blip labels and ring chips now use dark ink (`#0D0D0D`), achieving **8.43:1** and **7.70:1** contrast respectively, completely resolving the previous white-on-light-fill AA miss.
3. **Measurement Artefacts Explanation**: All 38 remaining entries are confirmed measurement artefacts due to modern CSS color functions (`oklab(...)` on the sticky filter bar backdrop and `color(srgb ...)` on suggestion chips). Visually, these elements use `#44403C` on `#EDECEC` (~9.1:1) and dark text on translucent light backgrounds, which comfortably pass WCAG AA standards.
4. **Zero Layout Regressions**: Both horizontal scroll (`hscroll`) and legacy brand residue (`residue`) tests passed with 0 defects across all 26 evaluations.