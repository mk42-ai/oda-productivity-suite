/**
 * Grayscale co-occurrence matrix on a <canvas>: cell shade = weight (white → #171717),
 * rows/cols ordered by community with dashed separators, handle labels on the left, tooltip on hover.
 */
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { CoEdge, MatrixData } from '@/lib/reputation/engine/types';
import { edgeLookup } from './model';

/* VISUAL_FIX 2026-09-14 (defect 4): the row-label gutter is sized to the longest handle (measured, 104–240 px) instead of a
   fixed 104 px, so '@globalmarchtotheholyland' / 'Reuters via Media Selangor' are no longer cut to '@globalmarchtot…'; a
   label that still overflows the cap is ellipsised AND exposed in full through the hover tooltip / canvas title. */
const LABEL_W_MIN = 104;
const LABEL_W_MAX = 240;
const TOP_PAD = 2;
/** Gutter width for a set of handles at a given font: clamp(max text width + 12, min, max). Pure — unit-tested. */
export function matrixLabelWidth(handles: readonly string[], measure: (text: string) => number, min: number = LABEL_W_MIN, max: number = LABEL_W_MAX): number {
  let widest = 0;
  for (const h of handles) widest = Math.max(widest, measure(h));
  return Math.min(max, Math.max(min, Math.ceil(widest) + 12));
}
const MONO = "'Geist Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace";

function shade(v: number): string {
  const g = Math.round(255 - 232 * Math.sqrt(Math.max(0, Math.min(1, v))));
  return `rgb(${g},${g},${g})`;
}

interface MatrixHeatmapProps {
  matrix: MatrixData;
  edges: CoEdge[];
  /** Available height in px — the cell size is derived from it (min 4 px, the canvas may scroll). */
  height: number;
  highlightedCommunity: number | null;
  onCellClick: (edgeId: string) => void;
}

interface Hover {
  i: number;
  j: number;
  x: number;
  y: number;
}

