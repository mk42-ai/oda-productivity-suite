/**
 * "B Capital Monthly PitchBook Sync" — Agents Flow Builder workflow (live docs 2026-10-13: POST /automation/api/workflow/,
 * POST /workflow/{id}/activate, GET /workflow/{id}, POST /workflow/{id}/execute, GET /execution/{executionID}/logs; cron is a
 * 6-field expression, "the left most place represents seconds").
 *
 *   tsx workflows/monthly-pitchbook-batch.ts plan     → writes workflows/b-capital-monthly-pitchbook-sync.json (secret redacted)
 *   tsx workflows/monthly-pitchbook-batch.ts create   → POST + activate + GET → workflows/b-capital-monthly-pitchbook-sync.created.json
 *   tsx workflows/monthly-pitchbook-batch.ts execute  → POST /execute once, poll the execution + logs, append to the created record
 *
 * The heavy lifting (steps a–e) runs server-side in the API: the workflow's webhook delivery POSTs to
 * {API_BASE}/pitchbook/batch/webhook (Basic auth, password = INGEST_SECRET), which dedupes the 136-company portfolio, re-runs the
 * documented single-query batch pull (POST /chat/v1/batches is 405 "currently unavailable"), upserts latest-first with per-field
 * provenance, writes a SHA-256-verified Media snapshot and logs the counts (src/pitchbook-batch.ts startMonthlySync).
 * Env: ONDEMAND_API_KEY (never printed), INGEST_SECRET (never written to disk), API_BASE (public API URL), NOTIFY_EMAIL.
 */
