# UAE AI National Intelligence Command Centre — Concept Demonstration

> **Concept Demonstration — not an official government system.** No government logo, emblem or endorsement is used or implied
> (identity check: `OFFICIAL_ASSET_NOT_PERMITTED / NOT_FOUND`).

Next.js 15 (App Router) app that fuses public-source signals about the UAE AI ecosystem into one command view. Demo window: 2026-10-21 09:00–09:30 GST.

| Route | Surface |
|---|---|
| `/overview` | National Overview — KPIs, National Pulse (with sampling disclaimer), latest signals, radar snapshot |
| `/watchlist` | 50 organisation cards (company / government / university / research centre / subsidiary) — search, filter, sort, compare tray |
| `/watchlist/[id]` | Dossier — source-backed briefing with [n] citations, key facts, leadership, technology map, related orgs, timeline, sentiment, news, sources, confidence, unavailable markers |
| `/watchlist/compare?ids=a,b,c` | Side-by-side comparison (≤4) |
| `/sentiment` | Sentiment Universe — size = volume, colour = 7-class, position = semantic similarity (t-SNE), border = confidence; 24h/7d/30d playback; hover evidence; click-through; topic/org/class filters; explicit-UAE-only geography |
| `/news` | News Intelligence feed |
| `/radar` | Technology & Innovation Radar + HuggingFace open-model signals |
| `/graph` | Ecosystem Relationship Graph (react-force-graph-2d) |
| `/chat` | Executive Intelligence Chat (preserved OnDemand streaming chat; grounded on the watchlist digest; verified-facts vs interpretation) |
| `/briefing` | National AI Briefing generator (live OnDemand session) |
| `/methodology` | Provenance, pipeline, limitations |
| `/settings` | ONDEMAND SETTINGS (browser-only key override, plugin list) |
| `/artifacts`, `/docs/interactive-ui`, `/chat-od` | Preserved |

## Data
Fresh namespace **`uae_cc_v1`** in `src/data/uae_cc_v1/*.json` — orgs, sentiment, news, graph, hf, radar, logos, digest. Every record carries provenance; URLs not present in the research corpus were removed.

## OnDemand
All AI calls go to `https://api.on-demand.io` with the server-side `ONDEMAND_API_KEY` (`apikey` header): `POST /chat/v1/sessions`, `POST /chat/v1/sessions/{id}/query` (endpoint `predefined-gpt-5.6-luna`, pinned plugin `plugin-1722260873` Perplexity). Failures are surfaced verbatim (red failure state) — never substituted.

## Run
```bash
npm ci && npm run build && npm run start   # needs ONDEMAND_API_KEY in .env (see .env.example)
node scripts/uae/residual-scan.mjs --base http://localhost:5173   # residual scan: code + DOM + network
```
