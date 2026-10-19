'use client';
/**
 * ReputationGraph — the PRIMARY view of /reputation: the ported Rilian interactive correlation canvas (BubbleGraph / CorrelationGraph,
 * react-force-graph-2d/3d + three) over the four BCAP registers. Data: GET /api/reputation/graph — the 2026-10-18 evidence corpus
 * (web/data/reputation/graph.json + evidence.json, built offline by scripts/build-reputation-graph-v3.ts with the ported engine and adapted
 * by lib/reputation/corpus.ts) — lazy-loaded after first paint behind a skeleton (the payload is ~1.5 MB gzipped; it never ships in a bundle).
 * Display filters are the Rilian ones (applyMinWeight display threshold, applyDisplayFilters → isolates toggle, applyMaxAge → MAX AGE
 * slider shared with the Evidence table through useGraphPrefs); node click publishes the subject into the ASK dock, link click opens
 * WHY CONNECTED. The section exposes data-source / data-nodes / data-edges / data-isolates for the e2e suite.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CoEdge, CoNode, Community } from '@/lib/reputation/engine/types';
import { useAskDock } from '@/lib/reputation/ondemand/askDock';
import { buildEdgeContext, buildNodeContext, contextToMetadata } from '@/lib/reputation/ondemand/context';
import { EDGE_PRESETS, NODE_PRESETS } from '@/lib/reputation/ondemand/prompts';
import { CorrelationGraph, type GraphDisplay, type GraphNodeMeta, type GraphRegister } from './CorrelationGraph';
import { EvidenceProvider, REPUTATION_INVESTIGATION, type EvidenceRow } from './evidence-context';
import { useGraphPrefs } from './graphPrefs';
import { applyMaxAge } from './maxAge';
import { edgeEvidenceIds } from '../model';

export interface GraphPayload {
  source: string;
  evidenceSource: string;
  runId: string;
  generatedAt: string;
  nowIso: string;
  weightFormula: string;
  params: { windowSeconds: number; minWeight: number };
  registers: Array<GraphRegister & { edges: number; isolates: number; target: number }>;
  nodes: Array<CoNode & GraphNodeMeta & { glyph?: string; registers?: string[]; firstSeen?: string | null; lastSeen?: string | null; isolate?: boolean }>;
  links: CoEdge[];
  communities: Community[];
  modularity: number;
  isolates: number;
  evidence: Record<string, EvidenceRow>;
  stats: { items: number; posts: number; nodes: number; edges: number; isolates: number; hubEdges: number; memberNodes: number; edgeTypes: Record<string, number>; nodeKinds: Record<string, number> };
}
export type GraphStats = { nodes: number; edges: number; isolates: number; registers: number; items: number; source: string; perRegister: Array<{ id: string; name: string; items: number; target: number; nodes: number; edges: number; isolates: number }> };

/** Display threshold for the canvas (edges below it are not drawn; totals and the Connections drawer still carry them). 0.2 keeps ≈2,300 of the 7,800 corpus edges. */
export const DISPLAY_MIN_WEIGHT = 0.2;
/** Rilian applyMinWeight (views/correlation/model.ts) reduced to nodes / edges / communities — pure, never mutates its inputs. */
function applyMinWeight(nodes: CoNode[], edges: CoEdge[], communities: Community[], minWeight: number): { nodes: CoNode[]; edges: CoEdge[]; communities: Community[] } {
  const threshold = Math.max(minWeight, 0);
  const kept = edges.filter((e) => e.weight >= threshold);
  if (kept.length === edges.length) return { nodes, edges, communities };
  const keep = new Set<string>();
  for (const e of kept) { keep.add(e.source); keep.add(e.target); }
  for (const n of nodes) if (n.degree === 0) keep.add(n.id);
  const degree = new Map<string, number>(); const wdeg = new Map<string, number>();
  for (const e of kept) { degree.set(e.source, (degree.get(e.source) ?? 0) + 1); degree.set(e.target, (degree.get(e.target) ?? 0) + 1); wdeg.set(e.source, (wdeg.get(e.source) ?? 0) + e.weight); wdeg.set(e.target, (wdeg.get(e.target) ?? 0) + e.weight); }
  const outNodes = nodes.filter((n) => keep.has(n.id)).map((n) => (n.degree === 0 ? n : { ...n, degree: degree.get(n.id) ?? 0, weightedDegree: wdeg.get(n.id) ?? 0 }));
  const outCommunities = communities.map((c) => ({ ...c, members: c.members.filter((m) => keep.has(m)), size: c.members.filter((m) => keep.has(m)).length })).filter((c) => c.size > 0);
  return { nodes: outNodes, edges: kept, communities: outCommunities };
}

