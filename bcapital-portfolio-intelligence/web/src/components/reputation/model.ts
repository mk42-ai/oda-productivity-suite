/**
 * Correlation-view pure helpers used by the ported panels — copied VERBATIM from
 * gulf-io-light-workbench/src/views/correlation/model.ts (edgeLookup, shortText, fmtDelta, MODE_PATTERN, UNPROVEN_BANNER).
 */
import type { BadgePattern } from '@/lib/reputation/engine/rilian-types';
import type { CoEdge, CoMode } from '@/lib/reputation/engine/types';
import type { EngineState, FitInfo } from './graph/BubbleGraph';

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

export const UNPROVEN_BANNER = 'Correlation: links show shared sourced facts, not endorsement';

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


/** DEF-022: toolbar label of the isolates toggle — `show isolates (684)` while hidden, `hide isolates (684)` while shown. */
export function isolatesToggleLabel(shown: boolean, count: number): string {
  return `${shown ? 'hide' : 'show'} isolates (${count})`;
}

export function statusText(engine: EngineState, fit: FitInfo | null, renderer: 'unsized' | 'mounted' = 'mounted', note?: string | null): string {
  const suffix = note ? ` · ${note}` : '';
  if (renderer === 'unsized') return 'canvas has no size — enlarge the window or collapse the filters / strip';
  if (engine === 'running') return `engine running…${suffix}`;
  if (!fit) return `layout settled${suffix}`;
  // v4.3 (DEF-006): `fit #n` makes every Fit / Reset change the text even when the duration is the constant 400 ms
  const head = fit.ok ? `fit${fit.seq ? ` #${fit.seq}` : ''}: ${fit.durationMs} ms · layout settled` : `fit skipped: ${fit.reason ?? 'unknown'}`;
  return `${head}${suffix}`;
}

export function edgeEvidenceIds(edge: Pick<CoEdge, 'evidenceIds' | 'shared'>): string[] {
  if (edge.evidenceIds && edge.evidenceIds.length) return edge.evidenceIds;
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (id: string | undefined): void => {
    if (id && !seen.has(id) && out.length < 40) {
      seen.add(id);
      out.push(id);
    }
  };
  for (const s of edge.shared) {
    push(s.evidenceA);
    push(s.evidenceB);
    if (/^(INV-\d{3}\/)?EVID-\d{6}$/.test(s.postA)) push(s.postA);
    if (/^(INV-\d{3}\/)?EVID-\d{6}$/.test(s.postB)) push(s.postB);
  }
  return out;
}
