# ARCHITECTURE_MAP — UAE AI National Intelligence Command Centre (concept)

## Lineage
- **Original (canonical):** `mk42-ai/oda-productivity-suite` @ `816aaaed9c3aa8fa37fbad31d3bd3f7491b3de9d` (branch `fix/news-summary-rewrite-live-verify-20261020`, 2026-10-20T10:04:05Z, 53 commits ahead of `main`). It was a two-service Vercel Services app:
  `bcapital-portfolio-intelligence/` (Hono + Drizzle ORM + SQLite via sql.js, OnDemand Flow Builder workflows) + `bcapital-portfolio-intelligence/web/` (Next.js 15).
  Its Vercel project `bcapital-portfolio-intelligence-8zsb` has failed every git deploy since 2026-10-18 with `MISSING_SERVICES`; the last READY build is `-miu2fubxg` (2026-10-13).
- **Rollback tag:** `bcap-pre-uae-20261020T2130Z` → 816aaae (created locally; push pending a GitHub token).
- **New branch:** `uae-ai-command-centre`. The original branches, the Hono API, its SQLite databases and Vercel projects were **not modified**. On this branch the web tier was moved to `uae-ai-command-centre/` and the previous tenant's API, data, archives, docs and evidence were removed from the tree (no destructive change to any database: a fresh namespace is used instead).

## Runtime
Single Next.js 15 (App Router) project, React 19, Tailwind 4, one `package.json`, one port. No framework swap.

## Routes
| Route | Type | Source |
|---|---|---|
| `/` → `/overview` | redirect | next.config.ts |
| `/overview` | static | `src/app/overview/page.tsx` |
| `/watchlist`, `/watchlist/[id]` (50 SSG), `/watchlist/compare` | static / SSG / dynamic | `src/app/watchlist/**`, `src/components/uae/watchlist-client.tsx` |
| `/sentiment` | dynamic (`?org=`) | `src/components/uae/sentiment-universe.tsx` (SVG, t-SNE coordinates precomputed) |
| `/news`, `/radar`, `/graph` | static / dynamic | `news-client.tsx`, radar SVG, `eco-graph.tsx` (react-force-graph-2d) |
| `/chat` | preserved | `components/chat/open-intelligent-ui/chat-shell.tsx` (virtualized thinking/activity, rAF-coalesced stream store, ScrollAnchor, run rail, RunFailureNotice) |
| `/briefing` | client + API | `briefing-client.tsx` → `POST /api/briefing` |
| `/methodology`, `/settings`, `/artifacts`, `/docs/interactive-ui`, `/chat-od` | static | preserved/rewritten |

## APIs (route handlers)
| Path | Purpose |
|---|---|
| `POST /api/chat` (+ `/prewarm`, `/creds`, `/artifact`) | Preserved SSE bridge → OnDemand `POST /chat/v1/sessions` + `/query` (responseMode stream), AG-UI frames, honest RUN_ERROR path |
| `/api/ondemand/[...path]` | Allow-listed proxy (sessions/query/messages, plugin list); forwards `x-ondemand-key` from Settings |
| `/api/od-chat/sessions*` | Raw SSE relay for `/chat-od` |
| `POST /api/briefing` | National AI Briefing agent (sync query, optional Perplexity) |
| `GET /api/uae/orgs` | Watchlist index (⌘K) |
| `GET /health` | Namespace counts + whether a server key is configured (never the value) |
| `/api/plugins`, `/api/media*`, `/api/artifacts*`, `/api/voice/*`, `/api/img`, `/api/favicon` | Preserved; artifact store reports `not_provisioned` (no store for this namespace) |

## Data ("database")
Fresh namespace **`uae_cc_v1`**, versioned JSON in `src/data/uae_cc_v1/`: `orgs.json` (50 dossiers), `sentiment.json` (159), `news.json` (91), `graph.json` (99 nodes / 161 edges), `hf.json` (153 models), `radar.json` (12 blips), `logos.json` (logo provenance), `digest.json` (chat retrieval index), `index.json`. No SQLite/DB writes; the old `portfolio.sqlite` / `social-native.sqlite` are untouched on their branches.

## Agents / OnDemand
| Agent role | Implementation |
|---|---|
| Org intel + source verification | `/tmp` pipeline (documented in mission/): one sessions/query per org over the research corpus; URL verification against corpus |
| News retrieval + relationship mapping | sessions/query per corpus chunk → events, radar ring, edges |
| Sentiment ingestion + entity extraction | sessions/query per chunk → attributable statements + location evidence |
| Topic classification | sessions/query batches of 20 → 7 classes, confidence, topic cluster |
| Executive chat | `/api/chat` bridge + `context-payload.ts` retrieval, Perplexity `plugin-1722260873` pinned |
| Briefing generator | `/api/briefing` |
Model: `predefined-gpt-5.6-luna` (single model, no fallback chain). Disabled ids: `plugin-1785777296`, `plugin-1791713636`.

## Workflows / connectors
Agents Flow Builder API verified reachable (`GET /automation/api/workflow/` 200); the previous tenant's workflow JSON files were removed from this branch. Voice workflow route kept, disabled until `VOICE_WORKFLOW_ID` is set.

## Visualisations
Sentiment Universe (SVG bubbles, playback), class bars, radar (SVG), force graph (canvas), compare table, timelines.

## Identity
`public/brand/uae/*` (concept lockups, mark, section art, retina @2x, OG card); palette tokens in `src/styles/tokens.css` (`--uae-*`, light + `html.dark`); persistent `DisclaimerBar`; no government logo.
