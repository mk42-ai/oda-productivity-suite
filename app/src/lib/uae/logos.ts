/**
 * Organisation logo resolution (QA cycle 9, Lane C).
 * Sourced, verified and packaged logos for all UAE organisations.
 *
 * Interfaces:
 *   logoFor(id)        → primary <img src> (list-64.png) or null when monogram
 *   logoSrcSet(id)     → srcSet string for retina (list-64.png 1x, list-128.png 2x)
 *   logoCard(id)       → large card preview (card-512.png) or null when monogram
 *   logoProvenance(id) → full provenance metadata record
 */
import LOGOS_DATA from "@/data/uae_cc_v1/logos.json";

export interface LogoRecord {
  status: "official" | "wikimedia" | "linkedin" | "icon" | "monogram";
  source: string;
  source_tier?: string;
  size?: [number, number];
  format?: string;
  license_note?: string;
  files?: {
    original?: string;
    card?: string;
    list?: string;
    list2x?: string;
    monogram?: string;
  };
  reason?: string;
}

const LOGOS: Record<string, LogoRecord> = LOGOS_DATA as unknown as Record<string, LogoRecord>;

/**
 * Primary <img src> path (list-64) when status != monogram, else null.
 */
export const logoFor = (id: string): string | null => {
  const rec = LOGOS[id];
  if (!rec || rec.status === "monogram") return null;
  return rec.files?.list ?? null;
};

/**
 * Responsive srcSet for retina displays ("<list-64> 1x, <list-128> 2x").
 */
export const logoSrcSet = (id: string): string | null => {
  const rec = LOGOS[id];
  if (!rec || rec.status === "monogram") return null;
  const list = rec.files?.list;
  const list2x = rec.files?.list2x;
  if (!list || !list2x) return null;
  return `${list} 1x, ${list2x} 2x`;
};

/**
 * Card preview path (card-512) when status != monogram, else null.
 */
export const logoCard = (id: string): string | null => {
  const rec = LOGOS[id];
  if (!rec || rec.status === "monogram") return null;
  return rec.files?.card ?? null;
};

/**
 * Provenance metadata record from logos.json.
 */
export const logoProvenance = (id: string): LogoRecord => {
  return (
    LOGOS[id] ?? {
      status: "monogram",
      source: "none",
      reason: "unknown organisation"
    }
  );
};
