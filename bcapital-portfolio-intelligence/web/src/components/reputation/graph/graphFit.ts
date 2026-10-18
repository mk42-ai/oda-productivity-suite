/**
 * graphFit — pure, framework-free helpers behind the Fit / Reset view buttons of the bubble graph.
 *
 * Why this exists (react-force-graph #593 #233 #258 #390, 3d-force-graph #80): `zoomToFit()` is a silent
 * no-op when it is called before the nodes have positions, on a zero-size canvas, on a stale / unmounted
 * instance ref, or with a `nodeFilter` that matches nothing. Every entry point here checks those four
 * conditions FIRST and reports the reason, so the UI can say "fit skipped: …" instead of doing nothing.
 */

type FitMode = '2d' | '3d';

/** The subset of a force-graph node that fitting cares about. */
export interface FitNode {
  id?: string | number;
  x?: number;
  y?: number;
  z?: number;
}

/** The subset of the react-force-graph imperative API used by `fitGraph` (2D and 3D share it). */
export interface FitTarget {
  zoomToFit: (durationMs?: number, paddingPx?: number, nodeFilter?: (node: FitNode) => boolean) => unknown;
}
/**
 * 3D instances additionally expose the camera: `zoomToFit` in 3d-force-graph (three-render-objects
 * `fitToBbox`) places the camera at `maxBoxSide / atan(fov)` from the ORIGIN, which is ~1.7× farther than a
 * bounding-sphere fit and leaves ~40 % of the panel empty — so in 3D the fit is computed here (same 400 ms /
 * 40 px parameters, current view direction kept) and `zoomToFit` is only the fallback for instances that do
 * not expose the camera.
 */
export interface Fit3DTarget extends FitTarget {
  camera: () => { fov: number; aspect: number; position: { x: number; y: number; z: number }; up?: { x: number; y: number; z: number } };
  cameraPosition: (position?: { x?: number; y?: number; z?: number }, lookAt?: { x: number; y: number; z: number }, transitionMs?: number) => unknown;
}
export function is3DTarget(fg: FitTarget): fg is Fit3DTarget {
  const t = fg as Partial<Fit3DTarget>;
  return typeof t.camera === 'function' && typeof t.cameraPosition === 'function';
}

export interface ResetTarget3D extends FitTarget {
  cameraPosition: (position: { x?: number; y?: number; z?: number }, lookAt?: { x: number; y: number; z: number }, transitionMs?: number) => unknown;
}
export interface ResetTarget2D extends FitTarget {
  centerAt: (x?: number, y?: number, durationMs?: number) => unknown;
  zoom: (scale: number, durationMs?: number) => unknown;
}

export const FIT_DURATION_MS = 400;
export const FIT_PADDING_PX = 40;
export const RESET_3D_DURATION_MS = 600;
export const RESET_2D_DURATION_MS = 400;
/** A container resize smaller than this (in either dimension) does not trigger a re-fit (panel-drag jitter). */
const RESIZE_REFIT_THRESHOLD_PX = 24;
/** Minimum camera distance for the 3D reset. */
const RESET_3D_MIN_DISTANCE = 200;

interface FitArgs {
  fg: FitTarget | null | undefined;
  nodes: readonly FitNode[];
  /** Ids of the nodes currently displayed / filtered — only these are framed. */
  activeIds: ReadonlySet<string>;
  mode: FitMode;
  width: number;
  height: number;
  durationMs?: number;
  paddingPx?: number;
  /** Visual radius of a node in graph units (bubble + label) — only used by the 3D fit (symmetric fallback). */
  nodeRadius?: (node: FitNode) => number;
  /** Directional visual extents (graph units) of a node's sprite: above / below / beside its centre — 3D fit only. */
  nodeExtent?: (node: FitNode) => NodeExtent;
}

