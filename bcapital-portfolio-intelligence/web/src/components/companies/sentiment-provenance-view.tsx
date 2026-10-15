"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Newspaper,
  DollarSign,
  SlidersHorizontal,
  ShieldCheck,
} from "lucide-react";
import { stopOutbound } from "@/lib/outbound";
import type {
  CompanySentimentProvenance,
  ProvenanceSourceChannel,
} from "@/lib/sentiment-provenance";

const BRAND_ICON_PATHS: Partial<Record<ProvenanceSourceChannel, string>> = {
  x: "/brand/icons/x.svg",
  reddit: "/brand/icons/reddit.svg",
  instagram: "/brand/icons/instagram.svg",
  linkedin: "/brand/icons/linkedin.svg",
  tiktok: "/brand/icons/tiktok.svg",
};

function ChannelGlyph({ channel }: { channel: ProvenanceSourceChannel | "all" }) {
  if (channel === "all") {
    return <SlidersHorizontal className="size-3 shrink-0" aria-hidden="true" />;
  }
  const svgPath = BRAND_ICON_PATHS[channel];
  if (svgPath) {
    return (
      <img
        src={svgPath}
        alt=""
        width={12}
        height={12}
        className="spv-brand-svg"
        loading="lazy"
        aria-hidden="true"
      />
    );
  }
  if (channel === "news") {
    return <Newspaper className="size-3 shrink-0" aria-hidden="true" />;
  }
  return <DollarSign className="size-3 shrink-0" aria-hidden="true" />;
}

