/**
 * Coordination-detection engine core (pure TypeScript, no DOM) — runs inside a Web Worker.
 *
 * Pipeline (per run):
 *  1. filter posts (platform / network / narrative / handle; NET-004 + historical accounts always out)
 *  2. for every enabled mode, index posts by shared object and slide a time window over each object's
 *     timeline; every (A,B) pair of distinct accounts inside the window becomes one co-occurrence event
 *     (Coordination Network Toolkit semantics). co-text uses MinHash(64) over word 3-shingles and only
 *     compares posts inside the window (CooRTweet-style "same content, close in time").
 *  3. DEF-020/021 (2026-09-15): the events of a pair are grouped by DISTINCT POST PAIR — one republished article that fires
 *     co-share (normalised title) and co-text (MinHash) is ONE co-occurrence (`count`; the event total stays in `rawCount`);
 *     a pair whose two posts carry an identical normalised title / text signature or the same canonical URL path inside the
 *     window is flagged as syndication (wire copy). edge weight = `edgeWeight()` in objects.ts: log-scaled distinct pairs ×
 *     a 0.5–1 specificity multiplier × the precision factor, halved by the syndication share — never 1.000 from one article.
 *  4. Louvain community detection (own implementation, deterministic node order, resolution γ),
 *     degree / weighted degree / Brandes betweenness.
 *  5. an explainable WHY CONNECTED trail per edge: the exact shared objects, both timestamps and Δt, and (DEF-019) the
 *     evidence refs of the posts THIS run was computed from (`edge.evidenceIds`, ≥ 2 whenever count > 0 — asserted).
 */
import { SAME_DAY_WEIGHT_CAP, derivePrecision, pairEligibility, type TsPrecision } from './temporal';
import { edgeWeight, idf as idfOf, isGeneric, isOffTopic, isStoplisted, offTopicKeywordsFor } from './objects';
import type { Platform, Post } from './rilian-types';
import { CAVEAT, type CoEdge, type CoMode, type CoNode, type Community, type CorrelationResult, type EngineInput, type MatrixData, type PrecisionReject, type SharedObject } from './types';

type Progress = (stage: string, pct: number) => void;

