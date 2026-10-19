/**
 * Typed loader for the /reputation evidence corpus — web/data/reputation/ (v3 sweep, 2026-10-18T22:54Z):
 *   evidence.json — the merged 2026-10-19 corpus (v3 sweep + classes a–f + reclassified portfolio-social rows) of normalised items {id, registers[], subject_handles[], title, canonical_url, publisher, platform_glyph, source_type,
 *                   published_at, snippet, hashtags[], mentions[], outbound_links[], reply_to, text_hash, companies[], author, match_basis, provenance[]}
 *   graph.json    — {registers[4], nodes[], edges[], isolates[], …} built by scripts/build-reputation-graph-v3.ts with the SAME runEngine /
 *                   edgeWeight port that serves the page (weight, co_occurrence_count, event_count, min_delta_t_seconds, syndication_share,
 *                   evidence_ids[], shared_objects[], by_mode, type).
 * Server-side only (node:fs). The graph is adapted to the engine's CoNode / CoEdge shape the ported canvas already renders, so the renderer,
 * WHY CONNECTED, maxAge and isolates logic stay untouched; evidence rows never ship in a client bundle (paged via the API).
 * Registers are EXACTLY the four BCAP ids.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import type { CoEdge, CoMode, CoNode, Community, SharedObject } from '@/lib/reputation/engine/types';
import type { Platform } from '@/lib/reputation/engine/rilian-types';

export const CORPUS_GRAPH_SOURCE = 'web/data/reputation/graph.json';
export const CORPUS_EVIDENCE_SOURCE = 'web/data/reputation/evidence.json';
export const REGISTER_IDS = ['BCAP-001', 'BCAP-002', 'BCAP-003', 'BCAP-004'] as const;
export type RegisterId = (typeof REGISTER_IDS)[number];
export const REGISTER_NAME: Record<RegisterId, string> = { 'BCAP-001': 'B Capital', 'BCAP-002': 'Eduardo Saverin', 'BCAP-003': 'Raj Ganguly', 'BCAP-004': 'Karan Mohla' };
export const REGISTER_TARGET: Record<RegisterId, number> = { 'BCAP-001': 2000, 'BCAP-002': 800, 'BCAP-003': 600, 'BCAP-004': 500 };

export interface EvidenceItem {
  id: string; registers: RegisterId[]; subject_handles: string[]; title: string; canonical_url: string; publisher: string; platform_glyph: string; source_type: string;
  published_at: string; snippet: string | null; hashtags: string[]; mentions: string[]; outbound_links: string[]; reply_to: string | null; text_hash: string;
  companies?: string[]; author?: string | null; sentiment?: number | null; match_basis: string; provenance: Array<{ source_url: string | null; http_status: number | null; fetched_at: string | null; collector: string; subagent: string; query?: string | null }>;
  published_at_conflicts?: Array<{ published_at: string; source_url: string | null; collector: string }>;
  /** 2026-10-19 sweep fields: source class a–f | 'prior' | 'portfolio-social'; portfolio sectors of the companies named; estimated date flag. */
  source_class?: string; origin?: string; sectors?: string[]; published_at_estimated?: boolean; date_source?: string | null; text_len?: number; provider_receipt?: boolean; page_verification?: string;
}
/** Evidence sector chips (data/portfolio.json → companies[].sector). Order = the brief's list. */
export const SECTOR_IDS = ['biotech', 'healthtech', 'fintech', 'robotics', 'climate', 'ai-infra', 'edtech', 'logistics', 'consumer', 'ai-enterprise'] as const;
export const SECTOR_LABEL: Record<string, string> = { biotech: 'Biotech', healthtech: 'Healthtech', fintech: 'Fintech & Crypto', robotics: 'Robotics & Space', climate: 'Climate & Mobility', 'ai-infra': 'AI Infrastructure', edtech: 'Edtech', logistics: 'Logistics', consumer: 'Consumer & Marketplaces', 'ai-enterprise': 'AI & Enterprise' };
export interface CorpusGraphNode {
  id: string; kind: string; label: string; registers: RegisterId[]; register: RegisterId | null; evidence_count: number; evidence_ids: string[]; photo?: string; name?: string; role?: string; hub?: boolean;
  platform_glyph: string; platform: string; size: number; degree: number; weighted_degree: number; betweenness: number; community: number; isolate: boolean; first_seen: string | null; last_seen: string | null; slug?: string; website?: string | null;
}
export interface CorpusGraphEdge {
  id: string; source: string; target: string; type: CoMode; by_mode: Partial<Record<CoMode, number>>; weight: number; co_occurrence_count: number; event_count: number; min_delta_t_seconds: number;
  syndication_share: number; syndicated: boolean; same_day: boolean; evidence_ids: string[]; shared_objects: Array<{ mode: CoMode; object: string; evidence_a: string; evidence_b: string; delta_seconds: number }>;
}
export interface CorpusRegister { id: RegisterId; handle: string; name: string; short: string; photo: string; role: string; color: string; items: number; nodes: number; edges: number; isolates: number; node_ids: string[] }
export interface CorpusGraph {
  run_id: string; generated_at: string; now_iso: string; engine: string; weight_formula: string; params: { window_seconds: number; min_weight: number; min_items_per_node: number; max_posts_per_node: number; max_hub_posts: number; text_threshold: number };
  registers: CorpusRegister[]; nodes: CorpusGraphNode[]; edges: CorpusGraphEdge[]; isolates: string[]; communities: number; modularity: number;
  stats: { items: number; posts: number; nodes: number; member_nodes: number; node_kinds: Record<string, number>; edges: number; edge_types: Record<string, number>; isolates: number; hub_edges: number; trail_invariant_violations: number; engine_ms: number; total_ms: number };
}
export interface CorpusEvidenceRow { id: string; title: string; url: string; source: string; publishedAt: string | null; excerpt: string | null; registers: RegisterId[]; platform: string; category: string }
export interface CorpusGraphPayload {
  source: typeof CORPUS_GRAPH_SOURCE; evidenceSource: typeof CORPUS_EVIDENCE_SOURCE; runId: string; generatedAt: string; nowIso: string; weightFormula: string;
  params: { windowSeconds: number; minWeight: number };
  registers: Array<Omit<CorpusRegister, 'node_ids'> & { target: number }>;
  nodes: Array<CoNode & { kind: string; label: string; register: RegisterId; registers: RegisterId[]; items: number; evidenceIds: string[]; photo?: string; name?: string; role?: string; hub?: boolean; glyph: string; firstSeen: string | null; lastSeen: string | null; isolate: boolean }>;
  links: CoEdge[]; communities: Community[]; modularity: number; isolates: number; evidence: Record<string, CorpusEvidenceRow>;
  stats: { items: number; posts: number; nodes: number; edges: number; isolates: number; hubEdges: number; memberNodes: number; edgeTypes: Record<string, number>; nodeKinds: Record<string, number> };
}