interface NodeExtent {
  up: number;
  down: number;
  side: number;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** True when every node already has a layout position (x, y — and z in 3D). Empty → false. */
export function nodesHavePositions(nodes: readonly FitNode[], mode: FitMode): boolean {
  if (nodes.length === 0) return false;
  for (const n of nodes) {
    if (!finite(n.x) || !finite(n.y)) return false;
    if (mode === '3d' && !finite(n.z)) return false;
  }
  return true;
}

function activeNodes(nodes: readonly FitNode[], activeIds: ReadonlySet<string>): FitNode[] {
  return nodes.filter((n) => activeIds.has(String(n.id)));
}

/** Null when a fit can run; otherwise a short human-readable reason (shown as "fit skipped: <reason>"). */
export function explainFit({ fg, nodes, activeIds, mode, width, height }: Omit<FitArgs, 'durationMs' | 'paddingPx'>): string | null {
  if (!fg || typeof fg.zoomToFit !== 'function') return 'renderer not mounted';
  if (!(width > 0 && height > 0)) return `canvas has no size (${Math.max(0, width)}×${Math.max(0, height)})`;
  if (nodes.length === 0) return 'no nodes';
  const active = activeNodes(nodes, activeIds);
  if (active.length === 0) return 'no displayed nodes match the filter';
  if (!nodesHavePositions(active, mode)) return 'layout has no positions yet';
  return null;
}

export function canFit(args: Omit<FitArgs, 'durationMs' | 'paddingPx'>): boolean {
  return explainFit(args) === null;
}

/**
 * Frame the displayed nodes: `zoomToFit(400, 40, node => activeIds.has(id))`.
 * Returns true when `zoomToFit` was called, false (and NO call) when any guard failed.
 */
export function fitGraph(args: FitArgs): boolean {
  const { fg, activeIds, mode, width, height, durationMs = FIT_DURATION_MS, paddingPx = FIT_PADDING_PX, nodeRadius, nodeExtent } = args;
  if (!fg || !canFit(args)) return false;
  if (mode === '3d' && is3DTarget(fg)) {
    const tight = tightCamera3D(activeNodes(args.nodes, activeIds), fg, width, height, paddingPx, nodeRadius, nodeExtent);
    if (tight) {
      fg.cameraPosition(tight.position, tight.lookAt, durationMs);
      return true;
    }
  }
  fg.zoomToFit(durationMs, paddingPx, (node) => activeIds.has(String(node.id)));
  return true;
}

interface TightCamera {
  position: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
  distance: number;
  radius: number;
}

type Vec3 = { x: number; y: number; z: number };
const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const norm = (a: Vec3): Vec3 | null => {
  const l = Math.hypot(a.x, a.y, a.z);
  return l > 1e-9 ? { x: a.x / l, y: a.y / l, z: a.z / l } : null;
};

/**
 * Perspective-exact camera fit for the 3D renderer. The look-at point becomes the bbox centre of the active
 * nodes; the current view direction (look-at → camera) and up vector are kept so Fit never rotates the scene.
 * Every node is projected into that camera basis and the distance is the smallest one at which each node (plus
 * its visual radius) is inside BOTH the padded vertical FOV and the padded horizontal FOV — i.e. the graph
 * touches the padding on its limiting axis, instead of the library's `maxBoxSide / atan(fov)` sphere-from-origin
 * estimate that leaves ~40 % of the panel empty. Returns null when the camera cannot be read.
 */
export function tightCamera3D(active: readonly FitNode[], fg: Fit3DTarget, width: number, height: number, paddingPx: number = FIT_PADDING_PX, nodeRadius: (node: FitNode) => number = () => 0, nodeExtent?: (node: FitNode) => NodeExtent): TightCamera | null {
  if (active.length === 0 || !(width > 0 && height > 0)) return null;
  let cam: { fov: number; aspect: number; position: Vec3; up?: Vec3 };
  try {
    cam = fg.camera();
  } catch {
    return null;
  }
  if (!cam || !finite(cam.fov) || cam.fov <= 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (const n of active) {
    const x = n.x as number;
    const y = n.y as number;
    const z = finite(n.z) ? n.z : 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const c0: Vec3 = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 };
  // current view direction (look-at → camera); default to the front axis
  let cur: { x?: number; y?: number; z?: number; lookAt?: Vec3 } | undefined;
  try {
    cur = fg.cameraPosition() as typeof cur;
  } catch {
    cur = undefined;
  }
  const from = cur?.lookAt ?? { x: 0, y: 0, z: 0 };
  const px = finite(cur?.x) ? (cur?.x as number) : cam.position.x;
  const py = finite(cur?.y) ? (cur?.y as number) : cam.position.y;
  const pz = finite(cur?.z) ? (cur?.z as number) : cam.position.z;
  const view = norm({ x: px - from.x, y: py - from.y, z: pz - from.z }) ?? { x: 0, y: 0, z: 1 };
  // camera basis: right = up × view, trueUp = view × right (falls back to another up when view ∥ up)
  const upHint = cam.up && norm(cam.up) ? (norm(cam.up) as Vec3) : { x: 0, y: 1, z: 0 };
  let right = norm(cross(upHint, view));
  if (!right) right = norm(cross({ x: 0, y: 0, z: 1 }, view)) ?? { x: 1, y: 0, z: 0 };
  const trueUp = norm(cross(view, right)) ?? { x: 0, y: 1, z: 0 };
  const padFactor = Math.max(0.2, 1 - (2 * paddingPx) / height);
  const vFov = ((cam.fov * Math.PI) / 180) * padFactor;
  const aspect = width / height;
  const tanV = Math.tan(vFov / 2);
  const tanH = tanV * aspect;
  // 1) visual bbox in camera space (sprite extents included) → centre the frame on it, not on the node centres
  const ext = active.map((n) => {
    const rel: Vec3 = { x: (n.x as number) - c0.x, y: (n.y as number) - c0.y, z: (finite(n.z) ? n.z : 0) - c0.z };
    const r = Math.max(0, nodeRadius(n));
    const e = nodeExtent ? nodeExtent(n) : { up: r, down: r, side: r };
    const sx = dot(rel, right);
    const sy = dot(rel, trueUp);
    return { depth: dot(rel, view), left: sx - Math.max(0, e.side), right: sx + Math.max(0, e.side), bottom: sy - Math.max(0, e.down), top: sy + Math.max(0, e.up), r: Math.max(r, e.side, e.up, e.down), dist: Math.hypot(rel.x, rel.y, rel.z) };
  });
  let minL = Infinity;
  let maxR = -Infinity;
  let minB = Infinity;
  let maxT = -Infinity;
  for (const e of ext) {
    if (e.left < minL) minL = e.left;
    if (e.right > maxR) maxR = e.right;
    if (e.bottom < minB) minB = e.bottom;
    if (e.top > maxT) maxT = e.top;
  }
  let mx = (minL + maxR) / 2;
  let my = (minB + maxT) / 2;
  // 2) smallest distance at which every sprite edge is inside both padded FOVs (perspective per node depth)
  const solveDistance = (): number => {
    let d = 0;
    for (const e of ext) d = Math.max(d, e.depth + (e.top - my) / tanV, e.depth + (my - e.bottom) / tanV, e.depth + (e.right - mx) / tanH, e.depth + (mx - e.left) / tanH, e.depth + e.r * 1.5);
    return d;
  };
  let distance = solveDistance();
  let radius = 0;
  for (const e of ext) radius = Math.max(radius, e.dist + e.r);
  if (!(distance > 0)) distance = Math.max(1, radius / Math.sin(Math.min(vFov, 2 * Math.atan(tanH)) / 2));
  // 3) balance the perspective margins: far nodes project closer to the centre than the orthographic bbox centre assumes, so
  //    shift the look-at until the projected top/bottom and left/right extents are symmetric, then re-solve the distance
  //    (converges in 2-3 passes; this is what turns a 36 px / 72 px margin pair into 32 px / 32 px → ≥ 85 % fill).
  for (let iter = 0; iter < 4; iter++) {
    let tTop = -Infinity;
    let tBot = -Infinity;
    let tRight = -Infinity;
    let tLeft = -Infinity;
    for (const e of ext) {
      const dz = Math.max(1e-6, distance - e.depth);
      tTop = Math.max(tTop, (e.top - my) / dz);
      tBot = Math.max(tBot, (my - e.bottom) / dz);
      tRight = Math.max(tRight, (e.right - mx) / dz);
      tLeft = Math.max(tLeft, (mx - e.left) / dz);
    }
    const dy = ((tTop - tBot) / 2) * distance;
    const dx = ((tRight - tLeft) / 2) * distance;
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || (Math.abs(dy) < 1e-3 && Math.abs(dx) < 1e-3)) break;
    my += dy;
    mx += dx;
    distance = Math.max(solveDistance(), 1);
  }
  const lookAt: Vec3 = { x: c0.x + right.x * mx + trueUp.x * my, y: c0.y + right.y * mx + trueUp.y * my, z: c0.z + right.z * mx + trueUp.z * my };
  return { position: { x: lookAt.x + view.x * distance, y: lookAt.y + view.y * distance, z: lookAt.z + view.z * distance }, lookAt, distance, radius };
}

type Schedule = (fn: () => void, delayMs: number) => void;
const defaultSchedule: Schedule = (fn, delayMs) => {
  setTimeout(fn, delayMs);
};

/** Largest distance of any positioned node from the origin (the point the reset camera looks at). */
export function boundingRadius(nodes: readonly FitNode[]): number {
  let r = 0;
  for (const n of nodes) {
    if (!finite(n.x) || !finite(n.y)) continue;
    r = Math.max(r, Math.hypot(n.x, n.y, finite(n.z) ? n.z : 0));
  }
  return r;
}

/** `Math.max(200, 1.4 × bounding radius)` — a camera distance that shows the whole cloud before the fit. */
export function resetDistance(nodes: readonly FitNode[]): number {
  return Math.max(RESET_3D_MIN_DISTANCE, 1.4 * boundingRadius(nodes));
}

/**
 * 3D reset: camera to (0,0,distance) looking at the origin over `durationMs`, then `afterTransition`
 * (normally the fit) 20 ms after the transition ends.
 */
export function resetView3D(fg: ResetTarget3D, distance: number, durationMs: number = RESET_3D_DURATION_MS, afterTransition?: () => void, schedule: Schedule = defaultSchedule): void {
  fg.cameraPosition({ x: 0, y: 0, z: distance }, { x: 0, y: 0, z: 0 }, durationMs);
  if (afterTransition) schedule(afterTransition, durationMs + 20);
}

/** 2D reset: `centerAt(0,0,400)` + `zoom(1,400)`, then `afterTransition` 20 ms after the transition ends. */
export function resetView2D(fg: ResetTarget2D, durationMs: number = RESET_2D_DURATION_MS, afterTransition?: () => void, schedule: Schedule = defaultSchedule): void {
  fg.centerAt(0, 0, durationMs);
  fg.zoom(1, durationMs);
  if (afterTransition) schedule(afterTransition, durationMs + 20);
}

/** True when a container resize is large enough (> threshold px in either dimension) to justify a re-fit. */
export function sizeChangedEnough(prev: { width: number; height: number } | null, next: { width: number; height: number }, thresholdPx: number = RESIZE_REFIT_THRESHOLD_PX): boolean {
  if (!prev) return true;
  return Math.abs(next.width - prev.width) > thresholdPx || Math.abs(next.height - prev.height) > thresholdPx;
}

interface EdgeReadout {
  edges: string; // "12 / 392 edges"
  nodes: string; // "9 / 40 nodes" · DEF-022: "24 linked / 708 nodes"
  text: string; // "12 / 392 edges · 9 / 40 nodes" · DEF-022: "24 / 24 edges · 24 linked / 708 nodes · 684 isolates hidden"
  /** DEF-022: "684 isolates hidden" | "684 isolates shown" | "" (no isolate info given). */
  isolates: string;
}

/** DEF-022: isolate status for the readout — how many run-level degree-0 accounts exist and whether the toggle shows them. */
export interface IsolatesReadout {
  count: number;
  shown: boolean;
}

/** Toolbar readout: displayed vs run totals. With `isolates`, the node part reads "N linked / T nodes · K isolates hidden" (or "… shown"). */
export function edgeReadout(displayedEdges: number, totalEdges: number, displayedNodes: number, totalNodes: number, isolates?: IsolatesReadout): EdgeReadout {
  const edges = `${displayedEdges} / ${totalEdges} edges`;
  if (!isolates) {
    const nodes = `${displayedNodes} / ${totalNodes} nodes`;
    return { edges, nodes, text: `${edges} · ${nodes}`, isolates: '' };
  }
  const nodes = isolates.shown ? `${displayedNodes} / ${totalNodes} nodes` : `${displayedNodes} linked / ${totalNodes} nodes`;
  const iso = `${isolates.count} isolates ${isolates.shown ? 'shown' : 'hidden'}`;
  return { edges, nodes, text: `${edges} · ${nodes} · ${iso}`, isolates: iso };
}

/** DEF-023: a halo group whose every member is a KNOWN degree-0 node (the isolate community, a NET ring of isolates) gets no ring.
 * Members without a `degree` field (ego graph) are never treated as isolates. */
export function isDegreeZeroGroup(members: ReadonlyArray<{ degree?: number }>): boolean {
  return members.length > 0 && members.every((m) => m.degree === 0);
}

/* ------------------------------------------------------------------------------------------------------------
 * 2D / 3D fit maths — pure helpers factored out of the guarded entry points above so the geometry (padding,
 * bbox, zoom, bounding sphere, camera placement) can be unit-tested without a renderer or a DOM.
 * ---------------------------------------------------------------------------------------------------------- */

/**
 * Padding (px) for a fit, shrinking on small canvases: `basePx` on a roomy canvas, down to 10 % of the smaller
 * dimension, but never below 4px (so the padding cannot swallow a small embed's whole canvas). Returns 4 when
 * `width` or `height` is not finite or not positive.
 */
export function fitPadding(width: number, height: number, basePx: number = FIT_PADDING_PX): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 4;
  // 6 % of the shorter side (capped at basePx): a 460 px ego panel gets 27 px (≈ 88 % fill), a 637 px panel the full base
  return Math.max(4, Math.min(basePx, Math.floor(Math.min(width, height) * 0.06)));
}

