/**
 * Correlation view — live MAX AGE edge/node filter (pure, no React).
 *
 * Mirrors model.ts's applyMinWeight in style (pure, filter-then-prune, spread-copy, never mutates
 * its inputs) but filters on the recency of an edge's shared activity instead of its weight, and
 * recomputes degree/weightedDegree on the survivors since dropping edges changes both.
 *
 * `maxAgeLabel` is re-implemented here (not imported from model.ts) to avoid an import cycle.
 * Nothing here asserts coordination: SIMILARITY ≠ COORDINATION — UNPROVEN.
 */
import type { CoEdge, CoNode } from '@/lib/reputation/engine/types';

/** Slider max: at or above this many days (or when the value is null) the filter is a no-op ('all'). */
export const MAX_AGE_ALL = 120;

/** 'all' when null or ≥ MAX_AGE_ALL, else "{days}d" — same semantics as model.ts's maxAgeLabel. */
export function maxAgeLabel(days: number | null): string {
  return days === null || days >= MAX_AGE_ALL ? 'all' : `${days}d`;
}

/**
 * Newest activity on an edge: the max of Date.parse(tsA) and Date.parse(tsB) over every shared
 * item. -Infinity when there are no shared items, or every timestamp on them fails to parse.
 */
export function edgeNewestTs(edge: CoEdge): number {
  let newest = -Infinity;
  for (const s of edge.shared) {
    const a = Date.parse(s.tsA);
    const b = Date.parse(s.tsB);
    if (!Number.isNaN(a) && a > newest) newest = a;
    if (!Number.isNaN(b) && b > newest) newest = b;
  }
  return newest;
}

/** Age (in days) of an edge's newest shared timestamp relative to `nowMs`. Infinity when the edge has no timestamp. */
export function edgeAgeDays(edge: CoEdge, nowMs: number): number {
  return (nowMs - edgeNewestTs(edge)) / 86_400_000;
}

interface MaxAgeResult<T extends { nodes: CoNode[]; edges: CoEdge[] }> {
  display: T;
  droppedEdges: number;
  droppedNodes: number;
  cutoffIso: string | null;
}

/**
 * Apply the slider's max-age instantly (no re-run): drop edges whose newest shared activity is
 * older than the cutoff, prune nodes left with no remaining incident edge, and recompute `degree`
 * (incident edge count) / `weightedDegree` (sum of incident weights) on the survivors. An edge
 * with no shared timestamps is dropped as soon as any max age is set. O(E + N) via Maps;
 * insertion order of `display.nodes`/`display.edges` is preserved.
 *
 * When `maxAgeDays` is null or ≥ MAX_AGE_ALL ('all'), this is a no-op: the SAME `display` object
 * is returned (identity), with no drops and a null cutoff.
 */
export function applyMaxAge<T extends { nodes: CoNode[]; edges: CoEdge[] }>(display: T, maxAgeDays: number | null, nowIso: string): MaxAgeResult<T> {
  if (maxAgeDays === null || maxAgeDays >= MAX_AGE_ALL) {
    return { display, droppedEdges: 0, droppedNodes: 0, cutoffIso: null };
  }
  const cutoff = Date.parse(nowIso) - maxAgeDays * 86_400_000;
  const edges = display.edges.filter((e) => edgeNewestTs(e) >= cutoff);

  const degree = new Map<string, number>();
  const weightedDegree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    weightedDegree.set(e.source, (weightedDegree.get(e.source) ?? 0) + e.weight);
    weightedDegree.set(e.target, (weightedDegree.get(e.target) ?? 0) + e.weight);
  }
  // FULL_CORPUS_CORRELATION: run-level isolates (degree 0 in the result) are never hidden by the age filter
  const nodes = display.nodes.filter((n) => degree.has(n.id) || n.degree === 0).map((n) => ({ ...n, degree: degree.get(n.id) ?? 0, weightedDegree: weightedDegree.get(n.id) ?? 0 }));

  return {
    display: { ...display, nodes, edges } as T,
    droppedEdges: display.edges.length - edges.length,
    droppedNodes: display.nodes.length - nodes.length,
    cutoffIso: new Date(cutoff).toISOString(),
  };
}

/** Edge-age histogram for the slider tooltip: counts of edges newer-than-or-at 7/30/90 days, plus the total. */
export function ageBuckets(edges: CoEdge[], nowIso: string): { d7: number; d30: number; d90: number; all: number } {
  const nowMs = Date.parse(nowIso);
  let d7 = 0;
  let d30 = 0;
  let d90 = 0;
  for (const e of edges) {
    const age = edgeAgeDays(e, nowMs);
    if (age <= 7) d7++;
    if (age <= 30) d30++;
    if (age <= 90) d90++;
  }
  return { d7, d30, d90, all: edges.length };
}
