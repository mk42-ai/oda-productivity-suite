/**
 * social-refresh.ts — "B Capital Daily Intelligence Refresh" pipeline (server-side only; the OnDemand key never leaves this process).
 *
 * Fired by the Flow Builder workflow's webhook delivery (POST /social/refresh, X-Ingest-Secret / Basic / ?secret=) every day at 06:00 UTC,
 * or manually. No chatbatch skill exists in this runtime, so the batch is N parallel OnDemand Chat API jobs ("chat batches"):
 *   1. PitchBook  — ONE Investor Finder query for B Capital (plugin-1777018662, payload = docs/pitchbook-payload.md §2/§3). The plugin has NO
 *                   company-profile operation, so per-company PitchBook fields come from matching the "Recent Investment Activity" table rows
 *                   against the roster; unmatched companies get pitchbook=null + pitchbook_status "unmatched" (never fabricated).
 *   2. Perplexity — 12 parallel batches (plugin-1722260873, endpoint predefined-deepseek-flash) over every portfolio company: latest news, funding
 *                   rounds, founders/executives + social posts (source URL + domain kept for favicons) and an evidence-backed sentiment score.
 *                   TikTok (plugin-1716372717) is skipped: RapidAPI MONTHLY quota exceeded (HTTP 429) — logged as a skip.
 *   3. Takeaways  — a "B Capital Agent" comment for every NEW post only (dedupe by post id = sha1(platform|url), same ids as the 2026-10-12 merge),
 *                   generated with the flash-query config's Cerebras Qwen 3.8 endpoint (QWEN_ENDPOINT_ID below = web config-public.ts).
 *   4. Upsert     — sentiment + news go through POST /ingest (sentiment_history, roll-ups, deltas — replaces seed placeholders); data/portfolio.json,
 *                   people.json, social-feed.json are merged latest-first and their generated_at timestamps updated. Every step is timed and
 *                   counted in a run log (data/refresh-runs/<id>.json, GET /social/refresh/runs/:id).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ONDEMAND_USER_AGENT, config } from "./config.js";
import { readDataset } from "./social-data.js";
import { socialRejection } from "./social-policy.js";
import { nowIso } from "./db/client.js";
import { syncFilesToStore } from "./persist/feed.js";

const BASE = (process.env.ONDEMAND_BASE_URL ?? "https://api.on-demand.io").replace(/\/$/, "");
export const PERPLEXITY_ID = "plugin-1722260873";
export const PITCHBOOK_ID = "plugin-1777018662";
export const TIKTOK_ID = "plugin-1716372717";
export const RESEARCH_ENDPOINT = "predefined-deepseek-flash";
/** Same value as web/src/lib/ondemand/config-public.ts → QWEN_ENDPOINT_ID (flash-query config). */
export const QWEN_ENDPOINT_ID = "predefined-cerebras-qwen-3.8-27b";
export const WORKFLOW_NAME = "B Capital Daily Intelligence Refresh";
const DIR = path.join(process.cwd(), "data");
const RUNS = path.join(DIR, "refresh-runs");

type Step = { name: string; started_at: string | null; finished_at: string | null; ms: number | null; status: "pending" | "running" | "ok" | "partial" | "skipped" | "error"; counts: Record<string, number>; notes: string[] };
export type RefreshRun = {
  id: string; workflow_name: string; workflow_id: string | null; execution_id: string | null; trigger: string; status: "running" | "ok" | "partial" | "error";
  started_at: string; finished_at: string | null; method: string; steps: Step[]; summary: Record<string, number>; errors: string[]; skips: { source: string; reason: string }[]; batches: { job: string; session_ids: string[]; companies: number; ok: number; failed: number; started_at: string; finished_at: string | null }[];
};
const runs = new Map<string, RefreshRun>();
let current: string | null = null;