/** Axis-aligned bounding box of node centres, in graph units. */
interface Bbox2D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/**
 * Bounding box of every node with a finite `(x, y)`, each expanded by `nodeRadius(node)` (graph units — e.g.
 * the bubble + label extent). Nodes without a finite position are skipped. `null` when none remain.
 */
export function bbox2D(nodes: readonly FitNode[], nodeRadius: (n: FitNode) => number = () => 0): Bbox2D | null {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let any = false;
  for (const n of nodes) {
    if (!finite(n.x) || !finite(n.y)) continue;
    any = true;
    const r = Math.max(0, nodeRadius(n));
    minX = Math.min(minX, n.x - r);
    maxX = Math.max(maxX, n.x + r);
    minY = Math.min(minY, n.y - r);
    maxY = Math.max(maxY, n.y + r);
  }
  if (!any) return null;
  return { minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
}

/** Zoom (`k`), centre and fill fraction a 2D fit would use. */
interface Fit2D {
  k: number;
  cx: number;
  cy: number;
  fill: number;
}

/**
 * Zoom level (graph units → px) and centre that fit `bbox` inside a `width`×`height` canvas with `paddingPx` of
 * breathing room on every side, clamped to `[minZoom, maxZoom]`. A zero-size bbox side is treated as 1 graph
 * unit so a single point (or a perfectly flat line) does not force `k` to `Infinity`. `fill` is the fraction of
 * the limiting axis the bbox occupies at the final (clamped) `k` — 1 exactly when `paddingPx` is 0, less than 1
 * once padding eats into the canvas, and can exceed 1 when `k` was clamped *up* to `minZoom` for a bbox that
 * does not actually fit on screen. `null` when the canvas has no size.
 */
export function fitZoom2D(bbox: Bbox2D, width: number, height: number, paddingPx: number, minZoom = 0.01, maxZoom = 1000): Fit2D | null {
  if (!(width > 0 && height > 0)) return null;
  const w = bbox.w > 0 ? bbox.w : 1;
  const h = bbox.h > 0 ? bbox.h : 1;
  const kx = (width - 2 * paddingPx) / w;
  const ky = (height - 2 * paddingPx) / h;
  const k = Math.max(minZoom, Math.min(maxZoom, Math.min(kx, ky)));
  const fill = Math.max((bbox.w * k) / width, (bbox.h * k) / height);
  return { k, cx: bbox.cx, cy: bbox.cy, fill };
}

/** Bounding sphere of a node cloud, in graph units. */
export interface Sphere3D {
  cx: number;
  cy: number;
  cz: number;
  r: number;
}

/**
 * Smallest sphere, centred on the bbox centre of every node with a finite `(x, y)` (`z` defaults to 0), that
 * contains every node plus its `nodeRadius(node)` (graph units). `r` is never below 1 (so a single node at the
 * origin still yields a usable, non-zero frustum fit). `null` when no node has a finite position.
 */
export function boundingSphere(nodes: readonly FitNode[], nodeRadius: (n: FitNode) => number = () => 0): Sphere3D | null {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let any = false;
  for (const n of nodes) {
    if (!finite(n.x) || !finite(n.y)) continue;
    any = true;
    const z = finite(n.z) ? n.z : 0;
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  if (!any) return null;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  let r = 1;
  for (const n of nodes) {
    if (!finite(n.x) || !finite(n.y)) continue;
    const z = finite(n.z) ? n.z : 0;
    r = Math.max(r, Math.hypot(n.x - cx, n.y - cy, z - cz) + Math.max(0, nodeRadius(n)));
  }
  return { cx, cy, cz, r };
}

/** Fraction of the frustum's limiting half-view a 3D fit should occupy — leaves ~15 % breathing room. */
export const FIT_FILL_3D = 0.85;

/** Half-angle (radians) of whichever FOV axis (vertical or horizontal) is tighter for the given `aspect`. */
const limitingHalfAngle = (fovYDeg: number, aspect: number): number => {
  const halfV = (fovYDeg * Math.PI) / 360;
  const halfH = Math.atan(Math.tan(halfV) * aspect);
  return Math.min(halfV, halfH);
};

/**
 * Perspective distance at which a sphere of `radius` occupies `fill` of the frustum's limiting half-view — the
 * smaller of the vertical FOV (`fovYDeg`) and the horizontal FOV implied by `aspect` (width / height). Falls
 * back to `radius * 3` (documented fallback, never NaN/Infinity) when `radius`, `fovYDeg`, `aspect` or `fill`
 * is not a usable positive number, or `fovYDeg` is not below 180°.
 */
export function fitDistance3D(radius: number, fovYDeg: number, aspect: number, fill: number = FIT_FILL_3D): number {
  if (!finite(radius) || radius <= 0 || !finite(fovYDeg) || fovYDeg <= 0 || fovYDeg >= 180 || !finite(aspect) || aspect <= 0 || !finite(fill) || fill <= 0) {
    return radius * 3;
  }
  const theta = limitingHalfAngle(fovYDeg, aspect);
  return radius / Math.sin(theta) / fill;
}

/** Camera position, look-at point and distance a 3D fit would use. */
interface CameraPose {
  position: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
  distance: number;
}

/**
 * Camera pose that frames `sphere` while preserving the current viewing direction: the unit vector from the
 * sphere's centre to `currentPosition`, kept unchanged so a fit never rotates the scene. Falls back to looking
 * down `+z` when `currentPosition` is `null` or sits (near enough) on the sphere's centre.
 */
export function cameraForSphere(sphere: Sphere3D, currentPosition: { x: number; y: number; z: number } | null, fovYDeg: number, aspect: number, fill: number = FIT_FILL_3D): CameraPose {
  const distance = fitDistance3D(sphere.r, fovYDeg, aspect, fill);
  const lookAt = { x: sphere.cx, y: sphere.cy, z: sphere.cz };
  const rel: Vec3 | null = currentPosition ? { x: currentPosition.x - sphere.cx, y: currentPosition.y - sphere.cy, z: currentPosition.z - sphere.cz } : null;
  const dir = (rel && norm(rel)) ?? { x: 0, y: 0, z: 1 };
  return { position: { x: lookAt.x + dir.x * distance, y: lookAt.y + dir.y * distance, z: lookAt.z + dir.z * distance }, lookAt, distance };
}

/**
 * Inverse of `fitDistance3D`: the fraction of the frustum's limiting half-view (see `fitDistance3D`) that
 * `sphere` subtends from `distance` away — `asin(r / d) / θ`, clamping `r / d` to at most 1 (camera inside the
 * sphere). Feeding it the `distance` returned by `fitDistance3D(sphere.r, fovYDeg, aspect, fill)` recovers a
 * value close to `fill`. Returns 0 when `distance`, `sphere.r`, `fovYDeg` or `aspect` is not a usable positive
 * number, or `fovYDeg` is not below 180°.
 */
export function projectedFill3D(sphere: Sphere3D, distance: number, fovYDeg: number, aspect: number): number {
  if (!finite(distance) || distance <= 0 || !finite(sphere.r) || sphere.r <= 0 || !finite(fovYDeg) || fovYDeg <= 0 || fovYDeg >= 180 || !finite(aspect) || aspect <= 0) {
    return 0;
  }
  const theta = limitingHalfAngle(fovYDeg, aspect);
  const ratio = Math.min(1, sphere.r / distance);
  return Math.asin(ratio) / theta;
}

/* ------------------------------------------------------------------ v4.3 (2026-09-13) — DEF-001 / DEF-006 / DEF-014 / DEF-015 helpers */

/**
 * Minimum canvas height the renderer is ever given (DEF-001 residual guard; embedded 900×520 / 1024×600 / 1280×720).
 * v4.3 (DEF-017 pass): raised 320 → 360 px and mirrored as the CSS custom property `--min-canvas-height` (graph.css) so the
 * route layout (min-height on the graph region / ego wrap) and the renderer clamp share ONE configurable constant.
 */
export const MIN_CANVAS_HEIGHT = 360;

interface ClampedHeight {
  height: number;
  /** true when the measured box was shorter than MIN_CANVAS_HEIGHT and the renderer got the floor instead. */
  clamped: boolean;
}

/** A 0 px box stays 0 (nothing mounts — the status line explains); anything shorter than the floor is raised to it. */
export function clampCanvasHeight(measured: number, min: number = MIN_CANVAS_HEIGHT): ClampedHeight {
  if (!Number.isFinite(measured) || measured <= 0) return { height: 0, clamped: false };
  return measured < min ? { height: min, clamped: true } : { height: Math.floor(measured), clamped: false };
}

/** Canvases up to this height paint 2D labels at every zoom (DEF-015: the 360-px embedded canvases fit at zoom 0.37–0.51). */
export const LABEL_SMALL_CANVAS_PX = 400;

/** Minimum d3-zoom scale at which 2D labels are painted: 0 (always) on small canvases, 0.5 (declutter) on large ones. */
export function labelMinScale(canvasHeight: number): number {
  return canvasHeight > 0 && canvasHeight <= LABEL_SMALL_CANVAS_PX ? 0 : 0.5;
}

/** 2D label font in graph units: ≥ 7 device px on screen at any zoom, 11/√scale otherwise (never below 2.5). */
export function labelFontPx(scale: number): number {
  const s = scale > 0 ? scale : 1;
  return Math.max(2.5, 11 / Math.sqrt(s), 7 / s);
}

type GraphBbox = { x: [number, number]; y: [number, number]; z?: [number, number] } | null | undefined;

/** zoomToFit is a silent no-op (or a jump to infinity) on a degenerate bbox — every node on one point, or NaN. */
export function bboxIsDegenerate(b: GraphBbox): boolean {
  if (!b || !b.x || !b.y) return true;
  const span = (r: [number, number]) => (Number.isFinite(r[0]) && Number.isFinite(r[1]) ? Math.abs(r[1] - r[0]) : NaN);
  const sx = span(b.x);
  const sy = span(b.y);
  const sz = b.z ? span(b.z) : 0;
  if ([sx, sy, sz].some((v) => Number.isNaN(v))) return true;
  return sx < 1e-6 && sy < 1e-6 && sz < 1e-6;
}

interface ReheatTarget {
  d3ReheatSimulation?: () => unknown;
  getGraphBbox?: () => GraphBbox;
}

interface ReheatResetResult {
  /** d3ReheatSimulation() was available and called (alpha back to 1 → the layout visibly re-runs, onEngineStop fires again). */
  reheated: boolean;
  /** The bbox was usable, so the fit after the camera transition is worth scheduling. */
  fitScheduled: boolean;
}

/**
 * DEF-006 (v4.3): Reset view = re-heat the d3 simulation, restore the default camera (3D: front axis · 2D: centre, zoom 1),
 * then fit once the transition ends — and, because the re-heat moves nodes, the caller fits AGAIN on the next onEngineStop
 * (`fitOnStop`). `afterTransition` is only scheduled when the bbox is non-degenerate (zoomToFit would otherwise no-op).
 */
export function reheatAndReset(
  fg: (ResetTarget3D | ResetTarget2D) & ReheatTarget,
  mode: FitMode,
  distance: number,
  afterTransition: () => void,
  schedule: Schedule = defaultSchedule,
): ReheatResetResult {
  let reheated = false;
  try {
    if (typeof fg.d3ReheatSimulation === 'function') {
      fg.d3ReheatSimulation();
      reheated = true;
    }
  } catch {
    reheated = false;
  }
  const bbox = typeof fg.getGraphBbox === 'function' ? fg.getGraphBbox() : undefined;
  const fitScheduled = bbox === undefined ? true : !bboxIsDegenerate(bbox);
  const after = fitScheduled ? afterTransition : undefined;
  if (mode === '3d') resetView3D(fg as ResetTarget3D, distance, RESET_3D_DURATION_MS, after, schedule);
  else resetView2D(fg as ResetTarget2D, RESET_2D_DURATION_MS, after, schedule);
  return { reheated, fitScheduled };
}

export interface HeightBudgetChrome {
  /** Correlation toolbar row (Run correlation · saved runs). */
  toolbar: number;
  /** Filters panel. */
  filters: number;
  /** Bottom strip (matrix / run history) at its CURRENT height. */
  strip: number;
}

export interface HeightBudget {
  /** Pixels left for the graph region once the chrome above/below it is subtracted. */
  budget: number;
  /** true → collapse the strip, hide the secondary filter row and close side panels so the canvas keeps ≥ `min` px without scrolling. */
  compact: boolean;
}

/** Hysteresis margin: once compacted, the view only expands again when the RESTORED chrome would still leave this much headroom. */
const HEIGHT_BUDGET_HYSTERESIS_PX = 40;

/**
 * DEF-001 residual (v4.3): decide whether the view must compact itself to keep a ≥ 320 px canvas (900×520 / 1024×600 / 1280×720).
 * `chrome` is what is on screen now; while already compact, pass the chrome heights measured BEFORE compaction as `restored` so
 * the decision is made against the layout that WOULD come back — otherwise collapsing the strip frees the budget, the view
 * expands, the strip returns, the budget is short again, and the layout oscillates (measured at 1280×720).
 */
export function computeHeightBudget(viewHeight: number, chrome: HeightBudgetChrome, min: number = MIN_CANVAS_HEIGHT, prevCompact = false, restored: HeightBudgetChrome | null = null): HeightBudget {
  const budget = Math.floor(viewHeight - chrome.toolbar - chrome.filters - chrome.strip);
  if (viewHeight <= 0) return { budget, compact: false };
  if (!prevCompact) return { budget, compact: budget < min };
  const back = restored ?? chrome;
  const budgetIfRestored = Math.floor(viewHeight - Math.max(back.toolbar, chrome.toolbar) - Math.max(back.filters, chrome.filters) - Math.max(back.strip, chrome.strip));
  return { budget, compact: budgetIfRestored < min + HEIGHT_BUDGET_HYSTERESIS_PX };
}

/* ------------------------------------------------------------------ v4.3 (2026-09-13) — DEF-017 edge-click-in-expand helpers */

interface SpherePoint {
  x: number;
  y: number;
  z?: number;
  /** Radius of the member itself (bubble / sprite) so the sphere encloses the drawn node, not only its centre. */
  r?: number;
}

interface BoundingSphere {
  cx: number;
  cy: number;
  cz: number;
  r: number;
}

/**
 * Bounding sphere of a halo group (`haloBoundingSphere`): centroid of the member positions + the largest (distance + member radius), plus `pad`.
 * Used by BOTH renderers (2D: z = 0) on every engine tick / stop, so a halo is exactly as big as its community — never the
 * viewport. Returns null for an empty group.
 */
export function haloBoundingSphere(points: SpherePoint[], pad = 0): BoundingSphere | null {
  const pts = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z ?? 0));
  if (pts.length === 0) return null;
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const p of pts) {
    cx += p.x;
    cy += p.y;
    cz += p.z ?? 0;
  }
  cx /= pts.length;
  cy /= pts.length;
  cz /= pts.length;
  let r = 0;
  for (const p of pts) r = Math.max(r, Math.hypot(p.x - cx, p.y - cy, (p.z ?? 0) - cz) + (p.r ?? 0));
  return { cx, cy, cz, r: r + pad };
}

