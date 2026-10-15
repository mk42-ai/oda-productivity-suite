"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  X,
  Landmark,
  ExternalLink,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Newspaper,
  MessageSquare,
  Globe,
  Linkedin,
  ArrowUpRight,
} from "lucide-react";
import { sectorTheme, faviconUrl } from "@/lib/social-sectors";
import { safeExternalUrl, stopOutbound } from "@/lib/outbound";
import { fmtUsd, formatConciseRound } from "./card-metrics-panel";
import { SentimentProvenanceView } from "./sentiment-provenance-view";
import type { GalleryCompany } from "./companies-gallery";

export type QuickViewTab = "overview" | "provenance" | "rounds" | "people";

export type CompanyQuickViewDrawerProps = {
  company: GalleryCompany | null;
  initialTab?: QuickViewTab;
  onClose: () => void;
  onOpenPitchbookDock: (slug: string) => void;
};

const initials = (n: string) =>
  n
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function CompanyQuickViewDrawer({
  company,
  initialTab = "overview",
  onClose,
  onOpenPitchbookDock,
}: CompanyQuickViewDrawerProps) {
  const [tab, setTab] = useState<QuickViewTab>(initialTab);
  const [logoFail, setLogoFail] = useState(false);

  useEffect(() => {
    setTab(initialTab);
    setLogoFail(false);
  }, [company?.slug, initialTab]);

  useEffect(() => {
    if (!company) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPbOpen = () => onClose();
    document.addEventListener("keydown", onKey);
    window.addEventListener("bcap:pitchbook-dock", onPbOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("bcap:pitchbook-dock", onPbOpen);
    };
  }, [company, onClose]);

  if (!company) return null;

  const t = sectorTheme(company.sector);
  const logoSrc = faviconUrl(company.domain);
  const sortedRounds = [...company.rounds].sort(
    (a, b) => (Date.parse(b.date ?? "") || 0) - (Date.parse(a.date ?? "") || 0)
  );
  const rawDomainUrl = company.domain
    ? /^https?:\/\//i.test(company.domain)
      ? company.domain
      : `https://${company.domain.replace(/^\/+/, "")}`
    : null;
  const cleanDomainUrl = safeExternalUrl(rawDomainUrl);
  const cleanLinkedinUrl = safeExternalUrl(company.linkedin);

  return (
    <div className="cqv-root" data-testid="company-quick-view-root">
      <div
        className="cqv-backdrop"
        onClick={onClose}
        data-testid="company-quick-view-backdrop"
        aria-hidden="true"
      />
      <aside
        className="cqv-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`${company.name} quick preview`}
        data-testid="company-quick-view-drawer"
        data-slug={company.slug}
      >
        {/* Top bar */}
        <header className="cqv-head">
          <div className="cqv-head__identity">
            <span className="cqv-logo">
              {logoSrc && !logoFail ? (
                <img
                  src={logoSrc}
                  alt=""
                  width={32}
                  height={32}
                  onError={() => setLogoFail(true)}
                />
              ) : (
                <span className="cqv-logo__mono">{initials(company.name)}</span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="cqv-title-row">
                <h2 className="cqv-title">{company.name}</h2>
                <span
                  className="cqv-sector-pill"
                  style={{ color: t.ink, background: t.soft }}
                >
                  {t.label}
                </span>
              </div>
              <p className="cqv-subtitle">
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{company.hq ?? company.region ?? "Global"}</span>
                {company.founded ? <span>· est. {company.founded}</span> : null}
                {company.employees ? (
                  <span>· {company.employees.toLocaleString()} employees</span>
                ) : null}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="cqv-close"
            onClick={onClose}
            aria-label="Close quick preview"
            data-testid="company-quick-view-close"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        {/* Interactive Tabs */}
        <div className="cqv-tabs" role="tablist" aria-label="Company preview sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "overview"}
            className="cqv-tab"
            data-testid="quick-view-tab-overview"
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "provenance"}
            className="cqv-tab"
            data-testid="quick-view-tab-provenance"
            onClick={() => setTab("provenance")}
          >
            Sentiment Provenance
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "rounds"}
            className="cqv-tab"
            data-testid="quick-view-tab-rounds"
            onClick={() => setTab("rounds")}
          >
            Funding ({company.rounds.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "people"}
            className="cqv-tab"
            data-testid="quick-view-tab-people"
            onClick={() => setTab("people")}
          >
            Leadership ({company.founders.length})
          </button>
        </div>

        {/* Body */}
        <div className="cqv-body">
          {tab === "overview" && (
            <div className="cqv-section-stack" data-testid="quick-view-panel-overview">
              {company.description && (
                <section className="cqv-panel">
                  <h3 className="cqv-panel__title">Company Overview</h3>
                  <p className="cqv-desc">{company.description}</p>
                </section>
              )}

              <section className="cqv-panel">
                <h3 className="cqv-panel__title">Key Financial &amp; Signal Metrics</h3>
                <div className="cqv-kpi-grid">
                  <div className="cqv-kpi">
                    <span>
                      <DollarSign className="size-3.5" aria-hidden="true" /> Total Raised
                    </span>
                    <strong>{fmtUsd(company.total_raised_usd) ?? "Undisclosed"}</strong>
                  </div>
                  <div className="cqv-kpi">
                    <span>
                      <Calendar className="size-3.5" aria-hidden="true" /> Last Round
                    </span>
                    <strong>
                      {company.last_round
                        ? [
                            formatConciseRound(company.last_round.round),
                            fmtUsd(company.last_round.amount_usd),
                            company.last_round.date,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : "—"}
                    </strong>
                  </div>
                  <div className="cqv-kpi">
                    <span>
                      <TrendingUp className="size-3.5" aria-hidden="true" /> Sentiment
                    </span>
                    <strong>
                      {company.sentiment.score != null
                        ? `${company.sentiment.score.toFixed(2)} (${company.sentiment.label})`
                        : "Unscored"}
                    </strong>
                  </div>
                  <div className="cqv-kpi">
                    <span>
                      <Landmark className="size-3.5" aria-hidden="true" /> PitchBook Status
                    </span>
                    <strong>
                      {company.pitchbook
                        ? `Invested ${company.pitchbook.investment_date}`
                        : "Unmatched in batch"}
                    </strong>
                  </div>
                </div>
              </section>

              {company.provenance && (
                <section className="cqv-panel">
                  <div className="spv-head-row">
                    <h3 className="cqv-panel__title" style={{ margin: 0 }}>
                      Sentiment Provenance &amp; Native Citations
                    </h3>
                    <button
                      type="button"
                      className="cg-desc-toggle"
                      onClick={() => setTab("provenance")}
                      data-testid="quick-view-open-provenance-tab"
                    >
                      <span>Full breakdown →</span>
                    </button>
                  </div>
                  <SentimentProvenanceView
                    companyName={company.name}
                    companySlug={company.slug}
                    provenance={company.provenance}
                    compact
                    onOpenFullDrawer={() => setTab("provenance")}
                  />
                </section>
              )}

              <section className="cqv-panel">
                <h3 className="cqv-panel__title">Coverage &amp; External Channels</h3>
                <div className="cqv-links-row">
                  <Link
                    href={`/company/${company.slug}#news`}
                    className="cqv-channel-chip"
                    onClick={onClose}
                  >
                    <Newspaper className="size-3.5" aria-hidden="true" />
                    <span>{company.news_count} News Articles</span>
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                  </Link>
                  <Link
                    href={`/social?sector=${encodeURIComponent(company.sector)}`}
                    className="cqv-channel-chip"
                    onClick={onClose}
                    data-testid="quick-view-social-link"
                  >
                    <MessageSquare className="size-3.5" aria-hidden="true" />
                    <span>{company.social_count} B Social Posts</span>
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                  </Link>
                  {cleanDomainUrl && (
                    <a
                      href={cleanDomainUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={stopOutbound}
                      className="cqv-channel-chip"
                    >
                      <Globe className="size-3.5" aria-hidden="true" />
                      <span>{company.domain}</span>
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  )}
                  {cleanLinkedinUrl && (
                    <a
                      href={cleanLinkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={stopOutbound}
                      className="cqv-channel-chip"
                    >
                      <Linkedin className="size-3.5" aria-hidden="true" />
                      <span>LinkedIn</span>
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </section>
            </div>
          )}

          {tab === "provenance" && company.provenance && (
            <div className="cqv-section-stack" data-testid="quick-view-panel-provenance">
              <SentimentProvenanceView
                companyName={company.name}
                companySlug={company.slug}
                provenance={company.provenance}
              />
            </div>
          )}

          {tab === "rounds" && (
            <div className="cqv-section-stack" data-testid="quick-view-panel-rounds">
              <section className="cqv-panel">
                <h3 className="cqv-panel__title">
                  Recorded Funding History ({sortedRounds.length})
                </h3>
                {sortedRounds.length > 0 ? (
                  <ul className="cqv-rounds-list">
                    {sortedRounds.map((r, i) => {
                      const roundUrl = safeExternalUrl(r.source_url);
                      return (
                        <li key={i} className="cqv-round-row">
                          <div className="cqv-round-main">
                            <strong>{formatConciseRound(r.round)}</strong>
                            {r.round && r.round !== formatConciseRound(r.round) && (
                              <span className="cqv-round-raw">{r.round}</span>
                            )}
                            {roundUrl && (
                              <a
                                href={roundUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={stopOutbound}
                                className="spv-cite-link"
                                data-testid="round-source-link"
                              >
                                <span>Original filing / press source</span>
                                <ExternalLink className="size-3" aria-hidden="true" />
                              </a>
                            )}
                          </div>
                          <div className="cqv-round-meta">
                            <span className="cqv-round-amt">
                              {fmtUsd(r.amount_usd) ?? "Undisclosed"}
                            </span>
                            <span className="cqv-round-date">{r.date ?? "Undated"}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="cqv-empty">No dated funding rounds recorded yet.</p>
                )}
              </section>
            </div>
          )}

          {tab === "people" && (
            <div className="cqv-section-stack" data-testid="quick-view-panel-people">
              <section className="cqv-panel">
                <h3 className="cqv-panel__title">
                  Founders &amp; Key People ({company.founders.length})
                </h3>
                {company.founders.length > 0 ? (
                  <ul className="cqv-people-list">
                    {company.founders.map((f) => (
                      <li key={f.id} className="cqv-person-row">
                        <span className="cqv-person-av">{initials(f.name)}</span>
                        <div className="min-w-0 flex-1">
                          <strong className="cqv-person-name">{f.name}</strong>
                          <p className="cqv-person-role">{f.role || "Founder / Leadership"}</p>
                        </div>
                        <Link
                          href={`/social/people/${encodeURIComponent(f.id)}`}
                          className="cqv-person-link"
                          onClick={onClose}
                        >
                          <span>Profile</span>
                          <ArrowUpRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="cqv-empty">No founder profiles linked yet.</p>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <footer className="cqv-foot">
          <button
            type="button"
            className="cqv-btn-secondary"
            data-testid="quick-view-open-pitchbook"
            onClick={() => {
              const s = company.slug;
              onClose();
              onOpenPitchbookDock(s);
            }}
          >
            <Landmark className="size-4" aria-hidden="true" />
            <span>Open in PitchBook Dock</span>
          </button>

          <Link
            href={`/company/${company.slug}`}
            className="cqv-btn-primary"
            data-testid="quick-view-full-profile"
            onClick={onClose}
          >
            <span>Open Full Profile</span>
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </footer>
      </aside>
    </div>
  );
}
