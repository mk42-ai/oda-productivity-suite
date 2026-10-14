"use client";
/**
 * Companies — colour-system redesign (2026-10-12). One distinct palette + gradient per sector (lib/social-sectors.ts), website-domain
 * favicons as logos, colourful cards with: funding timeline, sentiment sparkline (seed points excluded; placeholder state when < 2 scored
 * points), news-count badge, PitchBook fields, founders strip, sector + region filters and latest-first sorting (by last funding / PitchBook
 * investment date). Filter/sort state lives in the URL (?sector=&region=&sort=&q=). Cards use content-visibility so 136 cards stay cheap.
 */
import Link from "next/link";
import { useMemo, useRef, useState, useEffect, type CSSProperties } from "react";
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

/** Pure DOM bounding-box self-check helper exported for QA */
export function timelineLabelsOverlap(root: HTMLElement): number {
  if (!root || typeof root.querySelectorAll !== "function") return 0;
  const timelines = root.matches?.(".cg-timeline")
    ? [root]
    : Array.from(root.querySelectorAll<HTMLElement>(".cg-timeline"));

  const targets = timelines.length > 0 ? timelines : [root];
  let overlaps = 0;

  for (const tl of targets) {
    const labels = Array.from(tl.querySelectorAll<HTMLElement>(".cg-timeline__lbl"))
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

    for (let i = 0; i < labels.length; i++) {
      const a = labels[i].getBoundingClientRect();
      for (let j = i + 1; j < labels.length; j++) {
        const b = labels[j].getBoundingClientRect();
        const hasOverlap = !(
          a.right <= b.left + 0.5 ||
          a.left >= b.right - 0.5 ||
          a.bottom <= b.top + 0.5 ||
          a.top >= b.bottom - 0.5
        );
        if (hasOverlap) {
          overlaps++;
        }
      }
    }
  }

  return overlaps;
}

type TimelineRoundItem = { round: string | null; amount_usd: number | null; date: string | null };