const hdrs = () => { const k = process.env.ONDEMAND_API_KEY ?? ""; if (!k) throw new Error("ONDEMAND_API_KEY is not configured"); return { apikey: k, "content-type": "application/json", "user-agent": ONDEMAND_USER_AGENT }; };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function od(pathname: string, body: unknown, timeoutMs: number): Promise<any> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(`${BASE}${pathname}`, { method: "POST", headers: hdrs(), body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
    if (r.status === 429 || r.status >= 500) { if (attempt < 3) { await sleep(1500 * 2 ** attempt + Math.random() * 500); continue; } }
    if (!r.ok) throw new Error(`HTTP ${r.status} ${pathname.replace(/[a-f0-9]{24}/, ":id")}`);
    return r.json();
  }
  throw new Error("retries exhausted");
}
async function chat(externalUserId: string, pluginIds: string[], query: string, endpointId: string, timeoutMs = 240_000, extra: Record<string, unknown> = {}): Promise<{ sessionId: string; answer: string }> {
  const s = await od("/chat/v1/sessions", { externalUserId, pluginIds, contextMetadata: [{ key: "workflow", value: WORKFLOW_NAME }] }, 60_000);
  const sessionId = String(s?.data?.id ?? "");
  const q = await od(`/chat/v1/sessions/${sessionId}/query`, { query, endpointId, responseMode: "sync", pluginIds, ...extra }, timeoutMs);
  return { sessionId, answer: String(q?.data?.answer ?? "") };
}
const jsonFrom = (t: string): any => { const m = t.match(/\{[\s\S]*\}/); if (!m) return null; try { return JSON.parse(m[0]); } catch { return null; } };
const host = (u: string | null | undefined) => { const m = /^https?:\/\/([^/]+)/i.exec(u ?? ""); return m ? m[1].toLowerCase().replace(/^www\./, "") : null; };
const iso = (d: unknown) => { const s = String(d ?? "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) && s <= nowIso().slice(0, 10) ? s : null; };
/** Same id scheme as the 2026-10-12 merge (Python sha1("|".join(map(str,args)))[:12], None → "None") so existing posts dedupe. */
const pid = (...a: unknown[]) => crypto.createHash("sha1").update(a.map((x) => (x === null || x === undefined ? "None" : String(x))).join("|")).digest("hex").slice(0, 12);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
async function pool<T, R>(items: T[], n: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { for (;;) { const k = i++; if (k >= items.length) return; out[k] = await fn(items[k], k); } }));
  return out;
}

const PB_BRIEF = `Stage: Growth / Late Stage
Raise Size (USD): $50-500M
Investor types: Venture Capital, Growth Equity
Target geographies: North America, Asia, Europe
Ticket size range: $10-100M
Industry / verticals: Software, AI/ML, Fintech, HealthTech, Climate Tech
What the company does: Find the investor "B Capital" (B Capital Group, Los Angeles; co-founded by Eduardo Saverin and Raj Ganguly). Return its full PitchBook investor profile: AUM, dry powder, team size, investment range, deal types, industries, verticals, geographies, and every portfolio company / recent investment listed as a markdown table | Company | Investment Date | Investor Since |.`;

const RESEARCH = (c: any) => `Research the startup "${c.name}" (website ${c.website ?? "unknown"}; HQ ${c.hq ?? c.region ?? "unknown"}), a B Capital portfolio company, using live web search. Today is ${nowIso().slice(0, 10)}. Return ONLY one JSON object, no prose, with keys:
{"description": str, "founded": int|null, "hq": str|null, "company_linkedin": url|null, "company_x": url|null,
 "founders": [{"name": str, "role": str, "linkedin": url|null, "x": url|null, "bio": str}],
 "executives": [{"name": str, "role": str, "linkedin": url|null}] (named leaders/employees, up to 12),
 "total_raised_usd": number|null, "employees": int|null,
 "funding_rounds": [{"round": str, "amount_usd": number|null, "date": "YYYY-MM-DD"|null, "lead_investors": [str], "source_url": url|null}],
 "news": [{"title": str, "url": url, "source": domain, "published_at": "YYYY-MM-DD"|null, "summary": str}] (up to 6, newest first, real dated articles),
 "recent_posts": [{"platform": "linkedin"|"x"|"news", "author": str, "text": str (<=280 chars), "url": url, "date": "YYYY-MM-DD"|null}] (founder/executive/company social posts, up to 5, newest first),
 "sentiment": {"score": number between -1 and 1, "label": "very negative"|"negative"|"neutral"|"positive"|"very positive", "evidence": [{"quote": str, "url": url}]} (judged ONLY from the dated news/posts above; 2-4 evidence items)}
Use null/[] when unknown. Never invent people, numbers or URLs.`;

