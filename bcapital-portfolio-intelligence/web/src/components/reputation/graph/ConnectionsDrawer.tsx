/**
 * ConnectionsDrawer — the top-weight edges of the displayed graph as a keyboard-navigable ARIA listbox (v4.3, DEF-017).
 *
 * Rendered INSIDE the graph wrapper so it is available in native fullscreen and in the in-page expanded mode, where the
 * right-hand panels are not visible. Each row is `source → target [· wire copy] · weight · EVID count` (DEF-020/019: the badge marks
 * syndicated pairs, the count is the run's own trail); Enter / Space / click opens WHY
 * CONNECTED for that pair through `onSelect`. Keyboard contract (WAI-ARIA listbox, roving `aria-activedescendant`):
 *   ArrowDown / ArrowUp move the active row (clamped), Home / End jump, Enter / Space select, Escape closes the drawer
 *   (the key is consumed so the Expand hook does not ALSO exit on it) and returns focus to the element that opened it.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { X } from 'lucide-react';
import { cx } from '../rilian-ui';

export interface DrawerEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  evidCount: number;
  /** Optional relation / mode hint rendered after the pair (ego graph: the edge kind). */
  kind?: string;
  /** DEF-020: the pair is (≥ 50 %) republished wire copy — rendered as a dashed `wire copy` badge. */
  syndicated?: boolean;
}

interface ConnectionsDrawerProps {
  open: boolean;
  edges: DrawerEdge[];
  selectedId: string | null;
  onSelect: (edgeId: string) => void;
  onClose: () => void;
  /** Element to focus again when the drawer closes (the toolbar toggle). */
  returnFocusTo?: RefObject<HTMLElement | null>;
  limit?: number;
  title?: string;
}

export const CONNECTIONS_DRAWER_LIMIT = 24;

/** Pure: strongest-first ordering with a deterministic tie-break, capped. */
export function rankDrawerEdges(edges: readonly DrawerEdge[], limit = CONNECTIONS_DRAWER_LIMIT): DrawerEdge[] {
  return [...edges].sort((a, b) => b.weight - a.weight || b.evidCount - a.evidCount || a.id.localeCompare(b.id)).slice(0, Math.max(0, limit));
}

/** Pure keyboard reducer for the active row (tested without a DOM): returns the next index or null when the key is not handled. */
export function nextActiveIndex(key: string, active: number, count: number): number | null {
  if (count <= 0) return null;
  switch (key) {
    case 'ArrowDown':
      return Math.min(count - 1, active + 1);
    case 'ArrowUp':
      return Math.max(0, active - 1);
    case 'Home':
    case 'PageUp':
      return 0;
    case 'End':
    case 'PageDown':
      return count - 1;
    default:
      return null;
  }
}

export function ConnectionsDrawer({ open, edges, selectedId, onSelect, onClose, returnFocusTo, limit = CONNECTIONS_DRAWER_LIMIT, title = 'Connections' }: ConnectionsDrawerProps) {
  const ranked = useMemo(() => rankDrawerEdges(edges, limit), [edges, limit]);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  // opening: active row = the selected edge (or the first), focus the listbox; closing: focus returns to the toggle
  useEffect(() => {
    if (open && !wasOpen.current) {
      const idx = selectedId ? ranked.findIndex((e) => e.id === selectedId) : -1;
      setActive(idx >= 0 ? idx : 0);
      window.requestAnimationFrame(() => listRef.current?.focus({ preventScroll: true }));
    } else if (!open && wasOpen.current) {
      const el = returnFocusTo?.current;
      if (el && typeof el.focus === 'function' && document.contains(el)) el.focus({ preventScroll: true });
    }
    wasOpen.current = open;
  }, [open, ranked, selectedId, returnFocusTo]);
  useEffect(() => {
    if (active > ranked.length - 1) setActive(Math.max(0, ranked.length - 1));
  }, [ranked.length, active]);
  // keep the active row in view
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        const row = ranked[active];
        if (row) {
          e.preventDefault();
          onSelect(row.id);
        }
        return;
      }
      const next = nextActiveIndex(e.key, active, ranked.length);
      if (next !== null) {
        e.preventDefault();
        setActive(next);
      }
    },
    [active, ranked, onSelect, onClose],
  );

  if (!open) return null;
  const activeId = ranked[active] ? `connections-row-${active}` : undefined;
  return (
    <aside id="connections-drawer" className="connections-drawer" data-testid="connections-drawer" aria-label={title} data-count={ranked.length}>
      <header className="flex items-center justify-between gap-2 border-b border-hairline px-3 py-1.5">
        <span className="label-xs">
          {title} <span className="mono normal-case text-secondary">{ranked.length}</span>
        </span>
        <button type="button" className="btn btn-sm" onClick={onClose} aria-label="Close connections drawer" data-testid="connections-drawer-close">
          <X size={12} />
        </button>
      </header>
      <p className="m-0 border-b border-hairline bg-surface-2 px-3 py-1 text-[10px] leading-4 text-secondary">strongest edges first · ↑ ↓ Home End move · Enter opens WHY CONNECTED · Esc closes</p>
      <div
        ref={listRef}
        role="listbox"
        aria-label={`${title} — strongest edges`}
        aria-activedescendant={activeId}
        tabIndex={0}
        className="connections-drawer-list min-h-0 flex-1 overflow-auto p-1 outline-none focus-visible:ring-1 focus-visible:ring-ink"
        data-testid="connections-listbox"
        onKeyDown={onKeyDown}
      >
        {ranked.length === 0 && <div className="px-2 py-3 text-[11px] text-tertiary">no edges in the displayed graph</div>}
        {ranked.map((e, i) => (
          <div
            key={e.id}
            id={`connections-row-${i}`}
            role="option"
            aria-selected={e.id === selectedId}
            data-active={i === active ? '1' : '0'}
            data-index={i}
            data-edge-id={e.id}
            data-testid="connections-row"
            className={cx('connections-row flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-[11px]', i === active && 'connections-row-active', e.id === selectedId && 'bg-fill-2')}
            onMouseEnter={() => setActive(i)}
            onClick={() => {
              setActive(i);
              onSelect(e.id);
            }}
          >
            <span className="mono min-w-0 flex-1 break-words [overflow-wrap:anywhere] text-ink" title={`${e.source} → ${e.target}${e.kind ? ` (${e.kind})` : ''}${e.syndicated ? ' · syndicated · wire copy' : ''}`}>
              {e.source} → {e.target}
              {e.kind && <span className="ml-1 text-tertiary">{e.kind}</span>}
              {e.syndicated && (
                <span className="badge badge-dashed ml-1 normal-case" data-testid="connections-row-syndicated" title="syndicated · wire copy (≥ 50 % of the distinct post pairs are the same article republished)">
                  wire copy
                </span>
              )}
            </span>
            <span className="mono text-secondary" title="weight">
              w {e.weight.toFixed(3)}
            </span>
            <span className="mono w-9 text-right text-tertiary" title="EVID rows behind the pair">
              {e.evidCount} EVID
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
