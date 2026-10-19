/**
 * build-reputation-graph.ts — the interactive-graph dataset for /reputation (B Capital port of the Rilian BubbleGraph engine).
 *
 *   node node_modules/tsx/dist/cli.mjs scripts/build-reputation-graph.ts          (from bcapital-portfolio-intelligence/, after batch-correlation.ts)
 *
 * Input : data/correlation/items.jsonl — the deduped evidence batch (every item belongs to exactly ONE subject register).
 * Output: web/data/reputation-graph.json — { registers, nodes, links, evidence, stats }, served by GET /api/reputation/graph and
 *         rendered by the ported BubbleGraph (react-force-graph-2d/3d + three) in src/components/reputation/graph.
 *
 * Node model (register = dashed halo ring, EXACTLY the four subjects):
 *   • 4 SUBJECT HUB nodes (@bcapital, @eduardosaverin, @rajganguly, @karanmohla) — size = evidence count of the register.
 *   • PUBLISHER / ACCOUNT nodes — one per (register, publisher) pair with ≥ MIN_ITEMS items: Forbes·saverin, x.com·bcapital, …
 *     Every such node belongs to exactly one register (its `networkId`), so the halo grouping is a partition of the node set.
 *     Social accounts of the portfolio feed collapse into their platform (x, reddit, instagram, linkedin) per register.
 *   • Portfolio-company nodes (B Capital register): one node per company_slug with ≥ MIN_ITEMS rows (the 10k social/news feed).
 *
 * Edges = the PORTED ENGINE (web/src/lib/reputation/engine/engine.ts, runEngine UNCHANGED): every item becomes a Post whose
 * `handle` is its publisher/account node and whose shared objects are the item's canonical URL (co-link), hashtags/category/
 * entities (co-hashtag), the related subject (co-reply), fund/company shared ids (co-share) and the headline text (co-text,
 * MinHash). Window 86 400 s, min weight 0.01, isolates kept. The hub ↔ member edges are the engine's own edges too: every item
 * is ALSO emitted once under its subject hub handle (same timestamp, same objects), so a publisher co-occurs with its subject
 * exactly as often as it publishes about it — the hub edges are therefore real engine edges with a full WHY CONNECTED trail.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runEngine } from "../web/src/lib/reputation/engine/engine";
import { DEFAULT_PARAMS, type CoEdge, type CorrelationResult } from "../web/src/lib/reputation/engine/types";
import type { Post } from "../web/src/lib/reputation/engine/rilian-types";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS = path.join(ROOT, "data/correlation/items.jsonl");
const OUT = path.join(ROOT, "web/data/reputation-graph.json");
const NOW_ISO = process.env.BATCH_NOW ?? "2026-10-18T00:00:00Z";
/** A publisher / account / company becomes a node once it carries this many items of the register (keeps the canvas readable: a few hundred nodes, not 12 000). */
const MIN_ITEMS = Number(process.env.GRAPH_MIN_ITEMS ?? 3);
/** Items per member node fed to the engine (newest first) — caps the O(n²) co-text pass; the full count still drives the bubble size. */
const MAX_POSTS_PER_NODE = Number(process.env.GRAPH_MAX_POSTS ?? 40);
const MAX_HUB_POSTS = Number(process.env.GRAPH_MAX_HUB_POSTS ?? 400);
/** Engine min weight for a displayed edge (the Rilian default run used 0.05; 0.02 keeps the sparse person registers linked). */
const MIN_WEIGHT = Number(process.env.GRAPH_MIN_WEIGHT ?? 0.02);

