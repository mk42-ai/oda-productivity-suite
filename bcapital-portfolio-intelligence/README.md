# B Capital Portfolio Intelligence (B Social)

Full-stack portfolio-intelligence product for B Capital: a **Hono + Drizzle** API with a **libSQL/SQLite** durable
persistence layer (`src/`), and a **Next.js 15** web app (`web/`) with the **B Social** feed, companies, news, artifacts,
settings and the OnDemand-powered analyst chat. This folder is the exact workspace state deployed on **2026-10-12**.

| Item | Value (2026-10-12) |
|---|---|
| Live web preview (ephemeral Vercel sandbox, ~90 min lifetime) | https://sb-5hqcgtokrkpx.vercel.run |
| Live API preview (ephemeral Vercel sandbox) | https://sb-18nwgatzh19k.vercel.run |
| Dataset served by the preview | **10,445 verified + 221 unverified** social posts (10,666 visible, 1,162 hidden legacy rows) — X 7,443 · Reddit 3,035 · LinkedIn 154 · Instagram 34 |
| Restore source | OnDemand Media snapshot `b-social-snapshot-20261012T201459Z` (SHA-256 `9c03982f5fabd9d45bb466391355da2849d952335c2996ae53959b531b008890`, verified on boot) |
| Earlier previews (stopped, do not reuse) | sb-4ca7g757s44l.vercel.run, sb-4gifn0i22x3l.vercel.run |

## Repository layout

| Path | Purpose |
|---|---|
| `src/` | Hono API: companies / news / sentiment / PitchBook / artifacts / social feed (`/social/feed`, `/data/social-feed`), ingestion + refresh pipelines |
| `src/persist/` | Durable B Social store: `store.ts` (libSQL client, Drizzle migrations, OnDemand Media backup/restore), `boot.ts` (boot-time restore guard), `feed.ts` (read model + idempotent upserts), `schema.ts` |
| `drizzle-persist/` | Migrations for the durable store (posts keyed on `native_id + platform`, takeaways, companies, people, sectors, sources, worker_runs, ingestion_receipts, backups, meta) |
| `drizzle/`, `src/db/` | Legacy sql.js portfolio DB (companies, news, sentiment) |
| `web/` | Next.js 15 app (App Router). B Social UI lives in `web/src/components/social/` (`parts/*` modules + `styles/*.css`); outbound-link policy in `web/src/lib/outbound.ts` |
| `web/src/components/chat/**`, `web/src/components/od-chat/**`, `web/src/app/api/social/ask/` | Chat / Ask B Social — **unchanged** in the 2026-10-12 wrap-up |
| `scripts/` | Contract tests (`contract-test.ts`), persistence tests (`persistence/`), social collectors, seed/migrate utilities |
| `docs/turn6/` | 50-agent UI/QA pass (2026-10-12): per-agent notes, `report.json`, `dispatch.json` |
| `workflows/` | OnDemand Flow Builder workflow definitions (daily refresh, PitchBook weekly, daily durable backup) |
| `vercel.json` | Vercel Services layout: service `app` (Hono, root `.`) + service `web` (Next.js, root `web`), `/backend/*` rewrite |

## Environment variables

Never commit real values — `.env`, `.env.local` and `web/.env*` are git-ignored. Copy `.env.example` → `.env` and
`web/.env.example` → `web/.env`.

### Backend (`.env` at the app root)

