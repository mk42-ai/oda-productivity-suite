/**
 * linkPayload — what a clicked / tapped link hands to WHY CONNECTED (v4.3, DEF-017 edge-click-in-expand).
 *
 * Both renderers (react-force-graph-3d / -2d) call `onLinkClick(link, event)`; `buildLinkPayload` turns the library's link
 * object (whose `source` / `target` have been replaced by node objects) back into a renderer-neutral record: endpoints as
 * ids, the renderer mode ('3D' | '2D'), weight, run window, EVID ids (the run's own trail), dedup count + raw events, the
 * syndication verdict, per-mode counts and the pointer position.
 * The same record is published to `window.__graphState.lastLinkClick` so the headless proof suite can assert that the edge
 * it clicked is the one the panel opened.
 */
import type { CoMode } from '@/lib/reputation/engine/types';
import { countGraphEvent, publishGraphState, type LinkClickTelemetry } from './graphState';

interface PayloadLinkLike {
  id: string;
  source: string | number | { id: string | number };
  target: string | number | { id: string | number };
  weight: number;
  windowSeconds?: number;
  evidenceIds?: string[];
  count?: number;
  byMode?: Partial<Record<CoMode, number>>;
  minDelta?: number;
  dotted?: boolean;
  title?: string;
  rawCount?: number;
  syndicated?: boolean;
}

export interface LinkWhyPayload extends LinkClickTelemetry {
  byMode: Partial<Record<CoMode, number>> | null;
  minDelta: number | null;
  dotted: boolean;
  title: string | null;
  /** DEF-020: raw co-occurrence events behind the dedup-adjusted `count` (null when the run does not carry it) and the wire-copy verdict. */
  rawCount?: number | null;
  syndicated?: boolean;
}

type PayloadMode = '2d' | '3d';

const endpointId = (v: PayloadLinkLike['source']): string => (typeof v === 'object' && v !== null ? String(v.id) : String(v));

interface BuildPayloadOptions {
  /** Run window in seconds (correlation) — falls back to the link's own `windowSeconds`, else null (ego graph: ledger edges have no window). */
  windowSeconds?: number | null;
  /** Pointer position at click time (viewport px). */
  x?: number | null;
  y?: number | null;
  via?: LinkClickTelemetry['via'];
  now?: number;
}

/** Pure: renderer link object → WHY CONNECTED payload (no side effects, no DOM). */
export function buildLinkPayload(link: PayloadLinkLike, mode: PayloadMode, opts: BuildPayloadOptions = {}): LinkWhyPayload {
  const windowSeconds = opts.windowSeconds ?? link.windowSeconds ?? null;
  return {
    id: link.id,
    source: endpointId(link.source),
    target: endpointId(link.target),
    mode: mode === '3d' ? '3D' : '2D',
    weight: Number.isFinite(link.weight) ? Math.round(link.weight * 1000) / 1000 : 0,
    windowSeconds: windowSeconds === null || windowSeconds === undefined ? null : Math.round(windowSeconds),
    evidenceIds: Array.from(new Set((link.evidenceIds ?? []).filter((id) => typeof id === 'string' && id.length > 0))),
    count: typeof link.count === 'number' ? link.count : null,
    x: typeof opts.x === 'number' && Number.isFinite(opts.x) ? Math.round(opts.x) : null,
    y: typeof opts.y === 'number' && Number.isFinite(opts.y) ? Math.round(opts.y) : null,
    via: opts.via ?? 'canvas',
    at: opts.now ?? Date.now(),
    byMode: link.byMode ?? null,
    minDelta: typeof link.minDelta === 'number' ? link.minDelta : null,
    dotted: Boolean(link.dotted),
    title: link.title ?? null,
    rawCount: typeof link.rawCount === 'number' ? link.rawCount : null,
    syndicated: link.syndicated === true,
  };
}

/** Publish a click: bumps `linkClicks`, stores `lastLinkClick`. Returns the payload for the caller. */
export function recordLinkClick(payload: LinkWhyPayload): LinkWhyPayload {
  countGraphEvent('linkClicks');
  publishGraphState({ lastLinkClick: payload });
  return payload;
}

/** Publish that WHY CONNECTED was opened for a pair (from the canvas, the drawer or the strongest-edges list). */
export function recordWhyConnectedOpen(): number {
  return countGraphEvent('whyConnectedOpens');
}

/** Extract the viewport pointer position from a renderer event (MouseEvent / PointerEvent / TouchEvent). */
export function pointerPositionOf(event: unknown): { x: number | null; y: number | null } {
  if (!event || typeof event !== 'object') return { x: null, y: null };
  const e = event as { clientX?: unknown; clientY?: unknown; changedTouches?: ArrayLike<{ clientX: number; clientY: number }> };
  if (typeof e.clientX === 'number' && typeof e.clientY === 'number') return { x: e.clientX, y: e.clientY };
  const t = e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : null;
  return t ? { x: t.clientX, y: t.clientY } : { x: null, y: null };
}
