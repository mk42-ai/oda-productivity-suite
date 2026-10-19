/**
 * BubbleGraph — interactive force-directed bubble graph with a 2D/3D toggle.
 *   3D: react-force-graph-3d (three.js, WebGL) — orbit camera (rotate / dolly / pan), node bubbles as sprites
 *       sized by evidence count and carrying the equal-size monochrome BrandIcon glyph, curved links whose
 *       thickness is the co-action weight, dashed community halos, click-to-select links.
 *   2D: react-force-graph-2d (canvas) with the same bubbles, curved links and dashed halos.
 * Strictly white / black / grey. Falls back to 2D when WebGL is unavailable.
 *
 * Sizing / fitting contract (v3.1 — fixes "Fit does not expand"):
 *   • the library does NOT observe its container → `useContainerSize` measures the wrapper and the numeric
 *     `width` / `height` props are the ONLY size the renderer knows; nothing is rendered while either is 0;
 *   • `zoomToFit` is a silent no-op before nodes have positions, on a 0-size canvas, on a stale ref or with an
 *     empty node filter → every fit goes through `graphFit.fitGraph`, which checks all four and reports why;
 *   • auto-fit happens ONCE per dataset on the first `onEngineStop` (after warmup 100 / cooldown 30 ticks) —
 *     later engine stops (a node drag reheats the simulation) never move the camera;
 *   • the parent drives explicit fits through the imperative handle (`fit()`, `resetView()`, `remeasure()`).
 * Hover tooltips are portal-rendered by `GraphTooltip` above the canvas; the library's HTML labels are off.
 *
 * v4.3 (DEF-017 edge-click-in-expand):
 *   • links are clickable / tappable in BOTH renderers with WIDE hit targets — 2D: `linkHoverPrecision` 10 px on the shadow
 *     canvas; 3D: an invisible TubeGeometry (radius ≈ 4× the visual width, 5–14 units) rides along every link through
 *     `linkThreeObject` + `linkThreeObjectExtend` + `linkPositionUpdate`, so raycasts hit edges, not just their 1-unit core;
 *   • `onSelectLink(id, payload)` carries a renderer-neutral WHY CONNECTED payload (source, target, mode, weight, window,
 *     EVID ids, pointer position) and the hit counters `linkClicks` / `linkHovers` are published to window.__graphState;
 *   • halo spheres / wireframes / labels are NON-raycastable (`raycast = noop`) and sized to each group's bounding sphere;
 *   • a dataset update (Run correlation, MAX AGE) is applied IN PLACE: positions are carried over (`mergeNodePositions`),
 *     the renderer is not remounted and the camera / zoom are kept (`shouldAutoFitOnData`) — `graphInstanceId` +
 *     `dataUpdates` in the telemetry prove it.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import ForceGraph3D, { type ForceGraphMethods as FG3DMethods, type LinkObject, type NodeObject } from 'react-force-graph-3d';
import ForceGraph2D, { type ForceGraphMethods as FG2DMethods } from 'react-force-graph-2d';
import * as THREE from 'three';
import type { Platform } from '@/lib/reputation/engine/rilian-types';
import type { CoMode } from '@/lib/reputation/engine/types';
import { BRAND_GLYPHS, LINKEDIN_MASK_URL } from './BrandIcon';
import { GraphTooltip, type GraphHover } from './GraphTooltip';
import { measureElement, useContainerSize } from './useContainerSize';
import { DEFAULT_FOV_DEG, FIT_DURATION_MS, LINK_HOVER_PRECISION_2D, MIN_CANVAS_HEIGHT, clampCanvasHeight, explainFit, fitGraph, fitPadding, haloBoundingSphere, hitTubeRadius, isDegreeZeroGroup, labelFontPx, labelMinScale, makeNonRaycastable, mergeNodePositions, reheatAndReset, resetDistance, shouldAutoFitOnData, sizeChangedEnough, type FitNode, linkWidthPx, nodeRadiusPx, placeLabel, pxPerWorldUnit, spriteScaleForPx, worldWidthForPx } from './graphFit';
import { countGraphEvent, publishGraphProbe, publishGraphState, type HaloTelemetry } from './graphState';
import { buildLinkPayload, pointerPositionOf, recordLinkClick, type LinkWhyPayload } from './linkPayload';
import './graph.css';

export type GraphMode = '2d' | '3d';
export type { LinkWhyPayload } from './linkPayload';

export interface BubbleNode {
  id: string;
  label: string;
  platform: Platform | null; // null → generic node (network / narrative / evidence …)
  community: number;
  size: number; // evidence count (bubble radius ∝ √size)
  synthetic?: boolean;
  watch?: boolean;
  historical?: boolean;
  kind?: string;
  title?: string; // legacy one-line tooltip (kept for callers that have nothing richer)
  /* tooltip data (v3.1) */
  networkId?: string | null;
  degree?: number;
  betweenness?: number;
  evidenceIds?: string[];
  /** B Capital port: subject hub photo (b.capital headshot / firm logo) painted inside the bubble when loaded; glyph otherwise. */
  photo?: string;
}
export interface BubbleLink {
  id: string;
  source: string;
  target: string;
  weight: number; // 0..1 → thickness
  title?: string;
  dotted?: boolean;
  /* tooltip data (v3.1) */
  byMode?: Partial<Record<CoMode, number>>;
  count?: number;
  minDelta?: number; // seconds
  windowSeconds?: number;
  evidenceIds?: string[];
  /** DEF-020: raw co-occurrence events behind the dedup-adjusted `count`, and the syndication (wire copy) verdict. */
  rawCount?: number;
  syndicated?: boolean;
}

export interface FitInfo {
  ok: boolean;
  durationMs: number;
  reason?: string;
  /** v4.3 — 1-based fit counter (DEF-006: the status line renders `fit #n` so idempotent fits still change the text). */
  seq?: number;
}
export type EngineState = 'running' | 'stopped';
/** 'unsized' = the wrapper has no box yet (0 px) so no renderer is mounted; 'mounted' = a ForceGraph instance exists. */
export type RendererState = 'unsized' | 'mounted';

export interface BubbleGraphHandle {
  /** Frame the active nodes now (400 ms, 40 px). Returns false when a guard skipped the fit (see `onFit`). */
  fit(): boolean;
  /** 3D: camera back to the front axis then fit · 2D: centre + zoom 1 then fit. */
  resetView(): void;
  /** Re-read the wrapper's box (fullscreenchange, panel drag end, inspector toggle, …). */
  remeasure(): void;
  getSize(): { width: number; height: number };
  isEngineStopped(): boolean;
  /** Viewport (client) coordinates of up to `limit` rendered nodes — used by the headless proof suite to hover real nodes. */
  nodeScreenPoints(limit?: number): Array<[number, number]>;
}

interface BubbleGraphProps {
  nodes: BubbleNode[];
  links: BubbleLink[];
  mode: GraphMode;
  selectedLinkId?: string | null;
  /** v4.3: the second argument is the WHY CONNECTED payload (endpoints, mode, weight, window, EVID ids, pointer position). */
  onSelectLink?: (id: string, payload: LinkWhyPayload) => void;
  onSelectNode?: (id: string) => void;
  onHoverNode?: (id: string | null) => void;
  onHoverLink?: (id: string | null) => void;
  highlightedCommunity?: number | null;
  /** Optional label per community index (e.g. "C1 · BCAP-001 · 7"). */
  communityLabels?: Record<number, string>;
  showHalos?: boolean;
  showLabels?: boolean;
  /**
   * Halo grouping (v4.2): 'network' draws one dashed ring per register id (BCAP-001…BCAP-004 — nodes without a register fall back
   * to their Louvain community), 'community' (default) one ring per community index. Labels come from `haloLabels` keyed by
   * the group key ('BCAP-002' or 'c3'), falling back to `communityLabels[communityIndex]`.
   */
  haloBy?: 'community' | 'network';
  haloLabels?: Record<string, string>;
  /** Legacy trigger: when this key changes, fit once the engine reports stopped (polled ≤ 3 s). */
  fitKey?: string;
  /** Ids of the nodes currently displayed / filtered — only these are framed by a fit. Default: all. */
  activeIds?: Set<string>;
  onFit?: (info: FitInfo) => void;
  onEngineState?: (state: EngineState) => void;
  /** Reports whether a renderer is mounted at all (the status line says 'canvas has no size' instead of 'engine running…'). */
  onRendererState?: (state: RendererState) => void;
  /** Run totals for the telemetry hook (`window.__graphState.nodeCount/edgeCount`); defaults to the shown counts. */
  totals?: { nodes: number; edges: number };
  /** Hovering a node darkens its links to #171717, dims the others to #E5E5E5 and unrelated nodes to 0.35. */
  hoverDims?: boolean;
  /** Re-fit automatically when the container changes by more than 24 px in either dimension (default true). */
  refitOnResize?: boolean;
  /** Run window (seconds) shown in the edge tooltip. */
  windowSeconds?: number;
  className?: string;
  testId?: string;
}

type FGNode = NodeObject<BubbleNode>;
type FGLink = LinkObject<BubbleNode, BubbleLink>;
type FG3D = FG3DMethods<NodeObject<BubbleNode>, LinkObject<BubbleNode, BubbleLink>>;
type FG2D = FG2DMethods<NodeObject<BubbleNode>, LinkObject<BubbleNode, BubbleLink>>;