function dataPath(file: string): string | null {
  return [path.join(process.cwd(), 'data/reputation', file), path.join(process.cwd(), 'web/data/reputation', file)].find((p) => fs.existsSync(p)) ?? null;
}
let evidenceCache: { mtime: number; items: EvidenceItem[]; byId: Map<string, EvidenceItem> } | null = null;
export function loadEvidence(): { items: EvidenceItem[]; byId: Map<string, EvidenceItem> } {
  const p = dataPath('evidence.json');
  if (!p) return { items: [], byId: new Map() };
  const mtime = fs.statSync(p).mtimeMs;
  if (evidenceCache && evidenceCache.mtime === mtime) return evidenceCache;
  const items = JSON.parse(fs.readFileSync(p, 'utf8')) as EvidenceItem[];
  evidenceCache = { mtime, items, byId: new Map(items.map((it) => [it.id, it])) };
  return evidenceCache;
}
let graphCache: { mtime: number; raw: CorpusGraph } | null = null;
export function loadCorpusGraph(): CorpusGraph | null {
  const p = dataPath('graph.json');
  if (!p) return null;
  const mtime = fs.statSync(p).mtimeMs;
  if (graphCache && graphCache.mtime === mtime) return graphCache.raw;
  graphCache = { mtime, raw: JSON.parse(fs.readFileSync(p, 'utf8')) as CorpusGraph };
  return graphCache.raw;
}
/** The canvas glyph set is the Rilian Platform union; corpus glyphs map onto it (podcast / pr / web → web ring, video → youtube). */
export function canvasPlatform(glyph: string): Platform {
  if (glyph === 'video' || glyph === 'youtube') return 'youtube';
  if (glyph === 'linkedin' || glyph === 'x' || glyph === 'reddit' || glyph === 'instagram' || glyph === 'facebook' || glyph === 'tiktok') return glyph;
  return 'web';
}
const CATEGORY_SKIP = new Set(['6f6f6f']);
const SOURCE_CLASS_CATEGORY: Record<string, string> = { a: 'b.capital archive', b: 'portfolio release', c: 'press', d: 'video / podcast', e: 'public social', f: 'rich-list / biography', 'portfolio-social': 'portfolio social', 'g-karan': 'subject press · Mohla', 'g-raj': 'subject press · Ganguly', 'g-eduardo': 'subject press · Saverin', 'g-bcapital': 'subject press · B Capital', 'g-portfolio': 'portfolio release' };
export function categoryOf(it: EvidenceItem): string {
  if (it.source_class && it.source_class !== 'prior' && SOURCE_CLASS_CATEGORY[it.source_class]) return SOURCE_CLASS_CATEGORY[it.source_class];
  for (const h of it.hashtags) if (!CATEGORY_SKIP.has(h)) return h;
  return it.source_type === 'press_release' ? 'press-release' : it.source_type;
}
export function evidenceRow(it: EvidenceItem): CorpusEvidenceRow {
  return { id: it.id, title: it.title, url: it.canonical_url, source: it.publisher, publishedAt: it.published_at, excerpt: it.snippet, registers: it.registers, platform: it.platform_glyph, category: categoryOf(it) };
}
function tsOf(byId: Map<string, EvidenceItem>, id: string, fallback: string): string {
  const p = byId.get(id)?.published_at;
  if (!p) return fallback;
  return p.length === 10 ? `${p}T00:00:00Z` : p;
}
let payloadCache: { key: string; payload: CorpusGraphPayload; json: string; slim: string; gz: Buffer; slimGz: Buffer } | null = null;
/** graph.json + evidence.json → the engine-shaped payload the ported canvas renders. Pure adaptation: weights, counts, trails and shared objects are copied, never recomputed. */
export function buildGraphPayload(): { payload: CorpusGraphPayload; json: string; slim: string; gz: Buffer; slimGz: Buffer } | null {
  const g = loadCorpusGraph();
  if (!g) return null;
  const { byId } = loadEvidence();
  const key = `${g.generated_at}|${byId.size}`;
  if (payloadCache && payloadCache.key === key) return payloadCache;
  const evidence: Record<string, CorpusEvidenceRow> = {};
  const want = (id: string | undefined) => { if (id && !evidence[id]) { const it = byId.get(id); if (it) evidence[id] = evidenceRow(it); } };
  const nodes: CorpusGraphPayload['nodes'] = g.nodes.map((n) => {
    for (const id of n.evidence_ids) want(id);
    const reg = (n.register ?? n.registers[0] ?? 'BCAP-001') as RegisterId;
    return { id: n.id, activity: n.evidence_count, platform: canvasPlatform(n.platform_glyph), networkId: reg, synthetic: false, evidenceCount: n.evidence_count, community: n.community, degree: n.degree, weightedDegree: n.weighted_degree, betweenness: n.betweenness, kind: n.kind, label: n.label, register: reg, registers: n.registers, items: n.evidence_count, evidenceIds: n.evidence_ids, photo: n.photo, name: n.name, role: n.role, hub: n.hub, glyph: n.platform_glyph, firstSeen: n.first_seen, lastSeen: n.last_seen, isolate: n.isolate };
  });
  const links: CoEdge[] = g.edges.map((e) => {
    const shared: SharedObject[] = e.shared_objects.map((s) => { want(s.evidence_a); want(s.evidence_b); return { mode: s.mode, object: s.object, postA: s.evidence_a, postB: s.evidence_b, tsA: tsOf(byId, s.evidence_a, g.now_iso), tsB: tsOf(byId, s.evidence_b, g.now_iso), deltaSeconds: s.delta_seconds, evidenceA: s.evidence_a, evidenceB: s.evidence_b, sameDay: e.same_day || undefined }; });
    for (const id of e.evidence_ids) want(id);
    return { id: e.id, source: e.source, target: e.target, weight: e.weight, count: e.co_occurrence_count, byMode: e.by_mode, minDelta: e.min_delta_t_seconds, shared, sameDay: e.same_day, rawCount: e.event_count, syndicationShare: e.syndication_share, syndicated: e.syndicated, evidenceIds: e.evidence_ids };
  });
  const byCommunity = new Map<number, string[]>();
  for (const n of nodes) { const arr = byCommunity.get(n.community) ?? []; arr.push(n.id); byCommunity.set(n.community, arr); }
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const communities: Community[] = [...byCommunity.entries()].filter(([i]) => i >= 0).sort((a, b) => a[0] - b[0]).map(([index, members]) => {
    const regs = new Map<string, number>(); const plats = new Map<Platform, number>();
    for (const m of members) { const n = nodeById.get(m)!; regs.set(n.register, (regs.get(n.register) ?? 0) + 1); plats.set(n.platform, (plats.get(n.platform) ?? 0) + 1); }
    const memberSet = new Set(members);
    const internalWeight = links.reduce((acc, l) => acc + (memberSet.has(l.source) && memberSet.has(l.target) ? l.weight : 0), 0);
    const objCounts = new Map<string, { mode: CoMode; object: string; count: number }>();
    for (const l of links) if (memberSet.has(l.source) && memberSet.has(l.target)) for (const s of l.shared) { const k = `${s.mode}|${s.object}`; const cur = objCounts.get(k) ?? { mode: s.mode, object: s.object, count: 0 }; cur.count++; objCounts.set(k, cur); }
    return { index, members, size: members.length, internalWeight, dominantNetworkId: [...regs.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null, dominantPlatform: [...plats.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'web', topObjects: [...objCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5), caveat: 'SIMILARITY ≠ COORDINATION — UNPROVEN' };
  });
  const registers = g.registers.map(({ node_ids: _n, ...r }) => { void _n; return { ...r, target: REGISTER_TARGET[r.id] }; });
  const payload: CorpusGraphPayload = {
    source: CORPUS_GRAPH_SOURCE, evidenceSource: CORPUS_EVIDENCE_SOURCE, runId: g.run_id, generatedAt: g.generated_at, nowIso: g.now_iso, weightFormula: g.weight_formula,
    params: { windowSeconds: g.params.window_seconds, minWeight: g.params.min_weight }, registers, nodes, links, communities, modularity: g.modularity, isolates: g.stats.isolates, evidence,
    stats: { items: g.stats.items, posts: g.stats.posts, nodes: g.stats.nodes, edges: g.stats.edges, isolates: g.stats.isolates, hubEdges: g.stats.hub_edges, memberNodes: g.stats.member_nodes, edgeTypes: g.stats.edge_types, nodeKinds: g.stats.node_kinds },
  };
  const { evidence: _e, ...rest } = payload; void _e;
  const json = JSON.stringify(payload); const slim = JSON.stringify(rest);
  // pre-gzipped once per process (≈12 MB → ≈1.5 MB): the route hands the buffer to clients that accept gzip, so the lazy load after first paint stays short
  payloadCache = { key, payload, json, slim, gz: zlib.gzipSync(json, { level: 6 }), slimGz: zlib.gzipSync(slim, { level: 6 }) };
  return payloadCache;
}
/** Age in days of an evidence item relative to `nowMs` (Infinity when the date cannot be parsed — such rows drop as soon as any max age is set, like edges without timestamps). */
export function itemAgeDays(it: EvidenceItem, nowMs: number): number {
  const t = Date.parse(it.published_at.length === 10 ? `${it.published_at}T00:00:00Z` : it.published_at);
  return Number.isNaN(t) ? Infinity : (nowMs - t) / 86_400_000;
}