/** three.js objects that must never answer a raycast (halo spheres / wireframes / label plates): a no-op `raycast`. */
export function makeNonRaycastable<T extends { raycast: (...args: never[]) => void }>(obj: T): T {
  obj.raycast = (() => undefined) as unknown as T['raycast'];
  return obj;
}

/** Invisible 3D hit-tube radius (graph units) around a link of visual width `w`: ≈ 4× the visual width, clamped to 5–14. */
export const HIT_TUBE_MIN_RADIUS = 5;
export const HIT_TUBE_MAX_RADIUS = 14;
export function hitTubeRadius(visualWidth: number): number {
  const w = Number.isFinite(visualWidth) && visualWidth > 0 ? visualWidth : 1;
  return Math.min(HIT_TUBE_MAX_RADIUS, Math.max(HIT_TUBE_MIN_RADIUS, w * 4));
}

/** 2D link hover precision (screen px added to the visual width when the shadow canvas paints the hit area) — was the library default 4. */
export const LINK_HOVER_PRECISION_2D = 10;

interface PositionedNode {
  id: string | number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
}

/**
 * Carry the layout over a dataset update (Run correlation): every next node that existed before keeps its x/y/z (and
 * velocity / pin), so the simulation re-heats from the previous frame instead of restarting from d3's phyllotaxis seed and
 * the camera does not have to move. Returns the number of nodes that received positions.
 */
