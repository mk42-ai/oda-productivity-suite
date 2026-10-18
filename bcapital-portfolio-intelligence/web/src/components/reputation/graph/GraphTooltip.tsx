/**
 * GraphTooltip — hover card for the bubble graph, rendered through a portal ABOVE the WebGL / canvas layer
 * (into the fullscreen element when one is active, otherwise `document.body`). Follows the pointer with a
 * 12 px offset, flips near the viewport edges, never captures pointer events. Two variants:
 *   NODE — handle · platform (the same 16 px BrandIcon) · network · degree · betweenness · EVID ids · flags
 *   EDGE — modes with counts · weight · window + min Δt · EVID ids gathered from the shared trail
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CoMode } from '@/lib/reputation/engine/types';
import { BrandIcon, PLATFORM_LABEL } from './BrandIcon';
import type { BubbleLink, BubbleNode } from './BubbleGraph';

export type GraphHover = { kind: 'node'; node: BubbleNode } | { kind: 'link'; link: BubbleLink; sourceId: string; targetId: string };

interface GraphTooltipProps {
  hover: GraphHover | null;
  /** Element whose `pointermove` events position the card (the graph wrapper). */
  anchor: HTMLElement | null;
  /** Run window in seconds (edge variant) — falls back to the link's own `windowSeconds`. */
  windowSeconds?: number;
}

const TOOLTIP_OFFSET_PX = 12;
const TOOLTIP_MAX_IDS = 6;
const MODE_ORDER: CoMode[] = ['co-share', 'co-link', 'co-hashtag', 'co-reply', 'co-text'];

function formatWindow(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  if (seconds === 86400) return '24h';
  if (seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds % 60 === 0 && seconds >= 300) return `${seconds / 60}m`;
  return `${seconds}s`;
}

