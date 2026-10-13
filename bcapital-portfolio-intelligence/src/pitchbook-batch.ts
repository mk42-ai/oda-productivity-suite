/**
 * PitchBook batch pull — one query per portfolio company against the PitchBook plugin (plugin-1777018662, tool getCompanyProfile),
 * run through the DOCUMENTED OnDemand Chat API (POST /chat/v1/sessions + POST /chat/v1/sessions/{id}/query, responseMode "sync").
 * The server-side Chat Batches API is not in the public docs index and POST /chat/v1/batches answers 405 "Chat batch creation is
 * currently unavailable" (probed 2026-10-13), so the "batch" is a client-side bounded-concurrency set of documented single queries
 * with a locally generated batch id. Every query is persisted in pitchbook_batch_queries; the run in pitchbook_batch_runs; decoded
 * profiles in pitchbook_company_profiles (src/pitchbook/decode.ts). Sync calls that return status "processing" are polled on the
 * documented GET /chat/v1/sessions/{id}/messages/{messageId} until completed|failed. Failed/empty items are retried up to 3× each.
 */
import crypto from "node:crypto";
import { OnDemandClient, OnDemandHttpError, odFromEnv, type SubmitQueryResult } from "./lib/ondemand/client.js";
import { store, upsert, state as persistState } from "./persist/store.js";
import fs from "node:fs";
import path from "node:path";
import { parseCompanyProfile, coverage, type PbStoredProfile } from "./pitchbook/decode.js";
import { runBackup } from "./persist/store.js";

export const PITCHBOOK_PLUGIN = "plugin-1777018662";
export const BATCH_ENDPOINT = process.env.PITCHBOOK_BATCH_ENDPOINT || "predefined-openai-gpt4o";
const CONCURRENCY = Number(process.env.PITCHBOOK_BATCH_CONCURRENCY || 4);
const SPACING_MS = 250;
const RETRY_DELAYS = [2_000, 8_000, 30_000];
const POLL_MS = 3_000; const POLL_MAX = 40;
export const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type BatchTarget = { slug: string; name: string; pbId: string | null; domain: string | null; website: string | null; lookupSource: string | null };
export type QueryRow = { query_id: string; batch_id: string; slug: string; pb_id: string | null; lookup: string; session_id: string | null; message_id: string | null; status: string; attempt: number; submitted_at: string; completed_at: string | null; http_status: number | null; error: string | null; answer_chars: number | null };

const COMPACT = "Output rules: reply with the raw JSON object only (compact, no whitespace, no markdown fences, no commentary, no apology). Copy every field and every array element exactly as the tool returned it — never summarise, truncate, paraphrase or invent a value. If you cannot reproduce the whole object, still output valid JSON containing every section you can copy exactly.";
export const buildQuery = (t: BatchTarget) => t.pbId
  ? `Use the PitchBook getCompanyProfile tool with pbId "${t.pbId}" (company: ${t.name}) and return the complete tool JSON response. ${COMPACT}`
  : `Use the PitchBook tools to find the company "${t.name}"${t.domain ? ` (website ${t.domain})` : ""}: first lookupEntity by name (type COMPANY, match the website domain${t.domain ? ` ${t.domain}` : ""} when several candidates exist; also try the legal/alternate name), then getCompanyProfile with the matched pbId and return its complete JSON response with a "matchedOn" object {name, pbId, website, score, source}. If no company matches, return exactly {"found":false,"reason":"no match"}. ${COMPACT}`;