export function mergeNodePositions<T extends PositionedNode>(prev: readonly PositionedNode[] | null | undefined, next: T[]): number {
  if (!prev || prev.length === 0) return 0;
  const byId = new Map<string, PositionedNode>();
  for (const p of prev) if (typeof p.x === 'number' && typeof p.y === 'number') byId.set(String(p.id), p);
  let carried = 0;
  for (const n of next) {
    const p = byId.get(String(n.id));
    if (!p) continue;
    n.x = p.x;
    n.y = p.y;
    if (typeof p.z === 'number') n.z = p.z;
    if (typeof p.vx === 'number') n.vx = p.vx;
    if (typeof p.vy === 'number') n.vy = p.vy;
    if (typeof p.vz === 'number') n.vz = p.vz;
    if (typeof p.fx === 'number') n.fx = p.fx;
    if (typeof p.fy === 'number') n.fy = p.fy;
    if (typeof p.fz === 'number') n.fz = p.fz;
    carried += 1;
  }
  return carried;
}

/**
 * Whether a dataset change should re-arm the one-shot auto-fit. The FIRST dataset a mounted renderer shows (or a dataset
 * arriving after an empty one) is framed; a later in-place update (Run correlation with a graph already on screen) keeps the
 * analyst's camera / zoom — Fit stays one click away.
 */
