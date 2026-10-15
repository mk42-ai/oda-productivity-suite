"use client";

import Link from "next/link";
import { useState } from "react";
import { Maximize2, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { sectorTheme, sectorGradient, faviconUrl } from "@/lib/social-sectors";
import type { GalleryCompany } from "./companies-gallery";

const US_STATE_ABBR: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
};

/**
 * Formats verbose HQ strings (such as "San Francisco, California, United States",
 * "Rumford, Rhode Island, United States", or street-level addresses) into concise
 * "City, ST" or "City, Country" labels so subtitles never truncate mid-word.
 */
export function formatShortHq(hq: string | null | undefined, region: string | null | undefined): string {
  const raw = (hq ?? region ?? "").trim();
  if (!raw) return "Global";

  // Strip parenthetical qualifiers like "(with offices in...)" or "(Signal Hill)"
  let cleaned = raw.replace(/\s*\([^)]*\)/g, "").trim();

  // Split comma-separated segments and drop street numbers / suite / floor / zip codes
  let parts = cleaned
    .split(",")
    .map((p) => p.replace(/\b\d{5,6}(?:-\d{4})?\b/g, "").trim())
    .filter((p) => p.length > 0 && !/^\d+\s+|suite\b|ste\b|floor\b|fl\b|#|lane\b|ave\b|st\b|dr\b|rd\b|blvd\b/i.test(p));

  if (parts.length === 0) {
    parts = cleaned.split(",").map((p) => p.trim()).filter(Boolean);
  }

  // Deduplicate identical consecutive parts like "Singapore, Singapore"
  parts = parts.filter((p, idx) => idx === 0 || p.toLowerCase() !== parts[idx - 1].toLowerCase());

  // Normalize country names at the end
  if (parts.length > 0) {
    const lastIdx = parts.length - 1;
    const last = parts[lastIdx];
    if (/^(united states|united states of america|u\.?s\.?a\.?)$/i.test(last)) {
      parts[lastIdx] = "US";
    } else if (/^(united kingdom|great britain|england)$/i.test(last)) {
      parts[lastIdx] = "UK";
    } else if (/^(united arab emirates)$/i.test(last)) {
      parts[lastIdx] = "UAE";
    }
  }

  // Normalize US state names to 2-letter postal abbreviations
  let hasUsStateAbbr = false;
  parts = parts.map((part) => {
    const abbr = US_STATE_ABBR[part];
    if (abbr) {
      hasUsStateAbbr = true;
      return abbr;
    }
    if (/^[A-Z]{2}$/.test(part) && Object.values(US_STATE_ABBR).includes(part)) {
      hasUsStateAbbr = true;
    }
    return part;
  });

  // Deduplicate e.g. "New York, NY, US" -> "New York, NY"
  if (hasUsStateAbbr && parts[parts.length - 1] === "US" && parts.length >= 2) {
    parts.pop();
  }
  if (parts.length >= 2 && parts[0].toLowerCase() === "new york" && parts[1] === "NY") {
    return "New York, NY";
  }

  // Keep at most 2 concise segments ("City, ST" or "City, Country")
  if (parts.length > 2) {
    parts = [parts[0], parts[parts.length - 1]];
  }

  const result = parts.join(", ");
  return result.length > 26 ? parts[0] : result;
}

const initials = (n: string) =>
  n
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function CompanyLogoTile({ company }: { company: GalleryCompany }) {
  const [fail, setFail] = useState(false);
  const t = sectorTheme(company.sector);
  const src = faviconUrl(company.domain);
  return (
    <span className="cg-logo" style={{ borderColor: "#e4e6e9" }}>
      {src && !fail ? (
        <img
          src={src}
          alt=""
          width={28}
          height={28}
          loading="lazy"
          decoding="async"
          onError={() => setFail(true)}
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth < 2) setFail(true);
          }}
          data-testid="company-favicon"
        />
      ) : (
        <span
          className="cg-logo__mono"
          style={{ background: sectorGradient(company.sector), borderColor: t.from }}
          data-testid="company-favicon-fallback"
        >
          {initials(company.name)}
        </span>
      )}
    </span>
  );
}

export type CardHeaderSectionProps = {
  company: GalleryCompany;
  onQuickView: (company: GalleryCompany, tab?: "overview" | "rounds" | "people") => void;
};

export function CardHeaderSection({ company, onQuickView }: CardHeaderSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const shortLocation = formatShortHq(company.hq, company.region);
  const fullLocationTitle = [
    company.hq ?? company.region,
    company.founded ? `Founded ${company.founded}` : null,
    company.employees ? `${company.employees.toLocaleString()} employees` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const desc = company.description?.trim() ?? "";
  const isLongDesc = desc.length > 118;

  return (
    <>
      <div className="cg-card__head">
        <CompanyLogoTile company={company} />
        <div className="cg-head-main min-w-0 flex-1">
          <div className="cg-title-row">
            <Link
              href={`/company/${company.slug}`}
              className="cg-name"
              data-testid="company-row-name"
              title={company.name}
            >
              {company.name}
            </Link>
            <button
              type="button"
              className="cg-quick-btn"
              onClick={() => onQuickView(company, "overview")}
              data-testid="company-quick-view-trigger"
              aria-label={`Quick preview for ${company.name}`}
              title={`Quick preview ${company.name}`}
            >
              <Maximize2 className="size-3" aria-hidden="true" />
              <span>Preview</span>
            </button>
          </div>
          <p
            className="cg-sub"
            data-testid="company-card-subtitle"
            title={fullLocationTitle}
          >
            <span className="cg-sub__loc">
              <MapPin className="size-3 shrink-0 text-muted" aria-hidden="true" />
              <span>{shortLocation}</span>
            </span>
            {company.founded && (
              <>
                <span className="cg-sub__sep" aria-hidden="true">·</span>
                <span className="cg-sub__token">est. {company.founded}</span>
              </>
            )}
            {company.employees && (
              <>
                <span className="cg-sub__sep" aria-hidden="true">·</span>
                <span className="cg-sub__token">{company.employees.toLocaleString()} ppl</span>
              </>
            )}
          </p>
        </div>
      </div>

      {desc && (
        <div className="cg-desc-wrap" data-testid="company-card-description">
          <p className={`cg-desc ${expanded ? "cg-desc--expanded" : ""}`}>
            {desc}
          </p>
          {isLongDesc && (
            <button
              type="button"
              className="cg-desc-toggle"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              data-testid="company-desc-toggle"
            >
              {expanded ? (
                <>
                  <span>Less</span>
                  <ChevronUp className="size-3" aria-hidden="true" />
                </>
              ) : (
                <>
                  <span>More</span>
                  <ChevronDown className="size-3" aria-hidden="true" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </>
  );
}