export function MatrixHeatmap({ matrix, edges, height, highlightedCommunity, onCellClick }: MatrixHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const n = matrix.handles.length;
  const cell = n ? Math.max(4, Math.min(12, Math.floor((height - TOP_PAD - 2) / n))) : 0;
  const LABEL_W = useMemo(() => {
    if (typeof document === 'undefined') return LABEL_W_MIN;
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return LABEL_W_MIN;
    ctx.font = `${Math.max(8, Math.min(10, cell))}px ${MONO}`;
    return matrixLabelWidth(matrix.handles, (t) => ctx.measureText(t).width);
  }, [matrix.handles, cell]);
  const width = LABEL_W + n * cell + 2;
  const canvasHeight = TOP_PAD + n * cell + 2;
  const lookup = useMemo(() => edgeLookup(edges), [edges]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !n) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(canvasHeight * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, canvasHeight);

    /* cells */
    for (let i = 0; i < n; i++) {
      const row = matrix.values[i] ?? [];
      for (let j = 0; j < n; j++) {
        const v = row[j] ?? 0;
        if (i === j) ctx.fillStyle = '#F5F5F5';
        else if (v > 0) ctx.fillStyle = shade(v);
        else continue;
        ctx.fillRect(LABEL_W + j * cell, TOP_PAD + i * cell, cell, cell);
      }
    }
    /* faint grid when cells are large enough */
    if (cell >= 8) {
      ctx.strokeStyle = '#F5F5F5';
      ctx.lineWidth = 1;
      for (let k = 0; k <= n; k++) {
        ctx.beginPath();
        ctx.moveTo(LABEL_W + k * cell + 0.5, TOP_PAD);
        ctx.lineTo(LABEL_W + k * cell + 0.5, TOP_PAD + n * cell);
        ctx.moveTo(LABEL_W, TOP_PAD + k * cell + 0.5);
        ctx.lineTo(LABEL_W + n * cell, TOP_PAD + k * cell + 0.5);
        ctx.stroke();
      }
    }
    /* community separators (dashed) + hover cross */
    ctx.save();
    ctx.setLineDash([3, 2]);
    ctx.strokeStyle = '#6B6B6B';
    ctx.lineWidth = 1;
    for (let k = 1; k < n; k++) {
      if (matrix.communities[k] === matrix.communities[k - 1]) continue;
      const y = TOP_PAD + k * cell + 0.5;
      const x = LABEL_W + k * cell + 0.5;
      ctx.beginPath();
      ctx.moveTo(LABEL_W - 4, y);
      ctx.lineTo(LABEL_W + n * cell, y);
      ctx.moveTo(x, TOP_PAD);
      ctx.lineTo(x, TOP_PAD + n * cell);
      ctx.stroke();
    }
    if (highlightedCommunity !== null) {
      let start = -1;
      let end = -1;
      matrix.communities.forEach((c, k) => {
        if (c !== highlightedCommunity) return;
        if (start < 0) start = k;
        end = k;
      });
      if (start >= 0) {
        ctx.setLineDash([4, 2]);
        ctx.strokeStyle = '#171717';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(LABEL_W + start * cell + 0.75, TOP_PAD + start * cell + 0.75, (end - start + 1) * cell - 1.5, (end - start + 1) * cell - 1.5);
      }
    }
    ctx.restore();
    if (hover) {
      ctx.strokeStyle = '#171717';
      ctx.lineWidth = 1;
      if (hover.j >= 0) ctx.strokeRect(LABEL_W + hover.j * cell + 0.5, TOP_PAD + hover.i * cell + 0.5, cell - 1, cell - 1);
      ctx.fillStyle = 'rgba(23,23,23,0.06)';
      ctx.fillRect(LABEL_W, TOP_PAD + hover.i * cell, n * cell, cell);
      if (hover.j >= 0) ctx.fillRect(LABEL_W + hover.j * cell, TOP_PAD, cell, n * cell);
    }
    /* row labels */
    const every = cell >= 8 ? 1 : Math.ceil(8 / cell);
    ctx.font = `${Math.min(10, Math.max(8, cell))}px ${MONO}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      if (i % every !== 0 && !(hover && hover.i === i)) continue;
      const isHover = hover?.i === i || hover?.j === i;
      ctx.fillStyle = isHover ? '#171717' : '#525252';
      let label = matrix.handles[i] ?? '';
      while (label.length > 3 && ctx.measureText(label).width > LABEL_W - 8) label = `${label.slice(0, -2)}…`;
      ctx.fillText(label, LABEL_W - 5, TOP_PAD + i * cell + cell / 2);
    }
  }, [matrix, n, cell, width, canvasHeight, highlightedCommunity, hover, LABEL_W]);

  const cellAt = (e: MouseEvent<HTMLCanvasElement>): Hover | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const j = Math.floor((x - LABEL_W) / cell);
    const i = Math.floor((y - TOP_PAD) / cell);
    if (i < 0 || i >= n || j >= n) return null;
    if (j < 0) return { i, j: -1, x, y }; // row-label gutter → full-handle tooltip
    return { i, j, x, y };
  };

  const hoverEdge = hover && hover.j >= 0 && hover.i !== hover.j ? lookup.get(`${matrix.handles[hover.i]}|${matrix.handles[hover.j]}`) : undefined;
  const hoverLabelOnly = !!hover && hover.j < 0;
  const hoverWeight = hover ? (matrix.values[hover.i]?.[hover.j] ?? 0) : 0;

  if (!n) return <div className="p-3 text-[11px] text-secondary">No matrix — run the engine.</div>;
  return (
    <div className="relative inline-block" data-testid="matrix-heatmap-wrap">
      <canvas
        ref={canvasRef}
        data-testid="matrix-heatmap"
        role="img"
        aria-label={`Co-occurrence matrix, ${n} × ${n} handles ordered by community`}
        className="block cursor-crosshair"
        title={hoverLabelOnly && hover ? matrix.handles[hover.i] : undefined}
        onMouseMove={(e) => setHover(cellAt(e))}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          const c = cellAt(e);
          if (!c || c.j < 0 || c.i === c.j) return;
          const edge = lookup.get(`${matrix.handles[c.i]}|${matrix.handles[c.j]}`);
          if (edge) onCellClick(edge.id);
        }}
      />
      {hover && (
        <div className="pointer-events-none absolute z-10 whitespace-nowrap rounded-sm border border-ink bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink" style={{ left: Math.min(hover.x + 12, Math.max(0, width - 260)), top: hover.y + 12 }} role="tooltip" data-testid="matrix-tooltip">
          {hoverLabelOnly ? matrix.handles[hover.i] : <>{matrix.handles[hover.i]} × {matrix.handles[hover.j]} · {hover.i === hover.j ? 'self' : `${hoverWeight.toFixed(3)} · ${hoverEdge ? `${hoverEdge.count} co-occurrence${hoverEdge.count === 1 ? '' : 's'}` : 'no edge'}`}</>}
        </div>
      )}
    </div>
  );
}
