import type { Metadata } from "next";
import Link from "next/link";
import { ORGS, getOrg, newsFor, sentimentFor, modelsFor, edgesFor, classCounts, SENT_CLASSES, CLASS_COLOR } from "@/lib/uae/data";
import { SectionHeader, OrgLogo, TypeChip, ConfidenceMeter, Unavailable } from "@/components/uae/bits";
export const metadata: Metadata = { title: "Compare organisations" };
export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const sp = await searchParams; const ids = (sp.ids ?? "g42,edge,tii").split(",").map((s) => s.trim()).filter((id) => getOrg(id)).slice(0, 4);
  const orgs = ids.map((id) => getOrg(id)!);
  const rows: [string, (id: string) => React.ReactNode][] = [
    ["Type", (id) => <TypeChip type={getOrg(id)!.type} />],
    ["HQ / founded", (id) => `${getOrg(id)!.hq ?? "—"} · ${getOrg(id)!.founded ?? "unavailable"}`],
    ["Confidence", (id) => <ConfidenceMeter value={getOrg(id)!.confidence} />],
    ["Research coverage", (id) => `${Math.round(getOrg(id)!.coverage * 100)}%`],
    ["Leadership", (id) => (getOrg(id)!.leadership ?? []).slice(0, 3).map((l) => `${l.name} (${l.role})`).join("; ") || <Unavailable />],
    ["Technologies", (id) => (getOrg(id)!.technologies ?? []).slice(0, 6).map((t) => t.name).join(" · ") || <Unavailable />],
    ["Open models (HF)", (id) => { const m = modelsFor(id); return m.length ? `${m.length} · top: ${m.slice(0, 2).map((x) => x.id.split("/")[1]).join(", ")}` : "none on HF"; }],
    ["News events", (id) => newsFor(id).length],
    ["Latest event", (id) => { const t = [...(getOrg(id)!.timeline ?? [])].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))[0]; return t ? `${t.date}: ${t.event}` : <Unavailable />; }],
    ["Relationships", (id) => edgesFor(id).length],
    ["International", (id) => getOrg(id)!.international || <Unavailable />],
    ["Public voices", (id) => { const v = sentimentFor(id); const c = classCounts(v); return v.length ? <span className="flex h-2.5 w-full max-w-[180px] overflow-hidden rounded-full" title={SENT_CLASSES.map((k) => `${k} ${c[k]}`).join(", ")}>{SENT_CLASSES.map((k) => c[k] ? <span key={k} style={{ width: `${(c[k] / v.length) * 100}%`, background: CLASS_COLOR[k] }} /> : null)}</span> : "0 in sample"; }],
  ];
  return (
    <>
      <SectionHeader eyebrow="Watchlist · Compare" title={orgs.map((o) => o.name.split(" (")[0]).join(" vs ")} lede="Side-by-side dossier fields. 'Unavailable' means the research corpus did not support the field — not that it is zero." />
      <div className="mb-3 flex flex-wrap gap-2 text-xs">{[["g42,edge,tii", "G42 · EDGE · TII"], ["mbzuai,tii,inception", "MBZUAI · TII · Inception"], ["core42,khazna,space42", "Core42 · Khazna · Space42"], ["micropolis,xpanceo,astra-tech", "Micropolis · XPANCEO · Astra Tech"]].map(([q, l]) => <Link key={q} href={`/watchlist/compare?ids=${q}`} className="rounded-full border border-border px-2.5 py-1 hover:border-[var(--uae-gold)]">{l}</Link>)}</div>
      <div className="card overflow-x-auto" data-testid="compare-table">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b border-border"><th className="w-40 p-3 text-left text-xs font-medium text-muted">Field</th>{orgs.map((o) => <th key={o.id} className="p-3 text-left"><Link href={`/watchlist/${o.id}`} className="flex items-center gap-2 font-semibold hover:underline"><OrgLogo id={o.id} name={o.name} size={28} />{o.name}</Link></th>)}</tr></thead>
          <tbody>{rows.map(([label, f]) => <tr key={label} className="border-b border-border align-top last:border-0"><th className="p-3 text-left text-xs font-medium text-muted">{label}</th>{ids.map((id) => <td key={id} className="p-3 text-[13px]">{f(id)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">Pick organisations on the <Link className="underline" href="/watchlist">Watchlist</Link> (Compare button) — up to 4. All {ORGS.length} dossiers are comparable.</p>
    </>
  );
}