const fmtSigned = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}`;

export type SentimentProvenanceViewProps = {
  companyName: string;
  companySlug: string;
  provenance: CompanySentimentProvenance;
  compact?: boolean;
  onOpenFullDrawer?: () => void;
};

export function SentimentProvenanceView({
  companyName,
  provenance,
  compact = false,
  onOpenFullDrawer,
}: SentimentProvenanceViewProps) {
  const [selectedChannel, setSelectedChannel] = useState<
    ProvenanceSourceChannel | "all"
  >("all");

  const totalCount = useMemo(
    () => provenance.channels.reduce((s, c) => s + c.count, 0),
    [provenance.channels]
  );

  const filteredCitations = useMemo(() => {
    const list =
      selectedChannel === "all"
        ? provenance.citations
        : provenance.citations.filter((c) => c.channel === selectedChannel);
    return compact ? list.slice(0, 3) : list.slice(0, 8);
  }, [provenance.citations, selectedChannel, compact]);

  const factorRows = [
    {
      key: "level",
      label: "Level (45%)",
      hint: "Bayesian shrink K=3 · 14d half-life",
      val: provenance.factors.level,
      pct: Math.round(((provenance.factors.level + 1) / 2) * 100),
      display: fmtSigned(provenance.factors.level),
    },
    {
      key: "momentum",
      label: "Momentum (25%)",
      hint: "7d vs 30d delta",
      val: provenance.factors.momentum,
      pct: Math.round(((provenance.factors.momentum + 1) / 2) * 100),
      display: fmtSigned(provenance.factors.momentum),
    },
    {
      key: "volume",
      label: "Volume (15%)",
      hint: `log1p(${totalCount} items)`,
      val: provenance.factors.volume,
      pct: Math.round(provenance.factors.volume * 100),
      display: `${Math.round(provenance.factors.volume * 100)}%`,
    },
    {
      key: "confidence",
      label: "Confidence (15%)",
      hint: "Wilson lower bound (z=1.96)",
      val: provenance.factors.confidence,
      pct: Math.round(provenance.factors.confidence * 100),
      display: `${Math.round(provenance.factors.confidence * 100)}%`,
    },
  ];

  return (
    <div
      className={`spv-root ${compact ? "spv-root--compact" : "spv-root--full"}`}
      data-testid="sentiment-provenance-view"
    >
      {/* 1. Formula & Evidence-Weighted Factor Breakdown (never a fuel-bar gauge) */}
      <section
        className="spv-section"
        data-testid="sentiment-provenance-formula"
        aria-label="Sentiment formula and weighting breakdown"
      >
        <div className="spv-head-row">
          <strong className="spv-section-title">Formula &amp; Evidence Weights</strong>
          <span className="spv-score-pill">
            {fmtSigned(provenance.score)} · {provenance.label}
          </span>
        </div>
        <p className="spv-formula-note">{provenance.formulaSummary}</p>

        <div className="spv-factors">
          {factorRows.map((f) => (
            <div key={f.key} className="spv-factor-row">
              <div className="spv-factor-meta">
                <span className="spv-factor-name">{f.label}</span>
                <span className="spv-factor-hint">{f.hint}</span>
              </div>
              <div
                className="spv-factor-track"
                role="img"
                aria-label={`${f.label}: ${f.display}`}
              >
                <span className="spv-factor-mid" aria-hidden="true" />
                <span
                  className={`spv-factor-fill ${
                    f.val < 0 ? "spv-factor-fill--neg" : "spv-factor-fill--pos"
                  }`}
                  style={{ width: `${Math.max(8, Math.min(100, f.pct))}%` }}
                />
              </div>
              <span
                className={`spv-factor-val ${
                  f.val < 0 ? "spv-val--neg" : "spv-val--pos"
                }`}
              >
                {f.display}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Conflicting Sources Surface */}
      <section
        className={`spv-conflict ${
          provenance.conflict.hasConflict
            ? "spv-conflict--warn"
            : "spv-conflict--ok"
        }`}
        data-testid="sentiment-conflict-banner"
        data-conflict={provenance.conflict.hasConflict ? "true" : "false"}
        aria-label="Cross-source sentiment agreement status"
      >
        {provenance.conflict.hasConflict ? (
          <AlertTriangle className="size-4 shrink-0 text-amber-700" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="size-4 shrink-0 text-emerald-700" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <strong className="spv-conflict__title">
            {provenance.conflict.hasConflict
              ? "Conflicting Sources Detected"
              : "Cross-Channel Consensus"}
          </strong>
          <p className="spv-conflict__desc">{provenance.conflict.summary}</p>
        </div>
      </section>

      {/* 3. Source-by-Source Breakdown & Interactive Filter */}
      <section
        className="spv-section"
        data-testid="sentiment-source-filter"
        aria-label="Source-by-source breakdown and filter"
      >
        <div className="spv-head-row">
          <strong className="spv-section-title">
            Source Breakdown ({totalCount} items)
          </strong>
          <span className="spv-sub-hint">Click channel to filter citations</span>
        </div>

        <div className="spv-channel-chips" role="group" aria-label="Filter citations by source channel">
          <button
            type="button"
            className="spv-ch-btn"
            data-testid="sentiment-filter-chip"
            data-channel="all"
            aria-pressed={selectedChannel === "all"}
            onClick={() => setSelectedChannel("all")}
          >
            <ChannelGlyph channel="all" />
            <span>All</span>
            <span className="spv-ch-count">{totalCount}</span>
          </button>

          {provenance.channels.map((ch) => {
            const isSelected = selectedChannel === ch.channel;
            return (
              <button
                key={ch.channel}
                type="button"
                className="spv-ch-btn"
                data-testid="sentiment-filter-chip"
                data-channel={ch.channel}
                aria-pressed={isSelected}
                onClick={() =>
                  setSelectedChannel(isSelected ? "all" : ch.channel)
                }
                title={`${ch.label} · ${ch.count} items · avg ${fmtSigned(
                  ch.avgSentiment
                )} · weight ${Math.round(ch.weightShare * 100)}% (${
                  ch.credibilityTier
                })`}
              >
                <ChannelGlyph channel={ch.channel} />
                <span>{ch.label}</span>
                <span className="spv-ch-count">{ch.count}</span>
                <span
                  className={`spv-ch-pol ${
                    ch.avgSentiment < 0 ? "spv-val--neg" : "spv-val--pos"
                  }`}
                >
                  {fmtSigned(ch.avgSentiment)}
                </span>
                <span className="spv-ch-wt">
                  {Math.round(ch.weightShare * 100)}%w
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Top Contributing Posts & News Citations (with Original Native Links) */}
      <section
        className="spv-section"
        data-testid="sentiment-citations-list"
        aria-label={`Top contributing citations for ${companyName}`}
      >
        <div className="spv-head-row">
          <strong className="spv-section-title">
            Top Contributing Citations (
            {selectedChannel === "all"
              ? "All sources"
              : selectedChannel.toUpperCase()}
            )
          </strong>
          <span className="spv-sub-hint">Direct native permalinks</span>
        </div>

        {filteredCitations.length > 0 ? (
          <ul className="spv-cite-list">
            {filteredCitations.map((cit) => (
              <li
                key={cit.id}
                className="spv-cite-card"
                data-testid="sentiment-citation-item"
                data-channel={cit.channel}
              >
                <div className="spv-cite-top">
                  <span className="spv-cite-source">
                    <ChannelGlyph channel={cit.channel} />
                    <strong>{cit.domain}</strong>
                  </span>

                  <span
                    className={`spv-cite-ver ${
                      cit.verification === "unverified"
                        ? "spv-cite-ver--unverified"
                        : "spv-cite-ver--verified"
                    }`}
                  >
                    <ShieldCheck className="size-2.5" aria-hidden="true" />
                    {cit.verification === "press"
                      ? "Press"
                      : cit.verification === "verified"
                      ? "Verified"
                      : "Unverified"}
                  </span>

                  {cit.published_at && (
                    <time
                      className="spv-cite-date"
                      dateTime={cit.published_at}
                    >
                      {cit.published_at.slice(0, 10)}
                    </time>
                  )}

                  <span
                    className={`spv-cite-pol ${
                      cit.sentiment < 0 ? "spv-val--neg" : "spv-val--pos"
                    }`}
                    title={`Item polarity ${fmtSigned(
                      cit.sentiment
                    )} × weight ${cit.weight.toFixed(2)}`}
                  >
                    {fmtSigned(cit.sentiment)}
                  </span>
                </div>

                <p className="spv-cite-snippet">“{cit.snippet}”</p>

                <div className="spv-cite-foot">
                  <span className="spv-cite-author">
                    {cit.author ? `via ${cit.author}` : cit.domain}
                  </span>
                  <a
                    href={cit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={stopOutbound}
                    className="spv-cite-link"
                    data-testid="sentiment-citation-link"
                    data-url={cit.url}
                    title={`Open original native source: ${cit.url}`}
                  >
                    <span>Original source</span>
                    <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="spv-empty">No native citations recorded for this channel.</p>
        )}

        {compact && onOpenFullDrawer && (
          <button
            type="button"
            className="spv-open-drawer-btn"
            data-testid="sentiment-open-full-drawer"
            onClick={onOpenFullDrawer}
          >
            <span>Inspect full provenance &amp; all channels in drawer</span>
            <ExternalLink className="size-3" aria-hidden="true" />
          </button>
        )}
      </section>
    </div>
  );
}
export default SentimentProvenanceView;
