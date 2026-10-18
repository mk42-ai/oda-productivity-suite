/**
 * Correlation canvas — 3D force-directed bubble graph (react-force-graph-3d / three.js) with a 2D toggle.
 * Bubbles are sized by evidence count and carry the equal-size monochrome BrandIcon glyph; links are curved
 * with thickness = co-action weight; communities get dashed halos; clicking a link opens WHY CONNECTED.
 * The engine (Web Worker: co-occurrence + Louvain + Brandes) is unchanged — this is only the renderer.
 *
 * v4.1 toolbar (fix pass 1): Fit · Expand/Collapse (Fullscreen API with a fixed-inset fallback) · 2D | 3D · Reset view ·
 * Halos · Labels · (DEF-022) show/hide isolates, the readout "{shown} / {total} edges · {linked} linked / {total} nodes · {n}
 * isolates hidden", the LIVE max-age display filter
 * (debounced 150 ms, applied in index.tsx via applyMaxAge) and the renderer / engine / fit status line.
 * Mode, halos, labels and max age live in the persisted `useGraphPrefs` store, so they survive the 2D↔3D renderer
 * remount AND the /correlation/:runId navigation after every run. Fits go through the BubbleGraph imperative handle.
 *
 * v4.3 fix pass 4 (DEF-017 edge-click-in-expand): a link click / tap in EITHER renderer opens the in-canvas WHY CONNECTED
 * card (`LinkWhyPanel`, inside the fullscreen element → visible in native fullscreen AND in the in-page expanded mode) with
 * source · target · mode · weight · window · EVID ids; the Expand control is a state machine (native → in-page fallback
 * with the reason on the status line, visible Exit control, Escape, focus trap / restore); the Connections drawer lists the
 * strongest edges as an ARIA listbox while expanded; halos are suppressed while expanded (pref untouched, note on the
 * status line). The right-hand WHY CONNECTED tab stays in sync through `onSelectEdge`.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Box, CircleDashed, Eye, EyeOff, List, Maximize, Maximize2, Minimize, RotateCcw, Square, Tag, X } from 'lucide-react';
import { MAX_AGE_ALL, useGraphPrefs, type GraphMode } from './graphPrefs';
import { BubbleGraph, supportsWebGL, type BubbleGraphHandle, type BubbleLink, type BubbleNode, type EngineState, type FitInfo, type LinkWhyPayload, type RendererState } from './BubbleGraph';
import { ConnectionsDrawer, type DrawerEdge } from './ConnectionsDrawer';
import { LinkWhyPanel } from './LinkWhyPanel';
import { ExpandChatRail, ExpandChatToggle } from './ExpandChatRail';
import { edgeReadout } from './graphFit';
import { publishGraphState } from './graphState';
import { buildLinkPayload, recordWhyConnectedOpen } from './linkPayload';
import { useFullscreen } from './useFullscreen';
import { useActionPulse } from './useActionPulse';
import { cx } from '../rilian-ui';
import { UNPROVEN_BANNER, edgeEvidenceIds, fmtDelta, isolatesToggleLabel, nodeLabel, statusText } from '../model';
import { maxAgeLabel } from './maxAge';
import { SYNDICATED_BADGE } from './LinkWhyPanel';
import type { CoEdge, CoNode, Community, CorrelationParams } from '@/lib/reputation/engine/types';

/* Port note (B Capital): the Rilian `DisplayResult` (views/correlation/model.ts) and the workbench index / inspector / chat stores are
 * replaced by this prop shape, fed from /api/reputation/graph (scripts/build-reputation-graph.ts). `useIndex()` lookups become the
 * `meta` map (display name, photo, register), `notifyWorkbenchAction` is a no-op telemetry hook here. */
