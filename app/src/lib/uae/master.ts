import masterPack from "@/data/uae_cc_v1/master.json";

export type MasterLeader = {
  name: string;
  role: string;
  linkedin_url?: string;
  source_url?: string;
  as_of?: string;
};

export type MasterFundingRound = {
  round: string;
  amount: number | string;
  currency: string;
  date: string;
  investors: string[];
  source_url?: string;
  status: string;
};

export type MasterPartnership = {
  partner: string;
  date: string;
  source: string;
  status: string;
};

export type MasterAnnouncement = {
  date: string;
  title: string;
  url: string;
  source: string;
};

export type MasterSource = {
  url: string;
  publisher: string;
  published_at?: string;
  retrieved_at?: string;
};

export type MasterLogo = {
  status: string;
  source?: string;
  reason?: string;
};

export type MasterMeta = {
  generated_at: string;
  method: string;
  provenance_ranking: string[];
  coverage_mean_before: number;
  coverage_mean_after: number;
  orgs_below_75: Array<{
    slug: string;
    coverage_pct: number;
    reasons: string[];
  }>;
};

export type MasterOrg = {
  legal_name: string;
  brand_name: string;
  slug: string;
  type: string;
  sector: string;
  hq_city: string;
  emirate: string;
  free_zone: string;
  founded: string;
  founders: string[];
  ceo: string;
  leadership: MasterLeader[];
  ownership_parent: string;
  headcount_band: string;
  products: string[];
  models: string[];
  funding_rounds: MasterFundingRound[];
  partnerships: MasterPartnership[];
  announcements: MasterAnnouncement[];
  website: string;
  linkedin_url: string;
  x_url: string;
  youtube_url: string;
  github_url: string;
  emails: string[];
  phones: string[];
  logo: MasterLogo;
  sources: MasterSource[];
  coverage_pct: number;
  confidence: number;
  last_verified_at: string;
  provenance_notes: string[];
  disambiguation?: string;
  field_provenance: Record<string, string>;
};

export const MASTER: { meta: MasterMeta; organizations: MasterOrg[] } = masterPack as unknown as {
  meta: MasterMeta;
  organizations: MasterOrg[];
};

export function masterFor(id: string): MasterOrg | undefined {
  return MASTER.organizations.find((o) => o.slug === id);
}