| Variable | Required | Purpose |
|---|---|---|
| `ONDEMAND_API_KEY` | yes | OnDemand `apikey` used server-side for the Chat API (refresh pipeline, Ask B Social), the Media API (snapshot backup/restore) and workflow relays |
| `ONDEMAND_BASE_URL` | no (default `https://api.on-demand.io`) | OnDemand API base |
| `INGEST_SECRET` | yes | Shared secret for `POST /ingest`, `GET /persistence/export`, `GET /persistence/backups`, `POST /persistence/backup`, `POST /persistence/sync` (header `X-Ingest-Secret`, Basic auth or `?secret=`) |
| `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` | optional | Hosted libSQL (Turso). When set, the durable store is permanent and hosted. **Not set on the 2026-10-12 preview** |
| `PERSIST_DB_URL` | no (default `file:./data/b-social.db`) | Local libSQL file used when Turso is not configured |
| `BACKUP_EXTERNAL_USER_ID` | no (default `bsocial-backup`) | OnDemand Media `externalUserId` under which snapshots are stored and listed |
| `BACKUP_MEDIA_PLUGIN_ID` | no (default `plugin-1713954536`) | Media ingest plugin id used for snapshot uploads (text/plain + JSON parts) |
| `PERSIST_SKIP_MEDIA_RESTORE` | no (`0`) | Set `1` to disable the Media restore on boot (tests only) |
| `DB_PATH` | no (`./data/portfolio.sqlite`) | Legacy sql.js portfolio DB file |
| `SOCIAL_DB_PATH`, `SOCIAL_RECEIPT_PUBLIC_KEY_PATH` | no | Native-collector receipt DB + public key used by the verified-post policy |
| `SOCIAL_BLOB_PATHNAME`, `SOCIAL_BLOB_TOKEN`, `BLOB_READ_WRITE_TOKEN`, `BLOB_DB_PATHNAME` | optional | Vercel Blob durability for the legacy DBs (not needed when the libSQL store is active) |
| `PORT`, `BASE_PATH`, `PUBLIC_BASE_URL` | no | Listen port (default 3000; the preview runs 4000), mount prefix (`/backend` on Vercel), absolute URL advertised in `/openapi.json` |
| `CRON_SECRET`, `REFRESH_CRON_MINUTES`, `REFRESH_CRON_LIMIT`, `ONDEMAND_NEWS_PLUGIN_ID(S)`, `ONDEMAND_DEFAULT_MODEL`, `ONDEMAND_REASONING_MODE`, `VOICE_WORKFLOW_ID`, `DAILY_REFRESH_WORKFLOW_ID`, `EARLIEST_TEST_UTC` | no | Refresh scheduler, Vercel cron auth, model defaults, workflow ids |

### Web (`web/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `PORTFOLIO_API_URL` / `NEXT_PUBLIC_PORTFOLIO_API_URL` | yes | Backend base URL (server-side / browser). On Vercel the `web` service receives `PORTFOLIO_API_URL` from the service binding in `vercel.json` |
| `NEXT_PUBLIC_SITE_URL` | yes | Public URL of the web app (metadata base) |
| `ONDEMAND_API_KEY`, `ONDEMAND_BASE_URL` | yes | Server-side OnDemand access for Ask B Social (`/api/social/ask`), chat bridge and media routes |
| `NEXT_PUBLIC_ONDEMAND_API_KEY`, `NEXT_PUBLIC_ONDEMAND_BASE_URL`, `NEXT_PUBLIC_CHAT_API_URL`, `NEXT_PUBLIC_CHAT_TRANSPORT` | chat | Chat transport configuration (unchanged module) |
| `INGEST_SECRET` | yes | Same value as the backend; used by the artifacts upload route |
| `NEXT_PUBLIC_DEFAULT_EXTERNAL_USER_ID`, `NEXT_PUBLIC_PORTFOLIO_PLUGIN_ID`, `NEXT_PUBLIC_EARLIEST_TEST_UTC`, `MEDIA_ALLOW_VIDEO`, `VOICE_WORKFLOW_ID`, `DAILY_REFRESH_WORKFLOW_ID`, `ONDEMAND_FIRST_BYTE_MS`, `ONDEMAND_TOTAL_MS`, `ONDEMAND_SESSION_HEADER_WAIT_MS`, `ONDEMAND_PAYLOAD_AUDIT` | no | Defaults, feature flags and timeouts |

## Durable persistence and the boot-time restore guard

`src/server.ts` calls `ensureDurableStore()` (`src/persist/boot.ts`) before the API starts listening:

