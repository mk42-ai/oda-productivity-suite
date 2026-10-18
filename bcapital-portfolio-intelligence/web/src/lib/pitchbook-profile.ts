import fs from "node:fs";
import path from "node:path";
import type { PbProfile, PbCoverage } from "./pitchbook-profile-types";

const PORTFOLIO_API_URL = process.env.PORTFOLIO_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";

export function createEmptyProfile(slug: string, name: string = slug): PbProfile {
  return {
    slug,
    name,
    overview: null,
    hq: null,
    founded: null,
    status: null,
    employees: null,
    website: null,
    contact: null,
    last_financing_date: null,
    last_financing_size_usd: null,
    last_financing_type: null,
    post_money_valuation_usd: null,
    total_raised_usd: null,
    investors: null,
    deal_history: null,
    executives: null,
    board_members: null,
    competitors: null,
    similar_companies: null,
    investments_count: null,
    pitchbook_profile_url: null,
    research_documents: [],
    synced_at: new Date().toISOString().slice(0, 10),
    next_sync_utc: null,
    sources: [],
  };
}

export async function getPitchbookProfile(slug: string, companyName?: string): Promise<PbProfile> {
  // 1. Attempt to fetch from API
  try {
    const res = await fetch(`${PORTFOLIO_API_URL}/pitchbook/profile/${slug}`, {
      signal: AbortSignal.timeout(1500),
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.profile) return data.profile;
      if (data?.slug) return data;
    }
  } catch {
    // API unavailable or timed out; proceed to fallback
  }

  // 2. Fallback to web/src/data/pitchbook-profiles.json or src/data/pitchbook-profiles.json
  try {
    const candidatePaths = [
      path.join(process.cwd(), "src/data/pitchbook-profiles.json"),
      path.join(process.cwd(), "web/src/data/pitchbook-profiles.json"),
      path.join(process.cwd(), "data/pitchbook-profiles.json"),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.companies?.[slug]) {
          return parsed.companies[slug];
        }
      }
    }
  } catch {
    // Fallback file missing or unparseable
  }

  // 3. Return explicit empty profile where every field is null
  return createEmptyProfile(slug, companyName ?? slug);
}

export async function getAllPitchbookProfiles(): Promise<{
  synced_at: string;
  companies: Record<string, PbProfile>;
  coverage: PbCoverage;
}> {
  try {
    const res = await fetch(`${PORTFOLIO_API_URL}/pitchbook/profiles`, {
      signal: AbortSignal.timeout(2000),
      next: { revalidate: 60 },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // API unavailable
  }

  try {
    const candidatePaths = [
      path.join(process.cwd(), "src/data/pitchbook-profiles.json"),
      path.join(process.cwd(), "web/src/data/pitchbook-profiles.json"),
      path.join(process.cwd(), "data/pitchbook-profiles.json"),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        return JSON.parse(raw);
      }
    }
  } catch {
    // missing fallback
  }

  return {
    synced_at: new Date().toISOString().slice(0, 10),
    companies: {},
    coverage: {} as PbCoverage,
  };
}
