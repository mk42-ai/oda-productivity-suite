/**
 * Coordination-detection engine — public types.
 *
 * Method lineage: a TypeScript port innovated on top of the open-source
 *  - QUT Digital Observatory "Coordination Network Toolkit" (co-retweet / co-link / co-hashtag /
 *    co-reply / co-similar-tweet networks inside a time window, weighted by co-occurrence count), and
 *  - CooRTweet (R): co-share detection with min_participation / time_window parameters and
 *    community detection on the resulting weighted graph.
 * Innovations here: multi-modal edges in one pass, activity-normalised weights, MinHash text
 * co-similarity, an explainable "WHY CONNECTED" trail per edge, and a Web Worker execution model.
 *
 * Rendering is done by Cytoscape.js (MIT). NOTHING here ever asserts coordination: the output is
 * co-occurrence structure — SIMILARITY ≠ COORDINATION — UNPROVEN.
 */
import type { Platform, Post } from './rilian-types';

export type CoMode = 'co-share' | 'co-link' | 'co-hashtag' | 'co-reply' | 'co-text';
export const CO_MODES: CoMode[] = ['co-share', 'co-link', 'co-hashtag', 'co-reply', 'co-text'];

/** Preset windows (seconds). */
export const WINDOW_PRESETS: Array<{ label: string; seconds: number }> = [
  { label: '60s', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '1h', seconds: 3600 },
  { label: '24h', seconds: 86400 },
];

export interface CorrelationParams {
  modes: CoMode[];
  windowSeconds: number; // 60 | 300 | 3600 | 86400 (default 60)
  minWeight: number; // threshold on normalised weight (0..1)
  minCoOccurrences: number; // raw co-occurrence count threshold (CooRTweet min_participation analogue)
  textThreshold: number; // MinHash estimated Jaccard ≥ threshold (default 0.6)
  includeHistorical: boolean; // NET-004 is excluded by default and cannot be included (always false)
  /** FULL_CORPUS_CORRELATION: keep accounts without a surviving edge as degree-0 nodes (default true; false = explicit opt-out). */
  keepIsolates?: boolean;
  platforms: Platform[] | null; // null = all
  networks: string[] | null; // filter accounts by network id (null = all)
  narratives: string[] | null;
  handles: string[] | null; // restrict to these accounts
  resolution: number; // Louvain resolution (default 1)
  maxAgeDays: number | null; // only posts newer than (now − maxAgeDays) are considered; null = all
  seed: number;
}

export const DEFAULT_PARAMS: CorrelationParams = {
  modes: [...CO_MODES],
  windowSeconds: 60,
  minWeight: 0.05,
  minCoOccurrences: 1,
  textThreshold: 0.6,
  includeHistorical: false,
  platforms: null,
  networks: null,
  narratives: null,
  handles: null,
  resolution: 1,
  maxAgeDays: null,
  seed: 20260912,
};

/** One shared object that put two accounts in the same window. */
export interface SharedObject {
  mode: CoMode;
  object: string; // shared id / url / hashtag / reply target / text-signature
  postA: string; // post id of account A
  postB: string; // post id of account B
  tsA: string;
  tsB: string;
  deltaSeconds: number; // |tsA - tsB|
  similarity?: number; // estimated Jaccard for co-text
  /** v5.2: idf of the object over the posts in scope and the precision factor applied (fix B). */
  idf?: number;
  precisionFactor?: number;
  /** v5.2: both rows were date-only → labelled same-day mode, never co-action (fix A). */
  sameDay?: boolean;
  /** DEF-019: the evidence reference of each post (`<INV-ID>/EVID-nnnnnn`, or the documented `post:` fallback when the post has no evidenceId). */
  evidenceA?: string;
  evidenceB?: string;
  /** DEF-020: this post pair is a syndicated / wire copy (identical normalised title or text, or the same canonical URL path, inside the window). */
  syndicated?: boolean;
}

