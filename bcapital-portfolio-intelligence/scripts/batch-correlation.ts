/**
 * batch-correlation.ts — repeatable evidence batch for /reputation (Reputation & Prestige).
 *
 *   node node_modules/tsx/dist/cli.mjs scripts/batch-correlation.ts            (from bcapital-portfolio-intelligence/)
 *
 * Inputs (all local, read-only):
 *   - data/correlation/raw/*.jsonl         per-entity collections (agents 1–4) + brief seeds, each {entity, factor, category, headline,
 *                                          source_url, source_name, published_date, sentiment, related_entity?, reject_reason?, retrieved_at}
 *   - data/portfolio.sqlite                news_items for the 136 portfolio companies (portfolio fan-out, 10 shards)
 *   - web/src/data/social/social-feed.json native social posts for the portfolio (portfolio fan-out, 10 shards)
 *   - web/src/lib/reputation/data/entities.ts  the existing 59 sourced factors
 *
 * Pipeline: ingest → validate in concurrent chunks of CHUNK_SIZE (retry ×RETRIES) → normalise dates → reject (no URL / no date / bad
 * URL / future / implausible / entity mismatch) → dedupe (canonical URL + normalised headline, then syndicated headline) → weight
 * (source credibility × recency half-life) → Wilson confidence per entity/category → conflicts (same fund, different figures — surfaced,
 * never averaged) → the ported correlation engine (runEngine, UNCHANGED) → scores via src/scoring.ts scorePortfolio (UNCHANGED).
 *
 * Outputs: data/correlation/items.jsonl, rejects.jsonl, conflicts.jsonl, summary.json and web/src/data/reputation-batch.json (UI payload).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import initSqlJs from "sql.js";
import { runEngine } from "../web/src/lib/reputation/engine/engine";
import { DEFAULT_PARAMS, type CorrelationResult } from "../web/src/lib/reputation/engine/types";
import type { Post } from "../web/src/lib/reputation/engine/rilian-types";
import { ENTITIES } from "../web/src/lib/reputation/data/entities";
import { credibility, scorePortfolio, wilsonLower, type CompanyInput, type SignalScore } from "../src/scoring";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW = path.join(ROOT, "data/correlation/raw");
const OUT = path.join(ROOT, "data/correlation");
export const CHUNK_SIZE = 250;
export const RETRIES = 2;
export const BATCH_HALF_LIFE_DAYS = 365; // item-level recency weight (evidence spans 2012–2026); scoring.ts keeps its own 14 d half-life
export const NOW_ISO = process.env.BATCH_NOW ?? "2026-10-18T00:00:00Z";
const NOW = Date.parse(NOW_ISO);
const DAY = 86_400_000;

export const ENTITY_IDS = ["b-capital", "eduardo-saverin", "raj-ganguly", "karan-mohla"] as const;
type EntityId = (typeof ENTITY_IDS)[number];
const HANDLE: Record<EntityId, string> = Object.fromEntries(ENTITIES.map((e) => [e.id, e.handle])) as Record<EntityId, string>;
const NAME: Record<EntityId, string> = Object.fromEntries(ENTITIES.map((e) => [e.id, e.name])) as Record<EntityId, string>;
/** Prestige categories (fund size/AUM, exits, unicorns, IPOs, rankings, board seats, press tier, LP quality, sector leadership). */
export const PRESTIGE_CATEGORIES = new Set(["aum-fund-size", "exits", "unicorns", "ipos", "rankings", "board-seats", "media-sentiment", "co-investor-lp-quality", "sector-leadership"]);

export type RawItem = { entity?: string; factor?: string; category?: string; headline?: string; source_url?: string; source_name?: string; published_date?: string; sentiment?: number | null; related_entity?: string; reject_reason?: string; retrieved_at?: string; collector?: string; company_slug?: string; sector?: string; origin?: string };
export type Item = { id: string; entity: EntityId; factor: string; category: string; headline: string; source_url: string; source_name: string; published_date: string; date_precision: "day" | "month" | "year" | "second"; sentiment: number; weight: number; credibility: number; tier: string; recency: number; retrieved_at: string; collector: string; origin: string; company_slug?: string; related_entity?: EntityId };
export type Reject = { reason: string; entity: string | null; headline: string | null; source_url: string | null; published_date: string | null; collector: string | null; origin: string; detail?: string };

