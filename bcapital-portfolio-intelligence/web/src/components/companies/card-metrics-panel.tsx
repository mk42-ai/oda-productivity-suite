"use client";

import { useState, useRef, useEffect } from "react";
import { Landmark, TrendingUp, ExternalLink, Info, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { sentimentColor, sentimentTone } from "@/lib/sentiment-tone";
import { stopOutbound, safeExternalUrl } from "@/lib/outbound";
import { SentimentProvenanceView } from "./sentiment-provenance-view";
import type { GalleryCompany } from "./companies-gallery";
import type { QuickViewTab } from "./company-quick-view-drawer";

export const fmtUsd = (n: number | null | undefined): string | null =>
  n == null
    ? null
    : n >= 1e9
    ? `$${(n / 1e9).toFixed(1)}B`
    : n >= 1e6
    ? `$${Math.round(n / 1e6)}M`
    : `$${Math.round(n / 1e3)}K`;

/**
 * Formats verbose round names into concise, scannable labels (<= 14 chars)
 * so the LAST ROUND metric never overflows or truncates mid-word.
 */
export function formatConciseRound(raw: string | null | undefined): string {
  if (!raw) return "Round";
  const s = raw.trim();

  const seriesMatch = s.match(/\bSeries\s+([A-H][12+]?|CC)\b/i);
  if (seriesMatch) {
    const code = seriesMatch[1].toUpperCase();
    if (/expansion|extension|ext\b/i.test(s)) return `Series ${code}+`;
    return `Series ${code}`;
  }
  if (/pre-?seed/i.test(s)) return "Pre-Seed";
  if (/\bseed\b/i.test(s)) return /ext/i.test(s) ? "Seed+" : "Seed";
  if (/pre-?series\s+([a-z])/i.test(s)) {
    const m = s.match(/pre-?series\s+([a-z])/i);
    return `Pre-Series ${m?.[1]?.toUpperCase() ?? "A"}`;
  }
  if (/\bpre-?a\b/i.test(s)) return "Pre-A";
  if (/pre-?ipo/i.test(s)) return "Pre-IPO";
  if (/post[\s-]*ipo/i.test(s)) return "Post-IPO";
  if (/\bipo\b|initial public offering/i.test(s)) return "IPO";
  if (/debt|credit facility|term loan|warehouse|fixed rate financing/i.test(s)) return "Debt Facility";
  if (/air force|diu\b|contract|award|grant/i.test(s)) return "Gov Contract";
  if (/growth/i.test(s)) return "Growth";
  if (/unicorn/i.test(s)) return "Unicorn";
  if (/angel/i.test(s)) return "Angel";
  if (/strategic/i.test(s)) return "Strategic";
  if (/venture/i.test(s)) return "Venture";
  if (/early|stealth|launch|initial|first/i.test(s)) return "Early Stage";
  if (/project/i.test(s)) return "Project Fin.";
  if (/internal/i.test(s)) return "Internal";
  if (/undisclosed/i.test(s)) return "Undisclosed";
  return s.length > 15 ? `${s.slice(0, 13).trim()}…` : s;
}

export function formatShortDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!m) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mo = months[Number(m[2]) - 1] ?? m[2];
  return `${mo} ${m[1]}`;
}