export interface GraphDisplay {
  runId: string;
  params: Pick<CorrelationParams, 'windowSeconds'>;
  nodes: CoNode[];
  edges: CoEdge[];
  communities: Community[];
  totalNodes: number;
  totalEdges: number;
  isolates: number;
  isolatesHidden: number;
  showIsolates: boolean;
}
export interface GraphNodeMeta { label: string; kind: string; register: string; name?: string; photo?: string; role?: string; hub?: boolean; evidenceIds?: string[] }
export interface GraphRegister { id: string; handle: string; name: string; short: string; photo: string; items: number; nodes: number }
type DisplayResult = GraphDisplay;
const notifyWorkbenchAction = (_action: string): void => { void _action; };

interface CorrelationGraphProps {
  /** Display result AFTER the live min-weight and max-age filters (index.tsx). */
  display: DisplayResult | null;
  selectedEdgeId: string | null;
  onSelectEdge: (edgeId: string) => void;
  onSelectNode: (handle: string) => void;
  highlightedCommunity: number | null;
  onHighlightCommunity: (index: number | null) => void;
  watchHandles: string[];
  /** Rendered centred over the canvas (empty / stale-cache states). */
  overlay?: ReactNode;
  /** B Capital: node display metadata (name, kind, register, photo) and the four registers (dashed-ring halos). */
  meta: Record<string, GraphNodeMeta>;
  registers: GraphRegister[];
}

const MAX_AGE_DEBOUNCE_MS = 150;
/** Status-line note while halos are hidden by the Expand rule (the Halos pref itself is untouched). */
export const HALOS_SUPPRESSED_NOTE = 'Halos suppressed in Expand';

