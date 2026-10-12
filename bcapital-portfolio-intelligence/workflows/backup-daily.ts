/** Create + activate the daily B Social backup workflow (Agents Flow Builder, live docs slugs post_workflow / post_workflow-id-activate).
 *  Cron 03:00 UTC → one LLM node (Flow Builder requires ≥1 node) → webhook delivery to POST {BACKEND}/persistence/backup/webhook
 *  (Basic auth, username "ingest", password = INGEST_SECRET — the only auth the documented webhook-delivery schema supports).
 *  Usage: BACKEND_URL=https://… ONDEMAND_API_KEY=… INGEST_SECRET=… tsx workflows/backup-daily.ts */
import fs from "node:fs";
const BASE = (process.env.ONDEMAND_BASE_URL ?? "https://api.on-demand.io").replace(/\/$/, "");
const backend = (process.env.BACKEND_URL ?? "").replace(/\/$/, ""); const secret = process.env.INGEST_SECRET ?? ""; const apikey = process.env.ONDEMAND_API_KEY ?? "";
if (!backend || !secret || !apikey) throw new Error("BACKEND_URL, INGEST_SECRET and ONDEMAND_API_KEY are required");
const H = { apikey, "content-type": "application/json" };
const body = {
  name: "B Social Daily Durable Backup",
  trigger: { type: "cron", cron: { expression: "0 0 3 * * *" }, nextNodeKeys: ["note"], position: { x: 0, y: 0 }, measured: { width: 300, height: 500 } },
  nodes: [{ key: "note", kind: "source", type: "llm", dependencies: [], nextNodeKeys: [], position: { x: 400, y: 0 }, measured: { width: 300, height: 500 },
    llm: { model: "predefined-deepseek-flash", plugins: [], prompt: "Return exactly this JSON and nothing else: {\"job\":\"b-social-daily-backup\",\"action\":\"snapshot\"}", fulfillmentPrompt: "Output only the JSON object." } }],
  delivery: [{ channel: "webhook", config: { webhook: { url: `${backend}/persistence/backup/webhook`, method: "POST", basicAuth: { username: "ingest", password: secret } } }, position: { x: 800, y: 0 }, measured: { width: 300, height: 500 } }],
  enableMemory: false,
};
const file = "workflows/backup-created.json"; const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
let id = prev?.id as string | undefined; let createStatus = 0;
if (id) { const r = await fetch(`${BASE}/automation/api/workflow/${id}`, { method: "PATCH", headers: H, body: JSON.stringify(body) }); createStatus = r.status; if (!r.ok) id = undefined; }
if (!id) { const r = await fetch(`${BASE}/automation/api/workflow/`, { method: "POST", headers: H, body: JSON.stringify(body) }); createStatus = r.status; const j: any = await r.json().catch(() => ({})); id = j?.data?.id ?? j?.id; if (!id) throw new Error(`create HTTP ${r.status}: ${JSON.stringify(j).slice(0, 300)}`); }
const a = await fetch(`${BASE}/automation/api/workflow/${id}/activate`, { method: "POST", headers: H }); const at = await a.text();
const g: any = await (await fetch(`${BASE}/automation/api/workflow/${id}`, { headers: H })).json();
const out = { id, name: body.name, schedule: "0 0 3 * * * (03:00 UTC daily)", webhook_target: `${backend}/persistence/backup/webhook`, create_or_patch_status: createStatus, activate_status: a.status, activate_note: a.ok ? undefined : at.slice(0, 200), is_active: g?.data?.isActive ?? null, at: new Date().toISOString() };
fs.writeFileSync(file, JSON.stringify(out, null, 2)); console.log(JSON.stringify(out));
