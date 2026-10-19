"use client";

import { Search, X, SlidersHorizontal, ArrowUpDown, Globe2, RotateCcw } from "lucide-react";
import { SECTOR_THEMES, SECTOR_KEYS, type SectorKey } from "@/lib/social-sectors";

export type DirectorySort = "latest" | "news" | "sentiment" | "name";

const SECTOR_ICON_MAP: Record<string, string> = {
  all: "sector-all",
  biotech: "sector-biotech",
  healthtech: "sector-healthtech",
  fintech: "sector-fintech",
  "ai-enterprise": "sector-ai-enterprise",
  robotics: "sector-robotics",
  climate: "sector-climate",
  "ai-infra": "sector-ai-infra",
  edtech: "sector-edtech",
  consumer: "sector-consumer",
  logistics: "sector-logistics",
};

const SECTOR_TOOLTIP_MAP: Record<string, string> = {
  all: "Show all 136 B Capital portfolio companies across every sector.",
  biotech: "Biotech companies developing biology-driven medicines, platforms, and therapies.",
  healthtech: "Healthtech companies improving clinical care delivery, diagnostics, and patient outcomes.",
  fintech: "Fintech & Crypto companies building payments, institutional banking, and digital asset infrastructure.",
  "ai-enterprise": "AI & Enterprise software companies embedding intelligence into core business workflows.",
  robotics: "Robotics & Space companies building autonomous machines, defense systems, and orbital hardware.",
  climate: "Climate & Mobility companies decarbonizing energy generation, storage, and transport.",
  "ai-infra": "AI Infrastructure companies providing compute clusters, foundation models, and data tooling.",
  edtech: "Edtech companies helping enterprises and learners train, credential, and upskill.",
  consumer: "Consumer & Marketplaces companies connecting buyers, creators, and commerce networks.",
  logistics: "Logistics companies modernizing freight, warehousing, and global supply-chain fulfillment.",
};

const SORT_LABELS: Record<DirectorySort, string> = {
  latest: "Latest funding first",
  news: "Most news coverage",
  sentiment: "Highest sentiment",
  name: "Name A–Z",
};

export type DirectoryFilterBarProps = {
  q: string;
  onSearchChange: (v: string) => void;
  sector: string;
  onSectorChange: (v: string) => void;
  region: string;
  onRegionChange: (v: string) => void;
  sort: DirectorySort;
  onSortChange: (v: DirectorySort) => void;
  regions: string[];
  counts: Map<string, number>;
  totalCount: number;
  visibleCount: number;
  onClearAll: () => void;
};

