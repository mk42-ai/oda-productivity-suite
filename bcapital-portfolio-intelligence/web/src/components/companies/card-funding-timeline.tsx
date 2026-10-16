"use client";

import { useState } from "react";
import { fmtUsd, formatConciseRound } from "./card-metrics-panel";
import type { GalleryCompany } from "./companies-gallery";

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

type TimelineRoundItem = {
  round: string | null;
  amount_usd: number | null;
  date: string | null;
};

/**
 * Produces a concise, never-truncated node tag (<= 11 chars) for the horizontal track.
 * E.g. "$1 billion senior secured..." -> "Debt '26", "Venture round" -> "Venture '26",
 * "Series C" -> "C '26", "Seed" -> "Seed '19".
 */
function shortNodeBadge(round: string | null, date: string | null): string {
  const yy = date && /^\d{4}/.test(date) ? `'${date.slice(2, 4)}` : "";
  const s = (round ?? "").trim();

  const seriesMatch = s.match(/\bSeries\s+([A-H][12+]?|CC)\b/i);
  if (seriesMatch) {
    const code = seriesMatch[1].toUpperCase();
    const tag = /expansion|extension|ext\b/i.test(s) ? `${code}+` : code;
    return yy ? `${tag} ${yy}` : `Series ${tag}`;
  }
  if (/pre-?seed/i.test(s)) return yy ? `Pre ${yy}` : "Pre-Seed";
  if (/\bseed\b/i.test(s)) return yy ? `Seed ${yy}` : "Seed";
  if (/pre-?series\s+([a-z])/i.test(s)) {
    const m = s.match(/pre-?series\s+([a-z])/i);
    return yy ? `Pre-${m?.[1]?.toUpperCase() ?? "A"} ${yy}` : "Pre-A";
  }
  if (/\bpre-?a\b/i.test(s)) return yy ? `Pre-A ${yy}` : "Pre-A";
  if (/pre-?ipo/i.test(s)) return yy ? `Pre-IPO ${yy}` : "Pre-IPO";
  if (/post[\s-]*ipo/i.test(s)) return yy ? `Post-IPO` : "Post-IPO";
  if (/\bipo\b|initial public offering/i.test(s)) return yy ? `IPO ${yy}` : "IPO";
  if (/debt|credit facility|term loan|warehouse|fixed rate financing/i.test(s)) {
    return yy ? `Debt ${yy}` : "Debt";
  }
  if (/air force|diu\b|contract|award|grant/i.test(s)) return yy ? `Grant ${yy}` : "Grant";
  if (/growth/i.test(s)) return yy ? `Growth ${yy}` : "Growth";
  if (/unicorn/i.test(s)) return yy ? `Unicorn ${yy}` : "Unicorn";
  if (/angel/i.test(s)) return yy ? `Angel ${yy}` : "Angel";
  if (/strategic/i.test(s)) return yy ? `Strat ${yy}` : "Strategic";
  if (/venture/i.test(s)) return yy ? `Venture ${yy}` : "Venture";
  if (/early|stealth|launch|initial|first/i.test(s)) return yy ? `Early ${yy}` : "Early";
  return yy ? `Round ${yy}` : "Round";
}