function step(run: RefreshRun, name: string): Step { const s: Step = { name, started_at: null, finished_at: null, ms: null, status: "pending", counts: {}, notes: [] }; run.steps.push(s); return s; }
const begin = (s: Step) => { s.started_at = nowIso(); s.status = "running"; return Date.now(); };
const end = (s: Step, t0: number, status: Step["status"] = "ok") => { s.finished_at = nowIso(); s.ms = Date.now() - t0; s.status = status; };
function save(run: RefreshRun) { try { fs.mkdirSync(RUNS, { recursive: true }); fs.writeFileSync(path.join(RUNS, `${run.id}.json`), JSON.stringify(run, null, 1)); fs.writeFileSync(path.join(RUNS, "latest.json"), JSON.stringify(run, null, 1)); } catch { /* read-only FS */ } }
const writeJson = (name: string, obj: unknown) => fs.writeFileSync(path.join(DIR, `${name}.json`), JSON.stringify(obj, null, 1));

export function getRun(id: string): RefreshRun | null { if (id === "latest") id = current ?? [...runs.keys()].pop() ?? ""; const r = runs.get(id); if (r) return r; try { return JSON.parse(fs.readFileSync(path.join(RUNS, `${id === "" ? "latest" : id}.json`), "utf8")); } catch { return null; } }
export function listRuns() { return [...runs.values()].map((r) => ({ id: r.id, status: r.status, started_at: r.started_at, finished_at: r.finished_at, execution_id: r.execution_id, summary: r.summary })); }

export function startRefresh(opts: { trigger: string; workflowId?: string | null; executionId?: string | null; limit?: number; concurrency?: number; takeawaysOnly?: boolean; selfFetch: (path: string, init?: RequestInit) => Promise<Response> }): { run: RefreshRun; alreadyRunning: boolean } {
  if (current && runs.get(current)?.status === "running") return { run: runs.get(current)!, alreadyRunning: true };
  const id = `refresh-${nowIso().replace(/[:]/g, "")}-${crypto.randomBytes(2).toString("hex")}`;
  const run: RefreshRun = { id, workflow_name: WORKFLOW_NAME, workflow_id: opts.workflowId ?? process.env.DAILY_REFRESH_WORKFLOW_ID ?? null, execution_id: opts.executionId ?? null, trigger: opts.trigger, status: "running", started_at: nowIso(), finished_at: null,
    method: "OnDemand Chat API batch jobs in parallel (no chatbatch skill available in this runtime)", steps: [], summary: {}, errors: [], skips: [], batches: [] };
  runs.set(id, run); current = id; save(run);
  void (opts.takeawaysOnly ? backfillTakeaways(run) : execute(run, opts)).catch((e) => { run.errors.push(String((e as Error)?.message ?? e)); run.status = "error"; run.finished_at = nowIso(); save(run); });
  return { run, alreadyRunning: false };
}

