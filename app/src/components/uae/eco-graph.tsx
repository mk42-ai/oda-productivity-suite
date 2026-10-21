"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false, loading: () => <div className="grid h-[560px] place-items-center text-sm text-[#A9ADB3]">Loading graph…</div> });

export type GN = { id: string; label: string; type: string; kind: string; degree: number };
export type GE = { source: string; target: string; relation: string; label?: string; url?: string; origin: string };
const TYPE_COL: Record<string, string> = { company: "#147B58", subsidiary: "#5E9C84", government: "#D8C3A0", university: "#B8975A", "research centre": "#7FA7C4", external: "#6B7178" };
const REL_COL: Record<string, string> = { owns: "#D8C3A0", owned_by: "#D8C3A0", merged_into: "#D8C3A0", investor: "#B8975A", partner: "#5E9C84", research_collab: "#7FA7C4", customer: "#9AA0A6", builds: "#3FAE85", operates: "#3FAE85" };

export function EcoGraph({ nodes, edges, initialFocus }: { nodes: GN[]; edges: GE[]; initialFocus?: string }) {
  const [focus, setFocus] = useState<string | null>(initialFocus ?? null); const [showExt, setShowExt] = useState(true); const [rels, setRels] = useState<string[]>([]);
  const wrap = useRef<HTMLDivElement>(null); const [w, setW] = useState(900);
  useEffect(() => { const el = wrap.current; if (!el) return; const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); return () => ro.disconnect(); }, []);
  const relTypes = useMemo(() => [...new Set(edges.map((e) => e.relation))].sort(), [edges]);
  const data = useMemo(() => {
    const es = edges.filter((e) => (!rels.length || rels.includes(e.relation)) && (showExt || (!e.source.startsWith("ext:") && !e.target.startsWith("ext:"))));
    const ids = new Set(es.flatMap((e) => [e.source, e.target])); nodes.filter((n) => n.kind === "watchlist").forEach((n) => ids.add(n.id));
    return { nodes: nodes.filter((n) => ids.has(n.id)).map((n) => ({ ...n })), links: es.map((e) => ({ ...e })) };
  }, [nodes, edges, showExt, rels]);
  const nbr = useMemo(() => { const s = new Set<string>(); if (focus) { s.add(focus); edges.forEach((e) => { if (e.source === focus) s.add(e.target); if (e.target === focus) s.add(e.source); }); } return s; }, [focus, edges]);
  const fe = focus ? edges.filter((e) => e.source === focus || e.target === focus) : [];
  const lab = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]" data-testid="eco-graph">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={showExt} onChange={(e) => setShowExt(e.target.checked)} className="accent-[#147B58]" />external partners</label>
          {relTypes.map((r) => <button key={r} type="button" onClick={() => setRels((x) => x.includes(r) ? x.filter((y) => y !== r) : [...x, r])} aria-pressed={rels.includes(r)} className={`h-7 rounded-full border px-2.5 ${rels.includes(r) ? "border-foreground" : "border-border text-muted"}`}><span className="mr-1 inline-block size-2 rounded-full" style={{ background: REL_COL[r] ?? "#888" }} />{r.replace("_", " ")}</button>)}
          {focus && <button type="button" onClick={() => setFocus(null)} className="h-7 rounded-full border border-border px-2.5">clear focus</button>}
          <span className="ml-auto tabular-nums text-muted">{data.nodes.length} nodes · {data.links.length} edges</span>
        </div>
        <div ref={wrap} className="relative overflow-hidden rounded-2xl border border-border bg-[#0F1419]" style={{ height: 600 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/uae/sections/graph-backdrop.webp" alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" />
          <ForceGraph2D graphData={data} width={w} height={600} backgroundColor="rgba(0,0,0,0)" cooldownTicks={120} nodeRelSize={4}
            nodeVal={(n: object) => 1 + (n as GN).degree * 0.8}
            linkColor={(l: object) => { const L = l as { relation: string; source: unknown; target: unknown }; const idOf = (v: unknown) => (typeof v === "string" ? v : (v as { id?: string })?.id); const s = idOf(L.source); const t = idOf(L.target); return focus && !(s === focus || t === focus) ? "rgba(140,140,140,0.08)" : (REL_COL[L.relation] ?? "#777") + "AA"; }}
            linkWidth={(l: object) => ((l as GE).relation === "owns" ? 1.8 : 1)} linkDirectionalArrowLength={3} linkDirectionalArrowRelPos={0.9}
            nodeCanvasObject={(n: object, ctx: CanvasRenderingContext2D, scale: number) => { const N = n as GN & { x: number; y: number }; const r = 3 + Math.sqrt(N.degree + 1) * 2.4; const dim = focus && !nbr.has(N.id);
              ctx.globalAlpha = dim ? 0.15 : 1; ctx.beginPath(); ctx.arc(N.x, N.y, r, 0, 2 * Math.PI); ctx.fillStyle = TYPE_COL[N.kind === "external" ? "external" : N.type] ?? "#888"; ctx.fill(); if (N.id === focus) { ctx.lineWidth = 2 / scale; ctx.strokeStyle = "#ECE6DA"; ctx.stroke(); }
              if (N.kind === "watchlist" && (scale > 1.4 || N.degree >= 5 || nbr.has(N.id))) { ctx.font = `${Math.max(10 / scale, 2.5)}px Inter, sans-serif`; ctx.fillStyle = "#ECE6DA"; ctx.textAlign = "center"; ctx.fillText(N.label.replace(/ \(.*\)$/, "").slice(0, 26), N.x, N.y + r + 9 / scale); }
              ctx.globalAlpha = 1; }}
            nodeLabel={(n: object) => (n as GN).label} onNodeClick={(n: object) => setFocus((n as GN).id)} />
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">{Object.entries(TYPE_COL).map(([k, c]) => <span key={k} className="inline-flex items-center gap-1"><span className="size-2.5 rounded-full" style={{ background: c }} />{k}</span>)}</div>
      </div>
      <aside className="card min-w-0 p-4" data-testid="graph-panel">
        {focus ? <>
          <p className="text-[11px] uppercase tracking-wide text-muted">Focus</p>
          <h2 className="text-lg font-semibold">{lab(focus)}</h2>
          {!focus.startsWith("ext:") && <Link href={`/watchlist/${focus}`} className="text-xs font-medium text-[var(--brand-green-ink)] hover:underline">Open dossier →</Link>}
          <ul className="mt-3 space-y-1.5 text-sm">{fe.map((e, i) => { const other = e.source === focus ? e.target : e.source; return <li key={i} className="flex items-start justify-between gap-2"><button type="button" onClick={() => setFocus(other)} className="min-w-0 truncate text-left hover:underline">{lab(other)}</button><span className="shrink-0 text-[11px] text-muted">{e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{e.relation}{e.source === focus ? "" : " ←"}</a> : <>{e.relation}{e.source === focus ? "" : " ←"}</>}</span></li>; })}</ul>
        </> : <p className="text-sm text-muted">Click a node to see its relationships and their sources. Edges come from (a) mission-brief ownership facts, (b) dossier “related organisations” and (c) news-extracted relationships; edges without a verified URL show the relation without a link.</p>}
      </aside>
    </div>
  );
}