import fs from "node:fs";
const BASE = (process.env.ONDEMAND_BASE_URL ?? "https://api.on-demand.io").replace(/\/$/, "");
const API_BASE = (process.env.API_BASE ?? process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
const SECRET = (process.env.INGEST_SECRET ?? "").trim() || "<INGEST_SECRET>";
const EMAIL = process.env.NOTIFY_EMAIL ?? "mk@airev.ae";
export const NAME = "B Capital Monthly PitchBook Sync";
export const CRON_6 = "0 0 6 1 * *"; // Flow Builder 6-field (seconds first) == 5-field "0 6 1 * *": 1st of each month 06:00 UTC
const MODEL = "predefined-deepseek-flash";
const PLUGIN = "plugin-1777018662"; // Pitchbook Investor Finder — getCompanyProfile lives here
const INVESTOR = "155248-48";
const ts = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

const prompt = `You are the trigger node of "${NAME}". Return exactly this JSON and nothing else (no prose, no markdown fence):
{"job":"b-capital-monthly-pitchbook-sync","investor_pb_id":"${INVESTOR}","trigger":"flow-builder-cron","fired_at_utc":"<current UTC time ISO-8601>"}`;

export const body = {
  name: NAME,
  trigger: { type: "cron", cron: { expression: CRON_6 }, nextNodeKeys: ["kickoff"], position: { x: 0, y: 0 }, measured: { width: 300, height: 500 } },
  nodes: [
    { key: "kickoff", kind: "source", type: "llm", dependencies: [], nextNodeKeys: [], position: { x: 400, y: 0 }, measured: { width: 300, height: 500 },
      llm: { model: MODEL, plugins: [], prompt, fulfillmentPrompt: "Output only the JSON object. Do not call any tool." } },
  ],
  delivery: [
    { channel: "webhook", config: { webhook: { url: `${API_BASE}/pitchbook/batch/webhook?secret=${SECRET}`, method: "POST", basicAuth: { username: "ingest", password: SECRET } } }, position: { x: 800, y: 0 }, measured: { width: 300, height: 500 } },
    { channel: "email", config: { email: { addresses: [EMAIL] } }, position: { x: 800, y: 600 }, measured: { width: 300, height: 500 } },
  ],
  enableMemory: false,
};
/** Human-readable step plan embedded in the saved definition (x- keys are stripped before POST). */
export const steps = [
  { step: "a", where: "API startMonthlySync → buildTargets()", what: `Load the deduplicated B Capital Group (PitchBook investor ${INVESTOR}) portfolio: data/portfolio.json companies (firm row excluded) joined with data/pitchbook/match-table.json; dedupe by companyId (pbId) then by normalised name (parentheticals such as "Dream Labs (Business/Productivity Software)" / "Axiom (Palo Alto)" stripped; "Port One Solutions" ≡ "PortOne") → 136 unique companies, 109 with stored PitchBook ids, 27 looked up by name + website domain.` },
  { step: "b", where: "API runPitchbookBatch()", what: "Re-run the batch pull with plugin-1777018662 getCompanyProfile per company. POST /chat/v1/batches is probed first; while it answers 405 'Chat batch creation is currently unavailable' the pull runs as documented single sync queries (POST /chat/v1/sessions + POST /chat/v1/sessions/{id}/query, responseMode sync, polling GET …/messages/{messageId} only while status=processing) under a generated local batch id pbb-<UTC>-<hex>; up to 4 attempts per company (1 + retries at 2 s / 8 s / 30 s on 429 / 5xx / timeouts / empty answers), concurrency 4, 250 ms spacing — within the documented 10,000 req/min and 100 RAG calls/min limits." },
  { step: "c", where: "API runPitchbookBatch() → mergeLatestFirst()", what: "Upsert pitchbook_company_profiles latest-first: every field of the newest pull wins, each leaf carrying {source:'pitchbook', batch_id, query_id, fetched_at (UTC)} plus the PitchBook profile link; null / [] / 404 sections stay the explicit literal 'Not available in PitchBook'; a company whose lookup returns no match after the retry budget is 'Unmatched in PitchBook' (e.g. Turno); a populated field is never overwritten by an empty state and a populated profile is never replaced by an unmatched one. Every attempt is kept in pitchbook_batch_queries; the run in pitchbook_batch_runs." },
  { step: "d", where: "API runBackup('monthly-pitchbook-sync')", what: "Write the durable store snapshot to OnDemand Media with the same naming convention as 20261013T024931Z (b-social-snapshot-<UTC>.sqlite.gz.b64.txt + .posts.ndjson + .posts.csv + .manifest.json); each file is fetched back and SHA-256-checked against the manifest; media ids + checksums are recorded in the backups table and in the run log." },
  { step: "e", where: "API monthlySync.log / GET /pitchbook/batch/status", what: "Log counts: companies queried, succeeded, failed/unmatched, retried, total fields populated, explicit 'Not available in PitchBook' count, duration, batch id, snapshot id + sha256." },
];
const definition = { ...body, "x-schedule": { cron_6field: CRON_6, cron_5field: "0 6 1 * *", human: "1st of each month at 06:00 UTC", timezone: "UTC" }, "x-steps": steps, "x-webhook_target": `${API_BASE || "<API_BASE>"}/pitchbook/batch/webhook`, "x-plugin": { id: PLUGIN, tool: "getCompanyProfile" }, "x-investor": { pb_id: INVESTOR, profile: "https://my.pitchbook.com/profile/155248-48/investor/profile" } };
const DEF = "workflows/b-capital-monthly-pitchbook-sync.json"; const OUT = "workflows/b-capital-monthly-pitchbook-sync.created.json";
const scrub = (s: string) => (SECRET !== "<INGEST_SECRET>" ? s.replaceAll(SECRET, "<INGEST_SECRET>") : s);
const mode = process.argv[2] ?? "plan";
if (mode === "plan") { fs.writeFileSync(DEF, scrub(JSON.stringify(definition, null, 2)) + "\n"); console.log(JSON.stringify({ wrote: DEF, name: NAME, cron: CRON_6 })); process.exit(0); }
const apikey = process.env.ONDEMAND_API_KEY; if (!apikey) throw new Error("ONDEMAND_API_KEY not set");
if (SECRET === "<INGEST_SECRET>" || !API_BASE) throw new Error("INGEST_SECRET and API_BASE are required to create the workflow");
const H = { apikey, "content-type": "application/json" };
const rec: any = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const nextRun = (from = new Date()) => { let y = from.getUTCFullYear(), m = from.getUTCMonth(); const cand = new Date(Date.UTC(y, m, 1, 6)); if (cand.getTime() > from.getTime()) return cand.toISOString().replace(/\.\d{3}Z$/, "Z"); return new Date(Date.UTC(y, m + 1, 1, 6)).toISOString().replace(/\.\d{3}Z$/, "Z"); };

if (mode === "create") {
  // Idempotent: reuse a workflow of the same exact name if it already exists (PATCH), else POST.
  let id: string | undefined = rec.id; let createStatus = 0; let createdAt = rec.created_at_utc;
  if (!id) { const l: any = await (await fetch(`${BASE}/automation/api/workflow/?keyword=${encodeURIComponent(NAME)}&limit=50`, { headers: H })).json().catch(() => ({})); const hit = (l?.data ?? []).find((w: any) => w.name === NAME); if (hit) id = hit.id; }
  if (id) { const r = await fetch(`${BASE}/automation/api/workflow/${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ trigger: body.trigger, nodes: body.nodes, delivery: body.delivery, enableMemory: body.enableMemory }) }); createStatus = r.status; if (!r.ok) id = undefined; }
  if (!id) { const r = await fetch(`${BASE}/automation/api/workflow/`, { method: "POST", headers: H, body: JSON.stringify(body) }); createStatus = r.status; const j: any = await r.json().catch(() => ({})); id = j?.data?.id ?? j?.id; createdAt = ts(); if (!id) throw new Error(`create failed HTTP ${r.status}: ${scrub(JSON.stringify(j)).slice(0, 300)}`); }
  const a = await fetch(`${BASE}/automation/api/workflow/${id}/activate`, { method: "POST", headers: H }); const at = await a.text();
  const g: any = await (await fetch(`${BASE}/automation/api/workflow/${id}`, { headers: H })).json(); const w = g?.data ?? g;
  Object.assign(rec, { id, name: NAME, schedule: { cron_6field: CRON_6, cron_5field: "0 6 1 * *", human: "1st of each month at 06:00 UTC" }, create_or_patch_status: createStatus, created_at_utc: createdAt ?? ts(), activate_status: a.status, activate_note: a.ok ? undefined : scrub(at).slice(0, 200), activated_at_utc: ts(), is_active: w.isActive === true, api_cron: w.trigger?.cron?.expression ?? null, api_last_modified_utc: w.lastModifiedAtInMilliseconds ? new Date(w.lastModifiedAtInMilliseconds).toISOString().replace(/\.\d{3}Z$/, "Z") : null, next_run_utc: nextRun(), next_run_source: "computed from the cron (the GET /workflow/{id} response has no next-run field)", webhook_target: `${API_BASE}/pitchbook/batch/webhook`, email: EMAIL, plugin_id: PLUGIN, model: MODEL });
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 2) + "\n"); console.log(JSON.stringify(rec)); process.exit(0);
}
if (mode === "execute") {
  const id = rec.id; if (!id) throw new Error("create first");
  const r = await fetch(`${BASE}/automation/api/workflow/${id}/execute`, { method: "POST", headers: H, body: JSON.stringify({}) }); const j: any = await r.json().catch(() => ({}));
  const exec = j?.data?.executionID ?? j?.executionID ?? j?.data?.id; const triggeredAt = ts();
  let status: any = null; let logs: any[] = [];
  const deadline = Date.now() + Number(process.env.EXECUTE_WAIT_MS ?? 240_000);
  while (Date.now() < deadline) {
    await new Promise((s) => setTimeout(s, 5000));
    status = (await (await fetch(`${BASE}/automation/api/execution/${exec}`, { headers: H })).json().catch(() => ({})))?.data ?? null;
    logs = (await (await fetch(`${BASE}/automation/api/execution/${exec}/logs`, { headers: H })).json().catch(() => ({})))?.data ?? [];
    if (status && status.status && status.status !== "executing" && status.status !== "queued" && status.status !== "running") break;
  }
  rec.validation_execution = { execution_id: exec, execute_http: r.status, triggered_at_utc: triggeredAt, status: status?.status ?? null, started_at_utc: status?.startedAtInMilliseconds ? new Date(status.startedAtInMilliseconds).toISOString().replace(/\.\d{3}Z$/, "Z") : null, ended_at_utc: status?.endedAtInMilliseconds ? new Date(status.endedAtInMilliseconds).toISOString().replace(/\.\d{3}Z$/, "Z") : null, time_taken_ms: status?.timeTakenInMilliseconds ?? null, log_count: logs.length, log_lines: [...logs].sort((x: any, y: any) => x.timestamp - y.timestamp).map((l: any) => `${new Date(l.timestamp).toISOString()} [${l.nodeKey ?? "-"}] ${scrub(String(l.message))}`).slice(0, 40) };
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 2) + "\n"); console.log(JSON.stringify(rec.validation_execution)); process.exit(0);
}
