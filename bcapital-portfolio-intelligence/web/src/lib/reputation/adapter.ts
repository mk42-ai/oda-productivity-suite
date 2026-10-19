/**
 * Reputation & Prestige adapter — turns the four entities' sourced factors into the Rilian engine's `EngineInput` and runs the
 * ported engine UNCHANGED (src/lib/reputation/engine/engine.ts). The math is the Rilian math: co-occurrence inside a time window,
 * distinct-pair dedup, syndication share, `edgeWeight()` (log-scaled pairs × specificity × precision ÷ (1 + syndication)),
 * Louvain communities and Brandes betweenness. Only the mapping from "factor" to "post" lives here:
 *
 *   factor.sharedObject   → Post.sharedId    (co-share)
 *   factor.sourceUrl      → Post.urls        (co-link)
 *   factor.tags           → Post.hashtags    (co-hashtag)
 *   factor.relatedEntity  → Post.replyTo     (co-reply — the related entity's handle)
 *   title + detail        → Post.text        (co-text, MinHash)
 *   factor.sourceDate     → Post.ts          (date precision — the engine's same-day mode, cap 0.1, applies exactly as in Rilian)
 *
 * Window default: 24 h presets are Rilian's; reputation facts are dated to the day, so the default run uses the largest Rilian
 * preset window (86 400 s) — every factor pair on the same source date is a same-day pair, weighted by the engine's precision factor.
 */
import { runEngine } from './engine/engine';
import { DEFAULT_PARAMS, type CorrelationParams, type CorrelationResult, type EngineInput } from './engine/types';
import type { Post } from './engine/rilian-types';
import { ENTITIES } from './data/entities';
import type { ReputationEntity, ReputationFactor } from './data/types';

export const REPUTATION_WINDOW_SECONDS = 86_400;
export const REPUTATION_RUN_ID = 'REP-001';
/** Fixed "now" for the max-age filter — the engine's reference clock (today's date at the time of the port). */
export const REPUTATION_NOW_ISO = '2026-10-17T00:00:00.000Z';

export function factorToPost(entity: ReputationEntity, f: ReputationFactor): Post {
  const related = f.relatedEntity ? ENTITIES.find((e) => e.id === f.relatedEntity) : undefined;
  return {
    id: `${entity.id}/${f.id}`,
    handle: entity.handle,
    platform: 'web',
    ts: `${f.sourceDate}T00:00:00Z`,
    tsPrecision: 'date',
    text: `${f.title}. ${f.detail}`,
    urls: [f.sourceUrl],
    hashtags: f.tags.map((t) => t.toLowerCase()),
    sharedId: f.sharedObject ? f.sharedObject.toLowerCase() : null,
    replyTo: related ? related.handle.toLowerCase() : null,
    narrativeId: f.category,
    networkId: entity.kind === 'firm' ? 'FIRM' : 'LEADERSHIP',
    templateId: null,
    synthetic: false,
    evidenceId: `${entity.id}/${f.id}`,
  };
}

export function buildReputationInput(params: Partial<CorrelationParams> = {}): EngineInput {
  const posts: Post[] = [];
  for (const e of ENTITIES) for (const f of e.factors) posts.push(factorToPost(e, f));
  return {
    posts,
    accounts: ENTITIES.map((e) => ({ handle: e.handle, platform: 'web' as const, networkId: e.kind === 'firm' ? 'FIRM' : 'LEADERSHIP', historical: false, synthetic: false, evidenceCount: e.factors.length })),
    historicalNetworkIds: [],
    params: { ...DEFAULT_PARAMS, windowSeconds: REPUTATION_WINDOW_SECONDS, minWeight: 0.01, keepIsolates: true, ...params },
    runId: REPUTATION_RUN_ID,
    nowIso: REPUTATION_NOW_ISO,
    investigationId: null,
  };
}

let cached: CorrelationResult | null = null;
/** Deterministic run over the bundled factors (memoised — the same input always yields the same result). */
export function runReputationEngine(params?: Partial<CorrelationParams>): CorrelationResult {
  if (!params && cached) return cached;
  const result = runEngine(buildReputationInput(params), () => undefined);
  if (!params) cached = result;
  return result;
}

/** Evidence lookup for the ported context builders: `<entity>/<factor>` → factor summary. */
export function factorLookup(id: string): { id: string; title: string; excerpt?: string | null; claimStatus?: string | null; reliability?: string | null; source?: string | null; publishedAt?: string | null } | undefined {
  const [eid, fid] = id.split('/');
  const e = ENTITIES.find((x) => x.id === eid);
  const f = e?.factors.find((x) => x.id === fid);
  if (!e || !f) return undefined;
  return { id, title: `${e.name} — ${f.title}`, excerpt: f.detail, claimStatus: f.verified ? 'VERIFIED' : 'NOT VERIFIED', reliability: f.riskFlag ? 'risk flag' : null, source: `${f.sourceName} · ${f.sourceUrl}`, publishedAt: f.sourceDate };
}
