# NAVIGATION_AUDIT_20261022 — read-only audit of mk42-ai/oda-productivity-suite @ 6f6254b (branch uae-ai-command-centre, PR #7)

Generated 2026-10-22T03:13:01Z UTC. Scope: Part A roster inventory (Lane A) + Part B screen-to-screen navigation crawl (Lane B). No tracked file was edited; nothing committed, tagged or pushed. This file is the only file created inside the repository and is left untracked.

## 0. Checkpoint & integrity

| check | value |
|---|---|
| HEAD (detached) | 6f6254b922061e6d85600ff7a1b0eb7d85b51846 |
| main / origin/main | be3f7c1df1c04a6c1afcc9dd0b94bf9d03865754 (untouched) |
| bcap-pre-uae-20261020T2130Z | fe88a12af0969b519d9b3e5e559d89d1de6244a4 |
| uae-qa4-pre-20261021T13Z | 9f95223f56408bd569c5071afdb86c72199f5b16 |
| uae-qa6-pre-20261021T20Z | e848f651b4a62a5b0399532c7f732ebffd2892c8 |
| uae-qa7-pre-20261021T23Z | 753c1462e6f79f8f66ca2d4ba3818a4b57e57610 |
| uae-qa8-pre-20261022T01Z | ee7939f6ba204dfe238836da0aae22f035172992 |
| tracked-file modifications before/after | 0 / 0 (`git status --porcelain --untracked-files=no` empty) |
| pre-existing untracked files | 60 paths under `app/proof/**` (QA screenshots/JSON left by earlier cycles, present at 02:33Z before this audit started; not created and not deleted by this audit) |
| sandbox preview | https://sb-533wny9yw6fw.vercel.run (sbx_TwunDbarU6cQXR5Z60esFCi9akKa, port 5173, `next build` + `next start`, /health 200 at 02:37:27Z) |


## 1. Part A — Roster inventory (Lane A)

### 1.1 Data sources and asset directories (exact paths)

| purpose | path |
|---|---|
| watchlist / dossier records (50 orgs, ordered array) | `app/src/data/uae_cc_v1/orgs.json` (`organizations[]`, keys: id, name, type, website, hq, founded, parent_id, ownership, leadership[], ai_focus[], technologies[], timeline[], related[], briefing, sources[], confidence, coverage, unavailable[], …) |
| lightweight index (id, name, type, hq, parent_id, logo) | `app/src/data/uae_cc_v1/index.json` |
| logo provenance (official vs monogram) | `app/src/data/uae_cc_v1/logos.json` (6 `official`, 44 `monogram`) |
| news / sentiment / graph / radar / HF models | `app/src/data/uae_cc_v1/{news,sentiment,graph,radar,hf}.json` (108 / 274 / 105 nodes + 165 edges / 13 / 154) |
| data access layer (ORGS order, `logoFor`, `coverageStats`) | `app/src/lib/uae/data.ts` |
| watchlist page + client (sort/filter) | `app/src/app/watchlist/page.tsx`, `app/src/components/uae/watchlist-client.tsx` |
| dossier page | `app/src/app/watchlist/[id]/page.tsx` |
| logo component (`OrgLogo`) | `app/src/components/uae/bits.tsx` lines 5-10 |
| org logo files | `app/public/logos/uae/*.png` (6 files: astra-tech, g42, micropolis, positron, purehealth, xpanceo) |
| concept brand marks | `app/public/brand/{mark-light,mark-dark,avatar-512}.png` + `mark-*-64.png`, `app/public/brand/icons/*` (sector/social SVG + PNG icons) |
| OnDemand engine-credit glyph | `app/public/plugins/ondemand.svg` (24×24 generic stroke icon, not the AIREV/OnDemand wordmark) |
| coverage narrative | `app/RESEARCH_COVERAGE.md` (per-cycle sections; no per-org table — `coverage_pct` therefore comes from `orgs.json.coverage`, which is what `/overview` and the watchlist lede display) |
| mission state | `app/MISSION_STATE.md`, `app/MISSION_STATE.json`, `app/QA_REPORT.md`, `app/NEXT_ACTIONS.md`, `app/CHECKPOINTS.md`, `app/API_HEALTH.md` |
| `src/assets`, `public/logos/<root>`, `RESEARCH_COVERAGE.json` | do not exist in this commit |

### 1.2 Watchlist order and AIREV position

- `orgs.json` data order (position 0 first): `['ai-data-authority', 'g42', 'core42', 'inception', 'presight', 'aiq', 'khazna', 'm42']` … — **AIREV zero-based data index = 20** (21st record). Position 0 in the data is `ai-data-authority`.

- What the app shows first: `/watchlist` renders `ORGS.map(...)` and the client defaults to sort **“Most signals”** (`news + voices + models`, stable sort). Measured in the live DOM at 1440×900: first five cards `['tii', 'mbzuai', 'g42', 'khazna', 'ifm']`; **AIREV is card index 12 (13th)** with signals news 6 · voices 0 · models 0 = 6, versus TII 89, MBZUAI 89, G42 82.

- **AIREV is NOT at the top of the watchlist** under either ordering. There is no pin/priority field in the data or the sort logic (`watchlist-client.tsx` line 19).

### 1.3 `roster` (all 50, in `orgs.json` order)

Field notes: `legal_name` is not a field in the data (null for all 50); `linkedin_url`/`x_url` are only populated when a dossier *source URL* is a `linkedin.com/company/…` or `x.com`/`twitter.com` URL (whiteshield only); `type` is inferred (rule in `roster_stats.type_rule`); `sector` = first `ai_focus` entry verbatim (`sector_bucket` is a coarse grouping); `coverage_pct` = `coverage × 100`; `logo_status.dimensions` measured with PIL; `fit` = the `<img>` is rendered `object-contain` with 4 px padding inside a 44 px (card) / 64 px (dossier) box, so official logos are *contained* (never cropped); the 44 monogram orgs render an initials `<span>`.

