#!/usr/bin/env node
/**
 * UAE AI Command Centre — durable OnDemand Agents Flow Builder workflows (namespace uae_cc_v1).
 *
 * Endpoints are taken from the LIVE public docs (GET /config/v1/public/docs/reference/api/<slug>, re-read 2026-10-20T22:5xZ):
 *   server  https://api.on-demand.io/automation/api      auth header: apikey
 *   POST   /workflow/                     post_workflow                 → 201 {id}
 *   GET    /workflow/?keyword=&limit=     get_workflow                  (limit ≤ 50, else 400 "requested result count exceeded limit")
 *   GET    /workflow/{id}                 get_workflow-id
 *   PATCH  /workflow/{id}                 patch_workflow-id             (UpdateWorkflowRequest = same shape as create)
 *   POST   /workflow/{id}/activate        post_workflow-id-activate     → 200
 *   POST   /workflow/{id}/deactivate      post_workflow-id-deactivate
 *   POST   /workflow/{id}/execute         post_workflow-id-execute      → 200 {executionID}
 *   GET    /execution/list?workflowID=    get_execution-list
 *   GET    /execution/{id}                get_execution-executionid     → {status, startedAtInMilliseconds, …}
 *   GET    /execution/{id}/logs           get_execution-executionid-logs → ExecutionLog[] {task,nodeKey,message,timestamp}
 *   GET    /execution/{id}/node/outputs   get_execution-executionid-node-outputs → {outputs:{<nodeKey>:{value,…}}}
 * The public docs expose NO streaming log endpoint: "stream workflow logs" is implemented here by polling /execution/{id}/logs and printing
 * new lines as they appear (`logs` / `run` commands).
 *
 * Datastore: every run's node outputs are persisted by OnDemand as execution records. The app reads the latest successful execution of each
 * workflow through GET /api/uae/live (src/lib/uae/live.ts) — that is the app datastore for live uae_cc_v1 increments (append-only, provenance
 * per record). Nothing is written into the committed seed JSON.
 *
 * Usage (needs ONDEMAND_API_KEY or ON_DEMAND_API_KEY in the environment; never printed):
 *   node scripts/uae/workflows.mjs ensure            # create-or-update the 3 workflows by name, activate, write mission/workflows.json
 *   node scripts/uae/workflows.mjs status            # isActive + cron + next runs + last execution per workflow
 *   node scripts/uae/workflows.mjs run <ingest|briefing|checkpoint> [--wait]   # execute now and stream logs until terminal
 *   node scripts/uae/workflows.mjs logs <executionId>  # stream (poll) an execution's logs
 *   node scripts/uae/workflows.mjs sync-checkpoint   # PATCH the checkpoint workflow's state snapshot from MISSION_STATE.json + CHECKPOINTS.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = (process.env.ONDEMAND_BASE_URL || process.env.ON_DEMAND_BASE_URL || "https://api.on-demand.io").replace(/\/$/, "");
const API = `${BASE}/automation/api`;
const KEY = (process.env.ONDEMAND_API_KEY || process.env.ON_DEMAND_API_KEY || "").trim();
const STATE = path.join(APP, "mission/workflows.json");
const MODEL = "predefined-gpt-6-luna"; // live /config/v1/public/endpoints: status active (gpt-5.6-luna is inactive → falls back to this)
const PERPLEXITY = "plugin-1722260873", INTERNET = "plugin-1713924030", REDDIT = "plugin-1748003575";
const ORGS = JSON.parse(fs.readFileSync(path.join(APP, "src/data/uae_cc_v1/orgs.json"), "utf8")).organizations.map((o) => `${o.id}=${o.name}`).join("; ");
const CLASSES = ["Optimists", "Pragmatists", "Skeptics", "Safety Advocates", "Disruption Concerned", "Pessimists/Doomers", "Neutral/Informational"];

const pos = (i) => ({ position: { x: 100 + i * 400, y: 200 }, measured: { width: 300, height: 500 } });
const trig = (expr, ...entries) => ({ type: "cron", cron: { expression: expr, type: "advanced" }, nextNodeKeys: entries, position: { x: 0, y: 0 }, measured: { width: 300, height: 500 } });
const analyzer = (dep, i) => ({ key: "analyzer-0", kind: "sink", type: "o_analyzer", dependencies: [{ nodeKey: dep }], nextNodeKeys: ["add-delivery"], ...pos(i) });

const NO_SYNTH = "NEVER synthesize, paraphrase into a new opinion, or invent a statement, author, number, date or URL. Every item must come from a plugin search result you actually received and carry that result's real URL. If nothing qualifies, return empty arrays.";

export const SPECS = {
  ingest: {
    name: "UAE AI Command Centre — uae_cc_v1 ingest (news + sentiment + entities) every 2h",
    cron: "0 0 */2 * * *", cron5: "0 */2 * * *",
    build: () => ({
      trigger: trig("0 0 */2 * * *", "news", "voices"),
      nodes: [
        { key: "news", kind: "source", type: "llm", dependencies: [], nextNodeKeys: ["classify"], ...pos(0), llm: { model: MODEL, plugins: [{ id: PERPLEXITY }, { id: INTERNET }],
          prompt: `Search the web for the MOST RECENT news (newest first; your own idea of today's date may be wrong, so do not filter by a date window — report each item's published date instead) about artificial intelligence in the United Arab Emirates: UAE AI companies, government AI programmes, research institutes, data centres/compute, models, partnerships, funding, regulation, AI and jobs. Prioritise these organisations: ${ORGS}. Return up to 15 distinct items.`,
          fulfillmentPrompt: `Return ONLY strict JSON {"items":[{"headline","url","publisher","published_at":"YYYY-MM-DD or empty","summary":"<=40 words, factual","orgs":["names as written"],"plugin":"Perplexity|Internet"}]}. ${NO_SYNTH}` } },
        { key: "voices", kind: "source", type: "llm", dependencies: [], nextNodeKeys: ["classify"], position: { x: 100, y: 800 }, measured: { width: 300, height: 500 }, llm: { model: MODEL, plugins: [{ id: PERPLEXITY }, { id: REDDIT }],
          prompt: "Find the MOST RECENT public, attributable statements (quotes, posts, op-eds, comments; newest first, do not filter by a date window — report each item's date) about artificial intelligence in the UAE — including AI and employment, safety, investment, government AI adoption and named UAE AI organisations. Sources may be news quotes, op-eds, Reddit posts (r/dubai, r/UAE, r/abudhabi) or other public pages. Return up to 15.",
          fulfillmentPrompt: `Return ONLY strict JSON {"statements":[{"text":"exact quote when available","is_verbatim":true|false,"author":"name or 'unattributed'","author_role","outlet","platform":"news|reddit|op-ed|linkedin|x|web|government","url","published_at":"YYYY-MM-DD or empty","plugin":"Perplexity|Reddit Posts"}]}. ${NO_SYNTH}` } },
        { key: "classify", kind: "intermediate", type: "llm", dependencies: [{ nodeKey: "news" }, { nodeKey: "voices" }], nextNodeKeys: ["analyzer-0"], ...pos(1), llm: { model: MODEL, plugins: [],
          prompt: `You are the uae_cc_v1 ingestion classifier. Input A (news JSON): {{news}}\n\nInput B (statements JSON): {{voices}}\n\nTasks: (1) drop any item without an http(s) URL; (2) classify every statement into exactly one of: ${CLASSES.join(", ")} with confidence 0-1 and a <=15-word rationale; (3) extract named entities and map them to watchlist ids from this list (id=name): ${ORGS}; (4) derive organisation signals only from the kept items (one per org, citing the item URLs). Do not add any item that is not in the inputs.`,
          fulfillmentPrompt: `Return ONLY strict JSON: {"namespace":"uae_cc_v1","news":[{"headline","url","publisher","published_at","summary","entities":[],"org_ids":[],"plugin","confidence"}],"statements":[{"text","is_verbatim","author","author_role","outlet","platform","url","published_at","sentiment_class","class_confidence","rationale","entities":[],"org_ids":[],"plugin","confidence"}],"org_signals":[{"org_id","signal":"<=20 words","direction":"up|down|flat","evidence_urls":[]}],"dropped_no_url":0}. Copy url/text/author verbatim from the inputs. ${NO_SYNTH}` } },
        analyzer("classify", 2),
      ],
      delivery: [],
    }),
  },
  briefing: {
    name: "UAE AI Command Centre — National AI Briefing daily 06:30 GST (02:30 UTC)",
    cron: "0 30 2 * * *", cron5: "30 2 * * *",
    build: () => ({
      trigger: trig("0 30 2 * * *", "briefing"),
      nodes: [
        { key: "briefing", kind: "source", type: "llm", dependencies: [], nextNodeKeys: ["analyzer-0"], ...pos(0), llm: { model: MODEL, plugins: [{ id: PERPLEXITY }],
          prompt: `Research the most recent important developments (newest first; do not assume today's date — use the publication dates in the sources) in the UAE artificial-intelligence ecosystem (government programmes and regulation, compute/data centres, models and research, partnerships and international expansion, funding, AI and jobs, public sentiment). Focus organisations: ${ORGS}.`,
          fulfillmentPrompt: `Write a one-page "National AI Briefing — UAE" in markdown for senior government readers. Do NOT write a date line of your own (the app stamps the run time); give each development its source publication date. Sections: a bold one-line bottom line; "## Key developments (most recent)" 5-7 bullets, newest first; "## Ecosystem & capability"; "## Public sentiment (sample, not a survey)"; "## Risks & watch items"; "## Recommended questions for leadership". In every section separate **Verified** bullets (each ends with a markdown link to the real source URL from your research) from **Interpretation** bullets. Never invent URLs, numbers or quotes; write "unavailable" when unsupported. End with the exact line: "Concept Demonstration — not an official government system."` } },
        analyzer("briefing", 1),
      ],
      delivery: [],
    }),
  },
  checkpoint: {
    name: "UAE AI Command Centre — mission checkpoint every 30 min",
    cron: "0 */30 * * * *", cron5: "*/30 * * * *",
    build: () => ({
      trigger: trig("0 */30 * * * *", "state"),
      nodes: [
        { key: "state", kind: "source", type: "inputText", dependencies: [], nextNodeKeys: ["analyzer-0"], ...pos(0), text: { value: checkpointPayload() } },
        analyzer("state", 1),
      ],
      delivery: [],
    }),
  },
};