function Timeline({ c }: { c: GalleryCompany }) {
  const rs = c.rounds
    .filter((r) => r.date)
    .slice(0, 6)
    .sort((a, b) => (Date.parse(a.date!) || 0) - (Date.parse(b.date!) || 0));

  if (!rs.length) {
    return (
      <p className="cg-timeline__none" data-testid="funding-timeline" data-rounds={0}>
        No dated rounds found yet
      </p>
    );
  }

  const d0 = Date.parse(rs[0].date!);
  const d1 = Date.parse(rs[rs.length - 1].date!);
  const span = Math.max(1, d1 - d0);

  type Cluster = {
    rounds: TimelineRoundItem[];
    pct: number;
  };

  let clusters: Cluster[] = rs.map((r) => ({
    rounds: [r],
    pct: rs.length === 1 || span === 1 ? 50 : ((Date.parse(r.date!) - d0) / span) * 100,
  }));

  // Merge nodes that fall within 9% of each other on the axis
  let changed = true;
  while (changed && clusters.length > 1) {
    changed = false;
    const next: Cluster[] = [];
    for (let i = 0; i < clusters.length; i++) {
      if (i < clusters.length - 1 && Math.abs(clusters[i + 1].pct - clusters[i].pct) <= 9) {
        const mergedRounds = [...clusters[i].rounds, ...clusters[i + 1].rounds];
        const avgPct =
          (clusters[i].pct * clusters[i].rounds.length +
            clusters[i + 1].pct * clusters[i + 1].rounds.length) /
          mergedRounds.length;
        next.push({ rounds: mergedRounds, pct: avgPct });
        i++;
        changed = true;
      } else {
        next.push(clusters[i]);
      }
    }
    clusters = next;
  }

  return (
    <ol
      className="cg-timeline"
      data-testid="funding-timeline"
      data-rounds={rs.length}
      aria-label={`Funding timeline, ${rs.length} rounds`}
    >
      {clusters.map((cluster, i) => {
        const isAbove = i % 2 === 0;
        const left = clusters.length === 1 ? 50 : Math.max(8, Math.min(92, cluster.pct));
        const isMerged = cluster.rounds.length > 1;
        const isBcap = cluster.rounds.some(
          (r) => /b capital/i.test(r.round ?? "") || (r as any).bcap === "lead"
        );

        let desktopLabel: string;
        let mobileLabel: string;
        let fullLabel: string;

        if (isMerged) {
          desktopLabel = `${cluster.rounds.length} rounds`;
          mobileLabel = `${cluster.rounds.length} rounds: ${cluster.rounds
            .map((r) => [r.round ?? "Round", r.date ? r.date.slice(0, 4) : "", fmtUsd(r.amount_usd) ?? "undisclosed"].filter(Boolean).join(" · "))
            .join("; ")}`;
          fullLabel = `${cluster.rounds.length} rounds: ${cluster.rounds
            .map((r) => `${r.round ?? "Round"} · ${fmtUsd(r.amount_usd) ?? "undisclosed"} · ${r.date}`)
            .join("; ")}`;
        } else {
          const r = cluster.rounds[0];
          const roundName = (r.round ?? "Round").replace(/Series /i, "");
          const yr = r.date ? r.date.slice(0, 4) : "";
          const amt = fmtUsd(r.amount_usd) ?? "undisclosed";
          desktopLabel = yr ? `${roundName} ${yr}` : roundName;
          mobileLabel = [r.round ?? "Round", yr, amt].filter(Boolean).join(" · ");
          fullLabel = `${r.round ?? "Round"} · ${amt} · ${r.date}`;
        }

        return (
          <li
            key={i}
            className={`cg-timeline__item ${isAbove ? "cg-timeline__item--above" : "cg-timeline__item--below"}`}
            style={{ left: `${left}%` }}
            tabIndex={0}
            aria-label={fullLabel}
            title={fullLabel}
          >
            <span
              className={`cg-timeline__dot${isBcap ? " cg-timeline__dot--bcap" : ""}`}
              aria-hidden="true"
            />
            <span className="cg-timeline__lbl" title={fullLabel}>
              <span className="cg-timeline__lbl-desktop">{desktopLabel}</span>
              <span className="cg-timeline__lbl-mobile">{mobileLabel}</span>
            </span>
            <span role="tooltip" className="cg-timeline__tooltip">
              {fullLabel}
            </span>
          </li>
        );
      })}
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
          <div data-testid="pitchbook-fields"><dt><Landmark className="inline size-3" aria-hidden /> PitchBook</dt><dd>{c.pitchbook ? `invested ${c.pitchbook.investment_date} · since ${c.pitchbook.investor_since}` : "Not in PitchBook investor rows"}</dd></div>
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
  const [q, setQState] = useState(sp.get("q") ?? ""); const sector = sp.get("sector") ?? ""; const region = sp.get("region") ?? "";
  const sort = (["latest", "news", "sentiment", "name"].includes(sp.get("sort") ?? "") ? sp.get("sort") : "latest") as Sort;
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp.toString()); if (v) n.set(k, v); else n.delete(k); const s = n.toString(); router.replace(s ? `${path}?${s}` : path, { scroll: false }); };
  const debounceRef = useRef<number | undefined>(undefined);
  // Search input is local for responsiveness; the URL is written debounced, and
  // external URL changes (browser back/forward, deep link) sync back into the
  // input. Previously the write-back effect ran on every render and re-pushed
  // the stale query after Back, trapping the user on the filtered view.
  const setQ = (v: string) => {
    setQState(v);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => { debounceRef.current = undefined; setParam("q", v); }, 200);
  };
  const spQ = sp.get("q") ?? "";
  useEffect(() => {
    // External param change wins over any pending debounced write-back.
    if (debounceRef.current) { window.clearTimeout(debounceRef.current); debounceRef.current = undefined; }
    setQState((prev) => (prev === spQ ? prev : spQ));
  }, [spQ]);
  useEffect(() => () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); }, []);
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
        <button type="button" className="cg-chip chip" data-sector="all" aria-pressed={!sector} onClick={() => setParam("sector", "")}>All <span>{rows.length}</span></button>
        {SECTOR_KEYS.filter((k) => counts.get(k)).map((k: SectorKey) => { const t = SECTOR_THEMES[k]; return (
          <button key={k} type="button" className="cg-chip chip" data-testid="companies-sector-chip" data-sector={k} aria-pressed={sector === k} onClick={() => setParam("sector", sector === k ? "" : k)}>{t.label} <span>{counts.get(k)}</span></button>); })}
      </div>
      <div className="cg-grid" data-testid="companies-list" data-visible={visible.length}>
        {visible.map((c) => <CompanyGalleryCard key={c.slug} c={c} />)}
      </div>
      {visible.length === 0 && <div className="cg-empty"><p>No companies match — try another sector or region.</p></div>}
    </div>
  );
}
