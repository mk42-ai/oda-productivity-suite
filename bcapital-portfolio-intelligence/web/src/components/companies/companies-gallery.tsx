"use client";
/**
 * Companies — Redesigned uncluttered directory & interactive profile cards (2026-10-15).
 * Neutral charcoal (#1F2937) + B Capital green (#0AC985) sector controls with hover tooltips,
 * non-truncating HQ/round labels, interactive 2x2 metrics with PitchBook/sentiment popovers,
 * interactive funding timeline with inline round details, interactive founder contact chips,
 * and a slide-over Quick Preview drawer coordinated with the PitchBook dock.
 */
import { useMemo, useRef, useState, useEffect, useCallback, type CSSProperties } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { sectorTheme } from "@/lib/social-sectors";
import { openPitchbookDock } from "@/components/pitchbook/pitchbook-dock";
import { DirectoryFilterBar, type DirectorySort } from "./directory-filter-bar";
import { CardHeaderSection } from "./card-header-section";
import { CardMetricsPanel } from "./card-metrics-panel";
import { CardFundingTimeline, timelineLabelsOverlap } from "./card-funding-timeline";
import { CardTopBadges, CardFoundersStrip } from "./card-badges-and-people";
import { CompanyQuickViewDrawer, type QuickViewTab } from "./company-quick-view-drawer";
import type { CompanySentimentProvenance } from "@/lib/sentiment-provenance";
import { MotionCard } from "@/components/ui/motion-card";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import "./companies-gallery.css";
import "./companies-redesign.css";

export { timelineLabelsOverlap };

export type GalleryFounder = { id: string; name: string; role: string };
export type GalleryCompany = {
  slug: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  sector: string;
  sector_label: string;
  region: string | null;
  hq: string | null;
  stage: string | null;
  description: string | null;
  employees: number | null;
  founded: number | null;
  total_raised_usd: number | null;
  valuation_usd: number | null;
  linkedin: string | null;
  last_round: { round: string | null; amount_usd: number | null; date: string | null; source_url?: string | null } | null;
  rounds: { round: string | null; amount_usd: number | null; date: string | null; source_url?: string | null }[];
  pitchbook: { investment_date: string; investor_since: string } | null;
  news_count: number;
  social_count: number;
  sentiment: {
    score: number | null;
    label: string;
    history: { t: string; score: number }[];
    history_state: "placeholder" | "scored";
    step2_seed: boolean;
  };
  provenance?: CompanySentimentProvenance;
  founders: GalleryFounder[];
};

const latestDate = (c: GalleryCompany) =>
  c.last_round?.date ?? c.pitchbook?.investment_date ?? null;

export type CompanyGalleryCardProps = {
  c: GalleryCompany;
  activeSector?: string;
  onSelectSector?: (sectorKey: string) => void;
  onQuickView?: (company: GalleryCompany, tab?: QuickViewTab) => void;
  onOpenPitchbook?: (slug: string) => void;
};

export function CompanyGalleryCard({
  c,
  activeSector = "",
  onSelectSector,
  onQuickView,
  onOpenPitchbook,
}: CompanyGalleryCardProps) {
  const t = sectorTheme(c.sector);
  const handleSelectSector = useCallback(
    (s: string) => {
      onSelectSector?.(s);
    },
    [onSelectSector]
  );
  const handleQuickView = useCallback(
    (comp: GalleryCompany, tab: QuickViewTab = "overview") => {
      onQuickView?.(comp, tab);
    },
    [onQuickView]
  );
  const handleOpenPitchbook = useCallback(
    (slug: string) => {
      if (onOpenPitchbook) onOpenPitchbook(slug);
      else openPitchbookDock(slug);
    },
    [onOpenPitchbook]
  );

  return (
    <article
      className="cg-card"
      data-testid="company-card"
      data-sector={c.sector}
      data-slug={c.slug}
      style={
        {
          "--cg-from": t.from,
          "--cg-to": t.to,
          "--cg-ink": t.ink,
          "--cg-soft": t.soft,
        } as CSSProperties
      }
    >
      <MotionCard className="cg-card__body">
        <CardTopBadges
          company={c}
          activeSector={activeSector}
          onSelectSector={handleSelectSector}
          onQuickView={handleQuickView}
        />

        <CardHeaderSection company={c} onQuickView={handleQuickView} />

        <CardMetricsPanel
          company={c}
          onOpenPitchbook={handleOpenPitchbook}
          onQuickView={handleQuickView}
        />

        <CardFundingTimeline company={c} />

        <CardFoundersStrip
          company={c}
          onQuickViewPeople={(comp) => handleQuickView(comp, "people")}
        />
      </MotionCard>
    </article>
  );
}

