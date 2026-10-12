/** Guarded native-batch launch attempt. Never substitutes local threads or session loops. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { writeCollectionState, readCollectionState, nativeStorageStatus } from "../src/social-native.js";
const base = (process.env.ONDEMAND_BASE_URL || "https://api.on-demand.io").replace(/\/$/, "");
const key = process.env.ONDEMAND_API_KEY || "";
if (!key) throw new Error("ONDEMAND_API_KEY is not configured");
const headers = { apikey: key, "content-type": "application/json", "user-agent": "Mozilla/5.0 BCapitalCollectionGate/1.0" };
const started_at = new Date().toISOString();
const companies = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/portfolio.json"), "utf8")).companies;
const workers = Array.from({ length: 50 }, (_, i) => ({ label: `W${String(i + 1).padStart(2, "0")}`, status: "not_launched", platform_worker_id: null, session_id: null, batch_id: null, assignments: [] as string[], started_at: null, ended_at: null, fetched: 0, admitted_unique: 0, duplicate: 0, excluded: 0, failed: 0, blocker: "" }));
for (const c of companies) workers[parseInt(crypto.createHash("sha256").update(c.slug).digest("hex").slice(0, 8), 16) % 50].assignments.push(c.slug);
const doc = await fetch(`${base}/config/v1/public/docs/categories`, { headers });
const dj: any = await doc.json(); const batches = (dj.data || []).flatMap((c: any) => c.meta || []).filter((m: any) => /batch/i.test(m.title || ""));
// Empty capability request is not a guessed worker payload: it cannot launch the pool.
const gate = await fetch(`${base}/chat/v1/batches`, { method: "POST", headers, body: "{}" });
const response: any = await gate.json().catch(() => ({}));
const blocker = `Native batch launch unavailable: HTTP ${gate.status}, ${String(response.errorCode || "unknown")}: ${String(response.message || "no supported request schema")}`;
for (const w of workers) w.blocker = blocker;
const old = await readCollectionState();
const state = { ...old, status: "blocked", started_at, finished_at: new Date().toISOString(), target_unique: 2001, target_met: false, worker_pool_size: workers.length, workers_launched: 0, workers, batch_request_id: gate.headers.get("x-request-id"), batch_http_status: gate.status, retry_after: gate.headers.get("retry-after"), documentation_url: `${base}/config/v1/public/docs/categories`, documented_batch_operations: batches, blocker,
  launch_semantics: "W01-W50 are reserved logical labels only. No platform workers, sessions or collector outcomes are claimed.", storage: nativeStorageStatus() };
await writeCollectionState(state);
console.log(JSON.stringify({ status: state.status, workers_reserved: 50, workers_launched: 0, batch_http_status: gate.status, errorCode: response.errorCode, message: response.message, retry_after: state.retry_after, request_id: state.batch_request_id, started_at, finished_at: state.finished_at }));