function checkpointPayload() {
  const read = (f) => { try { return fs.readFileSync(path.join(APP, f), "utf8"); } catch { return ""; } };
  let state = {}; try { state = JSON.parse(read("MISSION_STATE.json") || "{}"); } catch { /* keep {} */ }
  return JSON.stringify({ kind: "uae_cc_v1.checkpoint", synced_at: new Date().toISOString(), mission_state: state, checkpoints_md: read("CHECKPOINTS.md").slice(0, 6000), next_actions_md: read("NEXT_ACTIONS.md").slice(0, 3000) });
}

async function od(method, p, body) {
  if (!KEY) throw new Error("ONDEMAND_API_KEY / ON_DEMAND_API_KEY is not set");
  const t0 = Date.now();
  const r = await fetch(`${API}${p}`, { method, headers: { apikey: KEY, "content-type": "application/json", "user-agent": "uae-ai-command-centre/1.0 (+workflows.mjs)" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text(); let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  return { status: r.status, ok: r.ok, json, text, ms: Date.now() - t0 };
}

/** Next N fire times (UTC) for the simple cron shapes used here (fixed second; minute/hour fields: "*", "*\/n" or a number). */
export function nextRuns(expr6, n = 3, from = new Date()) {
  const [, mi, ho] = expr6.split(" ");
  const match = (f, v) => f === "*" || (f.startsWith("*/") ? v % Number(f.slice(2)) === 0 : Number(f) === v);
  const out = []; const t = new Date(Math.floor(from.getTime() / 60000) * 60000 + 60000);
  for (let i = 0; i < 60 * 24 * 3 && out.length < n; i++, t.setTime(t.getTime() + 60000)) if (match(mi, t.getUTCMinutes()) && match(ho, t.getUTCHours())) out.push(t.toISOString().replace(".000Z", "Z"));
  return out;
}

const loadState = () => { try { return JSON.parse(fs.readFileSync(STATE, "utf8")); } catch { return { workflows: {} }; } };
const saveState = (s) => { fs.mkdirSync(path.dirname(STATE), { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(s, null, 1) + "\n"); };

async function findByName(name) {
  const r = await od("GET", `/workflow/?limit=50&keyword=${encodeURIComponent("UAE AI Command Centre")}`);
  return (r.json?.data ?? []).find((w) => w.name === name) ?? null;
}

async function ensure() {
  const st = loadState(); st.workflows ??= {};
  for (const [kind, spec] of Object.entries(SPECS)) {
    const body = { name: spec.name, ...spec.build() };
    const known = st.workflows[kind]?.id ? { id: st.workflows[kind].id } : await findByName(spec.name);
    let id = known?.id, op;
    if (id) { op = await od("PATCH", `/workflow/${id}`, body); if (op.status === 404) id = null; }
    if (!id) { op = await od("POST", "/workflow/", body); id = op.json?.id ?? op.json?.data?.id; }
    if (!op.ok || !id) { console.error(`[${kind}] create/update failed HTTP ${op.status}: ${op.text.slice(0, 300)}`); st.workflows[kind] = { ...st.workflows[kind], error: `HTTP ${op.status} ${op.text.slice(0, 300)}` }; continue; }
    const act = await od("POST", `/workflow/${id}/activate`);
    const got = await od("GET", `/workflow/${id}`);
    const w = got.json?.data ?? {};
    st.workflows[kind] = { ...st.workflows[kind], id, name: spec.name, cron6: w.trigger?.cron?.expression ?? spec.cron, cron5_equivalent: spec.cron5, timezone: "UTC (platform scheduler; verified from prior cron runs starting at :00:00 UTC)",
      upsert_status: op.status, activate_status: act.status, isActive: w.isActive === true, verified_at: new Date().toISOString(), next_runs_utc: nextRuns(w.trigger?.cron?.expression ?? spec.cron) };
    console.log(`[${kind}] ${id} upsert=${op.status} activate=${act.status} isActive=${w.isActive} cron=${w.trigger?.cron?.expression} next=${st.workflows[kind].next_runs_utc[0]}`);
  }
  st.updated_at = new Date().toISOString(); saveState(st); return st;
}

async function streamLogs(eid, { timeoutMs = 600_000, quiet = false } = {}) {
  const seen = new Set(); const t0 = Date.now(); let exec = {};
  for (;;) {
    const [l, e] = await Promise.all([od("GET", `/execution/${eid}/logs`), od("GET", `/execution/${eid}`)]);
    for (const x of l.json?.data ?? []) { const k = `${x.timestamp}|${x.nodeKey}|${x.message}`; if (seen.has(k)) continue; seen.add(k); if (!quiet) console.log(`  ${x.timestamp ? new Date(Number(x.timestamp) / (x.timestamp > 1e14 ? 1e6 : 1)).toISOString() : ""} ${x.nodeKey || "-"} ${x.task || ""} ${x.message}`); }
    exec = e.json?.data ?? {};
    if (["success", "failed", "error", "cancelled", "completed"].includes(String(exec.status).toLowerCase()) || Date.now() - t0 > timeoutMs) break;
    await new Promise((r) => setTimeout(r, 4000));
  }
  return { exec, logs: [...seen] };
}

async function run(kind, wait) {
  const st = loadState(); const id = st.workflows?.[kind]?.id; if (!id) throw new Error(`no workflow id for ${kind}; run ensure first`);
  const ex = await od("POST", `/workflow/${id}/execute`, { payload: {} });
  const eid = ex.json?.executionID ?? ex.json?.data?.executionID;
  console.log(`[${kind}] execute HTTP ${ex.status} ${ex.ms}ms executionID=${eid ?? "-"} ${ex.ok ? "" : ex.text.slice(0, 300)}`);
  if (!eid) return null;
  st.workflows[kind].last_manual_execution = { id: eid, execute_status: ex.status, started_at: new Date().toISOString() }; saveState(st);
  if (!wait) return eid;
  const { exec, logs } = await streamLogs(eid);
  const out = await od("GET", `/execution/${eid}/node/outputs`);
  const outputs = out.json?.data?.outputs ?? {};
  const st2 = loadState();
  st2.workflows[kind].last_manual_execution = { id: eid, execute_status: ex.status, status: exec.status, trigger: exec.trigger?.type, started_at: exec.startedAtInMilliseconds ? new Date(exec.startedAtInMilliseconds).toISOString() : null,
    ended_at: exec.endedAtInMilliseconds ? new Date(exec.endedAtInMilliseconds).toISOString() : null, time_taken_ms: exec.timeTakenInMilliseconds ?? null, log_lines: logs.length,
    log_excerpt: logs.slice(-6).map((s) => s.split("|").slice(1).join(" ").trim()), output_chars: Object.fromEntries(Object.entries(outputs).map(([k, v]) => [k, (v.value || "").length])) };
  saveState(st2);
  console.log(`[${kind}] status=${exec.status} took=${exec.timeTakenInMilliseconds}ms outputs=${JSON.stringify(st2.workflows[kind].last_manual_execution.output_chars)}`);
  return eid;
}

async function status() {
  const st = loadState(); const rows = [];
  for (const [kind, w] of Object.entries(st.workflows ?? {})) {
    if (!w.id) { rows.push({ kind, error: w.error }); continue; }
    const g = await od("GET", `/workflow/${w.id}`); const l = await od("GET", `/execution/list?workflowID=${w.id}`);
    const last = (l.json?.data ?? [])[0];
    rows.push({ kind, id: w.id, http: g.status, isActive: g.json?.data?.isActive, cron: g.json?.data?.trigger?.cron?.expression, next_runs_utc: nextRuns(g.json?.data?.trigger?.cron?.expression ?? w.cron6),
      last_execution: last ? { id: last.id, status: last.status, trigger: last.trigger?.type, started_at: new Date(last.startedAtInMilliseconds).toISOString() } : null });
  }
  console.log(JSON.stringify(rows, null, 1)); return rows;
}

const [cmd, arg, flag] = process.argv.slice(2);
const main = { ensure, status, run: () => run(arg, flag === "--wait"), logs: () => streamLogs(arg), "sync-checkpoint": ensure }[cmd];
if (!main) { console.log("usage: workflows.mjs ensure|status|run <ingest|briefing|checkpoint> [--wait]|logs <executionId>|sync-checkpoint"); process.exit(2); }
main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