export function CardFundingTimeline({ company }: { company: GalleryCompany }) {
  const rs = company.rounds
    .filter((r) => r.date)
    .slice(0, 6)
    .sort((a, b) => (Date.parse(a.date!) || 0) - (Date.parse(b.date!) || 0));

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!rs.length) {
    return (
      <div
        className="cg-timeline-wrap cg-timeline-wrap--empty"
        data-testid="funding-timeline-interactive"
      >
        <p className="cg-timeline__none" data-testid="funding-timeline" data-rounds={0}>
          No dated rounds recorded yet
        </p>
      </div>
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

  // Merge nodes that fall within 20% of each other or cap at 4 clusters so labels never collide or truncate
  let changed = true;
  while (changed && clusters.length > 1) {
    changed = false;
    const next: Cluster[] = [];
    for (let i = 0; i < clusters.length; i++) {
      if (
        i < clusters.length - 1 &&
        (Math.abs(clusters[i + 1].pct - clusters[i].pct) <= 20 || clusters.length > 4)
      ) {
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

  // Space clusters cleanly across [15%, 85%] so edge pills never clip card borders and adjacent labels never touch
  const positionedClusters = clusters.map((c, idx) => {
    let left: number;
    if (clusters.length === 1) {
      left = 50;
    } else if (clusters.length === 2) {
      left = idx === 0 ? 22 : 78;
    } else if (clusters.length === 3) {
      left = idx === 0 ? 18 : idx === 1 ? 50 : 82;
    } else {
      left = 15 + (idx / (clusters.length - 1)) * 70;
    }
    return { ...c, left };
  });

  const activeIdx =
    selectedIdx != null && selectedIdx < positionedClusters.length
      ? selectedIdx
      : positionedClusters.length - 1;
  const activeCluster = positionedClusters[activeIdx];

  const activeDetailText = activeCluster
    ? activeCluster.rounds
        .map((r) => {
          const rName = formatConciseRound(r.round);
          const amt = fmtUsd(r.amount_usd) ?? "undisclosed";
          return `${rName} · ${amt} · ${r.date}`;
        })
        .join("  |  ")
    : "";

  return (
    <div className="cg-timeline-wrap" data-testid="funding-timeline-interactive">
      <div className="cg-timeline-header">
        <span className="cg-timeline-title">Funding history ({rs.length})</span>
        <span className="cg-timeline-hint">Click node for round details</span>
      </div>
      <ol
        className="cg-timeline"
        data-testid="funding-timeline"
        data-rounds={rs.length}
        aria-label={`Funding timeline, ${rs.length} rounds`}
      >
        {positionedClusters.map((cluster, i) => {
          const isAbove = i % 2 === 0;
          const isMerged = cluster.rounds.length > 1;
          const isSelected = i === activeIdx;
          const isBcap = cluster.rounds.some(
            (r) => /b capital/i.test(r.round ?? "") || (r as { bcap?: string }).bcap === "lead"
          );

          let desktopLabel: string;
          let mobileLabel: string;
          let fullLabel: string;

          if (isMerged) {
            desktopLabel = `${cluster.rounds.length} rounds`;
            mobileLabel = `${cluster.rounds.length} rounds: ${cluster.rounds
              .map((r) =>
                [
                  formatConciseRound(r.round),
                  r.date ? r.date.slice(0, 4) : "",
                  fmtUsd(r.amount_usd) ?? "undisclosed",
                ]
                  .filter(Boolean)
                  .join(" · ")
              )
              .join("; ")}`;
            fullLabel = `${cluster.rounds.length} rounds: ${cluster.rounds
              .map(
                (r) =>
                  `${formatConciseRound(r.round)} · ${fmtUsd(r.amount_usd) ?? "undisclosed"} · ${r.date}`
              )
              .join("; ")}`;
          } else {
            const r = cluster.rounds[0];
            const yr = r.date ? r.date.slice(0, 4) : "";
            const amt = fmtUsd(r.amount_usd) ?? "undisclosed";
            desktopLabel = shortNodeBadge(r.round, r.date);
            mobileLabel = [formatConciseRound(r.round), yr, amt].filter(Boolean).join(" · ");
            fullLabel = `${formatConciseRound(r.round)} · ${amt} · ${r.date}`;
          }

          return (
            <li
              key={i}
              className={`cg-timeline__item ${
                isAbove ? "cg-timeline__item--above" : "cg-timeline__item--below"
              } ${isSelected ? "cg-timeline__item--active" : ""}`}
              style={{ left: `${cluster.left}%` }}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              aria-label={fullLabel}
              data-testid="timeline-node"
              data-node-index={i}
              onClick={() => setSelectedIdx(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedIdx(i);
                }
              }}
            >
              <span
                className={`cg-timeline__dot${isBcap ? " cg-timeline__dot--bcap" : ""}${
                  isSelected ? " cg-timeline__dot--selected" : ""
                }`}
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

      {activeDetailText && (
        <div
          className="cg-timeline-detail"
          data-testid="timeline-round-detail"
          aria-live="polite"
        >
          <span className="cg-timeline-detail__dot" aria-hidden="true" />
          <span className="cg-timeline-detail__text">{activeDetailText}</span>
        </div>
      )}
    </div>
  );
}