function InteractiveSparkline({
  company,
  onQuickView,
}: {
  company: GalleryCompany;
  onQuickView?: (company: GalleryCompany, tab?: QuickViewTab) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tone = sentimentTone(company.sentiment.score);
  const toneColor = sentimentColor(company.sentiment.score);
  const pts = company.sentiment.history;
  const hasConflict = Boolean(company.provenance?.conflict?.hasConflict);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isPlaceholder = company.sentiment.history_state === "placeholder" || pts.length < 2;
  let d = "M2 11 H86";
  if (!isPlaceholder) {
    const xs = pts.map((p) => Date.parse(p.t));
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs) || x0 + 1;
    d = pts
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${(2 + ((xs[i] - x0) / Math.max(1, x1 - x0)) * 84).toFixed(1)} ${(
            20 -
            ((p.score + 1) / 2) * 18
          ).toFixed(1)}`
      )
      .join(" ");
  }

  const latestScore = company.sentiment.score != null ? company.sentiment.score.toFixed(2) : "—";

  return (
    <div className="cg-metric-pop-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`cg-spark cg-spark--btn ${isPlaceholder ? "cg-spark--empty" : ""}`}
        data-testid="sentiment-sparkline"
        data-state={isPlaceholder ? "placeholder" : "scored"}
        data-points={pts.length}
        data-conflict={hasConflict ? "true" : "false"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title={`${pts.length} scored runs · latest ${latestScore} (${company.sentiment.label}) — click for provenance & citations`}
      >
        <svg viewBox="0 0 88 22" aria-hidden="true">
          <path d="M2 11 H86" className="cg-spark__zero" />
          <path
            d={d}
            strokeDasharray={isPlaceholder ? "3 3" : undefined}
            style={{ stroke: isPlaceholder ? "#9ca3af" : tone === "negative" ? toneColor : "#0AC985" }}
          />
        </svg>
        <span className="cg-spark__val" data-tone={tone} style={{ color: toneColor }}>
          <strong style={{ color: toneColor }}>{latestScore}</strong>
          <small>{company.sentiment.label}</small>
        </span>
        {hasConflict && (
          <span
            className="cg-conflict-badge"
            title={company.provenance?.conflict.summary}
            data-testid="sentiment-conflict-dot"
          >
            <AlertTriangle className="size-3 text-amber-600" aria-hidden="true" />
          </span>
        )}
      </button>

      {open && company.provenance && (
        <div
          className="cg-popover cg-popover--sentiment"
          data-testid="sentiment-popover"
          role="dialog"
          aria-label={`${company.name} sentiment provenance breakdown`}
        >
          <SentimentProvenanceView
            companyName={company.name}
            companySlug={company.slug}
            provenance={company.provenance}
            compact
            onOpenFullDrawer={
              onQuickView
                ? () => {
                    setOpen(false);
                    onQuickView(company, "provenance");
                  }
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}

export type CardMetricsPanelProps = {
  company: GalleryCompany;
  onOpenPitchbook: (slug: string) => void;
  onQuickView?: (company: GalleryCompany, tab?: QuickViewTab) => void;
};

export function CardMetricsPanel({
  company,
  onOpenPitchbook,
  onQuickView,
}: CardMetricsPanelProps) {
  const [pbOpen, setPbOpen] = useState(false);
  const pbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pbOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (pbRef.current && !pbRef.current.contains(e.target as Node)) {
        setPbOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [pbOpen]);

  const lr = company.last_round;
  const conciseRound = lr ? formatConciseRound(lr.round) : null;
  const roundAmt = lr ? fmtUsd(lr.amount_usd) : null;
  const roundDateShort = lr ? formatShortDate(lr.date) : null;
  const roundSourceUrl = safeExternalUrl(lr?.source_url);
  const fullDealTitle = lr
    ? [lr.round, roundAmt, lr.date].filter(Boolean).join(" · ")
    : "No last round recorded";

  const pb = company.pitchbook;
  const pbFullTitle = pb
    ? `invested ${pb.investment_date} · since ${pb.investor_since}`
    : "Not in PitchBook investor rows";

  return (
    <dl className="cg-facts" data-testid="company-metrics-grid">
      {/* 1. LAST ROUND */}
      <div className="cg-facts__cell">
        <dt>
          <Calendar className="size-3 shrink-0" aria-hidden="true" />
          <span title="Most recent funding round">Last round</span>
        </dt>
        <dd data-testid="company-card-deal" title={fullDealTitle}>
          {lr ? (
            <span className="cg-deal-summary">
              {roundSourceUrl ? (
                <a
                  href={roundSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stopOutbound}
                  className="cg-deal-round cg-deal-round--link"
                  data-testid="last-round-source-link"
                  title={`Open original round source: ${roundSourceUrl}`}
                >
                  {conciseRound}
                </a>
              ) : (
                <strong className="cg-deal-round">{conciseRound}</strong>
              )}
              {roundAmt && <span className="cg-deal-amt">{roundAmt}</span>}
              {roundDateShort && <span className="cg-deal-date">{roundDateShort}</span>}
            </span>
          ) : (
            <span className="cg-facts__na">—</span>
          )}
        </dd>
      </div>

      {/* 2. TOTAL RAISED */}
      <div className="cg-facts__cell">
        <dt>
          <DollarSign className="size-3 shrink-0" aria-hidden="true" />
          <span title="Total capital raised to date">Total raised</span>
        </dt>
        <dd data-testid="company-card-raised">
          <strong className="cg-raised-val">{fmtUsd(company.total_raised_usd) ?? "—"}</strong>
          {company.valuation_usd ? (
            <span className="cg-val-sub" title={`Valuation: ${fmtUsd(company.valuation_usd)}`}>
              {fmtUsd(company.valuation_usd)} val
            </span>
          ) : null}
        </dd>
      </div>

      {/* 3. PITCHBOOK (Interactive Popover + Dock trigger) */}
      <div className="cg-facts__cell" data-testid="pitchbook-fields" ref={pbRef}>
        <dt>
          <Landmark className="size-3 shrink-0" aria-hidden="true" />
          <span title="PitchBook investor-row match">PitchBook</span>
        </dt>
        <dd>
          <button
            type="button"
            className={`cg-pb-btn ${pb ? "cg-pb-btn--matched" : "cg-pb-btn--unmatched"}`}
            data-testid="pitchbook-trigger"
            aria-expanded={pbOpen}
            onClick={() => setPbOpen((v) => !v)}
            title={pbFullTitle}
          >
            {pb ? (
              <>
                <span className="cg-pb-dot cg-pb-dot--ok" aria-hidden="true" />
                <span className="cg-pb-text">
                  Inv. {formatShortDate(pb.investment_date)}
                </span>
              </>
            ) : (
              <>
                <span className="cg-pb-dot" aria-hidden="true" />
                <span className="cg-pb-text">Unmatched row</span>
              </>
            )}
            <Info className="size-3 shrink-0 opacity-60" aria-hidden="true" />
          </button>

          {pbOpen && (
            <div
              className="cg-popover cg-popover--pb"
              data-testid="pitchbook-popover"
              role="dialog"
              aria-label={`PitchBook details for ${company.name}`}
            >
              <div className="cg-popover__head">
                <strong>PitchBook Record</strong>
                <span className="cg-popover__pill">{pb ? "Matched" : "Unmatched"}</span>
              </div>
              {pb ? (
                <div className="cg-popover__rows">
                  <div>
                    <span>Investment date</span>
                    <strong>{pb.investment_date}</strong>
                  </div>
                  <div>
                    <span>Investor since</span>
                    <strong>{pb.investor_since}</strong>
                  </div>
                </div>
              ) : (
                <p className="cg-popover__note">
                  Not in PitchBook investor rows for this batch snapshot.
                </p>
              )}
              <button
                type="button"
                className="cg-popover__action"
                data-testid="pitchbook-open-dock"
                onClick={() => {
                  setPbOpen(false);
                  onOpenPitchbook(company.slug);
                }}
              >
                <span>Open in PitchBook Dock</span>
                <ExternalLink className="size-3" aria-hidden="true" />
              </button>
            </div>
          )}
        </dd>
      </div>

      {/* 4. SENTIMENT (Interactive Provenance Breakdown Popover) */}
      <div className="cg-facts__cell">
        <dt>
          <TrendingUp className="size-3 shrink-0" aria-hidden="true" />
          <span title="Latest sentiment score and history">Sentiment</span>
        </dt>
        <dd>
          <InteractiveSparkline company={company} onQuickView={onQuickView} />
        </dd>
      </div>
    </dl>
  );
}