type EntityId = "b-capital" | "eduardo-saverin" | "raj-ganguly" | "karan-mohla";
const REGISTERS: Record<EntityId, { handle: string; name: string; short: string; photo: string; role: string }> = {
  "b-capital": { handle: "@bcapital", name: "B Capital", short: "B Capital", photo: "/reputation/people/b-capital-logo.png", role: "Global multi-stage venture firm" },
  "eduardo-saverin": { handle: "@eduardosaverin", name: "Eduardo Saverin", short: "Saverin", photo: "/reputation/people/eduardo-saverin.jpg", role: "Co-Founder & Co-CEO" },
  "raj-ganguly": { handle: "@rajganguly", name: "Raj Ganguly", short: "Ganguly", photo: "/reputation/people/raj-ganguly.jpg", role: "Co-Founder & Co-CEO" },
  "karan-mohla": { handle: "@karanmohla", name: "Karan Mohla", short: "Mohla", photo: "/reputation/people/karan-mohla.jpg", role: "General Partner, South & Southeast Asia" },
};
const ENTITY_IDS = Object.keys(REGISTERS) as EntityId[];
const PLATFORMS = new Set(["x", "reddit", "instagram", "linkedin", "tiktok", "youtube", "facebook", "telegram", "threads", "bluesky"]);

type Item = { id: string; entity: EntityId; category: string; headline: string; source_url: string; source_name: string; published_date: string; date_precision: string; sentiment: number; weight: number; company_slug?: string; related_entity?: EntityId; origin: string; factor?: string };

const FUND_KEYS: [RegExp, string][] = [[/ascent (fund )?iii\b/i, "ascent fund iii"], [/ascent (fund )?ii\b/i, "ascent fund ii"], [/opportunities fund ii\b/i, "opportunities fund ii"], [/growth fund iii\b|third growth fund/i, "growth fund iii"], [/growth fund ii\b|second fund|\$820/i, "growth fund ii"], [/opportunities fund\b/i, "opportunities fund"], [/first fund|\$143\.6/i, "fund i"]];
const COMPANY_KEYS = ["apptronik", "fervo", "meesho", "byju", "ninja van", "pharmeasy", "icertis", "labelbox", "goodfire", "sonilo", "precision neuroscience", "solarsquare", "eureka robotics", "insilico", "flutterwave", "writer", "perplexity", "star catcher", "havoc", "synack", "khatabook", "evidation", "bhanzu", "moengage", "carro"];
const TAG_WORDS = ["ipo", "unicorn", "fund", "ai", "fintech", "singapore", "india", "asia", "bcg", "podcast", "davos", "forbes", "billionaire", "series", "acquisition", "healthcare", "climate", "robotics", "exit", "aum", "raises", "closes", "partner", "board", "lawsuit", "citizenship", "facebook", "meta", "liverpool", "philanthropy"];

