#!/usr/bin/env node
/**
 * One-command, idempotent resume for the UAE AI Command Centre mission:   npm run resume   (or: node scripts/uae/resume.mjs [--deploy])
 *
 * Reads the latest checkpoint (local MISSION_STATE.json, else the newest successful execution of the OnDemand checkpoint workflow) and
 * reconciles reality against it. Every step is check-then-act, so re-running is safe:
 *   1. workflows  — GET each workflow id from mission/workflows.json; if missing or inactive → `workflows.mjs ensure` (PATCH/POST + activate).
 *   2. checkpoint — PATCH the checkpoint workflow's snapshot from the current MISSION_STATE.json / CHECKPOINTS.md (sync-checkpoint).
 *   3. preview    — GET <preview>/health; if not 200 and --deploy is given → scripts/resume-mission.sh deploy (new sandbox; prints markers).
 *   4. git        — reports branch/HEAD vs origin and whether the rollback tag exists remotely; never pushes on its own.
 * Needs ONDEMAND_API_KEY (or ON_DEMAND_API_KEY). Never prints secrets.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = (process.env.ONDEMAND_BASE_URL || process.env.ON_DEMAND_BASE_URL || "https://api.on-demand.io").replace(/\/$/, "");
const KEY = (process.env.ONDEMAND_API_KEY || process.env.ON_DEMAND_API_KEY || "").trim();
const deploy = process.argv.includes("--deploy");
const log = (k, v) => console.log(`${k.padEnd(12)} ${v}`);
const od = async (p) => { const r = await fetch(`${BASE}/automation/api${p}`, { headers: { apikey: KEY, "user-agent": "uae-ai-command-centre/1.0 (+resume)" } }); return { status: r.status, json: await r.json().catch(() => null) }; };
const node = (args) => spawnSync(process.execPath, [path.join(APP, "scripts/uae/workflows.mjs"), ...args], { stdio: "inherit", env: process.env }).status;

if (!KEY) { console.error("ONDEMAND_API_KEY / ON_DEMAND_API_KEY is not set"); process.exit(2); }
let state = {}; try { state = JSON.parse(fs.readFileSync(path.join(APP, "MISSION_STATE.json"), "utf8")); } catch { /* fall back to remote checkpoint */ }
const wf = JSON.parse(fs.readFileSync(path.join(APP, "mission/workflows.json"), "utf8")).workflows;
if (!state.updated_at && wf.checkpoint?.id) {
  const l = await od(`/execution/list?workflowID=${wf.checkpoint.id}`); const ok = (l.json?.data ?? []).find((e) => e.status === "success");
  if (ok) { const o = await od(`/execution/${ok.id}/node/outputs`); try { state = JSON.parse(o.json?.data?.outputs?.state?.value ?? "{}").mission_state ?? {}; log("checkpoint", `restored from remote execution ${ok.id}`); } catch { /* ignore */ } }
}
log("state", `updated_at=${state.updated_at ?? "?"} preview=${state.new?.preview_url ?? "?"}`);

// 1. workflows
let needEnsure = false;
for (const [k, w] of Object.entries(wf)) {
  const g = await od(`/workflow/${w.id}`); const d = g.json?.data;
  const l = await od(`/execution/list?workflowID=${w.id}`); const last = (l.json?.data ?? [])[0];
  log(`wf:${k}`, `HTTP ${g.status} isActive=${d?.isActive} cron=${d?.trigger?.cron?.expression} last=${last ? `${last.status}/${last.trigger?.type}@${new Date(last.startedAtInMilliseconds).toISOString()}` : "none"}`);
  if (g.status !== 200 || d?.isActive !== true) needEnsure = true;
}
if (needEnsure) { log("workflows", "missing/inactive → ensure"); node(["ensure"]); } else log("workflows", "all 3 active — no change");
// 2. checkpoint snapshot
node(["sync-checkpoint"]);
// 3. preview
const url = state.new?.preview_url;
let health = 0; if (url) { try { health = (await fetch(`${url}/health`, { signal: AbortSignal.timeout(8000) })).status; } catch { health = 0; } }
log("preview", `${url ?? "none"} → ${health || "unreachable"}`);
if (health !== 200) {
  if (deploy) spawnSync("bash", [path.join(APP, "scripts/resume-mission.sh"), "deploy"], { stdio: "inherit", env: process.env });
  else log("next", "preview is down — re-run with --deploy (needs VERCEL_TOKEN, VERCEL_TEAM_ID, VERCEL_PROJECT_ID) to create a new sandbox");
}
// 4. git
try {
  const g = (...a) => execFileSync("git", ["-C", APP, ...a]).toString().trim();
  const head = g("rev-parse", "--short", "HEAD"); const br = g("branch", "--show-current");
  let remote = "?"; try { remote = g("ls-remote", "origin", `refs/heads/${br}`).slice(0, 7) || "not pushed"; } catch { /* offline */ }
  let tag = "?"; try { tag = g("ls-remote", "origin", "refs/tags/bcap-pre-uae-20261020T2130Z") ? "pushed" : "not pushed"; } catch { /* offline */ }
  log("git", `branch=${br} HEAD=${head} origin=${remote} rollback-tag=${tag}`);
} catch { log("git", "not a git checkout"); }