```json
[
 {
  "name": "Artificial Intelligence and Data Authority",
  "slug": "ai-data-authority",
  "legal_name": null,
  "website": "https://uaecabinet.ae",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": "2026",
  "leader": "H.E. Omar Sultan Al Olama — Chair of the Authority (Cabinet approval 14 Jun 2026)",
  "type": "gov",
  "type_raw": "government",
  "sector": "National artificial intelligence",
  "sector_bucket": "Government AI / policy",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 5,
  "coverage_pct": 90.9,
  "confidence": 0.91,
  "signals": {
   "news": 4,
   "voices": 10,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "logo"
  ]
 },
 {
  "name": "G42",
  "slug": "g42",
  "legal_name": null,
  "website": "https://g42.ai",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": "2018",
  "leader": "Sheikh Tahnoon bin Zayed Al Nahyan — Chairman and controlling shareholder",
  "type": "SOE",
  "type_raw": "company",
  "sector": "Artificial intelligence",
  "sector_bucket": "Enterprise AI services",
  "logo_status": {
   "present": true,
   "path": "/logos/uae/g42.png",
   "format": "png",
   "dimensions": "32x32",
   "fit": "contained",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 11,
  "coverage_pct": 100.0,
  "confidence": 0.79,
  "signals": {
   "news": 32,
   "voices": 50,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url"
  ]
 },
 {
  "name": "Core42",
  "slug": "core42",
  "legal_name": null,
  "website": "https://core42.ai",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": "2023",
  "leader": "Talal M. Al Kaissi — Chief Executive Officer",
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": "National-scale enterprise AI solutions and services",
  "sector_bucket": "Enterprise AI services",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 7,
  "coverage_pct": 100.0,
  "confidence": 0.88,
  "signals": {
   "news": 8,
   "voices": 8,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "logo"
  ]
 },
 {
  "name": "Inception (Inception42, G42)",
  "slug": "inception",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Ashish Koshy — CEO (appointed June 2025)",
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": "AI product development",
  "sector_bucket": "Enterprise AI services",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 7,
  "coverage_pct": 86.4,
  "confidence": 0.79,
  "signals": {
   "news": 6,
   "voices": 4,
   "models": 8
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Presight AI Holding PLC",
  "slug": "presight",
  "legal_name": null,
  "website": "https://presight.ai",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Thomas Pramotedham — Chief Executive Officer",
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": "Cross-sector big data analytics",
  "sector_bucket": "Data analytics",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 5,
  "coverage_pct": 90.9,
  "confidence": 0.88,
  "signals": {
   "news": 4,
   "voices": 2,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "AIQ",
  "slug": "aiq",
  "legal_name": null,
  "website": "https://aiq.ae",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": "2020",
  "leader": "Dennis Jol — CEO",
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": "Developing and commercializing AI products and applications for the oil and gas industry.",
  "sector_bucket": "Energy & industrial AI",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 5,
  "coverage_pct": 100.0,
  "confidence": 0.88,
  "signals": {
   "news": 0,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "logo"
  ]
 },
 {
  "name": "Khazna Data Centers",
  "slug": "khazna",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Hassan Alnaqbi — CEO",
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": "Physical data-center infrastructure supporting AI compute",
  "sector_bucket": "AI infrastructure / compute",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 5,
  "coverage_pct": 81.8,
  "confidence": 0.78,
  "signals": {
   "news": 11,
   "voices": 15,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "M42",
  "slug": "m42",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Dimitris Moulavasilis — Group CEO",
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": "Healthcare AI and clinical care",
  "sector_bucket": "Health AI",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 3,
  "coverage_pct": 81.8,
  "confidence": 0.83,
  "signals": {
   "news": 9,
   "voices": 8,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Space42 PLC",
  "slug": "space42",
  "legal_name": null,
  "website": "https://space42.ai",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Karim Michel Sabbagh — Managing Director",
  "type": "SOE",
  "type_raw": "company",
  "sector": "AI-powered space technology",
  "sector_bucket": "Space & geospatial AI",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 3,
  "coverage_pct": 90.9,
  "confidence": 0.88,
  "signals": {
   "news": 2,
   "voices": 5,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "MGX",
  "slug": "mgx",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": "2024",
  "leader": "Ahmed Yahia Al Idrissi — CEO",
  "type": "SOE",
  "type_raw": "company",
  "sector": "Investment in artificial intelligence technologies",
  "sector_bucket": "Investment / capital",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 5,
  "coverage_pct": 81.8,
  "confidence": 0.74,
  "signals": {
   "news": 1,
   "voices": 1,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "logo"
  ]
 },
 {
  "name": "Analog",
  "slug": "analog",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Alex Kipman — Leader",
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": "Spatial AI computing",
  "sector_bucket": "Consumer / devices",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 2,
  "coverage_pct": 63.6,
  "confidence": 0.65,
  "signals": {
   "news": 0,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Technology Innovation Institute",
  "slug": "tii",
  "legal_name": null,
  "website": "https://tii.ae",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Dr. Najwa Aaraj — Chief Executive Officer (appointed 21 May 2024; succeeded inaugural CEO Dr Ray O. Johnson, 2021–2024)",
  "type": "other",
  "type_raw": "research centre",
  "sector": "Artificial intelligence and foundation models",
  "sector_bucket": "Foundation models / LLMs",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 9,
  "coverage_pct": 90.9,
  "confidence": 0.82,
  "signals": {
   "news": 7,
   "voices": 14,
   "models": 68
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Advanced Technology Research Council",
  "slug": "atrc",
  "legal_name": null,
  "website": "https://atrc.gov.ae",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Faisal Al Bannai — Secretary-General; Chair of the ATRC Board",
  "type": "gov",
  "type_raw": "government",
  "sector": "Research policy",
  "sector_bucket": "Government AI / policy",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 7,
  "coverage_pct": 90.9,
  "confidence": 0.83,
  "signals": {
   "news": 3,
   "voices": 7,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "AI71",
  "slug": "ai71",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Dr Mahir Nayfeh — CEO",
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": "Commercialisation of Falcon",
  "sector_bucket": "Foundation models / LLMs",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 2,
  "coverage_pct": 72.7,
  "confidence": 0.68,
  "signals": {
   "news": 1,
   "voices": 1,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "EDGE Group",
  "slug": "edge",
  "legal_name": null,
  "website": "https://edgegroup.ae",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Hamad Al Marar — CEO",
  "type": "unknown",
  "type_raw": "company",
  "sector": "Group AI Accelerator for advancing AI development and integration across defence solutions and manufacturing",
  "sector_bucket": "Autonomy / robotics / defence",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 9,
  "coverage_pct": 81.8,
  "confidence": 0.83,
  "signals": {
   "news": 3,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "KATIM",
  "slug": "katim",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": null,
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": null,
  "sector_bucket": "unknown",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 1,
  "coverage_pct": 27.3,
  "confidence": 0.3,
  "signals": {
   "news": 0,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "sector",
   "logo"
  ]
 },
 {
  "name": "ADASI",
  "slug": "adasi",
  "legal_name": null,
  "website": "https://edgegroup.ae",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Juma Al Kaabi — CEO of ADASI",
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": "Acquires, operates, customises, and maintains autonomous systems across air, land, and sea",
  "sector_bucket": "Autonomy / robotics / defence",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 4,
  "coverage_pct": 90.9,
  "confidence": 0.84,
  "signals": {
   "news": 0,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Mohamed bin Zayed University of Artificial Intelligence",
  "slug": "mbzuai",
  "legal_name": null,
  "website": "https://mbzuai.ac.ae",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Eric Xing — President",
  "type": "other",
  "type_raw": "university",
  "sector": "Artificial intelligence research and education",
  "sector_bucket": "Research & education",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 6,
  "coverage_pct": 81.8,
  "confidence": 0.86,
  "signals": {
   "news": 8,
   "voices": 17,
   "models": 64
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Institute of Foundation Models (IFM), Mohamed bin Zayed University of Artificial Intelligence",
  "slug": "ifm",
  "legal_name": null,
  "website": "https://mbzuai.ac.ae",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": null,
  "type": "other",
  "type_raw": "research centre",
  "sector": "Foundation models",
  "sector_bucket": "Foundation models / LLMs",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 4,
  "coverage_pct": 81.8,
  "confidence": 0.84,
  "signals": {
   "news": 1,
   "voices": 9,
   "models": 14
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "logo"
  ]
 },
 {
  "name": "Khalifa University of Science and Technology",
  "slug": "khalifa-university",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": null,
  "type": "other",
  "type_raw": "university",
  "sector": null,
  "sector_bucket": "unknown",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 1,
  "coverage_pct": 27.3,
  "confidence": 0.35,
  "signals": {
   "news": 0,
   "voices": 1,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "sector",
   "logo"
  ]
 },
 {
  "name": "AIREV",
  "slug": "airev",
  "legal_name": null,
  "website": "https://airev.ai",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": "2023-09",
  "leader": "Muhammad Khalid — Founder & CEO",
  "type": "startup",
  "type_raw": "company",
  "sector": "Agentic AI",
  "sector_bucket": "Agentic AI platforms",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 12,
  "coverage_pct": 90.9,
  "confidence": 0.86,
  "signals": {
   "news": 6,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "logo"
  ]
 },
 {
  "name": "e& enterprise",
  "slug": "eand-enterprise",
  "legal_name": null,
  "website": "https://eandenterprise.com",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Salvador Anglada — Chief Executive Officer of e& enterprise",
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": "AI",
  "sector_bucket": "Enterprise AI services",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 1,
  "coverage_pct": 81.8,
  "confidence": 0.78,
  "signals": {
   "news": 1,
   "voices": 2,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Hub71",
  "slug": "hub71",
  "legal_name": null,
  "website": "https://hub71.com",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Ahmad Ali Alwan — CEO",
  "type": "gov",
  "type_raw": "government",
  "sector": "Hub71+ AI specialist ecosystem",
  "sector_bucket": "Ecosystem / accelerator",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 6,
  "coverage_pct": 81.8,
  "confidence": 0.82,
  "signals": {
   "news": 2,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Micropolis Robotics",
  "slug": "micropolis",
  "legal_name": null,
  "website": "https://micropolis.ai",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Dubai",
  "founded": "2014",
  "leader": "Fareed Aljawhari — CEO",
  "type": "other",
  "type_raw": "company",
  "sector": "Autonomous mobile robots and unmanned ground vehicles",
  "sector_bucket": "Autonomy / robotics / defence",
  "logo_status": {
   "present": true,
   "path": "/logos/uae/micropolis.png",
   "format": "png",
   "dimensions": "96x96",
   "fit": "contained",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 7,
  "coverage_pct": 100.0,
  "confidence": 0.8,
  "signals": {
   "news": 6,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url"
  ]
 },
 {
  "name": "XPANCEO",
  "slug": "xpanceo",
  "legal_name": null,
  "website": "https://xpanceo.com",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Dubai",
  "founded": "2021",
  "leader": "Roman Axelrod — Founder and CEO",
  "type": "unknown",
  "type_raw": "company",
  "sector": "Smart contact lens technology combining optics, nanophotonics, materials science, biosensing, and AR/XR computing",
  "sector_bucket": "Consumer / devices",
  "logo_status": {
   "present": true,
   "path": "/logos/uae/xpanceo.png",
   "format": "png",
   "dimensions": "96x96",
   "fit": "contained",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 4,
  "coverage_pct": 90.9,
  "confidence": 0.84,
  "signals": {
   "news": 4,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url"
  ]
 },
 {
  "name": "Derq",
  "slug": "derq",
  "legal_name": null,
  "website": "https://derq.com",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Dubai",
  "founded": "2016",
  "leader": null,
  "type": "unknown",
  "type_raw": "company",
  "sector": "Road-safety AI",
  "sector_bucket": "Autonomy / robotics / defence",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 1,
  "coverage_pct": 81.8,
  "confidence": 0.72,
  "signals": {
   "news": 1,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "leader",
   "logo"
  ]
 },
 {
  "name": "Astra Tech",
  "slug": "astra-tech",
  "legal_name": null,
  "website": "https://astratech.ae",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": "2022",
  "leader": "Tariq Bin Hendi — CEO and Board Member",
  "type": "unknown",
  "type_raw": "company",
  "sector": "Consumer technology platform combining communications, fintech, and e-commerce, with AI-powered technology solutions.",
  "sector_bucket": "Consumer / devices",
  "logo_status": {
   "present": true,
   "path": "/logos/uae/astra-tech.png",
   "format": "png",
   "dimensions": "96x96",
   "fit": "contained",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 2,
  "coverage_pct": 100.0,
  "confidence": 0.79,
  "signals": {
   "news": 0,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url"
  ]
 },
 {
  "name": "Saal.ai",
  "slug": "saal-ai",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": "2018",
  "leader": "Vikraman Poduval — CEO",
  "type": "unknown",
  "type_raw": "company",
  "sector": "Big data",
  "sector_bucket": "Data analytics",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 2,
  "coverage_pct": 81.8,
  "confidence": 0.82,
  "signals": {
   "news": 2,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "logo"
  ]
 },
 {
  "name": "PureHealth",
  "slug": "purehealth",
  "legal_name": null,
  "website": "https://purehealth.ae",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": null,
  "type": "unknown",
  "type_raw": "company",
  "sector": "Healthcare AI and diagnostic automation",
  "sector_bucket": "Health AI",
  "logo_status": {
   "present": true,
   "path": "/logos/uae/purehealth.png",
   "format": "png",
   "dimensions": "32x32",
   "fit": "contained",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 3,
  "coverage_pct": 72.7,
  "confidence": 0.84,
  "signals": {
   "news": 4,
   "voices": 2,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "leader"
  ]
 },
 {
  "name": "Daman (The National Insurance Company)",
  "slug": "daman",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": null,
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": "Automating health-insurance document processing, including policy applications, endorsements, and claims",
  "sector_bucket": "Health AI",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 2,
  "coverage_pct": 72.7,
  "confidence": 0.78,
  "signals": {
   "news": 0,
   "voices": 2,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "logo"
  ]
 },
 {
  "name": "CNTXT AI",
  "slug": "cntxt",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": null,
  "type": "unknown",
  "type_raw": "company",
  "sector": "Arabic-first AI models",
  "sector_bucket": "Foundation models / LLMs",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 1,
  "coverage_pct": 45.5,
  "confidence": 0.55,
  "signals": {
   "news": 0,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "logo"
  ]
 },
 {
  "name": "Positron AI Ltd",
  "slug": "positron",
  "legal_name": null,
  "website": "https://positron.ai",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Dubai",
  "founded": null,
  "leader": null,
  "type": "unknown",
  "type_raw": "company",
  "sector": "Inference hardware and infrastructure for power-efficient, scalable deployment of AI models",
  "sector_bucket": "AI infrastructure / compute",
  "logo_status": {
   "present": true,
   "path": "/logos/uae/positron.png",
   "format": "png",
   "dimensions": "16x16",
   "fit": "contained",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 1,
  "coverage_pct": 63.6,
  "confidence": 0.86,
  "signals": {
   "news": 1,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "leader"
  ]
 },
 {
  "name": "Whiteshield",
  "slug": "whiteshield",
  "legal_name": null,
  "website": "https://whiteshield.ai",
  "linkedin_url": "https://linkedin.com/company/whiteshield-advisory",
  "x_url": null,
  "hq": "Dubai (DIFC) / Riyadh; UK-incorporated (Whiteshield Partners Limited)",
  "founded": "2011",
  "leader": "Fadi Farra — Founder & CEO",
  "type": "startup",
  "type_raw": "company",
  "sector": "Sovereign intelligence for governments",
  "sector_bucket": "Government AI / policy",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 10,
  "coverage_pct": 100.0,
  "confidence": 0.74,
  "signals": {
   "news": 0,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "x_url",
   "logo"
  ]
 },
 {
  "name": "Mubadala Investment Company",
  "slug": "mubadala",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Khaldoon Al Mubarak — Group CEO",
  "type": "gov",
  "type_raw": "government",
  "sector": "AI and robotics investment opportunities",
  "sector_bucket": "Autonomy / robotics / defence",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 5,
  "coverage_pct": 72.7,
  "confidence": 0.82,
  "signals": {
   "news": 1,
   "voices": 1,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Abu Dhabi National Oil Company (ADNOC)",
  "slug": "adnoc",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Sultan Ahmed Al Jaber — ADNOC Managing Director and Group CEO",
  "type": "SOE",
  "type_raw": "company",
  "sector": "Deploying AI to improve efficiency and create value across ADNOC operations",
  "sector_bucket": "Energy & industrial AI",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 5,
  "coverage_pct": 81.8,
  "confidence": 0.86,
  "signals": {
   "news": 1,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Dubai Future Foundation",
  "slug": "dff",
  "legal_name": null,
  "website": "https://dubaifuture.ae",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Dubai",
  "founded": null,
  "leader": "Khalfan Belhoul — Chief Executive",
  "type": "gov",
  "type_raw": "government",
  "sector": "Agentic AI for government services",
  "sector_bucket": "Government AI / policy",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 3,
  "coverage_pct": 72.7,
  "confidence": 0.82,
  "signals": {
   "news": 2,
   "voices": 1,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Dubai Centre for Artificial Intelligence",
  "slug": "dcai",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Dubai",
  "founded": null,
  "leader": null,
  "type": "gov",
  "type_raw": "government",
  "sector": "Enabling government entities to develop agentic AI-powered services",
  "sector_bucket": "Government AI / policy",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 2,
  "coverage_pct": 63.6,
  "confidence": 0.76,
  "signals": {
   "news": 3,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "logo"
  ]
 },
 {
  "name": "Digital Dubai",
  "slug": "digital-dubai",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Dubai",
  "founded": null,
  "leader": "Hamad Obaid Al Mansoori — Director General",
  "type": "gov",
  "type_raw": "government",
  "sector": "Agentic AI-powered government services",
  "sector_bucket": "Government AI / policy",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 3,
  "coverage_pct": 63.6,
  "confidence": 0.78,
  "signals": {
   "news": 1,
   "voices": 1,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Department of Government Enablement (DGE), Abu Dhabi",
  "slug": "dge",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Ruba Al Hassan — Director General",
  "type": "gov",
  "type_raw": "government",
  "sector": "Government AI enablement",
  "sector_bucket": "Government AI / policy",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 3,
  "coverage_pct": 72.7,
  "confidence": 0.79,
  "signals": {
   "news": 3,
   "voices": 2,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Dubai AI Campus",
  "slug": "dubai-ai-campus",
  "legal_name": null,
  "website": "https://difc.com",
  "linkedin_url": null,
  "x_url": null,
  "hq": "Dubai",
  "founded": null,
  "leader": null,
  "type": "gov",
  "type_raw": "government",
  "sector": "Artificial intelligence",
  "sector_bucket": "Enterprise AI services",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 3,
  "coverage_pct": 54.5,
  "confidence": 0.83,
  "signals": {
   "news": 2,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "logo"
  ]
 },
 {
  "name": "Department of Health – Abu Dhabi",
  "slug": "doh-abu-dhabi",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Mansoor Al Mansoori — Chairman",
  "type": "gov",
  "type_raw": "government",
  "sector": "Artificial intelligence in healthcare delivery and clinical care",
  "sector_bucket": "Health AI",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 6,
  "coverage_pct": 72.7,
  "confidence": 0.84,
  "signals": {
   "news": 2,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Dubai Police",
  "slug": "dubai-police",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Dubai",
  "founded": null,
  "leader": null,
  "type": "gov",
  "type_raw": "government",
  "sector": "Deepfake detection",
  "sector_bucket": "Speech & media AI",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 2,
  "coverage_pct": 63.6,
  "confidence": 0.48,
  "signals": {
   "news": 1,
   "voices": 3,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "logo"
  ]
 },
 {
  "name": "Camb.ai",
  "slug": "camb-ai",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Dubai",
  "founded": null,
  "leader": null,
  "type": "unknown",
  "type_raw": "company",
  "sector": "Speech and dubbing AI",
  "sector_bucket": "Speech & media AI",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 3,
  "coverage_pct": 36.4,
  "confidence": 0.62,
  "signals": {
   "news": 0,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "logo"
  ]
 },
 {
  "name": "EchoTwin AI",
  "slug": "echotwin",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi (Hub71)",
  "founded": null,
  "leader": null,
  "type": "unknown",
  "type_raw": "company",
  "sector": "Transforms municipal fleets into mobile sensing networks and digital twins for infrastructure monitoring and predictive maintenance.",
  "sector_bucket": "Autonomy / robotics / defence",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 1,
  "coverage_pct": 45.5,
  "confidence": 0.72,
  "signals": {
   "news": 0,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "logo"
  ]
 },
 {
  "name": "Neuphonic",
  "slug": "neuphonic",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": null,
  "type": "unknown",
  "type_raw": "company",
  "sector": "On-device voice AI",
  "sector_bucket": "Speech & media AI",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 1,
  "coverage_pct": 45.5,
  "confidence": 0.72,
  "signals": {
   "news": 0,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "logo"
  ]
 },
 {
  "name": "Endimension Technology",
  "slug": "endimension",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi (Hub71)",
  "founded": null,
  "leader": null,
  "type": "unknown",
  "type_raw": "company",
  "sector": "AI-first radiology platform that automates abnormality detection, triage, and reporting",
  "sector_bucket": "Health AI",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 1,
  "coverage_pct": 54.5,
  "confidence": 0.55,
  "signals": {
   "news": 0,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "logo"
  ]
 },
 {
  "name": "SteerAI",
  "slug": "steerai",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": null,
  "type": "unknown",
  "type_raw": "company",
  "sector": "Off-road autonomous vehicle software",
  "sector_bucket": "Autonomy / robotics / defence",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 1,
  "coverage_pct": 63.6,
  "confidence": 0.78,
  "signals": {
   "news": 1,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "logo"
  ]
 },
 {
  "name": "Artificial Intelligence and Advanced Technology Council",
  "slug": "aiatc",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": "Khaldoon Khalifa Al Mubarak — Secretary General",
  "type": "gov",
  "type_raw": "government",
  "sector": "Artificial intelligence policy",
  "sector_bucket": "Government AI / policy",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 1,
  "coverage_pct": 45.5,
  "confidence": 0.55,
  "signals": {
   "news": 0,
   "voices": 1,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "logo"
  ]
 },
 {
  "name": "Injazat",
  "slug": "injazat",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": null,
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": "Enterprise cloud and AI capabilities through its merger into Core42",
  "sector_bucket": "AI infrastructure / compute",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 2,
  "coverage_pct": 63.6,
  "confidence": 0.78,
  "signals": {
   "news": 0,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "logo"
  ]
 },
 {
  "name": "ASPIRE",
  "slug": "aspire",
  "legal_name": null,
  "website": null,
  "linkedin_url": null,
  "x_url": null,
  "hq": "Abu Dhabi",
  "founded": null,
  "leader": null,
  "type": "subsidiary",
  "type_raw": "subsidiary",
  "sector": "Technology programme management",
  "sector_bucket": "Ecosystem / accelerator",
  "logo_status": {
   "present": false,
   "path": null,
   "format": null,
   "dimensions": null,
   "fit": "n/a (initials monogram fallback)",
   "render": {
    "watchlist_card_px": 44,
    "dossier_px": 64,
    "css": "img.object-contain p-1 (contained) | monogram span: initials"
   }
  },
  "sources_count": 1,
  "coverage_pct": 36.4,
  "confidence": 0.55,
  "signals": {
   "news": 0,
   "voices": 0,
   "models": 0
  },
  "missing_fields": [
   "legal_name",
   "website",
   "linkedin_url",
   "x_url",
   "founded",
   "leader",
   "logo"
  ]
 }
]
```

