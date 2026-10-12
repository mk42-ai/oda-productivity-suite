"use client";
/**
 * Companies — colour-system redesign (2026-10-12). One distinct palette + gradient per sector (lib/social-sectors.ts), website-domain
 * favicons as logos, colourful cards with: funding timeline, sentiment sparkline (seed points excluded; placeholder state when < 2 scored
 * points), news-count badge, PitchBook fields, founders strip, sector + region filters and latest-first sorting (by last funding / PitchBook
 * investment date). Filter/sort state lives in the URL (?sector=&region=&sort=&q=). Cards use content-visibility so 136 cards stay cheap.
 */
import Link from "next/link";
import { useMemo, useState, useEffect, type CSSProperties } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Newspaper, Landmark, Users, TrendingUp, Linkedin } from "lucide-react";
import { SECTOR_THEMES, SECTOR_KEYS, sectorTheme, sectorGradient, faviconUrl, type SectorKey } from "@/lib/social-sectors";
import "./companies-gallery.css";

export type GalleryFounder = { id: string; name: string; role: string };
export type GalleryCompany = {
  slug: string; name: string; domain: string | null; logo_url: string | null; sector: string; sector_label: string; region: string | null; hq: string | null; stage: string | null;
  description: string | null; employees: number | null; founded: number | null; total_raised_usd: number | null; valuation_usd: number | null; linkedin: string | null;
  last_round: { round: string | null; amount_usd: number | null; date: string | null } | null; rounds: { round: string | null; amount_usd: number | null; date: string | null }[];
  pitchbook: { investment_date: string; investor_since: string } | null; news_count: number;
  sentiment: { score: number | null; label: string; history: { t: string; score: number }[]; history_state: "placeholder" | "scored"; step2_seed: boolean };
  founders: GalleryFounder[];
};
type Sort = "latest" | "news" | "sentiment" | "name";
const fmtUsd = (n: number | null | undefined) => (n == null ? null : n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${Math.round(n / 1e6)}M` : `$${Math.round(n / 1e3)}K`);
const latestDate = (c: GalleryCompany) => c.last_round?.date ?? c.pitchbook?.investment_date ?? null;
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function Logo({ c }: { c: GalleryCompany }) {
  const [fail, setFail] = useState(false); const t = sectorTheme(c.sector);
  const src = faviconUrl(c.domain);
  return (
    <span className="cg-logo" style={{ borderColor: t.from }}>
      {src && !fail ? <img src={src} alt="" width={28} height={28} loading="lazy" decoding="async" onError={() => setFail(true)} onLoad={(e) => { if (e.currentTarget.naturalWidth < 2) setFail(true); }} data-testid="company-favicon" />
        : <span className="cg-logo__mono" style={{ background: sectorGradient(c.sector) }} data-testid="company-favicon-fallback">{initials(c.name)}</span>}
    </span>
  );
}

function Sparkline({ c }: { c: GalleryCompany }) {
  const t = sectorTheme(c.sector); const pts = c.sentiment.history;
  if (c.sentiment.history_state === "placeholder" || pts.length < 2) {
    return <div className="cg-spark cg-spark--empty" data-testid="sentiment-sparkline" data-state="placeholder" title="Seed-only history — not yet scored"><svg viewBox="0 0 120 32" aria-hidden><path d="M2 16 H118" strokeDasharray="4 4" /></svg><span>not yet scored</span></div>;
  }
  const xs = pts.map((p) => Date.parse(p.t)); const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  const d = pts.map((p, i) => `${i ? "L" : "M"}${(2 + ((xs[i] - x0) / Math.max(1, x1 - x0)) * 116).toFixed(1)} ${(30 - ((p.score + 1) / 2) * 28).toFixed(1)}`).join(" ");
  return (
    <div className="cg-spark" data-testid="sentiment-sparkline" data-state="scored" data-points={pts.length} title={`${pts.length} scored runs · latest ${pts[pts.length - 1].score.toFixed(2)}`}>
      <svg viewBox="0 0 120 32" aria-hidden><path d="M2 16 H118" className="cg-spark__zero" /><path d={d} style={{ stroke: t.from }} /></svg>
      <span style={{ color: t.ink }}>{c.sentiment.score != null ? c.sentiment.score.toFixed(2) : "—"} · {c.sentiment.label}</span>
    </div>
  );
}

function Timeline({ c }: { c: GalleryCompany }) {
  const t = sectorTheme(c.sector); const rs = c.rounds.filter((r) => r.date).slice(0, 6).reverse();
  if (!rs.length) return <p className="cg-timeline__none" data-testid="funding-timeline" data-rounds={0}>No dated rounds found yet</p>;
  const d0 = Date.parse(rs[0].date!), d1 = Date.parse(rs[rs.length - 1].date!);
  return (
    <ol className="cg-timeline" data-testid="funding-timeline" data-rounds={rs.length} style={{ "--cg-from": t.from, "--cg-to": t.to } as CSSProperties}>
      {rs.map((r, i) => { const left = rs.length === 1 ? 50 : ((Date.parse(r.date!) - d0) / Math.max(1, d1 - d0)) * 100; return (
        <li key={i} style={{ left: `${left}%` }} title={`${r.round ?? "Round"} · ${fmtUsd(r.amount_usd) ?? "undisclosed"} · ${r.date}`}><span className="cg-timeline__dot" /><span className="cg-timeline__lbl">{(r.round ?? "").replace(/Series /i, "")}<br />{r.date!.slice(0, 4)}</span></li>); })}
    </ol>
  );
}

export function CompanyGalleryCard({ c }: { c: GalleryCompany }) {
  const t = sectorTheme(c.sector);
  return (
    <article className="cg-card" data-testid="company-card" data-sector={c.sector} data-slug={c.slug} style={{ "--cg-from": t.from, "--cg-to": t.to, "--cg-ink": t.ink, "--cg-soft": t.soft } as CSSProperties}>
      <div className="cg-card__body">
        <div className="cg-card__meta">
          <span className="cg-sector" data-testid="company-card-sector">{t.label}</span>
          <span className="cg-news" data-testid="news-badge" data-count={c.news_count}><Newspaper className="size-3" aria-hidden /> {c.news_count}</span>
        </div>
        <div className="cg-card__head">
          <Logo c={c} />
          <div className="min-w-0">
            <Link href={`/company/${c.slug}`} className="cg-name" data-testid="company-row-name">{c.name}</Link>
            <p className="cg-sub">{[c.hq ?? c.region, c.founded ? `est. ${c.founded}` : null, c.employees ? `${c.employees.toLocaleString()} people` : null].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        {c.description && <p className="cg-desc">{c.description}</p>}
        <dl className="cg-facts">
          <div><dt>Last round</dt><dd data-testid="company-card-deal">{c.last_round ? [c.last_round.round, fmtUsd(c.last_round.amount_usd), c.last_round.date].filter(Boolean).join(" · ") : "—"}</dd></div>
          <div><dt>Total raised</dt><dd>{fmtUsd(c.total_raised_usd) ?? "—"}</dd></div>
          <div data-testid="pitchbook-fields"><dt><Landmark className="inline size-3" aria-hidden /> PitchBook</dt><dd>{c.pitchbook ? `invested ${c.pitchbook.investment_date} · since ${c.pitchbook.investor_since}` : "not in the 50 listed rows"}</dd></div>
          <div><dt><TrendingUp className="inline size-3" aria-hidden /> Sentiment</dt><dd><Sparkline c={c} /></dd></div>
        </dl>
        <Timeline c={c} />
        <div className="cg-founders" data-testid="founders-strip" data-count={c.founders.length}>
          <Users className="size-3.5 shrink-0" aria-hidden style={{ color: t.ink }} />
          {c.founders.length ? c.founders.slice(0, 4).map((f) => <Link key={f.id} href={`/social/people/${encodeURIComponent(f.id)}`} className="cg-founder" title={`${f.name} — ${f.role}`}><span className="cg-founder__av" style={{ background: sectorGradient(c.sector) }}>{initials(f.name)}</span>{f.name.split(" ")[0]}</Link>) : <span className="cg-founder--none">Founders not found yet</span>}
          {c.linkedin && <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="cg-li" aria-label={`${c.name} on LinkedIn`}><Linkedin className="size-3.5" aria-hidden /></a>}
        </div>
      </div>
    </article>
  );
}

export function CompaniesGallery({ rows }: { rows: GalleryCompany[] }) {
  const sp = useSearchParams(); const router = useRouter(); const path = usePathname();
  const [q, setQ] = useState(sp.get("q") ?? ""); const sector = sp.get("sector") ?? ""; const region = sp.get("region") ?? "";
  const sort = (["latest", "news", "sentiment", "name"].includes(sp.get("sort") ?? "") ? sp.get("sort") : "latest") as Sort;
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp.toString()); if (v) n.set(k, v); else n.delete(k); const s = n.toString(); router.replace(s ? `${path}?${s}` : path, { scroll: false }); };
  useEffect(() => { const t = setTimeout(() => { if ((sp.get("q") ?? "") !== q) setParam("q", q); }, 200); return () => clearTimeout(t); }); // eslint-disable-line react-hooks/exhaustive-deps
  const regions = useMemo(() => [...new Set(rows.map((r) => r.region).filter(Boolean) as string[])].sort(), [rows]);
  const counts = useMemo(() => { const m = new Map<string, number>(); rows.forEach((r) => m.set(r.sector, (m.get(r.sector) ?? 0) + 1)); return m; }, [rows]);
  const visible = useMemo(() => {
    const n = q.trim().toLowerCase();
    const hit = rows.filter((r) => (!sector || r.sector === sector) && (!region || r.region === region) && (!n || [r.name, r.sector_label, r.hq ?? "", r.description ?? ""].some((v) => v.toLowerCase().includes(n))));
    const cmp: Record<Sort, (a: GalleryCompany, b: GalleryCompany) => number> = {
      latest: (a, b) => (latestDate(b) ?? "").localeCompare(latestDate(a) ?? "") || a.name.localeCompare(b.name),
      news: (a, b) => b.news_count - a.news_count || a.name.localeCompare(b.name),
      sentiment: (a, b) => (b.sentiment.score ?? -2) - (a.sentiment.score ?? -2) || a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return [...hit].sort(cmp[sort]);
  }, [rows, q, sector, region, sort]);
  return (
    <div data-testid="companies-gallery">
      <div className="cg-toolbar" data-testid="companies-filter-bar">
        <div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" className="cg-input pl-9" placeholder="Search companies, sectors, cities…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="companies-search" aria-label="Search companies" /></div>
        <select className="cg-input w-auto" value={region} onChange={(e) => setParam("region", e.target.value)} data-testid="companies-region" aria-label="Region"><option value="">All regions</option>{regions.map((r) => <option key={r} value={r}>{r}</option>)}</select>
        <select className="cg-input w-auto" value={sort} onChange={(e) => setParam("sort", e.target.value === "latest" ? "" : e.target.value)} data-testid="companies-sort" aria-label="Sort">
          <option value="latest">Latest funding first</option><option value="news">Most news</option><option value="sentiment">Sentiment</option><option value="name">Name A–Z</option></select>
        <p className="ml-auto text-sm text-muted tabular-nums" role="status" data-testid="companies-count">Showing {visible.length} of {rows.length}</p>
      </div>
      <div className="cg-chips" role="group" aria-label="Filter by sector" data-testid="companies-sector-chips">
        <button type="button" className="cg-chip" aria-pressed={!sector} onClick={() => setParam("sector", "")} style={{ "--cg-from": "#16181b", "--cg-to": "#4b4f55" } as CSSProperties}>All <span>{rows.length}</span></button>
        {SECTOR_KEYS.filter((k) => counts.get(k)).map((k: SectorKey) => { const t = SECTOR_THEMES[k]; return (
          <button key={k} type="button" className="cg-chip" data-testid="companies-sector-chip" data-sector={k} aria-pressed={sector === k} onClick={() => setParam("sector", sector === k ? "" : k)} style={{ "--cg-from": t.from, "--cg-to": t.to } as CSSProperties}>{t.label} <span>{counts.get(k)}</span></button>); })}
      </div>
      <div className="cg-grid" data-testid="companies-list" data-visible={visible.length}>
        {visible.map((c) => <CompanyGalleryCard key={c.slug} c={c} />)}
      </div>
      {visible.length === 0 && <div className="cg-empty"><p>No companies match — try another sector or region.</p></div>}
    </div>
  );
}
