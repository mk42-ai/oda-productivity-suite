/** Types mirroring the PitchBook batch store (`GET /pitchbook/store`, `GET /pitchbook/store/:slug`). */

export const PB_STORE_NA = "Not available in PitchBook" as const;
export type PbStoreNA = typeof PB_STORE_NA;

export type PbStoreProvenance = { source: string; batch_id: string; query_id: string; fetched_at: string; note?: string };
/** Every leaf is either a value with provenance or the literal "Not available in PitchBook". */
export type PbLeaf<T = unknown> = { value: T; provenance: PbStoreProvenance } | PbStoreNA;
export type PbRecord = Record<string, PbLeaf>;
/** A section may arrive as a leaf, a record of leaves, or a list of records — the renderer tolerates all three. */
export type PbSectionValue = PbLeaf | PbRecord | PbRecord[] | PbLeaf[] | null | undefined;

export const PB_SUMMARY_KEYS = [
  "name", "legalName", "alsoKnownAs", "formerlyKnownAs", "description", "website", "yearFounded", "employees",
  "hqLocation", "location", "ownershipStatus", "financingStatus", "financingStatusNote", "businessStatus", "universe", "totalMoneyRaised",
] as const;
export type PbSummaryKey = (typeof PB_SUMMARY_KEYS)[number];
export type PbStoredSummary = Partial<Record<PbSummaryKey, PbLeaf>> & Record<string, PbLeaf | undefined>;

export type PbMatchedOn = { score?: number | string; source?: string; lookup?: string; query?: string; name?: string; pb_id?: string; [k: string]: unknown };

export type PbStoredProfile = {
  summary?: PbStoredSummary | PbStoreNA;
  deals?: PbRecord[] | PbStoreNA;
  investors?: PbRecord[] | PbStoreNA;
  employeeHistory?: PbRecord[] | PbStoreNA;
  offices?: { hqOffice?: PbSectionValue; alternateOffices?: PbSectionValue } | PbStoreNA;
  people?: { currentTeam?: PbSectionValue; boardMembersAndObservers?: PbSectionValue; primaryContact?: PbSectionValue } | PbStoreNA;
  newsLast30Days?: PbRecord[] | PbStoreNA;
  similarCompanies?: PbRecord[] | PbStoreNA;
  affiliates?: PbRecord[] | PbStoreNA;
  financialsMostRecent?: PbSectionValue;
  exitPredictions?: PbSectionValue;
  matchedOn?: PbMatchedOn | PbLeaf<PbMatchedOn> | PbStoreNA | null;
  unavailable?: string[];
};

export type PbStoreState = "populated" | "Unmatched in PitchBook" | "pending";

export type PbStoreBatch = {
  batch_id: string; status: string; submitted_at: string | null; completed_at: string | null;
  total: number; succeeded: number; failed: number; retried: number; unmatched: number;
};

export type PbStoreCompanyRow = {
  slug: string; name: string; sector: string; sector_label: string; pb_id: string | null; state: PbStoreState;
  fetched_at: string | null; batch_id: string | null; query_id: string | null; fields_populated: number; fields_unavailable: number;
};

export type PbStoreIndex = { batch: PbStoreBatch | null; companies: PbStoreCompanyRow[] };

export type PbStoreCompanyDetail = {
  slug: string; name: string; state: PbStoreState; pb_id: string | null; batch_id: string | null; query_id: string | null;
  fetched_at: string | null; profile: PbStoredProfile | null;
};

/** Shape of the optional fallback file web/src/data/pitchbook-store.json. */
export type PbStoreFile = PbStoreIndex & { profiles?: Record<string, PbStoreCompanyDetail | PbStoredProfile> };

export type PbStoreSource = "live" | "file" | "none";
export const PB_STORE_EMPTY_COPY = "Awaiting PitchBook batch";

export const pitchbookProfileUrl = (pbId: string | null | undefined) =>
  pbId ? `https://my.pitchbook.com/profile/${encodeURIComponent(pbId)}/company/profile` : null;

export function isPbLeaf(x: unknown): x is { value: unknown; provenance: PbStoreProvenance } {
  return !!x && typeof x === "object" && !Array.isArray(x) && "value" in (x as object) && "provenance" in (x as object);
}
export const isPbNA = (x: unknown): x is PbStoreNA => x === PB_STORE_NA;
/** Returns the inner value of a leaf, the literal for N/A, or the raw value when not wrapped. */
export function unwrapPb<T = unknown>(x: unknown): T | PbStoreNA | null {
  if (x == null) return null;
  if (isPbNA(x)) return x;
  if (isPbLeaf(x)) return x.value as T;
  return x as T;
}
