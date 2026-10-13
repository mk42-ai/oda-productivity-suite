/**
 * PitchBook company profile — the per-company record served by GET /pitchbook/profile/:slug and GET /pitchbook/profiles.
 * Every field is `Sourced<T> | null`: a value with its provenance (source name/URL + sync timestamp), or null meaning
 * "Not available in PitchBook" (the UI renders that explicit empty state; values are NEVER invented).
 * Shared by the backend (src/) and the web app (web/src/lib/pitchbook-profile-types.ts re-exports these shapes).
 */
export type PbSource = { source: string; url?: string | null; synced_at: string; plugin_id?: string | null; document?: string | null };
export type PbField<T = string> = { value: T; provenance: PbSource };
export type PbDeal = { date: string | null; type: string | null; size_usd: number | null; post_money_usd: number | null; lead_investors: string[]; investors: string[]; status?: string | null };
export type PbPerson = { name: string; title: string | null; role?: "executive" | "board" | null; since?: string | null };
export type PbCompanyRef = { name: string; slug?: string | null; website?: string | null; note?: string | null };
export type PbInvestor = { name: string; website?: string | null; location?: string | null; type?: string | null; aum_musd?: number | null };
export type PbResearchDoc = { document: string; url?: string | null; excerpt: string; fields_touched: string[]; ingested_at: string };
export const PB_PROFILE_FIELDS = [
  "overview", "hq", "founded", "status", "employees", "website", "contact",
  "last_financing_date", "last_financing_size_usd", "last_financing_type", "post_money_valuation_usd", "total_raised_usd",
  "investors", "deal_history", "executives", "board_members", "competitors", "similar_companies",
  "investments_count", "pitchbook_profile_url",
] as const;
export type PbProfileFieldKey = (typeof PB_PROFILE_FIELDS)[number];
export type PbProfile = {
  slug: string; name: string;
  overview: PbField | null; hq: PbField | null; founded: PbField | null; status: PbField | null; employees: PbField | null; website: PbField | null; contact: PbField | null;
  last_financing_date: PbField | null; last_financing_size_usd: PbField<number> | null; last_financing_type: PbField | null;
  post_money_valuation_usd: PbField<number> | null; total_raised_usd: PbField<number> | null;
  investors: PbField<PbInvestor[]> | null; deal_history: PbField<PbDeal[]> | null;
  executives: PbField<PbPerson[]> | null; board_members: PbField<PbPerson[]> | null;
  competitors: PbField<PbCompanyRef[]> | null; similar_companies: PbField<PbCompanyRef[]> | null;
  investments_count: PbField<number> | null; pitchbook_profile_url: PbField | null;
  research_documents: PbResearchDoc[];
  synced_at: string; next_sync_utc: string | null; sources: string[];
};
/** Per-field availability summary across all companies — what the coverage table in the report is built from. */
export type PbCoverage = Record<PbProfileFieldKey, { populated: number; not_available: number }>;
export const NOT_AVAILABLE_LABEL = "Not available in PitchBook";
