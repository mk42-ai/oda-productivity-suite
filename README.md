# ODA Productivity Suite




AI productivity product for the **UAE Office of Development Affairs (ODA), Abu Dhabi** — powered entirely by **OnDemand APIs** on `predefined-gpt-5.6-sol` with `reasoningEffort: medium` (the "gpt-5.6-sol-medium" policy — every model call, no fallbacks).

**Features (8):** Deck builder · One-pager summary · Problem Solve (7-step MBB flow) · Benchmark · Translate (EN → Emirati Arabic) · Media/WAM comms · Action Titles · Country Data (World Bank/WHO/UN SDG with citations).

**Stack:** thin Node/Express backend (SSE streaming passthrough with thinking-vs-answer token channels, PPTX/XLSX/DOCX/PDF exports) + Vite/React single-page frontend (white minimal ChatGPT-like UI, 280px sidebar, routing trace cards, guided document wizard with live preview). See `app/ARCHITECTURE.md` for the full feature→plugin map, FAST/FULL mode logic, and verify gate.

## Quick start

```bash
# 1. Clone
git clone https://github.com/mk42-ai/oda-productivity-suite.git
cd oda-productivity-suite/app

# 2. Configure secrets (env vars only — never hardcode keys)
cp .env.example .env
#    edit .env and set: ONDEMAND_API_KEY=<your OnDemand API key>

# 3. Install
npm install

# 4. Build the frontend (production)
npm run build        # = vite build → dist/

# 5. Run the server (serves API + built SPA)
node server/index.js # listens on 0.0.0.0:8080
```

Open http://localhost:8080 — health check at `GET /api/health` should return `{"ok":true,...,"keyLoaded":true}`.

## Redeploying

Any Node 22+ host works:

- **Vercel Sandbox:** create a sandbox (`--runtime node22 --publish-port 8080`), copy this repo in, `npm install && npm run build`, then start `node server/index.js` with `ONDEMAND_API_KEY` set in the environment.
- **Vercel serverless:** `vercel.json` maps `/api/*` → `server/index.js` and everything else → static `dist/`.
- **Any VM/container:** install Node 22, follow Quick start; put `ONDEMAND_API_KEY` in the process environment.

## Environment variables

| Var | Required | Purpose |
|---|---|---|
| `ONDEMAND_API_KEY` | yes | OnDemand platform API key (sent as `apikey` header, server-side only) |
| `ONDEMAND_BASE_URL` | no | default `https://api.on-demand.io` |
| `PORT` | no | default `8080` |

`.env` is gitignored; only `.env.example` (empty placeholders) is committed.
