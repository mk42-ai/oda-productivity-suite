"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false, loading: () => <div className="grid h-[560px] place-items-center text-sm text-[#5D5D5D]">Loading graph…</div> });

export type GN = { id: string; label: string; type: string; kind: string; degree: number };
export type GE = { source: string; target: string; relation: string; label?: string; url?: string; origin: string };
const TYPE_COL: Record<string, string> = { company: "#737373", subsidiary: "#A3A3A3", government: "#0D0D0D", university: "#5D5D5D", "research centre": "#8E8E8E", external: "#D4D4D4" };
const REL_COL: Record<string, string> = { owns: "#0D0D0D", owned_by: "#0D0D0D", merged_into: "#0D0D0D", investor: "#5D5D5D", partner: "#737373", research_collab: "#8E8E8E", customer: "#A3A3A3", builds: "#B4B4B4", operates: "#B4B4B4" };

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
          <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={showExt} onChange={(e) => setShowExt(e.target.checked)} className="accent-[#0D0D0D]" />external partners</label>
          {relTypes.map((r) => <button key={r} type="button" onClick={() => setRels((x) => x.includes(r) ? x.filter((y) => y !== r) : [...x, r])} aria-pressed={rels.includes(r)} className={`h-7 rounded-full border px-2.5 ${rels.includes(r) ? "border-[#0D0D0D] bg-[#0D0D0D] text-white" : "border-[#E5E5E5] text-[#5D5D5D] hover:bg-[#F0F0F0]"}`}><span className="mr-1 inline-block size-2 rounded-full" style={{ background: REL_COL[r] ?? "#A3A3A3" }} />{r.replace("_", " ")}</button>)}
          {focus && <button type="button" onClick={() => setFocus(null)} className="h-7 rounded-full border border-[#E5E5E5] px-2.5 hover:bg-[#F0F0F0]">clear focus</button>}
          <span className="ml-auto tabular-nums text-muted">{data.nodes.length} nodes · {data.links.length} edges</span>
        </div>
        <div ref={wrap} className="relative overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white" style={{ height: 600 }}>
          <ForceGraph2D graphData={data} width={w} height={600} backgroundColor="#FFFFFF" cooldownTicks={120} nodeRelSize={4}
            nodeVal={(n: object) => 1 + (n as GN).degree * 0.8}
            linkColor={(l: object) => { const L = l as { relation: string; source: unknown; target: unknown }; const idOf = (v: unknown) => (typeof v === "string" ? v : (v as { id?: string })?.id); const s = idOf(L.source); const t = idOf(L.target); return focus && !(s === focus || t === focus) ? "rgba(229,229,229,0.3)" : (focus && (s === focus || t === focus) ? "#0D0D0D" : "#D4D4D4"); }}
            linkWidth={(l: object) => ((l as GE).relation === "owns" ? 1.8 : 1)} linkDirectionalArrowLength={3} linkDirectionalArrowRelPos={0.9}
            nodeCanvasObject={(n: object, ctx: CanvasRenderingContext2D, scale: number) => { const N = n as GN & { x: number; y: number }; const r = 3 + Math.sqrt(N.degree + 1) * 2.4; const dim = focus && !nbr.has(N.id);
              ctx.globalAlpha = dim ? 0.15 : 1; ctx.beginPath(); ctx.arc(N.x, N.y, r, 0, 2 * Math.PI); ctx.fillStyle = TYPE_COL[N.kind === "external" ? "external" : N.type] ?? "#A3A3A3"; ctx.fill(); if (N.id === focus) { ctx.lineWidth = 2 / scale; ctx.strokeStyle = "#0D0D0D"; ctx.stroke(); }
              if (N.kind === "watchlist" && (scale > 1.4 || N.degree >= 5 || nbr.has(N.id))) { ctx.font = `${Math.max(10 / scale, 2.5)}px Inter, sans-serif`; ctx.fillStyle = "#0D0D0D"; ctx.textAlign = "center"; ctx.fillText(N.label.replace(/ \(.*\)$/, "").slice(0, 26), N.x, N.y + r + 9 / scale); }
              ctx.globalAlpha = 1; }}
            nodeLabel={(n: object) => (n as GN).label} onNodeClick={(n: object) => setFocus((n as GN).id)} />
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">{Object.entries(TYPE_COL).map(([k, c]) => <span key={k} className="inline-flex items-center gap-1"><span className="size-2.5 rounded-full" style={{ background: c }} />{k}</span>)}</div>
      </div>
      <aside className="card min-w-0 p-4" data-testid="graph-panel">
        {focus ? <>
          <p className="text-[11px] uppercase tracking-wide text-muted">Focus</p>
          <h2 className="text-lg font-semibold text-[#0D0D0D]">{lab(focus)}</h2>
          {!focus.startsWith("ext:") && <Link href={`/watchlist/${focus}`} className="text-xs font-medium text-[#2563EB] hover:underline">Open dossier →</Link>}
          <ul className="mt-3 space-y-1.5 text-sm">{fe.map((e, i) => { const other = e.source === focus ? e.target : e.source; return <li key={i} className="flex items-start justify-between gap-2"><button type="button" onClick={() => setFocus(other)} className="min-w-0 truncate text-left hover:underline">{lab(other)}</button><span className="shrink-0 text-[11px] text-muted">{e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] hover:underline">{e.relation}{e.source === focus ? "" : " ←"}</a> : <>{e.relation}{e.source === focus ? "" : " ←"}</>}</span></li>; })}</ul>
        </> : <p className="text-sm text-muted">Click a node to see its relationships and their sources. Edges come from (a) mission-brief ownership facts, (b) dossier “related organisations” and (c) news-extracted relationships; edges without a verified URL show the relation without a link.</p>}
      </aside>
    </div>
  );
}
