"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Newspaper, MessageSquare, Users, Linkedin, Globe, ArrowUpRight, UserCheck } from "lucide-react";
import { sectorTheme } from "@/lib/social-sectors";
import type { GalleryCompany, GalleryFounder } from "./companies-gallery";

const initials = (n: string) =>
  n
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export type CardTopBadgesProps = {
  company: GalleryCompany;
  activeSector?: string;
  onSelectSector: (sectorKey: string) => void;
  onQuickView: (company: GalleryCompany, tab?: "overview" | "rounds" | "people") => void;
};

export function CardTopBadges({
  company,
  activeSector,
  onSelectSector,
  onQuickView,
}: CardTopBadgesProps) {
  const t = sectorTheme(company.sector);
  const isSectorActive = activeSector === company.sector;

  return (
    <div className="cg-card__meta">
      <button
        type="button"
        className={`cg-sector cg-sector--btn ${isSectorActive ? "cg-sector--active" : ""}`}
        data-testid="company-card-sector"
        data-sector={company.sector}
        aria-pressed={isSectorActive}
        onClick={() => onSelectSector(isSectorActive ? "" : company.sector)}
        title={`Filter directory by ${t.label}`}
      >
        <span className="cg-sector__dot" style={{ background: t.from }} aria-hidden="true" />
        <span>{t.label}</span>
      </button>

      <div className="cg-meta-pills">
        <button
          type="button"
          className="cg-news cg-news--btn"
          data-testid="news-badge"
          data-count={company.news_count}
          onClick={() => onQuickView(company, "overview")}
          title={`Preview ${company.news_count} news items & signals for ${company.name}`}
          aria-label={`${company.news_count} news items for ${company.name}`}
        >
          <Newspaper className="size-3 shrink-0" aria-hidden="true" />
          <span>{company.news_count}</span>
        </button>

        <Link
          href={`/social?sector=${encodeURIComponent(company.sector)}`}
          className="cg-news cg-news--btn cg-social-chip"
          data-testid="social-badge"
          data-count={company.social_count}
          title={`View ${company.social_count} B Social posts (${t.label})`}
          aria-label={`Social ${company.social_count} posts for ${company.name}`}
        >
          <MessageSquare className="size-3 shrink-0" aria-hidden="true" />
          <span>Social {company.social_count}</span>
        </Link>
      </div>
    </div>
  );
}

export type CardFoundersStripProps = {
  company: GalleryCompany;
  onQuickViewPeople: (company: GalleryCompany) => void;
};

export function CardFoundersStrip({ company, onQuickViewPeople }: CardFoundersStripProps) {
  const [activeFounder, setActiveFounder] = useState<GalleryFounder | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const t = sectorTheme(company.sector);

  useEffect(() => {
    if (!activeFounder) return;
    const onDocClick = (e: MouseEvent) => {
      if (stripRef.current && !stripRef.current.contains(e.target as Node)) {
        setActiveFounder(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveFounder(null);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [activeFounder]);

  const visibleFounders = company.founders.slice(0, 3);
  const extraCount = Math.max(0, company.founders.length - visibleFounders.length);
  const cleanDomainUrl = company.domain
    ? /^https?:\/\//i.test(company.domain)
      ? company.domain
      : `https://${company.domain.replace(/^\/+/, "")}`
    : null;

  return (
    <div
      className="cg-founders"
      data-testid="founders-strip"
      data-count={company.founders.length}
      ref={stripRef}
    >
      <Users className="size-3.5 shrink-0 text-muted" aria-hidden="true" />

      {visibleFounders.length > 0 ? (
        <>
          {visibleFounders.map((f) => {
            const isSelected = activeFounder?.id === f.id;
            const firstName = f.name.split(/\s+/)[0] || f.name;
            return (
              <button
                key={f.id}
                type="button"
                className={`cg-founder cg-founder--btn ${isSelected ? "cg-founder--active" : ""}`}
                data-testid="investor-chip-button"
                data-founder-id={f.id}
                aria-expanded={isSelected}
                onClick={() => setActiveFounder(isSelected ? null : f)}
                title={`${f.name} — ${f.role} (click for contact & role card)`}
              >
                <span className="cg-founder__av" style={{ background: "#1F2937" }}>
                  {initials(f.name)}
                </span>
                <span className="cg-founder__name">{firstName}</span>
              </button>
            );
          })}
          {extraCount > 0 && (
            <button
              type="button"
              className="cg-founder-more"
              onClick={() => onQuickViewPeople(company)}
              data-testid="founders-more-button"
              title={`View all ${company.founders.length} leadership & founder contacts`}
            >
              +{extraCount}
            </button>
          )}
        </>
      ) : (
        <span className="cg-founder--none">Leadership records syncing</span>
      )}

      <div className="cg-ext-links">
        {cleanDomainUrl && (
          <a
            href={cleanDomainUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cg-ext-link"
            aria-label={`${company.name} website`}
            title={`Visit ${company.domain}`}
            data-testid="company-website-link"
          >
            <Globe className="size-3.5" aria-hidden="true" />
          </a>
        )}
        {company.linkedin && (
          <a
            href={company.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="cg-li cg-ext-link"
            aria-label={`${company.name} on LinkedIn`}
            title={`${company.name} on LinkedIn`}
            data-testid="company-linkedin-link"
          >
            <Linkedin className="size-3.5" aria-hidden="true" />
          </a>
        )}
      </div>

      {/* Interactive Founder / Contact Popover Card */}
      {activeFounder && (
        <div
          className="cg-popover cg-popover--founder"
          data-testid="investor-chip-popover"
          role="dialog"
          aria-label={`${activeFounder.name} contact details`}
        >
          <div className="cg-founder-pop__head">
            <span className="cg-founder-pop__av">{initials(activeFounder.name)}</span>
            <div className="min-w-0 flex-1">
              <strong className="cg-founder-pop__name">{activeFounder.name}</strong>
              <p className="cg-founder-pop__role">{activeFounder.role || "Founder / Executive"}</p>
            </div>
            <span className="cg-founder-pop__sector" style={{ color: t.ink, background: t.soft }}>
              {t.label}
            </span>
          </div>
          <div className="cg-founder-pop__meta">
            <UserCheck className="size-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
            <span>Verified portfolio leadership at {company.name}</span>
          </div>
          <div className="cg-founder-pop__actions">
            <Link
              href={`/social/people/${encodeURIComponent(activeFounder.id)}`}
              className="cg-popover__action"
              data-testid="investor-popover-profile-link"
            >
              <span>Open Person Profile</span>
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="cg-popover__secondary"
              onClick={() => {
                setActiveFounder(null);
                onQuickViewPeople(company);
              }}
            >
              All leadership ({company.founders.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