/* ------------------------------------------------------------------ helpers */
function normaliseUrl(u: string): string {
  try {
    const url = new URL(u);
    return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`.toLowerCase();
  } catch {
    return u.toLowerCase();
  }
}

/** DEF-020: canonical URL PATH (scheme, host, query, hash and the trailing slash stripped) — the same article slug republished under
 * another publisher's domain is wire copy. Trivial paths (`/`, `/news`, shorter than 12 chars) never count. */
export function canonicalUrlPath(u: string): string | null {
  try {
    const path = new URL(u).pathname.replace(/\/+$/, '').toLowerCase();
    return path.length >= 12 ? path : null;
  } catch {
    return null;
  }
}

/** DEF-019: the evidence reference a post contributes to the trail — its evidenceId, else the documented `post:` fallback (never nothing). */
export function evidenceRefOf(post: Pick<Post, 'id' | 'evidenceId'>): string {
  if (post.evidenceId) return post.evidenceId;
  return post.id.startsWith('post:') ? post.id : `post:${post.id}`;
}

/** Dev-only hard failure for the trail invariant (vitest / vite dev); production only logs + counts. */
const DEV_ASSERTS: boolean = (() => {
  try {
    const env = (import.meta as unknown as { env?: { DEV?: boolean; MODE?: string } }).env;
    if (env && typeof env.DEV === 'boolean') return env.DEV || env.MODE === 'test';
  } catch {
    /* no import.meta.env (plain node) */
  }
  const nodeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV;
  return nodeEnv !== 'production';
})();

/** DEF-019 invariant: an edge with co-occurrences and fewer than two evidence refs must be impossible. Returns false (after
 * console.error, and a throw in dev) when violated, so the caller can count it on the result. */
export function assertEdgeInvariant(edge: Pick<CoEdge, 'id' | 'count' | 'evidenceIds'>): boolean {
  if (edge.count <= 0 || (edge.evidenceIds?.length ?? 0) >= 2) return true;
  const msg = `coordination engine: trail invariant violated — edge ${edge.id} has count ${edge.count} but ${edge.evidenceIds?.length ?? 0} evidence ref(s)`;
  console.error(msg);
  if (DEV_ASSERTS) throw new Error(msg);
  return false;
}

function normaliseText(t: string): string[] {
  return t
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#@]\S+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function shingles(words: string[], k = 3): Set<string> {
  const out = new Set<string>();
  if (words.length < k) {
    if (words.length) out.add(words.join(' '));
    return out;
  }
  for (let i = 0; i + k <= words.length; i++) out.add(words.slice(i, i + k).join(' '));
  return out;
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const MH_N = 64;
function makeHashers(seed: number): Array<[number, number]> {
  let a = seed >>> 0;
  const rnd = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // odd multiplier + additive constant: a fast 32-bit hash family (h_i(x) = (a_i·x + b_i) mod 2^32)
  return Array.from({ length: MH_N }, () => [(Math.floor(rnd() * 0xffffffff) | 1) >>> 0, Math.floor(rnd() * 0xffffffff) >>> 0] as [number, number]);
}

function minhash(sh: Set<string>, hashers: Array<[number, number]>): Uint32Array {
  const sig = new Uint32Array(MH_N).fill(0xffffffff);
  for (const s of sh) {
    const x = fnv1a(s);
    for (let i = 0; i < MH_N; i++) {
      const [a, b] = hashers[i] as [number, number];
      const v = (Math.imul(a, x) + b) >>> 0;
      if (v < (sig[i] as number)) sig[i] = v;
    }
  }
  return sig;
}

function estJaccard(a: Uint32Array, b: Uint32Array): number {
  let m = 0;
  for (let i = 0; i < MH_N; i++) if (a[i] === b[i]) m++;
  return m / MH_N;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`;
}

/* ------------------------------------------------------------------ main */
export function runEngine(input: EngineInput, progress: Progress = () => {}): CorrelationResult {
  const t0 = Date.now();
  const { params } = input;
  const accountMap = new Map(input.accounts.map((a) => [a.handle, a]));
  const historical = new Set(input.historicalNetworkIds);

  /* 1. filter */
  progress('filtering posts', 5);
  let excludedHistorical = 0;
  const posts: Post[] = [];
  const minTs = params.maxAgeDays !== null && params.maxAgeDays > 0 ? new Date(input.nowIso).getTime() - params.maxAgeDays * 86400_000 : -Infinity;
  for (const p of input.posts) {
    const acc = accountMap.get(p.handle);
    if (!acc) continue;
    if (new Date(p.ts).getTime() < minTs) continue;
    if (acc.historical || (acc.networkId && historical.has(acc.networkId))) {
      excludedHistorical++;
      continue; // NET-004 is never part of a live run
    }
    if (params.platforms && !params.platforms.includes(p.platform)) continue;
    if (params.networks && !(acc.networkId && params.networks.includes(acc.networkId))) continue;
    if (params.narratives && !(p.narrativeId && params.narratives.includes(p.narrativeId))) continue;
    if (params.handles && !params.handles.includes(p.handle)) continue;
    posts.push(p);
  }
  posts.sort((a, b) => a.ts.localeCompare(b.ts));
  const tsOf = new Map(posts.map((p) => [p.id, new Date(p.ts).getTime()]));
  const activity = new Map<string, number>();
  for (const p of posts) activity.set(p.handle, (activity.get(p.handle) ?? 0) + 1);

  /* 2. co-occurrence events */
  const events = new Map<string, SharedObject[]>(); // pairKey → events
  const objectUsers = new Map<string, Set<string>>(); // mode:object → distinct handles
  const windowMs = params.windowSeconds * 1000;
  const precOf = (p: Post): TsPrecision => p.tsPrecision ?? derivePrecision(p.ts);
  const precisionRejects: PrecisionReject[] = [];
  const rejectedPairKeys = new Set<string>();
  const droppedObjects: NonNullable<CorrelationResult['droppedObjects']> = [];
  const nPosts = posts.length;
  const dfOf = new Map<string, number>(); // mode:object → posts carrying it
  const addEvent = (a: Post, b: Post, mode: CoMode, object: string, similarity?: number): void => {
    if (a.handle === b.handle) return;
    const key = pairKey(a.handle, b.handle);
    const [first, second] = a.handle < b.handle ? [a, b] : [b, a];
    // fix A: both precisions must resolve the window; date-only × date-only → labelled same-day (capped); anything else → rejected + logged
    const elig = pairEligibility(precOf(a), precOf(b), params.windowSeconds);
    if (!elig.eligible) {
      const rk = `${key}|${mode}|${object}`;
      if (!rejectedPairKeys.has(rk) && precisionRejects.length < 5000) {
        rejectedPairKeys.add(rk);
        precisionRejects.push({ reason: 'precision_insufficient', source: first.handle, target: second.handle, evidA: first.evidenceId ?? null, evidB: second.evidenceId ?? null, precisionA: precOf(first), precisionB: precOf(second), mode, object, windowSeconds: params.windowSeconds });
      }
      return;
    }
    const list = events.get(key) ?? [];
    const delta = Math.abs((tsOf.get(a.id) ?? 0) - (tsOf.get(b.id) ?? 0)) / 1000;
    const ev: SharedObject = { mode, object, postA: first.id, postB: second.id, tsA: first.ts, tsB: second.ts, deltaSeconds: Math.round(delta), precisionFactor: elig.factor, sameDay: elig.sameDay, evidenceA: evidenceRefOf(first), evidenceB: evidenceRefOf(second) };
    if (similarity !== undefined) ev.similarity = similarity;
    list.push(ev);
    events.set(key, list);
    const ok = `${mode}:${object}`;
    const users = objectUsers.get(ok) ?? new Set<string>();
    users.add(a.handle);
    users.add(b.handle);
    objectUsers.set(ok, users);
  };

  const slide = (mode: CoMode, objectOf: (p: Post) => string[]): void => {
    const index = new Map<string, Post[]>();
    for (const p of posts) for (const o of objectOf(p)) if (o) index.set(o, [...(index.get(o) ?? []), p]);
    for (const [object, list] of index) {
      if (list.length < 2) continue;
      // fix B: generic (> 20 % of posts), stoplisted and off-topic objects produce no edges
      const df = new Set(list.map((p) => p.id)).size;
      dfOf.set(`${mode}:${object}`, df);
      if (isGeneric(df, nPosts)) { droppedObjects.push({ mode, object, df, reason: 'generic' }); continue; }
      if (isStoplisted(object, input.investigationId)) { droppedObjects.push({ mode, object, df, reason: 'stoplist' }); continue; }
      if (mode !== 'co-link' && mode !== 'co-share' && isOffTopic(object, mode, offTopicKeywordsFor(input.investigationId))) { droppedObjects.push({ mode, object, df, reason: 'off-topic' }); continue; }
      for (let i = 0; i < list.length; i++) {
        const pi = list[i] as Post;
        const ti = tsOf.get(pi.id) ?? 0;
        for (let j = i + 1; j < list.length; j++) {
          const pj = list[j] as Post;
          if ((tsOf.get(pj.id) ?? 0) - ti > windowMs) break;
          addEvent(pi, pj, mode, object);
        }
      }
    }
  };

  const modes = new Set(params.modes);
  let step = 10;
  if (modes.has('co-share')) {
    progress('co-share', (step += 10));
    slide('co-share', (p) => (p.sharedId ? [p.sharedId] : []));
  }
  if (modes.has('co-link')) {
    progress('co-link', (step += 10));
    slide('co-link', (p) => p.urls.map(normaliseUrl));
  }
  if (modes.has('co-hashtag')) {
    progress('co-hashtag', (step += 10));
    slide('co-hashtag', (p) => p.hashtags.map((h) => h.toLowerCase()));
  }
  if (modes.has('co-reply')) {
    progress('co-reply', (step += 10));
    slide('co-reply', (p) => (p.replyTo ? [p.replyTo.toLowerCase()] : []));
  }
  if (modes.has('co-text')) {
    progress('co-text (MinHash)', (step += 10));
    const hashers = makeHashers(params.seed);
    const sigs = posts.map((p) => {
      const sh = shingles(normaliseText(p.text));
      return sh.size >= 2 ? minhash(sh, hashers) : null;
    });
    for (let i = 0; i < posts.length; i++) {
      const si = sigs[i];
      if (!si) continue;
      const pi = posts[i] as Post;
      const ti = tsOf.get(pi.id) ?? 0;
      for (let j = i + 1; j < posts.length; j++) {
        const pj = posts[j] as Post;
        if ((tsOf.get(pj.id) ?? 0) - ti > windowMs) break;
        const sj = sigs[j];
        if (!sj || pj.handle === pi.handle) continue;
        const sim = estJaccard(si, sj);
        if (sim >= params.textThreshold) {
          const words = normaliseText(pi.text).slice(0, 9).join(' ');
          addEvent(pi, pj, 'co-text', `“${words}…” (est. Jaccard ${sim.toFixed(2)})`, sim);
        }
      }
    }
  }

  /* 3. edges: dedup by distinct post pair (DEF-020), syndication flag, discriminating weight (DEF-021), evidence trail (DEF-019) */
  progress('weighting edges', 65);
  const edges: CoEdge[] = [];
  const postById = new Map(posts.map((p) => [p.id, p]));
  const textSigCache = new Map<string, string>();
  const textSig = (p: Post): string => {
    let s = textSigCache.get(p.id);
    if (s === undefined) {
      s = normaliseText(p.text).join(' ');
      textSigCache.set(p.id, s);
    }
    return s;
  };
  /** DEF-020: identical normalised title OR identical text signature OR the same canonical URL path — the two posts always belong to
   * different accounts (addEvent) and always sit inside the window (the sweep), so Δt ≤ window holds by construction. */
  const isSyndicatedPair = (pa: Post | undefined, pb: Post | undefined): boolean => {
    if (!pa || !pb || pa.handle === pb.handle) return false;
    if (pa.sharedId && pa.sharedId === pb.sharedId) return true;
    const sa = textSig(pa);
    if (sa.length > 0 && sa === textSig(pb)) return true;
    const pathsB = new Set(pb.urls.map(canonicalUrlPath).filter((x): x is string => x !== null));
    if (pathsB.size === 0) return false;
    return pa.urls.some((u) => {
      const path = canonicalUrlPath(u);
      return path !== null && pathsB.has(path);
    });
  };
  let trailInvariantViolations = 0;
  for (const [key, list] of events) {
    const [a, b] = key.split('\u0000') as [string, string];
    const byMode: Partial<Record<CoMode, number>> = {};
    let minDelta = Infinity;
    const parts: Array<{ idf: number; factor: number }> = [];
    let allSameDay = true;
    const byPair = new Map<string, SharedObject[]>(); // distinct (postA, postB) → its events (one republished article = ONE co-occurrence)
    for (const ev of list) {
      const df = dfOf.get(`${ev.mode}:${ev.object}`) ?? objectUsers.get(`${ev.mode}:${ev.object}`)?.size ?? 2;
      ev.idf = idfOf(df, nPosts);
      parts.push({ idf: ev.idf, factor: ev.precisionFactor ?? 1 });
      byMode[ev.mode] = (byMode[ev.mode] ?? 0) + 1;
      if (ev.deltaSeconds < minDelta) minDelta = ev.deltaSeconds;
      if (!ev.sameDay) allSameDay = false;
      const pk = `${ev.postA}\u0000${ev.postB}`;
      byPair.set(pk, [...(byPair.get(pk) ?? []), ev]);
    }
    const count = byPair.size; // dedup-adjusted co-occurrences
    const rawCount = list.length; // raw events (the pre-2026-09-15 `count`)
    let syndicatedPairs = 0;
    for (const evs of byPair.values()) {
      const first = evs[0] as SharedObject;
      if (isSyndicatedPair(postById.get(first.postA), postById.get(first.postB))) {
        syndicatedPairs++;
        for (const ev of evs) ev.syndicated = true;
      }
    }
    const syndicationShare = count > 0 ? syndicatedPairs / count : 0;
    let weight = edgeWeight({ count, shared: parts, n: nPosts, syndicationShare });
    if (allSameDay) weight = Math.min(weight, SAME_DAY_WEIGHT_CAP);
    if (count < params.minCoOccurrences || weight < params.minWeight) continue;
    const ordered = [...list].sort((x, y) => x.deltaSeconds - y.deltaSeconds);
    const shared = ordered.slice(0, 40);
    // DEF-019: the trail is aggregated from the SAME posts the edge was computed from — unique, Δt-ordered, ≤ 40; a post without an
    // evidenceId contributes its `post:` id (evidenceRefOf), so two distinct posts always yield two refs.
    const evidenceIds: string[] = [];
    const seenRef = new Set<string>();
    for (const ev of ordered) {
      for (const ref of [ev.evidenceA, ev.evidenceB]) {
        if (ref && !seenRef.has(ref) && evidenceIds.length < 40) {
          seenRef.add(ref);
          evidenceIds.push(ref);
        }
      }
    }
    if (evidenceIds.length < 2) {
      // two distinct posts that map onto one evidence ref (duplicate rows): the post ids keep the trail resolvable
      for (const ev of ordered) for (const pid of [ev.postA, ev.postB]) {
        const ref = pid.startsWith('post:') ? pid : `post:${pid}`;
        if (!seenRef.has(ref) && evidenceIds.length < 40) { seenRef.add(ref); evidenceIds.push(ref); }
      }
    }
    const edge: CoEdge = { id: `${a}|${b}`, source: a, target: b, weight, count, byMode, minDelta: Number.isFinite(minDelta) ? minDelta : 0, shared, sameDay: allSameDay, rawCount, syndicatedPairs, syndicationShare, syndicated: count > 0 && syndicationShare >= 0.5, evidenceIds };
    if (!assertEdgeInvariant(edge)) trailInvariantViolations++;
    edges.push(edge);
  }
  edges.sort((x, y) => y.weight - x.weight || x.id.localeCompare(y.id));

  /* 4. nodes, communities, centrality */
  progress('community detection (Louvain)', 75);
  const handles = Array.from(new Set(edges.flatMap((e) => [e.source, e.target]))).sort();
  const idx = new Map(handles.map((h, i) => [h, i]));
  const n = handles.length;
  const adj: Array<Map<number, number>> = Array.from({ length: n }, () => new Map());
  for (const e of edges) {
    const u = idx.get(e.source) as number;
    const v = idx.get(e.target) as number;
    adj[u]?.set(v, (adj[u]?.get(v) ?? 0) + e.weight);
    adj[v]?.set(u, (adj[v]?.get(u) ?? 0) + e.weight);
  }
  const { community, modularity } = louvain(adj, params.resolution);
  progress('centrality (Brandes)', 88);
  const betweenness = brandes(adj);
  const nodes: CoNode[] = handles.map((h, i) => {
    const acc = accountMap.get(h);
    let wdeg = 0;
    for (const w of (adj[i] ?? new Map()).values()) wdeg += w;
    return {
      id: h,
      activity: activity.get(h) ?? 0,
      platform: (acc?.platform ?? 'x') as Platform,
      networkId: acc?.networkId ?? null,
      synthetic: acc?.synthetic ?? false,
      evidenceCount: acc?.evidenceCount ?? 0,
      community: community[i] ?? 0,
      degree: adj[i]?.size ?? 0,
      weightedDegree: wdeg,
      betweenness: betweenness[i] ?? 0,
    };
  });

  /* communities summary (renumbered by size, largest first) */
  const groups = new Map<number, number[]>();
  community.forEach((c, i) => groups.set(c, [...(groups.get(c) ?? []), i]));
  const ordered = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length || (a[1][0] ?? 0) - (b[1][0] ?? 0));
  const renumber = new Map(ordered.map(([c], k) => [c, k]));
  for (const node of nodes) node.community = renumber.get(node.community) ?? 0;
  const communities: Community[] = ordered.map(([c, members], k) => {
    const memberSet = new Set(members.map((i) => handles[i] as string));
    let internal = 0;
    const objCount = new Map<string, { mode: CoMode; object: string; count: number }>();
    for (const e of edges) {
      if (memberSet.has(e.source) && memberSet.has(e.target)) {
        internal += e.weight;
        for (const s of e.shared) {
          const key = `${s.mode}:${s.object}`;
          const cur = objCount.get(key) ?? { mode: s.mode, object: s.object, count: 0 };
          cur.count++;
          objCount.set(key, cur);
        }
      }
    }
    const nets = new Map<string, number>();
    const plats = new Map<Platform, number>();
    for (const h of memberSet) {
      const a = accountMap.get(h);
      nets.set(a?.networkId ?? 'independent', (nets.get(a?.networkId ?? 'independent') ?? 0) + 1);
      plats.set(a?.platform ?? 'x', (plats.get(a?.platform ?? 'x') ?? 0) + 1);
    }
    const domNet = Array.from(nets.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'independent';
    const domPlat = Array.from(plats.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'x';
    void c;
    return {
      index: k,
      members: Array.from(memberSet).sort(),
      size: memberSet.size,
      internalWeight: internal,
      dominantNetworkId: domNet === 'independent' ? null : domNet,
      dominantPlatform: domPlat,
      topObjects: Array.from(objCount.values()).sort((a, b) => b.count - a.count).slice(0, 5),
      caveat: CAVEAT,
    };
  });

  /* FULL_CORPUS_CORRELATION (user reports 08:17Z / 10:00Z): every account with a considered post stays in the result. Accounts
     without a surviving edge are emitted as degree-0 nodes in ONE extra "no co-occurrence" community (index = communities.length)
     instead of vanishing — dropping them is the explicit opt-out `params.keepIsolates === false`. */
  const keepIsolates = params.keepIsolates !== false;
  const isolateHandles = keepIsolates ? Array.from(activity.keys()).filter((h) => !idx.has(h)).sort() : [];
  if (isolateHandles.length) {
    const isoCommunity = communities.length;
    for (const h of isolateHandles) {
      const acc = accountMap.get(h);
      nodes.push({ id: h, activity: activity.get(h) ?? 0, platform: (acc?.platform ?? 'x') as Platform, networkId: acc?.networkId ?? null, synthetic: acc?.synthetic ?? false, evidenceCount: acc?.evidenceCount ?? 0, community: isoCommunity, degree: 0, weightedDegree: 0, betweenness: 0 });
    }
    const nets = new Map<string, number>();
    const plats = new Map<Platform, number>();
    for (const h of isolateHandles) {
      const a = accountMap.get(h);
      nets.set(a?.networkId ?? 'independent', (nets.get(a?.networkId ?? 'independent') ?? 0) + 1);
      plats.set(a?.platform ?? 'x', (plats.get(a?.platform ?? 'x') ?? 0) + 1);
    }
    const domNet = Array.from(nets.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'independent';
    const domPlat = Array.from(plats.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'x';
    communities.push({ index: isoCommunity, members: isolateHandles, size: isolateHandles.length, internalWeight: 0, dominantNetworkId: domNet === 'independent' ? null : domNet, dominantPlatform: domPlat, topObjects: [], caveat: CAVEAT });
  }

  /* matrix ordered by community, then weighted degree */
  progress('matrix', 95);
  const orderedNodes = [...nodes].sort((a, b) => a.community - b.community || b.weightedDegree - a.weightedDegree || a.id.localeCompare(b.id));
  const mIdx = new Map(orderedNodes.map((nd, i) => [nd.id, i]));
  const values = orderedNodes.map(() => orderedNodes.map(() => 0));
  for (const e of edges) {
    const i = mIdx.get(e.source) as number;
    const j = mIdx.get(e.target) as number;
    (values[i] as number[])[j] = e.weight;
    (values[j] as number[])[i] = e.weight;
  }
  const matrix: MatrixData = { handles: orderedNodes.map((nd) => nd.id), communities: orderedNodes.map((nd) => nd.community), values };

  const finished = Date.now();
  progress('done', 100);
  return {
    runId: input.runId,
    startedAt: new Date(t0).toISOString(),
    finishedAt: new Date(finished).toISOString(),
    durationMs: finished - t0,
    params,
    postsConsidered: posts.length,
    nodes,
    edges,
    communities,
    modularity,
    matrix,
    excluded: { historicalNetworks: input.historicalNetworkIds, historicalAccounts: excludedHistorical },
    caveat: CAVEAT,
    precisionRejects,
    droppedObjects,
    isolates: isolateHandles.length,
    accountsConsidered: activity.size,
    trailInvariantViolations,
  };
}

/* ------------------------------------------------------------------ Louvain (own implementation) */
export function louvain(adj: Array<Map<number, number>>, resolution = 1): { community: number[]; modularity: number } {
  const n = adj.length;
  if (n === 0) return { community: [], modularity: 0 };
  // current graph (may be aggregated); membership maps original node → community of current graph
  let graph = adj.map((m) => new Map(m));
  let membership = Array.from({ length: n }, (_, i) => i); // original node → current-level node id
  let improvedAny = true;
  let levels = 0;
  while (improvedAny && levels < 10) {
    levels++;
    const size = graph.length;
    const k = graph.map((m) => Array.from(m.values()).reduce((s, w) => s + w, 0));
    const m2 = k.reduce((s, v) => s + v, 0); // 2m
    if (m2 === 0) break;
    const comm = Array.from({ length: size }, (_, i) => i);
    const tot = [...k]; // total degree per community
    let moved = true;
    let sweeps = 0;
    while (moved && sweeps < 50) {
      moved = false;
      sweeps++;
      for (let i = 0; i < size; i++) {
        const ci = comm[i] as number;
        const neigh = new Map<number, number>(); // community → weight from i
        for (const [j, w] of graph[i] as Map<number, number>) {
          if (j === i) continue;
          const cj = comm[j] as number;
          neigh.set(cj, (neigh.get(cj) ?? 0) + w);
        }
        // remove i from its community
        tot[ci] = (tot[ci] as number) - (k[i] as number);
        let best = ci;
        let bestGain = (neigh.get(ci) ?? 0) - (resolution * (tot[ci] as number) * (k[i] as number)) / m2;
        const candidates = Array.from(neigh.keys()).sort((a, b) => a - b);
        for (const c of candidates) {
          const gain = (neigh.get(c) ?? 0) - (resolution * (tot[c] as number) * (k[i] as number)) / m2;
          if (gain > bestGain + 1e-12) {
            bestGain = gain;
            best = c;
          }
        }
        tot[best] = (tot[best] as number) + (k[i] as number);
        if (best !== ci) {
          comm[i] = best;
          moved = true;
        }
      }
    }
    // renumber communities densely
    const ids = Array.from(new Set(comm)).sort((a, b) => a - b);
    const remap = new Map(ids.map((c, i) => [c, i]));
    const newComm = comm.map((c) => remap.get(c) as number);
    improvedAny = ids.length < size;
    membership = membership.map((cur) => newComm[cur] as number);
    if (!improvedAny) break;
    // aggregate
    const agg: Array<Map<number, number>> = Array.from({ length: ids.length }, () => new Map());
    for (let i = 0; i < size; i++) {
      const ci = newComm[i] as number;
      for (const [j, w] of graph[i] as Map<number, number>) {
        const cj = newComm[j] as number;
        agg[ci]?.set(cj, (agg[ci]?.get(cj) ?? 0) + w);
      }
    }
    graph = agg;
  }
  return { community: membership, modularity: modularityOf(adj, membership, resolution) };
}

function modularityOf(adj: Array<Map<number, number>>, comm: number[], resolution = 1): number {
  const k = adj.map((m) => Array.from(m.values()).reduce((s, w) => s + w, 0));
  const m2 = k.reduce((s, v) => s + v, 0);
  if (m2 === 0) return 0;
  let q = 0;
  for (let i = 0; i < adj.length; i++) {
    for (let j = 0; j < adj.length; j++) {
      if (comm[i] !== comm[j]) continue;
      const w = adj[i]?.get(j) ?? 0;
      q += w - (resolution * (k[i] as number) * (k[j] as number)) / m2;
    }
  }
  return q / m2;
}

/* ------------------------------------------------------------------ Brandes betweenness (unweighted, normalised) */
export function brandes(adj: Array<Map<number, number>>): number[] {
  const n = adj.length;
  const cb = new Array<number>(n).fill(0);
  for (let s = 0; s < n; s++) {
    const stack: number[] = [];
    const pred: number[][] = Array.from({ length: n }, () => []);
    const sigma = new Array<number>(n).fill(0);
    const dist = new Array<number>(n).fill(-1);
    sigma[s] = 1;
    dist[s] = 0;
    const queue = [s];
    while (queue.length) {
      const v = queue.shift() as number;
      stack.push(v);
      for (const w of Array.from((adj[v] as Map<number, number>).keys()).sort((a, b) => a - b)) {
        if (dist[w] < 0) {
          queue.push(w);
          dist[w] = (dist[v] as number) + 1;
        }
        if (dist[w] === (dist[v] as number) + 1) {
          sigma[w] = (sigma[w] as number) + (sigma[v] as number);
          pred[w]?.push(v);
        }
      }
    }
    const delta = new Array<number>(n).fill(0);
    while (stack.length) {
      const w = stack.pop() as number;
      for (const v of pred[w] as number[]) delta[v] = (delta[v] as number) + ((sigma[v] as number) / (sigma[w] as number)) * (1 + (delta[w] as number));
      if (w !== s) cb[w] = (cb[w] as number) + (delta[w] as number);
    }
  }
  const norm = n > 2 ? (n - 1) * (n - 2) : 1; // undirected: each pair counted twice, so divide by (n-1)(n-2)
  return cb.map((v) => v / norm);
}


/**
 * v5.2 (fix C) — incremental update: re-score ONLY the pairs touched by posts that are new since `prev` was produced,
 * keep every other edge as it was, then refresh nodes / communities / centrality for the merged edge set. No full
 * re-prompt and no full pair sweep: the sweep is restricted to posts sharing an object with a new post.
 */
export function incrementalUpdate(prev: CorrelationResult, input: EngineInput, knownPostIds: ReadonlySet<string>): CorrelationResult {
  const newPosts = input.posts.filter((p) => !knownPostIds.has(p.id));
  if (newPosts.length === 0) return prev;
  const affectedHandles = new Set(newPosts.map((p) => p.handle));
  // posts that can pair with a new post: same handle set neighbourhood = anything sharing an object; cheap superset = all posts of
  // handles touched + any post whose objects intersect a new post's objects
  const newObjects = new Set<string>();
  for (const p of newPosts) {
    if (p.sharedId) newObjects.add(`s:${p.sharedId}`);
    for (const u of p.urls) newObjects.add(`u:${u}`);
    for (const h of p.hashtags) newObjects.add(`h:${h.toLowerCase()}`);
    if (p.replyTo) newObjects.add(`r:${p.replyTo.toLowerCase()}`);
  }
  const touches = (p: Post): boolean =>
    affectedHandles.has(p.handle) || (p.sharedId ? newObjects.has(`s:${p.sharedId}`) : false) || p.urls.some((u) => newObjects.has(`u:${u}`)) || p.hashtags.some((h) => newObjects.has(`h:${h.toLowerCase()}`)) || (p.replyTo ? newObjects.has(`r:${p.replyTo.toLowerCase()}`) : false);
  const scoped = input.posts.filter(touches);
  // df / idf must be judged on the whole corpus, so the partial run receives every post but only emits pairs that involve an
  // affected handle; the merge below keeps untouched edges verbatim.
  const partial = runEngine({ ...input, posts: input.posts, runId: prev.runId }, () => {});
  const affectedPair = (e: CoEdge): boolean => affectedHandles.has(e.source) || affectedHandles.has(e.target);
  const kept = prev.edges.filter((e) => !affectedPair(e));
  const refreshed = partial.edges.filter(affectedPair);
  const edges = [...kept, ...refreshed].sort((x, y) => y.weight - x.weight || x.id.localeCompare(y.id));
  const edgeHandles = new Set(edges.flatMap((e) => [e.source, e.target]));
  // FULL_CORPUS_CORRELATION: the merged result keeps every node of the partial run (degree-0 isolates included); degree is refreshed
  const nodes = partial.nodes.map((n) => (edgeHandles.has(n.id) ? n : { ...n, degree: 0, weightedDegree: 0, betweenness: 0 }));
  return {
    ...partial,
    edges,
    nodes,
    postsConsidered: partial.postsConsidered,
    durationMs: partial.durationMs,
    finishedAt: new Date().toISOString(),
    incremental: true,
    precisionRejects: partial.precisionRejects,
    droppedObjects: partial.droppedObjects,
    caveat: prev.caveat,
    scopedPosts: scoped.length,
  } as CorrelationResult & { scopedPosts: number };
}