const INK = '#171717';
/** B Capital brand accent (Caribbean Green) — subject-hub rings, selected links, halos. */
const BRAND = '#0AC985';
const BRAND_INK = '#047857';
const GREY = '#6B6B6B';
const HAIR = '#D4D4D4';
const HAIRLINE = '#E5E5E5';
const FILL = '#F5F5F5';
const EMPTY_LABELS: Record<number, string> = {};
const WARMUP_TICKS = 100;
const COOLDOWN_TICKS = 30;
const FIT_KEY_POLL_MS = 50;
const FIT_KEY_TIMEOUT_MS = 3000;
const RESIZE_REFIT_DEBOUNCE_MS = 120;

/** Link curvature (0 = straight, 1 = semicircle) — shared by both renderers and the screen-point diagnostics. */
const LINK_CURVATURE = 0.25;
/** Minimum on-screen radius (CSS px) of the 3D raycast hit tube around every link. */
export const HIT_TARGET_PX = 8;
/** Base fit padding (px, shrinks on small canvases via fitPadding) — 28 px keeps ≥ 88 % fill on a 460-637 px-tall panel. */
const FIT_PADDING_BASE_PX = 28;
const idOf = (v: FGNode | string | number | undefined): string => (typeof v === 'object' && v !== null ? String(v.id) : String(v));

/* ------------------------------------------------------------------ WebGL probe */
let webglSupport: boolean | null = null;
export function supportsWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement('canvas');
    webglSupport = Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/* ------------------------------------------------------------------ bubble raster (shared by 2D + 3D) */
const glyphPaths = new Map<string, Path2D>();
function glyphPath(platform: Platform): Path2D | null {
  if (platform === 'web' || platform === 'linkedin') return null;
  let p = glyphPaths.get(platform);
  if (!p) {
    p = new Path2D(BRAND_GLYPHS[platform].path);
    glyphPaths.set(platform, p);
  }
  return p;
}
let linkedinImg: HTMLImageElement | null = null;
/* B Capital port: cached photo bitmaps for the subject hubs — loaded once, painted clipped inside the bubble once `complete`. */
const photoCache = new Map<string, HTMLImageElement>();
let photoRedraw: (() => void) | null = null;
export function setPhotoRedraw(fn: (() => void) | null): void { photoRedraw = fn; }
function photoImage(src: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  let img = photoCache.get(src);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.onload = () => photoRedraw?.();
    img.src = src;
    photoCache.set(src, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}
function linkedinImage(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!linkedinImg) {
    linkedinImg = new Image();
    linkedinImg.src = LINKEDIN_MASK_URL;
  }
  return linkedinImg.complete && linkedinImg.naturalWidth > 0 ? linkedinImg : null;
}

/** Draw one bubble (circle + glyph) centred at (cx, cy) with radius r on a 2D context. */
/**
 * GATE_2026-09-14 (3D ring fidelity): `minLine` is the stroke floor in CANVAS px. The 2D painter draws in screen px (floor 1 px);
 * a 3D sprite is a 256-px texture minified to 2·r screen px, so its floor is `112 / r` canvas px — the ring of a 1-evidence bubble
 * stays ≥ 1 screen px in both renderers instead of thinning to 0.48 px in 3D (drawn radius unchanged: the stroke is centred on r).
 */