export function CorrelationGraph({ display, selectedEdgeId, onSelectEdge, onSelectNode, highlightedCommunity, onHighlightCommunity, watchHandles, overlay, meta, registers }: CorrelationGraphProps) {
  /* ---------- persisted toolbar prefs (survive the renderer remount and the per-run route change) */
  const mode = useGraphPrefs((s) => s.mode);
  const setMode = useGraphPrefs((s) => s.setMode);
  const showHalos = useGraphPrefs((s) => s.showHalos);
  const toggleHalos = useGraphPrefs((s) => s.toggleHalos);
  const showLabels = useGraphPrefs((s) => s.showLabels);
  const toggleLabels = useGraphPrefs((s) => s.toggleLabels);
  const maxAgeDays = useGraphPrefs((s) => s.maxAgeDays);
  const setMaxAgeDays = useGraphPrefs((s) => s.setMaxAgeDays);
  const connectionsOnly = useGraphPrefs((s) => s.connectionsOnly);
  const setConnectionsOnly = useGraphPrefs((s) => s.setConnectionsOnly);
  const showIsolates = useGraphPrefs((s) => s.showIsolates);
  const toggleIsolates = useGraphPrefs((s) => s.toggleIsolates);

  const [engine, setEngine] = useState<EngineState>('running');
  const [renderer, setRenderer] = useState<RendererState>('unsized');
  const [fit, setFit] = useState<FitInfo | null>(null);
  const graphRef = useRef<BubbleGraphHandle>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawerToggleRef = useRef<HTMLButtonElement>(null);
  const webgl = supportsWebGL();
  const inspectorOpen = false;

  // a highlighted community can be cleared by clicking the same halo again → background click is handled in the view
  useEffect(() => {
    if (!display) onHighlightCommunity(null);
  }, [display, onHighlightCommunity]);

  /* ---------- re-measure + re-fit triggers */
  const remeasureAndFit = useCallback((): void => {
    graphRef.current?.remeasure();
    graphRef.current?.fit();
  }, []);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const onFullscreenChange = useCallback((active: boolean): void => {
    // both modes: the wrapper (and the ResizeObserver) have their new box a frame later → re-measure, then fit
    graphRef.current?.remeasure();
    window.requestAnimationFrame(() => {
      graphRef.current?.remeasure();
      window.setTimeout(() => graphRef.current?.fit(), 120);
    });
    void active;
    setDrawerOpen(false); // VISUAL_FIX_2: the Connections list never carries over into or out of Expand
    useGraphPrefs.getState().setConnectionsOnly(false); // VISUAL_FIX_2: Expand always opens on the FULL run graph
  }, []);
  const { isFullscreen, mode: fullscreenMode, supported: fullscreenSupported, nativeSupported, lastError: fullscreenError, expandMode, statusNote: expandNote, toggle: toggleFullscreen, exit: exitFullscreen } = useFullscreen(wrapRef, { onChange: onFullscreenChange });

  // inspector open / close changes the canvas width (react-resizable-panels) → re-fit after the layout settles
  const inspectorSeen = useRef(inspectorOpen);
  useEffect(() => {
    if (inspectorSeen.current === inspectorOpen) return undefined;
    inspectorSeen.current = inspectorOpen;
    const t = window.setTimeout(remeasureAndFit, 250);
    return () => window.clearTimeout(t);
  }, [inspectorOpen, remeasureAndFit]);

  // VISUAL_FIX (defect 3): every NEW run result (Run correlation / re-run / run switch) is framed automatically once the
  // re-heated layout has settled — fit-to-bounds (graphFit.tightCamera3D / fitZoom2D over the bounding sphere of the
  // displayed nodes) at 600 ms and again at 1600 ms so the settled positions are the ones framed. A MAX AGE / min-weight
  // filter on the SAME run keeps the camera (shouldAutoFitOnData contract).
  const lastRunId = useRef<string | null>(display?.runId ?? null);
  useEffect(() => {
    const runId = display?.runId ?? null;
    if (runId === lastRunId.current) return undefined;
    lastRunId.current = runId;
    if (!runId) return undefined;
    const t1 = window.setTimeout(() => { graphRef.current?.remeasure(); graphRef.current?.fit(); }, 600);
    const t2 = window.setTimeout(() => graphRef.current?.fit(), 1600);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [display?.runId]);

  // v4.3 DEF-006: idempotent Fit / Reset always answer with an accessible pulse (aria-live) — the status line also changes (fit #n)
  const { pulse, trigger: pulseNow } = useActionPulse();
  const handleFit = useCallback(() => {
    notifyWorkbenchAction('fit');
    graphRef.current?.fit();
    pulseNow('fitted ✓');
  }, [pulseNow]);
  const handleReset = useCallback(() => {
    notifyWorkbenchAction('reset-view');
    graphRef.current?.resetView();
    pulseNow('reset ✓');
  }, [pulseNow]);
  const handleMode = useCallback(
    (next: GraphMode) => {
      if (next === mode) return; // re-clicking the active mode must not fake an "engine running…" status
      setMode(next);
      setFit(null);
      setEngine('running');
    },
    [mode, setMode],
  );
  const onFit = useCallback((info: FitInfo) => setFit(info), []);
  const onEngineState = useCallback((state: EngineState) => setEngine(state), []);
  const onRendererState = useCallback((state: RendererState) => setRenderer(state), []);

  /* ---------- live max-age slider: immediate knob feedback, debounced (150 ms) store update → index.tsx re-filters */
  const [sliderValue, setSliderValue] = useState<number>(maxAgeDays ?? MAX_AGE_ALL);
  useEffect(() => {
    setSliderValue(maxAgeDays ?? MAX_AGE_ALL);
  }, [maxAgeDays]);
  const debounce = useRef<number | null>(null);
  const onSlider = useCallback(
    (raw: number) => {
      setSliderValue(raw);
      if (debounce.current !== null) window.clearTimeout(debounce.current);
      debounce.current = window.setTimeout(() => {
        debounce.current = null;
        setMaxAgeDays(raw >= MAX_AGE_ALL ? null : raw);
      }, MAX_AGE_DEBOUNCE_MS);
    },
    [setMaxAgeDays],
  );
  useEffect(
    () => () => {
      if (debounce.current !== null) window.clearTimeout(debounce.current);
    },
    [],
  );

  /* ---------- data → bubbles (tooltip fields included) */
  const watch = useMemo(() => new Set(watchHandles), [watchHandles]);
  // v4.3-combined (DEF-019): the legend names the ACTIVE investigation's network register, never a fixed NET-001…NET-004
  const networkRegisterLabel = useMemo(() => registers.map((r) => r.short).join(' · '), [registers]);
  const nodes = useMemo<BubbleNode[]>(() => {
    if (!display) return [];
    return display.nodes.map((n) => {
      const acc = meta[n.id];
      return {
        id: n.id,
        label: acc?.hub ? (acc.name ?? n.id) : nodeLabel(acc?.label ?? n.id),
        platform: n.platform,
        community: n.community,
        size: n.evidenceCount,
        synthetic: n.synthetic,
        watch: watch.has(n.id),
        historical: false,
        kind: acc?.kind ?? 'account',
        title: `${acc?.name ?? acc?.label ?? n.id} · ${acc?.kind ?? 'account'} · ${n.platform} · ${registers.find((r) => r.id === n.networkId)?.name ?? n.networkId ?? 'independent'} · ${n.evidenceCount} items · degree ${n.degree} · wdeg ${n.weightedDegree.toFixed(2)} · betweenness ${n.betweenness.toFixed(3)}${watch.has(n.id) ? ' · WATCH LIST' : ''}`,
        networkId: n.networkId,
        degree: n.degree,
        betweenness: n.betweenness,
        evidenceIds: acc?.evidenceIds ?? [],
        photo: acc?.photo,
      };
    });
  }, [display, meta, registers, watch]);
  const links = useMemo<BubbleLink[]>(() => {
    if (!display) return [];
    return display.edges.map((e) => {
      // DEF-019: the trail is the run's OWN corpus refs (`edge.evidenceIds`, engine-aggregated) — no join against the active
      // investigation's index and no "rows citing both" / "first 3 rows of either end" fallbacks (0/24 correct on the merged corpus)
      const evidenceIds = edgeEvidenceIds(e);
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        weight: e.weight,
        title: `${e.source} × ${e.target} · weight ${e.weight.toFixed(3)} · ${e.count} co-occurrence${e.count === 1 ? '' : 's'}${typeof e.rawCount === 'number' && e.rawCount !== e.count ? ` (raw events ${e.rawCount})` : ''}${e.syndicated ? ` · ${SYNDICATED_BADGE}` : ''} · min Δt ${fmtDelta(e.minDelta)} · ${Object.entries(e.byMode)
          .map(([m, c]) => `${m} ${c}`)
          .join(', ')} — click for WHY CONNECTED`,
        byMode: e.byMode,
        count: e.count,
        rawCount: e.rawCount,
        syndicated: e.syndicated === true,
        minDelta: e.minDelta,
        windowSeconds: display.params.windowSeconds,
        evidenceIds,
      };
    });
  }, [display]);
  const communityLabels = useMemo<Record<number, string>>(() => {
    const out: Record<number, string> = {};
    for (const c of display?.communities ?? []) out[c.index] = `C${c.index + 1} · ${c.dominantNetworkId ?? 'independent'} · ${c.size}`;
    return out;
  }, [display]);
  // v4.2: one dashed ring per network register (NET-001…NET-004) — label = id · short title · displayed members
  const haloLabels = useMemo<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    const counts = new Map<string, number>();
    for (const n of display?.nodes ?? []) if (n.networkId) counts.set(n.networkId, (counts.get(n.networkId) ?? 0) + 1);
    for (const r of registers) if (counts.has(r.id)) out[r.id] = `${r.name} · ${counts.get(r.id)} nodes · ${r.items.toLocaleString('en-US')} items`;
    return out;
  }, [display, registers]);
  // Fit frames the displayed nodes — narrowed to the highlighted community while one is focused
  const activeIds = useMemo(() => {
    if (!display) return new Set<string>();
    const pool = highlightedCommunity === null ? display.nodes : display.nodes.filter((n) => n.community === highlightedCommunity);
    return new Set(pool.map((n) => n.id));
  }, [display, highlightedCommunity]);

  /* ---------- v4.3 DEF-017: link click → in-canvas WHY CONNECTED card (+ the right-hand tab through onSelectEdge) */
  const [whyPayload, setWhyPayload] = useState<LinkWhyPayload | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const openWhy = useCallback(
    (id: string, payload: LinkWhyPayload) => {
      onSelectEdge(id);
      setWhyPayload(payload);
      setWhyOpen(true);
      recordWhyConnectedOpen();
    },
    [onSelectEdge],
  );
  const closeWhy = useCallback(() => setWhyOpen(false), []);
  const linkById = useMemo(() => new Map(links.map((l) => [l.id, l])), [links]);
  // a run / filter that dropped the pair closes the card (it never shows a stale edge)
  useEffect(() => {
    if (whyPayload && !linkById.has(whyPayload.id)) setWhyOpen(false);
  }, [linkById, whyPayload]);
  // VISUAL_FIX_2 (gate 2): the neighbourhood ("Connections") view is an explicit opt-in. Default OFF → the canvas (inline AND
  // Expand) shows every node and every edge of the current run; ON + a selected edge → only that pair and their neighbours.
  const { viewNodes, viewLinks } = useMemo(() => {
    if (!connectionsOnly || !selectedEdgeId) return { viewNodes: nodes, viewLinks: links };
    const sel = links.find((l) => l.id === selectedEdgeId);
    if (!sel) return { viewNodes: nodes, viewLinks: links };
    const keep = new Set<string>([sel.source, sel.target]);
    for (const l of links) if (l.source === sel.source || l.target === sel.source || l.source === sel.target || l.target === sel.target) { keep.add(l.source); keep.add(l.target); }
    return { viewNodes: nodes.filter((n) => keep.has(n.id)), viewLinks: links.filter((l) => keep.has(l.source) && keep.has(l.target)) };
  }, [connectionsOnly, selectedEdgeId, nodes, links]);
  const drawerEdges = useMemo<DrawerEdge[]>(() => links.map((l) => ({ id: l.id, source: l.source, target: l.target, weight: l.weight, evidCount: l.evidenceIds?.length ?? 0, syndicated: l.syndicated === true })), [links]);
  const onDrawerSelect = useCallback(
    (id: string) => {
      const l = linkById.get(id);
      if (!l) return;
      openWhy(id, buildLinkPayload(l, mode === '3d' && webgl ? '3d' : '2d', { windowSeconds: display?.params.windowSeconds ?? null, via: 'drawer' }));
    },
    [linkById, openWhy, mode, webgl, display],
  );
  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  useEffect(() => {
    publishGraphState({ drawerOpen });
  }, [drawerOpen]);

  /* ---------- v4.3 suppressed halos while expanded; FULL_CORPUS_DEFAULT (user 2026-09-14: "restore halos where appropriate — do not
     suppress in Expand unless the user toggles") → the Halos toggle is the only control in both modes. `halosSuppressed` stays in the
     telemetry contract and is now always false. */
  const halosSuppressed = false;
  const effectiveHalos = showHalos;
  useEffect(() => {
    publishGraphState({ halosSuppressed });
  }, [halosSuppressed]);

  // DEF-022: "24 / 24 edges · 24 linked / 708 nodes · 684 isolates hidden" (or "… · 684 isolates shown" when toggled)
  const readout = display ? edgeReadout(display.edges.length, display.totalEdges, display.nodes.length, display.totalNodes, { count: display.isolates, shown: display.showIsolates }) : null;
  // v4.3 DEF-005 / DEF-017: the Expand outcome (native · in-page + WHY) and the halo rule are surfaced on the status line, never swallowed
  const notes = [expandNote, halosSuppressed ? HALOS_SUPPRESSED_NOTE : null].filter((n): n is string => Boolean(n));
  const status = statusText(engine, fit, renderer, notes.length ? notes.join(' · ') : null);
  const totals = useMemo(() => (display ? { nodes: display.totalNodes, edges: display.totalEdges } : undefined), [display]);
  const sliderLabel = maxAgeLabel(sliderValue >= MAX_AGE_ALL ? null : sliderValue);
  const expandTitle = !fullscreenSupported ? 'Fullscreen is not available here' : isFullscreen ? 'Collapse (Esc)' : nativeSupported ? 'Expand the canvas to fullscreen (falls back to an in-page expand if the browser refuses)' : 'Expand the canvas (in-page — the embedding page does not allow the Fullscreen API)';

  return (
    <div ref={wrapRef} className="correlation-graph-wrap relative flex h-full min-h-0 w-full flex-col bg-surface" data-testid="correlation-graph-wrap" data-tour="correlation-canvas" data-fullscreen={isFullscreen ? (fullscreenMode ?? '1') : '0'} data-expand-mode={expandMode} tabIndex={-1}>
      <div className="flex min-h-0 w-full flex-1 flex-col" data-testid="correlation-graph" role="img" aria-label="Co-occurrence graph">
        <BubbleGraph
          ref={graphRef}
          nodes={viewNodes}
          links={viewLinks}
          mode={mode}
          selectedLinkId={selectedEdgeId}
          onSelectLink={openWhy}
          onSelectNode={onSelectNode}
          highlightedCommunity={highlightedCommunity}
          communityLabels={communityLabels}
          showHalos={effectiveHalos}
          showLabels={showLabels}
          haloBy="network"
          haloLabels={haloLabels}
          activeIds={activeIds}
          onFit={onFit}
          onEngineState={onEngineState}
          onRendererState={onRendererState}
          totals={totals}
          windowSeconds={display?.params.windowSeconds}
          className="min-h-0 flex-1"
          testId="correlation-bubble-graph"
        />
      </div>
      <div className="graph-overlay-layer">
        {/* VISUAL_FIX (defect 5): pill + toolbar share ONE wrapping flex row (graph-overlay-top) — the toolbar drops under the
            pill when the pane is narrowed by the splitter instead of painting over it; the pill itself never clips */}
        <div className="graph-overlay-top" data-testid="graph-overlay-top">
        <div className="graph-overlay-passthrough graph-overlay-pill">
          <span className="graph-unproven-pill badge badge-dashed badge-unproven" data-testid="unproven-banner" title={UNPROVEN_BANNER}>
            CORRELATION ONLY
          </span>
        </div>
        <span className="graph-pulse" data-testid="graph-pulse" role="status" aria-live="polite" aria-atomic="true" data-active={pulse ? '1' : '0'}>
          {pulse?.text ?? ''}
        </span>
        <div className="graph-toolbar-isolate graph-toolbar-wrap flex flex-col items-end gap-1" data-testid="graph-toolbar">
          <div className="flex flex-wrap items-center justify-end gap-1" data-testid="graph-toolbar-buttons">
            <button type="button" className="btn btn-sm" onClick={handleFit} title="Fit the displayed nodes into view (400 ms)" data-testid="graph-fit" data-tour="correlation-fit">
              <Maximize2 size={12} />
              Fit
            </button>
            <button type="button" className={cx('btn btn-sm', isFullscreen && 'bg-fill-2')} aria-pressed={isFullscreen} onClick={() => void toggleFullscreen()} disabled={!fullscreenSupported} title={fullscreenError && !isFullscreen ? `${expandTitle} — last attempt: ${fullscreenError}` : expandTitle} data-testid="graph-expand" data-tour="correlation-expand" data-fullscreen-mode={fullscreenMode ?? ''} data-expand-mode={expandMode}>
              {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
              {isFullscreen ? 'Collapse' : 'Expand'}
            </button>
            <div className="inline-flex overflow-hidden rounded-md border border-hairline-2 bg-surface" role="group" aria-label="Graph mode" data-testid="graph-mode">
              <button type="button" className={cx('flex h-6 items-center gap-1 px-2 text-[11px] font-medium', mode === '2d' ? 'bg-ink text-white' : 'text-ink hover:bg-fill')} aria-pressed={mode === '2d'} onClick={() => handleMode('2d')} data-testid="graph-mode-2d">
                <Square size={11} /> 2D
              </button>
              <button type="button" className={cx('flex h-6 items-center gap-1 px-2 text-[11px] font-medium', mode === '3d' ? 'bg-ink text-white' : 'text-ink hover:bg-fill')} aria-pressed={mode === '3d'} onClick={() => handleMode('3d')} data-testid="graph-mode-3d" title={webgl ? 'three.js WebGL — orbit / dolly / pan' : 'WebGL unavailable in this browser — 2D fallback'}>
                <Box size={11} /> 3D
              </button>
            </div>
            <button type="button" className="btn btn-sm" onClick={handleReset} title={mode === '3d' && webgl ? 'Camera back to the front axis, re-settle the layout, then fit' : 'Centre at the origin, zoom 1, re-settle the layout, then fit'} data-testid="graph-reset">
              <RotateCcw size={12} />
              Reset view
            </button>
            <button type="button" className={cx('btn btn-sm', showHalos && 'bg-fill-2')} aria-pressed={showHalos} onClick={toggleHalos} title={halosSuppressed ? `${HALOS_SUPPRESSED_NOTE} — the preference is kept and honoured again on exit` : 'Toggle community halos'} data-testid="graph-halos" data-suppressed={halosSuppressed ? '1' : '0'}>
              <CircleDashed size={12} />
              Halos
            </button>
            <button type="button" className={cx('btn btn-sm', showLabels && 'bg-fill-2')} aria-pressed={showLabels} onClick={toggleLabels} title="Toggle handle labels" data-testid="graph-labels">
              <Tag size={12} />
              Labels
            </button>
            <button type="button" className={cx('btn btn-sm', connectionsOnly && 'bg-fill-2')} aria-pressed={connectionsOnly} onClick={() => setConnectionsOnly(!connectionsOnly)} title="Neighbourhood view: only the selected edge's endpoints and their neighbours (opt-in; OFF = whole run graph; cleared when Expand opens)" data-testid="graph-connections-only" data-connections-only={connectionsOnly ? '1' : '0'}>
              <CircleDashed size={12} />
              Neighbourhood
            </button>
            <button type="button" className={cx('btn btn-sm', showIsolates && 'bg-fill-2')} aria-pressed={showIsolates} onClick={toggleIsolates} title={showIsolates ? 'Hide the accounts without any co-occurrence (degree 0) — the run total in the readout is unchanged' : 'Show the accounts without any co-occurrence (degree 0) as unlinked bubbles — display only, the run is unchanged'} data-testid="graph-isolates" data-isolates={display?.isolates ?? 0} data-show-isolates={showIsolates ? '1' : '0'}>
              {showIsolates ? <EyeOff size={12} /> : <Eye size={12} />}
              {isolatesToggleLabel(showIsolates, display?.isolates ?? 0)}
            </button>
          </div>
          {isFullscreen && (
            <div className="flex items-center gap-1" data-testid="expand-controls">
              <button ref={drawerToggleRef} type="button" className={cx('btn btn-sm', drawerOpen && 'bg-fill-2')} aria-pressed={drawerOpen} aria-expanded={drawerOpen} aria-controls="connections-drawer" onClick={toggleDrawer} title="List the strongest edges — Enter opens WHY CONNECTED" data-testid="connections-drawer-toggle">
                <List size={12} />
                Connections <span className="mono">{drawerEdges.length}</span>
              </button>
              {/* v5.1.0 (DEF-047): the ONE chat toggle while expanded (the top-bar button is outside the fullscreen element) */}
              <ExpandChatToggle />
              <button type="button" className="expand-exit" onClick={() => void exitFullscreen()} title="Exit the expanded canvas (Esc)" data-testid="expand-exit">
                <X size={12} />
                Exit expand (Esc)
              </button>
            </div>
          )}
          {readout && (
            <div className="graph-readout-row flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 rounded-sm border border-hairline bg-surface px-2 py-0.5 text-[10px] text-secondary" data-testid="graph-readout-row">
              {/* v4.3 DEF-002: the variable-width status sits FIRST (left) in a fixed-width slot; the MAX AGE knob at the right end never moves */}
              <span className="mono graph-status graph-status-slot" data-testid="graph-status" data-ok={fit && !fit.ok ? '0' : '1'} data-renderer={renderer} data-engine={engine} aria-live="polite" title={status}>
                {status}
              </span>
              <span aria-hidden="true">·</span>
              <span className="mono graph-readout text-ink" data-testid="graph-readout" data-isolates-hidden={display?.isolatesHidden ?? 0} title="Displayed after the live min-weight + max-age + isolates filters / totals of the run (isolates = accounts without any co-occurrence)">
                {readout.text}
              </span>
              <span aria-hidden="true">·</span>
              <label className="flex items-center gap-1" title="Live display filter: only edges whose newest shared post is younger than the max age stay; nodes left without edges are hidden. 'all' at the right end.">
                <span className="label-xs">Max age</span>
                <input
                  type="range"
                  min={7}
                  max={MAX_AGE_ALL}
                  step={1}
                  value={sliderValue}
                  onChange={(e) => onSlider(Number(e.target.value))}
                  className="w-[70px]"
                  aria-label="Max age of displayed co-occurrences (days)"
                  aria-valuemin={7}
                  aria-valuemax={MAX_AGE_ALL}
                  aria-valuenow={sliderValue}
                  aria-valuetext={sliderValue >= MAX_AGE_ALL ? 'all posts' : `${sliderValue} days`}
                  data-testid="graph-max-age"
                />
                <span className="mono graph-max-age-label text-ink" data-testid="graph-max-age-readout" aria-live="polite">
                  {sliderLabel}
                </span>
              </label>
            </div>
          )}
        </div>
        </div>
        {isFullscreen && <ConnectionsDrawer open={drawerOpen} edges={drawerEdges} selectedId={selectedEdgeId} onSelect={onDrawerSelect} onClose={closeDrawer} returnFocusTo={drawerToggleRef} />}
        <LinkWhyPanel payload={whyPayload} open={whyOpen} onClose={closeWhy} />
        <div className="graph-overlay-passthrough absolute bottom-2 left-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-hairline bg-surface px-2 py-1 text-[10px] text-secondary" aria-label="Graph legend">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full border-[1.5px] border-ink bg-white" /> bubble = subject · publisher · account · company · size = evidence count · glyph = platform
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3.5 w-3.5 rounded-full border-[3px] border-double border-ink bg-white" /> watch list
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-5 rounded-sm border border-dashed border-hairline-2 bg-surface-2" /> dashed ring = subject register ({networkRegisterLabel})
          </span>
          <span>curved link width = co-action weight · click a link = WHY CONNECTED · hover = tooltip + neighbourhood · {mode === '3d' && webgl ? 'drag to orbit · wheel to dolly · right-drag to pan' : 'drag to pan · wheel to zoom'}</span>
        </div>
        {overlay && <div className="absolute inset-0 flex items-center justify-center">{overlay}</div>}
        {/* v5.0.0 DEF-037: docked chat rail inside the fullscreen element */}
        <ExpandChatRail active={isFullscreen} />
      </div>
    </div>
  );
}
