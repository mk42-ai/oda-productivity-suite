"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, GitCompare, X } from "lucide-react";
import { OrgLogo, TypeChip, ConfidenceMeter } from "./bits";

export type Card = { id: string; name: string; type: "company" | "government" | "university" | "research centre" | "subsidiary"; hq?: string; parent?: string | null; focus: string[]; confidence: number; coverage: number; news: number; voices: number; models: number; unavailable: number; summary: string; root: string };
const TYPES = ["company", "subsidiary", "government", "university", "research centre"] as const;
const SORTS = { relevance: "Most signals", confidence: "Confidence", name: "Name", coverage: "Coverage" } as const;

export function WatchlistClient({ cards, rootNames }: { cards: Card[]; rootNames: Record<string, string> }) {
  const [q, setQ] = useState(""); const [types, setTypes] = useState<string[]>([]); const [emirate, setEmirate] = useState("all"); const [sort, setSort] = useState<keyof typeof SORTS>("relevance");
  const [eco, setEco] = useState("all"); const [cmp, setCmp] = useState<string[]>([]); const router = useRouter();
  const shown = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let xs = cards.filter((c) => (!types.length || types.includes(c.type)) && (emirate === "all" || (c.hq ?? "").toLowerCase().includes(emirate)) && (eco === "all" || c.root === eco)
      && (!ql || `${c.name} ${c.focus.join(" ")} ${c.summary} ${c.hq}`.toLowerCase().includes(ql)));
    xs = [...xs].sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "confidence" ? b.confidence - a.confidence : sort === "coverage" ? b.coverage - a.coverage : (b.news + b.voices + b.models) - (a.news + a.voices + a.models));
    return xs;
  }, [cards, q, types, emirate, sort, eco]);
  const toggle = (id: string) => setCmp((c) => c.includes(id) ? c.filter((x) => x !== id) : c.length >= 4 ? c : [...c, id]);
  const ecos = Object.entries(rootNames).filter(([id]) => cards.filter((c) => c.root === id).length > 1);
  return (
    <div data-testid="watchlist">
      <div className="sticky top-[var(--disc-h)] z-30 -mx-1 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background/95 p-2 backdrop-blur lg:top-[var(--disc-h)]">
        <label className="relative min-w-[200px] flex-1"><span className="sr-only">Search watchlist</span><Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 50 organisations, technologies, people…" data-testid="watchlist-search" className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-sm" /></label>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by type">{TYPES.map((t) => <button key={t} type="button" onClick={() => setTypes((x) => x.includes(t) ? x.filter((y) => y !== t) : [...x, t])} aria-pressed={types.includes(t)} data-testid={`filter-${t.replace(" ", "-")}`} className={`h-8 rounded-full border px-2.5 text-xs capitalize ${types.includes(t) ? "border-[#0D0D0D] bg-[#0D0D0D] text-white" : "border-[#E5E5E5] text-[#5D5D5D] hover:bg-[#F0F0F0]"}`}>{t}</button>)}</div>
        <select value={emirate} onChange={(e) => setEmirate(e.target.value)} aria-label="Emirate" className="h-8 rounded-lg border border-border bg-surface px-2 text-xs"><option value="all">All emirates</option><option value="abu dhabi">Abu Dhabi</option><option value="dubai">Dubai</option></select>
        <select value={eco} onChange={(e) => setEco(e.target.value)} aria-label="Ecosystem group" className="h-8 rounded-lg border border-border bg-surface px-2 text-xs" data-testid="filter-ecosystem"><option value="all">All groups</option>{ecos.map(([id, n]) => <option key={id} value={id}>{n} group</option>)}</select>
        <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} aria-label="Sort" className="h-8 rounded-lg border border-border bg-surface px-2 text-xs">{Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <span className="ml-auto text-xs tabular-nums text-muted" data-testid="watchlist-count">{shown.length} / {cards.length}</span>
      </div>
      <ul className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3 ${cmp.length > 0 ? "pb-24" : ""}`} data-testid="watchlist-grid">
        {shown.map((c) => (
          <li key={c.id} className="card group relative flex min-w-0 scroll-mt-16 scroll-mb-24 flex-col p-4 transition-colors hover:border-[#D4D4D4]" data-testid="org-card" data-org={c.id}>
            <div className="flex items-start gap-3">
              <OrgLogo id={c.id} name={c.name} size={44} />
              <div className="min-w-0 flex-1">
                <Link href={`/watchlist/${c.id}`} className="block truncate font-semibold tracking-tight after:absolute after:inset-0" title={c.name}>{c.name}</Link>
                <div className="mt-1 flex flex-wrap items-center gap-1.5"><TypeChip type={c.type} /><span className="text-xs text-muted">{c.hq || "HQ unavailable"}</span></div>
                {c.parent && <p className="mt-1 truncate text-[11px] text-muted">part of {c.parent}</p>}
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-[13px] leading-snug text-muted">{c.summary || "Briefing unavailable."}</p>
            <div className="mt-3 flex flex-wrap gap-1">{c.focus.slice(0, 3).map((f) => <span key={f} className="truncate rounded border border-[#E5E5E5] bg-[#F9F9F9] px-1.5 py-0.5 text-[11px] text-[#5D5D5D]" title={f}>{f.length > 34 ? f.slice(0, 33) + "…" : f}</span>)}</div>
            <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[11px] text-muted">
              <ConfidenceMeter value={c.confidence} />
              <span className="tabular-nums">{c.news} news · {c.voices} voices{c.models ? ` · ${c.models} models` : ""}</span>
            </div>
            {c.unavailable > 0 && <p className="mt-1 text-[10.5px] text-muted">{c.unavailable} field{c.unavailable === 1 ? "" : "s"} marked unavailable</p>}
            <button type="button" onClick={() => toggle(c.id)} aria-pressed={cmp.includes(c.id)} data-testid="compare-toggle" className={`relative z-10 mt-2 inline-flex h-7 items-center gap-1 self-start rounded-md border px-2 text-[11px] ${cmp.includes(c.id) ? "border-[#0D0D0D] bg-[#0D0D0D] text-white" : "border-[#E5E5E5] text-[#5D5D5D] hover:bg-[#F0F0F0]"}`}><GitCompare className="size-3" aria-hidden />{cmp.includes(c.id) ? "In compare" : "Compare"}</button>
          </li>))}
      </ul>
      {shown.length === 0 && <p className="card p-8 text-center text-sm text-muted">No organisation matches these filters.</p>}
      {cmp.length > 0 && (
        <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-2xl items-center gap-2 rounded-xl border border-[#E5E5E5] bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,.05)]" data-testid="compare-tray">
          <span className="px-1 text-xs text-muted">Compare ({cmp.length}/4):</span>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1">{cmp.map((id) => <button key={id} type="button" onClick={() => toggle(id)} className="inline-flex items-center gap-1 rounded-full bg-[#F0F0F0] px-2 py-0.5 text-xs text-[#0D0D0D] hover:bg-[#ECECEC]">{cards.find((c) => c.id === id)?.name.slice(0, 22)}<X className="size-3" aria-hidden /></button>)}</div>
          <button type="button" disabled={cmp.length < 2} onClick={() => router.push(`/watchlist/compare?ids=${cmp.join(",")}`)} className="h-8 rounded-lg bg-[#0D0D0D] px-3 text-xs font-semibold text-white hover:bg-[#2F2F2F] disabled:opacity-40" data-testid="compare-go">Compare</button>
        </div>)}
    </div>
  );
}