1. **Open the store** — Turso when `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` are set, otherwise the local libSQL file
   (`PERSIST_DB_URL`). Drizzle migrations from `drizzle-persist/` run idempotently.
2. **DB already has posts** → action `existing-db`. Any *newer* verified Media snapshot is merged by upsert (never deletes).
3. **DB empty or freshly created (e.g. a new sandbox after the previous one expired)** → action
   `restored-from-ondemand-media`: the latest `b-social-snapshot-*.sqlite.gz.b64.txt` for `BACKUP_EXTERNAL_USER_ID` is
   fetched from the OnDemand Media API, base64/gzip-decoded, its **SHA-256 compared with the manifest** (`verified: true`
   in `/persistence/status`), and loaded. On 2026-10-12 this restored 11,828 posts (10,445 verified / 221 unverified /
   1,162 hidden), 7,049 takeaways, 136 companies, 946 people, 50 worker runs and 2 ingestion receipts.
4. **Media unavailable / no snapshot** → action `seeded-from-repo-files`: the feed is rebuilt from the bundled files
   (`data/social/verified-posts.json`, `data/social-feed.json`, `data/social/legacy-reddit-recovered.json`) and a first
   backup is taken.
5. Total failure never blocks the API: it falls back to the file-built feed (`readSocialFeedFromFiles`).

After every ingestion run (`src/social-refresh.ts`) the store is upserted (keyed on `native_id + platform`) and a new
snapshot set (SQLite, posts NDJSON, posts CSV, manifest — each fetched back and SHA-256-verified) is written to OnDemand
Media. `GET /persistence/status` reports provider, boot action, snapshot id/SHA-256, per-table counts and `content_sha256`;
authenticated `GET /persistence/export?format=sqlite|ndjson|csv` streams a fresh export. The daily Flow Builder workflow
`workflows/backup-daily.ts` posts to `/persistence/backup/webhook`.

Outbound links in the feed are rebuilt **only from native IDs** (`web/src/lib/outbound.ts`): X `https://x.com/{handle}/status/{id}`,
Reddit `https://www.reddit.com/r/{sub}/comments/{id}/`, Instagram `https://www.instagram.com/{p|reel}/{code}/`, LinkedIn post
permalinks; records without a native link render "Original source unavailable".

## Run locally

```bash
# backend (Hono API on :4000, local libSQL file, restore guard runs on boot)
npm ci
cp .env.example .env            # fill ONDEMAND_API_KEY and INGEST_SECRET at minimum
PORT=4000 BASE_PATH= npm run dev          # or: npm run build && PORT=4000 npm start
curl -s localhost:4000/persistence/status | jq .boot        # expect action restored-from-ondemand-media
curl -s "localhost:4000/social/feed?limit=1" | jq '{total, verified_count, unverified_count, by_platform}'

# web (Next.js on :3000)
cd web && npm ci
cp .env.example .env            # set PORTFOLIO_API_URL / NEXT_PUBLIC_PORTFOLIO_API_URL=http://127.0.0.1:4000
npm run dev                     # or: npm run build && npm start
open http://localhost:3000/social?e2e=1   # ?e2e=1 skips the first-run onboarding redirect
```

Tests: `npm test` (backend in-process suite), `npx tsx scripts/contract-test.ts http://127.0.0.1:4000` (OpenAPI contract,
29/29 on 2026-10-12), `cd web && npm run test:*` (unit suites) and `cd web && BASE_URL=... npx playwright test` (E2E; the
`e2e/turn6-*.spec.ts` specs cover the B Social feed, overflow and axe gates).

## Deployment

`vercel.json` describes two Vercel Services (`app` = Hono at the root, `web` = Next.js in `web/`) with a `/backend/*`
rewrite and a service binding that injects `PORTFOLIO_API_URL` into the web service. The 2026-10-12 preview ran the same
two services as separate Vercel sandboxes (API on port 4000, web on port 3000, `next start`).

---

# Backend reference (original README)