### 1.4 `roster_stats`

```json
{
 "total_orgs": 50,
 "mean_coverage_pct": 73.7,
 "median_coverage_pct": 81.8,
 "orgs_below_60_pct": [
  "katim",
  "khalifa-university",
  "cntxt",
  "dubai-ai-campus",
  "camb-ai",
  "echotwin",
  "neuphonic",
  "endimension",
  "aiatc",
  "aspire"
 ],
 "orgs_no_logo": [
  "ai-data-authority",
  "core42",
  "inception",
  "presight",
  "aiq",
  "khazna",
  "m42",
  "space42",
  "mgx",
  "analog",
  "tii",
  "atrc",
  "ai71",
  "edge",
  "katim",
  "adasi",
  "mbzuai",
  "ifm",
  "khalifa-university",
  "airev",
  "eand-enterprise",
  "hub71",
  "derq",
  "saal-ai",
  "daman",
  "cntxt",
  "whiteshield",
  "mubadala",
  "adnoc",
  "dff",
  "dcai",
  "digital-dubai",
  "dge",
  "dubai-ai-campus",
  "doh-abu-dhabi",
  "dubai-police",
  "camb-ai",
  "echotwin",
  "neuphonic",
  "endimension",
  "steerai",
  "aiatc",
  "injazat",
  "aspire"
 ],
 "orgs_no_leader": [
  "katim",
  "ifm",
  "khalifa-university",
  "derq",
  "purehealth",
  "daman",
  "cntxt",
  "positron",
  "dcai",
  "dubai-ai-campus",
  "dubai-police",
  "camb-ai",
  "echotwin",
  "neuphonic",
  "endimension",
  "steerai",
  "injazat",
  "aspire"
 ],
 "orgs_no_website": [
  "inception",
  "khazna",
  "m42",
  "mgx",
  "analog",
  "ai71",
  "katim",
  "khalifa-university",
  "saal-ai",
  "daman",
  "cntxt",
  "mubadala",
  "adnoc",
  "dcai",
  "digital-dubai",
  "dge",
  "doh-abu-dhabi",
  "dubai-police",
  "camb-ai",
  "echotwin",
  "neuphonic",
  "endimension",
  "steerai",
  "aiatc",
  "injazat",
  "aspire"
 ],
 "orgs_no_linkedin": [
  "ai-data-authority",
  "g42",
  "core42",
  "inception",
  "presight",
  "aiq",
  "khazna",
  "m42",
  "space42",
  "mgx",
  "analog",
  "tii",
  "atrc",
  "ai71",
  "edge",
  "katim",
  "adasi",
  "mbzuai",
  "ifm",
  "khalifa-university",
  "airev",
  "eand-enterprise",
  "hub71",
  "micropolis",
  "xpanceo",
  "derq",
  "astra-tech",
  "saal-ai",
  "purehealth",
  "daman",
  "cntxt",
  "positron",
  "mubadala",
  "adnoc",
  "dff",
  "dcai",
  "digital-dubai",
  "dge",
  "dubai-ai-campus",
  "doh-abu-dhabi",
  "dubai-police",
  "camb-ai",
  "echotwin",
  "neuphonic",
  "endimension",
  "steerai",
  "aiatc",
  "injazat",
  "aspire"
 ],
 "orgs_no_x_url": [
  "ai-data-authority",
  "g42",
  "core42",
  "inception",
  "presight",
  "aiq",
  "khazna",
  "m42",
  "space42",
  "mgx",
  "analog",
  "tii",
  "atrc",
  "ai71",
  "edge",
  "katim",
  "adasi",
  "mbzuai",
  "ifm",
  "khalifa-university",
  "airev",
  "eand-enterprise",
  "hub71",
  "micropolis",
  "xpanceo",
  "derq",
  "astra-tech",
  "saal-ai",
  "purehealth",
  "daman",
  "cntxt",
  "positron",
  "whiteshield",
  "mubadala",
  "adnoc",
  "dff",
  "dcai",
  "digital-dubai",
  "dge",
  "dubai-ai-campus",
  "doh-abu-dhabi",
  "dubai-police",
  "camb-ai",
  "echotwin",
  "neuphonic",
  "endimension",
  "steerai",
  "aiatc",
  "injazat",
  "aspire"
 ],
 "orgs_no_founded": [
  "inception",
  "presight",
  "khazna",
  "m42",
  "space42",
  "analog",
  "tii",
  "atrc",
  "ai71",
  "edge",
  "katim",
  "adasi",
  "mbzuai",
  "ifm",
  "khalifa-university",
  "eand-enterprise",
  "hub71",
  "purehealth",
  "daman",
  "cntxt",
  "positron",
  "mubadala",
  "adnoc",
  "dff",
  "dcai",
  "digital-dubai",
  "dge",
  "dubai-ai-campus",
  "doh-abu-dhabi",
  "dubai-police",
  "camb-ai",
  "echotwin",
  "neuphonic",
  "endimension",
  "steerai",
  "aiatc",
  "injazat",
  "aspire"
 ],
 "orgs_no_hq": [],
 "orgs_no_legal_name": [
  "ai-data-authority",
  "g42",
  "core42",
  "inception",
  "presight",
  "aiq",
  "khazna",
  "m42",
  "space42",
  "mgx",
  "analog",
  "tii",
  "atrc",
  "ai71",
  "edge",
  "katim",
  "adasi",
  "mbzuai",
  "ifm",
  "khalifa-university",
  "airev",
  "eand-enterprise",
  "hub71",
  "micropolis",
  "xpanceo",
  "derq",
  "astra-tech",
  "saal-ai",
  "purehealth",
  "daman",
  "cntxt",
  "positron",
  "whiteshield",
  "mubadala",
  "adnoc",
  "dff",
  "dcai",
  "digital-dubai",
  "dge",
  "dubai-ai-campus",
  "doh-abu-dhabi",
  "dubai-police",
  "camb-ai",
  "echotwin",
  "neuphonic",
  "endimension",
  "steerai",
  "aiatc",
  "injazat",
  "aspire"
 ],
 "logo_format_breakdown": {
  "svg": 0,
  "png": 6,
  "other": 0,
  "monogram_fallback": 44
 },
 "logo_dimension_outliers": [
  {
   "slug": "g42",
   "dimensions": "32x32",
   "issue": "under 128 px"
  },
  {
   "slug": "micropolis",
   "dimensions": "96x96",
   "issue": "under 128 px"
  },
  {
   "slug": "xpanceo",
   "dimensions": "96x96",
   "issue": "under 128 px"
  },
  {
   "slug": "astra-tech",
   "dimensions": "96x96",
   "issue": "under 128 px"
  },
  {
   "slug": "purehealth",
   "dimensions": "32x32",
   "issue": "under 128 px"
  },
  {
   "slug": "positron",
   "dimensions": "16x16",
   "issue": "under 128 px"
  }
 ],
 "type_breakdown": {
  "gov": 12,
  "SOE": 4,
  "subsidiary": 14,
  "other": 5,
  "unknown": 13,
  "startup": 2
 },
 "type_breakdown_raw": {
  "government": 12,
  "company": 20,
  "subsidiary": 14,
  "research centre": 2,
  "university": 2
 },
 "sector_breakdown": {
  "National artificial intelligence": 1,
  "Artificial intelligence": 2,
  "National-scale enterprise AI solutions and services": 1,
  "AI product development": 1,
  "Cross-sector big data analytics": 1,
  "Developing and commercializing AI products and applications for the oil and gas industry.": 1,
  "Physical data-center infrastructure supporting AI compute": 1,
  "Healthcare AI and clinical care": 1,
  "AI-powered space technology": 1,
  "Investment in artificial intelligence technologies": 1,
  "Spatial AI computing": 1,
  "Artificial intelligence and foundation models": 1,
  "Research policy": 1,
  "Commercialisation of Falcon": 1,
  "Group AI Accelerator for advancing AI development and integration across defence solutions and manufacturing": 1,
  "unknown": 2,
  "Acquires, operates, customises, and maintains autonomous systems across air, land, and sea": 1,
  "Artificial intelligence research and education": 1,
  "Foundation models": 1,
  "Agentic AI": 1,
  "AI": 1,
  "Hub71+ AI specialist ecosystem": 1,
  "Autonomous mobile robots and unmanned ground vehicles": 1,
  "Smart contact lens technology combining optics, nanophotonics, materials science, biosensing, and AR/XR computing": 1,
  "Road-safety AI": 1,
  "Consumer technology platform combining communications, fintech, and e-commerce, with AI-powered technology solutions.": 1,
  "Big data": 1,
  "Healthcare AI and diagnostic automation": 1,
  "Automating health-insurance document processing, including policy applications, endorsements, and claims": 1,
  "Arabic-first AI models": 1,
  "Inference hardware and infrastructure for power-efficient, scalable deployment of AI models": 1,
  "Sovereign intelligence for governments": 1,
  "AI and robotics investment opportunities": 1,
  "Deploying AI to improve efficiency and create value across ADNOC operations": 1,
  "Agentic AI for government services": 1,
  "Enabling government entities to develop agentic AI-powered services": 1,
  "Agentic AI-powered government services": 1,
  "Government AI enablement": 1,
  "Artificial intelligence in healthcare delivery and clinical care": 1,
  "Deepfake detection": 1,
  "Speech and dubbing AI": 1,
  "Transforms municipal fleets into mobile sensing networks and digital twins for infrastructure monitoring and predictive maintenance.": 1,
  "On-device voice AI": 1,
  "AI-first radiology platform that automates abnormality detection, triage, and reporting": 1,
  "Off-road autonomous vehicle software": 1,
  "Artificial intelligence policy": 1,
  "Enterprise cloud and AI capabilities through its merger into Core42": 1,
  "Technology programme management": 1
 },
 "airev_watchlist_index_data_order": 20,
 "airev_watchlist_index_default_sort_most_signals": 12,
 "airev_sources_count": 12,
 "airev_coverage_pct": 90.9,
 "default_sort_top5": [
  "tii",
  "mbzuai",
  "g42",
  "khazna",
  "ifm"
 ],
 "default_sort_top5_signals": [
  [
   7,
   14,
   68,
   89
  ],
  [
   8,
   17,
   64,
   89
  ],
  [
   32,
   50,
   0,
   82
  ],
  [
   11,
   15,
   0,
   26
  ],
  [
   1,
   9,
   14,
   24
  ]
 ],
 "airev_signals": [
  6,
  0,
  0,
  6
 ],
 "sector_bucket_breakdown": {
  "Government AI / policy": 8,
  "Enterprise AI services": 5,
  "Data analytics": 2,
  "Energy & industrial AI": 2,
  "AI infrastructure / compute": 3,
  "Health AI": 5,
  "Space & geospatial AI": 1,
  "Investment / capital": 1,
  "Consumer / devices": 3,
  "Foundation models / LLMs": 4,
  "Autonomy / robotics / defence": 7,
  "unknown": 2,
  "Research & education": 1,
  "Agentic AI platforms": 1,
  "Ecosystem / accelerator": 2,
  "Speech & media AI": 3
 },
 "soe_slugs": [
  "g42",
  "space42",
  "mgx",
  "adnoc"
 ],
 "airev_at_top": false,
 "top_of_watchlist_data_order": "ai-data-authority",
 "top_of_watchlist_default_display": "tii",
 "type_rule": "gov = data type government; subsidiary = data type subsidiary; other = university/research centre/listed company; SOE = company whose ownership text names the state, a sovereign fund, Mubadala, G42-majority or a ruling-family controlling shareholder; startup = company whose ownership text says privately held/investors/founder; unknown = company with ownership \"unavailable\" in the data",
 "coverage_note": "coverage_pct = orgs.json `coverage` × 100 (11-field completeness per RESEARCH_COVERAGE.md); mean 73.7% matches coverageStats() in src/lib/uae/data.ts and the /overview KPI (74%)",
 "unknown_type_slugs": [
  "edge",
  "xpanceo",
  "derq",
  "astra-tech",
  "saal-ai",
  "purehealth",
  "cntxt",
  "positron",
  "camb-ai",
  "echotwin",
  "neuphonic",
  "endimension",
  "steerai"
 ]
}
```

