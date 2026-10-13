import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { NewsThumb } from "./news-thumb";
import type { NewsItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { fmtDate, fmtDelta, fmtScore } from "@/lib/format";
import { sanitiseTitle, sanitiseSummary } from "@/lib/text-sanitise";

const host = (u: string | null) => {
  try {
    return u ? new URL(u).hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
};

export function resolveSourceInfo(raw?: string | null): { label: string; tooltip?: string } | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  if (
    s === "legacy" ||
    s.includes("legacy workflow") ||
    s.includes("earlier workflow") ||
    s.includes("linkedin") ||
    s.includes("reddit") ||
    /(^|\W)(x\.com|twitter)/.test(s) ||
    s.includes("utm_source=openai")
  ) {
    return {
      label: "Earlier workflow sources",
      tooltip: "Rows ingested by the earlier multi-plugin workflows (LinkedIn, Reddit, X)",
    };
  }
  if (s === "perplexity") {
    return { label: "Perplexity" };
  }
  if (s === "status" || s === "status_change") {
    return { label: "Status changes" };
  }
  if (s === "seed" || s === "intelligence_json" || s.startsWith("seed-")) {
    return { label: "Seed / intelligence JSON" };
  }
  return { label: raw };
}

export function NewsCard({
  n,
  companyName,
  companyLogo,
  companySlug,
  sentimentScore,
  sentimentDelta,
  sourceBucket,
  eager = false,
}: {
  n: NewsItem & {
    company_name?: string;
    company_logo?: string | null;
    company_slug?: string;
    sentiment_score?: number | null;
    sentiment_delta?: number | null;
  };
  companyName?: string;
  companyLogo?: string | null;
  companySlug?: string | null;
  sentimentScore?: number | null;
  sentimentDelta?: number | null;
  sourceBucket?: string;
  eager?: boolean;
}) {
  const cSlug = companySlug ?? n.company_slug ?? null;
  const cName = companyName ?? n.company_name ?? null;
  const score = sentimentScore !== undefined ? sentimentScore : n.sentiment_score ?? null;
  const delta = sentimentDelta !== undefined ? sentimentDelta : n.sentiment_delta ?? null;
  const rawSource = sourceBucket ?? n.source ?? host(n.url);
  const sourceInfo = resolveSourceInfo(rawSource);

  const cleanTitle = sanitiseTitle(n.title);
  const cleanSummary = sanitiseSummary(n.summary);

  return (
    <article className="card flex min-w-0 gap-3 p-3">
      <NewsThumb
        src={n.image_url}
        companyLogo={companyLogo ?? n.company_logo ?? null}
        companyName={cName}
        companySlug={cSlug}
        host={host(n.url) ?? (n.source && /\./.test(n.source) ? n.source : null)}
        eager={eager}
      />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <Badge tone={n.kind === "status_change" ? "info" : "muted"}>{n.kind}</Badge>
          {!cSlug && cName && <span className="font-medium text-foreground">{cName}</span>}
          <time dateTime={n.published_at ?? undefined}>{fmtDate(n.published_at)}</time>
        </p>
        <p className="mt-1 break-words text-sm font-semibold leading-[1.35] [overflow-wrap:anywhere]">
          {n.url ? (
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-words underline-offset-2 hover:underline"
            >
              {cleanTitle}
              <ExternalLink className="ml-1 inline size-3" aria-hidden />
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          ) : (
            cleanTitle
          )}
        </p>
        {cleanSummary && (
          <p className="mt-1 line-clamp-3 text-[12.5px] leading-[1.45] text-muted">{cleanSummary}</p>
        )}
        <footer className="nc-footer mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
          {cSlug && cName && (
            <Link
              href={`/company/${cSlug}`}
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              {cName}
            </Link>
          )}
          {score != null && (
            <Badge tone="muted">sentiment {fmtScore(score)}</Badge>
          )}
          {delta != null && (
            <Badge tone={delta > 0 ? "primary" : delta < 0 ? "danger" : "muted"}>
              Δ {fmtDelta(delta)}
            </Badge>
          )}
          {sourceInfo && (
            <Badge tone="info" title={sourceInfo.tooltip}>
              {sourceInfo.label}
            </Badge>
          )}
          {n.fetched_at && (
            <Badge tone="muted" title="When the refresh pipeline fetched this item from OnDemand">
              fetched {n.fetched_at.slice(0, 16).replace("T", " ")}Z
            </Badge>
          )}
        </footer>
      </div>
    </article>
  );
}