Full backend for the **B Capital Portfolio Intelligence** product: a TypeScript API (Hono) over a Drizzle-ORM SQLite
database seeded from the 135-company brand matrix (+ the B Capital firm record = **136 records**), fed every day at
06:00 UTC by **OnDemand Flow Builder** workflows that call the OnDemand Perplexity plugin (`plugin-1722260873`, the only plugin wired anywhere),
score sentiment with `predefined-deepseek-flash` (DeepSeek Flash v4.1, endpoint_name deepseek-v4.1-flash), and write back through `POST /ingest`. Since the **live-data release (2026-10-09)**
the API also refreshes news itself: `POST /refresh` / an hourly in-process scheduler stream one Perplexity query per company through the
OnDemand Chat API and persist article images and published dates (see [`web/docs/REFRESH_PIPELINE.md`](web/docs/REFRESH_PIPELINE.md)).

```
 OnDemand Flow Builder (cron 0 0 6 * * *)             This repo
 ┌──────────────────────────────────────────┐          ┌────────────────────────────────────────────┐
 │ bcap-focus-daily (5 focus companies)     │  HTTP    │ Hono API  ── Drizzle ORM ── SQLite (sql.js) │
 │ bcap-portfolio-daily-batch-1…6 (~25 ea.) │ ───────► │ POST /ingest  (X-Ingest-Secret)            │
 │  llm nodes: plugins → score → roll-ups   │  (Fable) │ GET /companies … /sentiment/portfolio …    │
 └──────────────────────────────────────────┘          └────────────────────────────────────────────┘
                                                        │ POST /refresh · GET /refresh/status        │
                                                        │  └─(apikey)─► OnDemand Chat API + Perplexity│
                                                        │     plugin-1722260873, every REFRESH_CRON_  │
                                                        │     MINUTES (40 stalest companies)          │
                                                        └────────────────────────────────────────────┘
                                 'Portfolio Plugin' registration: no public endpoint exists (web/proof/plugin-registration.log)
```

## Layout
| Path | Purpose |
|---|---|
| `src/db/schema.ts` | Drizzle schema: `companies`, `news_items`, `sentiment_history`, `sector_rollups`, `ingest_runs` |
| `src/db/client.ts` | sql.js-backed SQLite (pure WASM; no native build), persisted to `DB_PATH` |
| `src/app.ts` | All routes (`/companies`, `/companies/{slug}`, `/companies/{slug}/news`, `/news`, `/sentiment`, `/sentiment/portfolio`, `/search`, `/ingest`, `/refresh`, `/refresh/status`, `/openapi.json`, `/health`) |
| `src/refresh.ts` | Refresh pipeline: OnDemand session + streamed query per company, `plugin_sources` → `news_items` (`image_url`, `published_at`), og:image/date backfill, `ingest_runs` row (`source:"refresh"`) |
| `src/server.ts` | HTTP server + the in-process refresh scheduler (`REFRESH_CRON_MINUTES`) |
| `src/openapi.ts` | OpenAPI **3.1** document (served live; a 3.0.3 copy is registered as the OnDemand plugin schema) |
| `scripts/generate_seed.py` | XLSX → `data/seed.json` (136 spec records + 1 flagged extra, see below) |
| `scripts/migrate.ts`, `scripts/seed.ts` | Drizzle migration + seed (verifies the count) |
| `scripts/smoke.ts`, `scripts/test.ts` | Endpoint smoke test / in-process test suite |
| `scripts/register-plugin.ts` | Attempts to register the deployed API as the OnDemand custom tool 'Portfolio Plugin' (no public endpoint exists as of 2026-10-10 — see `web/proof/plugin-registration.log`) |
| `scripts/refresh.ts` | CLI for the refresh pipeline: `--slugs a,b` `--limit 40` `--concurrency 3` `--json out.json` (needs `ONDEMAND_API_KEY`) |
| `scripts/resolve-logos.ts` | Resolves + HTTP-verifies a real logo per company (existing → clearbit → og:image → Google favicon → `<link rel=icon>`; 200 + `image/*` + >500 B) → `proof/logo-resolution.json` |
| `scripts/apply-logos.ts` | Idempotently UPDATEs `companies.logo_url` from `proof/logo-resolution.json` (`DB_PATH` selects the DB; firm record untouched) |
| `proof/` | `refresh-run.json` (recorded `/refresh` run), `logo-resolution.json`, `image-coverage.json` (136/136 logos), `health-probe.log` |
| `workflows/` | Flow Builder workflow bodies + the script that creates/activates/executes them |
| `config/plugins.json` | Plugin wiring; Perplexity is the only ACTIVE plugin (others `removed` 2026-10-10) |
| `docs/ONDEMAND_SURFACE.md` | Live-documented OnDemand API surface used by this project |
| `docs/DEPLOYMENT_NOTES.md` | Deployment record, platform decision and smoke-test results |
| `web/docs/REFRESH_PIPELINE.md` | How `/refresh` works: auth, schedule, data model, failure handling, manual runs |

