"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
export type NI = { id: string; headline: string; date?: string; publisher?: string; url?: string; summary?: string; category?: string; orgs: { id: string; name: string }[]; also: number };
export function NewsClient({ items, categories }: { items: NI[]; categories: string[] }) {
  const [cat, setCat] = useState("all"); const [q, setQ] = useState(""); const [verified, setVerified] = useState(false);
  const shown = useMemo(() => items.filter((n) => (cat === "all" || n.category === cat) && (!verified || !!n.url) && (!q || `${n.headline} ${n.summary} ${n.orgs.map((o) => o.name).join(" ")}`.toLowerCase().includes(q.toLowerCase()))), [items, cat, q, verified]);
  return (
    <div data-testid="news-feed">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search news…" className="h-8 min-w-[180px] flex-1 rounded-lg border border-border bg-surface px-3 text-sm" aria-label="Search news" data-testid="news-search" />
        <div className="flex flex-wrap gap-1">{["all", ...categories].map((c) => <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c} className={`h-7 rounded-full border px-2.5 text-xs capitalize ${cat === c ? "border-[#0D0D0D] bg-[#0D0D0D] text-white" : "border-[#E5E5E5] text-[#5D5D5D] hover:bg-[#F0F0F0]"}`}>{c}</button>)}</div>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="accent-[#0D0D0D]" />verified link only</label>
        <span className="ml-auto text-xs tabular-nums text-muted">{shown.length} / {items.length}</span>
      </div>
      <ol className="space-y-2">{shown.map((n) => (
        <li key={n.id} className="card grid gap-1 p-4 sm:grid-cols-[110px_1fr]" data-testid="news-item">
          <div className="text-xs text-muted"><time className="block font-medium tabular-nums text-foreground">{n.date || "undated"}</time><span className="capitalize">{n.category}</span></div>
          <div className="min-w-0">
            {n.url ? <a href={n.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-[#2563EB] hover:underline">{n.headline}</a> : <span className="font-semibold">{n.headline} <sup className="text-[9px] font-normal text-muted">source unverified</sup></span>}
            {n.summary && <p className="mt-1 text-sm text-muted">{n.summary}</p>}
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted"><span>{n.publisher || "publisher n/a"}</span>{n.orgs.map((o) => <Link key={o.id} href={`/watchlist/${o.id}`} className="rounded bg-[#F0F0F0] px-1.5 py-0.5 text-[#0D0D0D] hover:text-foreground">{o.name}</Link>)}{n.also > 0 && <span>· +{n.also} corroborating report{n.also === 1 ? "" : "s"}</span>}</p>
          </div>
        </li>))}</ol>
    </div>
  );
}