/** Rilian applyDisplayFilters (isolates toggle) reduced to what the canvas needs (no matrix here). */
function applyIsolates(nodes: CoNode[], edges: CoEdge[], communities: Community[], showIsolates: boolean): { nodes: CoNode[]; communities: Community[]; hidden: number } {
  if (showIsolates) return { nodes, communities, hidden: 0 };
  const hidden = new Set(nodes.filter((n) => n.degree === 0).map((n) => n.id));
  if (!hidden.size) return { nodes, communities, hidden: 0 };
  const keep = (h: string) => !hidden.has(h);
  return { nodes: nodes.filter((n) => keep(n.id)), communities: communities.map((c) => ({ ...c, members: c.members.filter(keep), size: c.members.filter(keep).length })).filter((c) => c.size > 0), hidden: hidden.size };
}

export function ReputationGraph({ onSelectEdge, onStats, onSelectNode: onSelectNodeExternal }: { onSelectEdge?: (edge: CoEdge | null, evidence: Record<string, EvidenceRow>) => void; onStats?: (s: GraphStats) => void; /** node click → the host scrolls the matching entity card into view (subject hubs) */ onSelectNode?: (node: { id: string; register: string; hub: boolean; name?: string; label: string }) => void }) {
  const [data, setData] = useState<GraphPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const maxAgeDays = useGraphPrefs((s) => s.maxAgeDays);
  const showIsolates = useGraphPrefs((s) => s.showIsolates);
  const setSubject = useAskDock((s) => s.setSubject);

  useEffect(() => {
    const ctl = new AbortController();
    fetch('/api/reputation/graph', { signal: ctl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as GraphPayload;
      })
      .then((d) => setData(d))
      .catch((e: unknown) => {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      });
    return () => ctl.abort();
  }, []);

  const meta = useMemo(() => {
    const out: Record<string, GraphNodeMeta> = {};
    for (const n of data?.nodes ?? []) out[n.id] = { label: n.label, kind: n.kind, register: n.register, name: n.name, photo: n.photo, role: n.role, hub: n.hub, evidenceIds: n.evidenceIds };
    return out;
  }, [data]);

  const display = useMemo<GraphDisplay | null>(() => {
    if (!data) return null;
    const iso = applyIsolates(data.nodes, data.links, data.communities, showIsolates);
    // Rilian's live min-weight display filter: the v3 corpus carries 7,800 edges, far more than a canvas can animate smoothly, so edges under
    // DISPLAY_MIN_WEIGHT are not drawn (they stay in the totals and reach WHY CONNECTED through the Connections drawer). Nodes whose every
    // edge fell under the threshold hide; run-level isolates (degree 0) stay for the Show-isolates toggle.
    const strong = applyMinWeight(iso.nodes, data.links, iso.communities, DISPLAY_MIN_WEIGHT);
    const base = { nodes: strong.nodes, edges: strong.edges, communities: strong.communities };
    const aged = applyMaxAge(base, maxAgeDays, data.nowIso).display;
    return { runId: data.runId, params: { windowSeconds: data.params.windowSeconds }, nodes: aged.nodes, edges: aged.edges, communities: aged.communities, totalNodes: data.nodes.length, totalEdges: data.links.length, isolates: data.isolates, isolatesHidden: iso.hidden, showIsolates };
  }, [data, showIsolates, maxAgeDays]);

  useEffect(() => {
    if (display && data && onStats) onStats({ nodes: display.totalNodes, edges: display.totalEdges, isolates: display.isolates, registers: data.registers.length, items: data.stats.items, source: data.source, perRegister: data.registers.map((r) => ({ id: r.id, name: r.name, items: r.items, target: r.target, nodes: r.nodes, edges: r.edges, isolates: r.isolates })) });
  }, [display, data, onStats]);

  const lookup = useCallback((id: string) => data?.evidence[id], [data]);
  const edgeById = useMemo(() => new Map((data?.links ?? []).map((e) => [e.id, e])), [data]);

  const onSelectEdgeId = useCallback(
    (id: string) => {
      setSelectedEdgeId(id);
      const e = edgeById.get(id) ?? null;
      onSelectEdge?.(e, data?.evidence ?? {});
      if (!e || !data) return;
      const context = buildEdgeContext({ source: e.source, target: e.target, mode: 'graph', weight: e.weight, windowSeconds: data.params.windowSeconds, count: e.count, byMode: e.byMode, minDelta: e.minDelta, evidenceIds: edgeEvidenceIds(e), investigation: REPUTATION_INVESTIGATION, runLabel: data.runId }, (x) => { const r = lookup(x); return r ? { id: x, title: r.title, excerpt: r.excerpt, source: r.source, publishedAt: r.publishedAt } : undefined; });
      setSubject({ scope: 'edge', subjectKey: e.id, title: `${meta[e.source]?.name ?? e.source} × ${meta[e.target]?.name ?? e.target} · graph`, investigationId: REPUTATION_INVESTIGATION.id, context, presets: EDGE_PRESETS, contextMetadata: contextToMetadata(context, 'edge'), placeholder: 'quick query on this link…' });
    },
    [edgeById, onSelectEdge, data, lookup, setSubject, meta],
  );
  const onSelectNode = useCallback(
    (handle: string) => {
      if (!data) return;
      const n = data.nodes.find((x) => x.id === handle);
      if (!n) return;
      const reg = data.registers.find((r) => r.id === n.register);
      const context = buildNodeContext({ handle: n.hub ? n.name ?? handle : handle, platform: n.platform, networkId: reg ? `${reg.name} register` : n.networkId, role: n.hub ? n.role ?? null : `${n.kind} · ${n.evidenceCount} items`, evidenceIds: (n.evidenceIds ?? []).slice(0, 24), investigation: REPUTATION_INVESTIGATION }, (x) => { const r = lookup(x); return r ? { id: x, title: r.title, excerpt: r.excerpt, source: r.source, publishedAt: r.publishedAt } : undefined; });
      setSubject({ scope: 'node', subjectKey: handle, title: n.hub ? `${n.name} · ${n.role ?? ''}`.trim() : `${n.label} · ${n.kind} · ${reg?.name ?? ''}`.trim(), investigationId: REPUTATION_INVESTIGATION.id, context, presets: NODE_PRESETS, contextMetadata: contextToMetadata(context, 'node'), placeholder: `quick query on ${n.name ?? n.label}…` });
      // node click → entity card (the host highlights + scrolls the register's card) AND the ASK · OnDemand subject above
      onSelectNodeExternal?.({ id: n.id, register: n.register, hub: !!n.hub, name: n.name, label: n.label });
      if (!n.hub) document.getElementById('reputation-ask')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    [data, lookup, setSubject, onSelectNodeExternal],
  );

  return (
    <EvidenceProvider rows={data?.evidence ?? {}}>
      <section className="card relative min-w-0 overflow-hidden" data-testid="reputation-graph-section" aria-label="Interactive correlation graph" style={{ height: 'clamp(420px, 68vh, 760px)' }} data-source={data?.source ?? ''} data-evidence-source={data?.evidenceSource ?? ''} data-run={data?.runId ?? ''} data-nodes={data?.stats.nodes ?? 0} data-edges={data?.stats.edges ?? 0} data-isolates={data?.stats.isolates ?? 0} data-items={data?.stats.items ?? 0} data-registers={data?.registers.map((r) => r.id).join(',') ?? ''}>
        {display ? (
          <CorrelationGraph display={display} selectedEdgeId={selectedEdgeId} onSelectEdge={onSelectEdgeId} onSelectNode={onSelectNode} highlightedCommunity={highlighted} onHighlightCommunity={setHighlighted} watchHandles={data?.registers.map((r) => r.handle) ?? []} meta={meta} registers={data?.registers ?? []} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-[12px] text-secondary" data-testid="reputation-graph-loading" role="status" aria-busy={!error}>
            {/* skeleton while the corpus graph streams in after first paint */}
            {!error && <div className="rep-graph-skeleton" aria-hidden><span /><span /><span /><span /><span /></div>}
            {error ? `graph unavailable — ${error}` : 'loading the correlation graph (7,736-item corpus)…'}
          </div>
        )}
      </section>
    </EvidenceProvider>
  );
}
