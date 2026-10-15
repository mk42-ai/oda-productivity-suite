"use client";

import Link from "next/link";
import { memo, useState } from "react";
import {
  Landmark,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Newspaper,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { sectorTheme, faviconUrl } from "@/lib/social-sectors";
import { safeExternalUrl, stopOutbound } from "@/lib/outbound";
import { openPitchbookDock } from "@/components/pitchbook/pitchbook-dock";
import { formatShortHq } from "@/components/companies/card-header-section";
import { fmtUsd, formatConciseRound } from "@/components/companies/card-metrics-panel";
import { SentimentProvenanceView } from "@/components/companies/sentiment-provenance-view";
import type { CompanySentimentProvenance } from "@/lib/sentiment-provenance";

export type ChatCompanyItem = {
  slug: string;
  name: string;
  sector: string;
  sector_label?: string;
  status: string;
  stage: string | null;
  domain?: string | null;
  hq?: string | null;
  region?: string | null;
  founded?: number | null;
  employees?: number | null;
  total_raised_usd?: number | null;
  valuation_usd?: number | null;
  linkedin?: string | null;
  last_round?: {
    round: string | null;
    amount_usd: number | null;
    date: string | null;
    source_url?: string | null;
  } | null;
  pitchbook?: { investment_date: string; investor_since: string } | null;
  sentiment: {
    score: number;
    label: string;
    delta?: number | null;
    updated_at?: string | null;
    basis?: string | null;
  };
  prior_run_at?: string | null;
  news_count?: number;
  social_count?: number;
  latest_news: {
    title: string;
    url: string | null;
    published_at: string | null;
    source?: string | null;
  }[];
  estimated_ticket_size_usd: number | null;
  estimated_ownership_pct: number | null;
  b_capital_role: string;
  provenance?: CompanySentimentProvenance;
};

const initials = (n: string) =>
  n
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const AMBIGUOUS_NAMES = new Set(["when", "forest", "remote", "extend", "writer", "branch"]);

/**
 * Deterministically detects portfolio companies mentioned in a chat turn's text
 * without re-allocating when the set of matched slugs has not changed.
 */
export function detectMentionedCompanies(
  text: string,
  companies: ChatCompanyItem[],
  fallbackSlugs: string[] = [],
  maxCards = 3
): ChatCompanyItem[] {
  if (!companies.length) return [];
  const hay = (text || "").trim();
  const lower = hay.toLowerCase();
  const hits: { company: ChatCompanyItem; pos: number }[] = [];

  if (hay.length >= 2) {
    for (const c of companies) {
      const slugIdx = lower.indexOf(c.slug.toLowerCase());
      const nameLower = c.name.toLowerCase();
      let pos = -1;

      if (slugIdx >= 0 && c.slug.length >= 4) {
        pos = slugIdx;
      } else if (AMBIGUOUS_NAMES.has(nameLower)) {
        // Require exact case match for common English words (e.g. "WRITER", "When", "Forest")
        const exactIdx = hay.indexOf(c.name);
        if (exactIdx >= 0) pos = exactIdx;
      } else if (nameLower.length >= 3) {
        const escaped = nameLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const m = new RegExp(`\\b${escaped}\\b`, "i").exec(hay);
        if (m) pos = m.index;
      }

      if (pos >= 0) {
        hits.push({ company: c, pos });
      }
    }
  }

  if (hits.length > 0) {
    hits.sort((a, b) => a.pos - b.pos);
    return hits.slice(0, maxCards).map((h) => h.company);
  }

  if (fallbackSlugs.length > 0) {
    const bySlug = new Map(companies.map((c) => [c.slug, c]));
    return fallbackSlugs
      .map((s) => bySlug.get(s))
      .filter((c): c is ChatCompanyItem => !!c)
      .slice(0, maxCards);
  }

  return [];
}

export const ChatCompanyCard = memo(function ChatCompanyCard({
  company,
  defaultExpanded = false,
  onAskCompany,
}: {
  company: ChatCompanyItem;
  defaultExpanded?: boolean;
  onAskCompany?: (prompt: string) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [logoFail, setLogoFail] = useState(false);
  const t = sectorTheme(company.sector);
  const logoSrc = faviconUrl(company.domain);
  const shortLoc = formatShortHq(company.hq, company.region);
  const lr = company.last_round;
  const lrSourceUrl = safeExternalUrl(lr?.source_url);
  const prov = company.provenance;
  const hasConflict = Boolean(prov?.conflict?.hasConflict);
  const totalCitations = prov
    ? prov.channels.reduce((acc, ch) => acc + ch.count, 0)
    : company.news_count ?? 0;

  return (
    <article
      className="ccpd-card"
      data-testid="chat-company-card"
      data-slug={company.slug}
      data-sector={company.sector}
      data-conflict={hasConflict ? "true" : "false"}
    >
      {/* Card Header */}
      <header className="ccpd-head" data-testid="chat-company-header">
        <span className="ccpd-logo">
          {logoSrc && !logoFail ? (
            <img
              src={logoSrc}
              alt=""
              width={26}
              height={26}
              loading="lazy"
              decoding="async"
              onError={() => setLogoFail(true)}
            />
          ) : (
            <span className="ccpd-logo__mono">{initials(company.name)}</span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="ccpd-title-row">
            <Link
              href={`/company/${company.slug}`}
              prefetch={false}
              className="ccpd-name"
              data-testid="chat-company-profile-link"
            >
              <span>{company.name}</span>
              <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
            </Link>
            <span
              className="ccpd-sector-badge"
              style={{ color: t.ink, background: t.soft }}
            >
              {company.sector_label ?? company.sector}
            </span>
          </div>
          <p className="ccpd-sub">
            <span>{shortLoc}</span>
            {company.founded ? <span>· est. {company.founded}</span> : null}
            {company.stage ? <span>· {company.stage}</span> : null}
          </p>
        </div>

        <div className="ccpd-actions">
          <button
            type="button"
            className="ccpd-btn"
            data-testid="chat-company-pitchbook-btn"
            onClick={() => openPitchbookDock(company.slug)}
            title={`Open ${company.name} in PitchBook Dock`}
          >
            <Landmark className="size-3" aria-hidden="true" />
            <span>PitchBook</span>
          </button>
          {onAskCompany && (
            <button
              type="button"
              className="ccpd-btn ccpd-btn--ask"
              data-testid="chat-company-ask-btn"
              onClick={() =>
                onAskCompany(
                  `Analyze ${company.name}'s latest funding, news citations, and multi-source sentiment provenance.`
                )
              }
              title={`Ask about ${company.name} in chat`}
            >
              <Sparkles className="size-3" aria-hidden="true" />
              <span>Deep dive</span>
            </button>
          )}
        </div>
      </header>

      {/* 4-Metric Summary Strip */}
      <dl className="ccpd-metrics">
        <div className="ccpd-metric">
          <dt>Last Round</dt>
          <dd>
            {lr ? (
              lrSourceUrl ? (
                <a
                  href={lrSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stopOutbound}
                  className="ccpd-round-link"
                  data-testid="chat-card-round-link"
                >
                  {formatConciseRound(lr.round)}{" "}
                  {fmtUsd(lr.amount_usd) ? `· ${fmtUsd(lr.amount_usd)}` : ""}
                </a>
              ) : (
                <span>
                  {formatConciseRound(lr.round)}{" "}
                  {fmtUsd(lr.amount_usd) ? `· ${fmtUsd(lr.amount_usd)}` : ""}
                </span>
              )
            ) : (
              company.stage ?? "—"
            )}
          </dd>
        </div>

        <div className="ccpd-metric">
          <dt>Total Raised</dt>
          <dd>{fmtUsd(company.total_raised_usd) ?? fmtUsd(company.estimated_ticket_size_usd) ?? "—"}</dd>
        </div>

        <div className="ccpd-metric">
          <dt>Evidence Pool</dt>
          <dd className="ccpd-ev-links">
            <Link
              href={`/company/${company.slug}#news`}
              prefetch={false}
              className="ccpd-ev-chip"
            >
              <Newspaper className="size-3" aria-hidden="true" />
              <span>{company.news_count ?? 0}</span>
            </Link>
            <Link
              href={`/social?sector=${encodeURIComponent(company.sector)}`}
              prefetch={false}
              className="ccpd-ev-chip"
            >
              <MessageSquare className="size-3" aria-hidden="true" />
              <span>{company.social_count ?? 0}</span>
            </Link>
          </dd>
        </div>

        <div className="ccpd-metric">
          <dt>Sentiment</dt>
          <dd data-testid="chat-company-sentiment-pill">
            <span
              className={`ccpd-sent-score ${
                company.sentiment.score < 0 ? "ccpd-sent--neg" : "ccpd-sent--pos"
              }`}
            >
              <TrendingUp className="size-3" aria-hidden="true" />
              <strong>
                {company.sentiment.score > 0 ? "+" : ""}
                {company.sentiment.score.toFixed(2)}
              </strong>
              <small>{company.sentiment.label}</small>
            </span>
          </dd>
        </div>
      </dl>

      {/* Expandable Interactive Sentiment Provenance Toggle & Panel */}
      {prov && (
        <div className="ccpd-prov-wrap">
          <button
            type="button"
            className="ccpd-prov-toggle"
            data-testid="chat-provenance-toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            <span className="ccpd-prov-toggle__left">
              {hasConflict ? (
                <AlertTriangle
                  className="size-3.5 shrink-0 text-amber-600"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle2
                  className="size-3.5 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
              )}
              <strong>Sentiment Provenance</strong>
              <span className="ccpd-prov-summary">
                {prov.channels.length} channels · {totalCitations} native items ·{" "}
                {hasConflict ? "Conflicting sources" : "Aligned consensus"}
              </span>
            </span>
            <span className="ccpd-prov-toggle__right">
              <span>{expanded ? "Hide breakdown" : "Inspect formula & citations"}</span>
              {expanded ? (
                <ChevronUp className="size-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="size-3.5" aria-hidden="true" />
              )}
            </span>
          </button>

          {expanded && (
            <div
              className="ccpd-prov-body"
              data-testid="chat-provenance-panel"
            >
              <SentimentProvenanceView
                companyName={company.name}
                companySlug={company.slug}
                provenance={prov}
              />
            </div>
          )}
        </div>
      )}
    </article>
  );
});

export type ChatCompanyProvenanceDeckProps = {
  slugsKey: string;
  companies: ChatCompanyItem[];
  title?: string;
  defaultExpanded?: boolean;
  onAskCompany?: (prompt: string) => void;
};

function ChatCompanyProvenanceDeckInner({
  companies,
  title = "Portfolio Company & Sentiment Provenance",
  defaultExpanded = false,
  onAskCompany,
}: ChatCompanyProvenanceDeckProps) {
  if (!companies.length) return null;

  return (
    <section
      className="ccpd-deck"
      data-testid="chat-company-provenance-deck"
      data-count={companies.length}
      aria-label={title}
    >
      <div className="ccpd-deck__head">
        <span className="ccpd-deck__title">
          <TrendingUp className="size-3.5" aria-hidden="true" />
          <span>{title}</span>
          <span className="ccpd-deck__count">{companies.length}</span>
        </span>
        <span className="ccpd-deck__hint">
          4-factor evidence-weighted score · native source permalinks
        </span>
      </div>
      <div
        className={`ccpd-deck__grid ${
          companies.length > 1 ? "ccpd-deck__grid--multi" : ""
        }`}
      >
        {companies.map((c, idx) => (
          <ChatCompanyCard
            key={c.slug}
            company={c}
            defaultExpanded={defaultExpanded || idx === 0}
            onAskCompany={onAskCompany}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Memoized by `slugsKey` so rAF-coalesced token deltas in `RunView` never re-render or
 * re-mount interactive Company & Sentiment Provenance cards while text is streaming.
 */
export const ChatCompanyProvenanceDeck = memo(
  ChatCompanyProvenanceDeckInner,
  (prev, next) =>
    prev.slugsKey === next.slugsKey &&
    prev.defaultExpanded === next.defaultExpanded &&
    prev.title === next.title
);
