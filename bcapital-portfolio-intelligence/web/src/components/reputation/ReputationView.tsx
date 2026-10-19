'use client';
/**
 * Reputation & Prestige — client view. Hosts the ported correlation-engine panels (Communities, Centrality, MatrixHeatmap — verbatim) over the
 * engine result computed on the server (adapter.ts → engine.ts), the four entity cards (factor tables with source links), the
 * WHY CONNECTED edge facts and the ASK · OnDemand quick-chat dock. Clicking a card publishes that entity's on-screen context as the
 * ASK subject (buildNodeContext, contextToMetadata — Rilian context.ts, verbatim); clicking an edge publishes the edge context.
 */
import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, ExternalLink, AlertTriangle } from 'lucide-react';
import type { CorrelationResult, CoEdge } from '@/lib/reputation/engine/types';
import type { ReputationEntity } from '@/lib/reputation/data/types';
import { FACTOR_CATEGORY_LABEL } from '@/lib/reputation/data/types';
import { buildEdgeContext, buildNodeContext, contextToMetadata } from '@/lib/reputation/ondemand/context';
import { EDGE_PRESETS } from '@/lib/reputation/ondemand/prompts';
import { useAskDock } from '@/lib/reputation/ondemand/askDock';
import { Communities } from './Communities';
import { Centrality } from './Centrality';
import { MatrixHeatmap } from './MatrixHeatmap';
import { Badge, cx } from './rilian-ui';
import { MODE_PATTERN, UNPROVEN_BANNER, edgeLookup, fmtDelta } from './model';
import { ReputationAskPanel } from './ReputationAskPanel';
import type { Plates } from '@/lib/reputation/assets';
import { BatchSummary, EvidenceExplorer, type BatchSummaryData } from './BatchPanels';
import type { GraphStats } from './graph/ReputationGraph';
import dynamic from 'next/dynamic';
const ReputationGraph = dynamic(() => import('./graph/ReputationGraph').then((m) => m.ReputationGraph), { ssr: false, loading: () => <div className="card flex min-w-0 items-center justify-center text-[12px] text-secondary" style={{ height: 'clamp(420px, 68vh, 760px)' }} role="status">loading the correlation graph…</div> });
import './reputation.css';

type FactorLookup = Record<string, { id: string; title: string; excerpt?: string | null; claimStatus?: string | null; reliability?: string | null; source?: string | null; publishedAt?: string | null }>;

const INVESTIGATION = { id: 'BCAP-REP', cycle: 1, baseline: '2026-10-17' };

function entityPrompts(e: ReputationEntity) {
  return e.starterPrompts.map((q, i) => ({ id: `starter-${i}`, label: q.length > 44 ? `${q.slice(0, 43)}…` : q, question: q }));
}