function hostOf(u: string): string { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "unknown"; } }
function publisherKey(it: Item): { key: string; label: string; platform: Post["platform"]; kind: "account" | "publisher" | "company" } {
  if (it.origin === "portfolio/social-feed" || it.category === "portfolio-social") {
    const p = it.source_name.toLowerCase();
    const platform = (PLATFORMS.has(p) ? p : hostOf(it.source_url).split(".")[0]) as Post["platform"];
    if (it.company_slug) return { key: `co:${it.company_slug}`, label: it.company_slug, platform: PLATFORMS.has(platform) ? platform : "web", kind: "company" };
    return { key: `acc:${platform}`, label: platform, platform: PLATFORMS.has(platform) ? platform : "web", kind: "account" };
  }
  if (it.company_slug) return { key: `co:${it.company_slug}`, label: it.company_slug, platform: "web", kind: "company" };
  const host = hostOf(it.source_url);
  const plat = host.split(".")[0];
  if (host === "x.com" || host === "twitter.com") return { key: "acc:x", label: "x", platform: "x", kind: "account" };
  if (PLATFORMS.has(plat)) return { key: `acc:${plat}`, label: plat, platform: plat as Post["platform"], kind: "account" };
  return { key: `pub:${host}`, label: host, platform: "web", kind: "publisher" };
}
function sharedId(it: Item): string | null {
  if (it.company_slug) return `co:${it.company_slug}`;
  const h = it.headline.toLowerCase();
  for (const [re, k] of FUND_KEYS) if (re.test(h)) return k;
  for (const c of COMPANY_KEYS) if (h.includes(c)) return `co:${c.replace(/\s+/g, "-")}`;
  return null;
}
function tags(it: Item): string[] {
  const h = it.headline.toLowerCase();
  const out = new Set<string>([it.category]);
  for (const m of it.headline.match(/#[\p{L}\p{N}_]+/gu) ?? []) out.add(m.slice(1).toLowerCase());
  for (const w of TAG_WORDS) if (new RegExp(`\\b${w}\\b`).test(h)) out.add(w);
  for (const e of ENTITY_IDS) if (e !== it.entity && new RegExp(REGISTERS[e].short.toLowerCase()).test(h)) out.add(e);
  return [...out];
}
function toPost(it: Item, handle: string, idSuffix: string): Post {
  return {
    id: `${it.id}${idSuffix}`, handle, platform: "web", ts: it.published_date.length === 10 ? `${it.published_date}T00:00:00Z` : it.published_date,
    tsPrecision: it.date_precision === "second" ? "second" : "date", text: it.headline, urls: [it.source_url], hashtags: tags(it), sharedId: sharedId(it),
    replyTo: it.related_entity ? REGISTERS[it.related_entity].handle.toLowerCase() : null, narrativeId: it.category, networkId: it.entity, templateId: null, synthetic: false, evidenceId: it.id,
  };
}

function main() {
  const t0 = Date.now();
  const items: Item[] = fs.readFileSync(ITEMS, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Item);
  // group by (register, publisher key)
  const groups = new Map<string, { entity: EntityId; label: string; platform: Post["platform"]; kind: string; items: Item[] }>();
  for (const it of items) {
    const pk = publisherKey(it);
    const k = `${it.entity}|${pk.key}`;
    const g = groups.get(k) ?? { entity: it.entity, label: pk.label, platform: pk.platform, kind: pk.kind, items: [] };
    g.items.push(it); groups.set(k, g);
  }
  const byDate = (a: Item, b: Item) => b.published_date.localeCompare(a.published_date);
  const posts: Post[] = [];
  const accounts: { handle: string; platform: Post["platform"]; networkId: string | null; historical: boolean; synthetic: boolean; evidenceCount: number }[] = [];
  const nodeMeta: Record<string, { kind: string; label: string; register: EntityId; items: number; evidenceIds: string[]; photo?: string; name?: string; role?: string; hub?: boolean; publisher?: string }> = {};
  const perRegister: Record<string, Item[]> = {};
  for (const it of items) (perRegister[it.entity] ??= []).push(it);
  // hubs
  for (const e of ENTITY_IDS) {
    const list = (perRegister[e] ?? []).sort(byDate);
    const r = REGISTERS[e];
    accounts.push({ handle: r.handle, platform: "web", networkId: e, historical: false, synthetic: false, evidenceCount: list.length });
    nodeMeta[r.handle] = { kind: "subject", label: r.name, register: e, items: list.length, evidenceIds: list.slice(0, 40).map((x) => x.id), photo: r.photo, name: r.name, role: r.role, hub: true };
    for (const it of list.slice(0, MAX_HUB_POSTS)) posts.push(toPost(it, r.handle, "#hub"));
  }
  // member nodes
  let members = 0;
  for (const [k, g] of groups) {
    if (g.items.length < MIN_ITEMS) continue;
    const handle = `${g.label}·${REGISTERS[g.entity].short.toLowerCase()}`;
    const list = g.items.sort(byDate);
    accounts.push({ handle, platform: g.platform, networkId: g.entity, historical: false, synthetic: false, evidenceCount: list.length });
    nodeMeta[handle] = { kind: g.kind, label: g.label, register: g.entity, items: list.length, evidenceIds: list.slice(0, 40).map((x) => x.id), publisher: g.label };
    for (const it of list.slice(0, MAX_POSTS_PER_NODE)) posts.push(toPost(it, handle, ""));
    members++; void k;
  }
  const input = { posts, accounts, historicalNetworkIds: [], params: { ...DEFAULT_PARAMS, windowSeconds: 86_400, minWeight: MIN_WEIGHT, keepIsolates: true, textThreshold: 0.6 }, runId: "REP-GRAPH-001", nowIso: NOW_ISO, investigationId: null };
  const result: CorrelationResult = runEngine(input, () => undefined);
  const evidence: Record<string, { id: string; title: string; url: string; source: string; publishedAt: string; entity: EntityId; category: string; sentiment: number }> = {};
  const needed = new Set<string>();
  for (const e of result.edges) for (const id of (e.evidenceIds ?? []).slice(0, 24)) needed.add(id);
  for (const m of Object.values(nodeMeta)) for (const id of m.evidenceIds.slice(0, 20)) needed.add(id);
  for (const it of items) if (needed.has(it.id)) evidence[it.id] = { id: it.id, title: it.headline.slice(0, 140), url: it.source_url, source: it.source_name, publishedAt: it.published_date, entity: it.entity, category: it.category, sentiment: it.sentiment };
  const r3 = (x: number | undefined) => (typeof x === "number" ? Math.round(x * 1000) / 1000 : x);
  // payload diet: 6 shared objects per edge with the fields WHY CONNECTED shows (mode, object, Δt, evidence refs), rounded numbers
  const slimEdges = result.edges.map((e: CoEdge) => ({ ...e, weight: r3(e.weight) as number, syndicationShare: r3(e.syndicationShare), shared: e.shared.slice(0, 6).map((s) => ({ mode: s.mode, object: s.object.slice(0, 80), postA: s.postA, postB: s.postB, tsA: s.tsA, tsB: s.tsB, deltaSeconds: s.deltaSeconds, evidenceA: s.evidenceA, evidenceB: s.evidenceB, ...(s.syndicated ? { syndicated: true } : {}) })), evidenceIds: (e.evidenceIds ?? []).slice(0, 24) }));
  const out = {
    runId: result.runId, generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"), nowIso: NOW_ISO,
    params: { windowSeconds: 86_400, minWeight: MIN_WEIGHT, minItemsPerNode: MIN_ITEMS, maxPostsPerNode: MAX_POSTS_PER_NODE, maxHubPosts: MAX_HUB_POSTS },
    registers: ENTITY_IDS.map((e) => ({ id: e, handle: REGISTERS[e].handle, name: REGISTERS[e].name, short: REGISTERS[e].short, photo: REGISTERS[e].photo, role: REGISTERS[e].role, items: perRegister[e]?.length ?? 0, nodes: result.nodes.filter((n) => n.networkId === e).length })),
    nodes: result.nodes.map((n) => ({ ...n, weightedDegree: r3(n.weightedDegree) as number, betweenness: r3(n.betweenness) as number, ...nodeMeta[n.id], evidenceIds: nodeMeta[n.id]?.evidenceIds.slice(0, 20) ?? [] })),
    links: slimEdges,
    communities: result.communities, modularity: result.modularity, isolates: result.isolates ?? 0,
    evidence,
    stats: { items: items.length, posts: posts.length, nodes: result.nodes.length, memberNodes: members, edges: result.edges.length, isolates: result.isolates ?? 0, hubEdges: result.edges.filter((e) => /^@/.test(e.source) || /^@/.test(e.target)).length, durationMs: Date.now() - t0, engineMs: result.durationMs, trailInvariantViolations: result.trailInvariantViolations ?? 0 },
  };
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(JSON.stringify({ ...out.stats, registers: out.registers.map((r) => `${r.id}:${r.items} items/${r.nodes} nodes`), bytes: fs.statSync(OUT).size }));
}
main();
