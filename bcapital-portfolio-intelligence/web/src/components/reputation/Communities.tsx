/** Communities drawer — one card per Louvain community. Clicking a card highlights it in the graph. */
import type { KeyboardEvent } from 'react';
import type { Community } from '@/lib/reputation/engine/types';
import { Badge, Bar, BrandIcon, EmptyState, IdChip, cx } from './rilian-ui';
import { MODE_PATTERN, shortText } from './model';

interface CommunitiesProps {
  communities: Community[];
  modularity: number;
  highlighted: number | null;
  onHighlight: (index: number | null) => void;
  /** DEF-022: run-level isolates dropped from the display by the toolbar toggle (their "no co-occurrence" community is not listed). */
  isolatesHidden?: number;
}

export function Communities({ communities, modularity, highlighted, onHighlight, isolatesHidden = 0 }: CommunitiesProps) {
  if (!communities.length) return <EmptyState title="No communities" hint="Run the engine (or lower the min weight) to see Louvain communities." />;
  const max = Math.max(1e-6, ...communities.map((c) => c.internalWeight));
  return (
    <div className="flex flex-col gap-2 p-3" data-testid="communities">
      <div className="flex items-center justify-between text-[11px] text-secondary">
        <span>
          {communities.length} communities · modularity Q <span className="mono text-ink">{modularity.toFixed(3)}</span>
          {isolatesHidden > 0 && <span data-testid="communities-isolates-hidden"> · {isolatesHidden} isolates hidden (toolbar: show isolates)</span>}
        </span>
        {highlighted !== null && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onHighlight(null)}>
            clear highlight
          </button>
        )}
      </div>
      {communities.map((c) => {
        const active = highlighted === c.index;
        const toggle = (): void => onHighlight(active ? null : c.index);
        const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        };
        return (
          <div key={c.index} role="button" tabIndex={0} aria-pressed={active} onClick={toggle} onKeyDown={onKey} className={cx('card cursor-pointer p-2.5 hover:bg-fill', active && 'border-ink bg-fill-2')} data-testid={`community-card-${c.index}`}>
            <div className="flex items-center gap-2">
              <span className="mono text-[12px] font-semibold text-ink">C{c.index + 1}</span>
              <span className="text-[11px] text-secondary">
                {c.size} member{c.size === 1 ? '' : 's'}
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-[11px] text-secondary">
                {c.dominantNetworkId ? <IdChip id={c.dominantNetworkId} /> : <span className="text-tertiary">no dominant network</span>}
                <BrandIcon platform={c.dominantPlatform} size={16} className="text-ink" />
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-secondary">
              <span className="label-xs">internal weight</span>
              <Bar value={c.internalWeight} max={max} className="flex-1" />
              <span className="mono w-10 text-right text-ink">{c.internalWeight.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {c.members.map((m) => (
                <IdChip key={m} id={m} />
              ))}
            </div>
            {c.topObjects.length > 0 && (
              <ul className="m-0 mt-2 list-none p-0 text-[11px]">
                {c.topObjects.map((o) => (
                  <li key={`${o.mode}:${o.object}`} className="flex items-center gap-1.5 py-0.5">
                    <Badge pattern={MODE_PATTERN[o.mode]}>{o.mode}</Badge>
                    <span className="mono min-w-0 flex-1 truncate text-ink" title={o.object}>
                      {shortText(o.object, 34)}
                    </span>
                    <span className="mono text-tertiary">×{o.count}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 text-[10px] uppercase tracking-wide text-tertiary">{c.caveat}</div>
          </div>
        );
      })}
    </div>
  );
}
