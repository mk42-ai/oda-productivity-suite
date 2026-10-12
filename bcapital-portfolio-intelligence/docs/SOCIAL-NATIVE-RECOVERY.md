# B Social native-receipt recovery

This is the existing Hono/sql.js/Next.js app, not a replacement. Historical `data/social-feed.json` and the main portfolio database remain unchanged. Native posts live in a separate, additive `data/social-native.sqlite` database.

## Actual run state

- Original platform-attached `FetchTweetDetails` response is retained in `data/native-source-receipt.json`. Its original container digest is preserved; its opaque continuation value is redacted to a digest.
- A local signing key was used only outside the source tree. `data/social-receipt-public.pem` verifies persisted receipt integrity and contains no secret.
- No raw response is generated from model prose. `raw_native` and the explicitly labelled normalized projection remain distinct.
- Relevance requires an unambiguous company event or the portfolio owner's explicit handle/name, not an account display-name match. Generic lowercase “percent” and the unrelated katsukeno account are excluded.
- All legacy rows remain intact and are also recorded with rejection reasons in the additive quarantine table. A rejected native row is retained, not deleted.
- `scripts/collect-social.ts` records the real batch capability response. W01–W50 are reserved labels, not executed agents. When batch creation returns 405, every platform/session/batch ID remains null and no fallback worker pool starts.

## Run locally

Use Node 22+, install with `npm ci` at the repository root and in `web/`, then run production builds with the app `.env` exported. Start the API at port 4000 and `npm run start` from `web` at port 3000. Set `PORTFOLIO_API_URL` and `NEXT_PUBLIC_PORTFOLIO_API_URL` to your actual API address; the browser only accesses the Next proxy.

Runtime configuration (values are intentionally not distributed):

- `ONDEMAND_API_KEY`: existing app's server-side platform credential.
- `INGEST_SECRET`: existing authenticated write-route secret.
- `SOCIAL_DB_PATH`: local native SQLite path, default `data/social-native.sqlite`.
- `SOCIAL_RECEIPT_PUBLIC_KEY_PATH`: public verification key path.
- `SOCIAL_BLOB_TOKEN`: **your own** private Vercel Blob read/write token, required for remote durability. No platform/container token is copied into the app.
- `SOCIAL_BLOB_PATHNAME`: private durable object path, default `b-capital/social-native.sqlite`.

Without `SOCIAL_BLOB_TOKEN`, local SQLite survives application process restarts but **not loss of an ephemeral sandbox**. The API/UI explicitly report this limitation. Source snapshots are not a substitute for remote production persistence.

## Receipt imports and worker retries

Importing the same original response again is idempotent by both provider/native ID and canonical permalink. A private signing key matching the public key is required for new signed records; it must never be included in the source archive, logs or screenshots. Do not replace the current public key to bypass signature verification.

`node node_modules/tsx/dist/cli.mjs scripts/import-native-social.ts <native-envelope.json> <private-signing-key-file>`

`node node_modules/tsx/dist/cli.mjs scripts/collect-social.ts` checks live documentation and the native batch capability gate. It does not invent a batch schema or reinterpret 50 local threads as 50 platform workers. Resolve platform batch access and documented schema before extending the guarded launcher. Keep TikTok disabled and do not substitute profile lookups for posts.

## Verification

- `npm run build` (root and web)
- `DB_READONLY=1 npm test`
- `node node_modules/tsx/dist/cli.mjs scripts/test-native-social.ts`
- `node node_modules/tsx/dist/cli.mjs scripts/test-social-boundaries.ts`
- Existing web unit tests and browser verification against the actual deployment.

`GET /data/social-feed`, `GET /social/feed`, and the Next `/api/social/social-feed` expose actual admitted counts, quarantine and collection state. Filters support platform, sector, company, and `q`; pagination is applied after filtering. Native receipt payloads and private signing material are never returned to the browser.
