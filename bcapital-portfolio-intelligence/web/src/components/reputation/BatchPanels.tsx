'use client';
/**
 * Volume panels for the 12k-item evidence batch (scripts/batch-correlation.ts):
 *   - BatchSummary: per-entity reputation (src/scoring.ts, unchanged) + prestige index + Wilson lower bound, 4×4 entity matrix
 *     (precomputed server-side by the ported engine — the browser never runs the correlation), conflicting sources surfaced as-is.
 *   - EvidenceExplorer: register (BCAP-001…004) + category chips with EXACT counts from the corpus, text search, the graph's MAX AGE filter
 *     (shared useGraphPrefs store → the canvas, this table and every count move together) and a virtualized list (@tanstack/react-virtual)
 *     over the paged server route /api/reputation/evidence (web/data/reputation/evidence.json — 7,736 items) so the rows never ship in a bundle.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { cx } from './rilian-ui';
import { useGraphPrefs, MAX_AGE_ALL } from './graph/graphPrefs';

type Score = { entity: string; name: string; items: number; reputation: { score: number; confidence: number; label: string; factors: Record<string, number> }; prestige: { index: number; prestigeItems: number; positiveShare: number; wilsonLower: number }; wilson: { positive: number; n: number; lower: number }; categories: Record<string, { n: number; mass: number; meanSentiment: number; wilsonLower: number; contribution: number }> };
type Conflict = { key: string; values: { amount: string; stage: string; source_url: string; source_name: string; published_date: string; headline: string }[] };
export type BatchSummaryData = { runId: string; generatedAt: string; counts: { ingested: number; rejected: number; deduped: number; processed: number; chunks: number; nanScores: number }; rejectReasons: Record<string, number>; byEntity: Record<string, number>; byCategory: Record<string, number>; timingsMs: Record<string, number>; matrix4: { entities: string[]; weights: number[][]; counts: number[][] }; scores: Score[]; conflicts: Conflict[]; engine: { edges: number; postsConsidered: number; durationMs: number } };

const NAMES: Record<string, string> = { 'b-capital': 'B Capital', 'eduardo-saverin': 'Eduardo Saverin', 'raj-ganguly': 'Raj Ganguly', 'karan-mohla': 'Karan Mohla' };
const SHORT: Record<string, string> = { 'b-capital': 'B Capital', 'eduardo-saverin': 'Saverin', 'raj-ganguly': 'Ganguly', 'karan-mohla': 'Mohla' };
const fmt = (n: number) => n.toLocaleString('en-US');
const catLabel = (c: string) => c.replace(/-/g, ' ');

export function BatchSummary({ data }: { data: BatchSummaryData }) {
  const maxW = Math.max(0.0001, ...data.matrix4.weights.flatMap((r, i) => r.filter((_, j) => j !== i)));
  return (
    <section className="card mt-4 min-w-0 max-w-full overflow-hidden p-4" data-testid="batch-summary" aria-label="Evidence batch">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[14px] font-semibold text-ink">Evidence batch · {data.runId}</h2>
        <span className="mono text-[11px] text-secondary" data-testid="batch-counts">{fmt(data.counts.processed)} processed · {fmt(data.counts.ingested)} ingested · {fmt(data.counts.rejected)} rejected · {fmt(data.counts.deduped)} duplicates · {data.counts.chunks} chunks · {data.counts.nanScores} NaN</span>
      </div>
      <div className="mt-3 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left" data-testid="batch-scores">
            <caption className="sr-only">Per-entity reputation and prestige scores</caption>
            <thead><tr><th className="table-th">Subject</th><th className="table-th">Items</th><th className="table-th" title="src/scoring.ts — 0–100, z across the four subjects">Reputation</th><th className="table-th">Confidence</th><th className="table-th" title="Wilson-lower positive share × saturating prestige mass">Prestige</th><th className="table-th" title="Wilson lower bound of the positive share (z = 1.96)">Wilson</th></tr></thead>
            <tbody>
              {data.scores.map((s) => (
                <tr key={s.entity} className="rep-factor-row" data-testid="batch-score-row" data-entity={s.entity}>
                  <td className="table-td font-medium">{s.name}</td>
                  <td className="table-td mono">{fmt(s.items)}</td>
                  <td className="table-td mono" data-testid="score-reputation">{s.reputation.score}<span className="text-tertiary"> · {s.reputation.label}</span></td>
                  <td className="table-td mono">{s.reputation.confidence.toFixed(2)}</td>
                  <td className="table-td mono" data-testid="score-prestige">{s.prestige.index}</td>
                  <td className="table-td mono">{s.wilson.lower.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="min-w-0">
          <div className="label-xs mb-1">4×4 entity correlation (engine edge weight)</div>
          <div className="grid min-w-0 gap-[2px] text-[11px]" style={{ gridTemplateColumns: `minmax(64px,auto) repeat(4, minmax(0,1fr))` }} data-testid="batch-matrix">
            <span />
            {data.matrix4.entities.map((e) => <span key={e} className="truncate text-center text-secondary">{SHORT[e]}</span>)}
            {data.matrix4.entities.map((a, i) => (
              <div key={a} className="contents">
                <span className="truncate pr-1 text-secondary">{SHORT[a]}</span>
                {data.matrix4.weights[i]!.map((w, j) => {
                  const diag = i === j; const t = diag ? 0 : w / maxW;
                  return (
                    <span key={j} data-testid="batch-matrix-cell" title={diag ? NAMES[a] : `${NAMES[a]} × ${NAMES[data.matrix4.entities[j]!]}: weight ${w.toFixed(3)}, ${data.matrix4.counts[i]![j]} co-occurrences`}
                      className="mono flex h-8 items-center justify-center rounded" style={{ background: diag ? '#f6f5f1' : `rgba(10,201,133,${(0.12 + 0.6 * t).toFixed(3)})`, color: '#141413' }}>
                      {diag ? '—' : w.toFixed(3)}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-secondary">{data.engine.edges} engine edges over {fmt(data.engine.postsConsidered)} items · {data.engine.durationMs} ms · 24 h window, date-precision pairs capped as same-day.</p>
        </div>
      </div>
      {data.conflicts.length > 0 && (
        <div className="mt-3 rounded border border-dashed p-3" style={{ borderColor: '#f2994a', background: '#fff7e6' }} data-testid="batch-conflicts">
          <div className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: '#8a4a0b' }}><AlertTriangle className="h-3.5 w-3.5" /> Conflicting sources (shown side by side, not averaged)</div>
          <ul className="mt-1 space-y-1 text-[12px]">
            {data.conflicts.map((c) => (
              <li key={c.key} data-testid="batch-conflict"><span className="font-medium">{c.key}:</span>{' '}
                {c.values.filter((v) => v.stage === 'final').map((v, i) => (
                  <span key={i}>{i > 0 && ' vs '}<a className="underline underline-offset-2" href={v.source_url} target="_blank" rel="noopener noreferrer">{v.amount}</a> <span className="text-secondary">({v.source_name}, {v.published_date})</span></span>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

type Row = [string, number, string, string, string, string, string, number, string, string];
type Resp = { total: number; offset: number; rows: Row[]; counts: { entity: Record<string, number>; category: Record<string, number> }; entities: string[]; source: string; nowIso: string };
const PAGE = 200;
export const REGISTERS = ['BCAP-001', 'BCAP-002', 'BCAP-003', 'BCAP-004'] as const;
const REG_NAME: Record<string, string> = { 'BCAP-001': 'B Capital', 'BCAP-002': 'Eduardo Saverin', 'BCAP-003': 'Raj Ganguly', 'BCAP-004': 'Karan Mohla' };
const REG_SHORT: Record<string, string> = { 'BCAP-001': 'B Capital', 'BCAP-002': 'Saverin', 'BCAP-003': 'Ganguly', 'BCAP-004': 'Mohla' };
const BASIS_LABEL: Record<string, string> = { text: 'named in text', query: 'query-bound', 'publisher-scope': 'b.capital archive', curated: 'curated', seed: 'seed' };
const maskRegs = (mask: number) => REGISTERS.filter((_, i) => mask & (1 << i)).map((r) => REG_SHORT[r]).join(' · ');

export function EvidenceExplorer({ categories, onTotal }: { entities?: string[]; categories: string[]; onTotal?: (total: number) => void }) {
  const [entity, setEntity] = useState('all');
  const [category, setCategory] = useState('all');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Resp['counts'] | null>(null);
  const [rows, setRows] = useState<Map<number, Row>>(() => new Map());
  const loading = useRef(new Set<number>());
  const gen = useRef(0);
  const parentRef = useRef<HTMLDivElement | null>(null);
  // the graph's live MAX AGE slider (persisted prefs store) drives this table too — same cutoff semantics as applyMaxAge ('all' = no filter)
  const maxAgeDays = useGraphPrefs((s) => s.maxAgeDays);
  const maxAge = maxAgeDays === null || maxAgeDays >= MAX_AGE_ALL ? 'all' : String(maxAgeDays);
  const [debouncedAge, setDebouncedAge] = useState(maxAge);
  useEffect(() => { const t = setTimeout(() => setDebouncedAge(maxAge), 200); return () => clearTimeout(t); }, [maxAge]);

  useEffect(() => { const t = setTimeout(() => setDebouncedQ(q), 250); return () => clearTimeout(t); }, [q]);
  const fetchPage = useMemo(() => (page: number, g: number, ctl?: AbortController) => {
    if (loading.current.has(page)) return;
    loading.current.add(page);
    const sp = new URLSearchParams({ entity, category, q: debouncedQ, maxAge: debouncedAge, offset: String(page * PAGE), limit: String(PAGE) });
    fetch(`/api/reputation/evidence?${sp}`, { signal: ctl?.signal })
      .then((r) => (r.ok ? (r.json() as Promise<Resp>) : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        if (g !== gen.current) return;
        setTotal(d.total); setCounts(d.counts); onTotal?.(d.total);
        setRows((m) => { const n = new Map(m); d.rows.forEach((r, i) => n.set(d.offset + i, r)); return n; });
      })
      .catch(() => { /* aborted on filter change / unmount */ })
      .finally(() => loading.current.delete(page));
  }, [entity, category, debouncedQ, debouncedAge, onTotal]);
  useEffect(() => {
    const g = ++gen.current; const ctl = new AbortController();
    loading.current.clear(); setRows(new Map()); setTotal(0);
    parentRef.current?.scrollTo({ top: 0 });
    fetchPage(0, g, ctl);
    return () => ctl.abort();
  }, [fetchPage]);

  const v = useVirtualizer({ count: total, getScrollElement: () => parentRef.current, estimateSize: () => 58, overscan: 8 });
  const items = v.getVirtualItems();
  useEffect(() => {
    for (const it of items) { if (!rows.has(it.index)) { fetchPage(Math.floor(it.index / PAGE), gen.current); } }
  }, [items, rows, fetchPage]);

  const chip = (active: boolean) => cx('chip', active && 'is-active');
  return (
    <section className="card mt-4 min-w-0 p-4" data-testid="evidence-explorer" aria-label="Evidence explorer" data-source="web/data/reputation/evidence.json" data-max-age={maxAge}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[14px] font-semibold text-ink">Evidence</h2>
        <span className="mono text-[11px] text-secondary" data-testid="evidence-total" aria-live="polite">{fmt(total)} items</span>
        <span className="mono text-[11px] text-tertiary" data-testid="evidence-max-age" title="Shared with the graph's MAX AGE slider — age of published_at relative to the corpus run time">MAX AGE {maxAge === 'all' ? 'all' : `${maxAge}d`}</span>
        <input className="input ml-auto !w-full sm:!w-64" placeholder="Search titles, publishers or snippets…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search evidence" data-testid="evidence-search" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="Filter by register" data-testid="entity-filters">
        {['all', ...REGISTERS].map((e) => (
          <button key={e} type="button" className={chip(entity === e)} aria-pressed={entity === e} onClick={() => setEntity(e)} data-testid="entity-filter" data-value={e} data-count={counts?.entity[e] ?? 0}>
            {e === 'all' ? 'All registers' : <><span className="mono text-tertiary">{e}</span> {REG_NAME[e]}</>} <span className="text-tertiary">{fmt(counts?.entity[e] ?? 0)}</span>
          </button>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-1" role="group" aria-label="Filter by category" data-testid="category-filters">
        {['all', ...categories].map((c) => (
          <button key={c} type="button" className={chip(category === c)} aria-pressed={category === c} onClick={() => setCategory(c)} data-testid="category-filter" data-value={c} data-count={counts?.category[c] ?? 0}>
            {c === 'all' ? 'All categories' : catLabel(c)} <span className="text-tertiary">{fmt(counts?.category[c] ?? 0)}</span>
          </button>
        ))}
      </div>
      <div ref={parentRef} className="rep-evidence-scroll mt-3" data-testid="evidence-scroll" role="list" aria-label="Evidence items">
        <div style={{ height: v.getTotalSize(), position: 'relative', width: '100%' }}>
          {items.map((it) => {
            const r = rows.get(it.index);
            return (
              <div key={it.key} role="listitem" data-index={it.index} ref={v.measureElement} data-testid={r ? 'evidence-row' : 'evidence-row-loading'} data-evidence-id={r?.[0]}
                className="absolute left-0 top-0 w-full border-b border-hairline px-1 py-2" style={{ transform: `translateY(${it.start}px)` }}>
                {r ? (
                  <div className="flex min-w-0 items-start gap-2 text-[12px]">
                    <span className="mono w-[78px] shrink-0 text-tertiary">{r[6] ? r[6].slice(0, 10) : 'undated'}</span>
                    <div className="min-w-0 flex-1">
                      <a href={r[4]} target="_blank" rel="noopener noreferrer" className="line-clamp-2 break-words text-ink underline-offset-2 hover:underline">{r[3]} <ExternalLink className="inline h-3 w-3" aria-hidden /></a>
                      <div className="mt-0.5 truncate text-[11px] text-secondary"><span className="mono">{r[0]}</span> · {maskRegs(r[7]) || REG_SHORT[REGISTERS[r[1]] ?? '']} · {catLabel(r[2])} · {r[5]} · {r[9]} · {BASIS_LABEL[r[8]] ?? r[8]}</div>
                    </div>
                  </div>
                ) : <div className="h-9 animate-pulse rounded bg-fill" aria-hidden />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