function formatDelta(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

/** Pointer position → card position (offset 12 px, flipped when it would leave the viewport). */
function placeTooltip(pointer: { x: number; y: number }, card: { width: number; height: number }, viewport: { width: number; height: number }, offset: number = TOOLTIP_OFFSET_PX): { left: number; top: number } {
  let left = pointer.x + offset;
  let top = pointer.y + offset;
  if (left + card.width > viewport.width - 4) left = Math.max(4, pointer.x - offset - card.width);
  if (top + card.height > viewport.height - 4) top = Math.max(4, pointer.y - offset - card.height);
  return { left, top };
}

function IdList({ ids }: { ids: string[] }) {
  if (ids.length === 0) return <span className="gt-more">—</span>;
  const shown = ids.slice(0, TOOLTIP_MAX_IDS);
  const more = ids.length - shown.length;
  return (
    <span className="gt-ids mono">
      {shown.map((id) => (
        <span key={id}>{id}</span>
      ))}
      {more > 0 && <span className="gt-more">+{more}</span>}
    </span>
  );
}

function NodeCard({ node }: { node: BubbleNode }) {
  return (
    <>
      <div className="gt-title" data-testid="graph-tooltip-title">
        {node.label}
      </div>
      <div className="gt-row">
        {node.platform ? (
          <>
            <BrandIcon platform={node.platform} size={16} />
            <span className="gt-v">{PLATFORM_LABEL[node.platform]}</span>
          </>
        ) : (
          <span className="gt-v">{node.kind ?? 'object'}</span>
        )}
      </div>
      <div className="gt-row">
        <span className="gt-k">network</span>
        <span className={node.networkId ? 'gt-v mono' : 'gt-v'}>{node.networkId ?? 'independent'}</span>
      </div>
      {typeof node.degree === 'number' && (
        <div className="gt-row">
          <span className="gt-k">degree</span>
          <span className="gt-v mono">{node.degree}</span>
        </div>
      )}
      {typeof node.betweenness === 'number' && (
        <div className="gt-row">
          <span className="gt-k">betweenness</span>
          <span className="gt-v mono">{node.betweenness.toFixed(3)}</span>
        </div>
      )}
      <div className="gt-row">
        <span className="gt-k">evidence</span>
        <span className="gt-v">
          <IdList ids={node.evidenceIds ?? []} />
        </span>
      </div>
      {(node.watch || node.synthetic || node.historical) && (
        <div className="gt-flags">
          {node.watch && <span className="gt-flag gt-flag--double">watch list</span>}
          {node.synthetic && <span className="gt-flag gt-flag--dashed">synthetic</span>}
          {node.historical && <span className="gt-flag gt-flag--muted">historical only</span>}
        </div>
      )}
    </>
  );
}

function LinkCard({ link, sourceId, targetId, windowSeconds }: { link: BubbleLink; sourceId: string; targetId: string; windowSeconds: number | undefined }) {
  const byMode = link.byMode ?? {};
  const modes = MODE_ORDER.filter((m) => (byMode[m] ?? 0) > 0).map((m) => `${m} ${byMode[m]}`);
  const win = windowSeconds ?? link.windowSeconds;
  return (
    <>
      <div className="gt-title mono" data-testid="graph-tooltip-title">
        {sourceId} × {targetId}
      </div>
      <div className="gt-row">
        <span className="gt-k">{modes.length === 1 ? 'mode' : 'modes'}</span>
        <span className="gt-v">{modes.length ? modes.join(' · ') : (link.title ?? 'co-action')}</span>
      </div>
      <div className="gt-row">
        <span className="gt-k">weight</span>
        <span className="gt-v mono">
          {link.weight.toFixed(3)}
          {typeof link.count === 'number' && <span className="gt-more"> · {link.count} co-occurrence{link.count === 1 ? '' : 's'}{typeof link.rawCount === 'number' && link.rawCount !== link.count ? ` (raw events ${link.rawCount})` : ''}</span>}
          {link.syndicated && <span className="gt-more" data-testid="graph-tooltip-syndicated"> · syndicated · wire copy</span>}
        </span>
      </div>
      {(win !== undefined || typeof link.minDelta === 'number') && (
        <div className="gt-row">
          <span className="gt-k">window</span>
          <span className="gt-v mono">
            {win !== undefined ? formatWindow(win) : '—'}
            {typeof link.minDelta === 'number' && ` · min Δt ${formatDelta(link.minDelta)}`}
          </span>
        </div>
      )}
      <div className="gt-row">
        <span className="gt-k">evidence</span>
        <span className="gt-v">
          <IdList ids={link.evidenceIds ?? []} />
        </span>
      </div>
      <div className="gt-foot">co-action, not intent · UNPROVEN · click for WHY CONNECTED</div>
    </>
  );
}

export function GraphTooltip({ hover, anchor, windowSeconds }: GraphTooltipProps) {
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [card, setCard] = useState({ width: 0, height: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!anchor) return undefined;
    const onMove = (e: PointerEvent): void => setPointer({ x: e.clientX, y: e.clientY });
    anchor.addEventListener('pointermove', onMove, { passive: true });
    return () => anchor.removeEventListener('pointermove', onMove);
  }, [anchor]);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const next = { width: el.offsetWidth, height: el.offsetHeight };
    setCard((prev) => (prev.width === next.width && prev.height === next.height ? prev : next));
  }, [hover]);

  if (!hover || !pointer || typeof document === 'undefined') return null;
  const target = (document.fullscreenElement as HTMLElement | null) ?? document.body;
  const { left, top } = placeTooltip(pointer, card, { width: window.innerWidth, height: window.innerHeight });
  return createPortal(
    <div ref={cardRef} className="gt-card" role="tooltip" data-testid="graph-tooltip" data-kind={hover.kind} style={{ left, top }}>
      {hover.kind === 'node' ? <NodeCard node={hover.node} /> : <LinkCard link={hover.link} sourceId={hover.sourceId} targetId={hover.targetId} windowSeconds={windowSeconds} />}
    </div>,
    target,
  );
}
