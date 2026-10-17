/**
 * Correlation-view pure helpers used by the ported panels — copied VERBATIM from
 * gulf-io-light-workbench/src/views/correlation/model.ts (edgeLookup, shortText, fmtDelta, MODE_PATTERN, UNPROVEN_BANNER).
 */
import type { BadgePattern } from '@/lib/reputation/engine/rilian-types';
import type { CoEdge, CoMode } from '@/lib/reputation/engine/types';

/** Edge lookup by unordered pair — the engine's edge id is `${a}|${b}` with a < b. */
export function edgeLookup(edges: CoEdge[]): Map<string, CoEdge> {
  const m = new Map<string, CoEdge>();
  for (const e of edges) {
    m.set(`${e.source}|${e.target}`, e);
    m.set(`${e.target}|${e.source}`, e);
  }
  return m;
}

export function shortText(s: string, n = 28): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export function fmtDelta(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

export const UNPROVEN_BANNER = 'Coordination: UNPROVEN — links show co-action, not intent';

/** DEF-024 (label only, the node id stays the raw handle): URL-string handles lose their scheme / `www.` / trailing slash. */
export function nodeLabel(handle: string): string {
  return /^https?:\/\//i.test(handle) ? handle.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '') : handle;
}

export const MODE_PATTERN: Record<CoMode, BadgePattern> = {
  'co-share': 'solid',
  'co-link': 'dashed',
  'co-hashtag': 'dotted',
  'co-reply': 'double',
  'co-text': 'hatched',
};