## Run locally
```bash
npm ci
npm run seed:json        # python3 + openpyxl; regenerates data/seed.json from data/brand-matrix.xlsx
npm run db:reset         # migrate + seed → data/portfolio.sqlite (prints db_record_count)
npm test                 # 11 in-process tests
INGEST_SECRET=$(openssl rand -hex 32) npm run dev
# refresh pipeline (optional — needs the OnDemand key in the environment, never in a file):
ONDEMAND_API_KEY=… node node_modules/tsx/dist/cli.mjs scripts/refresh.ts --slugs fervo-energy --json /tmp/refresh.json
curl -s -X POST localhost:3000/refresh -H "X-Ingest-Secret: $INGEST_SECRET" -d '{"slugs":["fervo-energy"]}'
curl -s localhost:3000/refresh/status
# logos:
PORTFOLIO_API_URL=http://localhost:3000 node node_modules/tsx/dist/cli.mjs scripts/resolve-logos.ts && node node_modules/tsx/dist/cli.mjs scripts/apply-logos.ts
```

## Refresh endpoints (live-data release)
| Endpoint | Auth | Body / query | Returns |
|---|---|---|---|
| `POST /refresh` | `X-Ingest-Secret` (or Basic password / `?secret=`, same as `/ingest`); 503 if `ONDEMAND_API_KEY` is unset | `{ slugs?: string[], limit?: 1–200 (default 40 stalest), concurrency?: 1–6 (default 3) }` | `{ ingest_run_id, status: ok\|partial\|error, companies_touched, news_upserted, with_images, dated, errors[], companies[], items[], started_at, finished_at }` — synchronous, ~1–2 min per company ÷ concurrency; a concurrent call joins the in-flight run |
| `GET /refresh/status` | none | — | `{ running, last_run (from ingest_runs), last_result, scheduler: { enabled, interval_minutes, batch_limit: 40, next_scheduled_at }, news_items_total, news_items_with_images, timestamp }` |

Recorded run (`proof/refresh-run.json`, 2026-10-10, 5 focus companies, local backend): `rf-2026-10-10T001147Z-965915` status `ok` — 54 items upserted,
**54 with images (100 %)**, **43 dated (80 %)**, 0 errors, 56–115 s per company at concurrency 3. Deployed status after the first tick:
runs rf-2026-10-10T002013Z-0682e7 (23 companies, 91 items), rf-2026-10-10T004411Z-8edb67 (40 companies), rf-2026-10-10T011148Z-a5a309 (2 companies, 11 items, 8 images); DB 202 news items / 184 with image_url; scheduler enabled, 60 min, batch 40, next 2026-10-10T02:24:27Z