export function CompaniesGallery({ rows }: { rows: GalleryCompany[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();

  const [q, setQState] = useState(sp.get("q") ?? "");
  const sector = sp.get("sector") ?? "";
  const region = sp.get("region") ?? "";
  const sort = (
    ["latest", "news", "sentiment", "name"].includes(sp.get("sort") ?? "")
      ? sp.get("sort")
      : "latest"
  ) as DirectorySort;

  const [quickViewCompany, setQuickViewCompany] = useState<GalleryCompany | null>(null);
  const [quickViewTab, setQuickViewTab] = useState<QuickViewTab>("overview");

  const setParam = useCallback(
    (k: string, v: string) => {
      const n = new URLSearchParams(sp.toString());
      if (v) n.set(k, v);
      else n.delete(k);
      const s = n.toString();
      router.replace(s ? `${path}?${s}` : path, { scroll: false });
    },
    [sp, router, path]
  );

  const debounceRef = useRef<number | undefined>(undefined);
  const setQ = useCallback(
    (v: string) => {
      setQState(v);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = undefined;
        setParam("q", v);
      }, 200);
    },
    [setParam]
  );

  const clearAllFilters = useCallback(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
    setQState("");
    toast.success("Filters reset");
    const n = new URLSearchParams(sp.toString());
    n.delete("q");
    n.delete("sector");
    n.delete("region");
    n.delete("sort");
    const s = n.toString();
    router.replace(s ? `${path}?${s}` : path, { scroll: false });
  }, [sp, router, path]);

  const spQ = sp.get("q") ?? "";
  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
    setQState((prev) => (prev === spQ ? prev : spQ));
  }, [spQ]);

  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    },
    []
  );

  const regions = useMemo(
    () => [...new Set(rows.map((r) => r.region).filter(Boolean) as string[])].sort(),
    [rows]
  );

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.sector, (m.get(r.sector) ?? 0) + 1));
    return m;
  }, [rows]);

  const visible = useMemo(() => {
    const n = q.trim().toLowerCase();
    const hit = rows.filter(
      (r) =>
        (!sector || r.sector === sector) &&
        (!region || r.region === region) &&
        (!n ||
          [
            r.name,
            r.sector_label,
            r.hq ?? "",
            r.region ?? "",
            r.description ?? "",
            ...r.founders.map((f) => f.name),
          ].some((v) => v.toLowerCase().includes(n)))
    );
    const cmp: Record<DirectorySort, (a: GalleryCompany, b: GalleryCompany) => number> = {
      latest: (a, b) =>
        (latestDate(b) ?? "").localeCompare(latestDate(a) ?? "") ||
        a.name.localeCompare(b.name),
      news: (a, b) => b.news_count - a.news_count || a.name.localeCompare(b.name),
      sentiment: (a, b) =>
        (b.sentiment.score ?? -2) - (a.sentiment.score ?? -2) ||
        a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return [...hit].sort(cmp[sort]);
  }, [rows, q, sector, region, sort]);

  const handleOpenQuickView = useCallback(
    (company: GalleryCompany, tab: QuickViewTab = "overview") => {
      setQuickViewTab(tab);
      setQuickViewCompany(company);
    },
    []
  );

  const handleOpenPitchbook = useCallback((slug: string) => {
    setQuickViewCompany(null);
    openPitchbookDock(slug);
  }, []);

  return (
    <div data-testid="companies-gallery">
      <DirectoryFilterBar
        q={q}
        onSearchChange={setQ}
        sector={sector}
        onSectorChange={(s) => setParam("sector", s)}
        region={region}
        onRegionChange={(r) => setParam("region", r)}
        sort={sort}
        onSortChange={(s) => setParam("sort", s === "latest" ? "" : s)}
        regions={regions}
        counts={counts}
        totalCount={rows.length}
        visibleCount={visible.length}
        onClearAll={clearAllFilters}
      />

      <div className="cg-grid" data-testid="companies-list" data-visible={visible.length}>
        {visible.map((c) => (
          <CompanyGalleryCard
            key={c.slug}
            c={c}
            activeSector={sector}
            onSelectSector={(s) => setParam("sector", s)}
            onQuickView={handleOpenQuickView}
            onOpenPitchbook={handleOpenPitchbook}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="cg-empty" data-testid="companies-empty-state">
          <EmptyState
            illustration
            compact
            title="No companies match these filters"
            body="Try a different sector or clear the search."
            action={
              <button type="button" className="dfb-reset-btn" onClick={clearAllFilters}>
                Reset all filters
              </button>
            }
          />
        </div>
      )}

      <CompanyQuickViewDrawer
        company={quickViewCompany}
        initialTab={quickViewTab}
        onClose={() => setQuickViewCompany(null)}
        onOpenPitchbookDock={handleOpenPitchbook}
      />
    </div>
  );
}
