/**
 * graphState — a tiny window-level telemetry hook for the bubble graph (`window.__graphState`, `window.__graph`).
 *
 * The headless proof suite (tools/headless, e2e/*.spec.ts) reads it to assert measurable state changes for every
 * toolbar control: engine running/stopped, last fit (ms / ok / reason), camera distance (3D) or zoom (2D), node /
 * edge counts (shown vs run totals), halo and label counts, fullscreen state, canvas size, fill percentage and the
 * last node-drag displacement. It is diagnostics only — nothing in the app reads it back.
 *
 * v4.3 (2026-09-13, DEF-017 edge-click-in-expand) adds: the Expand state machine (`expand`), edge-click hit counters
 * (`linkClicks` / `linkHovers` / `whyConnectedOpens`) with the last click payload, the measured (pre-clamp) canvas box +
 * the MIN_CANVAS_HEIGHT guard, per-halo bounding spheres, the Connections drawer state and a per-mount instance id
 * (`graphInstanceId`) + `dataUpdates` counter that prove a Run updates the graph IN PLACE instead of remounting it.
 */
import type { GraphMode } from './graphPrefs';

type FullscreenModeState = 'native' | 'fallback' | null;

/** v4.3 — Expand state machine as published for the proof suite ('fullscreen' = native API, 'inpage' = fixed-inset fallback). */
export type ExpandMode = 'fullscreen' | 'inpage' | 'none';
interface ExpandTelemetry {
  mode: ExpandMode;
  /** Why the in-page fallback was taken (null while native fullscreen is granted or nothing is expanded). */
  reason: string | null;
  /** Wall-clock of the last transition (ms since epoch). */
  at: number;
}

/** v4.3 — the payload handed to WHY CONNECTED when a link is clicked / tapped in either renderer. */
export interface LinkClickTelemetry {
  id: string;
  source: string;
  target: string;
  mode: '3D' | '2D';
  weight: number;
  windowSeconds: number | null;
  evidenceIds: string[];
  count: number | null;
  /** Viewport coordinates of the pointer at click time (null for keyboard / drawer opens). */
  x: number | null;
  y: number | null;
  /** 'canvas' = a real pointer click on the rendered link · 'drawer' = Connections drawer row · 'panel' = strongest-edges list. */
  via: 'canvas' | 'drawer' | 'panel';
  at: number;
}

export interface HaloTelemetry {
  key: string;
  members: number;
  /** Bounding-sphere centre + radius in graph units (2D: z = 0). */
  cx: number;
  cy: number;
  cz: number;
  r: number;
}

interface GraphStateSnapshot {
  mounted: boolean;
  mode: GraphMode;
  engineRunning: boolean;
  lastFitMs: number | null;
  lastFitOk: boolean | null;
  lastFitReason: string | null;
  cameraDistance: number | null;
  zoom: number | null;
  nodeCount: number;
  edgeCount: number;
  shownNodes: number;
  shownEdges: number;
  haloCount: number;
  labelCount: number;
  fullscreenActive: boolean;
  fullscreenMode: FullscreenModeState;
  canvas: { width: number; height: number };
  fillPct: number | null;
  dragCount: number;
  lastDragDisplacement: number | null;
  /** v4.3 — DEF-006: monotonically increasing fit counter (the status line shows `fit #n`), Reset invocations. */
  fitSeq: number;
  resetCount: number;
  /** v4.3 — DEF-001 residual: the renderer got the MIN_CANVAS_HEIGHT floor because the wrapper measured shorter. */
  canvasClamped: boolean;
  /** v4.3 — DEF-005: why the CSS pseudo-fullscreen fallback was used (null when native fullscreen was granted). */
  fullscreenReason: string | null;
  /** v4.3 — DEF-006: last accessible pulse text ('fitted ✓', 'reset ✓', …). */
  lastPulse: string | null;
  /* ---------- v4.3 (DEF-017 edge-click-in-expand) */
  /** Measured wrapper box BEFORE the MIN_CANVAS_HEIGHT clamp (what the layout actually gave the canvas). */
  canvasMeasured: { width: number; height: number };
  /** The configured floor (graphFit.MIN_CANVAS_HEIGHT). */
  minCanvasHeight: number;
  expand: ExpandTelemetry;
  linkClicks: number;
  linkHovers: number;
  whyConnectedOpens: number;
  lastLinkClick: LinkClickTelemetry | null;
  halos: HaloTelemetry[];
  /** Halos hidden by the Expand rule (the Halos pref itself is untouched). */
  halosSuppressed: boolean;
  drawerOpen: boolean;
  /** Random id assigned when the BubbleGraph component mounts — unchanged across a Run means "no remount". */
  graphInstanceId: string | null;
  /** Number of in-place graphData updates the mounted instance has absorbed (a Run increments it; a remount resets it). */
  dataUpdates: number;
  /** Positions carried over from the previous dataset on the last update (proves the layout was not restarted from scratch). */
  lastCarriedPositions: number;
  updatedAt: number;
}