export function shouldAutoFitOnData(prevNodeCount: number, nextNodeCount: number, rendererFresh: boolean): boolean {
  if (rendererFresh) return true;
  if (nextNodeCount === 0) return false;
  return prevNodeCount === 0;
}

/* ---------- VISUAL_FIX 2026-09-14 — bounded node radius / link width (defects 1 + 2) ------------------------------------ */
/** Node radius bounds in graph units (≈ px at zoom 1 in 2D; sprite diameter = 2 r in 3D). */
export const NODE_RADIUS_MIN_PX = 6;
export const NODE_RADIUS_MAX_PX = 24;
/**
 * r = clamp(min + (√evid − 1) · k, min, max): a 1-row account is the minimum bubble, a 100-row outlet is the maximum,
 * never a ring that swallows its neighbours. NaN / negative counts collapse to the minimum.
 */
export function nodeRadiusPx(evidCount: number, min: number = NODE_RADIUS_MIN_PX, max: number = NODE_RADIUS_MAX_PX, k = 2.2): number {
  const n = Number.isFinite(evidCount) ? Math.max(1, evidCount) : 1;
  const r = min + (Math.sqrt(n) - 1) * k;
  return Math.min(max, Math.max(min, r));
}
/** Co-action link width bounds (px). */
export const LINK_WIDTH_MIN_PX = 1;
export const LINK_WIDTH_MAX_PX = 6;
/** width = clamp(1 + weight · 3 + emphasis, 1, 6) — a weight-1.0 edge is 4 px, a selected weight-1.0 edge 6 px, never a slab. */
export function linkWidthPx(weight: number, emphasis = 0, min: number = LINK_WIDTH_MIN_PX, max: number = LINK_WIDTH_MAX_PX): number {
  const w = Number.isFinite(weight) ? Math.max(0, Math.min(1, weight)) : 0;
  return Math.min(max, Math.max(min, min + w * 3 + Math.max(0, emphasis)));
}