## Environment (`.env.example`)
| Variable | Default | Purpose |
|---|---|---|
| `PORT`, `BASE_PATH`, `PUBLIC_BASE_URL`, `DB_PATH` | `3000`, ``, ``, `./data/portfolio.sqlite` | server / DB location |
| `INGEST_SECRET` | *(generate: `openssl rand -hex 32`)* | guards `POST /ingest` **and** `POST /refresh` |
| `ONDEMAND_API_KEY` | *(secret, server only)* | `apikey` header for `/refresh` and the scheduler; never logged, never committed — redact as `<redacted>` in any proof |
| `ONDEMAND_BASE_URL` | `https://api.on-demand.io` | upstream for the refresh pipeline |
| `ONDEMAND_DEFAULT_MODEL` | `predefined-deepseek-flash` | `endpointId` used by refresh queries — DeepSeek Flash v4.1 (endpoint_name deepseek-v4.1-flash) |
| `ONDEMAND_REASONING_MODE` | `medium` | `reasoningMode` sent with every refresh query |
| `ONDEMAND_NEWS_PLUGIN_ID` / `ONDEMAND_NEWS_PLUGIN_IDS` | `plugin-1722260873` | Perplexity — the only plugin used for news (no fallback plugins) |
| `REFRESH_CRON_MINUTES` | `60` | in-process scheduler interval; `0` disables (also disabled when `ONDEMAND_API_KEY` is absent). Run only one instance with it enabled |
| `EARLIEST_TEST_UTC` | `` | legacy; PitchBook plugin removed 2026-10-10 |

## Data notes
* **136 spec records** = 135 Brand_Matrix rows + B Capital. One extra record (`flutterwave`, `in_brand_matrix=false`)
  is included because it is one of the five focus companies in the intelligence JSON but is absent from the matrix;
  `/health.db_record_count` reports the 136 spec records and `db_record_count_total` the 137 physical rows.
* Status changes applied: Capital Rx → **Judi Rx**, Fervo Energy → public (Nasdaq: FRVO), Meesho → public, Code Metal → unicorn.
  Synack, BlackBuck, Geek+ and Bird are **not** in the 135-row matrix; they are recorded in `seed.json.unmatched_status_changes`.
* Every unknown ticket/ownership is an explicit `ESTIMATE:` with the rule used (lead ≈15-25 % of round, participant ≈2-5 %).

## Security
* The OnDemand `apikey` is needed by this service **only** for the refresh pipeline (`ONDEMAND_API_KEY`, server env). It is never
  returned by any endpoint, never logged (session ids are stripped from `/refresh/status`), and never committed; the read endpoints
  work without it. Browser clients must go through a server-side proxy that injects `apikey` → never ship the key to the client.
* `POST /ingest` and `POST /refresh` are protected by the `X-Ingest-Secret` header (HTTP Basic password / `?secret=` accepted for the
  Flow Builder webhook); the secret is generated at build (`openssl rand -hex 32`) and stored only in the env var **`INGEST_SECRET`**
  (server) and the workflow HTTP step. The frontend's `/api/portfolio/*` pass-through blocks both routes.

## Frontend (`web/`)
A Next.js 15 dashboard (overview · company detail · news pulse · OnDemand chat · settings) lives in [`web/`](web/README.md).
Live preview: https://sb-1z9qy0mx48sk.vercel.run (backend: https://sb-7d0g7nrod31w.vercel.run) · hand-off notes: [`web/docs/HANDOFF.md`](web/docs/HANDOFF.md) (§9 = live-data release 2026-10-09).

## 2026-10-10 additions (see CHANGELOG.md)

* `GET /pitchbook`, `GET /pitchbook/:slug`, `POST /pitchbook/ingest`, `POST /pitchbook/run` — PitchBook Investor Finder (`plugin-1777018662`) records with per-field provenance; weekly workflow `6aca3d3faeef8927baa25a05` (Mon 06:00 UTC). Env: `PITCHBOOK_WORKFLOW_ID`.
* Frontend: `/companies` virtualized list, `/api/img` image proxy, `/api/media` document upload relay, `/api/voice/{tts,stt}` voice relays, `/api/pitchbook/*` relays (`INGEST_SECRET` on the frontend server only for "Run now").
* Contracts used: `docs/ONDEMAND_CONTRACTS.md` (fetched live from the OnDemand docs API).
