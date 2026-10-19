/**
 * build-reputation-graph-v3.ts — data/reputation/graph.json from data/reputation/evidence.json (v3 schema, 2026-10-18 sweep).
 *
 *   node node_modules/tsx/dist/cli.mjs scripts/build-reputation-graph-v3.ts
 *
 * NODES — account bubbles: the four register subjects (@bcapital, @eduardosaverin, @rajganguly, @karanmohla), publishers (one per
 * domain), portfolio companies (slug ids from data/portfolio.json — a company node exists for every one of the 136 slugs, linked to the
 * items that name it), and social accounts (LinkedIn / X / Reddit / YouTube channels / podcast shows). Each node: id, label, kind,
 * evidence_count, platform_glyph, registers[], evidence_ids[], first_seen, last_seen, degree, isolate.
 * EDGES — the ported Rilian engine UNCHANGED (web/src/lib/reputation/engine: runEngine → objects.ts edgeWeight =
 * min(1, log2(1+pairs)/log2(1+8) × clamp(mean idf/idfMax, 0.5, 1) × precision ÷ (1+syndicationShare)), IDF generic cut-off, same-day cap),
 * typed co-share / co-link / co-hashtag / co-reply / co-text with weight, co_occurrence_count, event_count, min_delta_t_seconds,
 * syndication_share, evidence_ids[], by_mode, shared_objects[]. Isolates (degree 0) carry isolate:true and are listed in `isolates`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runEngine } from "../web/src/lib/reputation/engine/engine";
import { DEFAULT_PARAMS, type CoEdge, type CorrelationResult } from "../web/src/lib/reputation/engine/types";
import type { Post } from "../web/src/lib/reputation/engine/rilian-types";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "web/data/reputation");
const NOW_ISO = process.env.BATCH_NOW ?? "2026-10-18T23:00:00Z";
const MIN_ITEMS = Number(process.env.GRAPH_MIN_ITEMS ?? 2);
const MAX_POSTS_PER_NODE = Number(process.env.GRAPH_MAX_POSTS ?? 60);
const MAX_HUB_POSTS = Number(process.env.GRAPH_MAX_HUB_POSTS ?? 600);
const MIN_WEIGHT = Number(process.env.GRAPH_MIN_WEIGHT ?? 0.02);

type Item = { id: string; registers: string[]; title: string; canonical_url: string; publisher: string; platform_glyph: string; source_type: string; published_at: string; snippet: string | null; hashtags: string[]; mentions: string[]; outbound_links: string[]; companies: string[]; author: string | null };
type Company = { slug: string; name: string; website: string | null; domain: string | null };
const REG: Record<string, { handle: string; name: string; short: string; photo: string; role: string }> = {
  "BCAP-001": { handle: "@bcapital", name: "B Capital", short: "B Capital", photo: "/reputation/people/b-capital-logo.png", role: "Global multi-stage venture firm" },
  "BCAP-002": { handle: "@eduardosaverin", name: "Eduardo Saverin", short: "Saverin", photo: "/reputation/people/eduardo-saverin.jpg", role: "Co-Founder & Co-CEO" },
  "BCAP-003": { handle: "@rajganguly", name: "Raj Ganguly", short: "Ganguly", photo: "/reputation/people/raj-ganguly.jpg", role: "Co-Founder & Co-CEO" },
  "BCAP-004": { handle: "@karanmohla", name: "Karan Mohla", short: "Mohla", photo: "/reputation/people/karan-mohla.jpg", role: "General Partner, South & Southeast Asia" },
};
const FUND_KEYS: [RegExp, string][] = [[/ascent (fund )?iii\b/i, "ascent fund iii"], [/ascent (fund )?ii\b/i, "ascent fund ii"], [/opportunities fund ii\b/i, "opportunities fund ii"], [/growth fund iii\b|third growth fund|\$2\.1 ?b/i, "growth fund iii"], [/healthcare fund/i, "healthcare fund i"], [/growth fund ii\b|second fund|\$820/i, "growth fund ii"], [/opportunities fund\b/i, "opportunities fund"], [/first fund|\$143\.6/i, "fund i"], [/liverpool/i, "liverpool fc stake"], [/founders circle/i, "founders circle"], [/singapore'?s? 50 richest|singapore billionaires/i, "forbes singapore 50"]];
const GLYPH_PLAT: Record<string, Post["platform"]> = { x: "x", reddit: "reddit", linkedin: "linkedin", instagram: "instagram", facebook: "facebook", youtube: "youtube", video: "youtube", podcast: "web", pr: "web", web: "web" };
const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "unknown"; } };
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type Acc = { key: string; label: string; kind: string; glyph: string; platform: Post["platform"] };
/** Account bubbles an item belongs to: its publisher / social account (one) + every portfolio company it names. */
function accountsOf(it: Item, companies: Map<string, Company>): Acc[] {
  const h = hostOf(it.canonical_url); const out: Acc[] = [];
  const g = it.platform_glyph;
  if (g === "linkedin") { const m = it.canonical_url.match(/linkedin\.com\/(in|company|pulse|posts)\/([^/?#_]+)/); out.push({ key: `li:${m ? m[2] : h}`, label: m ? `linkedin/${m[2]}` : "linkedin", kind: "social_account", glyph: "linkedin", platform: "linkedin" }); }
  else if (g === "x") { const u = (it.canonical_url.match(/x\.com\/([^/]+)/) ?? [])[1] ?? "x"; out.push({ key: `x:${u}`, label: `@${u}`, kind: "social_account", glyph: "x", platform: "x" }); }
  else if (g === "reddit") { const r = (it.canonical_url.match(/reddit\.com\/r\/([^/]+)/) ?? [])[1] ?? "reddit"; out.push({ key: `r:${r}`, label: `r/${r}`, kind: "social_account", glyph: "reddit", platform: "reddit" }); }
  else if (g === "youtube") out.push({ key: `yt:${slug(it.publisher || "youtube")}`, label: it.publisher || "YouTube", kind: "social_account", glyph: "youtube", platform: "youtube" });
  else if (g === "podcast") out.push({ key: `pod:${slug(it.publisher || h)}`, label: it.publisher || h, kind: "podcast", glyph: "podcast", platform: "web" });
  else if (g === "facebook" || g === "instagram") out.push({ key: `${g}:${h}`, label: h, kind: "social_account", glyph: g, platform: g as Post["platform"] });
  else out.push({ key: `pub:${h}`, label: h, kind: g === "pr" ? "press_wire" : "publisher", glyph: g === "pr" ? "pr" : g, platform: GLYPH_PLAT[g] ?? "web" });
  for (const c of it.companies ?? []) if (companies.has(c)) out.push({ key: `co:${c}`, label: companies.get(c)!.name, kind: "portfolio_company", glyph: "web", platform: "web" });
  return out;
}
function sharedId(it: Item): string | null {
  const t = `${it.title} ${it.snippet ?? ""}`.toLowerCase();
  for (const [re, k] of FUND_KEYS) if (re.test(t)) return k;
  if (it.companies?.length) return `co:${it.companies[0]}`;
  const co = it.mentions.find((m) => !["B Capital", "Eduardo Saverin", "Raj Ganguly", "Karan Mohla", "Singapore", "India", "Los Angeles", "Miami", "Facebook", "Meta", "BCG", "Boston Consulting Group"].includes(m));
  return co ? `co:${slug(co)}` : null;
}
function toPost(it: Item, handle: string, platform: Post["platform"], networkId: string, idSuffix: string): Post {
  const ts = it.published_at.length === 10 ? `${it.published_at}T00:00:00Z` : it.published_at;
  const others = it.registers.filter((r) => r !== networkId);
  return { id: `${it.id}${idSuffix}`, handle, platform, ts, tsPrecision: it.published_at.length > 10 ? "second" : "date", text: `${it.title}. ${it.snippet ?? ""}`.slice(0, 600), urls: it.outbound_links.length ? [it.canonical_url, ...it.outbound_links.slice(0, 20)] : [it.canonical_url], hashtags: [...it.hashtags, ...it.registers.map((r) => r.toLowerCase()), ...(it.companies ?? []).map((c) => `co-${c}`)], sharedId: sharedId(it), replyTo: others.length ? REG[others[0]].handle.toLowerCase() : null, narrativeId: it.source_type, networkId, templateId: null, synthetic: false, evidenceId: it.id };
}
/** The engine's `post:<id>#suffix` fallback (two account posts quoting the SAME evidence row) → the evidence id it points at. */
const evId = (ref: string) => ref.replace(/^post:/, "").replace(/#.*$/, "");
function main() {
  const t0 = Date.now();
  const items: Item[] = JSON.parse(fs.readFileSync(path.join(DIR, "evidence.json"), "utf8"));
  const companies = new Map<string, Company>((JSON.parse(fs.readFileSync(path.join(ROOT, "data/portfolio.json"), "utf8")).companies as Company[]).map((c) => [c.slug, c]));
  const byDate = (a: Item, b: Item) => b.published_at.localeCompare(a.published_at);
  const posts: Post[] = []; const accounts: { handle: string; platform: Post["platform"]; networkId: string | null; historical: boolean; synthetic: boolean; evidenceCount: number }[] = [];
  const meta: Record<string, Record<string, unknown>> = {};
  const perReg: Record<string, Item[]> = {};
  for (const it of items) for (const r of it.registers) (perReg[r] ??= []).push(it);
  const span = (list: Item[]) => ({ first_seen: list.length ? list[list.length - 1].published_at : null, last_seen: list.length ? list[0].published_at : null });
  for (const r of Object.keys(REG)) {
    const list = (perReg[r] ?? []).sort(byDate); const m = REG[r];
    accounts.push({ handle: m.handle, platform: "web", networkId: r, historical: false, synthetic: false, evidenceCount: list.length });
    meta[m.handle] = { kind: "subject", label: m.name, registers: [r], register: r, evidence_count: list.length, evidence_ids: list.slice(0, 40).map((x) => x.id), photo: m.photo, name: m.name, role: m.role, hub: true, platform_glyph: "subject", ...span(list) };
    for (const it of list.slice(0, MAX_HUB_POSTS)) posts.push(toPost(it, m.handle, "web", r, `#${r}`));
  }
  // account groups: one bubble per account (publisher / company / social), tagged with every register its items carry; engine networkId = dominant register
  const groups = new Map<string, { acc: Acc; items: Item[]; regs: Map<string, number> }>();
  for (const it of items) for (const a of accountsOf(it, companies)) {
    const g = groups.get(a.key) ?? { acc: a, items: [], regs: new Map() }; g.items.push(it);
    for (const r of it.registers) g.regs.set(r, (g.regs.get(r) ?? 0) + 1); groups.set(a.key, g);
  }
  // every portfolio company gets a node even with 0/1 items (the brief asks for all 137 slugs as nodes) — degree 0 ones are flagged isolate
  for (const c of companies.values()) if (!groups.has(`co:${c.slug}`)) groups.set(`co:${c.slug}`, { acc: { key: `co:${c.slug}`, label: c.name, kind: "portfolio_company", glyph: "web", platform: "web" }, items: [], regs: new Map() });
  const handleOf = (a: Acc) => (a.kind === "portfolio_company" ? a.key.slice(3) : a.key.includes(":") ? `${a.key.split(":")[0]}·${a.label}` : a.label);
  let members = 0;
  for (const g of groups.values()) {
    if (g.acc.kind !== "portfolio_company" && g.items.length < MIN_ITEMS) continue;
    const handle = handleOf(g.acc); const list = g.items.sort(byDate);
    const dominant = [...g.regs.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "BCAP-001";
    accounts.push({ handle, platform: g.acc.platform, networkId: dominant, historical: false, synthetic: false, evidenceCount: list.length });
    meta[handle] = { kind: g.acc.kind, label: g.acc.label, registers: [...g.regs.keys()].sort(), register: dominant, evidence_count: list.length, evidence_ids: list.slice(0, 20).map((x) => x.id), platform_glyph: g.acc.glyph, ...(g.acc.kind === "portfolio_company" ? { slug: g.acc.key.slice(3), website: companies.get(g.acc.key.slice(3))?.website ?? null } : {}), ...span(list) };
    for (const it of list.slice(0, MAX_POSTS_PER_NODE)) posts.push(toPost(it, handle, g.acc.platform, dominant, g.acc.kind === "portfolio_company" ? `#co` : "")); members++;
  }
  const input = { posts, accounts, historicalNetworkIds: [], params: { ...DEFAULT_PARAMS, windowSeconds: 86_400, minWeight: MIN_WEIGHT, keepIsolates: true, textThreshold: 0.6 }, runId: "REP-EVIDENCE-V3", nowIso: NOW_ISO, investigationId: null };
  const result: CorrelationResult = runEngine(input, () => undefined);
  const r3 = (x: number | undefined) => (typeof x === "number" ? Math.round(x * 1000) / 1000 : x);
  const edges = result.edges.map((e: CoEdge) => {
    const dominantMode = Object.entries(e.byMode).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ?? "co-text";
    return { id: e.id, source: e.source, target: e.target, type: dominantMode, by_mode: e.byMode, weight: r3(e.weight), co_occurrence_count: e.count, event_count: e.rawCount ?? e.count, min_delta_t_seconds: e.minDelta, syndication_share: r3(e.syndicationShare ?? 0), syndicated: e.syndicated === true, same_day: e.sameDay === true, evidence_ids: [...new Set((e.evidenceIds ?? []).map(evId))].slice(0, 24), shared_objects: e.shared.slice(0, 8).map((s) => ({ mode: s.mode, object: s.object.slice(0, 80), evidence_a: evId(s.evidenceA ?? ""), evidence_b: evId(s.evidenceB ?? ""), delta_seconds: s.deltaSeconds })) };
  });
  const degree = new Map<string, number>();
  for (const e of edges) { degree.set(e.source, (degree.get(e.source) ?? 0) + 1); degree.set(e.target, (degree.get(e.target) ?? 0) + 1); }
  const nodes = result.nodes.map((n) => ({ id: n.id, ...meta[n.id], platform: n.platform, size: n.evidenceCount, degree: degree.get(n.id) ?? 0, weighted_degree: r3(n.weightedDegree), betweenness: r3(n.betweenness), community: n.community, isolate: (degree.get(n.id) ?? 0) === 0 }));
  // portfolio companies the engine dropped (no evidence row names them yet) still get a node — degree 0, isolate:true — so every slug is addressable
  const present = new Set(nodes.map((n) => n.id));
  for (const c of companies.values()) if (!present.has(c.slug)) nodes.push({ id: c.slug, kind: "portfolio_company", label: c.name, registers: [], register: null, evidence_count: 0, evidence_ids: [], platform_glyph: "web", slug: c.slug, website: c.website ?? null, first_seen: null, last_seen: null, platform: "web", size: 0, degree: 0, weighted_degree: 0, betweenness: 0, community: -1, isolate: true } as unknown as (typeof nodes)[number]);
  const isolates = nodes.filter((n) => n.isolate).map((n) => n.id);
  const registers = Object.entries(REG).map(([id, m]) => { const ids = new Set(nodes.filter((n) => (n.registers as string[]).includes(id)).map((n) => n.id)); return { id, handle: m.handle, name: m.name, short: m.short, photo: m.photo, role: m.role, color: "#0AC985", items: perReg[id]?.length ?? 0, nodes: ids.size, edges: edges.filter((e) => ids.has(e.source) || ids.has(e.target)).length, isolates: nodes.filter((n) => n.isolate && (n.registers as string[]).includes(id)).length, node_ids: [...ids] }; });
  const kinds: Record<string, number> = {}; for (const n of nodes) kinds[n.kind as string] = (kinds[n.kind as string] ?? 0) + 1;
  const types: Record<string, number> = {}; for (const e of edges) types[e.type] = (types[e.type] ?? 0) + 1;
  const out = { run_id: result.runId, generated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"), now_iso: NOW_ISO, engine: "web/src/lib/reputation/engine (Rilian port: runEngine + objects.ts edgeWeight, unchanged)", weight_formula: "min(1, log2(1+distinct_pairs)/log2(9) × clamp(mean_idf/idf_max, 0.5, 1) × precision_factor ÷ (1 + syndication_share)); same-day-only pairs capped at 0.1", params: { window_seconds: 86_400, min_weight: MIN_WEIGHT, min_items_per_node: MIN_ITEMS, max_posts_per_node: MAX_POSTS_PER_NODE, max_hub_posts: MAX_HUB_POSTS, text_threshold: 0.6 }, registers, nodes, edges, isolates, communities: result.communities.length, modularity: r3(result.modularity), stats: { items: items.length, posts: posts.length, nodes: nodes.length, member_nodes: nodes.length - registers.length, node_kinds: kinds, edges: edges.length, edge_types: types, isolates: isolates.length, hub_edges: edges.filter((e) => e.source.startsWith("@") || e.target.startsWith("@")).length, trail_invariant_violations: result.trailInvariantViolations ?? 0, engine_ms: result.durationMs, total_ms: Date.now() - t0 } };
  fs.writeFileSync(path.join(DIR, "graph.json"), JSON.stringify(out));
  console.log(JSON.stringify({ ...out.stats, registers: registers.map((r) => `${r.id}:${r.items} items/${r.nodes} nodes/${r.edges} edges/${r.isolates} iso`), bytes: fs.statSync(path.join(DIR, "graph.json")).size }));
}
main();