const clip = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
/** Drop lone UTF-16 surrogates (a social headline cut mid-emoji) so every output is valid UTF-8. */
export const wellFormed = (s: string) => s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
const r3 = (x: number) => Math.round(x * 1000) / 1000;

/** Canonical URL: lower-case host without www, no hash, no tracking params, no trailing slash. */
export function canonicalUrl(u: string): string | null {
  try {
    const url = new URL(u.trim());
    if (!/^https?:$/.test(url.protocol)) return null;
    url.hash = "";
    for (const k of [...url.searchParams.keys()]) if (/^utm_|^(fbclid|gclid|mc_cid|mc_eid|ref|s|t)$/i.test(k)) url.searchParams.delete(k);
    const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^twitter\.com$/, "x.com");
    return `https://${host}${url.pathname.replace(/\/+$/, "")}${url.search}`;
  } catch {
    return null;
  }
}
export const normHeadline = (h: string) => h.toLowerCase().replace(/https?:\/\/\S+/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Date normalisation → ISO date string + precision; null when unparseable. */
export function normaliseDate(d: string | null | undefined): { iso: string; precision: Item["date_precision"] } | null {
  const s = (d ?? "").trim();
  if (!s) return null;
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/))) { const t = Date.parse(s.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s}Z`); return Number.isFinite(t) ? { iso: new Date(t).toISOString().replace(/\.\d{3}Z$/, "Z"), precision: "second" } : null; }
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return Number.isFinite(Date.parse(`${s}T00:00:00Z`)) ? { iso: s, precision: "day" } : null;
  if ((m = s.match(/^(\d{4})-(\d{2})$/))) return { iso: `${m[1]}-${m[2]}-01`, precision: "month" };
  if ((m = s.match(/^(\d{4})$/))) return { iso: `${m[1]}-01-01`, precision: "year" };
  const t = Date.parse(s);
  return Number.isFinite(t) ? { iso: new Date(t).toISOString().slice(0, 10), precision: "day" } : null;
}

async function withRetry<T>(fn: () => Promise<T>, label: string, retries = RETRIES): Promise<{ value: T; attempts: number }> {
  let last: unknown;
  for (let a = 1; a <= retries + 1; a++) {
    try { return { value: await fn(), attempts: a }; } catch (e) { last = e; }
  }
  throw new Error(`${label} failed after ${retries + 1} attempts: ${(last as Error)?.message ?? last}`);
}

/* ---------------- ingest ---------------- */
async function ingest(): Promise<{ raw: RawItem[]; perSource: Record<string, number>; shards: Record<string, number> }> {
  const raw: RawItem[] = [];
  const perSource: Record<string, number> = {};
  for (const f of fs.readdirSync(RAW).filter((x) => x.endsWith(".jsonl")).sort()) {
    const lines = fs.readFileSync(path.join(RAW, f), "utf8").split("\n").filter(Boolean);
    for (const l of lines) raw.push({ ...(JSON.parse(l) as RawItem), origin: `raw/${f}` });
    perSource[`raw/${f}`] = lines.length;
  }
  // existing 59 sourced factors
  let nf = 0;
  for (const e of ENTITIES) for (const f of e.factors) {
    raw.push({ entity: e.id, factor: f.title, category: f.category, headline: `${f.title}. ${f.detail}`, source_url: f.sourceUrl, source_name: f.sourceName, published_date: f.sourceDate, sentiment: f.riskFlag ? -0.4 : f.verified ? 0.5 : 0, related_entity: f.relatedEntity, collector: "entities.ts", retrieved_at: "2026-10-18T02:00:00Z", origin: "factors/entities.ts", ...(f.verified ? {} : { reject_reason: "not_verified" }) });
    nf++;
  }
  perSource["factors/entities.ts"] = nf;
  // portfolio fan-out: 136 companies round-robin into 10 shards, processed concurrently
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(path.join(ROOT, "data/portfolio.sqlite")));
  const companies = (db.exec("select slug, name, sector from companies where slug != 'b-capital' order by slug")[0]?.values ?? []) as [string, string, string][];
  const news = (db.exec("select company_slug, title, url, source, published_at, sentiment_score, created_at from news_items")[0]?.values ?? []) as [string, string, string | null, string | null, string | null, number | null, string][];
  const latest = new Map<string, number>();
  for (const [slug, score] of (db.exec("select company_slug, score from sentiment_history order by recorded_at asc")[0]?.values ?? []) as [string, number][]) latest.set(slug, score);
  db.close();
  const feed = JSON.parse(fs.readFileSync(path.join(ROOT, "web/src/data/social/social-feed.json"), "utf8")) as { generated_at: string; posts: { url: string; posted_at: string | null; text: string; company_slug: string | null; platform: string; sentiment?: { score?: number } | null }[] };
  const shards: Record<string, number> = {};
  const shardOf = new Map(companies.map(([slug], i) => [slug, i % 10]));
  const nameOf = new Map(companies.map(([slug, name]) => [slug, name]));
  const catFor = (t: string) => (/unicorn/i.test(t) ? "unicorns" : /\bIPO\b|listing/i.test(t) ? "ipos" : /acquir|acquisition|merger/i.test(t) ? "exits" : "portfolio-news");
  await Promise.all(Array.from({ length: 10 }, async (_, shard) => {
    let n = 0;
    for (const [slug, title, url, source, published_at, s, created] of news) {
      if (shardOf.get(slug) !== shard) continue;
      raw.push({ entity: "b-capital", factor: `Portfolio: ${nameOf.get(slug)}`, category: catFor(title), headline: title, source_url: url ?? "", source_name: source ?? "", published_date: published_at ?? "", sentiment: s ?? latest.get(slug) ?? 0, company_slug: slug, collector: `portfolio-shard-${shard}`, retrieved_at: created, origin: "portfolio/news_items" });
      n++;
    }
    for (const p of feed.posts) {
      if (!p.company_slug || shardOf.get(p.company_slug) !== shard) continue;
      raw.push({ entity: "b-capital", factor: `Portfolio: ${nameOf.get(p.company_slug)}`, category: "portfolio-social", headline: p.text.replace(/\s+/g, " ").trim().slice(0, 160), source_url: p.url, source_name: p.platform, published_date: p.posted_at ?? "", sentiment: p.sentiment?.score ?? 0, company_slug: p.company_slug, collector: `portfolio-shard-${shard}`, retrieved_at: feed.generated_at, origin: "portfolio/social-feed" });
      n++;
    }
    shards[`shard-${shard}`] = n;
  }));
  perSource["portfolio/news_items"] = news.length;
  perSource["portfolio/social-feed (portfolio companies)"] = raw.filter((r) => r.origin === "portfolio/social-feed").length;
  return { raw, perSource, shards };
}

/* ---------------- validate + normalise (chunked, concurrent, retried) ---------------- */
function validateOne(r: RawItem, idx: number): Item | Reject {
  const base = { entity: r.entity ?? null, headline: r.headline ?? null, source_url: r.source_url ?? null, published_date: r.published_date ?? null, collector: r.collector ?? null, origin: r.origin ?? "?" };
  if (r.reject_reason) return { ...base, reason: r.reject_reason };
  if (!r.entity || !(ENTITY_IDS as readonly string[]).includes(r.entity)) return { ...base, reason: "unknown_entity" };
  if (!r.source_url) return { ...base, reason: "missing_url" };
  const url = canonicalUrl(r.source_url);
  if (!url) return { ...base, reason: "invalid_url" };
  if (!r.published_date) return { ...base, reason: "missing_date" };
  const d = normaliseDate(r.published_date);
  if (!d) return { ...base, reason: "invalid_date" };
  const t = Date.parse(d.iso.length === 10 ? `${d.iso}T00:00:00Z` : d.iso);
  if (t > NOW + DAY) return { ...base, reason: "future_date" };
  if (t < Date.parse("2000-01-01T00:00:00Z")) return { ...base, reason: "implausible_date" };
  const headline = wellFormed(r.headline ?? "").trim();
  if (!headline) return { ...base, reason: "missing_headline" };
  const s = typeof r.sentiment === "number" && Number.isFinite(r.sentiment) ? clip(r.sentiment, -1, 1) : 0;
  const cred = credibility(url);
  const recency = Math.pow(0.5, Math.max(0, (NOW - t) / DAY) / BATCH_HALF_LIFE_DAYS);
  const weight = r3(cred.weight * recency);
  return {
    id: `itm-${idx.toString(36)}`, entity: r.entity as EntityId, factor: r.factor ?? headline.slice(0, 60), category: r.category ?? "media-sentiment", headline, source_url: url, source_name: r.source_name || new URL(url).hostname,
    published_date: d.iso, date_precision: d.precision, sentiment: r3(s), weight, credibility: cred.weight, tier: cred.tier, recency: r3(recency), retrieved_at: r.retrieved_at ?? NOW_ISO, collector: r.collector ?? "?", origin: r.origin ?? "?",
    ...(r.company_slug ? { company_slug: r.company_slug } : {}), ...(r.related_entity && (ENTITY_IDS as readonly string[]).includes(r.related_entity) ? { related_entity: r.related_entity as EntityId } : {}),
  };
}

async function validateAll(raw: RawItem[]): Promise<{ items: Item[]; rejects: Reject[]; chunks: number; retries: number }> {
  const chunks: RawItem[][] = [];
  for (let i = 0; i < raw.length; i += CHUNK_SIZE) chunks.push(raw.slice(i, i + CHUNK_SIZE));
  let retries = 0;
  const results = await Promise.all(chunks.map((c, ci) => withRetry(async () => c.map((r, j) => validateOne(r, ci * CHUNK_SIZE + j)), `chunk ${ci}`).then((x) => { retries += x.attempts - 1; return x.value; })));
  const items: Item[] = []; const rejects: Reject[] = [];
  for (const res of results) for (const x of res) ("reason" in x ? rejects.push(x) : items.push(x));
  return { items, rejects, chunks: chunks.length, retries };
}

/* ---------------- dedupe ---------------- */
function dedupe(items: Item[]): { kept: Item[]; dupes: Reject[] } {
  const kept: Item[] = []; const dupes: Reject[] = [];
  const byUrlHead = new Set<string>(); const byHead = new Map<string, string>();
  // credible / dated-to-the-day first so the best copy survives
  const order = [...items].sort((a, b) => b.credibility - a.credibility || a.published_date.localeCompare(b.published_date) || a.id.localeCompare(b.id));
  for (const it of order) {
    const h = normHeadline(it.headline);
    const k1 = `${it.entity}|${it.source_url}|${h}`;
    const asReject = (reason: string, detail?: string): Reject => ({ reason, entity: it.entity, headline: it.headline, source_url: it.source_url, published_date: it.published_date, collector: it.collector, origin: it.origin, ...(detail ? { detail } : {}) });
    if (byUrlHead.has(k1)) { dupes.push(asReject("duplicate_url_headline")); continue; }
    const k2 = `${it.entity}|${h}`;
    if (h.length >= 40 && byHead.has(k2) && byHead.get(k2) !== it.source_url) { dupes.push(asReject("duplicate_syndicated_headline", `first seen at ${byHead.get(k2)}`)); continue; }
    byUrlHead.add(k1);
    if (h.length >= 40 && !byHead.has(k2)) byHead.set(k2, it.source_url);
    kept.push(it);
  }
  kept.sort((a, b) => b.published_date.localeCompare(a.published_date) || a.id.localeCompare(b.id));
  return { kept, dupes };
}

/* ---------------- conflicts (same fund, different reported figure) ---------------- */
export type Conflict = { key: string; entity: EntityId; values: { amount: string; stage: "final" | "interim" | "target"; source_url: string; source_name: string; published_date: string; headline: string }[] };
const FUND_KEYS: [RegExp, string][] = [[/ascent (fund )?iii\b/gi, "Ascent Fund III"], [/ascent (fund )?ii\b/gi, "Ascent Fund II"], [/opportunities fund ii\b/gi, "Opportunities Fund II"], [/growth fund iii\b|third growth fund/gi, "Growth Fund III"], [/\b(first|debut) fund\b|\bfund i\b/gi, "First fund"]];
const AMOUNT = /\$\s?(\d+(?:\.\d+)?)\s?(m|mn|million|b|bn|billion)\b/i;
/** Each $-amount is attached to its NEAREST fund keyword (≤ 45 chars away); each keyword keeps its nearest amount. AUM figures and
 * amounts introduced as a predecessor ("vs $415M", "nearly double $254M") are never attributed to the fund being described. */
function fundFigures(h: string): { key: string; amount: string; stage: Conflict["values"][number]["stage"] }[] {
  const kws: { key: string; start: number; end: number }[] = [];
  for (const [re, key] of FUND_KEYS) for (const m of h.matchAll(re)) {
    const start = m.index ?? 0, end = start + m[0].length;
    if (kws.some((k) => start < k.end && end > k.start)) continue; // "Ascent Fund II" inside "Ascent Fund III"
    const pre = h.slice(Math.max(0, start - 30), start);
    if (/(\bvs\.?|versus|double|doubling|predecessor|up from|compared to|than)\W*(the\s+)?(\$[\d.]+\s?\w+\s+)?$/i.test(pre)) continue; // comparative mention of a predecessor fund
    if (key === "First fund" && /(opportunities|growth|ascent)\s*$/i.test(pre)) continue; // "Opportunities Fund I" is not the firm's first fund
    kws.push({ key, start, end });
  }
  if (!kws.length) return [];
  const amts = [...h.matchAll(new RegExp(AMOUNT.source, "gi"))].map((a) => ({ a, at: a.index ?? 0 }))
    .filter(({ at }) => !/(\bAUM\b|assets under management|manages more than|\bvs\.?|versus|double|predecessor|up from|compared)\W*$/i.test(h.slice(Math.max(0, at - 28), at)));
  const best = new Map<number, { dist: number; amount: string }>();
  for (const { a, at } of amts) {
    let ki = -1, kd = Infinity;
    kws.forEach((k, i) => { const d = at >= k.end ? at - k.end : k.start - (at + a[0].length); if (d >= 0 && d < kd) { kd = d; ki = i; } });
    if (ki < 0 || kd > 45) continue;
    const amount = `$${Number(a[1])}${/^b/i.test(a[2]!) ? "B" : "M"}`;
    if (!best.has(ki) || kd < best.get(ki)!.dist) best.set(ki, { dist: kd, amount });
  }
  const stage: Conflict["values"][number]["stage"] = /interim|first close|so far/i.test(h) ? "interim" : /talks|seeks|eyes|target|aims/i.test(h) ? "target" : "final";
  return [...best.entries()].map(([i, v]) => ({ key: kws[i]!.key, amount: v.amount, stage }));
}
function conflicts(items: Item[]): Conflict[] {
  const groups = new Map<string, Conflict>();
  for (const it of items) {
    if (it.origin.startsWith("portfolio/")) continue;
    for (const f of fundFigures(it.headline)) {
      const g = groups.get(f.key) ?? { key: f.key, entity: "b-capital" as EntityId, values: [] };
      if (!g.values.some((v) => v.amount === f.amount && v.source_url === it.source_url)) g.values.push({ amount: f.amount, stage: f.stage, source_url: it.source_url, source_name: it.source_name, published_date: it.published_date, headline: wellFormed(it.headline.slice(0, 160)) });
      groups.set(f.key, g);
    }
  }
  // a conflict = two FINAL figures that disagree (interim / target figures are kept in the record for context, never averaged)
  return [...groups.values()].filter((g) => new Set(g.values.filter((v) => v.stage === "final").map((v) => v.amount)).size > 1);
}

/* ---------------- engine input (ported engine, UNCHANGED) ---------------- */
function toPost(it: Item): Post {
  const tags = (it.headline.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((t) => t.slice(1).toLowerCase());
  return {
    id: it.id, handle: HANDLE[it.entity], platform: it.category === "portfolio-social" ? ((["x", "reddit", "tiktok", "linkedin", "instagram"].includes(it.source_name) ? it.source_name : "web") as Post["platform"]) : "web",
    ts: it.published_date.length === 10 ? `${it.published_date}T00:00:00Z` : it.published_date, tsPrecision: it.date_precision === "second" ? "second" : "date",
    text: it.headline, urls: [it.source_url], hashtags: [it.category, ...tags], sharedId: it.company_slug ?? (FUND_KEYS.find(([re]) => re.test(it.headline))?.[1].toLowerCase() ?? null),
    replyTo: it.related_entity ? HANDLE[it.related_entity].toLowerCase() : null, narrativeId: it.category, networkId: it.entity === "b-capital" ? "FIRM" : "LEADERSHIP", templateId: null, synthetic: false, evidenceId: it.id,
  };
}

/* ---------------- scores ---------------- */
export type EntityScore = { entity: EntityId; name: string; items: number; reputation: SignalScore; prestige: { index: number; prestigeItems: number; weightedMass: number; positiveShare: number; wilsonLower: number }; wilson: { positive: number; n: number; lower: number }; categories: Record<string, { n: number; mass: number; meanSentiment: number; wilsonLower: number; contribution: number }> };
function scores(items: Item[]): EntityScore[] {
  const by = new Map<EntityId, Item[]>(ENTITY_IDS.map((e) => [e, []]));
  for (const it of items) by.get(it.entity)!.push(it);
  // reputation: src/scoring.ts scorePortfolio UNCHANGED (14 d half-life, 90 d window, shrink K=3, Wilson z=1.96, z-scored across the 4 subjects)
  const inputs: CompanyInput[] = ENTITY_IDS.map((e) => ({ slug: e, name: NAME[e], sector: "venture", website: e === "b-capital" ? "https://b.capital" : null, items: by.get(e)!.map((it) => ({ url: it.source_url, title: it.headline, source: it.source_name, published_at: it.published_date, sentiment: it.sentiment, kind: it.category })), history: [] }));
  const rep = new Map(scorePortfolio(inputs, new Date(NOW)).map((s) => [s.slug, s]));
  const out: EntityScore[] = [];
  for (const e of ENTITY_IDS) {
    const list = by.get(e)!;
    const pos = list.filter((x) => x.sentiment > 0.1).length, n = list.length;
    const cats: EntityScore["categories"] = {};
    const totalMass = list.reduce((a, x) => a + x.weight, 0) || 1;
    for (const it of list) {
      const c = (cats[it.category] ??= { n: 0, mass: 0, meanSentiment: 0, wilsonLower: 0, contribution: 0 });
      c.n++; c.mass += it.weight; c.meanSentiment += it.sentiment * it.weight;
    }
    for (const [k, c] of Object.entries(cats)) {
      const ls = list.filter((x) => x.category === k);
      c.meanSentiment = c.mass > 0 ? r3(c.meanSentiment / c.mass) : 0;
      c.wilsonLower = r3(wilsonLower(ls.filter((x) => x.sentiment > 0.1).length, ls.length));
      c.contribution = r3((c.mass / totalMass) * c.meanSentiment);
      c.mass = r3(c.mass);
    }
    const pl = list.filter((x) => PRESTIGE_CATEGORIES.has(x.category));
    const pMass = pl.reduce((a, x) => a + x.weight, 0);
    const pPos = pl.filter((x) => x.sentiment > 0.1).length;
    const pWl = wilsonLower(pPos, pl.length);
    // prestige index 0–100 = Wilson-lower positive share × saturating log mass of prestige evidence (documented in docs; not part of the ported engine)
    const index = Math.round(100 * pWl * Math.min(1, Math.log1p(pMass) / Math.log1p(40)));
    out.push({ entity: e, name: NAME[e], items: n, reputation: rep.get(e)!, prestige: { index, prestigeItems: pl.length, weightedMass: r3(pMass), positiveShare: r3(pl.length ? pPos / pl.length : 0), wilsonLower: r3(pWl) }, wilson: { positive: pos, n, lower: r3(wilsonLower(pos, n)) }, categories: cats });
  }
  return out;
}

/* ---------------- main ---------------- */
export async function runBatch(opts: { write?: boolean } = {}) {
  const t: Record<string, number> = {}; const t0 = Date.now(); let tl = t0;
  const lap = (k: string) => { const n = Date.now(); t[k] = n - tl; tl = n; };
  const { raw, perSource, shards } = await ingest(); lap("ingest_ms");
  const { items: valid, rejects, chunks, retries } = await validateAll(raw); lap("validate_ms");
  const { kept, dupes } = dedupe(valid); lap("dedupe_ms");
  const conf = conflicts(kept); lap("conflicts_ms");
  const posts = kept.map(toPost);
  const input = { posts, accounts: ENTITY_IDS.map((e) => ({ handle: HANDLE[e], platform: "web" as const, networkId: e === "b-capital" ? "FIRM" : "LEADERSHIP", historical: false, synthetic: false, evidenceCount: kept.filter((x) => x.entity === e).length })), historicalNetworkIds: [], params: { ...DEFAULT_PARAMS, windowSeconds: 86_400, minWeight: 0.01, keepIsolates: true }, runId: "REP-BATCH-001", nowIso: NOW_ISO, investigationId: null };
  const result: CorrelationResult = runEngine(input, () => undefined); lap("engine_ms");
  const sc = scores(kept); lap("scores_ms");
  // 4×4 entity matrix in fixed entity order (values = engine edge weights, 1 on the diagonal for display)
  const H = ENTITY_IDS.map((e) => HANDLE[e]);
  const w = new Map(result.edges.map((e) => [`${e.source}|${e.target}`, e]));
  const edgeOf = (a: string, b: string) => w.get(`${a}|${b}`) ?? w.get(`${b}|${a}`);
  const matrix4 = { entities: [...ENTITY_IDS], handles: H, weights: H.map((a) => H.map((b) => (a === b ? 1 : r3(edgeOf(a, b)?.weight ?? 0)))), counts: H.map((a) => H.map((b) => (a === b ? 0 : edgeOf(a, b)?.count ?? 0))) };
  const nanCount = sc.reduce((a, s) => a + [s.reputation.score, s.reputation.confidence, s.prestige.index, s.wilson.lower, ...Object.values(s.reputation.factors), ...Object.values(s.categories).flatMap((c) => [c.mass, c.meanSentiment, c.wilsonLower, c.contribution])].filter((x) => !Number.isFinite(x)).length, 0)
    + kept.filter((x) => !Number.isFinite(x.weight) || !Number.isFinite(x.sentiment)).length + matrix4.weights.flat().filter((x) => !Number.isFinite(x)).length;
  const rejectReasons: Record<string, number> = {};
  for (const r of [...rejects, ...dupes]) rejectReasons[r.reason] = (rejectReasons[r.reason] ?? 0) + 1;
  const byEntity: Record<string, number> = {}; const byCategory: Record<string, number> = {}; const byEntityCategory: Record<string, Record<string, number>> = {};
  for (const it of kept) { byEntity[it.entity] = (byEntity[it.entity] ?? 0) + 1; byCategory[it.category] = (byCategory[it.category] ?? 0) + 1; (byEntityCategory[it.entity] ??= {})[it.category] = ((byEntityCategory[it.entity] ??= {})[it.category] ?? 0) + 1; }
  t.total_ms = Date.now() - t0;
  const summary = {
    runId: "REP-BATCH-001", generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"), now: NOW_ISO, params: { chunkSize: CHUNK_SIZE, retries: RETRIES, halfLifeDays: BATCH_HALF_LIFE_DAYS, engineWindowSeconds: 86_400, engineMinWeight: 0.01 },
    counts: { ingested: raw.length, rejected: rejects.length, deduped: dupes.length, processed: kept.length, chunks, chunkRetries: retries, nanScores: nanCount },
    perSource, shards, rejectReasons, byEntity, byCategory, byEntityCategory, timingsMs: t,
    engine: { postsConsidered: result.postsConsidered, edges: result.edges.length, modularity: r3(result.modularity), durationMs: result.durationMs, precisionRejects: result.precisionRejects?.length ?? 0, droppedObjects: result.droppedObjects?.length ?? 0, trailInvariantViolations: result.trailInvariantViolations ?? 0, edgeList: result.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, weight: r3(e.weight), count: e.count, rawCount: e.rawCount, byMode: e.byMode, sameDay: e.sameDay, syndicationShare: r3(e.syndicationShare ?? 0) })) },
    matrix4, scores: sc, conflicts: conf,
  };
  if (opts.write !== false) {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, "items.jsonl"), kept.map((x) => JSON.stringify(x)).join("\n") + "\n");
    fs.writeFileSync(path.join(OUT, "rejects.jsonl"), [...rejects, ...dupes].map((x) => JSON.stringify(x)).join("\n") + "\n");
    fs.writeFileSync(path.join(OUT, "conflicts.jsonl"), conf.map((x) => JSON.stringify(x)).join("\n") + (conf.length ? "\n" : ""));
    fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 1));
    // UI payloads: (1) summary + precomputed engine result (matrix computed server-side, never in the browser) — imported by the page;
    // (2) slim item rows read by the paged /api/reputation/evidence route that feeds the virtualized list (kept out of client bundles).
    const ui = { summary: { ...summary, engine: { ...summary.engine, edgeList: summary.engine.edgeList.slice(0, 20) } }, result: { ...result, edges: result.edges.map((e) => ({ ...e, shared: e.shared.slice(0, 8), evidenceIds: (e.evidenceIds ?? []).slice(0, 20) })), precisionRejects: undefined, droppedObjects: undefined }, evidence: Object.fromEntries(result.edges.flatMap((e) => (e.evidenceIds ?? []).slice(0, 20)).map((id) => { const it = kept.find((x) => x.id === id); return [id, it ? { id, title: `${NAME[it.entity]} — ${wellFormed(it.headline.slice(0, 140))}`, source: `${it.source_name} · ${it.source_url}`, publishedAt: it.published_date } : { id, title: id }]; })) };
    fs.writeFileSync(path.join(ROOT, "web/src/data/reputation-batch.json"), JSON.stringify(ui));
    const rows = kept.map((x) => [x.id, ENTITY_IDS.indexOf(x.entity), x.category, wellFormed(x.headline.slice(0, 180)), x.source_url, x.source_name, x.published_date, x.sentiment, x.weight]);
    fs.mkdirSync(path.join(ROOT, "web/data"), { recursive: true });
    fs.writeFileSync(path.join(ROOT, "web/data/reputation-items.json"), JSON.stringify({ columns: ["id", "entity", "category", "headline", "source_url", "source_name", "published_date", "sentiment", "weight"], entities: ENTITY_IDS, rows }));
  }
  return { summary, kept, rejects: [...rejects, ...dupes], result };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runBatch().then(({ summary }) => {
    console.log(JSON.stringify({ counts: summary.counts, byEntity: summary.byEntity, rejectReasons: summary.rejectReasons, timingsMs: summary.timingsMs, engine: { ...summary.engine, edgeList: summary.engine.edgeList.length }, matrix4: summary.matrix4, scores: summary.scores.map((s) => ({ entity: s.entity, items: s.items, reputation: s.reputation.score, confidence: s.reputation.confidence, prestige: s.prestige.index, wilson: s.wilson.lower })), conflicts: summary.conflicts.map((c) => `${c.key}: ${[...new Set(c.values.map((v) => v.amount))].join(" vs ")}`) }, null, 1));
  }).catch((e) => { console.error(e); process.exit(1); });
}