export function EntityCard({ entity, node, onAsk, active, plate }: { entity: ReputationEntity; node: CorrelationResult['nodes'][number] | undefined; onAsk: (e: ReputationEntity) => void; active: boolean; plate?: string }) {
  const [open, setOpen] = useState(false);
  const risks = entity.factors.filter((f) => f.riskFlag).length;
  return (
    <article className={cx('card relative overflow-hidden', active && 'border-ink is-subject')} data-testid="entity-card" data-entity={entity.id} data-kind={entity.kind} aria-label={entity.name}>
      {/* Plate band: firm card → 3Ha2Gnbdlt backdrop with the B Capital logo; leadership → kmAXRIzvSH with the real headshot inside the plate's empty ring. Clicking loads this entity as the quick-chat subject. */}
      <button type="button" className={cx('rep-plate', entity.kind === 'firm' ? 'rep-plate--firm' : 'rep-plate--leader')} style={plate ? { backgroundImage: `url(${plate})` } : undefined} data-testid="entity-plate" data-plate={plate} onClick={() => onAsk(entity)} aria-label={`Ask about ${entity.name}`}>
        {/* Real photo only — never generated or altered; source URL recorded in entity.photo.sourceUrl */}
        <img src={entity.photo.src} alt={entity.photo.alt} width={entity.kind === 'firm' ? 220 : 120} height={entity.kind === 'firm' ? 48 : 150} className={cx('rep-entity-photo', entity.kind === 'firm' ? 'rep-entity-photo--firm' : 'rep-entity-photo--ring')} data-testid="entity-photo" data-source={entity.photo.sourceUrl} loading="eager" decoding="async" />
      </button>
      <div className="relative flex gap-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink" data-testid="entity-name">{entity.name}</h2>
            <span className="mono text-[11px] text-tertiary">{entity.handle}</span>
            {node && <Badge pattern="solid" title="Louvain community">C{node.community + 1}</Badge>}
            {risks > 0 && <Badge pattern="dashed" className="rep-risk" title="risk / controversy flags"><AlertTriangle className="h-3 w-3" /> {risks} flag{risks > 1 ? 's' : ''}</Badge>}
          </div>
          <div className="text-[12px] text-secondary">{entity.role} · {entity.location}</div>
          <p className="mt-1 text-[12px] font-medium text-ink" data-testid="entity-headline">{entity.headline}</p>
          {node && (
            <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]" data-testid="entity-scores">
              <div><dt className="label-xs">degree</dt><dd className="mono text-ink">{node.degree}</dd></div>
              <div><dt className="label-xs">weighted degree</dt><dd className="mono text-ink">{node.weightedDegree.toFixed(3)}</dd></div>
              <div><dt className="label-xs">betweenness</dt><dd className="mono text-ink">{node.betweenness.toFixed(3)}</dd></div>
            </dl>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => onAsk(entity)} data-testid="entity-ask"><MessageSquare className="h-3 w-3" /> Ask about {entity.kind === 'firm' ? 'the firm' : entity.name.split(' ')[0]}</button>
            <button type="button" className="btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} data-testid="entity-toggle-factors">{open ? 'Hide' : 'Show'} {entity.factors.length} factors</button>
            {entity.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="btn" data-testid="entity-link">{l.label} <ExternalLink className="h-3 w-3" /></a>
            ))}
          </div>
        </div>
      </div>
      <div className="relative border-t border-hairline px-4 py-3 text-[12px] text-ink" data-testid="entity-narrative">
        {entity.narrative.map((p, i) => (
          <p key={i} className={cx(i > 0 && 'mt-2')}>{p}</p>
        ))}
      </div>
      <div className={cx('relative border-t border-hairline', !open && 'hidden md:block')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left" data-testid="factor-table">
            <caption className="sr-only">Sourced factors for {entity.name}</caption>
            <thead>
              <tr><th className="table-th">Factor</th><th className="table-th">Category</th><th className="table-th">Fact</th><th className="table-th">Source</th><th className="table-th">Date</th></tr>
            </thead>
            <tbody>
              {(open ? entity.factors : entity.factors.slice(0, 6)).map((f) => (
                <tr key={f.id} className={cx('rep-factor-row row-hover', f.riskFlag && 'rep-risk')} data-testid="factor-row" data-verified={f.verified ? 'true' : 'false'}>
                  <td className="table-td mono">{f.id}</td>
                  <td className="table-td">{FACTOR_CATEGORY_LABEL[f.category]}{!f.verified && <Badge pattern="dotted" className="ml-1">not verified</Badge>}{f.riskFlag && <Badge pattern="dashed" className="ml-1 rep-risk">risk</Badge>}</td>
                  <td className="table-td !whitespace-normal" title={f.detail}>{f.title}</td>
                  <td className="table-td"><a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" data-testid="factor-source">{f.sourceName}</a></td>
                  <td className="table-td mono">{f.sourceDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!open && entity.factors.length > 6 && <div className="px-4 py-2 text-[11px] text-secondary">{entity.factors.length - 6} more factors — <button type="button" className="underline" onClick={() => setOpen(true)}>show all</button></div>}
      </div>
    </article>
  );
}

function WhyConnected({ edge, lookup, onAsk }: { edge: CoEdge | null; lookup: FactorLookup; onAsk: (edge: CoEdge) => void }) {
  if (!edge) return <div className="card p-4 text-[12px] text-secondary" data-testid="why-connected-empty">Click a matrix cell to open WHY CONNECTED for that pair.</div>;
  const byMode = Object.entries(edge.byMode).filter(([, c]) => (c ?? 0) > 0);
  const evidence = edge.evidenceIds ?? [];
  return (
    <div className="card p-4" data-testid="why-connected-panel">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold text-ink">WHY CONNECTED</span>
        <span className="mono text-[11px] text-secondary">{edge.source} × {edge.target}</span>
        <Badge pattern="dashed" className="badge-unproven" title={UNPROVEN_BANNER}>CORRELATION ONLY</Badge>
        {edge.syndicated && <Badge pattern="hatched">syndicated</Badge>}
        <button type="button" className="btn ml-auto" onClick={() => onAsk(edge)} data-testid="edge-ask"><MessageSquare className="h-3 w-3" /> Ask about this link</button>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
        <div><dt className="label-xs">weight</dt><dd className="mono text-ink">{edge.weight.toFixed(3)}</dd></div>
        <div><dt className="label-xs">co-occurrences</dt><dd className="mono text-ink">{edge.count}{edge.rawCount != null && edge.rawCount !== edge.count ? ` (${edge.rawCount} events)` : ''}</dd></div>
        <div><dt className="label-xs">min Δt</dt><dd className="mono text-ink">{fmtDelta(edge.minDelta)}</dd></div>
        <div><dt className="label-xs">syndication share</dt><dd className="mono text-ink">{((edge.syndicationShare ?? 0) * 100).toFixed(0)}%</dd></div>
      </dl>
      <div className="mt-2 flex flex-wrap gap-1">{byMode.map(([m, c]) => <Badge key={m} pattern={MODE_PATTERN[m as keyof typeof MODE_PATTERN]}>{m} {c}</Badge>)}</div>
      <div className="mt-2 text-[11px] text-secondary">Evidence trail ({evidence.length}):</div>
      <ul className="mt-1 max-h-48 overflow-auto text-[11px]" data-testid="why-connected-trail">
        {evidence.slice(0, 40).map((id) => (
          <li key={id} className="flex gap-2 border-b border-hairline py-1 last:border-b-0"><span className="mono shrink-0 text-tertiary">{id}</span><span className="text-ink">{lookup[id]?.title ?? id}</span></li>
        ))}
      </ul>
      <div className="mt-2 text-[11px] text-secondary">Shared objects (first 8):</div>
      <ul className="mt-1 text-[11px]">
        {edge.shared.slice(0, 8).map((s, i) => (
          <li key={i} className="flex flex-wrap gap-2 py-0.5"><Badge pattern={MODE_PATTERN[s.mode]}>{s.mode}</Badge><span className="text-ink">{s.object}</span><span className="mono text-tertiary">Δt {fmtDelta(s.deltaSeconds)}</span></li>
        ))}
      </ul>
    </div>
  );
}

export function ReputationView({ entities, result, lookup, plates, batch, categories }: { entities: ReputationEntity[]; result: CorrelationResult; lookup: FactorLookup; plates: Plates; batch?: BatchSummaryData; categories?: string[] }) {
  const setSubject = useAskDock((s) => s.setSubject);
  const subject = useAskDock((s) => s.subject);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [edgeId, setEdgeId] = useState<string | null>(result.edges[0]?.id ?? null);
  const [graphEdge, setGraphEdge] = useState<CoEdge | null>(null);
  const [graphLookup, setGraphLookup] = useState<FactorLookup>({});
  const [graphStats, setGraphStats] = useState<GraphStats | null>(null);
  const mergedLookup = useMemo(() => ({ ...graphLookup, ...lookup }), [graphLookup, lookup]);
  const edges = result.edges;
  const lookupEdges = useMemo(() => edgeLookup(edges), [edges]);
  const edge = useMemo(() => graphEdge ?? edges.find((e) => e.id === edgeId) ?? null, [edges, edgeId, graphEdge]);
  const nodeById = useMemo(() => new Map(result.nodes.map((n) => [n.id, n])), [result.nodes]);
  const evidenceLookup = (id: string) => lookup[id];
  useEffect(() => () => setSubject(null), [setSubject]);

  const askEntity = (e: ReputationEntity) => {
    const node = nodeById.get(e.handle);
    const context = buildNodeContext({ handle: e.handle, platform: 'web', networkId: node?.networkId ?? null, role: `${e.role} · ${e.location}`, country: e.location, evidenceIds: e.factors.map((f) => `${e.id}/${f.id}`), investigation: INVESTIGATION }, evidenceLookup);
    setSubject({ scope: 'node', subjectKey: e.handle, title: `${e.name} · ${e.role}`, investigationId: INVESTIGATION.id, context, presets: entityPrompts(e), contextMetadata: contextToMetadata(context, 'node'), placeholder: `quick query on ${e.name}…` });
    document.getElementById('reputation-ask')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const askEdge = (ed: CoEdge) => {
    const context = buildEdgeContext({ source: ed.source, target: ed.target, mode: 'matrix', weight: ed.weight, windowSeconds: result.params.windowSeconds, count: ed.count, byMode: ed.byMode, minDelta: ed.minDelta, evidenceIds: ed.evidenceIds ?? [], investigation: INVESTIGATION, runLabel: result.runId }, evidenceLookup);
    setSubject({ scope: 'edge', subjectKey: ed.id, title: `${ed.source} × ${ed.target} · matrix`, investigationId: INVESTIGATION.id, context, presets: EDGE_PRESETS, contextMetadata: contextToMetadata(context, 'edge'), placeholder: 'quick query on this edge…' });
    document.getElementById('reputation-ask')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="reputation-engine w-full min-w-0" data-testid="reputation-view">
      <div className="banner-outline mb-4 flex flex-wrap items-center gap-2" data-testid="reputation-banner">
        <span>{UNPROVEN_BANNER}</span>
        <span className="mono normal-case tracking-normal text-secondary">run {result.runId} · {result.postsConsidered.toLocaleString('en-US')} sourced items · window {result.params.windowSeconds}s · {edges.length} edges · modularity {result.modularity.toFixed(3)}</span>
      </div>
      <h2 className="mb-2 text-[14px] font-semibold text-ink">Interactive correlation graph</h2>
      <p className="mb-2 text-[12px] text-secondary">Rilian correlation engine canvas over the 2026-10-18 evidence corpus — four dashed-ring registers (BCAP-001 B Capital, BCAP-002 Eduardo Saverin, BCAP-003 Raj Ganguly, BCAP-004 Karan Mohla), publisher / portfolio-company / social / podcast bubbles sized by evidence count, curved link width = co-action weight. Drag nodes · click a link for WHY CONNECTED · click a node to load it into ASK · OnDemand · the MAX AGE slider filters the graph, the Evidence table and every count together.</p>
      <ReputationGraph onSelectEdge={(e, ev) => { if (e) { setGraphEdge(e); setGraphLookup(ev as FactorLookup); } }} onStats={setGraphStats} />
      {graphStats && (
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-secondary" data-testid="register-counts" aria-label="Per-register counts versus targets">
          <span className="mono text-ink" data-testid="register-counts-total">{graphStats.items.toLocaleString('en-US')} items · {graphStats.nodes} nodes · {graphStats.edges.toLocaleString('en-US')} edges · {graphStats.isolates} isolates</span>
          {graphStats.perRegister.map((r) => (
            <span key={r.id} className={cx('chip rep-register-chip cursor-default', r.items < r.target && 'rep-risk')} data-testid="register-count" data-register={r.id} data-items={r.items} data-target={r.target} title={`${r.name}: ${r.items.toLocaleString('en-US')} evidence items vs target ${r.target.toLocaleString('en-US')} · ${r.nodes} nodes · ${r.edges.toLocaleString('en-US')} edges touch this register · ${r.isolates} isolates`}>
              <span className="mono">{r.id}</span> {r.name} · {r.items.toLocaleString('en-US')}/{r.target.toLocaleString('en-US')} {r.items >= r.target ? '✓' : `(−${r.target - r.items})`} · {r.nodes}n · {r.edges}e · {r.isolates}i
            </span>
          ))}
          <span className="mono text-tertiary">{graphStats.source}</span>
        </div>
      )}
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2" data-testid="entity-grid">
        {entities.map((e) => (
          <EntityCard key={e.id} entity={e} node={nodeById.get(e.handle)} onAsk={askEntity} active={subject?.subjectKey === e.handle} plate={e.kind === 'firm' ? plates.firm : plates.leader} />
        ))}
      </div>
      {batch && <BatchSummary data={batch} />}
      <h2 className="mt-6 text-[14px] font-semibold text-ink">Correlation output</h2>
      <p className="mb-3 text-[12px] text-secondary">Correlation engine — co-share / co-link / co-hashtag / co-reply / co-text inside the window, distinct-pair dedup, discriminating weight (log-scaled pairs × specificity × precision ÷ (1 + syndication)), Louvain communities and Brandes betweenness. Shade = normalised weight.</p>
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3" data-testid="correlation-output">
        <div className="card rep-matrix-panel min-w-0 p-3 lg:col-span-1" style={{ backgroundImage: `url(${plates.matrix})` }} data-testid="matrix-panel" data-plate={plates.matrix}>
          <div className="label-xs mb-2">Co-occurrence matrix</div>
          <div className="rep-matrix-wrap" data-testid="correlation-matrix">
            <MatrixHeatmap matrix={result.matrix} edges={edges} height={240} highlightedCommunity={highlighted} onCellClick={(id) => { const e = lookupEdges.get(id); if (e) { setGraphEdge(null); setEdgeId(e.id); } }} />
          </div>
          <ul className="mt-2 text-[11px]" data-testid="edge-list">
            {edges.map((e) => (
              <li key={e.id}><button type="button" className={cx('chip my-0.5', edgeId === e.id && 'is-active')} onClick={() => { setGraphEdge(null); setEdgeId(e.id); }} data-testid="edge-chip">{e.source} × {e.target} · {e.weight.toFixed(3)}</button></li>
            ))}
          </ul>
        </div>
        <div className="card min-w-0 p-3">
          <div className="label-xs mb-2">Centrality</div>
          <div className="w-full min-w-0 overflow-x-auto" data-testid="centrality-scroll">
          <Centrality nodes={result.nodes} watchHandles={[]} onFocus={(h) => { const e = entities.find((x) => x.handle === h); if (e) askEntity(e); }} />
          </div>
        </div>
        <div className="card min-w-0 overflow-hidden p-3">
          <div className="label-xs mb-2">Communities</div>
          <Communities communities={result.communities} modularity={result.modularity} highlighted={highlighted} onHighlight={setHighlighted} isolatesHidden={0} />
        </div>
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <WhyConnected edge={edge} lookup={mergedLookup} onAsk={askEdge} />
        <div id="reputation-ask"><ReputationAskPanel /></div>
      </div>
      <EvidenceExplorer categories={categories ?? []} />
    </div>
  );
}
