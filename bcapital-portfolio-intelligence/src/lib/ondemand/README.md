# src/lib/ondemand

OnDemand Chat API client code for the PitchBook batch pull.

The authoritative API contract (base URL, `apikey` header auth, Create Session / Submit Query / Get Messages /
Get Session schemas, the "Chat Batches is not a documented API" finding and the client-side batch strategy,
pagination, rate limits + backoff policy, error codes, curl examples) lives in
[`docs/ondemand-api-contract.md`](../../../docs/ondemand-api-contract.md), derived from the live OnDemand docs
API on 2026-10-13.

Rules of thumb:

- Base URL `https://api.on-demand.io`, header `apikey: <key>` (read from env, never hardcode or log it).
- A "batch" is a locally-identified set of documented single `sync` queries: concurrency 4, 250 ms spacing,
  retry 2 s / 8 s / 30 s on 429 / 5xx (max 3 retries).
- Terminal message states: `completed` (success) and `failed`; poll the message endpoint only while `processing`.