export function DirectoryFilterBar({
  q,
  onSearchChange,
  sector,
  onSectorChange,
  region,
  onRegionChange,
  sort,
  onSortChange,
  regions,
  counts,
  totalCount,
  visibleCount,
  onClearAll,
}: DirectoryFilterBarProps) {
  const hasActiveFilters = Boolean(q.trim() || sector || region || sort !== "latest");
  const activeSectorLabel = sector ? SECTOR_THEMES[sector as SectorKey]?.label ?? sector : null;

  return (
    <section
      className="dfb-shell"
      data-testid="directory-filter-bar"
      aria-label="Company directory controls"
    >
      {/* Primary search, region, sort, and count row */}
      <div className="cg-toolbar dfb-toolbar" data-testid="companies-filter-bar">
        <div className="dfb-search-wrap">
          <Search className="dfb-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="cg-input dfb-search-input"
            placeholder="Search companies, sectors, cities, founders…"
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            data-testid="companies-search"
            aria-label="Search companies"
          />
          {q && (
            <button
              type="button"
              className="dfb-search-clear"
              onClick={() => onSearchChange("")}
              aria-label="Clear search query"
              data-testid="companies-search-clear"
              title="Clear search"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="dfb-select-group">
          <div className="dfb-select-wrap">
            <Globe2 className="dfb-select-icon" aria-hidden="true" />
            <select
              className="cg-input dfb-select"
              value={region}
              onChange={(e) => onRegionChange(e.target.value)}
              data-testid="companies-region"
              aria-label="Region"
            >
              <option value="">All regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="dfb-select-wrap">
            <ArrowUpDown className="dfb-select-icon" aria-hidden="true" />
            <select
              className="cg-input dfb-select"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as DirectorySort)}
              data-testid="companies-sort"
              aria-label="Sort"
            >
              <option value="latest">Latest funding first</option>
              <option value="news">Most news</option>
              <option value="sentiment">Sentiment score</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        <div className="dfb-status-group">
          {hasActiveFilters && (
            <button
              type="button"
              className="dfb-reset-btn"
              onClick={onClearAll}
              data-testid="clear-directory-filters"
              aria-label="Reset all directory filters"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
          <p
            className="dfb-count tabular-nums"
            role="status"
            aria-live="polite"
            data-testid="companies-count"
          >
            Showing <strong>{visibleCount}</strong> of {totalCount}
          </p>
        </div>
      </div>

      {/* Neutral charcoal SVG sector filter strip (matching B Social neutral sector bar) */}
      <div
        className="cg-chips dfb-sector-strip"
        role="group"
        aria-label="Filter by sector"
        data-testid="companies-sector-chips"
      >
        <span className="dfb-tip-anchor">
          <button
            type="button"
            className="cg-chip dfb-sector-btn"
            data-sector="all"
            data-testid="companies-sector-chip-all"
            aria-pressed={!sector}
            aria-describedby="dfb-tip-all"
            onClick={() => onSectorChange("")}
          >
            <img
              className="dfb-sector-icon"
              src="/brand/icons/sector-all.svg"
              alt=""
              width={16}
              height={16}
              loading="lazy"
              aria-hidden="true"
            />
            <span className="dfb-sector-label">All</span>
            <span className="dfb-sector-count">{totalCount}</span>
          </button>
          <span id="dfb-tip-all" role="tooltip" className="dfb-tip">
            {SECTOR_TOOLTIP_MAP.all}
          </span>
        </span>

        {SECTOR_KEYS.filter((k) => counts.get(k)).map((k: SectorKey) => {
          const t = SECTOR_THEMES[k];
          const iconSlug = SECTOR_ICON_MAP[k] ?? "sector-all";
          const tipId = `dfb-tip-${k}`;
          const isSelected = sector === k;
          return (
            <span key={k} className="dfb-tip-anchor">
              <button
                type="button"
                className="cg-chip dfb-sector-btn"
                data-testid="companies-sector-chip"
                data-sector={k}
                aria-pressed={isSelected}
                aria-describedby={tipId}
                onClick={() => onSectorChange(isSelected ? "" : k)}
              >
                <img
                  className="dfb-sector-icon"
                  src={`/brand/icons/${iconSlug}.svg`}
                  alt=""
                  width={16}
                  height={16}
                  loading="lazy"
                  aria-hidden="true"
                />
                <span className="dfb-sector-label">{t.label}</span>
                <span className="dfb-sector-count">{counts.get(k)}</span>
              </button>
              <span id={tipId} role="tooltip" className="dfb-tip">
                {SECTOR_TOOLTIP_MAP[k] ?? `${t.label} portfolio companies.`}
              </span>
            </span>
          );
        })}
      </div>

      {/* Interactive active-filter feedback bar */}
      {hasActiveFilters && (
        <div
          className="dfb-active-bar"
          data-testid="active-filter-feedback"
          role="region"
          aria-label="Active filters"
        >
          <span className="dfb-active-title">
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            Active view:
          </span>
          {activeSectorLabel && (
            <button
              type="button"
              className="dfb-active-pill"
              onClick={() => onSectorChange("")}
              data-testid="active-pill-sector"
              aria-label={`Remove sector filter ${activeSectorLabel}`}
            >
              <span>Sector: {activeSectorLabel}</span>
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
          {region && (
            <button
              type="button"
              className="dfb-active-pill"
              onClick={() => onRegionChange("")}
              data-testid="active-pill-region"
              aria-label={`Remove region filter ${region}`}
            >
              <span>Region: {region}</span>
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
          {q.trim() && (
            <button
              type="button"
              className="dfb-active-pill"
              onClick={() => onSearchChange("")}
              data-testid="active-pill-search"
              aria-label={`Remove search filter ${q.trim()}`}
            >
              <span>Query: “{q.trim()}”</span>
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
          {sort !== "latest" && (
            <button
              type="button"
              className="dfb-active-pill"
              onClick={() => onSortChange("latest")}
              data-testid="active-pill-sort"
              aria-label={`Reset sort from ${SORT_LABELS[sort]}`}
            >
              <span>Sort: {SORT_LABELS[sort]}</span>
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="dfb-clear-link"
            onClick={onClearAll}
            data-testid="active-bar-clear-all"
          >
            Clear all
          </button>
        </div>
      )}
    </section>
  );
}
