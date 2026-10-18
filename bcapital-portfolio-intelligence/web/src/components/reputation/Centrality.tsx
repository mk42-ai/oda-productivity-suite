/** Centrality table — top 15 nodes by degree / weighted degree / betweenness (sortable), with grayscale bars. */
import { useMemo, useState, type ReactElement } from 'react';
import { ArrowDown } from 'lucide-react';
import type { CoNode } from '@/lib/reputation/engine/types';
import { Bar, EmptyState, IdChip, cx } from './rilian-ui';

type SortKey = 'degree' | 'weightedDegree' | 'betweenness';

export function Centrality({ nodes, watchHandles, onFocus }: { nodes: CoNode[]; watchHandles: string[]; onFocus: (handle: string) => void }) {
  const [sort, setSort] = useState<SortKey>('betweenness');
  const rows = useMemo(() => [...nodes].sort((a, b) => b[sort] - a[sort] || b.weightedDegree - a.weightedDegree || a.id.localeCompare(b.id)).slice(0, 15), [nodes, sort]);
  if (!nodes.length) return <EmptyState title="No nodes" hint="Run the engine to compute degree, weighted degree and Brandes betweenness." />;
  const maxDeg = Math.max(1, ...nodes.map((n) => n.degree));
  const maxW = Math.max(1e-6, ...nodes.map((n) => n.weightedDegree));
  const maxB = Math.max(1e-6, ...nodes.map((n) => n.betweenness));
  const watch = new Set(watchHandles);
  const th = (key: SortKey, label: string): ReactElement => (
    <th className="table-th">
      <button type="button" className={cx('inline-flex items-center gap-1 uppercase', sort === key ? 'text-ink' : 'text-secondary hover:text-ink')} onClick={() => setSort(key)} title={`Sort by ${label}`}>
        {label}
        {sort === key && <ArrowDown size={10} />}
      </button>
    </th>
  );
  return (
    <div className="p-0" data-testid="centrality">
      <div className="px-3 py-2 text-[11px] text-secondary">
        Top {rows.length} of {nodes.length} nodes. Betweenness is normalised 0–1 (Brandes). Centrality describes position in the co-occurrence structure, not intent.
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="table-th">Handle</th>
            {th('degree', 'Degree')}
            {th('weightedDegree', 'Weighted')}
            {th('betweenness', 'Betweenness')}
          </tr>
        </thead>
        <tbody>
          {rows.map((n) => (
            <tr key={n.id} className="row-hover cursor-pointer" onClick={() => onFocus(n.id)} title={`${n.platform} · ${n.networkId ?? 'independent'} · ${n.activity} posts considered · community C${n.community + 1}`}>
              <td className="table-td">
                <span className="flex items-center gap-1">
                  <IdChip id={n.id} className={cx(n.synthetic && 'border-dashed', watch.has(n.id) && 'border-double border-[3px] border-ink')} />
                  {n.synthetic && <span className="text-[9px] uppercase text-tertiary">syn</span>}
                </span>
              </td>
              <td className="table-td w-[70px]">
                <span className="mono">{n.degree}</span>
                <Bar value={n.degree} max={maxDeg} height={3} className="mt-0.5" />
              </td>
              <td className="table-td w-[76px]">
                <span className="mono">{n.weightedDegree.toFixed(2)}</span>
                <Bar value={n.weightedDegree} max={maxW} height={3} className="mt-0.5" />
              </td>
              <td className="table-td w-[84px]">
                <span className="mono">{n.betweenness.toFixed(3)}</span>
                <Bar value={n.betweenness} max={maxB} height={3} className="mt-0.5" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
