import { NOT_AVAILABLE_LABEL as SCHEMA_NOT_AVAILABLE_LABEL } from "./pitchbook-profile-schema.js";

export const NOT_AVAILABLE_LABEL = SCHEMA_NOT_AVAILABLE_LABEL || "Not available in PitchBook";

export const PITCHBOOK_AVAILABILITY_FIELDS = [
  "overview",
  "hq",
  "founded",
  "status",
  "employees",
  "website",
  "contact",
  "last_financing_date",
  "last_financing_size_usd",
  "last_financing_type",
  "post_money_valuation_usd",
  "total_raised_usd",
  "investors",
  "deal_history",
  "executives",
  "board_members",
  "competitors",
  "similar_companies",
  "investments_count",
  "pitchbook_profile_url",
] as const;

export type PitchbookAvailabilityField = (typeof PITCHBOOK_AVAILABILITY_FIELDS)[number];
export type AvailabilityStatus = "available" | "not_available";

/**
 * A field is available only when value is non-null, non-empty string/array/number and has a provenance.source.
 */
export function isFieldAvailable(fieldObj: unknown): boolean {
  if (!fieldObj || typeof fieldObj !== "object") return false;
  const obj = fieldObj as Record<string, unknown>;

  // Must have a valid provenance with a non-empty source
  if (!obj.provenance || typeof obj.provenance !== "object") return false;
  const prov = obj.provenance as Record<string, unknown>;
  if (typeof prov.source !== "string" || prov.source.trim().length === 0) return false;

  // Value must be non-null, non-empty string/array/number
  const val = obj.value;
  if (val === null || val === undefined) return false;
  if (typeof val === "string") return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "number") return !Number.isNaN(val);

  return false;
}

/**
 * Computes availability status ("available" | "not_available") over the 20 PitchBook fields for a profile.
 */
export function computeAvailability(
  profile: unknown
): Record<PitchbookAvailabilityField, AvailabilityStatus> {
  const result = {} as Record<PitchbookAvailabilityField, AvailabilityStatus>;
  const prof = (profile && typeof profile === "object" ? profile : {}) as Record<string, unknown>;

  for (const field of PITCHBOOK_AVAILABILITY_FIELDS) {
    result[field] = isFieldAvailable(prof[field]) ? "available" : "not_available";
  }

  return result;
}

function extractProfilesList(profiles: unknown): Record<string, unknown>[] {
  if (!profiles || typeof profiles !== "object") return [];
  if (Array.isArray(profiles)) {
    return profiles.filter((p) => p && typeof p === "object") as Record<string, unknown>[];
  }

  const obj = profiles as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 0) return [];

  // Check if obj itself is a single profile:
  // e.g. keys match availability fields and have value/provenance objects or nulls, rather than being slug -> profile mappings
  const hasProfileFields = PITCHBOOK_AVAILABILITY_FIELDS.some(
    (f) => f in obj && (obj[f] === null || (typeof obj[f] === "object" && obj[f] !== null && "value" in (obj[f] as object)))
  );
  const valuesAreProfiles = keys.every(
    (k) => typeof obj[k] === "object" && obj[k] !== null && ("overview" in (obj[k] as object) || "slug" in (obj[k] as object) || "name" in (obj[k] as object))
  );

  if (hasProfileFields && !valuesAreProfiles) {
    return [obj];
  }

  return Object.values(obj).filter((p) => p && typeof p === "object") as Record<string, unknown>[];
}

export type PitchbookCoverage = Record<
  PitchbookAvailabilityField,
  { populated: number; not_available: number }
>;

/**
 * Computes per-field availability counts ({ populated, not_available }) across all profiles.
 */
export function coverageOf(profiles: unknown): PitchbookCoverage {
  const list = extractProfilesList(profiles);
  const coverage = {} as PitchbookCoverage;

  for (const field of PITCHBOOK_AVAILABILITY_FIELDS) {
    coverage[field] = { populated: 0, not_available: 0 };
  }

  for (const profile of list) {
    const avail = computeAvailability(profile);
    for (const field of PITCHBOOK_AVAILABILITY_FIELDS) {
      if (avail[field] === "available") {
        coverage[field].populated++;
      } else {
        coverage[field].not_available++;
      }
    }
  }

  return coverage;
}

/**
 * Computes total not_available cells across all profiles.
 */
export function emptyStateCount(profiles: unknown): number {
  const list = extractProfilesList(profiles);
  let totalNotAvailable = 0;

  for (const profile of list) {
    const avail = computeAvailability(profile);
    for (const field of PITCHBOOK_AVAILABILITY_FIELDS) {
      if (avail[field] === "not_available") {
        totalNotAvailable++;
      }
    }
  }

  return totalNotAvailable;
}

/**
 * Computes total populated cells across all profiles.
 */
export function fieldsPopulated(profiles: unknown): number {
  const list = extractProfilesList(profiles);
  let totalPopulated = 0;

  for (const profile of list) {
    const avail = computeAvailability(profile);
    for (const field of PITCHBOOK_AVAILABILITY_FIELDS) {
      if (avail[field] === "available") {
        totalPopulated++;
      }
    }
  }

  return totalPopulated;
}