### 1.5 AIREV brand / logo check

Search: `find` (case-insensitive `*airev*`, `*ondemand*`, `*on-demand*`) over the whole repo excluding node_modules/.next/playwright-report, plus `app/public/brand`, `app/public/logos`, `app/public/plugins`; `src/assets` does not exist.

| variant | format | path | dimensions | note |
|---|---|---|---|---|
| dark | svg | **missing** | — | no AIREV vector mark anywhere in the repo |
| dark | png | **missing** | — | |
| light | svg | **missing** | — | |
| light | png | **missing** | — | |
| (OnDemand engine credit) | svg | `app/public/plugins/ondemand.svg` | 24×24 viewBox | generic rounded-square + circle stroke icon (#0AC985 / #E5E7EB), text-free; used by footer, Settings, live-pipeline, plugin logos — it is not the official AIREV or OnDemand wordmark |
| (concept marks, this turn's attachments, NOT in repo) | png | `.media/qdt92Yz3rH.png`, `.media/8pnzvlnoVM.png` (1024×1024), `.media/cbN5407F9u.png` (1536×1024 OG card) | — | not copied anywhere; outside audit scope (read-only) |

Only image files matching `airev` are two prior-cycle QA screenshots (`app/qa/2026-10-2{1,2}-cycle{7,8}/laneF/after-watchlist-airev-1440x900.png`, 1440×900 PNG).

**What AIREV renders with today** (measured on the preview): `logos.json.airev = {status: "monogram", reason: "no verified official domain"}` → `logoFor("airev")` returns null → `OrgLogo` renders the **initials fallback `<span data-testid="org-monogram">A</span>`** (title “AIREV — monogram (no verified official logo)”): 44×44 px on the `/watchlist` card, 64×64 px on `/watchlist/airev`, background #F9F9F9, border #E5E5E5, `object-fit` n/a (text). It is a placeholder, not a logo. The six official logos are favicon-sized PNGs (16–96 px) upscaled to 44/64 px CSS — e.g. G42 32×32 natural → 44×44 rendered (`object-contain`, 4 px padding), which is below 1× density and visibly soft on retina.


## 2. Part B — Screen-to-screen navigation deep dive (Lane B)

### 2.1 Preview
- URL: https://sb-533wny9yw6fw.vercel.run (Vercel Sandbox `sbx_TwunDbarU6cQXR5Z60esFCi9akKa`, node22, `npm ci --ignore-scripts` → `next build` (BUILD_OK) → `next start -p 5173`). `/health` → 200 `{ok:true, app:'uae-ai-command-centre', orgs:50, sentiment:274, news:108, edges:165, ondemand_key:true}`.
- White UI: `body` background rgb(255,255,255) on every crawled screen; **“B Capital” residue: 0 occurrences** in the rendered text of all 44 screens and 0 in the HTML of /overview, /watchlist/airev, /health and the 404 page.
- Crawl tooling: `playwright-core` 1.64.0 (already in `app/node_modules`) driving `/usr/bin/chromium` headless, two contexts (1440×900 desktop; 390×844 mobile+touch), 22 routes × 2 viewports = 44 screens. Scripts lived in /tmp (nothing written into the repo).

### 2.2 Routes enumerated from `app/src/app/**/page.tsx` (+ `next.config.ts` redirect `/` → `/overview`)

`/overview` (root redirect 307), `/watchlist`, `/watchlist/[id]` (50 ids), `/watchlist/compare`, `/news`, `/radar`, `/graph`, `/sentiment`, `/chat`, `/chat-od`, `/briefing`, `/methodology`, `/artifacts`, `/docs/interactive-ui`, `/settings`, plus `not-found.tsx`. `/plugins` has **no page in this commit** (returns the 404 screen). Sampled dossiers: airev (startup/agentic), whiteshield (advisory), tii (research centre), dubai-police (government), purehealth (health company), g42 (SOE holding).

### 2.3 Per-screen matrix

Columns: status · document title · H1 · rail (width px / collapsed flag / active item) · in-page internal link targets (deduped) · external links · CLS · route-change latency median of 3 (client-side click on the rail from an adjacent screen → H1 change) · console errors/warnings · scroll restored after back · deep-link reload (status / same H1 / hydration errors) · empty-state test-ids · data points.

| route | vp | status | title | H1 | rail w / collapsed / active | int. links | ext. | CLS | latency ms (samples) | console E/W | back restores scroll | reload | empty-state | data pts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| / | 1440 | 200 | National Overview · UAE AI Command Centre (conce | UAE AI National Intelligence Command Cen | 224 / false / nav-overview | 20 | 5 | 0 | 35 [30, 35, 39] | 0/5 | True (y 600→600) | 200 / True / 0 | live-news-empty, live-statements-empty | 40 |
| /watchlist | 1440 | 200 | Watchlist · UAE AI Command Centre (concept) | 50 organisations shaping UAE AI | 224 / false / nav-watchlist | 61 | 0 | 0 | 67 [57, 85, 67] | 0/5 | True (y 600→600) | 200 / True / 0 | — | 201 |
| /watchlist/airev | 1440 | 200 | AIREV — dossier · UAE AI Command Centre (concept | AIREV | 224 / false / nav-watchlist | 14 | 16 | 0 | n/a (not a rail item)  | 0/5 | True (y 600→600) | 200 / True / 0 | — | 64 |
| /watchlist/whiteshield | 1440 | 200 | Whiteshield — dossier · UAE AI Command Centre (c | Whiteshield | 224 / false / nav-watchlist | 11 | 10 | 0 | n/a (not a rail item)  | 0/0 | True (y 600→600) | 200 / True / 0 | — | 37 |
| /watchlist/tii | 1440 | 200 | Technology Innovation Institute — dossier · UAE  | Technology Innovation Institute | 224 / false / nav-watchlist | 15 | 21 | 0 | n/a (not a rail item)  | 0/5 | True (y 600→600) | 200 / True / 0 | — | 67 |
| /watchlist/dubai-police | 1440 | 200 | Dubai Police — dossier · UAE AI Command Centre ( | Dubai Police | 224 / false / nav-watchlist | 12 | 3 | 0 | n/a (not a rail item)  | 0/0 | True (y 600→600) | 200 / True / 0 | — | 27 |
| /watchlist/purehealth | 1440 | 200 | PureHealth — dossier · UAE AI Command Centre (co | PureHealth | 224 / false / nav-watchlist | 12 | 5 | 0 | n/a (not a rail item)  | 0/5 | True (y 600→600) | 200 / True / 0 | — | 38 |
| /watchlist/g42 | 1440 | 200 | G42 — dossier · UAE AI Command Centre (concept) | G42 | 224 / false / nav-watchlist | 20 | 25 | 0 | n/a (not a rail item)  | 0/5 | True (y 600→600) | 200 / True / 0 | — | 73 |
| /watchlist/compare | 1440 | 200 | Compare organisations · UAE AI Command Centre (c | G42 vs EDGE Group vs Technology Innovati | 224 / false / nav-watchlist | 15 | 0 | 0 | n/a (not a rail item)  | 0/0 | True (y 297→297) | 200 / True / 0 | — | 13 |
| /news | 1440 | 200 | News Intelligence · UAE AI Command Centre (conce | What happened, who did it, where it came | 224 / false / nav-news | 45 | 81 | 0 | 50 [43, 51, 50] | 0/5 | True (y 600→600) | 200 / True / 0 | — | 220 |
| /radar | 1440 | 200 | Technology & Innovation Radar · UAE AI Command C | Where UAE AI capability is moving | 224 / false / nav-radar | 37 | 64 | 0 | 29 [27, 29, 33] | 0/5 | True (y 600→600) | 200 / True / 0 | — | 126 |
| /graph | 1440 | 200 | Ecosystem Relationship Graph · UAE AI Command Ce | Who owns, funds and partners with whom | 224 / false / nav-graph | 11 | 0 | 0 | 62 [59, 65, 62] | 0/0 | True (y 92→92) | 200 / True / 0 | — | 1 |
| /sentiment | 1440 | 200 | Sentiment Universe · UAE AI Command Centre (conc | How the UAE talks about AI | 224 / false / nav-sentiment | 11 | 0 | 0.0519 | 93 [93, 108, 91] | 0/5 | True (y 600→600) | 200 / True / 0 | — | 319 |
| /chat | 1440 | 200 | Executive Intelligence Chat · UAE AI Command Cen | Executive Intelligence Chat | 64 / true / nav-chat | 11 | 0 | 0.1226 | 371 [375, 371, 370] | 0/0 | True (y 28→28) | 200 / True / 0 | plan-empty-state | 52 |
| /chat-od | 1440 | 200 | OnDemand chat (port) · UAE AI Command Centre (co | OnDemand chat · port preview | 64 / true / — | 11 | 0 | 0.546 | n/a (not a rail item)  | 0/0 | n/a (page not scrollable) (y 0→0) | 200 / True / 0 | — | 0 |
| /briefing | 1440 | 200 | National AI Briefing · UAE AI Command Centre (co | One-page briefing, generated on demand | 224 / false / nav-briefing | 11 | 0 | 0.0695 | 17 [20, 16, 17] | 0/5 | False (y 600→0) | 200 / True / 0 | — | 27 |
| /methodology | 1440 | 200 | Methodology & limitations · UAE AI Command Centr | How this concept was built — and what it | 224 / false / nav-methodology | 11 | 0 | 0 | 17 [17, 15, 18] | 0/0 | True (y 359→359) | 200 / True / 0 | — | 29 |
| /artifacts | 1440 | 200 | Artifacts · UAE AI Command Centre (concept) | Artifacts | 224 / false / nav-artifacts | 11 | 0 | 0 | 42 [42, 64, 38] | 6/0 | True (y 149→149) | 200 / True / 0 | artifacts-empty, artifacts-empty-icon, artifacts-empty-cta | 0 |
| /docs/interactive-ui | 1440 | 200 | Why the chat is interactive · UAE AI Command Cen | Why the chat is interactive | 224 / false / — | 11 | 0 | 0 | n/a (not a rail item)  | 0/4 | True (y 600→600) | 200 / True / 0 | — | 24 |
| /plugins | 1440 | 404 | UAE AI National Intelligence Command Centre — Co | Page not found | 224 / false / — | 11 | 0 | 0.0026 | n/a (not a rail item)  | 2/0 | n/a (page not scrollable) (y 0→0) | 404 / True / 0 | not-found | 1 |
| /settings | 1440 | 200 | Settings · UAE AI Command Centre (concept) | Settings | 224 / false / nav-settings | 11 | 0 | 0 | 338 [338, 339, 337] | 0/3 | True (y 600→600) | 200 / True / 0 | — | 44 |
| /this-route-does-not-exist | 1440 | 404 | UAE AI National Intelligence Command Centre — Co | Page not found | 224 / false / — | 11 | 0 | 0.0026 | n/a (not a rail item)  | 2/0 | n/a (page not scrollable) (y 0→0) | 404 / True / 0 | not-found | 1 |
| / | 390x | 200 | National Overview · UAE AI Command Centre (conce | UAE AI National Intelligence Command Cen | 0 / false / nav-overview | 20 | 5 | 0 | 32 [31, 33, 32] | 0/15 | True (y 600→600) | 200 / True / 0 | live-news-empty, live-statements-empty | 40 |
| /watchlist | 390x | 200 | Watchlist · UAE AI Command Centre (concept) | 50 organisations shaping UAE AI | 0 / false / nav-watchlist | 61 | 0 | 0 | 66 [64, 66, 67] | 0/10 | True (y 600→600) | 200 / True / 0 | — | 201 |
| /watchlist/airev | 390x | 200 | AIREV — dossier · UAE AI Command Centre (concept | AIREV | 0 / false / nav-watchlist | 14 | 16 | 0 | n/a (not a rail item)  | 0/10 | True (y 600→600) | 200 / True / 0 | — | 64 |
| /watchlist/whiteshield | 390x | 200 | Whiteshield — dossier · UAE AI Command Centre (c | Whiteshield | 0 / false / nav-watchlist | 11 | 10 | 0 | n/a (not a rail item)  | 0/10 | True (y 600→600) | 200 / True / 0 | — | 37 |
| /watchlist/tii | 390x | 200 | Technology Innovation Institute — dossier · UAE  | Technology Innovation Institute | 0 / false / nav-watchlist | 15 | 21 | 0 | n/a (not a rail item)  | 0/10 | True (y 600→600) | 200 / True / 0 | — | 67 |
| /watchlist/dubai-police | 390x | 200 | Dubai Police — dossier · UAE AI Command Centre ( | Dubai Police | 0 / false / nav-watchlist | 12 | 3 | 0 | n/a (not a rail item)  | 0/5 | True (y 600→600) | 200 / True / 0 | — | 27 |
| /watchlist/purehealth | 390x | 200 | PureHealth — dossier · UAE AI Command Centre (co | PureHealth | 0 / false / nav-watchlist | 12 | 5 | 0 | n/a (not a rail item)  | 0/10 | True (y 600→600) | 200 / True / 0 | — | 38 |
| /watchlist/g42 | 390x | 200 | G42 — dossier · UAE AI Command Centre (concept) | G42 | 0 / false / nav-watchlist | 20 | 25 | 0 | n/a (not a rail item)  | 0/15 | True (y 600→600) | 200 / True / 0 | — | 73 |
| /watchlist/compare | 390x | 200 | Compare organisations · UAE AI Command Centre (c | G42 vs EDGE Group vs Technology Innovati | 0 / false / nav-watchlist | 15 | 0 | 0 | n/a (not a rail item)  | 0/10 | True (y 600→600) | 200 / True / 0 | — | 13 |
| /news | 390x | 200 | News Intelligence · UAE AI Command Centre (conce | What happened, who did it, where it came | 0 / false / nav-news | 45 | 81 | 0 | 54 [54, 51, 56] | 0/15 | True (y 600→600) | 200 / True / 0 | — | 220 |
| /radar | 390x | 200 | Technology & Innovation Radar · UAE AI Command C | Where UAE AI capability is moving | 0 / false / nav-radar | 37 | 64 | 0 | 28 [28, 28, 28] | 0/5 | True (y 600→600) | 200 / True / 0 | — | 126 |
| /graph | 390x | 200 | Ecosystem Relationship Graph · UAE AI Command Ce | Who owns, funds and partners with whom | 0 / false / nav-graph | 11 | 0 | 0 | 44 [52, 44, 38] | 0/10 | True (y 600→600) | 200 / True / 0 | — | 1 |
| /sentiment | 390x | 200 | Sentiment Universe · UAE AI Command Centre (conc | How the UAE talks about AI | 0 / false / nav-sentiment | 11 | 0 | 0 | 68 [73, 68, 67] | 0/10 | True (y 600→600) | 200 / True / 0 | — | 319 |
| /chat | 390x | 200 | Executive Intelligence Chat · UAE AI Command Cen | Executive Intelligence Chat | 0 / true / nav-chat | 11 | 0 | 0.0076 | 369 [380, 369, 369] | 0/0 | True (y 31→31) | 200 / True / 0 | threads-empty, plan-empty-state | 53 |
| /chat-od | 390x | 200 | OnDemand chat (port) · UAE AI Command Centre (co | OnDemand chat · port preview | 0 / true / — | 11 | 0 | 0 | n/a (not a rail item)  | 0/10 | True (y 129→129) | 200 / True / 0 | threads-empty | 0 |
| /briefing | 390x | 200 | National AI Briefing · UAE AI Command Centre (co | One-page briefing, generated on demand | 0 / false / nav-briefing | 11 | 0 | 0 | 19 [22, 19, 19] | 0/15 | True (y 600→586) | 200 / True / 0 | — | 27 |
| /methodology | 390x | 200 | Methodology & limitations · UAE AI Command Centr | How this concept was built — and what it | 0 / false / nav-methodology | 11 | 0 | 0 | 18 [18, 18, 19] | 0/10 | True (y 600→600) | 200 / True / 0 | — | 29 |
| /artifacts | 390x | 200 | Artifacts · UAE AI Command Centre (concept) | Artifacts | 0 / false / nav-artifacts | 11 | 0 | 0 | 44 [44, 43, 45] | 7/10 | True (y 297→297) | 200 / True / 0 | artifacts-empty, artifacts-empty-icon, artifacts-empty-cta | 0 |
| /docs/interactive-ui | 390x | 200 | Why the chat is interactive · UAE AI Command Cen | Why the chat is interactive | 0 / false / — | 11 | 0 | 0 | n/a (not a rail item)  | 0/8 | True (y 600→600) | 200 / True / 0 | — | 24 |
| /plugins | 390x | 404 | UAE AI National Intelligence Command Centre — Co | Page not found | 0 / false / — | 11 | 0 | 0 | n/a (not a rail item)  | 3/10 | True (y 129→129) | 404 / True / 0 | not-found | 1 |
| /settings | 390x | 200 | Settings · UAE AI Command Centre (concept) | Settings | 0 / false / nav-settings | 11 | 0 | 0 | 338 [340, 338, 336] | 0/9 | True (y 600→600) | 200 / True / 0 | — | 44 |
| /this-route-does-not-exist | 390x | 404 | UAE AI National Intelligence Command Centre — Co | Page not found | 0 / false / — | 11 | 0 | 0 | n/a (not a rail item)  | 3/10 | True (y 129→129) | 404 / True / 0 | not-found | 1 |

Notes: at 390×844 the desktop rail is `display:none` (width 0) and the 52 px top bar + 280 px drawer take over; `activeRail` at 390 is read from the drawer's `<Nav>` (`aria-current=page`). The 404 screens return HTTP 404 with the branded `not-found` card (2 console errors = the document 404 itself + its reload). `/artifacts` console errors (6–7) are all `GET /assets/artifacts-ui/artifacts-header-256.webp → 404` (missing asset; `public/assets/` does not exist) — `/api/artifacts` itself answers 200 `{backend:'not_provisioned', total:0}`.

### 2.4 Breadcrumbs
- **No breadcrumb component exists** (`grep -rli breadcrumb src` → none; no `nav[aria-label*=breadcrumb]` on any screen). Dossier pages carry an eyebrow link “WATCHLIST” → `/watchlist` above the H1 (the only parent link); `/watchlist/compare` has no parent link other than the rail; `/docs/interactive-ui`, `/chat-od` have none.

### 2.5 Mobile drawer (390×844) — dedicated probe on 13 routes

| route | closed state | open width | focus moved into drawer on open | Tab trapped inside | focus escapes to | Esc closes | focus → trigger after Esc | overlay click closes | close button closes | route change closes | body scroll locked |
|---|---|---|---|---|---|---|---|---|---|---|---|
| /overview | x=-280, aria-hidden=true, inert=True | 280 px | False | False (13 stops inside, then leaves) | cta-briefing | True | False (active after Esc: A) | True | True (active: BODY) | True → /news | True |
| /watchlist | x=-280, aria-hidden=true, inert=True | 280 px | False | False (13 stops inside, then leaves) | watchlist-search | True | False (active after Esc: A) | True | True (active: BODY) | True → /news | True |
| /watchlist/airev | x=-280, aria-hidden=true, inert=True | 280 px | False | False (13 stops inside, then leaves) | A | True | False (active after Esc: A) | True | True (active: BODY) | True → /news | True |
| /news | x=-280, aria-hidden=true, inert=True | 280 px | False | False (13 stops inside, then leaves) | news-search | True | False (active after Esc: A) | True | True (active: BODY) | True → /radar | True |
| /radar | x=-280, aria-hidden=true, inert=True | 280 px | False | False (13 stops inside, then leaves) | SUMMARY | True | False (active after Esc: A) | True | True (active: BODY) | True → /news | True |
| /graph | x=-280, aria-hidden=true, inert=True | 280 px | False | False (20 stops inside, then leaves) | INPUT | True | False (active after Esc: BODY) | True | True (active: BODY) | True → /news | True |
| /sentiment | x=-280, aria-hidden=true, inert=True | 280 px | False | False (13 stops inside, then leaves) | win-24h | True | False (active after Esc: bubble) | True | True (active: BODY) | True → /news | True |
| /chat | x=-280, aria-hidden=true, inert=True | 280 px | False | False (23 stops inside, then leaves) | new-thread | True | False (active after Esc: BODY) | True | True (active: BODY) | True → /news | True |
| /briefing | x=-280, aria-hidden=true, inert=True | 280 px | False | False (26 stops inside, then leaves) | briefing-focus | True | False (active after Esc: briefing-generate) | True | True (active: BODY) | True → /news | True |
| /methodology | x=-280, aria-hidden=true, inert=True | 280 px | False | False (29 stops inside, then leaves) | A | True | False (active after Esc: BODY) | True | True (active: BODY) | True → /news | True |
| /artifacts | x=-280, aria-hidden=true, inert=True | 280 px | False | False (24 stops inside, then leaves) | artifact-filter-all | True | False (active after Esc: BODY) | True | True (active: BODY) | True → /news | True |
| /settings | x=-280, aria-hidden=true, inert=True | 280 px | False | False (13 stops inside, then leaves) | copy-link | True | False (active after Esc: plugin-toggle) | True | True (active: BODY) | True → /news | True |
| /this-route-does-not-exist | x=-280, aria-hidden=true, inert=True | 280 px | False | False (26 stops inside, then leaves) | A | True | True (active after Esc: rail-drawer-toggle) | True | True (active: BODY) | True → /news | True |

Clean re-test (toggle focused → Enter → 3×Tab → Escape) on /overview, /news, /settings: focus stays on the toggle when the drawer opens, Tab enters the drawer, **Escape closes the drawer and focus lands on `<body>`** (not the trigger); the drawer's own Close button also drops focus to `<body>`. Only on the 404 route did focus happen to be on the trigger after Escape (the crawl's prior Tab sequence had wrapped around). Width is exactly 280 px (`w-[280px] max-w-[85vw]`), overlay rgba(0,0,0,.4), `aria-modal=true`, `inert` while closed, `document.body.style.overflow=hidden` while open — all good; **the dialog is not a focus trap and does not manage focus**.

### 2.6 Keyboard tab order (first 15 stops) and focus rings

All 44 screens were tabbed from a blurred document. 617 of 645 non-body stops showed a visible `#2563EB` (rgb 37,99,235) outline at the moment of measurement; 26 showed a visible outline in another colour; 2 (`/chat-od` textarea) showed none.


**/ @ 1440x900**: 1. A[Skip to main content] → 2. A#brand-home[UAE AI Command Centre] → 3. BUTTON#rail-toggle[Collapse navigation] → 4. A#nav-overview[National Overview] → 5. A#nav-watchlist[Watchlist] → 6. A#nav-sentiment[Sentiment Universe] → 7. A#nav-news[News Intelligence] → 8. A#nav-radar[Tech Radar] → 9. A#nav-graph[Ecosystem Graph] → 10. A#nav-chat[Executive Chat] → 11. A#nav-briefing[National Briefing] → 12. A#nav-artifacts[Artifacts] → 13. A#nav-methodology[Methodology] → 14. A#nav-settings[Settings] → 15. BUTTON#cmdk-hint[Search organisations (]

**/watchlist/airev @ 1440x900**: 1. A[Skip to main content] → 2. A#brand-home[UAE AI Command Centre] → 3. BUTTON#rail-toggle[Collapse navigation] → 4. A#nav-overview[National Overview] → 5. A#nav-watchlist[Watchlist] → 6. A#nav-sentiment[Sentiment Universe] → 7. A#nav-news[News Intelligence] → 8. A#nav-radar[Tech Radar] → 9. A#nav-graph[Ecosystem Graph] → 10. A#nav-chat[Executive Chat] → 11. A#nav-briefing[National Briefing] → 12. A#nav-artifacts[Artifacts] → 13. A#nav-methodology[Methodology] → 14. A#nav-settings[Settings] → 15. BUTTON#cmdk-hint[Search organisations (]

**/chat @ 1440x900**: 1. BUTTON#voice-mic[Start voice mode (full] → 2. BODY[] ⚠ → 3. A[Skip to main content] → 4. BUTTON#rail-toggle[Expand navigation] → 5. A#nav-overview[National Overview] → 6. A#nav-watchlist[Watchlist] → 7. A#nav-sentiment[Sentiment Universe] → 8. A#nav-news[News Intelligence] → 9. A#nav-radar[Tech Radar] → 10. A#nav-graph[Ecosystem Graph] → 11. A#nav-chat[Executive Chat] → 12. A#nav-briefing[National Briefing] → 13. A#nav-artifacts[Artifacts] → 14. A#nav-methodology[Methodology] → 15. A#nav-settings[Settings]

**/ @ 390x844**: 1. A[Skip to main content] → 2. BUTTON#rail-drawer-toggle[Open navigation] → 3. A#brand-home[UAE AI Command Centre] → 4. A#cta-briefing[Generate National AI B] → 5. A[Ask the analyst] → 6. A#stat[ORGANISATIONS] → 7. A#stat[RESEARCH COVERAGE] → 8. A#stat[PUBLIC STATEMENTS] → 9. A#stat[NEWS EVENTS] → 10. A#stat[OPEN MODELS (HF)] → 11. A#stat[RELATIONSHIPS] → 12. A[Open Sentiment Univers] → 13. A[Artificial Intelligenc] → 14. A[All news →] → 15. A[GITEX GLOBAL 2026 sche]

**/news @ 390x844**: 1. A[Skip to main content] → 2. BUTTON#rail-drawer-toggle[Open navigation] → 3. A#brand-home[UAE AI Command Centre] → 4. INPUT#news-search[Search news] → 5. BUTTON[All] → 6. BUTTON[Infrastructure] → 7. BUTTON[Models] → 8. BUTTON[Policy] → 9. BUTTON[Partnership] → 10. BUTTON[Funding] → 11. BUTTON[Other] → 12. BUTTON[Health] → 13. BUTTON[Talent] → 14. BUTTON[Space] → 15. BUTTON[Geopolitics]

**/sentiment @ 390x844**: 1. A[Skip to main content] → 2. BUTTON#rail-drawer-toggle[Open navigation] → 3. A#brand-home[UAE AI Command Centre] → 4. BUTTON#win-24h[24h] ⚠rgb(93, 93, 93) → 5. BUTTON#win-7d[7d] ⚠rgb(93, 93, 93) → 6. BUTTON#win-30d[30d] ⚠rgb(93, 93, 93) → 7. BUTTON#win-all[all] ⚠rgb(255, 255, 255) → 8. BUTTON#playback[Play] ⚠rgb(13, 13, 13) → 9. SELECT#filter-lane[Lane] → 10. SELECT#filter-topic[Topic] → 11. SELECT#filter-org[Organisation] → 12. INPUT#filter-geo[] → 13. BUTTON#class-filter[Optimists] ⚠rgb(13, 13, 13) → 14. BUTTON#class-filter[Pragmatists] ⚠rgb(13, 13, 13) → 15. BUTTON#class-filter[Skeptics] ⚠rgb(13, 13, 13)


Root cause of the non-blue rings (verified on /sentiment, /settings, /docs/interactive-ui, the 404 CTA): the global rule `:where(a, button, …):focus-visible { outline: 2px solid var(--ring) }` (globals.css:149) is correct and `--ring` resolves to #2563eb, but these controls also carry Tailwind `transition-colors`, whose transition list includes `outline-color`; the outline therefore **animates from the element's current `color` (grey #5D5D5D / #0D0D0D / white on the dark CTA) to #2563EB over ~150 ms**. Measured: t0 = rgb(93,93,93) → t+400 ms = rgb(37,99,235). On the dark “National Overview” CTA of the 404 page the ring is white-on-white for the first frames. `/chat`: the composer auto-focuses on load, so the first Tab lands on the voice-mic button and the second on `<body>` before wrapping to the skip link; `/chat-od` textarea has `outline: none`.

### 2.7 Dead-link check (225 unique hrefs collected from all screens)

- Internal: 75 unique, **0 dead** (every `/watchlist/<id>` link resolves 200 and no 200 page renders the `not-found` card).
- External: 150 unique — 113 × 200, **16 × 404 (genuinely dead citations)**, 15 × 403 / 1 × 401 / 1 × 402 / 1 × 405 / 1 × 429 (bot-blocked or paywalled from the sandbox — not provably dead), 2 unreachable (`https://whiteshield.ai` connect timeout; a Yahoo Finance URL → headers overflow).

| external href | status | on routes |
|---|---|---|
| https://www.reuters.com/technology/microsoft-uaes-ai-firm-g42-set-up-two-new-centres-abu-dhabi-2024-09-17/ | 401 | /watchlist/g42 |
| https://www.lemonde.fr/en/economy/article/2026/09/09/uae-commits-1-billion-to-french-space-ai-project_6757342_ | 402 | /news, /radar |
| https://edgegroup.ae/news/edge-tii-micropolis-and-steerai-deploy-advanced-autonomous-logistics-platform | 403 | /watchlist/tii, /news, /radar |
| https://gulfbusiness.com/en/2026/artificial-intelligence/uae-tii-falcon-emirati-arabic-ai-model/ | 403 | /watchlist/tii, /news, /radar |
| https://mbzuai.ac.ae/news-events/news/mbzuai-g42-launch-k2-think-leading-open-source-system-advanced-ai-reason | 403 | /news |
| https://mbzuai.ac.ae/news-events/news/mbzuais-institute-foundation-models-inception42-launch-jais-3-arabic-nat | 403 | /, /watchlist/g42, /news |
| https://openai.com/index/introducing-stargate-uae/ | 403 | /news |
| https://seedtable.com/companies/whiteshield/funding-rounds/debt-2026-07 | 403 | /watchlist/whiteshield |
| https://space42.ai/en/press-release/2026/space42-delivers-exceptional-h1-2026-results | 403 | /news, /radar |
| https://space42.ai/en/press-release/2026/space42-expands-earth-observation-capabilities | 403 | /news, /radar |
| https://uaecabinet.ae/en/news/mohammed-bin-rashid-approves-establishing-artificial-intelligence-and-data-autho | 403 | /news, /radar |
| https://www.bloomberg.com/news/articles/2026-09-02/g42-explores-multibillion-raise | 403 | /news |
| https://www.bloomberg.com/news/articles/2026-09-02/microsoft-backed-ai-firm-g42-weighs-raising-billions-of-dol | 403 | /watchlist/g42, /news |
| https://www.bloomberg.com/news/articles/2026-09-04/abu-dhabi-s-g42-weighs-us-ownership-to-safeguard-ai-chip-ac | 403 | /watchlist/g42, /news, /radar |
| https://www.bloomberg.com/news/articles/2026-09-04/g42-weighs-majority-us-ownership | 403 | /watchlist/g42 |
| https://www.reddit.com/r/AbuDhabi/comments/1u9m2bm/is_g42_in_uae_a_reliable_company/ | 403 | /watchlist/g42 |
| https://www.reddit.com/r/abudhabi/comments/1u9m2bm/is_g42_in_uae_a_reliable_company/ | 403 | /watchlist/g42 |
| https://en.wikipedia.org/wiki/Xpanceo | 404 | /news, /radar |
| https://gecnewswire.com/airev-intel-on-device-ai-agents | 404 | /watchlist/airev, /news |
| https://news.microsoft.com/2024/04/15/microsoft-invests-1-5-billion-in-abu-dhabis-g42/ | 404 | /watchlist/g42 |
| https://whiteshield.ai/ai-economics | 404 | /watchlist/whiteshield |
| https://whiteshield.ai/people/fadi-farra | 404 | /watchlist/whiteshield |
| https://www.bis.gov/press-release/uae-country-group-a5-2026 | 404 | /news |
| https://www.computerweekly.com/news/ai-everything-abu-dhabi-2026-core42-sovereign-ai | 404 | /news |
| https://www.g42.ai/resources/news/assurance-compute-framework | 404 | /watchlist/g42 |
| https://www.g42.ai/resources/news/us-approval-advanced-ai-chip-exports-2026 | 404 | /watchlist/g42, /news |
| https://www.khaleejtimes.com/jobs/cooper-fitch-ai-future-of-talent-2027 | 404 | /news |
| https://www.khaleejtimes.com/uae/tii-plant-waste-gel-irrigation-water-solar-panels | 404 | /watchlist/tii, /news |
| https://www.mediaoffice.abudhabi/en/ainative-training-week-2026 | 404 | /news |
| https://www.middleeastainews.com/p/airev-intel-mou-gitex-2025 | 404 | /watchlist/airev, /news |
| https://www.tii.ae/leadership | 404 | /watchlist/tii |
| https://www.zawya.com/en/press-release/companies-news/supermicro-airev-certified-2025 | 404 | /watchlist/airev |
| https://www.zawya.com/en/press-release/companies-news/venturewave-airev-2025 | 404 | /watchlist/airev |
| https://www.agbi.com/tech/2026/09/abu-dhabi-companies-invest-in-us-startup-maven-robotics/ | 405 | /news, /radar |
| https://www.difc.com/whats-on/news/positron-ai-establishes-first-presence-outside-the-us-in-difc?trk=article-s | 429 | /news |
| https://finance.yahoo.com/technology/ai/articles/micropolis-robotics-brings-uae-developed-134900401.html | UND_ERR_HEADERS_OVERFLOW | /watchlist/dubai-police, /news, /radar |
| https://whiteshield.ai | UND_ERR_CONNECT_TIMEOUT | /watchlist/whiteshield |

### 2.8 Navigation adjacency list (internal targets reachable from each route's links/buttons/rail, 1440×900)

Every screen reaches the 11 rail destinations + `/overview` (brand) + `/methodology` (footer); listed below are the **additional** in-page targets.

```
/overview -> RAIL(11) + ['/watchlist/ai-data-authority', '/watchlist/core42', '/watchlist/g42', '/watchlist/inception', '/watchlist/khazna', '/watchlist/m42', '/watchlist/mbzuai', '/watchlist/micropolis', '/watchlist/tii']  (ext links: 5)
/watchlist -> RAIL(11) + ['/watchlist/adasi', '/watchlist/adnoc', '/watchlist/ai-data-authority', '/watchlist/ai71', '/watchlist/aiatc', '/watchlist/aiq', '/watchlist/airev', '/watchlist/analog', '/watchlist/aspire', '/watchlist/astra-tech', '/watchlist/atrc', '/watchlist/camb-ai', '/watchlist/cntxt', '/watchlist/core42', '/watchlist/daman', '/watchlist/dcai', '/watchlist/derq', '/watchlist/dff', '/watchlist/dge', '/watchlist/digital-dubai', '/watchlist/doh-abu-dhabi', '/watchlist/dubai-ai-campus', '/watchlist/dubai-police', '/watchlist/eand-enterprise', '/watchlist/echotwin', '/watchlist/edge', '/watchlist/endimension', '/watchlist/g42', '/watchlist/hub71', '/watchlist/ifm', '/watchlist/inception', '/watchlist/injazat', '/watchlist/katim', '/watchlist/khalifa-university', '/watchlist/khazna', '/watchlist/m42', '/watchlist/mbzuai', '/watchlist/mgx', '/watchlist/micropolis', '/watchlist/mubadala', '/watchlist/neuphonic', '/watchlist/positron', '/watchlist/presight', '/watchlist/purehealth', '/watchlist/saal-ai', '/watchlist/space42', '/watchlist/steerai', '/watchlist/tii', '/watchlist/whiteshield', '/watchlist/xpanceo']  (ext links: 0)
/watchlist/airev -> RAIL(11) + ['/watchlist/core42', '/watchlist/g42', '/watchlist/hub71']  (ext links: 16)
/watchlist/whiteshield -> RAIL(11) + []  (ext links: 10)
/watchlist/tii -> RAIL(11) + ['/watchlist/atrc', '/watchlist/edge', '/watchlist/micropolis', '/watchlist/steerai']  (ext links: 21)
/watchlist/dubai-police -> RAIL(11) + ['/watchlist/micropolis']  (ext links: 3)
/watchlist/purehealth -> RAIL(11) + ['/watchlist/daman']  (ext links: 5)
/watchlist/g42 -> RAIL(11) + ['/watchlist/adnoc', '/watchlist/aiq', '/watchlist/analog', '/watchlist/core42', '/watchlist/inception', '/watchlist/khazna', '/watchlist/m42', '/watchlist/mubadala', '/watchlist/presight']  (ext links: 25)
/watchlist/compare -> RAIL(11) + ['/watchlist/compare', '/watchlist/edge', '/watchlist/g42', '/watchlist/tii']  (ext links: 0)
/news -> RAIL(11) + ['/watchlist/adnoc', '/watchlist/ai-data-authority', '/watchlist/ai71', '/watchlist/airev', '/watchlist/atrc', '/watchlist/core42', '/watchlist/dcai', '/watchlist/derq', '/watchlist/dff', '/watchlist/dge', '/watchlist/digital-dubai', '/watchlist/doh-abu-dhabi', '/watchlist/dubai-ai-campus', '/watchlist/dubai-police', '/watchlist/eand-enterprise', '/watchlist/edge', '/watchlist/g42', '/watchlist/hub71', '/watchlist/ifm', '/watchlist/inception', '/watchlist/khazna', '/watchlist/m42', '/watchlist/mbzuai', '/watchlist/mgx', '/watchlist/micropolis', '/watchlist/mubadala', '/watchlist/positron', '/watchlist/presight', '/watchlist/purehealth', '/watchlist/saal-ai', '/watchlist/space42', '/watchlist/steerai', '/watchlist/tii', '/watchlist/xpanceo']  (ext links: 81)
/radar -> RAIL(11) + ['/watchlist/adnoc', '/watchlist/ai-data-authority', '/watchlist/airev', '/watchlist/atrc', '/watchlist/core42', '/watchlist/dcai', '/watchlist/dff', '/watchlist/dge', '/watchlist/doh-abu-dhabi', '/watchlist/dubai-police', '/watchlist/eand-enterprise', '/watchlist/edge', '/watchlist/g42', '/watchlist/inception', '/watchlist/khazna', '/watchlist/m42', '/watchlist/mbzuai', '/watchlist/mgx', '/watchlist/micropolis', '/watchlist/presight', '/watchlist/purehealth', '/watchlist/saal-ai', '/watchlist/space42', '/watchlist/steerai', '/watchlist/tii', '/watchlist/xpanceo']  (ext links: 64)
/graph -> RAIL(11) + []  (ext links: 0)
/sentiment -> RAIL(11) + []  (ext links: 0)
/chat -> RAIL(11) + []  (ext links: 0)
/chat-od -> RAIL(11) + []  (ext links: 0)
/briefing -> RAIL(11) + []  (ext links: 0)
/methodology -> RAIL(11) + []  (ext links: 0)
/artifacts -> RAIL(11) + []  (ext links: 0)
/docs/interactive-ui -> RAIL(11) + []  (ext links: 0)
/plugins -> RAIL(11) + []  (ext links: 0)
/settings -> RAIL(11) + []  (ext links: 0)
/this-route-does-not-exist -> RAIL(11) + []  (ext links: 0)
```

- **Orphan routes** (reachable only by typing the URL or via the ⌘K command palette): `/chat-od` (not linked anywhere; “port preview”), `/docs/interactive-ui` (⌘K entry only), `/watchlist/compare` (reached only through the Compare tray `router.push` after selecting 2–4 cards, or ⌘K; no static link), `/plugins` (does not exist → 404; ⌘K does not list it either).
- **Dead ends** (no onward links except the rail/footer): `/graph`, `/sentiment`, `/chat`, `/chat-od`, `/briefing`, `/methodology`, `/artifacts` (one CTA to /chat), `/settings`, `/docs/interactive-ui`, `/watchlist/whiteshield` (no related-org links). `/graph` offers click-to-inspect nodes but no `<a>` to the dossiers.
- **Loops / inconsistencies**: rail active state is correct on every rail route and on dossiers/compare (`match:"/watchlist"`); `/docs/interactive-ui` and `/chat-od` highlight nothing (no rail item) — acceptable but they also have no breadcrumb/parent, so the user has no cue where they are. No breadcrumb points to a non-existent parent because no breadcrumbs exist. The rail collapses itself on `/chat` (64 px) and stays collapsed (localStorage) when you navigate on — e.g. the `/chat-od` row shows 64 px because it inherited the chat preference; a user who visits /chat once keeps a 64 px rail everywhere afterwards until they expand it.

### 2.9 Ranked findings

| ID | Priority | Route(s) | Viewport(s) | Finding | Evidence | Proposed fix | Effort |
|---|---|---|---|---|---|---|---|
| F-01 | P0 | all routes (drawer) | 390×844 | Mobile navigation drawer (`role=dialog aria-modal=true`) does **not trap focus** and does **not manage focus**: focus stays on the hamburger when it opens, Tab walks through the 13 drawer links then escapes into the page behind the overlay (cta-briefing, watchlist-search, news-search, win-24h, copy-link…), and Escape / Close / overlay drop focus to `<body>` instead of returning it to the trigger. | §2.5 table (13/13 routes `focusTrapped=false`, `focusReturnedToTrigger=false`); nav-overview-390x844.png | `app/src/components/shell/nav-rail.tsx`: on `drawerOpen` move focus to the Close button (or first nav link), add a keydown Tab/Shift+Tab wrap inside `#rail-drawer` (or wrap the aside in Radix `Dialog`/`FocusScope` already available via @radix-ui), and on close `toggleRef.current?.focus()`. | S |
| F-02 | P0 | /watchlist/airev, /watchlist/whiteshield, /watchlist/tii, /watchlist/g42, /news, /radar | both | 16 external citation links return HTTP 404 (dead sources) — 4 of them on the AIREV dossier (Zawya VentureWave, Zawya Supermicro, Middle East AI News Intel MoU, GEC Newswire on-device agents), 2 on Whiteshield (`/people/fadi-farra`, `/ai-economics`), TII (`tii.ae/leadership`, Khaleej Times gel), G42 (Microsoft 2024 release, 2× g42.ai resources), Xpanceo Wikipedia, Computer Weekly, Khaleej Times Cooper Fitch, bis.gov, mediaoffice.abudhabi. | §2.7 table (status 404) | Re-verify each URL via the OnDemand research plugins; replace with the canonical URL or mark `source_unverified:true` in `orgs.json`/`news.json` so `SourceLink` renders the “source unverified” state instead of a 404 link. Add a weekly link-health job to the checkpoint workflow. | M |
| F-03 | P1 | /watchlist, /watchlist/airev | both | **AIREV is not at the top of the watchlist** (data index 20; rendered index 12 under the default “Most signals” sort) and renders with an initials monogram “A” (no logo asset in the repo). | §1.2, §1.5, nav-watchlist-1440x900.png, nav-watchlist-airev-1440x900.png | Add `priority: 1` (or `pinned: true`) to the AIREV record in `orgs.json`, sort by `priority` first in `watchlist-client.tsx` (line 19) and show a small “Priority dossier” chip; add official AIREV marks (`public/logos/uae/airev.svg` + `airev-dark.svg`, 512 px PNG fallbacks) and set `logos.json.airev.status="official"` with the source URL. | S |
| F-04 | P1 | /watchlist (50 cards), all dossiers | both | Logo quality: 44/50 organisations render initials monograms; the 6 “official” logos are favicon crops (16×16 positron, 32×32 g42/purehealth, 96×96 others) upscaled to 44/64 px, i.e. < 1× density and soft on retina. Not professional-grade. | §1.4 `logo_format_breakdown`, `logo_dimension_outliers`; nav-watchlist-1440x900.png | Source SVG/≥256 px PNG brand marks from each organisation's press/brand page (record URL + licence in `logos.json`), serve `srcSet` 1×/2×, keep the monogram only where no official mark exists; add a unit test that fails on any `/logos/uae/*.png` below 128 px. | L |
| F-05 | P1 | /artifacts | both | Primary rail screen with **0 data points** (empty state “no artifacts”, backend `not_provisioned`) plus 6–7 console errors from the missing `/assets/artifacts-ui/artifacts-header-256.webp`. | §2.3 row, nav-artifacts-1440x900.png | Either hide the rail item when `ARTIFACTS_API_URL` is empty (`src/lib/artifacts/server.ts:22`) or seed the namespace with the generated briefings/exports; fix the `<picture>` srcSet in `app/src/app/artifacts/page.tsx:13` to an existing asset (`/icons/artifacts/artifacts-header.png`). | S |
| F-06 | P1 | /chat | 1440×900 | CLS 0.1226 (> 0.1) on load: the rail collapses to 64 px after hydration (`primary-nav`, `rail-chats-collapsed`, `cmdk-hint`, `nav-toggle` shift at 656 ms) and `main-column` reflows (0.048 at 758 ms). 390×844 is fine (0.0076). | §2.3, chat shift sources list | Render the collapsed width on the server for `/chat` (read the localStorage preference in an inline script before paint, or default `--nav-w` to 64 px on the chat route via the `onChat` flag at SSR) so the rail does not jump. | M |
| F-07 | P1 | /chat-od | 1440×900 | Orphan “port preview” route with CLS 0.546 and 0 data points; textarea has no focus ring. | §2.3, nav-chat-od-1440x900.png | Remove `app/src/app/chat-od/page.tsx` from production (or gate behind `NODE_ENV!=='production'`/`notFound()`), or add it to the rail if it is intended. | S |
| F-08 | P1 | /briefing | 1440×900 | Scroll position is **not restored** on browser Back (3/3 samples: scrolled to 600, back → 0; /methodology control restores 300; 390×844 restores 586). | §2.3 history column; re-test log | The page content height is only reached after client mount (`BriefingClient` state), so Next restores scroll before the layout exists. Reserve the result column height (`min-h`) or render the last cron briefing server-side so the document height is stable at restoration time. | M |
| F-09 | P1 | /watchlist/[id], /watchlist/compare, /docs/interactive-ui, /chat-od | both | No breadcrumb anywhere; dossiers have only an eyebrow “WATCHLIST” link, compare/docs/chat-od have no parent cue. | §2.4 | Add a `Breadcrumb` (`nav aria-label="Breadcrumb"`) to `SectionHeader`/`PageHeader`: Watchlist › {org}, Watchlist › Compare, Methodology › Interactive UI. | S |
| F-10 | P1 | /graph | both | Thin DOM: the force-graph canvas carries the 105 nodes / 165 edges but nothing is in the DOM (data-density 1); the side panel is empty until a node is clicked and there are no `<a>` links to dossiers. | §2.3, nav-graph-1440x900.png | Pre-select a default node (e.g. G42) so the panel shows edges + sources on load, and render a “Top connected organisations” list with links under the canvas. | S |
| F-11 | P1 | /plugins | both | Route listed in the brief as existing returns the 404 screen (no `app/src/app/plugins/page.tsx`); not linked anywhere. | §2.3 | Either drop `/plugins` from the brief or add a page listing `plugin-catalogue.json` (Settings already renders the toggles). | S |
| F-12 | P2 | /sentiment, /settings, /docs/interactive-ui, 404, dossiers | both | Focus ring colour animates from the control's text colour to #2563EB (~150 ms) because `transition-colors` includes `outline-color`; on the dark 404 CTA the ring starts white-on-white. | §2.6 measurements | Add `outline-color` exclusion: `transition-property: color, background-color, border-color` for `.chip`, buttons and links, or `:focus-visible { transition: none }` in globals.css. | S |
| F-13 | P2 | /chat | 1440×900 | First Tab from a fresh load lands on the voice-mic button, second on `<body>` (composer autofocus sets the sequential focus start point at the end of the document). | §2.6 | Keep autofocus but move the skip-link before the composer in DOM order or add `tabindex=-1` sentinel; or do not autofocus on initial load. | S |
| F-14 | P2 | all | 1440×900 | Rail-collapse preference set by `/chat` persists to every other route (localStorage), so after visiting chat once every page shows the 64 px rail. | §2.8 | Scope the preference per route group (`uae-rail:chat` vs `uae-rail:pages`). | S |
| F-15 | P2 | /watchlist/compare | both | Only 12 table rows for 3 default orgs; reachable only via the Compare tray / ⌘K. | density table | Add news-count, sentiment split, latest timeline event rows; add a “Compare” link on `/watchlist` header. | S |

No P0 navigation breaks were found in the internal graph: every internal link resolves, every deep link reloads with the same H1 and 0 hydration errors, rail widths are 224/64 px and the drawer 280 px as specified, and route-change latency is ≤ 371 ms everywhere (max /chat 371 ms, /settings 338 ms).

### 2.10 Data-density table (ascending — thinnest first)

Counting rule (visible elements inside `[data-testid=chat-main]`): cards/articles + `tbody tr` + `li` + `svg circle` + chart lines/bars + `dd` fields + numeric KPI leaves. Images, headings and links are reported but not summed. Canvas pixels are not countable — `/graph` is flagged.

| route | vp | data points | breakdown |
|---|---|---|---|
| /artifacts | 1440 | 0 | images 2, links_in_main 1 |
| /artifacts | 390x | 0 | images 2, links_in_main 1 |
| /chat-od | 1440 | 0 | nothing countable |
| /chat-od | 390x | 0 | nothing countable |
| /graph | 1440 | 1 | cards_articles 1 — canvas: 105 nodes / 165 edges drawn (5,789 non-white samples of 838×600), 13 legend buttons |
| /graph | 390x | 1 | cards_articles 1 — canvas: 105 nodes / 165 edges drawn (5,789 non-white samples of 838×600), 13 legend buttons |
| /plugins | 1440 | 1 | cards_articles 1, images 1, links_in_main 2 |
| /plugins | 390x | 1 | cards_articles 1, images 1, links_in_main 2 |
| /this-route-does-not-exist | 1440 | 1 | cards_articles 1, images 1, links_in_main 2 |
| /this-route-does-not-exist | 390x | 1 | cards_articles 1, images 1, links_in_main 2 |
| /watchlist/compare | 1440 | 13 | cards_articles 1, table_rows 12, images 1, links_in_main 8 |
| /watchlist/compare | 390x | 13 | cards_articles 1, table_rows 12, images 1, links_in_main 8 |
| /docs/interactive-ui | 1440 | 24 | cards_articles 3, table_rows 15, list_items 5, svg_circles_bubbles 1, headings_h2_h3 3, links_in_main 1 |
| /docs/interactive-ui | 390x | 24 | cards_articles 3, table_rows 15, list_items 5, svg_circles_bubbles 1, headings_h2_h3 3, links_in_main 1 |
| /briefing | 1440 | 27 | cards_articles 3, list_items 24, headings_h2_h3 6, images 1 |
| /briefing | 390x | 27 | cards_articles 3, list_items 24, headings_h2_h3 6, images 1 |
| /watchlist/dubai-police | 1440 | 27 | cards_articles 10, list_items 9, dossier_dd_fields 7, kpi_numbers 1, headings_h2_h3 9, links_in_main 12 |
| /watchlist/dubai-police | 390x | 27 | cards_articles 10, list_items 9, dossier_dd_fields 7, kpi_numbers 1, headings_h2_h3 9, links_in_main 12 |
| /methodology | 1440 | 29 | cards_articles 4, list_items 16, dossier_dd_fields 9, headings_h2_h3 4 |
| /methodology | 390x | 29 | cards_articles 4, list_items 16, dossier_dd_fields 9, headings_h2_h3 4 |
| /watchlist/whiteshield | 1440 | 37 | cards_articles 10, list_items 19, dossier_dd_fields 7, kpi_numbers 1, headings_h2_h3 9, links_in_main 32 |
| /watchlist/whiteshield | 390x | 37 | cards_articles 10, list_items 19, dossier_dd_fields 7, kpi_numbers 1, headings_h2_h3 9, links_in_main 32 |
| /watchlist/purehealth | 1440 | 38 | cards_articles 10, list_items 20, dossier_dd_fields 7, kpi_numbers 1, headings_h2_h3 9, images 1, links_in_main 30 |
| /watchlist/purehealth | 390x | 38 | cards_articles 10, list_items 20, dossier_dd_fields 7, kpi_numbers 1, headings_h2_h3 9, images 1, links_in_main 30 |
| / | 1440 | 40 | cards_articles 12, list_items 28, headings_h2_h3 6, images 3, links_in_main 26 |
| / | 390x | 40 | cards_articles 12, list_items 28, headings_h2_h3 6, images 3, links_in_main 26 |
| /settings | 1440 | 44 | cards_articles 4, list_items 40, headings_h2_h3 5, images 18 |
| /settings | 390x | 44 | cards_articles 4, list_items 40, headings_h2_h3 5, images 18 |
| /chat | 1440 | 52 | cards_articles 1, list_items 51, headings_h2_h3 6, images 28 |
| /chat | 390x | 53 | cards_articles 1, list_items 52, headings_h2_h3 6, images 28 |
| /watchlist/airev | 1440 | 64 | cards_articles 10, list_items 47, dossier_dd_fields 7, headings_h2_h3 9, links_in_main 64 |
| /watchlist/airev | 390x | 64 | cards_articles 10, list_items 47, dossier_dd_fields 7, headings_h2_h3 9, links_in_main 64 |
| /watchlist/tii | 1440 | 67 | cards_articles 10, list_items 49, dossier_dd_fields 7, kpi_numbers 1, headings_h2_h3 9, links_in_main 62 |
| /watchlist/tii | 390x | 67 | cards_articles 10, list_items 49, dossier_dd_fields 7, kpi_numbers 1, headings_h2_h3 9, links_in_main 62 |
| /watchlist/g42 | 1440 | 73 | cards_articles 10, list_items 55, dossier_dd_fields 7, kpi_numbers 1, headings_h2_h3 9, images 1, links_in_main 68 |
| /watchlist/g42 | 390x | 73 | cards_articles 10, list_items 55, dossier_dd_fields 7, kpi_numbers 1, headings_h2_h3 9, images 1, links_in_main 68 |
| /radar | 1440 | 126 | cards_articles 3, table_rows 13, list_items 93, svg_circles_bubbles 17, headings_h2_h3 3, links_in_main 129 |
| /radar | 390x | 126 | cards_articles 3, table_rows 13, list_items 93, svg_circles_bubbles 17, headings_h2_h3 3, links_in_main 129 |
| /watchlist | 1440 | 201 | cards_articles 50, list_items 50, svg_circles_bubbles 101, images 6, links_in_main 50 |
| /watchlist | 390x | 201 | cards_articles 50, list_items 50, svg_circles_bubbles 101, images 6, links_in_main 50 |
| /news | 1440 | 220 | cards_articles 112, list_items 108, links_in_main 237 |
| /news | 390x | 220 | cards_articles 112, list_items 108, links_in_main 237 |
| /sentiment | 1440 | 319 | cards_articles 5, table_rows 3, list_items 37, svg_circles_bubbles 274, headings_h2_h3 4 |
| /sentiment | 390x | 319 | cards_articles 5, table_rows 3, list_items 37, svg_circles_bubbles 274, headings_h2_h3 4 |

**Three thinnest primary screens and what should populate them**
1. `/artifacts` (0): show the generated artefacts of the namespace — the 06:30 GST briefing PDFs/Markdown from workflow 6ad7f32e5e60695bc4d052d2, dossier exports and chat attachments — or remove the rail item until `ARTIFACTS_API_URL` is provisioned.
2. `/graph` (1 DOM point; canvas only): pre-populate the inspector with a default node (G42: 9 subsidiaries/holdings) and add a DOM list of the top-10 highest-degree organisations with edge counts and dossier links so screen readers and the density count see the 165 relationships.
3. `/watchlist/compare` (13) / `/briefing` (27): compare should add per-org news count, sentiment class split and latest timeline event rows; briefing should render the last cron-generated briefing (with its citations and Verified/Interpretation split) on load instead of an empty result column until “Generate briefing” is pressed.
(`/chat-od` at 0 is a dev-only port preview — remove rather than populate.)

### 2.11 Screenshots

44 full-page screenshots written to the session workspace folder `nav-audit-screenshots/` (outside the repo) and uploaded as this turn's generated files: nav-artifacts-1440x900.png, nav-artifacts-390x844.png, nav-briefing-1440x900.png, nav-briefing-390x844.png, nav-chat-1440x900.png, nav-chat-390x844.png, nav-chat-od-1440x900.png, nav-chat-od-390x844.png, nav-docs-interactive-ui-1440x900.png, nav-docs-interactive-ui-390x844.png, nav-graph-1440x900.png, nav-graph-390x844.png, nav-methodology-1440x900.png, nav-methodology-390x844.png, nav-news-1440x900.png, nav-news-390x844.png, nav-overview-1440x900.png, nav-overview-390x844.png, nav-plugins-1440x900.png, nav-plugins-390x844.png, nav-radar-1440x900.png, nav-radar-390x844.png, nav-sentiment-1440x900.png, nav-sentiment-390x844.png, nav-settings-1440x900.png, nav-settings-390x844.png, nav-this-route-does-not-exist-1440x900.png, nav-this-route-does-not-exist-390x844.png, nav-watchlist-1440x900.png, nav-watchlist-390x844.png, nav-watchlist-airev-1440x900.png, nav-watchlist-airev-390x844.png, nav-watchlist-compare-1440x900.png, nav-watchlist-compare-390x844.png, nav-watchlist-dubai-police-1440x900.png, nav-watchlist-dubai-police-390x844.png, nav-watchlist-g42-1440x900.png, nav-watchlist-g42-390x844.png, nav-watchlist-purehealth-1440x900.png, nav-watchlist-purehealth-390x844.png, nav-watchlist-tii-1440x900.png, nav-watchlist-tii-390x844.png, nav-watchlist-whiteshield-1440x900.png, nav-watchlist-whiteshield-390x844.png


## 3. Command log (UTC)

Every shell step of this audit, in order. Secrets were never printed (`.env` keys were listed with values redacted; the OnDemand key went only into the sandbox's `.env.local`).

```
2026-10-22T02:32:30Z [audit-start] ls -la; find prior -type f | head -50
2026-10-22T02:32:40Z cd oda-productivity-suite && git rev-parse HEAD && git status --porcelain | head && git branch -a | head && git log --oneline -5 && git tag
2026-10-22T02:33:03Z git status --porcelain (full); ls app; check node_modules/chromium
2026-10-22T02:34:25Z git checkout --detach 6f6254b; git rev-parse HEAD; git status --porcelain --untracked-files=no; git status --porcelain | wc -l
2026-10-22T02:34:38Z inspect app/.env key names only; ls .env*; which sandbox; grep env refs
2026-10-22T02:34:49Z du -sh app subdirs; check ONDEMAND key env presence (names only)
2026-10-22T02:35:26Z [deploy] sandbox create --runtime node22 --timeout 90m --publish-port 5173
2026-10-22T02:35:26Z [deploy] tar czf /tmp/uaecc.tgz --exclude=node_modules --exclude=.next --exclude=playwright-report --exclude=qa --exclude=proof --exclude=test-results --exclude=tests --exclude=e2e --exclude=tsconfig.tsbuildinfo .
2026-10-22T02:35:28Z [deploy] sandbox copy app.tgz + .env.local (sandbox-only, key never printed)
2026-10-22T02:35:30Z [deploy] sandbox exec: tar xzf && npm ci --ignore-scripts && npm run build && npm run start (port 5173)
2026-10-22T02:35:39Z [laneA] ls src/data/uae_cc_v1 public/logos public/brand; wc -c data files
2026-10-22T02:35:46Z [laneA] ls public/logos/uae; head of orgs.json/index.json/logos.json; ls src/lib/uae
2026-10-22T02:35:53Z [laneA] python3 inspect orgs.json structure (meta, organizations keys, first org)
2026-10-22T02:35:59Z [laneA] ls src/lib/uae src/app/watchlist src/components; rg watchlist ordering + logo component
2026-10-22T02:36:03Z [laneA] cat src/lib/uae/data.ts (first 200 lines), watchlist page, logo component grep
2026-10-22T02:36:09Z [laneA] read watchlist-client.tsx sort logic + logo rendering (bits.tsx OrgLogo), rg object-fit
2026-10-22T02:36:14Z [laneA] grep -n sort/logo in watchlist-client.tsx, bits.tsx, [id]/page.tsx
2026-10-22T02:36:20Z [laneA] sed watchlist-client.tsx lines 1-45; grep RESEARCH_COVERAGE.md header + table rows
2026-10-22T02:36:57Z [laneA] python3 roster builder (orgs.json + logos.json + news/sentiment/hf counts + PIL identify of public/logos/uae/*.png) -> /tmp/roster.json
2026-10-22T02:37:11Z [laneA] find repo image files matching airev|ondemand|on-demand (case-insens) + identify; grep ondemand.svg refs
2026-10-22T02:37:19Z [laneA/B] cat public/plugins/ondemand.svg; find src/app page.tsx routes; grep nav rail items in components/shell
2026-10-22T02:37:27Z [laneB] cat next.config.ts (redirects/rewrites); grep data-testid in shell nav-rail/page-frame/page-header; not-found.tsx
2026-10-22T02:37:27Z [deploy] health=200
2026-10-22T02:38:34Z [laneB] curl preview /health, /overview (status + B Capital residue grep), /this-route-does-not-exist status
2026-10-22T02:38:56Z [laneB] inspect prior qa tools for playwright launch pattern (qa/2026-10-22-cycle8/tools)
2026-10-22T02:40:19Z [laneB] grep watchlist card link pattern, plugins route existence, .gitignore docs
2026-10-22T02:42:13Z [laneB] BASE_URL=https://sb-533wny9yw6fw.vercel.run OUT_DIR=/tmp/crawl SHOT_DIR=$WD/nav-audit-screenshots setsid node /tmp/crawl.mjs (playwright-core 1.64 + /usr/bin/chromium, headless, own process group, 25 min cap)
2026-10-22T02:43:11Z [laneA] grep RESEARCH_COVERAGE.md for per-org coverage table / mean; grep MISSION_STATE.json coverage; check AIREV legal_name/sector fields and org 'sector' field names
2026-10-22T02:43:22Z [laneA] sed bits.tsx OrgLogo lines 5-10 (initials rule); brand/logo.tsx; identify brand marks
2026-10-22T02:45:35Z [laneB] progress check: tail crawl log; python3 summary of partial crawl.json
2026-10-22T02:45:44Z [laneB] inspect eco-graph.tsx rendering (canvas vs svg) and graph.json node/edge counts; sentiment page chart element
2026-10-22T02:45:50Z [laneB] sed eco-graph.tsx lines 1-40 (force-graph canvas, legend, stats testids)
2026-10-22T02:48:51Z [laneB] sed nav-rail.tsx lines 40-200 (drawer open-state model, escape/overlay/focus handling) to design a correct drawer probe
2026-10-22T02:51:13Z [laneB] inspect /artifacts console errors + /chat-od + graph density details from partial crawl; check artifacts page env guard
2026-10-22T02:56:46Z [laneB] crawl finished (44 screens). Start drawer probe (node /tmp/drawer.mjs) and dead-link check (node /tmp/links.mjs) in parallel
2026-10-22T02:57:03Z [laneB] python3 analysis of crawl.json: per-screen table, tab stops, history, reload, CLS, latency
2026-10-22T02:57:18Z [laneB] python3: non-blue focus stops, link inventory per route, adjacency list; check drawer/links progress
2026-10-22T02:58:31Z [laneB] collect drawer.json + links.json results
2026-10-22T02:58:44Z [laneB] curl /api/artifacts (status) to explain /artifacts console 404s; curl /graph html for node/edge counts; density breakdown dump
2026-10-22T02:58:53Z [laneB] identify the 404 sub-resources on /artifacts and the 404 page (img/src + fetch targets via curl)
2026-10-22T02:59:06Z [laneB] playwright one-off: list sub-requests returning >=400 on /artifacts and /this-route-does-not-exist
2026-10-22T02:59:29Z [laneB] grep artifacts-header asset reference; ls public/assets
2026-10-22T02:59:36Z [laneB] grep briefing-client for focus/scroll side effects; route-effects.tsx scroll handling; chat CLS source (plan-empty-state / inspector)
2026-10-22T02:59:52Z [laneB] grep focus/outline classes on sentiment win-* / class-filter buttons, settings plugin-toggle, button.tsx, chips.css :40
2026-10-22T03:00:10Z [laneB] grep className of win-*/playback/class-filter buttons (sentiment), plugin-toggle (settings), not-found Buttons, docs 'Open chat' for outline classes
2026-10-22T03:00:36Z [laneB] playwright one-off: focus ring colour of content chips/buttons at 1440 (sentiment win-24h, settings plugin-toggle, 404 CTA) + matching CSS rule
2026-10-22T03:01:04Z [laneB] inspect tokens.css --ring scopes (lines 1-30, 195-210, 245-260) and the :where(a,button…) focus rule origin
2026-10-22T03:01:22Z [laneB] playwright one-off: enumerate CSS rules setting outline-* that match the sentiment win-24h button (root cause of grey ring)
2026-10-22T03:01:39Z [laneB] playwright one-off: re-read outline colour 0ms vs 400ms after focus (transition-colors animates outline-color) for win-24h, class-filter, 404 CTA, settings Test connection
2026-10-22T03:02:45Z [laneB] playwright one-off: re-test /briefing scroll restoration x3 at 1440; /graph canvas pixel check; dossier in-main back link; /chat CLS shifting elements
2026-10-22T03:04:14Z [laneB] git log --oneline -3 -- app/src/app/plugins (was /plugins ever a route?); playwright one-off: 390 /methodology tab sequence detail (BODY stops) 
2026-10-22T03:04:41Z [laneB] python3: drawer.json detail (tab sequence while open, focus escape target, close paths)
2026-10-22T03:04:57Z [laneB] playwright one-off: clean focus-return test — open drawer, Tab x3 (inside), Escape, read activeElement; same for close button
2026-10-22T03:06:28Z [laneA] python3 finalise roster (strict linkedin company-URL rule, coarse sector buckets, SOE list) -> /tmp/roster_final.json
2026-10-22T03:06:41Z [laneA] python3: print ownership strings of type=company orgs to derive SOE classification; fix 'unavailable' placeholders -> null
2026-10-22T03:07:05Z [laneA] python3: finalise roster v2 — 'unavailable' placeholders -> null, type rules (gov/SOE/startup/subsidiary/other/unknown) from ownership text, recompute stats
2026-10-22T03:08:00Z [laneA] python3: logos.json entry for airev + status counts; identify .media concept marks (not repo files)
2026-10-22T03:09:10Z [laneB] grep autoFocus/useEffect mount behaviour in briefing-client.tsx + briefing page (scroll-restoration root cause); grep voice-mic autofocus in chat composer
2026-10-22T03:09:15Z [laneB] sed briefing-client.tsx lines 11-30 (initial fetch / loading state) and briefing page.tsx; sed voice-dock.tsx 195-215 (mic tabindex)
2026-10-22T03:13:01Z [report] python3 build docs/NAVIGATION_AUDIT_20261022.md (repo root docs/, untracked) from /tmp/roster_final.json, /tmp/crawl/{crawl,drawer,links,adj}.json + /tmp/cmdlog.txt
2026-10-22T03:13:20Z [final] git rev-parse HEAD; git status --porcelain --untracked-files=no; git status --porcelain | grep -v '^?? app/proof/'; git rev-parse main origin/main + 5 protected tags; git log origin/uae-ai-command-centre -1; git stash list; git reflog -3
2026-10-22T03:13:20Z [final] verification complete
```

### 3.1 Scripts executed (kept in /tmp, not in the repo)
- `/tmp/deploy.sh` — sandbox create → tar (excl. node_modules/.next/qa/proof/tests/e2e/playwright-report) → copy → `npm ci --ignore-scripts` → `npm run build` → `npm run start` → `/health` poll.
- `/tmp/crawl.mjs` — 44-screen crawl (page probe, CLS observer, screenshots, 15 tab stops, reload, back/forward scroll, drawer quick-check, 3× latency).
- `/tmp/drawer.mjs` — 13-route drawer focus/close probe.
- `/tmp/links.mjs` — HEAD/GET of 225 unique hrefs.
- `/tmp/req404.mjs`, `/tmp/ring.mjs`, `/tmp/ring2.mjs`, `/tmp/ring3.mjs`, `/tmp/extra.mjs`, `/tmp/tab390.mjs`, `/tmp/focusret.mjs` — targeted re-tests quoted above.