export function drawBubble(ctx: CanvasRenderingContext2D, node: BubbleNode, cx: number, cy: number, r: number, opts: { selected?: boolean; dim?: boolean; alpha?: number; minLine?: number } = {}): void {
  const floor = Math.max(1, opts.minLine ?? 1);
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? (opts.dim ? 0.25 : 1);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = opts.selected ? INK : '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = node.watch ? Math.max(1.5 * floor, r * 0.12) : Math.max(floor, r * 0.08);
  ctx.strokeStyle = node.historical ? GREY : node.kind === 'subject' ? BRAND : INK;
  if (node.synthetic) ctx.setLineDash([r * 0.25, r * 0.18]);
  ctx.stroke();
  if (node.watch) {
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(floor, r * 0.06);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // glyph
  const g = r * 0.5; // glyph half-size → 50 % of the diameter
  const ink = opts.selected ? '#FFFFFF' : node.platform === 'x' ? '#000000' : INK;
  const photo = node.photo ? photoImage(node.photo) : null;
  if (photo) {
    // subject hub: the real headshot / logo clipped to the bubble (cover-fit), ring on top
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
    ctx.clip();
    const s = Math.max((r * 1.76) / photo.naturalWidth, (r * 1.76) / photo.naturalHeight);
    const w = photo.naturalWidth * s, h = photo.naturalHeight * s;
    ctx.drawImage(photo, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  } else if (node.platform) {
    const path = glyphPath(node.platform);
    if (path) {
      ctx.translate(cx - g, cy - g);
      ctx.scale((g * 2) / 24, (g * 2) / 24);
      ctx.fillStyle = ink;
      ctx.fill(path);
    } else if (node.platform === 'linkedin') {
      const img = linkedinImage();
      if (img) ctx.drawImage(img, cx - g, cy - g, g * 2, g * 2);
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, g * 0.75, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(floor, r * 0.06);
      ctx.strokeStyle = ink;
      ctx.stroke();
    }
  } else {
    // generic (non-account) node: small square
    ctx.fillStyle = ink;
    ctx.fillRect(cx - g * 0.6, cy - g * 0.6, g * 1.2, g * 1.2);
  }
  ctx.restore();
}

/** VISUAL_FIX (defect 1): r = clamp(6 + (√evid − 1) × 2.2, 6, 24) — graphFit.nodeRadiusPx; the watch-list double ring scales with r (drawBubble). */
function bubbleRadius(size: number): number {
  return nodeRadiusPx(size);
}
/** Visual radius of a 3D node sprite (bubble + label plate) in graph units — symmetric fallback for the 3D fit. */
function sprite3DRadius(n: { size?: number }): number {
  return bubbleRadius(n.size ?? 1) * 2.2;
}
/**
 * Directional extents of the 3D sprite around the node centre (graph units): the sprite is 1.15 × the bubble
 * diameter wide; with labels it is 344/256 as tall and anchored at 63 % from the bottom (label plate below).
 */
function sprite3DExtent(n: { size?: number }, withLabel: boolean): { up: number; down: number; side: number } {
  const w = bubbleRadius(n.size ?? 1) * 2 * 1.15;
  if (!withLabel) return { up: w / 2, down: w / 2, side: w / 2 };
  const h = w * (344 / 256);
  return { up: h * 0.37, down: h * 0.63, side: w / 2 };
}

/** Canvas texture for the 3D sprite: bubble on top, label underneath. */
/** Bubble radius inside the 256-px sprite texture (the bubble is 224/256 of the sprite width). */
export const SPRITE_BUBBLE_R = 112;
export const SPRITE_TEX_W = 256;
function makeSpriteCanvas(node: BubbleNode, withLabel: boolean, selected: boolean): HTMLCanvasElement {
  const W = SPRITE_TEX_W;
  const H = withLabel ? 344 : SPRITE_TEX_W;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  // GATE_2026-09-14: 112 texture px project to nodeRadiusPx(size) screen px → a 1-screen-px stroke is 112 / r texture px
  drawBubble(ctx, node, W / 2, 128, SPRITE_BUBBLE_R, { selected, minLine: SPRITE_BUBBLE_R / nodeRadiusPx(node.size) });
  if (withLabel) {
    ctx.font = '600 30px "Geist Variable", ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const text = node.label.length > 22 ? `${node.label.slice(0, 21)}…` : node.label;
    const w = ctx.measureText(text).width + 24;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect(W / 2 - w / 2, 262, w, 44);
    ctx.strokeStyle = HAIR;
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - w / 2, 262, w, 44);
    ctx.fillStyle = INK;
    ctx.fillText(text, W / 2, 268);
  }
  return canvas;
}

/* ------------------------------------------------------------------ component */
export const BubbleGraph = forwardRef<BubbleGraphHandle, BubbleGraphProps>(function BubbleGraph(
  {
    nodes,
    links,
    mode,
    selectedLinkId = null,
    onSelectLink,
    onSelectNode,
    onHoverNode,
    onHoverLink,
    highlightedCommunity = null,
    communityLabels = EMPTY_LABELS,
    showHalos = true,
    showLabels = true,
    haloBy = 'community',
    haloLabels,
    fitKey,
    activeIds,
    onFit,
    onEngineState,
    onRendererState,
    totals,
    hoverDims = true,
    refitOnResize = true,
    windowSeconds,
    className,
    testId = 'bubble-graph',
  },
  ref,
) {
  const { ref: wrapRef, width, height: measuredHeight, remeasure, element: wrapEl } = useContainerSize<HTMLDivElement>();
  // v4.3 DEF-001 residual: the renderer never gets a box shorter than MIN_CANVAS_HEIGHT (a 0 px wrapper still mounts nothing)
  const { height, clamped: heightClamped } = clampCanvasHeight(measuredHeight);
  const sized = width > 0 && height > 0;
  const fg3d = useRef<FG3D | undefined>(undefined);
  const fg2d = useRef<FG2D | undefined>(undefined);
  const effectiveMode: GraphMode = mode === '3d' && supportsWebGL() ? '3d' : '2d';
  const [hover, setHover] = useState<GraphHover | null>(null);

  // graphData must be a stable object per dataset (force-graph mutates nodes with x/y/z). v4.3: a new dataset inherits the
  // positions of the nodes it shares with the previous one, so a Run / filter re-heats the layout from where it stands
  // (no restart from the phyllotaxis seed, no camera jump) — the count of carried positions is published as telemetry.
  const prevDataRef = useRef<{ nodes: FGNode[]; links: FGLink[] } | null>(null);
  const carriedRef = useRef(0);
  const graphData = useMemo(() => {
    const nextNodes = nodes.map((n) => ({ ...n })) as FGNode[];
    carriedRef.current = mergeNodePositions(prevDataRef.current?.nodes ?? null, nextNodes);
    return { nodes: nextNodes, links: links.map((l) => ({ ...l })) as FGLink[] };
  }, [nodes, links]);
  const instanceId = useRef<string>(`bg-${Math.random().toString(36).slice(2, 10)}`);
  const dataUpdates = useRef(0);
  const rendererKey = useRef<GraphMode | null>(null);
  const nodeById = useMemo(() => new Map(graphData.nodes.map((n) => [String(n.id), n])), [graphData]);
  // B Capital port: when a hub photo finishes loading, invalidate the 3D sprite cache / repaint the 2D canvas so the headshot appears
  const [photoTick, setPhotoTick] = useState(0);
  useEffect(() => {
    setPhotoRedraw(() => setPhotoTick((t) => t + 1));
    return () => setPhotoRedraw(null);
  }, []);

  const activeSet = useMemo(() => activeIds ?? new Set(graphData.nodes.map((n) => String(n.id))), [activeIds, graphData]);

  /* ---------- latest values for imperative / library callbacks (declared first so later effects read fresh values) */
  const latest = useRef({ width, height, effectiveMode, activeSet, graphData, onFit, onEngineState, onRendererState, wrapEl, showLabels, showHalos, totals, windowSeconds });
  useEffect(() => {
    latest.current = { width, height, effectiveMode, activeSet, graphData, onFit, onEngineState, onRendererState, wrapEl, showLabels, showHalos, totals, windowSeconds };
  });

  /* ---------- engine state + fit bookkeeping */
  const engineState = useRef<EngineState | null>(null);
  const autoFitDone = useRef(false);
  const fitSeq = useRef(0); // v4.3 DEF-006
  const fitOnStop = useRef(false); // v4.3 DEF-006: fit again once the re-heated engine settles
  const resetCount = useRef(0);
  const lastFitSize = useRef<{ width: number; height: number } | null>(null);
  const pendingFit = useRef(false);
  const setEngine = useCallback((next: EngineState): void => {
    if (engineState.current === next) return;
    engineState.current = next;
    latest.current.onEngineState?.(next);
    publishGraphState({ engineRunning: next === 'running' });
  }, []);
  const halo2DCount = useRef(0);
  const dragCount = useRef(0);

  /* ---------- screen coordinates of rendered nodes (proof-suite hook, also mirrored to data-node-screen-points) */
  const nodeScreenPoints = useCallback((limit = 16): Array<[number, number]> => {
    const { effectiveMode: m, graphData: data, wrapEl } = latest.current;
    const fg = m === '3d' ? fg3d.current : fg2d.current;
    if (!fg || !wrapEl) return [];
    const rect = wrapEl.getBoundingClientRect();
    const out: Array<[number, number]> = [];
    for (const n of data.nodes) {
      if (out.length >= limit) break;
      if (typeof n.x !== 'number' || typeof n.y !== 'number') continue;
      const p = m === '3d' ? (fg as FG3D).graph2ScreenCoords(n.x, n.y, n.z ?? 0) : (fg as FG2D).graph2ScreenCoords(n.x, n.y);
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      if (p.x < 0 || p.y < 0 || p.x > rect.width || p.y > rect.height) continue;
      out.push([Math.round(rect.left + p.x), Math.round(rect.top + p.y)]);
    }
    return out;
  }, []);
  /** Viewport coordinates of the curve midpoint of up to `limit` links (same curvature maths as force-graph / three-forcegraph), keyed by link id. */
  const linkScreenPointsById = useCallback((limit = 16): Array<{ id: string; source: string; target: string; x: number; y: number }> => {
    const { effectiveMode: m, graphData: data, wrapEl } = latest.current;
    const fg = m === '3d' ? fg3d.current : fg2d.current;
    if (!fg || !wrapEl) return [];
    const rect = wrapEl.getBoundingClientRect();
    const byId = new Map(data.nodes.map((n) => [String(n.id), n]));
    const out: Array<{ id: string; source: string; target: string; x: number; y: number }> = [];
    for (const l of data.links) {
      if (out.length >= limit) break;
      const a = byId.get(idOf(l.source));
      const b = byId.get(idOf(l.target));
      if (!a || !b || typeof a.x !== 'number' || typeof a.y !== 'number' || typeof b.x !== 'number' || typeof b.y !== 'number') continue;
      let mx: number;
      let my: number;
      let mz = 0;
      if (m === '3d') {
        const az = a.z ?? 0;
        const bz = b.z ?? 0;
        // control point = (vLine × ẑ) · curvature + midpoint (curveRotation 0)
        const vx = b.x - a.x;
        const vy = b.y - a.y;
        const vz = bz - az;
        const cx = (vy * 1 - vz * 0) * LINK_CURVATURE + (a.x + b.x) / 2;
        const cy = (vz * 0 - vx * 1) * LINK_CURVATURE + (a.y + b.y) / 2;
        const cz = (vx * 0 - vy * 0) * LINK_CURVATURE + (az + bz) / 2;
        mx = 0.25 * a.x + 0.5 * cx + 0.25 * b.x;
        my = 0.25 * a.y + 0.5 * cy + 0.25 * b.y;
        mz = 0.25 * az + 0.5 * cz + 0.25 * bz;
      } else {
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        const d = len * LINK_CURVATURE;
        const cx = (a.x + b.x) / 2 + d * Math.cos(ang - Math.PI / 2);
        const cy = (a.y + b.y) / 2 + d * Math.sin(ang - Math.PI / 2);
        mx = 0.25 * a.x + 0.5 * cx + 0.25 * b.x;
        my = 0.25 * a.y + 0.5 * cy + 0.25 * b.y;
      }
      const p = m === '3d' ? (fg as FG3D).graph2ScreenCoords(mx, my, mz) : (fg as FG2D).graph2ScreenCoords(mx, my);
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      if (p.x < 0 || p.y < 0 || p.x > rect.width || p.y > rect.height) continue;
      out.push({ id: l.id, source: idOf(l.source), target: idOf(l.target), x: Math.round(rect.left + p.x), y: Math.round(rect.top + p.y) });
    }
    return out;
  }, []);
  const linkScreenPoints = useCallback((limit = 16): Array<[number, number]> => linkScreenPointsById(limit).map((p) => [p.x, p.y] as [number, number]), [linkScreenPointsById]);
  const publishScreenPoints = useCallback((): void => {
    const el = latest.current.wrapEl;
    if (!el) return;
    try {
      el.setAttribute('data-node-screen-points', JSON.stringify(nodeScreenPoints(16)));
      el.setAttribute('data-link-screen-points', JSON.stringify(linkScreenPoints(16)));
    } catch {
      /* ignore — diagnostics only */
    }
  }, [nodeScreenPoints, linkScreenPoints]);

  /** Fraction (0-100) of the limiting canvas axis covered by the rendered nodes incl. their sprite / bubble extents. */
  const computeFill = useCallback((): number | null => {
    const { effectiveMode: m, graphData: data, width: w, height: h, showLabels: labels } = latest.current;
    const fg = m === '3d' ? fg3d.current : fg2d.current;
    if (!fg || !(w > 0 && h > 0)) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const add = (px: number, py: number): void => {
      if (!Number.isFinite(px) || !Number.isFinite(py)) return;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    };
    // 3D sprites are billboards: offset their extents along the camera's right / up axes (world space), not the world axes
    let right = { x: 1, y: 0, z: 0 };
    let up = { x: 0, y: 1, z: 0 };
    if (m === '3d') {
      try {
        const el = (fg as FG3D).camera().matrixWorld.elements;
        right = { x: el[0], y: el[1], z: el[2] };
        up = { x: el[4], y: el[5], z: el[6] };
      } catch {
        /* keep world axes */
      }
    }
    for (const n of data.nodes) {
      if (typeof n.x !== 'number' || typeof n.y !== 'number') continue;
      if (m === '3d') {
        const e = sprite3DExtent(n, labels);
        const z = n.z ?? 0;
        for (const [k, axis] of [
          [0, right],
          [e.side, right],
          [-e.side, right],
          [e.up, up],
          [-e.down, up],
        ] as Array<[number, { x: number; y: number; z: number }]>) {
          const p = (fg as FG3D).graph2ScreenCoords(n.x + axis.x * k, n.y + axis.y * k, z + axis.z * k);
          add(p.x, p.y);
        }
      } else {
        const p = (fg as FG2D).graph2ScreenCoords(n.x, n.y);
        const k = (fg as FG2D).zoom();
        const r = bubbleRadius(n.size) * 0.55 * k;
        add(p.x - r, p.y - r);
        add(p.x + r, p.y + r + (labels ? 14 : 0));
      }
    }
    if (!Number.isFinite(minX)) return null;
    return Math.round(Math.max((maxX - minX) / w, (maxY - minY) / h) * 1000) / 10;
  }, []);
  const publishMetrics = useCallback((): ReturnType<typeof publishGraphState> => {
    const { effectiveMode: m, graphData: data, width: w, height: h, showLabels: labels, showHalos: halosOn, totals: tot } = latest.current;
    const fg = m === '3d' ? fg3d.current : fg2d.current;
    let cameraDistance: number | null = null;
    let zoom: number | null = null;
    if (fg) {
      try {
        if (m === '3d') {
          const cam = (fg as FG3D).camera();
          const ctl = (fg as FG3D).controls() as { target?: { x: number; y: number; z: number } };
          const t = ctl.target ?? { x: 0, y: 0, z: 0 };
          cameraDistance = Math.round(Math.hypot(cam.position.x - t.x, cam.position.y - t.y, cam.position.z - t.z) * 100) / 100;
        } else {
          zoom = Math.round((fg as FG2D).zoom() * 10000) / 10000;
        }
      } catch {
        /* renderer torn down */
      }
    }
    return publishGraphState({
      mounted: !!fg,
      mode: m,
      cameraDistance,
      zoom,
      shownNodes: data.nodes.length,
      shownEdges: data.links.length,
      nodeCount: tot?.nodes ?? data.nodes.length,
      edgeCount: tot?.edges ?? data.links.length,
      haloCount: !halosOn ? 0 : m === '3d' ? halos.current.size : halo2DCount.current,
      labelCount: labels && fg ? data.nodes.length : 0,
      canvas: { width: w, height: h },
      fillPct: computeFill(),
      halos: halosOn ? haloTelemetry.current : [],
      graphInstanceId: instanceId.current,
      dataUpdates: dataUpdates.current,
      lastCarriedPositions: carriedRef.current,
    });
  }, [computeFill]);
  /** v4.3: per-group bounding spheres of the halos as last laid out (both renderers write it; the telemetry mirrors it). */
  const haloTelemetry = useRef<HaloTelemetry[]>([]);

  const doFit = useCallback((): boolean => {
    const { width: w, height: h, effectiveMode: m, activeSet: ids, graphData: data, onFit: report } = latest.current;
    const fg = m === '3d' ? fg3d.current : fg2d.current;
    const args = { fg, nodes: data.nodes, activeIds: ids, mode: m, width: w, height: h, paddingPx: fitPadding(w, h, FIT_PADDING_BASE_PX), nodeRadius: (n: FitNode) => sprite3DRadius(n as { size?: number }), nodeExtent: (n: FitNode) => sprite3DExtent(n as { size?: number }, latest.current.showLabels) };
    const reason = explainFit(args);
    const ok = reason === null && fitGraph(args);
    if (ok) lastFitSize.current = { width: w, height: h };
    if (ok) {
      window.setTimeout(() => {
        publishScreenPoints();
        publishMetrics();
      }, FIT_DURATION_MS + 80);
    } else if (reason === 'layout has no positions yet' && fg) {
      // react-force-graph #231/#593: zoomToFit is a silent no-op before positions exist → re-heat and fit on onEngineStop
      autoFitDone.current = false;
      try {
        (fg as { d3ReheatSimulation?: () => unknown }).d3ReheatSimulation?.();
      } catch {
        /* ignore */
      }
    }
    if (ok) fitSeq.current += 1;
    publishGraphState({ lastFitOk: ok, lastFitMs: ok ? FIT_DURATION_MS : 0, lastFitReason: ok ? null : (reason ?? 'zoomToFit refused'), fitSeq: fitSeq.current });
    report?.(ok ? { ok: true, durationMs: FIT_DURATION_MS, seq: fitSeq.current } : { ok: false, durationMs: 0, reason: reason ?? 'zoomToFit refused' });
    return ok;
  }, [publishScreenPoints, publishMetrics]);

  // a new dataset or renderer → decide whether the one-shot auto-fit is armed again. v4.3 (DEF-017 / no-remount-on-run): a
  // fresh renderer (first mount, 2D↔3D switch) or the first non-empty dataset is framed; a later IN-PLACE update (Run
  // correlation, MAX AGE) keeps the analyst's camera / zoom — the positions were carried over, Fit stays one click away.
  useEffect(() => {
    const fresh = rendererKey.current !== effectiveMode || prevDataRef.current === null;
    const prevCount = prevDataRef.current?.nodes.length ?? 0;
    const arm = shouldAutoFitOnData(prevCount, graphData.nodes.length, fresh);
    autoFitDone.current = !arm;
    lastFitSize.current = arm ? null : lastFitSize.current;
    if (prevDataRef.current !== null && prevDataRef.current !== graphData && rendererKey.current === effectiveMode) dataUpdates.current += 1;
    rendererKey.current = effectiveMode;
    prevDataRef.current = graphData;
    publishGraphState({ graphInstanceId: instanceId.current, dataUpdates: dataUpdates.current, lastCarriedPositions: carriedRef.current });
  }, [graphData, effectiveMode]);

  /* ---------- hover → neighbourhood + per-node opacity */
  const hoverNodeId = hover?.kind === 'node' ? String(hover.node.id) : null;
  const hoverLinkId = hover?.kind === 'link' ? hover.link.id : null;
  const neighbours = useMemo(() => {
    if (!hoverNodeId) return null;
    const s = new Set<string>([hoverNodeId]);
    for (const l of graphData.links) {
      const a = idOf(l.source);
      const b = idOf(l.target);
      if (a === hoverNodeId) s.add(b);
      if (b === hoverNodeId) s.add(a);
    }
    return s;
  }, [hoverNodeId, graphData]);
  const nodeAlpha = useCallback(
    (n: FGNode): number => {
      if (highlightedCommunity !== null && n.community !== highlightedCommunity) return 0.25;
      if (hoverDims && neighbours && !neighbours.has(String(n.id))) return 0.35;
      return 1;
    },
    [highlightedCommunity, hoverDims, neighbours],
  );
  const nodeAlphaRef = useRef(nodeAlpha);
  useEffect(() => {
    nodeAlphaRef.current = nodeAlpha;
  }, [nodeAlpha]);

  /* ---------- 3D sprites (cached per node id + label state; hover/highlight only touch material opacity) */
  const spriteCache = useRef(new Map<string, THREE.Sprite>());
  useEffect(() => {
    spriteCache.current.clear();
    // force three-forcegraph to rebuild the node objects (new sprites with the loaded photo)
    const fg = fg3d.current as unknown as { refresh?: () => void } | undefined;
    fg?.refresh?.();
  }, [graphData, showLabels, height, photoTick]);
  // VISUAL_FIX_2 (gate 3): sprites are SCREEN-SPACE — `sizeAttenuation: false` + a scale that projects the bubble to exactly
  // 2 × nodeRadiusPx(size) pixels on the current canvas height, whatever the camera distance (no more 222–305 px bubbles after a fit).
  const nodeThreeObject = useCallback(
    (n: FGNode): THREE.Object3D => {
      const key = `${n.id}|${showLabels ? 1 : 0}|${height}|${photoTick}`;
      let sprite = spriteCache.current.get(key);
      if (!sprite) {
        const canvas = makeSpriteCanvas(n, showLabels, false);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: nodeAlphaRef.current(n), sizeAttenuation: false });
        sprite = new THREE.Sprite(mat);
        const bubblePx = nodeRadiusPx(n.size) * 2; // bubble is 224/256 of the sprite width (drawBubble radius 112 on a 256 canvas)
        const widthPx = bubblePx * (256 / 224);
        const sx = spriteScaleForPx(widthPx, height);
        sprite.scale.set(sx, sx * (canvas.height / canvas.width), 1);
        sprite.center.set(0.5, showLabels ? 0.63 : 0.5);
        spriteCache.current.set(key, sprite);
      }
      return sprite;
    },
    [showLabels, height, photoTick],
  );
  // VISUAL_FIX_2 (gate 3): 3D link cylinders are world-sized in three-forcegraph (radius = linkWidth / 2), so the world width is
  // re-derived from the live camera distance → constant 1–6 px on screen. Updated on every camera change (throttled) and after fits.
  const [pxPerWorld3d, setPxPerWorld3d] = useState(1);
  useEffect(() => {
    if (effectiveMode !== '3d') return undefined;
    let raf = 0;
    let last = 0;
    const measure = (): void => {
      const fg = fg3d.current;
      if (!fg) return;
      try {
        const cam = (fg as FG3D).camera() as { position: { x: number; y: number; z: number }; fov?: number };
        const ctl = (fg as FG3D).controls() as { target?: { x: number; y: number; z: number }; addEventListener?: (t: string, f: () => void) => void; removeEventListener?: (t: string, f: () => void) => void };
        const t = ctl.target ?? { x: 0, y: 0, z: 0 };
        const d = Math.hypot(cam.position.x - t.x, cam.position.y - t.y, cam.position.z - t.z);
        const k = pxPerWorldUnit(d, latest.current.height, cam.fov ?? 50);
        setPxPerWorld3d((prev) => (Math.abs(prev - k) / Math.max(prev, 1e-6) > 0.05 ? k : prev));
      } catch {
        /* renderer torn down */
      }
    };
    const onChange = (): void => {
      const now = performance.now();
      if (now - last < 100) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(measure);
        return;
      }
      last = now;
      measure();
    };
    const id = window.setInterval(measure, 500); // covers programmatic fits / transitions that emit no controls event
    type Ctl = { addEventListener?: (t: string, f: () => void) => void; removeEventListener?: (t: string, f: () => void) => void };
    let ctl: Ctl | null = null;
    try {
      ctl = ((fg3d.current as FG3D | null)?.controls() as unknown as Ctl | undefined) ?? null;
      ctl?.addEventListener?.('change', onChange);
    } catch {
      ctl = null;
    }
    measure();
    return () => {
      window.clearInterval(id);
      cancelAnimationFrame(raf);
      ctl?.removeEventListener?.('change', onChange);
    };
  }, [effectiveMode, height, graphData]);
  // 3D: opacity is applied to the cached sprite materials directly (no scene re-population on hover)
  useEffect(() => {
    if (effectiveMode !== '3d') return;
    for (const n of graphData.nodes) {
      const sprite = spriteCache.current.get(`${n.id}|${showLabels ? 1 : 0}`);
      if (sprite) (sprite.material as THREE.SpriteMaterial).opacity = nodeAlpha(n);
    }
  }, [effectiveMode, graphData, showLabels, nodeAlpha]);

  /* ---------- halo groups: per network id (v4.2 default for the correlation canvas) or per Louvain community */
  const haloGroups = useCallback((): Array<{ key: string; members: FGNode[]; label: string | undefined; focus: boolean }> => {
    const groups = new Map<string, FGNode[]>();
    for (const n of graphData.nodes) {
      if (typeof n.x !== 'number') continue;
      const key = haloBy === 'network' && n.networkId ? n.networkId : `c${n.community}`;
      groups.set(key, [...(groups.get(key) ?? []), n]);
    }
    const out: Array<{ key: string; members: FGNode[]; label: string | undefined; focus: boolean }> = [];
    for (const [key, members] of groups) {
      if (members.length < 2) continue;
      // DEF-023: no ring around a group of degree-0 nodes — the isolate community (last index) or a NET register whose displayed
      // members are all isolates; the C1…Cn labels of the linked communities are untouched
      if (isDegreeZeroGroup(members)) continue;
      const label = haloLabels?.[key] ?? (key.startsWith('c') ? communityLabels[Number(key.slice(1))] : `${key} · ${members.length}`);
      const focus = highlightedCommunity !== null && members.some((m) => m.community === highlightedCommunity);
      out.push({ key, members, label, focus });
    }
    return out;
  }, [graphData, haloBy, haloLabels, communityLabels, highlightedCommunity]);

  /* ---------- 3D halos (one translucent sphere + dashed wireframe per group) */
  const halos = useRef(new Map<string, { sphere: THREE.Mesh; wire: THREE.LineSegments; label: THREE.Sprite | null }>());
  const disposeHalos = useCallback(() => {
    const scene = fg3d.current?.scene();
    for (const h of halos.current.values()) {
      scene?.remove(h.sphere);
      scene?.remove(h.wire);
      if (h.label) scene?.remove(h.label);
      h.sphere.geometry.dispose();
      (h.sphere.material as THREE.Material).dispose();
      h.wire.geometry.dispose();
      (h.wire.material as THREE.Material).dispose();
    }
    halos.current.clear();
  }, []);
  useEffect(() => () => disposeHalos(), [disposeHalos]);
  useEffect(() => {
    disposeHalos();
  }, [graphData, effectiveMode, haloBy, disposeHalos]);

  const updateHalos3D = useCallback(() => {
    const fg = fg3d.current;
    if (!fg || effectiveMode !== '3d') return;
    const scene = fg.scene();
    if (!showHalos) {
      if (halos.current.size) disposeHalos();
      return;
    }
    const tele: HaloTelemetry[] = [];
    for (const { key: c, members, label: text, focus } of haloGroups()) {
      // v4.3: exact bounding sphere of the member sprites (centroid + max distance + bubble radius), refreshed on every tick / stop
      const sphereFit = haloBoundingSphere(
        members.map((n) => ({ x: n.x ?? 0, y: n.y ?? 0, z: n.z ?? 0, r: bubbleRadius(n.size) })),
        6,
      );
      if (!sphereFit) continue;
      const { cx, cy, cz, r } = sphereFit;
      tele.push({ key: c, members: members.length, cx: Math.round(cx), cy: Math.round(cy), cz: Math.round(cz), r: Math.round(r * 10) / 10 });
      let h = halos.current.get(c);
      if (!h) {
        // v4.3: halos never answer a raycast (raycast = noop) and render behind the graph objects
        const sphere = makeNonRaycastable(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0.06, depthWrite: false })));
        sphere.renderOrder = -2;
        const wireGeo = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1, 1));
        const wire = makeNonRaycastable(new THREE.LineSegments(wireGeo, new THREE.LineDashedMaterial({ color: BRAND, dashSize: 0.08, gapSize: 0.08, transparent: true, opacity: 0.45 })));
        wire.renderOrder = -1;
        wire.computeLineDistances();
        let label: THREE.Sprite | null = null;
        if (text) {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.font = '600 34px "Geist Variable", ui-sans-serif, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            const w = ctx.measureText(text).width + 30;
            ctx.fillRect(256 - w / 2, 8, w, 48);
            ctx.strokeStyle = INK;
            ctx.setLineDash([8, 6]);
            ctx.lineWidth = 3;
            ctx.strokeRect(256 - w / 2, 8, w, 48);
            ctx.fillStyle = INK;
            ctx.fillText(text, 256, 32);
          }
          const tex = new THREE.CanvasTexture(canvas);
          tex.colorSpace = THREE.SRGBColorSpace;
          label = makeNonRaycastable(new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })));
          label.renderOrder = -1;
        }
        h = { sphere, wire, label };
        scene.add(sphere);
        scene.add(wire);
        if (label) scene.add(label);
        halos.current.set(c, h);
      }
      (h.sphere.material as THREE.MeshBasicMaterial).opacity = focus ? 0.12 : highlightedCommunity !== null ? 0.02 : 0.045;
      (h.wire.material as THREE.LineDashedMaterial).opacity = focus ? 0.7 : 0.28; // VISUAL_FIX (defect 3): halo wireframe stays a hint, the solid bubbles read first
      (h.wire.material as THREE.LineDashedMaterial).color.set(focus ? BRAND_INK : BRAND);
      h.sphere.position.set(cx, cy, cz);
      h.sphere.scale.setScalar(r);
      h.wire.position.set(cx, cy, cz);
      h.wire.scale.setScalar(r);
      if (h.label) {
        // plate sits just inside the halo's top edge so the fit (node bbox + padding) never clips it
        h.label.position.set(cx, cy + r * 0.82, cz);
        h.label.scale.set(r * 1.6, r * 0.2, 1);
      }
    }
    haloTelemetry.current = tele;
  }, [showHalos, highlightedCommunity, effectiveMode, disposeHalos, haloGroups]);
  // keep the disposal branch honest for the telemetry: 0 halos when hidden
  useEffect(() => {
    if (effectiveMode === '3d' && !showHalos) publishGraphState({ haloCount: 0 });
  }, [effectiveMode, showHalos]);

  // halos also follow highlight / toggle / label changes while the engine is idle
  useEffect(() => {
    updateHalos3D();
  }, [updateHalos3D]);

  /* ---------- engine callbacks */
  const handleEngineTick = useCallback(() => {
    setEngine('running');
    if (effectiveMode === '3d') updateHalos3D();
  }, [setEngine, effectiveMode, updateHalos3D]);
  const handleEngineStop = useCallback(() => {
    setEngine('stopped');
    window.setTimeout(() => {
      publishScreenPoints();
      publishMetrics();
    }, 50);
    if (fitOnStop.current) {
      // v4.3 DEF-006: Reset re-heated the simulation → frame the re-laid-out graph once it settles
      fitOnStop.current = false;
      window.setTimeout(() => doFit(), 40);
    }
    if (effectiveMode === '3d') updateHalos3D();
    if (!autoFitDone.current) {
      autoFitDone.current = true; // once per dataset — a drag re-heats the engine and must not move the camera
      doFit();
      // self-check: if the frame still covers < 60 % of the limiting axis once the transition is over (positions moved
      // during the first fit), fit once more — keeps the 2D renderer switch from settling on an under-fitted frame
      window.setTimeout(() => {
        const m = publishMetrics();
        if (m.fillPct !== null && m.fillPct < 60 && engineState.current === 'stopped') doFit();
      }, FIT_DURATION_MS + 200);
    }
  }, [setEngine, effectiveMode, updateHalos3D, doFit, publishScreenPoints, publishMetrics]);

  /* ---------- renderer mounted / unsized → status line + telemetry */
  useEffect(() => {
    latest.current.onRendererState?.(sized ? 'mounted' : 'unsized');
    publishGraphState({ mounted: sized, canvas: { width, height }, canvasMeasured: { width, height: measuredHeight }, minCanvasHeight: MIN_CANVAS_HEIGHT, mode: effectiveMode, canvasClamped: heightClamped, graphInstanceId: instanceId.current });
  }, [sized, width, height, measuredHeight, effectiveMode, heightClamped]);
  /* ---------- GATE_2026-09-14 probes: what the renderer ACTUALLY draws, read back from the live scene (not from the props)
     nodeScreenRadii — 3D: the sprite's live scale projected through the live camera fov and canvas client height
     (sizeAttenuation:false → px = scale · H / (2·tan(fov/2)); bubble = 224/256 of the sprite); 2D: nodeRadiusPx(size) (÷ zoom × zoom).
     linkScreenWidths — 3D: the live tube / cylinder radius (world units, three-forcegraph rounds it up to 0.1) × live px-per-world;
     2D: linkWidthPx(weight, emphasis) (force-graph divides lineWidth by the zoom → screen px).
     linkScreenSamples — five points along each link's quadratic curve (t = 0.2 … 0.8), for width readings away from crossings. */
  const live3D = useCallback((): { pxPerScale: number; pxPerWorld: number; fov: number; canvasH: number; distance: number } | null => {
    const fg = fg3d.current;
    if (!fg) return null;
    try {
      const cam = (fg as FG3D).camera() as { position: { x: number; y: number; z: number }; fov?: number };
      const ctl = (fg as FG3D).controls() as { target?: { x: number; y: number; z: number } };
      const canvas = (fg as FG3D).renderer().domElement;
      const canvasH = canvas.clientHeight || latest.current.height;
      const fov = cam.fov ?? DEFAULT_FOV_DEG;
      const t = ctl.target ?? { x: 0, y: 0, z: 0 };
      const distance = Math.hypot(cam.position.x - t.x, cam.position.y - t.y, cam.position.z - t.z);
      return { pxPerScale: canvasH / (2 * Math.tan((fov * Math.PI) / 360)), pxPerWorld: pxPerWorldUnit(distance, canvasH, fov), fov, canvasH, distance };
    } catch {
      return null;
    }
  }, []);
  const nodeScreenRadii = useCallback((limit = 4000): Array<{ id: string; x: number; y: number; r: number; size: number; src: 'sprite' | 'circle' | 'fallback' }> => {
    const { effectiveMode: m, graphData: data, wrapEl } = latest.current;
    const fg = m === '3d' ? fg3d.current : fg2d.current;
    if (!fg || !wrapEl) return [];
    const rect = wrapEl.getBoundingClientRect();
    const l3 = m === '3d' ? live3D() : null;
    const out: Array<{ id: string; x: number; y: number; r: number; size: number; src: 'sprite' | 'circle' | 'fallback' }> = [];
    for (const n of data.nodes) {
      if (out.length >= limit) break;
      if (typeof n.x !== 'number' || typeof n.y !== 'number') continue;
      const p = m === '3d' ? (fg as FG3D).graph2ScreenCoords(n.x, n.y, n.z ?? 0) : (fg as FG2D).graph2ScreenCoords(n.x, n.y);
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      if (p.x < 0 || p.y < 0 || p.x > rect.width || p.y > rect.height) continue;
      let r = nodeRadiusPx(n.size);
      let src: 'sprite' | 'circle' | 'fallback' = m === '3d' ? 'fallback' : 'circle';
      if (m === '3d' && l3) {
        const sprite = (n as unknown as { __threeObj?: THREE.Sprite }).__threeObj;
        if (sprite?.scale) {
          r = (sprite.scale.x * l3.pxPerScale * ((SPRITE_BUBBLE_R * 2) / SPRITE_TEX_W)) / 2;
          src = 'sprite';
        }
      }
      out.push({ id: String(n.id), x: rect.left + p.x, y: rect.top + p.y, r, size: n.size, src });
    }
    return out;
  }, [live3D]);
  const linkScreenWidths = useCallback((limit = 4000): Array<{ id: string; weight: number; emphasis: number; intendedPx: number; renderedPx: number | null }> => {
    const { effectiveMode: m, graphData: data } = latest.current;
    const l3 = m === '3d' ? live3D() : null;
    const out: Array<{ id: string; weight: number; emphasis: number; intendedPx: number; renderedPx: number | null }> = [];
    for (const l of data.links) {
      if (out.length >= limit) break;
      const emphasis = l.id === selectedLinkId ? 2 : l.id === hoverLinkId ? 1 : 0;
      const intendedPx = linkWidthPx(l.weight, emphasis);
      let renderedPx: number | null = intendedPx;
      if (m === '3d') {
        // three-forcegraph binds the link's three object to `__lineObj`; with `linkThreeObjectExtend` (our raycast hit tube) that
        // object is a Group whose children[0] is the default tube / cylinder mesh — read the geometry radius from there
        type LinkObj = { children?: LinkObj[]; geometry?: { parameters?: { radius?: number; radiusTop?: number } } };
        const bound = (l as unknown as { __lineObj?: LinkObj }).__lineObj;
        const obj = bound?.children?.length ? bound.children[0] : bound;
        const wr = obj?.geometry?.parameters?.radius ?? obj?.geometry?.parameters?.radiusTop;
        renderedPx = typeof wr === 'number' && l3 ? wr * 2 * l3.pxPerWorld : null;
      }
      out.push({ id: l.id, weight: l.weight, emphasis, intendedPx, renderedPx });
    }
    return out;
  }, [live3D, selectedLinkId, hoverLinkId]);
  const linkScreenSamples = useCallback((limit = 4000, ts: number[] = [0.2, 0.35, 0.5, 0.65, 0.8]): Array<{ id: string; source: string; target: string; points: Array<[number, number]> }> => {
    const { effectiveMode: m, graphData: data, wrapEl } = latest.current;
    const fg = m === '3d' ? fg3d.current : fg2d.current;
    if (!fg || !wrapEl) return [];
    const rect = wrapEl.getBoundingClientRect();
    const byId = new Map(data.nodes.map((n) => [String(n.id), n]));
    const out: Array<{ id: string; source: string; target: string; points: Array<[number, number]> }> = [];
    for (const l of data.links) {
      if (out.length >= limit) break;
      const a = byId.get(idOf(l.source));
      const b = byId.get(idOf(l.target));
      if (!a || !b || typeof a.x !== 'number' || typeof a.y !== 'number' || typeof b.x !== 'number' || typeof b.y !== 'number') continue;
      let cx: number;
      let cy: number;
      let cz = 0;
      const az = a.z ?? 0;
      const bz = b.z ?? 0;
      if (m === '3d') {
        const vx = b.x - a.x;
        const vy = b.y - a.y;
        cx = vy * LINK_CURVATURE + (a.x + b.x) / 2;
        cy = -vx * LINK_CURVATURE + (a.y + b.y) / 2;
        cz = (az + bz) / 2;
      } else {
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        const d = len * LINK_CURVATURE;
        cx = (a.x + b.x) / 2 + d * Math.cos(ang - Math.PI / 2);
        cy = (a.y + b.y) / 2 + d * Math.sin(ang - Math.PI / 2);
      }
      const points: Array<[number, number]> = [];
      for (const t of ts) {
        const w0 = (1 - t) * (1 - t);
        const w1 = 2 * (1 - t) * t;
        const w2 = t * t;
        const px = w0 * a.x + w1 * cx + w2 * b.x;
        const py = w0 * a.y + w1 * cy + w2 * b.y;
        const pz = w0 * az + w1 * cz + w2 * bz;
        const p = m === '3d' ? (fg as FG3D).graph2ScreenCoords(px, py, pz) : (fg as FG2D).graph2ScreenCoords(px, py);
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
        if (p.x < 0 || p.y < 0 || p.x > rect.width || p.y > rect.height) continue;
        points.push([rect.left + p.x, rect.top + p.y]);
      }
      out.push({ id: l.id, source: idOf(l.source), target: idOf(l.target), points });
    }
    return out;
  }, []);
  useEffect(() => {
    publishGraphProbe({ nodeScreenPoints: (limit = 16) => nodeScreenPoints(limit), linkScreenPoints: (limit = 16) => linkScreenPoints(limit), linkScreenPointsById: (limit = 16) => linkScreenPointsById(limit), nodeScreenRadii: (limit = 4000) => nodeScreenRadii(limit), linkScreenWidths: (limit = 4000) => linkScreenWidths(limit), linkScreenSamples: (limit = 4000, ts?: number[]) => linkScreenSamples(limit, ts), live3D: () => live3D(), metrics: () => publishMetrics() });
    return () => publishGraphProbe(null);
  }, [nodeScreenPoints, linkScreenPoints, linkScreenPointsById, nodeScreenRadii, linkScreenWidths, linkScreenSamples, live3D, publishMetrics]);
  // 3D: keep cameraDistance live while the user orbits / dollies (throttled OrbitControls 'change')
  useEffect(() => {
    if (effectiveMode !== '3d' || !sized) return undefined;
    let disposed = false;
    let ctl: { addEventListener?: (t: string, fn: () => void) => void; removeEventListener?: (t: string, fn: () => void) => void } | null = null;
    let last = 0;
    const onChange = (): void => {
      const now = performance.now();
      if (now - last < 100) return;
      last = now;
      publishMetrics();
    };
    const t = window.setTimeout(() => {
      if (disposed) return;
      try {
        ctl = (fg3d.current?.controls() as typeof ctl) ?? null;
        ctl?.addEventListener?.('change', onChange);
      } catch {
        ctl = null;
      }
    }, 60);
    return () => {
      disposed = true;
      window.clearTimeout(t);
      ctl?.removeEventListener?.('change', onChange);
    };
  }, [effectiveMode, sized, publishMetrics]);
  const handleZoom2D = useCallback((t: { k: number }) => publishGraphState({ zoom: Math.round(t.k * 10000) / 10000 }), []);
  // halos / labels toggles → telemetry counts (3D scene objects, 2D painted halos)
  useEffect(() => {
    const t = window.setTimeout(publishMetrics, 120);
    return () => window.clearTimeout(t);
  }, [showHalos, showLabels, highlightedCommunity, graphData, effectiveMode, publishMetrics]);
  /* ---------- 3d-force-graph 1.80 ends a node drag by dispatching a synthetic touch `pointerup` on the document; OrbitControls builds
   * newer than r181 listen for pointerup on the document and dereference an untracked touch pointer (TypeError). three is pinned to
   * 0.181.x (see package.json overrides) — this capture-phase guard keeps the drag safe should the pin ever move. */
  useEffect(() => {
    if (effectiveMode !== '3d') return undefined;
    const guard = (e: PointerEvent): void => {
      if (!e.isTrusted && e.pointerType === 'touch') e.stopImmediatePropagation();
    };
    document.addEventListener('pointerup', guard, true);
    return () => document.removeEventListener('pointerup', guard, true);
  }, [effectiveMode]);
  const handleNodeDragEnd = useCallback((_n: FGNode, translate: { x: number; y: number; z?: number }) => {
    dragCount.current += 1;
    publishGraphState({ dragCount: dragCount.current, lastDragDisplacement: Math.round(Math.hypot(translate.x, translate.y, translate.z ?? 0) * 100) / 100 });
  }, []);

  /* ---------- fit on container resize: deferred fit() requests first, then the > 24 px rule */
  useEffect(() => {
    if (!sized) return undefined;
    if (pendingFit.current) {
      pendingFit.current = false;
      const t = window.setTimeout(doFit, 60); // after the renderer has consumed the new width/height
      return () => window.clearTimeout(t);
    }
    if (!refitOnResize || !autoFitDone.current) return undefined;
    if (!sizeChangedEnough(lastFitSize.current, { width, height })) return undefined;
    // v4.3 (WI-4): a box that bounces back to the size of the last fit (transient chrome — a progress row, a wrapped toolbar) is
    // not a new frame → keep the analyst's camera instead of re-fitting the re-laid-out graph
    const t = window.setTimeout(() => {
      const last = lastFitSize.current;
      if (last && last.width === latest.current.width && last.height === latest.current.height) return;
      doFit();
    }, RESIZE_REFIT_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [sized, width, height, refitOnResize, doFit]);

  /* ---------- 3D: keep renderer + camera in step with the measured box (idempotent; the lib does it on prop change) */
  useEffect(() => {
    if (effectiveMode !== '3d' || !sized) return undefined;
    const t = window.setTimeout(() => {
      const fg = fg3d.current;
      if (!fg) return;
      const renderer = fg.renderer();
      const cur = renderer.getSize(new THREE.Vector2());
      if (cur.x !== width || cur.y !== height) {
        renderer.setSize(width, height);
        const cam = fg.camera();
        if (cam instanceof THREE.PerspectiveCamera) {
          cam.aspect = width / height;
          cam.updateProjectionMatrix();
        }
      }
    }, 30);
    return () => window.clearTimeout(t);
  }, [effectiveMode, sized, width, height]);

  /* ---------- legacy fitKey: fit once the engine reports stopped (polled ≤ 3 s) instead of a blind timer */
  const prevFitKey = useRef(fitKey);
  useEffect(() => {
    if (prevFitKey.current === fitKey) return undefined;
    prevFitKey.current = fitKey;
    const started = Date.now();
    const id = window.setInterval(() => {
      if (engineState.current === 'stopped' || Date.now() - started > FIT_KEY_TIMEOUT_MS) {
        window.clearInterval(id);
        doFit();
      }
    }, FIT_KEY_POLL_MS);
    return () => window.clearInterval(id);
  }, [fitKey, doFit]);

  /* ---------- imperative handle */
  useImperativeHandle(
    ref,
    (): BubbleGraphHandle => ({
      fit: () => {
        const el = latest.current.wrapEl;
        if (el) {
          const m = measureElement(el);
          if (m.width > 0 && m.height > 0 && (m.width !== latest.current.width || clampCanvasHeight(m.height).height !== latest.current.height)) {
            // the box changed since the last commit (fullscreen, panel drag): apply the new size first, fit after
            pendingFit.current = true;
            remeasure();
            window.setTimeout(() => {
              if (pendingFit.current) {
                pendingFit.current = false;
                doFit();
              }
            }, 200);
            return true;
          }
        }
        return doFit();
      },
      resetView: () => {
        const { effectiveMode: m, graphData: data } = latest.current;
        // v4.3 DEF-006: re-heat the d3 simulation (alpha → 1, the layout visibly re-runs and onEngineStop fires again), restore
        // the default camera / zoom (OrbitControls.reset() + cameraPosition(front axis) · centerAt(0,0) + zoom(1)), fit after the
        // transition and fit once more when the re-heated engine settles (fitOnStop). zoomToFit is only scheduled on a usable bbox.
        const fg = m === '3d' ? fg3d.current : fg2d.current;
        if (!fg) return;
        if (m === '3d') {
          try {
            ((fg as unknown as { controls: () => { reset?: () => void } }).controls() as { reset?: () => void }).reset?.();
          } catch {
            /* controls not ready */
          }
        }
        fitOnStop.current = true;
        const res = reheatAndReset(fg as Parameters<typeof reheatAndReset>[0], m, resetDistance(data.nodes), doFit);
        if (!res.reheated) fitOnStop.current = false;
        resetCount.current += 1;
        publishGraphState({ resetCount: resetCount.current });
      },
      remeasure,
      getSize: () => ({ width: latest.current.width, height: latest.current.height }),
      isEngineStopped: () => engineState.current === 'stopped',
      nodeScreenPoints: (limit = 16) => nodeScreenPoints(limit),
    }),
    [doFit, remeasure, nodeScreenPoints],
  );

  /* ---------- hover plumbing (library HTML labels are disabled; GraphTooltip renders through a portal) */
  const handleNodeHover = useCallback(
    (n: FGNode | null) => {
      setHover((prev) => (n ? { kind: 'node', node: n } : prev?.kind === 'node' ? null : prev));
      onHoverNode?.(n ? String(n.id) : null);
    },
    [onHoverNode],
  );
  const lastHoveredLink = useRef<string | null>(null);
  const handleLinkHover = useCallback(
    (l: FGLink | null) => {
      if (l && lastHoveredLink.current !== l.id) countGraphEvent('linkHovers'); // v4.3 DEF-017 hit counter
      lastHoveredLink.current = l ? l.id : null;
      setHover((prev) => (l ? { kind: 'link', link: l, sourceId: idOf(l.source), targetId: idOf(l.target) } : prev?.kind === 'link' ? null : prev));
      onHoverLink?.(l ? l.id : null);
    },
    [onHoverLink],
  );
  useEffect(() => {
    setHover(null);
  }, [graphData, effectiveMode]);
  const noLabel = useCallback((): string => '', []);
  const clearHover = useCallback(() => setHover(null), []);

  /* ---------- 2D painters */
  const paintNode2D = useCallback(
    (n: FGNode, ctx: CanvasRenderingContext2D, scale: number) => {
      // VISUAL_FIX_2 (gate 3): radius in SCREEN pixels — the 2D context is scaled by `scale` (zoom), so divide it out
      const r = nodeRadiusPx(n.size) / Math.max(scale, 1e-6);
      const alpha = nodeAlpha(n);
      drawBubble(ctx, n, n.x ?? 0, n.y ?? 0, r, { alpha });
      // v4.3 DEF-015: no zoom culling on canvases ≤ 400 px (the 360-px embedded fits sit at zoom 0.37–0.51, below the old 0.5 cut)
      if (showLabels && scale > labelMinScale(latest.current.height)) {
        ctx.save();
        ctx.globalAlpha = alpha < 1 ? 0.3 : 1;
        const font = labelFontPx(scale);
        ctx.font = `600 ${font}px "Geist Variable", ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const text = n.label;
        const w = ctx.measureText(text).width + 4;
        // v5.2 (fix D): distance-based scaling comes from `labelFontPx(scale)`; collision avoidance is screen-space per paint frame
        const frame = Math.floor(performance.now() / 16);
        // VISUAL_FIX (defect 4): below → above → right → left fallback instead of dropping the label on the first collision
        const spot = placeLabel(frame, n.x ?? 0, n.y ?? 0, r, w, font + 3, scale);
        if (spot) {
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillRect(spot.x, spot.y, w, font + 3);
          ctx.fillStyle = INK;
          ctx.textAlign = 'left';
          ctx.fillText(text, spot.x + 2, spot.y + 1);
        }
        ctx.restore();
      }
    },
    [nodeAlpha, showLabels],
  );
  const paintPointer2D = useCallback((n: FGNode, color: string, ctx: CanvasRenderingContext2D, scale = 1) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(n.x ?? 0, n.y ?? 0, (nodeRadiusPx(n.size) + 2) / Math.max(scale, 1e-6), 0, Math.PI * 2);
    ctx.fill();
  }, []);
  const paintHalos2D = useCallback(
    (ctx: CanvasRenderingContext2D, scale: number) => {
      if (!showHalos) {
        halo2DCount.current = 0;
        return;
      }
      let painted = 0;
      const tele: HaloTelemetry[] = [];
      for (const { key, members, label: text, focus } of haloGroups()) {
        // v4.3: bounding circle of the member bubbles (same helper as the 3D sphere; z = 0)
        const fit = haloBoundingSphere(
          members.map((n) => ({ x: n.x ?? 0, y: n.y ?? 0, r: bubbleRadius(n.size) * 0.55 })),
          10,
        );
        if (!fit) continue;
        painted += 1;
        const { cx, cy, r } = fit;
        tele.push({ key, members: members.length, cx: Math.round(cx), cy: Math.round(cy), cz: 0, r: Math.round(r * 10) / 10 });
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = focus ? 'rgba(10,201,133,0.10)' : 'rgba(10,201,133,0.045)'; // B Capital green tint (same opacity as the 3D halo sphere)
        ctx.fill();
        ctx.setLineDash([6 / scale, 4 / scale]);
        ctx.lineWidth = (focus ? 1.8 : 1.25) / scale;
        ctx.strokeStyle = focus ? BRAND_INK : BRAND;
        ctx.stroke();
        if (text) {
          const font = 10 / scale;
          ctx.font = `600 ${font}px "Geist Variable", ui-sans-serif, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.setLineDash([]);
          const w = ctx.measureText(text).width + 8 / scale;
          ctx.fillStyle = FILL;
          // plate sits just inside the halo's top edge so zoomToFit (node bbox + 40 px) never clips it
          ctx.fillRect(cx - w / 2, cy - r + 4 / scale, w, font + 6 / scale);
          ctx.strokeStyle = INK;
          ctx.lineWidth = 1 / scale;
          ctx.strokeRect(cx - w / 2, cy - r + 4 / scale, w, font + 6 / scale);
          ctx.fillStyle = INK;
          ctx.fillText(text, cx, cy - r + 7 / scale);
        }
        ctx.restore();
      }
      halo2DCount.current = painted;
      haloTelemetry.current = tele;
    },
    [showHalos, haloGroups],
  );

  /* ---------- link styling (shared) */
  const linkColor = useCallback(
    (l: FGLink): string => {
      if (l.id === selectedLinkId) return BRAND_INK;
      if (hoverDims && hoverLinkId) return l.id === hoverLinkId ? INK : HAIRLINE;
      if (hoverDims && hoverNodeId) {
        const a = idOf(l.source);
        const b = idOf(l.target);
        return a === hoverNodeId || b === hoverNodeId ? INK : HAIRLINE;
      }
      if (highlightedCommunity !== null) {
        const s = nodeById.get(idOf(l.source));
        const t = nodeById.get(idOf(l.target));
        if (s?.community !== highlightedCommunity || t?.community !== highlightedCommunity) return HAIR;
      }
      return GREY;
    },
    [selectedLinkId, hoverDims, hoverLinkId, hoverNodeId, highlightedCommunity, nodeById],
  );
  // VISUAL_FIX (defect 2): width = clamp(1 + weight × 3 + emphasis, 1, 6) px — graphFit.linkWidthPx; a weight-1.0 edge is no longer a 5.6–7.5 px slab
  const linkWidth = useCallback(
    (l: FGLink): number => {
      const px = linkWidthPx(l.weight, l.id === selectedLinkId ? 2 : l.id === hoverLinkId ? 1 : 0);
      // 2D: force-graph divides lineWidth by globalScale → already screen pixels. 3D: cylinder radius is world units → convert.
      return effectiveMode === '3d' ? worldWidthForPx(px, pxPerWorld3d) : px;
    },
    [selectedLinkId, hoverLinkId, effectiveMode, pxPerWorld3d],
  );
  const linkDash = useCallback((l: FGLink): number[] | null => (l.dotted ? [2, 2] : null), []);
  // VISUAL_FIX (defect 1): the force-graph node value follows the SAME bounded radius (val = (r / nodeRelSize)²), so collision / default spheres never outgrow the sprite
  const nodeVal = useCallback((n: FGNode): number => (bubbleRadius(n.size) / 4) ** 2, []);
  const handleNodeClick = useCallback((n: FGNode) => onSelectNode?.(String(n.id)), [onSelectNode]);
  // v4.3 DEF-017: a click / tap on a link (either renderer) → WHY CONNECTED payload + hit counter
  const handleLinkClick = useCallback(
    (l: FGLink, event?: MouseEvent) => {
      const { effectiveMode: m, windowSeconds: win } = latest.current;
      const pos = pointerPositionOf(event);
      const payload = recordLinkClick(buildLinkPayload(l, m, { windowSeconds: win ?? null, x: pos.x, y: pos.y, via: 'canvas' }));
      onSelectLink?.(l.id, payload);
    },
    [onSelectLink],
  );
  /* ---------- v4.3 DEF-017: invisible 3D hit tube — radius ≈ 4× the visual width — extends the default link mesh so raycasts hit edges */
  const hitTubeMaterial = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }), []);
  useEffect(() => () => hitTubeMaterial.dispose(), [hitTubeMaterial]);
  const linkHitTube = useCallback((): THREE.Object3D => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), hitTubeMaterial);
    mesh.userData.hitTube = true;
    mesh.renderOrder = 9;
    return mesh;
  }, [hitTubeMaterial]);
  const linkWidthRef = useRef(linkWidth);
  useEffect(() => {
    linkWidthRef.current = linkWidth;
  }, [linkWidth]);
  // FULL_CORPUS_DEFAULT (2026-09-14): the raycast hit tube is SCREEN-SPACE too — at least HIT_TARGET_PX on screen whatever the
  // fit distance (a 348-node cloud fits at ≈3 600 world units → 0.32 px per world unit, where the old 14-world cap was a 4.5-px target)
  const pxPerWorld3dRef = useRef(pxPerWorld3d);
  useEffect(() => {
    pxPerWorld3dRef.current = pxPerWorld3d;
  }, [pxPerWorld3d]);
  const hitRadiusWorld = useCallback((visualWorldWidth: number): number => Math.max(hitTubeRadius(visualWorldWidth), worldWidthForPx(HIT_TARGET_PX, pxPerWorld3dRef.current)), []);
  // re-fit / dolly changes px-per-world after the engine stopped → rebuild every hit tube at the new screen-space radius
  useEffect(() => {
    if (effectiveMode !== '3d') return;
    for (const l of graphData.links) {
      const bound = (l as unknown as { __lineObj?: THREE.Object3D; __curve?: THREE.Curve<THREE.Vector3> | null }).__lineObj;
      const hit = bound?.children?.find((c) => (c as THREE.Mesh).userData?.hitTube) as THREE.Mesh | undefined;
      const curve = (l as unknown as { __curve?: THREE.Curve<THREE.Vector3> | null }).__curve;
      if (!hit || !curve) continue;
      const old = hit.geometry;
      hit.geometry = new THREE.TubeGeometry(curve, 10, hitRadiusWorld(linkWidthRef.current(l)), 5, false);
      old.dispose();
    }
  }, [pxPerWorld3d, graphData, effectiveMode, hitRadiusWorld]);
  const updateLinkHitTube = useCallback((obj: THREE.Object3D, coords: { start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number } }, linkObj: object): boolean => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.userData?.hitTube) return false;
    const link = linkObj as FGLink & { __curve?: THREE.Curve<THREE.Vector3> | null };
    const curve = (link.__curve ?? null) || new THREE.LineCurve3(new THREE.Vector3(coords.start.x, coords.start.y, coords.start.z ?? 0), new THREE.Vector3(coords.end.x, coords.end.y, coords.end.z ?? 0));
    const radius = hitRadiusWorld(linkWidthRef.current(link));
    const old = mesh.geometry;
    mesh.geometry = new THREE.TubeGeometry(curve, 10, radius, 5, false);
    old.dispose();
    return false; // let three-forcegraph keep updating the visible default mesh
  }, [hitRadiusWorld]);
  const linkHitTubeExtend = useCallback((): boolean => true, []);

  return (
    <div ref={wrapRef} className={['bubble-graph relative h-full w-full min-h-0 overflow-hidden bg-surface', className].filter(Boolean).join(' ')} data-testid={testId} data-mode={effectiveMode} data-webgl={supportsWebGL() ? '1' : '0'} data-sized={sized ? '1' : '0'} data-hover={hover ? '1' : '0'} onPointerLeave={clearHover}>
      {sized && effectiveMode === '3d' && (
        <ForceGraph3D<BubbleNode, BubbleLink>
          key="3d"
          ref={fg3d}
          width={width}
          height={height}
          graphData={graphData}
          backgroundColor="#FFFFFF"
          showNavInfo={false}
          controlType="orbit"
          nodeThreeObject={nodeThreeObject}
          nodeLabel={noLabel}
          nodeVal={nodeVal}
          nodeRelSize={4}
          linkCurvature={LINK_CURVATURE}
          linkColor={linkColor}
          linkWidth={linkWidth}
          linkOpacity={0.9}
          linkResolution={8}
          linkLabel={noLabel}
          linkHoverPrecision={4}
          linkThreeObject={linkHitTube}
          linkThreeObjectExtend={linkHitTubeExtend}
          linkPositionUpdate={updateLinkHitTube}
          warmupTicks={WARMUP_TICKS}
          cooldownTicks={COOLDOWN_TICKS}
          onEngineTick={handleEngineTick}
          onEngineStop={handleEngineStop}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}
          onNodeDragEnd={handleNodeDragEnd}
          enableNodeDrag // safe with three 0.181.x (OrbitControls listens on the canvas, not the document) + the synthetic-pointerup guard above
        />
      )}
      {sized && effectiveMode === '2d' && (
        <ForceGraph2D<BubbleNode, BubbleLink>
          key="2d"
          ref={fg2d}
          width={width}
          height={height}
          graphData={graphData}
          backgroundColor="#FFFFFF"
          nodeCanvasObject={paintNode2D}
          nodePointerAreaPaint={paintPointer2D}
          nodeLabel={noLabel}
          nodeVal={nodeVal}
          nodeRelSize={4}
          linkCurvature={LINK_CURVATURE}
          linkColor={linkColor}
          linkWidth={linkWidth}
          linkLineDash={linkDash}
          linkLabel={noLabel}
          linkHoverPrecision={LINK_HOVER_PRECISION_2D}
          onRenderFramePre={paintHalos2D}
          warmupTicks={WARMUP_TICKS}
          cooldownTicks={COOLDOWN_TICKS}
          onEngineTick={handleEngineTick}
          onEngineStop={handleEngineStop}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}
          onNodeDragEnd={handleNodeDragEnd}
          onZoom={handleZoom2D}
          enableNodeDrag
          autoPauseRedraw={false} // force-graph only repaints on linked-prop changes; halos live in onRenderFramePre (not linked) → keep the loop alive so toggles repaint
        />
      )}
      <GraphTooltip hover={hover} anchor={wrapEl} windowSeconds={windowSeconds} />
    </div>
  );
});