interface GraphProbe {
  nodeScreenPoints(limit?: number): Array<[number, number]>;
  linkScreenPoints(limit?: number): Array<[number, number]>;
  /** v4.3 — like linkScreenPoints but keyed by link id (the proof suite asserts the clicked edge is the one that opened). */
  linkScreenPointsById(limit?: number): Array<{ id: string; source: string; target: string; x: number; y: number }>;
  /** GATE_2026-09-14 — per-node screen radius (CSS px) as actually drawn: 3D from the live sprite scale × camera projection, 2D = nodeRadiusPx. */
  nodeScreenRadii(limit?: number): Array<{ id: string; x: number; y: number; r: number; size: number; src: 'sprite' | 'circle' | 'fallback' }>;
  /** GATE_2026-09-14 — per-link intended px (linkWidthPx) and the px the live 3D tube / cylinder actually spans (2D: identical). */
  linkScreenWidths(limit?: number): Array<{ id: string; weight: number; emphasis: number; intendedPx: number; renderedPx: number | null }>;
  /** GATE_2026-09-14 — screen points along each link's quadratic curve (default t = 0.2 … 0.8). */
  linkScreenSamples(limit?: number, ts?: number[]): Array<{ id: string; source: string; target: string; points: Array<[number, number]> }>;
  /** GATE_2026-09-14 — live 3D projection constants (px per sprite-scale unit, px per world unit, fov, canvas height, camera distance). */
  live3D(): { pxPerScale: number; pxPerWorld: number; fov: number; canvasH: number; distance: number } | null;
  /** Recompute camera distance / zoom / counts / fill now and return the fresh snapshot. */
  metrics(): GraphStateSnapshot;
}

declare global {
  interface Window {
    __graphState?: GraphStateSnapshot;
    __graph?: GraphProbe;
  }
}

const EMPTY_EXPAND: ExpandTelemetry = { mode: 'none', reason: null, at: 0 };

export const EMPTY_GRAPH_STATE: GraphStateSnapshot = {
  mounted: false,
  mode: '3d',
  engineRunning: false,
  lastFitMs: null,
  lastFitOk: null,
  lastFitReason: null,
  cameraDistance: null,
  zoom: null,
  nodeCount: 0,
  edgeCount: 0,
  shownNodes: 0,
  shownEdges: 0,
  haloCount: 0,
  labelCount: 0,
  fullscreenActive: false,
  fullscreenMode: null,
  canvas: { width: 0, height: 0 },
  fillPct: null,
  dragCount: 0,
  lastDragDisplacement: null,
  fitSeq: 0,
  resetCount: 0,
  canvasClamped: false,
  fullscreenReason: null,
  lastPulse: null,
  canvasMeasured: { width: 0, height: 0 },
  minCanvasHeight: 0,
  expand: EMPTY_EXPAND,
  linkClicks: 0,
  linkHovers: 0,
  whyConnectedOpens: 0,
  lastLinkClick: null,
  halos: [],
  halosSuppressed: false,
  drawerOpen: false,
  graphInstanceId: null,
  dataUpdates: 0,
  lastCarriedPositions: 0,
  updatedAt: 0,
};

let current: GraphStateSnapshot = { ...EMPTY_GRAPH_STATE };

/** Merge a partial update into the snapshot and mirror it to `window.__graphState`. */
export function publishGraphState(patch: Partial<GraphStateSnapshot>): GraphStateSnapshot {
  current = { ...current, ...patch, updatedAt: Date.now() };
  if (typeof window !== 'undefined') window.__graphState = current;
  return current;
}

export function readGraphState(): GraphStateSnapshot {
  return current;
}

/** v4.3 — bump one of the edge-click hit counters (`linkClicks` / `linkHovers` / `whyConnectedOpens`) and return the new value. */
export function countGraphEvent(kind: 'linkClicks' | 'linkHovers' | 'whyConnectedOpens'): number {
  const next = current[kind] + 1;
  publishGraphState({ [kind]: next } as Partial<GraphStateSnapshot>);
  return next;
}

/** v4.3 — publish an Expand transition ({mode, reason}) together with the legacy fullscreen* fields. */
export function publishExpandState(mode: ExpandMode, reason: string | null): ExpandTelemetry {
  const expand: ExpandTelemetry = { mode, reason: mode === 'inpage' ? reason : null, at: Date.now() };
  publishGraphState({ expand, fullscreenActive: mode !== 'none', fullscreenMode: mode === 'fullscreen' ? 'native' : mode === 'inpage' ? 'fallback' : null, fullscreenReason: mode === 'inpage' ? reason : null });
  return expand;
}

/** Register the screen-point probe used by the proof suite to hover / click / drag real nodes. */
export function publishGraphProbe(probe: GraphProbe | null): void {
  if (typeof window === 'undefined') return;
  if (probe) window.__graph = probe;
  else delete window.__graph;
}

/** Reset (tests). */
export function resetGraphState(): void {
  current = { ...EMPTY_GRAPH_STATE };
  if (typeof window !== 'undefined') window.__graphState = current;
}
