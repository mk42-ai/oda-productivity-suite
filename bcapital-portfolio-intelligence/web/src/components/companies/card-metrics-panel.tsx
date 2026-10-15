"use client";

import { useState, useRef, useEffect } from "react";
import { Landmark, TrendingUp, ExternalLink, Info, Calendar, DollarSign } from "lucide-react";
import { sectorTheme } from "@/lib/social-sectors";
import type { GalleryCompany } from "./companies-gallery";

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

function InteractiveSparkline({ company }: { company: GalleryCompany }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const t = sectorTheme(company.sector);
  const pts = company.sentiment.history;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (company.sentiment.history_state === "placeholder" || pts.length < 2) {
    return (
      <div
        className="cg-spark cg-spark--empty"
        data-testid="sentiment-sparkline"
        data-state="placeholder"
        title="Seed-only history — not yet scored"
      >
        <svg viewBox="0 0 88 22" aria-hidden="true">
          <path d="M2 11 H86" strokeDasharray="3 3" />
        </svg>
        <span>Unscored</span>
      </div>
    );
  }

  const xs = pts.map((p) => Date.parse(p.t));
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs) || x0 + 1;
  const d = pts
    .map(
      (p, i) =>
        `${i ? "L" : "M"}${(2 + ((xs[i] - x0) / Math.max(1, x1 - x0)) * 84).toFixed(1)} ${(
          20 -
          ((p.score + 1) / 2) * 18
        ).toFixed(1)}`
    )
    .join(" ");

  const scores = pts.map((p) => p.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const latestScore = company.sentiment.score != null ? company.sentiment.score.toFixed(2) : "—";

  return (
    <div className="cg-metric-pop-wrap" ref={wrapRef}>
      <button
        type="button"
        className="cg-spark cg-spark--btn"
        data-testid="sentiment-sparkline"
        data-state="scored"
        data-points={pts.length}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title={`${pts.length} scored runs · latest ${latestScore} (${company.sentiment.label}) — click for breakdown`}
      >
        <svg viewBox="0 0 88 22" aria-hidden="true">
          <path d="M2 11 H86" className="cg-spark__zero" />
          <path d={d} style={{ stroke: "#047857" }} />
        </svg>
        <span className="cg-spark__val" style={{ color: t.ink }}>
          <strong>{latestScore}</strong>
          <small>{company.sentiment.label}</small>
        </span>
      </button>

      {open && (
        <div
          className="cg-popover cg-popover--sentiment"
          data-testid="sentiment-popover"
          role="dialog"
          aria-label={`${company.name} sentiment details`}
        >
          <div className="cg-popover__head">
            <strong>Sentiment Signal</strong>
            <span className="cg-popover__pill">{company.sentiment.label}</span>
          </div>
          <div className="cg-popover__rows">
            <div>
              <span>Current score</span>
              <strong>{latestScore}</strong>
            </div>
            <div>
              <span>Scored runs</span>
              <strong>{pts.length} runs</strong>
            </div>
            <div>
              <span>Score range</span>
              <strong>
                {minScore.toFixed(2)} to {maxScore.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type CardMetricsPanelProps = {
  company: GalleryCompany;
  onOpenPitchbook: (slug: string) => void;
};

export function CardMetricsPanel({ company, onOpenPitchbook }: CardMetricsPanelProps) {
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
          <span>Last round</span>
        </dt>
        <dd data-testid="company-card-deal" title={fullDealTitle}>
          {lr ? (
            <span className="cg-deal-summary">
              <strong className="cg-deal-round">{conciseRound}</strong>
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
          <span>Total raised</span>
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
          <span>PitchBook</span>
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

      {/* 4. SENTIMENT */}
      <div className="cg-facts__cell">
        <dt>
          <TrendingUp className="size-3 shrink-0" aria-hidden="true" />
          <span>Sentiment</span>
        </dt>
        <dd>
          <InteractiveSparkline company={company} />
        </dd>
      </div>
    </dl>
  );
}