/* ---------- VISUAL_FIX 2026-09-14 — 2D label placement (defect 4); moved here from BubbleGraph so it is unit-testable ---------- */
/** v5.2 (fix D): screen-space label collision avoidance — greedy per frame; a label that would overlap an already placed one is skipped. */
const placedLabels: Array<{ x: number; y: number; w: number; h: number }> = [];
let placedFrame = -1;
function labelFits(frame: number, x: number, y: number, w: number, h: number): boolean {
  if (frame !== placedFrame) {
    placedLabels.length = 0;
    placedFrame = frame;
  }
  for (const b of placedLabels) if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) return false;
  placedLabels.push({ x, y, w, h });
  return true;
}
/**
 * VISUAL_FIX 2026-09-14 (defect 4): label placement with fallback offsets — below the bubble first, then above, right and
 * left of it; the label is only dropped when every candidate collides with an already placed label (screen-space, per frame).
 * Returns the chosen top-left corner in GRAPH units or null.
 */
export function placeLabel(frame: number, cx: number, cy: number, r: number, w: number, h: number, scale: number): { x: number; y: number } | null {
  const candidates: Array<{ x: number; y: number }> = [
    { x: cx - w / 2, y: cy + r + 2 }, // below
    { x: cx - w / 2, y: cy - r - 2 - h }, // above
    { x: cx + r + 3, y: cy - h / 2 }, // right
    { x: cx - r - 3 - w, y: cy - h / 2 }, // left
  ];
  for (const c of candidates) if (labelFits(frame, c.x * scale, c.y * scale, w * scale, h * scale)) return c;
  return null;
}