export interface CoEdge {
  id: string;
  source: string; // handle
  target: string; // handle
  /** DEF-021: discriminating score 0..1 — see `edgeWeight` in objects.ts (distinct post pairs × specificity × precision, halved by syndication). */
  weight: number;
  /** DEF-020: dedup-adjusted co-occurrences = DISTINCT post pairs (one republished article that fires co-share AND co-text is ONE co-occurrence). */
  count: number;
  byMode: Partial<Record<CoMode, number>>;
  minDelta: number; // fastest co-occurrence (seconds)
  shared: SharedObject[]; // the explainable WHY CONNECTED trail (capped at 40)
  /** v5.2: every shared object came from date-only rows → weight capped at SAME_DAY_WEIGHT_CAP and 'not scored: date-only timestamps' in WHY CONNECTED. */
  sameDay?: boolean;
  /** DEF-020: raw co-occurrence EVENTS (the pre-dedup `count`: every mode hit counted separately). Optional: external (OnDemand-parsed) runs do not carry it. */
  rawCount?: number;
  /** DEF-020: distinct post pairs flagged as syndication, their share of `count`, and the edge-level verdict (share ≥ 0.5). */
  syndicatedPairs?: number;
  syndicationShare?: number;
  syndicated?: boolean;
  /** DEF-019: the EVID trail of THIS run's corpus — unique, ordered by Δt, ≤ 40 — aggregated from `shared[].evidenceA/B` (invariant: ≥ 2 whenever count > 0). */
  evidenceIds?: string[];
}

/** v5.2 (fix A): a pair the scorer refused because the timestamps cannot resolve the window. */
export interface PrecisionReject {
  reason: 'precision_insufficient';
  source: string;
  target: string;
  evidA: string | null;
  evidB: string | null;
  precisionA: string;
  precisionB: string;
  mode: CoMode;
  object: string;
  windowSeconds: number;
}

export interface CoNode {
  id: string; // handle
  activity: number; // posts considered
  platform: Platform;
  networkId: string | null;
  synthetic: boolean;
  evidenceCount: number; // EVID rows citing the account (drives bubble size)
  community: number; // community index (0..)
  degree: number;
  weightedDegree: number;
  betweenness: number; // normalised 0..1
}

export interface Community {
  index: number;
  members: string[];
  size: number;
  internalWeight: number;
  dominantNetworkId: string | null;
  dominantPlatform: Platform;
  topObjects: Array<{ mode: CoMode; object: string; count: number }>;
  caveat: string; // always "SIMILARITY ≠ COORDINATION — UNPROVEN"
}

export interface MatrixData {
  handles: string[]; // ordered by community
  communities: number[];
  values: number[][]; // normalised weights
}

export interface CorrelationResult {
  runId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  params: CorrelationParams;
  postsConsidered: number;
  nodes: CoNode[];
  edges: CoEdge[];
  communities: Community[];
  modularity: number;
  matrix: MatrixData;
  excluded: { historicalNetworks: string[]; historicalAccounts: number };
  caveat: string;
  /** v5.2: pairs refused for precision (fix A) and objects dropped as generic / stoplisted / off-topic (fix B). */
  precisionRejects?: PrecisionReject[];
  droppedObjects?: Array<{ mode: CoMode; object: string; df: number; reason: 'generic' | 'stoplist' | 'off-topic' }>;
  /** v5.2 (fix C): true when the result was produced by an incremental merge rather than a full run. */
  incremental?: boolean;
  /** FULL_CORPUS_CORRELATION: degree-0 accounts kept in the result / accounts with ≥ 1 considered post. */
  isolates?: number;
  accountsConsidered?: number;
  /** DEF-019: edges emitted with count > 0 but fewer than 2 evidence refs — always 0 by construction; tests assert it. */
  trailInvariantViolations?: number;
}

export interface RunRecord {
  runId: string;
  label: string; // "Run 1"
  startedAt: string;
  durationMs: number;
  params: CorrelationParams;
  nodeCount: number;
  edgeCount: number;
  communityCount: number;
  modularity: number;
  postsConsidered: number;
}

export interface EngineInput {
  posts: Post[];
  accounts: Array<{ handle: string; platform: Platform; networkId: string | null; historical: boolean; synthetic: boolean; evidenceCount: number }>;
  historicalNetworkIds: string[];
  params: CorrelationParams;
  runId: string;
  nowIso: string; // reference "now" for the max-age filter (the investigation's last run)
  /** v5.2: investigation id selects the object stoplist (fix B). */
  investigationId?: string | null;
}

export type WorkerRequest = { type: 'run'; input: EngineInput } | { type: 'cancel' };
export type WorkerResponse =
  | { type: 'progress'; runId: string; stage: string; pct: number }
  | { type: 'result'; runId: string; result: CorrelationResult }
  | { type: 'error'; runId: string; message: string };

export const CAVEAT = 'SIMILARITY ≠ COORDINATION — UNPROVEN';