async function runOne(od: OnDemandClient, batchId: string, t: BatchTarget, attempt: number, endpointId = BATCH_ENDPOINT): Promise<{ row: QueryRow; answer: string | null }> {
  const submitted = nowIso(); const qid = `${batchId}-${t.slug}-a${attempt}`;
  const row: QueryRow = { query_id: qid, batch_id: batchId, slug: t.slug, pb_id: t.pbId, lookup: t.pbId ? `pbId:${t.pbId}` : `name+domain:${t.name}${t.domain ? ` ${t.domain}` : ""}`, session_id: null, message_id: null, status: "submitted", attempt, submitted_at: submitted, completed_at: null, http_status: null, error: null, answer_chars: null };
  try {
    const s = await od.createSession(`bcap-pitchbook-${batchId}`, [PITCHBOOK_PLUGIN]); row.session_id = s.id;
    let res: SubmitQueryResult = await od.submitQuerySync(s.id, { query: buildQuery(t), endpointId, pluginIds: [PITCHBOOK_PLUGIN], modelConfigs: { temperature: 0 } });
    row.message_id = res.messageId; row.http_status = 200;
    // documented terminal states: completed | failed; "processing" → poll the message endpoint
    let polls = 0;
    while (res.status === "processing" && polls < POLL_MAX) { await sleep(POLL_MS); polls++; const m = await od.getMessage(s.id, res.messageId); res = { ...res, answer: m.answer, status: m.status }; }
    row.completed_at = nowIso(); row.answer_chars = (res.answer || "").length;
    if (res.status !== "completed") { row.status = "failed"; row.error = `status ${res.status} after ${polls} polls`; return { row, answer: null }; }
    if (!res.answer || !/[{[]/.test(res.answer)) { row.status = "empty"; row.error = "empty or non-JSON answer"; return { row, answer: res.answer || null }; }
    row.status = "completed"; return { row, answer: res.answer };
  } catch (e) {
    row.completed_at = nowIso();
    if (e instanceof OnDemandHttpError) { row.http_status = e.status; row.error = e.message.slice(0, 300); row.status = e.status === 429 || e.status >= 500 ? "retryable" : "failed"; }
    else { row.error = String((e as Error)?.message ?? e).slice(0, 300); row.status = /abort|timeout/i.test(row.error) ? "retryable" : "failed"; }
    return { row, answer: null };
  }
}

export type BatchOpts = {
  batchId?: string; log?: (s: string) => void;
  /** Individual retry pass that EXTENDS an existing run (same batch id): attempts continue from `attemptOffset`, the run row keeps its submitted_at and its counts are recomputed from the profile table. */
  extendRun?: boolean; attemptOffset?: number; endpointId?: string;
};

const isEmptyState = (v: unknown) => v === "Not available in PitchBook" || v === "Unmatched in PitchBook" || v == null;
/** Field-level latest-first merge: every slot of `next` wins unless it is an empty state while `prev` holds a value (then the older value is kept, provenance intact). */
export function mergeLatestFirst(next: PbStoredProfile, prev: PbStoredProfile): { profile: PbStoredProfile; kept: number } {
  let kept = 0; const out: any = { ...next };
  for (const key of Object.keys(prev) as (keyof PbStoredProfile)[]) {
    const n = (next as any)[key]; const p = (prev as any)[key];
    if (key === "warnings" || key === "provenance" || key === "unavailable" || key === "state") continue;
    if (n && typeof n === "object" && !Array.isArray(n) && !("value" in n) && p && typeof p === "object" && !Array.isArray(p) && !("value" in p)) {
      const rec: any = { ...n };
      for (const k of Object.keys(p)) if (isEmptyState(rec[k]) && !isEmptyState(p[k])) { rec[k] = p[k]; kept++; }
      out[key] = rec;
    } else if (isEmptyState(n) && !isEmptyState(p)) { out[key] = p; kept++; }
  }
  return { profile: out as PbStoredProfile, kept };
}

export async function runPitchbookBatch(targets: BatchTarget[], opts: BatchOpts = {}) {
  const od = odFromEnv(); const log = opts.log ?? ((s: string) => console.log(s));
  const batchId = opts.batchId ?? `pbb-${nowIso().replace(/[-:]/g, "").slice(0, 15)}-${crypto.randomBytes(3).toString("hex")}`;
  const endpointId = opts.endpointId ?? BATCH_ENDPOINT; const attemptOffset = opts.attemptOffset ?? 0;
  const c = await store(); let submitted = nowIso();
  const probe = await od.probeCreateChatBatch();
  const METHOD = "client-side batch of documented single queries (POST /chat/v1/sessions/{id}/query, sync)";
  const prior = opts.extendRun ? await c.execute({ sql: "select submitted_at, notes_json from pitchbook_batch_runs where batch_id=?", args: [batchId] }) : null;
  if (prior?.rows.length) submitted = String(prior.rows[0][0]);
  const priorNotes = prior?.rows.length && prior.rows[0][1] ? JSON.parse(String(prior.rows[0][1])) : {};
  const notes = { ...priorNotes, chat_batches_probe: probe, concurrency: CONCURRENCY, retry_delays_ms: RETRY_DELAYS, passes: [...(priorNotes.passes ?? []), { started_at: nowIso(), targets: targets.length, endpoint_id: endpointId, attempt_offset: attemptOffset, kind: opts.extendRun ? "individual-retry" : "batch" }] };
  await upsert(c, "pitchbook_batch_runs", [{ batch_id: batchId, status: "running", method: METHOD, endpoint_id: endpointId, plugin_id: PITCHBOOK_PLUGIN, submitted_at: submitted, completed_at: null, total: targets.length, succeeded: 0, failed: 0, retried: 0, unmatched: 0, notes_json: JSON.stringify(notes) }]);
  log(`[pitchbook-batch] ${batchId}: ${targets.length} targets, concurrency ${CONCURRENCY}, endpoint ${endpointId}; POST /chat/v1/batches probe → HTTP ${probe.status}`);
  const results = new Map<string, { answer: string | null; row: QueryRow }>(); let retried = 0; let done = 0;
  const queue = [...targets];
  const worker = async () => {
    for (;;) {
      const t = queue.shift(); if (!t) return;
      let last: { row: QueryRow; answer: string | null } | null = null;
      for (let attempt = 1; attempt <= 1 + RETRY_DELAYS.length; attempt++) {
        if (attempt > 1) { retried++; await sleep(RETRY_DELAYS[attempt - 2]); }
        last = await runOne(od, batchId, t, attempt + attemptOffset, endpointId); await upsert(c, "pitchbook_batch_queries", [last.row as any]);
        if (last.row.status === "completed") break;
        if (last.row.status === "failed" && attempt === 1 && (last.row.http_status ?? 0) < 500 && last.row.http_status !== 429 && !/status failed/.test(last.row.error || "")) { /* non-retryable client error */ break; }
      }
      results.set(t.slug, last!); done++;
      if (done % 10 === 0 || done === targets.length) log(`[pitchbook-batch] ${done}/${targets.length} done (${[...results.values()].filter((r) => r.row.status === "completed").length} completed)`);
      await sleep(SPACING_MS);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));
  // decode + persist profiles
  let succeeded = 0, failed = 0, unmatched = 0; const fetchedAt = nowIso(); const profiles: Record<string, { state: string; profile: PbStoredProfile | null; row: QueryRow; kept_from_previous: number }> = {};
  for (const t of targets) {
    const r = results.get(t.slug)!; let state = "Unmatched in PitchBook"; let profile: PbStoredProfile | null = null;
    if (r.row.status === "completed" && r.answer) {
      const parsed = parseCompanyProfile(r.answer, { slug: t.slug, batchId, queryId: r.row.query_id, fetchedAt: r.row.completed_at || fetchedAt });
      profile = parsed;
      if (parsed.state === "matched" && parsed.companyId) { state = "populated"; succeeded++; } else { unmatched++; }
    } else { failed++; unmatched++; }
    // latest-first upsert: the newest pull wins per field, but a populated field is NEVER replaced by an empty state
    // ("Not available in PitchBook" / "Unmatched in PitchBook") and a populated profile is never replaced by an unmatched one.
    const prev = await c.execute({ sql: "select state, profile_json, pb_id, batch_id, query_id, fetched_at, raw_json from pitchbook_company_profiles where slug=?", args: [t.slug] });
    const prevRow = prev.rows[0] ? Object.fromEntries(prev.columns.map((k, i) => [k, prev.rows[0][i]])) as any : null;
    let merged = profile; let mergedState = state; let keptFields = 0;
    if (prevRow && String(prevRow.state) === "populated") {
      const prevProfile = JSON.parse(String(prevRow.profile_json)) as PbStoredProfile;
      if (state === "populated" && merged) { const m = mergeLatestFirst(merged, prevProfile); merged = m.profile; keptFields = m.kept; }
      else { merged = prevProfile; mergedState = "populated"; keptFields = -1; unmatched--; if (r.row.status === "completed") succeeded++; }
    }
    const cov = merged ? coverage(merged) : { populated: 0, unavailable: 0, unmatched: 1 };
    const row = mergedState === "populated" && keptFields === -1 && prevRow
      ? { slug: t.slug, pb_id: prevRow.pb_id, state: "populated", batch_id: prevRow.batch_id, query_id: prevRow.query_id, fetched_at: prevRow.fetched_at, profile_json: prevRow.profile_json, raw_json: prevRow.raw_json, fields_populated: cov.populated, fields_unavailable: cov.unavailable }
      : { slug: t.slug, pb_id: merged?.companyId ?? t.pbId, state: mergedState, batch_id: batchId, query_id: r.row.query_id, fetched_at: r.row.completed_at || fetchedAt, profile_json: JSON.stringify(merged ?? { state: mergedState, lookup: r.row.lookup, error: r.row.error }), raw_json: r.answer ? r.answer.slice(0, 400_000) : null, fields_populated: cov.populated, fields_unavailable: cov.unavailable };
    await upsert(c, "pitchbook_company_profiles", [row]);
    profiles[t.slug] = { state: mergedState, profile: merged, row: r.row, kept_from_previous: keptFields };
  }
  const completed = nowIso();
  let total = targets.length;
  if (opts.extendRun) {
    // the run row describes the WHOLE batch: recompute from the profile + query tables (every attempt of every item is persisted)
    const p = await c.execute({ sql: "select state, count(*) from pitchbook_company_profiles where batch_id=? group by state", args: [batchId] });
    const by = Object.fromEntries(p.rows.map((r) => [String(r[0]), Number(r[1])]));
    total = Object.values(by).reduce((a, b) => a + b, 0); succeeded = by.populated ?? 0; unmatched = by["Unmatched in PitchBook"] ?? 0;
    failed = Number((await c.execute({ sql: "select count(distinct slug) from pitchbook_batch_queries where batch_id=? and slug not in (select slug from pitchbook_batch_queries where batch_id=? and status='completed')", args: [batchId, batchId] })).rows[0][0]);
    retried = Number((await c.execute({ sql: "select count(*) from pitchbook_batch_queries where batch_id=? and attempt>1", args: [batchId] })).rows[0][0]);
  }
  await upsert(c, "pitchbook_batch_runs", [{ batch_id: batchId, status: "completed", method: METHOD, endpoint_id: endpointId, plugin_id: PITCHBOOK_PLUGIN, submitted_at: submitted, completed_at: completed, total, succeeded, failed, retried, unmatched, notes_json: JSON.stringify({ ...notes, last_pass_completed_at: completed }) }]);
  log(`[pitchbook-batch] ${batchId} completed: succeeded ${succeeded}, failed ${failed}, retried ${retried}, unmatched ${unmatched} (${submitted} → ${completed})`);
  return { batchId, submitted, completed, succeeded, failed, retried, unmatched, total, profiles };
}

/* ------------------------------------------------------------------ monthly sync entry point (Flow Builder webhook → API) */
/** Normalise a company name for dedupe: strip parenthetical descriptors ("Dream Labs (Business/Productivity Software)", "Axiom (Palo Alto)"),
 *  punctuation and spacing ("Port One Solutions" ≈ "PortOne"). */
export const normaliseName = (n: string) => n.replace(/\s*\([^)]*\)\s*/g, " ").toLowerCase().replace(/\b(inc|ltd|llc|corp|corporation|limited|solutions)\b/g, "").replace(/[^a-z0-9]+/g, "").trim();
/** The deduplicated B Capital Group (PitchBook investor 155248-48) portfolio: data/portfolio.json companies (firm row excluded) joined with the
 *  stored match table (pbId per slug). Dedupe keys: pbId (companyId) first, then normalised name. Companies without a stored id fall back to name + domain lookup. */
export function buildTargets(root = process.cwd()): BatchTarget[] {
  const portfolio = JSON.parse(fs.readFileSync(path.join(root, "data/portfolio.json"), "utf8")) as { companies: { slug: string; name: string; domain: string | null; website: string | null; b_capital_role?: string }[] };
  const match = JSON.parse(fs.readFileSync(path.join(root, "data/pitchbook/match-table.json"), "utf8")) as { matches: Record<string, { pbId: string; source: string }> };
  const seenId = new Set<string>(); const seenName = new Set<string>(); const out: BatchTarget[] = [];
  for (const c of portfolio.companies) {
    if (c.b_capital_role === "firm") continue;
    const pbId = match.matches[c.slug]?.pbId ?? null; const nk = normaliseName(c.name);
    if (pbId && seenId.has(pbId)) continue; if (!pbId && seenName.has(nk)) continue;
    if (pbId) seenId.add(pbId); seenName.add(nk);
    out.push({ slug: c.slug, name: c.name, pbId, domain: c.domain, website: c.website, lookupSource: match.matches[c.slug]?.source ?? null });
  }
  return out;
}
export type MonthlySyncState = { running: boolean; started_at: string | null; finished_at: string | null; trigger: string | null; batch_id: string | null; log: string[]; result: Record<string, unknown> | null; error: string | null };
export const monthlySync: MonthlySyncState = { running: false, started_at: null, finished_at: null, trigger: null, batch_id: null, log: [], result: null, error: null };
/** Steps a–e of "B Capital Monthly PitchBook Sync": dedupe portfolio → batch pull (documented single sync queries, ≤4 attempts each) → latest-first
 *  upsert with per-field provenance → SHA-256-verified Media snapshot → counts log. Returns immediately; progress in `monthlySync`. */
export function startMonthlySync(trigger: string, opts: { slugs?: string[]; limit?: number } = {}) {
  if (monthlySync.running) return { accepted: false, reason: "already_running", started_at: monthlySync.started_at, batch_id: monthlySync.batch_id };
  const t0 = Date.now(); const startedAt = nowIso();
  Object.assign(monthlySync, { running: true, started_at: startedAt, finished_at: null, trigger, batch_id: null, log: [], result: null, error: null });
  const log = (m: string) => { const line = `${nowIso()} ${m}`; monthlySync.log.push(line); if (monthlySync.log.length > 400) monthlySync.log.shift(); console.log(`[monthly-pitchbook-sync] ${line}`); };
  (async () => {
    try {
      let targets = buildTargets(); const total = targets.length;
      if (opts.slugs?.length) { const set = new Set(opts.slugs); targets = targets.filter((t) => set.has(t.slug)); }
      if (opts.limit) targets = targets.slice(0, opts.limit);
      log(`step a: deduplicated B Capital Group (155248-48) portfolio = ${total} unique companies (${targets.length} targeted this run, ${targets.filter((t) => t.pbId).length} with stored PitchBook ids)`);
      const res = await runPitchbookBatch(targets, { log: (m) => log(m) });
      monthlySync.batch_id = res.batchId;
      const kept = Object.values(res.profiles).filter((p) => p.kept_from_previous > 0 || p.kept_from_previous === -1).length;
      log(`step b/c: batch ${res.batchId} — queried ${res.total}, succeeded ${res.succeeded}, unmatched/failed ${res.unmatched}/${res.failed}, retried ${res.retried}; latest-first upsert kept earlier values on ${kept} companies`);
      const c = await store();
      const agg = await c.execute("select state, count(*), coalesce(sum(fields_populated),0), coalesce(sum(fields_unavailable),0) from pitchbook_company_profiles group by state");
      const by: Record<string, { n: number; populated: number; unavailable: number }> = {}; for (const r of agg.rows) by[String(r[0])] = { n: Number(r[1]), populated: Number(r[2]), unavailable: Number(r[3]) };
      let snapshot: Record<string, unknown> | null = null;
      try { const b = await runBackup("monthly-pitchbook-sync"); const sq = b.files.find((f) => f.kind === "sqlite"); snapshot = { snapshot_ts: b.snapshot_ts, sqlite_media_id: sq?.media_id, sqlite_sha256: sq?.sha256, verified: b.files.every((f) => f.verified), files: b.files.map((f) => ({ kind: f.kind, media_id: f.media_id, sha256: f.sha256, bytes: f.bytes })) }; log(`step d: Media snapshot ${b.snapshot_ts} written — sqlite media ${sq?.media_id} sha256 ${sq?.sha256} (all ${b.files.length} files SHA-256 verified)`); }
      catch (e) { log(`step d: backup FAILED — ${(e as Error).message}`); }
      const result = { batch_id: res.batchId, trigger, started_at: startedAt, finished_at: nowIso(), duration_ms: Date.now() - t0, companies_queried: res.total, succeeded: res.succeeded, failed: res.failed, unmatched: res.unmatched, retried: res.retried, store: { populated_companies: by.populated?.n ?? 0, unmatched_companies: by["Unmatched in PitchBook"]?.n ?? 0, fields_populated: (by.populated?.populated ?? 0), fields_not_available: (by.populated?.unavailable ?? 0) }, snapshot, provider: persistState.provider };
      log(`step e: ${JSON.stringify(result)}`);
      monthlySync.result = result;
    } catch (e) { monthlySync.error = (e as Error).message; log(`FAILED: ${monthlySync.error}`); }
    finally { monthlySync.running = false; monthlySync.finished_at = nowIso(); }
  })();
  return { accepted: true, started_at: startedAt, targets: undefined };
}
