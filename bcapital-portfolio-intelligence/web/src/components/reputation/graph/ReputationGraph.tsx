'use client';
/**
 * ReputationGraph — the PRIMARY view of /reputation: the ported Rilian interactive correlation canvas (BubbleGraph / CorrelationGraph,
 * react-force-graph-2d/3d + three) over the four subject registers. Data: GET /api/reputation/graph (built offline by
 * scripts/build-reputation-graph.ts with the ported engine). Display filters are the Rilian ones (applyDisplayFilters → isolates
 * toggle, applyMaxAge → MAX AGE slider); node click publishes the subject into the ASK dock, link click opens WHY CONNECTED.
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
  runId: string;
  nowIso: string;
  params: { windowSeconds: number; minWeight: number };
  registers: GraphRegister[];
  nodes: Array<CoNode & GraphNodeMeta>;
  links: CoEdge[];
  communities: Community[];
  modularity: number;
  isolates: number;
  evidence: Record<string, EvidenceRow>;
  stats: { items: number; posts: number; nodes: number; edges: number; isolates: number; hubEdges: number };
}

/** Rilian applyDisplayFilters (isolates toggle) reduced to what the canvas needs (no matrix here). */
function applyIsolates(nodes: CoNode[], edges: CoEdge[], communities: Community[], showIsolates: boolean): { nodes: CoNode[]; communities: Community[]; hidden: number } {
  if (showIsolates) return { nodes, communities, hidden: 0 };
  const hidden = new Set(nodes.filter((n) => n.degree === 0).map((n) => n.id));
  if (!hidden.size) return { nodes, communities, hidden: 0 };
  const keep = (h: string) => !hidden.has(h);
  return { nodes: nodes.filter((n) => keep(n.id)), communities: communities.map((c) => ({ ...c, members: c.members.filter(keep), size: c.members.filter(keep).length })).filter((c) => c.size > 0), hidden: hidden.size };
}

export function ReputationGraph({ onSelectEdge, onStats }: { onSelectEdge?: (edge: CoEdge | null, evidence: Record<string, EvidenceRow>) => void; onStats?: (s: { nodes: number; edges: number; isolates: number; registers: number }) => void }) {
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
    const base = { nodes: iso.nodes, edges: data.links, communities: iso.communities };
    const aged = applyMaxAge(base, maxAgeDays, data.nowIso).display;
    return { runId: data.runId, params: { windowSeconds: data.params.windowSeconds }, nodes: aged.nodes, edges: aged.edges, communities: aged.communities, totalNodes: data.nodes.length, totalEdges: data.links.length, isolates: data.isolates, isolatesHidden: iso.hidden, showIsolates };
  }, [data, showIsolates, maxAgeDays]);

  useEffect(() => {
    if (display && onStats) onStats({ nodes: display.totalNodes, edges: display.totalEdges, isolates: display.isolates, registers: data?.registers.length ?? 0 });
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
      document.getElementById('reputation-ask')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    [data, lookup, setSubject],
  );

  return (
    <EvidenceProvider rows={data?.evidence ?? {}}>
      <section className="card relative min-w-0 overflow-hidden" data-testid="reputation-graph-section" aria-label="Interactive correlation graph" style={{ height: 'clamp(420px, 68vh, 760px)' }}>
        {display ? (
          <CorrelationGraph display={display} selectedEdgeId={selectedEdgeId} onSelectEdge={onSelectEdgeId} onSelectNode={onSelectNode} highlightedCommunity={highlighted} onHighlightCommunity={setHighlighted} watchHandles={data?.registers.map((r) => r.handle) ?? []} meta={meta} registers={data?.registers ?? []} />
        ) : (
          <div className="flex h-full items-center justify-center text-[12px] text-secondary" data-testid="reputation-graph-loading" role="status">
            {error ? `graph unavailable — ${error}` : 'loading the correlation graph…'}
          </div>
        )}
      </section>
    </EvidenceProvider>
  );
}
