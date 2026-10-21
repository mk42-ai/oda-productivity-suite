import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ORGS, getOrg, newsFor, sentimentFor, edgesFor, modelsFor, childrenOf, orgName, logoProvenance, CLASS_COLOR, SENT_CLASSES, classCounts } from "@/lib/uae/data";
import { OrgLogo, TypeChip, ConfidenceMeter, Unavailable, SourceLink, CitedText, ClassDot, Panel, hostOf } from "@/components/uae/bits";
import { AskInChat } from "@/components/uae/ask-in-chat";

export function generateStaticParams() { return ORGS.map((o) => ({ id: o.id })); }
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> { const { id } = await params; const o = getOrg(id); return { title: o ? `${o.name} — dossier` : "Dossier" }; }
const val = (v?: string | null) => (v && !/^unavailable/i.test(v.trim()) ? v : null);

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const o = getOrg(id); if (!o) notFound();
  const news = newsFor(id); const voices = sentimentFor(id); const edges = edgesFor(id); const models = modelsFor(id); const kids = childrenOf(id); const cc = classCounts(voices); const lp = logoProvenance(id);
  const facts: [string, React.ReactNode][] = [
    ["Type", <TypeChip key="t" type={o.type} />], ["Headquarters", val(o.hq) ?? <Unavailable />], ["Founded", val(o.founded) ?? <Unavailable />],
    ["Website", val(o.website) ? <SourceLink url={`https://${o.website!.replace(/^https?:\/\//, "")}`}>{o.website}</SourceLink> : <Unavailable />],
    ["Parent", o.parent_id ? <Link className="underline" href={`/watchlist/${o.parent_id}`}>{orgName(o.parent_id)}</Link> : (val(o.parent ?? undefined) ?? "—")],
    ["Ownership", val(o.ownership) ?? <Unavailable />], ["International", val(o.international) ?? <Unavailable />],
  ];
  return (
    <article className="space-y-5" data-testid="dossier" data-org={id}>
      <header className="relative overflow-hidden rounded-2xl border border-border bg-[#12171D] text-[#ECE6DA]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/uae/sections/dossier-header.webp" srcSet="/brand/uae/sections/dossier-header.webp 1x, /brand/uae/sections/dossier-header@2x.webp 2x" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#12171D] via-[#12171D]/90 to-transparent" aria-hidden />
        <div className="relative flex flex-wrap items-center gap-4 p-5 sm:p-7">
          <OrgLogo id={id} name={o.name} size={64} className="bg-white" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D8C3A0]"><Link href="/watchlist" className="hover:underline">Watchlist</Link> · Dossier</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl" data-testid="dossier-title">{o.name}</h1>{(o as { name_ar?: string }).name_ar && <p lang="ar" dir="rtl" className="mt-1 text-base text-[#C9CED3]">{(o as { name_ar?: string }).name_ar}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#C9CED3]"><TypeChip type={o.type} /><span>{o.hq}</span><ConfidenceMeter value={o.confidence} /><span>coverage {Math.round(o.coverage * 100)}%</span></div>
          </div>
          <AskInChat id={id} name={o.name} />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Source-backed briefing" className="lg:col-span-2" testId="dossier-briefing">
          <p className="text-[15px] leading-relaxed"><CitedText text={o.briefing} sources={o.sources} /></p>
          {o.seed_facts && <p className="mt-3 rounded-md bg-[var(--surface-2)] px-3 py-2 text-xs text-muted"><strong className="text-foreground">Verified seed facts (mission brief):</strong> {o.seed_facts}</p>}
          {(o.conflicts ?? []).filter(Boolean).length > 0 && <div className="mt-3 rounded-md border border-[#C0763A]/50 bg-[#C0763A]/10 px-3 py-2 text-xs" data-testid="conflicts"><strong>{o.conflicts!.some((c) => /leadership under review/i.test(c)) ? "Leadership under review — conflicting sources:" : "Conflicting sources:"}</strong><ul className="ml-4 list-disc">{o.conflicts!.map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
          {(o.unavailable ?? []).length > 0 && <p className="mt-3 text-xs text-muted">Unavailable: {(o.unavailable ?? []).join(" · ")}</p>}
        </Panel>
        <Panel title="Key facts" testId="dossier-facts">
          <dl className="space-y-2 text-sm">{facts.map(([k, v]) => <div key={k} className="grid grid-cols-[96px_1fr] gap-2"><dt className="text-muted">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>)}</dl>
          <p className="mt-3 text-[11px] text-muted">Logo: {lp.status === "official" ? <>icon fetched from official domain <code>{hostOf(lp.source)}</code></> : <>monogram — {lp.reason}</>}</p>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Leadership" testId="dossier-leadership">
          {(o.leadership ?? []).length ? <ul className="space-y-2 text-sm">{o.leadership!.map((l, i) => <li key={i}><p className="font-medium">{l.name}</p><p className="text-xs text-muted">{l.role}{l.as_of ? ` · as of ${l.as_of}` : ""} · <SourceLink url={l.source_url}>{l.source_url ? hostOf(l.source_url) : "source"}</SourceLink></p></li>)}</ul> : <Unavailable what="leadership" />}
        </Panel>
        <Panel title="Technology map" testId="dossier-tech">
          {(o.technologies ?? []).length ? <ul className="flex flex-wrap gap-1.5">{o.technologies!.map((t, i) => <li key={i} className="rounded-md border border-border px-2 py-1 text-xs" title={t.category}><span className="mr-1 text-[10px] uppercase text-[var(--uae-gold-ink)] dark:text-[var(--uae-gold)]">{t.category}</span><SourceLink url={t.source_url} className="no-underline">{t.name}</SourceLink></li>)}</ul> : <Unavailable what="technologies" />}
          {(o.ai_focus ?? []).length > 0 && <p className="mt-3 text-xs text-muted">Focus: {o.ai_focus!.join(" · ")}</p>}
          {models.length > 0 && <div className="mt-3"><p className="text-xs font-medium">HuggingFace models ({models.length})</p><ul className="mt-1 space-y-0.5 text-xs">{models.slice(0, 6).map((m) => <li key={m.id} className="flex justify-between gap-2"><a className="truncate hover:underline" href={m.url} target="_blank" rel="noopener noreferrer">{m.id}</a><span className="shrink-0 tabular-nums text-muted">♥ {m.likes || "n/a"} · ↓ {m.downloads ? m.downloads.toLocaleString() : "n/a"}</span></li>)}</ul></div>}
        </Panel>
        <Panel title="Related organisations" testId="dossier-related">
          <ul className="space-y-1.5 text-sm">{[...kids.map((k) => ({ other: k.id, rel: "owns", url: "" })), ...edges.filter((e) => !(e.relation === "owns" && kids.some((k) => k.id === e.target))).map((e) => ({ other: e.source === id ? e.target : e.source, rel: e.source === id ? e.relation : `${e.relation} (by)`, url: e.url }))].slice(0, 14).map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-2"><span className="min-w-0 truncate">{r.other.startsWith("ext:") ? orgName(r.other) : <Link className="hover:underline" href={`/watchlist/${r.other}`}>{orgName(r.other)}</Link>}</span><span className="shrink-0 text-[11px] text-muted">{r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{r.rel}</a> : r.rel}</span></li>))}
            {kids.length + edges.length === 0 && <li><Unavailable what="relationships" /></li>}</ul>
          <Link href={`/graph?focus=${id}`} className="mt-3 inline-block text-xs font-medium text-[var(--brand-green-ink)] hover:underline">View in ecosystem graph →</Link>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Timeline" className="lg:col-span-2" testId="dossier-timeline">
          {(o.timeline ?? []).length ? <ol className="relative ml-2 space-y-3 border-l border-border pl-4">{[...o.timeline!].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).map((t, i) => <li key={i} className="text-sm"><span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-[var(--uae-emerald)]" aria-hidden /><time className="text-xs font-medium tabular-nums text-[var(--uae-gold-ink)] dark:text-[var(--uae-gold)]">{t.date}</time><p><SourceLink url={t.source_url} className="no-underline hover:underline">{t.event}</SourceLink></p></li>)}</ol> : <Unavailable what="timeline" />}
        </Panel>
        <Panel title={`Public sentiment (${voices.length})`} testId="dossier-sentiment">
          {voices.length ? <><div className="flex h-2.5 overflow-hidden rounded-full">{SENT_CLASSES.map((k) => cc[k] ? <span key={k} style={{ width: `${(cc[k] / voices.length) * 100}%`, background: CLASS_COLOR[k] }} title={`${k} ${cc[k]}`} /> : null)}</div>
            <ul className="mt-3 space-y-2">{voices.slice(0, 5).map((r) => <li key={r.id} className="text-xs"><span className="inline-flex items-center gap-1 font-medium"><ClassDot k={r.sentiment_class} size={8} />{r.sentiment_class}</span><p className="mt-0.5 text-muted">“{r.text.slice(0, 160)}{r.text.length > 160 ? "…" : ""}” — <SourceLink url={r.url_verified ? r.url : null}>{r.author && r.author !== "unattributed" ? r.author : r.outlet || hostOf(r.url) || "source"}</SourceLink></p></li>)}</ul>
            <Link href={`/sentiment?org=${id}`} className="mt-2 inline-block text-xs font-medium text-[var(--brand-green-ink)] hover:underline">Open in Sentiment Universe →</Link></> : <p className="text-sm text-muted">No attributable public statements in the sample mention this organisation — coverage gap, not a neutral signal.</p>}
        </Panel>
      </div>

      <Panel title={`News (${news.length})`} testId="dossier-news">
        {news.length ? <ul className="grid gap-2 md:grid-cols-2">{news.slice(0, 12).map((n) => <li key={n.id} className="rounded-lg border border-border p-3 text-sm"><time className="text-xs tabular-nums text-muted">{n.date}</time> <span className="text-[10px] uppercase text-muted">· {n.category}</span><p className="mt-0.5 font-medium"><SourceLink url={n.url} className="no-underline hover:underline">{n.headline}</SourceLink></p><p className="mt-0.5 text-xs text-muted">{n.summary}</p></li>)}</ul> : <Unavailable what="no news items in the research corpus" />}
      </Panel>

      <Panel title={`Sources (${(o.sources ?? []).length})`} testId="dossier-sources">
        <ol className="space-y-1 text-xs">{(o.sources ?? []).map((s, i) => <li key={i}>[{s.n ?? i + 1}] <SourceLink url={s.url}>{s.title || s.publisher || hostOf(s.url) || "source"}</SourceLink> {s.publisher ? <span className="text-muted">· {s.publisher}</span> : null} {s.date ? <span className="text-muted">· {s.date}</span> : null}{s.note && <span className="text-muted"> — {s.note}</span>}</li>)}</ol>
        <p className="mt-3 text-[11px] text-muted">Provenance: {o.provenance?.method} · namespace {o.provenance?.namespace} · {o.dropped_unverified_urls ?? 0} model-proposed URL(s) not found in the research corpus were removed.</p>
      </Panel>
    </article>
  );
}