/* ---------- VISUAL_FIX_2 2026-09-14 — SCREEN-SPACE sizing helpers (gate 3) ---------------------------------------------- */
/** three.js PerspectiveCamera default vertical fov used by three-render-objects. */
export const DEFAULT_FOV_DEG = 50;
/** Sprite scale (world units, `sizeAttenuation: false`) that projects to exactly `px` pixels on a `viewportHeightPx`-tall canvas. */
export function spriteScaleForPx(px: number, viewportHeightPx: number, fovDeg: number = DEFAULT_FOV_DEG): number {
  const h = Number.isFinite(viewportHeightPx) && viewportHeightPx > 0 ? viewportHeightPx : 1;
  return (Math.max(0, px) * 2 * Math.tan((fovDeg * Math.PI) / 360)) / h;
}
/** Pixels per world unit at camera distance `distance` (perspective, vertical fov, canvas `viewportHeightPx` tall). */
export function pxPerWorldUnit(distance: number, viewportHeightPx: number, fovDeg: number = DEFAULT_FOV_DEG): number {
  const d = Number.isFinite(distance) && distance > 0 ? distance : 1;
  const h = Number.isFinite(viewportHeightPx) && viewportHeightPx > 0 ? viewportHeightPx : 1;
  return h / (2 * Math.tan((fovDeg * Math.PI) / 360) * d);
}
/** World-unit width that renders as `px` pixels at the given px-per-world ratio (3D link cylinders are world-sized). */
export function worldWidthForPx(px: number, pxPerWorld: number): number {
  return Math.max(0, px) / (Number.isFinite(pxPerWorld) && pxPerWorld > 0 ? pxPerWorld : 1);
}
