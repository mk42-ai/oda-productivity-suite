import type { Metadata } from "next";
import Link from "next/link";
import { RADAR, HF, NEWS, orgName } from "@/lib/uae/data";
import { SectionHeader, Panel } from "@/components/uae/bits";
export const metadata: Metadata = { title: "Technology & Innovation Radar", description: "Technology rings from dated news signals plus HuggingFace open-model signals." };
const RINGS = ["adopt", "trial", "assess", "hold"] as const;
const RCOL: Record<string, string> = { adopt: "#147B58", trial: "#5E9C84", assess: "#B8975A", hold: "#8A8F96" };
export default function RadarPage() {
  const S = 520, c = S / 2; const ringR = { adopt: 70, trial: 130, assess: 190, hold: 245 } as Record<string, number>;
  const placed = RADAR.map((r, i) => { const inRing = RADAR.filter((x) => x.ring === r.ring); const j = inRing.indexOf(r); const ang = (j / Math.max(1, inRing.length)) * Math.PI * 2 + (RINGS.indexOf(r.ring) * 0.6) + 0.3; const rr = ringR[r.ring] - 28; return { ...r, x: c + Math.cos(ang) * rr, y: c + Math.sin(ang) * rr, i }; });
  const top = HF.models.slice(0, 18); const maxL = Math.max(...top.map((m) => m.likes ?? 0), 1);
  return (
    <>
      <SectionHeader eyebrow="Technology & Innovation Radar" title="Where UAE AI capability is moving" image="/brand/uae/sections/graph-backdrop" lede="Rings come from the per-article radar labels assigned by the OnDemand news agent (majority vote); blip size = number of dated signals. Open-model traction comes from the HuggingFace Hub API." />
      <div className="grid gap-4 xl:grid-cols-[560px_1fr]">
        <Panel title="Radar" testId="radar">
          <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto block w-full max-w-[520px]" role="img" aria-label="Technology radar">
            {[...RINGS].reverse().map((r) => <circle key={r} cx={c} cy={c} r={ringR[r]} fill={RCOL[r]} fillOpacity={0.06} stroke="currentColor" strokeOpacity={0.15} />)}
            {RINGS.map((r) => <text key={r} x={c} y={c - ringR[r] + 14} textAnchor="middle" className="fill-current text-[11px] uppercase" opacity={0.55}>{r}</text>)}
            {placed.map((p) => <g key={p.name} data-testid="radar-blip"><circle cx={p.x} cy={p.y} r={6 + Math.sqrt(p.signals) * 2.2} fill={RCOL[p.ring]} fillOpacity={0.85} stroke="#ECE6DA" strokeWidth={1.5} /><text x={p.x} y={p.y + 3.5} textAnchor="middle" className="fill-white text-[10px] font-semibold">{p.i + 1}</text></g>)}
          </svg>
          <ol className="mt-3 grid gap-1 text-xs sm:grid-cols-2">{placed.map((p) => <li key={p.name} className="flex items-center gap-1.5"><span className="inline-grid size-4 place-items-center rounded-full text-[9px] font-bold text-white" style={{ background: RCOL[p.ring] }}>{p.i + 1}</span>{p.name}</li>)}</ol>
        </Panel>
        <div className="min-w-0 space-y-4">
          <Panel title="Blips — evidence" testId="radar-table">
            <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted"><th className="py-2">Technology</th><th>Ring</th><th>Signals</th><th>Latest</th><th>Leading organisations</th></tr></thead>
              <tbody>{RADAR.slice().sort((a, b) => RINGS.indexOf(a.ring) - RINGS.indexOf(b.ring) || b.signals - a.signals).map((r) => <tr key={r.name} className="border-b border-border last:border-0 align-top"><td className="py-2 font-medium">{r.name}{(r as { lane_note?: string }).lane_note && <p className="mt-0.5 text-[11px] font-normal text-muted" data-testid="lane-note">{(r as { lane_note?: string }).lane_note}</p>}<details className="mt-1 text-xs font-normal text-muted"><summary className="cursor-pointer">headlines</summary><ul className="ml-3 list-disc">{r.news_ids.slice(0, 6).map((id) => { const n = NEWS.find((x) => x.id === id); return n ? <li key={id}>{n.url ? <a className="hover:underline" href={n.url} target="_blank" rel="noopener noreferrer">{n.headline}</a> : n.headline} ({n.date})</li> : null; })}</ul></details></td><td><span className="rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white" style={{ background: RCOL[r.ring] }}>{r.ring}</span></td><td className="tabular-nums">{r.signals}</td><td className="tabular-nums text-xs">{r.latest || "n/a"}</td><td className="text-xs">{r.top_orgs.map((id) => <Link key={id} href={`/watchlist/${id}`} className="mr-1 hover:underline">{orgName(id)}</Link>)}</td></tr>)}</tbody></table></div>
          </Panel>
          <Panel title="Open-model signals — HuggingFace (likes)" testId="hf-signals">
            <p className="mb-2 text-[11px] text-muted" data-testid="hf-orgs">Orgs tracked (21 Oct 2026): {((HF as unknown as { orgs_tracked?: { org: string; url: string; public_models: number | null; note: string }[] }).orgs_tracked ?? []).map((o, i) => <span key={o.org}>{i ? " · " : ""}<a href={o.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{o.org}</a> {o.public_models == null ? "" : `(${o.public_models})`} <span className="opacity-70">{o.note}</span></span>)}</p>
            <ul className="space-y-1">{top.map((m) => <li key={m.id} className="grid grid-cols-[minmax(0,1fr)_120px_90px] items-center gap-2 text-xs"><a href={m.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline" title={m.id}>{m.id}</a><span className="h-2 rounded-full bg-[var(--surface-3)]"><span className="block h-2 rounded-full bg-[var(--uae-emerald)]" style={{ width: `${((m.likes ?? 0) / maxL) * 100}%` }} /></span><span className="text-right tabular-nums text-muted">♥ {m.likes ?? "n/a"} · ↓ {m.downloads ? m.downloads.toLocaleString() : "n/a"}</span></li>)}</ul>
            <p className="mt-3 text-[11px] text-muted">{HF.models.length} models across tiiuae, inception42, IFM and MBZUAI. {HF.note}</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
