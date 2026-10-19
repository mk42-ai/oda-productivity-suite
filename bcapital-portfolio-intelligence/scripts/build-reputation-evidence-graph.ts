/**
 * build-reputation-evidence-graph.ts — graph.json for web/data/reputation/ from web/data/reputation/evidence.json.
 *
 *   node node_modules/tsx/dist/cli.mjs scripts/build-reputation-evidence-graph.ts
 *
 * Nodes = the four register subjects (hubs) + publishers / authors / companies / LinkedIn & podcast accounts (one node per
 * (register, account) pair, size = evidence count, glyph = platform). Edges = the ported Rilian engine, UNCHANGED (runEngine →
 * edgeWeight in web/src/lib/reputation/engine): co-share (shared object: fund / company / event), co-link (canonical URL), co-hashtag
 * (hashtags), co-reply (related register), co-text (MinHash over the title+excerpt) inside the 86 400 s window; weight, co_occurrences,
 * min_delta_t, syndication_share, evidence_trail[], shared_objects[] are the engine's own fields, renamed to the requested keys.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runEngine } from "../web/src/lib/reputation/engine/engine";
import { DEFAULT_PARAMS, type CoEdge, type CorrelationResult } from "../web/src/lib/reputation/engine/types";
import type { Post } from "../web/src/lib/reputation/engine/rilian-types";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "web/data/reputation");
const NOW_ISO = process.env.BATCH_NOW ?? "2026-10-18T00:00:00Z";
const MIN_ITEMS = Number(process.env.GRAPH_MIN_ITEMS ?? 2);
const MAX_POSTS_PER_NODE = Number(process.env.GRAPH_MAX_POSTS ?? 60);
const MAX_HUB_POSTS = Number(process.env.GRAPH_MAX_HUB_POSTS ?? 600);
const MIN_WEIGHT = Number(process.env.GRAPH_MIN_WEIGHT ?? 0.02);

type Item = { id: string; canonical_url: string; title: string; source: string; author: string | null; published_at: string | null; platform: string; text_excerpt: string | null; hashtags: string[]; links: string[]; mentions: string[]; registers: string[] };
const REG: Record<string, { handle: string; name: string; short: string; photo: string; role: string }> = {
  "BCAP-001": { handle: "@bcapital", name: "B Capital", short: "B Capital", photo: "/reputation/people/b-capital-logo.png", role: "Global multi-stage venture firm" },
  "BCAP-002": { handle: "@eduardosaverin", name: "Eduardo Saverin", short: "Saverin", photo: "/reputation/people/eduardo-saverin.jpg", role: "Co-Founder & Co-CEO" },
  "BCAP-003": { handle: "@rajganguly", name: "Raj Ganguly", short: "Ganguly", photo: "/reputation/people/raj-ganguly.jpg", role: "Co-Founder & Co-CEO" },
  "BCAP-004": { handle: "@karanmohla", name: "Karan Mohla", short: "Mohla", photo: "/reputation/people/karan-mohla.jpg", role: "General Partner, South & Southeast Asia" },
};
const FUND_KEYS: [RegExp, string][] = [[/ascent (fund )?iii\b/i, "ascent fund iii"], [/ascent (fund )?ii\b/i, "ascent fund ii"], [/opportunities fund ii\b/i, "opportunities fund ii"], [/growth fund iii\b|third growth fund|\$2\.1 ?b/i, "growth fund iii"], [/healthcare fund/i, "healthcare fund i"], [/growth fund ii\b|second fund|\$820/i, "growth fund ii"], [/opportunities fund\b/i, "opportunities fund"], [/first fund|\$143\.6/i, "fund i"], [/liverpool/i, "liverpool fc stake"], [/founders circle/i, "founders circle"]];
const PLAT: Record<string, Post["platform"]> = { x: "x", reddit: "reddit", linkedin: "linkedin", instagram: "instagram", video: "youtube", podcast: "web", "press-wire": "web", web: "web" };
const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "unknown"; } };
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function accountKey(it: Item): { key: string; label: string; kind: string; platform: Post["platform"] } {
  const h = hostOf(it.canonical_url);
  const platform = PLAT[it.platform] ?? "web";
  if (it.platform === "linkedin") { const m = it.canonical_url.match(/linkedin\.com\/(in|company|pulse)\/([^/?#]+)/); return { key: `li:${m ? m[2] : h}`, label: m ? m[2] : "linkedin", kind: "linkedin-account", platform: "linkedin" }; }
  if (it.platform === "podcast") return { key: `pod:${h}`, label: h, kind: "podcast", platform: "web" };
  if (it.platform === "video") return { key: `vid:${h}`, label: h, kind: "video", platform: "youtube" };
  if (it.platform === "x") return { key: `x:${(it.canonical_url.match(/x\.com\/([^/]+)/) ?? [])[1] ?? "x"}`, label: (it.canonical_url.match(/x\.com\/([^/]+)/) ?? [])[1] ?? "x", kind: "account", platform: "x" };
  if (it.platform === "reddit") return { key: `r:${(it.canonical_url.match(/reddit\.com\/r\/([^/]+)/) ?? [])[1] ?? "reddit"}`, label: (it.canonical_url.match(/reddit\.com\/r\/([^/]+)/) ?? [])[1] ?? "reddit", kind: "account", platform: "reddit" };
  if (it.author && h === "b.capital") return { key: `author:${slug(it.author)}`, label: it.author, kind: "author", platform: "web" };
  return { key: `pub:${h}`, label: h, kind: it.platform === "press-wire" ? "press-wire" : "publisher", platform };
}
function sharedId(it: Item): string | null {
  const t = `${it.title} ${it.text_excerpt ?? ""}`.toLowerCase();
  for (const [re, k] of FUND_KEYS) if (re.test(t)) return k;
  const co = it.mentions.find((m) => !["B Capital", "Eduardo Saverin", "Raj Ganguly", "Karan Mohla", "Singapore", "India", "Los Angeles", "Miami", "Facebook", "Meta", "BCG", "Boston Consulting Group"].includes(m));
  return co ? `co:${slug(co)}` : null;
}
function toPost(it: Item, handle: string, networkId: string, idSuffix: string): Post {
  const ts = it.published_at ? (it.published_at.length === 10 ? `${it.published_at}T00:00:00Z` : it.published_at) : "2026-10-18T00:00:00Z";
  const others = it.registers.filter((r) => r !== networkId);
  return { id: `${it.id}${idSuffix}`, handle, platform: "web", ts, tsPrecision: it.published_at && it.published_at.length > 10 ? "second" : "date", text: `${it.title}. ${it.text_excerpt ?? ""}`.slice(0, 600), urls: it.links.length ? it.links : [it.canonical_url], hashtags: [...it.hashtags, ...it.registers.map((r) => r.toLowerCase())], sharedId: sharedId(it), replyTo: others.length ? REG[others[0]].handle.toLowerCase() : null, narrativeId: it.platform, networkId, templateId: null, synthetic: false, evidenceId: it.id };
}
function main() {
  const t0 = Date.now();
  const items: Item[] = JSON.parse(fs.readFileSync(path.join(DIR, "evidence.json"), "utf8"));
  const byDate = (a: Item, b: Item) => (b.published_at ?? "").localeCompare(a.published_at ?? "");
  const posts: Post[] = []; const accounts: { handle: string; platform: Post["platform"]; networkId: string | null; historical: boolean; synthetic: boolean; evidenceCount: number }[] = [];
  const meta: Record<string, Record<string, unknown>> = {};
  const perReg: Record<string, Item[]> = {};
  for (const it of items) for (const r of it.registers) (perReg[r] ??= []).push(it);
  for (const r of Object.keys(REG)) {
    const list = (perReg[r] ?? []).sort(byDate); const m = REG[r];
    accounts.push({ handle: m.handle, platform: "web", networkId: r, historical: false, synthetic: false, evidenceCount: list.length });
    meta[m.handle] = { kind: "subject", label: m.name, register: r, items: list.length, evidenceIds: list.slice(0, 40).map((x) => x.id), photo: m.photo, name: m.name, role: m.role, hub: true, glyph: "subject" };
    for (const it of list.slice(0, MAX_HUB_POSTS)) posts.push(toPost(it, m.handle, r, `#${r}`));
  }
  const groups = new Map<string, { reg: string; label: string; kind: string; platform: Post["platform"]; items: Item[] }>();
  for (const it of items) for (const r of it.registers) { const a = accountKey(it); const k = `${r}|${a.key}`; const g = groups.get(k) ?? { reg: r, label: a.label, kind: a.kind, platform: a.platform, items: [] }; g.items.push(it); groups.set(k, g); }
  let members = 0;
  for (const g of groups.values()) {
    if (g.items.length < MIN_ITEMS) continue;
    const handle = `${g.label}·${REG[g.reg].short.toLowerCase()}`; const list = g.items.sort(byDate);
    accounts.push({ handle, platform: g.platform, networkId: g.reg, historical: false, synthetic: false, evidenceCount: list.length });
    meta[handle] = { kind: g.kind, label: g.label, register: g.reg, items: list.length, evidenceIds: list.slice(0, 20).map((x) => x.id), glyph: g.kind === "linkedin-account" ? "linkedin" : g.kind === "podcast" ? "podcast" : g.kind === "video" ? "video" : g.kind === "press-wire" ? "press-wire" : g.platform };
    for (const it of list.slice(0, MAX_POSTS_PER_NODE)) posts.push(toPost(it, handle, g.reg, "")); members++;
  }
  const input = { posts, accounts, historicalNetworkIds: [], params: { ...DEFAULT_PARAMS, windowSeconds: 86_400, minWeight: MIN_WEIGHT, keepIsolates: true, textThreshold: 0.6 }, runId: "REP-EVIDENCE-001", nowIso: NOW_ISO, investigationId: null };
  const result: CorrelationResult = runEngine(input, () => undefined);
  const r3 = (x: number | undefined) => (typeof x === "number" ? Math.round(x * 1000) / 1000 : x);
  const edges = result.edges.map((e: CoEdge) => ({ id: e.id, source: e.source, target: e.target, weight: r3(e.weight), co_occurrences: e.count, raw_events: e.rawCount ?? e.count, by_mode: e.byMode, min_delta_t: e.minDelta, syndication_share: r3(e.syndicationShare ?? 0), syndicated: e.syndicated === true, same_day: e.sameDay === true, evidence_trail: (e.evidenceIds ?? []).slice(0, 24), shared_objects: e.shared.slice(0, 8).map((s) => ({ mode: s.mode, object: s.object.slice(0, 80), evidence_a: s.evidenceA, evidence_b: s.evidenceB, delta_seconds: s.deltaSeconds })) }));
  const nodes = result.nodes.map((n) => ({ id: n.id, ...meta[n.id], platform: n.platform, register: n.networkId, size: n.evidenceCount, evidence_count: n.evidenceCount, degree: n.degree, weighted_degree: r3(n.weightedDegree), betweenness: r3(n.betweenness), community: n.community }));
  const registers = Object.entries(REG).map(([id, m]) => ({ id, handle: m.handle, name: m.name, short: m.short, photo: m.photo, role: m.role, items: perReg[id]?.length ?? 0, nodes: nodes.filter((n) => n.register === id).length }));
  const out = { run_id: result.runId, generated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"), now_iso: NOW_ISO, engine: "web/src/lib/reputation/engine (Rilian port, runEngine/edgeWeight unchanged)", params: { window_seconds: 86_400, min_weight: MIN_WEIGHT, min_items_per_node: MIN_ITEMS, max_posts_per_node: MAX_POSTS_PER_NODE, max_hub_posts: MAX_HUB_POSTS, text_threshold: 0.6 }, registers, nodes, edges, communities: result.communities.length, modularity: r3(result.modularity), isolates: result.isolates ?? 0, stats: { items: items.length, posts: posts.length, nodes: nodes.length, member_nodes: nodes.length - registers.length, edges: edges.length, isolates: result.isolates ?? 0, hub_edges: edges.filter((e) => e.source.startsWith("@") || e.target.startsWith("@")).length, trail_invariant_violations: result.trailInvariantViolations ?? 0, engine_ms: result.durationMs, total_ms: Date.now() - t0 } };
  fs.writeFileSync(path.join(DIR, "graph.json"), JSON.stringify(out));
  console.log(JSON.stringify({ ...out.stats, registers: registers.map((r) => `${r.id}:${r.items} items/${r.nodes} nodes`), bytes: fs.statSync(path.join(DIR, "graph.json")).size }));
}
main();