async function execute(run: RefreshRun, opts: { limit?: number; concurrency?: number; takeawaysOnly?: boolean; selfFetch: (path: string, init?: RequestInit) => Promise<Response> }) {
  const NB = Math.min(Math.max(opts.concurrency ?? 12, 1), 16);
  // ---------- 0. roster ----------
  const s0 = step(run, "roster"); let t = begin(s0);
  const rosterRes = await opts.selfFetch("/companies?limit=200");
  const roster: any[] = ((await rosterRes.json()) as any).data.filter((c: any) => c.b_capital_role !== "firm").slice(0, opts.limit ?? 1000);
  s0.counts.companies = roster.length; end(s0, t); save(run);

  // ---------- 1. PitchBook ----------
  const s1 = step(run, "pitchbook_investor_finder"); t = begin(s1);
  const pbMatch = new Map<string, { investment_date: string; investor_since: string }>();
  let pbSession: string | null = null;
  try {
    const r = await chat("pitchbook-bot", [PITCHBOOK_ID], PB_BRIEF, RESEARCH_ENDPOINT, 280_000, { reasoningMode: "medium", modelConfigs: { temperature: 0.1 } });
    pbSession = r.sessionId; s1.notes.push(`session ${r.sessionId}`, `answer ${r.answer.length} chars`);
    const rows = [...r.answer.matchAll(/\|\s*([^|\n]+?)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|/g)].map((m) => ({ name: m[1].replace(/\s*\(.*\)\s*$/, "").trim().toLowerCase(), inv: m[2], since: m[3] }));
    s1.counts.table_rows = rows.length;
    for (const c of roster) { const nm = c.name.toLowerCase(); const hit = rows.find((x) => x.name === nm || x.name.startsWith(nm + " ") || nm.startsWith(x.name + " ") || x.name.replace(/\s+(ai|inc|labs)$/, "") === nm.replace(/\s+(ai|inc|labs)$/, "")); if (hit) pbMatch.set(c.slug, { investment_date: hit.inv, investor_since: hit.since }); }
    s1.counts.matched = pbMatch.size; s1.counts.unmatched = roster.length - pbMatch.size;
    s1.notes.push("plugin-1777018662 has no company-profile operation → per-company fields only via investor-table match; unmatched marked pitchbook_status=unmatched");
    end(s1, t, rows.length ? "ok" : "partial");
  } catch (e) { run.errors.push(`pitchbook: ${(e as Error).message}`); s1.counts.matched = 0; s1.counts.unmatched = roster.length; end(s1, t, "error"); }
  save(run);

  // ---------- 2. Perplexity batches (parallel chat jobs) ----------
  const s2 = step(run, "perplexity_research_batches"); t = begin(s2);
  run.skips.push({ source: `TikTok (${TIKTOK_ID})`, reason: "skipped — RapidAPI MONTHLY quota exceeded on plan BASIC (HTTP 429 at last probe, 2026-10-12)" });
  const research = new Map<string, any>();
  const batches = Array.from({ length: NB }, (_, i) => roster.filter((_, k) => k % NB === i));
  await Promise.all(batches.map(async (items, bi) => {
    const job = `chatbatch-${String(bi + 1).padStart(2, "0")}`; const b = { job, session_ids: [] as string[], companies: items.length, ok: 0, failed: 0, started_at: nowIso(), finished_at: null as string | null };
    run.batches.push(b);
    for (const c of items) {
      let done = false;
      for (let attempt = 0; attempt < 2 && !done; attempt++) {
        try { const r = await chat(`${job}-${run.id}`, [PERPLEXITY_ID], RESEARCH(c), RESEARCH_ENDPOINT, 240_000, { reasoningMode: "low", modelConfigs: { temperature: 0.1 } }); b.session_ids.push(r.sessionId); const j = jsonFrom(r.answer); if (j) { research.set(c.slug, { ...j, _session: r.sessionId, _batch: job }); b.ok++; done = true; } }
        catch (e) { if (attempt === 1) run.errors.push(`${job} ${c.slug}: ${(e as Error).message}`); }
      }
      if (!done) b.failed++;
      if ((b.ok + b.failed) % 4 === 0) save(run);
    }
    b.finished_at = nowIso();
  }));
  s2.counts.batches = NB; s2.counts.companies_ok = research.size; s2.counts.companies_failed = roster.length - research.size;
  end(s2, t, research.size === roster.length ? "ok" : research.size ? "partial" : "error"); save(run);

  // ---------- 3. sentiment + news → /ingest (replaces seed placeholders) ----------
  const s3 = step(run, "sentiment_and_news_ingest"); t = begin(s3);
  const body = { workflow_id: run.workflow_id, workflow_name: WORKFLOW_NAME, execution_id: run.execution_id, model: `${RESEARCH_ENDPOINT} + Perplexity (${PERPLEXITY_ID})`, run_at: nowIso(),
    companies: roster.filter((c) => research.has(c.slug)).map((c) => { const r = research.get(c.slug); const sen = r.sentiment && Number.isFinite(Number(r.sentiment.score)) && (r.sentiment.evidence ?? []).length ? { score: Number(r.sentiment.score), label: r.sentiment.label, evidence: (r.sentiment.evidence ?? []).filter((e: any) => e?.url).map((e: any) => ({ quote: String(e.quote ?? "").slice(0, 300), url: e.url, source: host(e.url) })) } : undefined;
      return { slug: c.slug, news: (r.news ?? []).filter((n: any) => n?.url && n?.title).map((n: any) => ({ title: n.title, url: n.url, source: n.source ?? host(n.url), published_at: iso(n.published_at), summary: n.summary ?? null })), ...(sen && sen.evidence.length ? { sentiment: sen } : {}) }; }) };
  const ing = await opts.selfFetch("/ingest", { method: "POST", headers: { "content-type": "application/json", "x-ingest-secret": config.ingestSecret }, body: JSON.stringify(body) });
  const ij: any = await ing.json().catch(() => ({}));
  s3.counts.http = ing.status; s3.counts.companies_touched = ij.companies_touched ?? 0; s3.counts.news_upserted = ij.news_upserted ?? 0; s3.counts.sentiment_rows = ij.sentiment_rows ?? 0;
  s3.counts.no_evidence_sentiment_skipped = body.companies.filter((c: any) => !c.sentiment).length; s3.notes.push(`ingest_run_id ${ij.ingest_run_id ?? "?"}`);
  end(s3, t, ing.ok ? "ok" : "error"); if (!ing.ok) run.errors.push(`ingest HTTP ${ing.status}: ${ij.message ?? ""}`); save(run);

  // ---------- 4. build posts / people, dedupe ----------
  const s4 = step(run, "build_posts_and_people"); t = begin(s4);
  const feedOld = readDataset("social-feed") ?? { posts: [] }; const pplOld = readDataset("people") ?? { people: [] }; const pfOld = readDataset("portfolio") ?? { companies: [] };
  const oldIds = new Set<string>((feedOld.posts ?? []).map((p: any) => p.id)); const oldKeys = new Set<string>((feedOld.posts ?? []).map((p: any) => String(p.url ?? p.text.slice(0, 80)).toLowerCase()));
  const pfBySlug = new Map<string, any>((pfOld.companies ?? []).map((c: any) => [c.slug, c]));
  const newPosts: any[] = []; const people = new Map<string, any>((pplOld.people ?? []).map((p: any) => [p.id, p])); let peopleTouched = 0, peopleNew = 0, dupes = 0;
  for (const c of roster) {
    const r = research.get(c.slug); if (!r) continue; const prev = pfBySlug.get(c.slug) ?? {}; const sector = prev.sector ?? "ai-enterprise";
    const meta = { company_slug: c.slug, company: c.name, sector, company_domain: host(c.website), sector_image: prev.sector ? `/media/sector-${({ robotics: "robotics-space", climate: "climate-mobility", fintech: "fintech", consumer: "consumer" } as Record<string, string>)[sector] ?? sector}.webp` : "/media/sector-ai-enterprise.webp" };
    const add = (p: any) => { if (socialRejection(p) !== null) return; const key = String(p.url ?? p.text.slice(0, 80)).toLowerCase(); if (oldIds.has(p.id) || oldKeys.has(key)) { dupes++; return; } oldIds.add(p.id); oldKeys.add(key); newPosts.push({ ...p, ...meta }); };
    for (const p of r.recent_posts ?? []) { const u = String(p?.url ?? ""); if (!/^https?:/.test(u)) continue; let pl = ["linkedin", "x", "news"].includes(p.platform) ? p.platform : "news"; if (u.includes("linkedin.com")) pl = "linkedin"; if (/(twitter|x)\.com\//.test(u)) pl = "x"; add({ id: pid(pl, u), platform: pl, source_domain: host(u), author: p.author ?? host(u), text: String(p.text ?? "").slice(0, 400), url: u, image: null, posted_at: iso(p.date) }); }
    for (const [kind, list] of [["founder", r.founders ?? []], ["executive", r.executives ?? []]] as const) for (const p of list as any[]) {
      const nm = String(p?.name ?? "").trim(); if (nm.length < 3 || /unknown|not (publicly|available)|n\/a/i.test(nm)) continue;
      const id = `${slugify(nm)}--${c.slug}`; const role = String(p.role ?? (kind === "founder" ? "Co-founder" : "Executive")).trim(); const k = kind === "founder" || /found/i.test(role) ? "founder" : "executive";
      const ex = people.get(id); const rec = { id, name: nm, role, kind: ex?.kind === "founder" ? "founder" : k, company_slug: c.slug, company: c.name, sector, bio: p.bio ?? ex?.bio ?? null, linkedin: /^https?:/.test(p.linkedin ?? "") ? p.linkedin : ex?.linkedin ?? null, x: /^https?:/.test(p.x ?? "") ? p.x : ex?.x ?? null,
        cover: ex?.cover ?? `/media/cover-${(parseInt(crypto.createHash("md5").update(id).digest("hex").slice(-8), 16) % 4) + 1}.webp`, source: "perplexity (plugin-1722260873) via OnDemand chat batch", session_id: r._session, refreshed_at: run.started_at };
      if (!ex) peopleNew++; peopleTouched++; people.set(id, rec);
    }
  }
  s4.notes.push("B Social rejects general-web research, news and financial summaries; only native social records with authenticated provider receipts may be added. Existing unverified records remain reversibly quarantined at read boundaries.");
  s4.counts.posts_new = newPosts.length; s4.counts.posts_existing_skipped_dedupe = dupes; s4.counts.people_refreshed = peopleTouched; s4.counts.people_new = peopleNew;
  s4.counts.founders_refreshed = [...people.values()].filter((p) => p.refreshed_at === run.started_at && p.kind === "founder").length; s4.counts.employees_refreshed = peopleTouched - s4.counts.founders_refreshed;
  end(s4, t); save(run);

  // ---------- 5. Qwen takeaways for NEW posts only ----------
  const s5 = step(run, "agent_takeaways_qwen"); t = begin(s5);
  const backfill = (feedOld.posts ?? []).filter((p: any) => socialRejection(p) === null && !p.agent_takeaway?.text);
  const needs = [...newPosts, ...backfill];
  const chunks: any[][] = []; for (let i = 0; i < needs.length; i += 20) chunks.push(needs.slice(i, i + 20));
  const take = new Map<string, string>(); let jobsOk = 0, jobsFail = 0;
  await pool(chunks, 2, async (ch, i) => {
    const items = ch.map((p) => ({ id: p.id, platform: p.platform, company: p.company, text: String(p.text).slice(0, 300) }));
    const q = `You are the 'B Capital Agent'. For EACH post below write ONE pinned takeaway comment (max 28 words) for a B Capital investor: what it signals for the portfolio company (traction, funding, risk, hiring, product). Use ONLY facts in the post text; if the post is generic, say what to watch. No hype, no invented numbers. Return ONLY a JSON object mapping id -> takeaway string.\nPOSTS:\n${JSON.stringify(items)}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { const r = await chat(`chatbatch-takeaways-${String(i).padStart(2, "0")}`, [], q, QWEN_ENDPOINT_ID, 120_000, { modelConfigs: { temperature: 0.2 } }); const j = jsonFrom(r.answer) ?? {}; let n = 0; for (const [k, v] of Object.entries(j)) if (typeof v === "string") { take.set(k, v); n++; } if (n) { jobsOk++; return; } }
      catch (e) { if (attempt === 2) { jobsFail++; run.errors.push(`takeaways chunk ${i}: ${(e as Error).message}`); return; } }
      await sleep(15_000 * (attempt + 1)); // Cerebras rate limit (HTTP 429) — back off and retry the same chunk
    }
    jobsFail++;
  });
  for (const p of newPosts) p.agent_takeaway = { author: "B Capital Agent", text: take.get(p.id) ?? null, model: QWEN_ENDPOINT_ID, pinned: true, generated_at: nowIso() };
  let backfilled = 0; for (const p of backfill) { const t2 = take.get(p.id); if (t2) { p.agent_takeaway = { author: "B Capital Agent", text: t2, model: QWEN_ENDPOINT_ID, pinned: true, generated_at: nowIso() }; backfilled++; } }
  s5.counts.backfilled_missing = backfilled; s5.counts.new_posts = newPosts.length; s5.counts.takeaways_generated = take.size; s5.counts.jobs = chunks.length; s5.counts.jobs_failed = jobsFail; s5.counts.existing_posts_not_recommented = (feedOld.posts ?? []).length - backfill.length;
  end(s5, t, jobsFail ? "partial" : "ok"); save(run);

  // ---------- 6. upsert JSON datasets latest-first ----------
  const s6 = step(run, "upsert_datasets"); t = begin(s6); const gen = nowIso();
  const companies: any[] = [];
  for (const c of roster) {
    const prev = pfBySlug.get(c.slug) ?? { slug: c.slug, name: c.name, sector: "ai-enterprise", sector_label: "AI & Enterprise", founders: [], funding_rounds: [], latest_news: [], sentiment: {} };
    const r = research.get(c.slug);
    const sj: any = await (await opts.selfFetch(`/companies/${c.slug}/sentiment?limit=30`)).json().catch(() => null);
    const cur = sj?.current ?? c.sentiment; const hist = (sj?.history ?? []).filter((h: any) => (h.model ?? "seed") !== "seed").map((h: any) => ({ t: h.recorded_at, score: h.score, model: h.model })).sort((a: any, b: any) => a.t.localeCompare(b.t));
    const isSeed = !cur || (cur.model ?? "") === "seed" || /seed/.test(cur.basis ?? "");
    const rounds = [...(r?.funding_rounds ?? []).map((f: any) => ({ round: f.round ?? null, amount_usd: f.amount_usd ?? null, date: iso(f.date), lead_investors: f.lead_investors ?? [], source_url: f.source_url ?? null, source: "perplexity" })), ...(prev.funding_rounds ?? [])];
    const seen = new Set<string>(); const fr = rounds.filter((x: any) => { const k = `${x.round}|${x.amount_usd}|${x.date}`; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a: any, b: any) => String(b.date ?? "0").localeCompare(String(a.date ?? "0")));
    const newsJ: any = await (await opts.selfFetch(`/companies/${c.slug}/news?limit=5`)).json().catch(() => null);
    const pb = pbMatch.get(c.slug);
    companies.push({ ...prev, hq: r?.hq ?? prev.hq ?? c.hq, employees: r?.employees ?? prev.employees ?? c.employees, founded: r?.founded ?? prev.founded ?? null, description: r?.description ?? prev.description ?? null,
      linkedin: r?.company_linkedin ?? prev.linkedin ?? c.linkedin_url, x: r?.company_x ?? prev.x ?? null, total_raised_usd: r?.total_raised_usd ?? prev.total_raised_usd ?? null, funding_rounds: fr, last_round: fr[0] ?? null,
      pitchbook: pb ? { ...pb, source: `PitchBook Investor Finder (${PITCHBOOK_ID})`, session_id: pbSession } : null, pitchbook_status: pb ? "matched" : "unmatched — not in the investor-profile table rows returned by the plugin",
      news_count: c.news_count ?? prev.news_count, latest_news: (newsJ?.data ?? prev.latest_news ?? []).slice(0, 5).map((n: any) => ({ title: n.title, url: n.url, source: n.source, published_at: n.published_at, image_url: n.image_url ?? null })),
      sentiment: { score: isSeed ? null : cur.score, label: isSeed ? "not yet scored" : cur.label, basis: cur?.basis ?? null, model: cur?.model ?? null, scored_at: cur?.scored_at ?? cur?.updated_at ?? null, evidence: isSeed ? [] : (cur.evidence ?? []).slice(0, 4), history: hist, history_state: hist.length < 2 ? "placeholder" : "scored", step2_snapshot: prev.sentiment?.step2_snapshot ?? null },
      founders: [...people.values()].filter((p) => p.company_slug === c.slug && p.kind === "founder").map((p) => p.id),
      research: r ? { session_id: r._session, batch: r._batch, refreshed_at: run.started_at } : { ...(prev.research ?? {}), refresh_failed: run.started_at } });
  }
  // A limited (test) run must never drop companies it did not refresh: keep every previous record that was outside this run's roster.
  const done = new Set(companies.map((c) => c.slug)); for (const c of pfOld.companies ?? []) if (!done.has(c.slug)) companies.push(c);
  companies.sort((a, b) => String(b.last_round?.date ?? b.pitchbook?.investment_date ?? "0").localeCompare(String(a.last_round?.date ?? a.pitchbook?.investment_date ?? "0")));
  const posts = [...newPosts, ...(feedOld.posts ?? [])].sort((a, b) => String(b.posted_at ?? "0").localeCompare(String(a.posted_at ?? "0")));
  const byPlatform: Record<string, number> = {}; posts.forEach((p) => { byPlatform[p.platform] = (byPlatform[p.platform] ?? 0) + 1; });
  const sources = { ...(pfOld.sources ?? {}), last_refresh: { run_id: run.id, workflow: WORKFLOW_NAME, workflow_id: run.workflow_id, execution_id: run.execution_id, at: gen } };
  const ppl = [...people.values()].sort((a, b) => (a.kind !== "founder" ? 1 : 0) - (b.kind !== "founder" ? 1 : 0) || a.company.localeCompare(b.company) || a.name.localeCompare(b.name));
  writeJson("portfolio", { ...pfOld, generated_at: gen, sources, count: companies.length, companies });
  writeJson("people", { ...pplOld, generated_at: gen, sources, count: ppl.length, founders: ppl.filter((p) => p.kind === "founder").length, employees: ppl.filter((p) => p.kind !== "founder").length, people: ppl });
  writeJson("social-feed", { ...feedOld, generated_at: gen, sources, count: posts.length, by_platform: byPlatform, unavailable_sources: [{ platform: "tiktok", reason: run.skips[0].reason }], posts });
  s6.counts.companies_written = companies.length; s6.counts.people_written = ppl.length; s6.counts.posts_written = posts.length;
  s6.counts.real_sentiment = companies.filter((c) => c.sentiment.score !== null).length; s6.counts.seed_placeholder_remaining = companies.filter((c) => c.sentiment.score === null).length;
  end(s6, t); save(run);

  run.summary = { companies: roster.length, companies_refreshed: research.size, founders_refreshed: s4.counts.founders_refreshed, employees_refreshed: s4.counts.employees_refreshed, people_new: peopleNew, posts_added: newPosts.length, takeaways_generated: take.size,
    pitchbook_matched: s1.counts.matched ?? 0, pitchbook_unmatched: s1.counts.unmatched ?? roster.length, sentiment_rows: s3.counts.sentiment_rows, news_upserted: s3.counts.news_upserted, errors: run.errors.length, skips: run.skips.length };
  run.status = run.errors.length ? "partial" : "ok"; run.finished_at = nowIso(); save(run);
  await persistAfterRun(run);
}
/** Durable snapshot job: every finished ingestion run is upserted into the durable store and a new OnDemand Media backup is scheduled. */
async function persistAfterRun(run: RefreshRun) {
  try { const { readSocialFeedFromFiles } = await import("./social-data.js"); const r = await syncFilesToStore(`social-refresh:${run.id}`, readSocialFeedFromFiles); run.summary.persisted_posts = r.upserted; save(run); }
  catch (e) { run.errors.push(`persist: ${(e as Error).message}`); save(run); }
}

/** Takeaways-only pass: comment every post that still has no takeaway (e.g. after a Cerebras HTTP 429). Posts that already have one are never re-commented. */
async function backfillTakeaways(run: RefreshRun) {
  const st = step(run, "agent_takeaways_backfill"); const t = begin(st);
  const feed = readDataset("social-feed") ?? { posts: [] }; const missing = (feed.posts ?? []).filter((p: any) => socialRejection(p) === null && !p.agent_takeaway?.text);
  const chunks: any[][] = []; for (let i = 0; i < missing.length; i += 20) chunks.push(missing.slice(i, i + 20));
  const take = new Map<string, string>(); let fail = 0;
  await pool(chunks, 2, async (ch, i) => {
    const q = `You are the 'B Capital Agent'. For EACH post below write ONE pinned takeaway comment (max 28 words) for a B Capital investor: what it signals for the portfolio company. Use ONLY facts in the post text; if generic, say what to watch. No invented numbers. Return ONLY a JSON object mapping id -> takeaway string.\nPOSTS:\n${JSON.stringify(ch.map((p) => ({ id: p.id, platform: p.platform, company: p.company, text: String(p.text).slice(0, 300) })))}`;
    for (let a = 0; a < 3; a++) { try { const r = await chat(`chatbatch-takeaways-backfill-${String(i).padStart(2, "0")}`, [], q, QWEN_ENDPOINT_ID, 120_000, { modelConfigs: { temperature: 0.2 } }); const j = jsonFrom(r.answer) ?? {}; let n = 0; for (const [k, v] of Object.entries(j)) if (typeof v === "string") { take.set(k, v); n++; } if (n) return; } catch (e) { if (a === 2) run.errors.push(`backfill chunk ${i}: ${(e as Error).message}`); } await sleep(15_000 * (a + 1)); }
    fail++;
  });
  let n = 0; for (const p of missing) { const v = take.get(p.id); if (v) { p.agent_takeaway = { author: "B Capital Agent", text: v, model: QWEN_ENDPOINT_ID, pinned: true, generated_at: nowIso() }; n++; } }
  feed.generated_at = nowIso(); writeJson("social-feed", feed);
  st.counts.missing_before = missing.length; st.counts.takeaways_generated = n; st.counts.missing_after = missing.length - n; st.counts.jobs = chunks.length; st.counts.jobs_failed = fail;
  end(st, t, n === missing.length ? "ok" : "partial");
  run.summary = { takeaways_generated: n, missing_before: missing.length, missing_after: missing.length - n, errors: run.errors.length };
  run.status = run.errors.length ? "partial" : "ok"; run.finished_at = nowIso(); save(run);
  await persistAfterRun(run);
}
