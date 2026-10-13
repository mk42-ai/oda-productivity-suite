import "server-only";
/**
 * Server-side access to the merged chat-batch datasets. Live backend first (GET {backend}/data/{name}, ISR 300 s), bundled copy in
 * src/data/social/ as the offline fallback (synced by scripts/sync-social-data.mjs). Nothing here ever touches the OnDemand key.
 */
import portfolioSnap from "@/data/social/portfolio.json";
import peopleSnap from "@/data/social/people.json";
import feedSnap from "@/data/social/social-feed.json";
import { backendBaseUrl } from "@/lib/api";
import { filterSocialDataset, publicSocialPost, isPublicSocialPost, SOCIAL_POLICY_VERSION, type SocialProviderState } from "@/lib/social-content";

export type FundingRound = { round: string | null; amount_usd: number | null; date: string | null; lead_investors: string[]; source_url: string | null; source: string };
export type SocialCompany = {
  slug: string; name: string; website: string | null; domain: string | null; logo_url: string | null; sector: string; sector_label: string; backend_sector: string; region: string | null; hq: string | null;
  stage: string | null; status: string | null; employees: number | null; founded: number | null; description: string | null; linkedin: string | null; x: string | null;
  total_raised_usd: number | null; valuation_usd: number | null; last_round: FundingRound | null; funding_rounds: FundingRound[];
  pitchbook: { investment_date: string; investor_since: string; source: string; session_id: string | null } | null;
  news_count: number; latest_news: { title: string; url: string | null; source: string | null; published_at: string | null; image_url: string | null }[];
  sentiment: { score: number | null; label: string; basis: string | null; model: string | null; scored_at: string | null; history: { t: string; score: number; model: string | null }[]; history_state: "placeholder" | "scored"; step2_snapshot: { basis: string | null; label: string | null; score: number | null; model: string | null } };
  founders: string[]; is_focus: boolean; b_capital_role: string; estimated_ticket_size_usd: number | null;
};
export type Person = { id: string; name: string; role: string; kind: "founder" | "executive"; company_slug: string; company: string; sector: string; bio: string | null; linkedin: string | null; x: string | null; cover: string; source: string; session_id: string | null };
export type Post = {
  id: string; platform: string; source_domain: string | null; author: string | null; text: string; url: string | null; image: string | null; posted_at: string | null;
  company_slug: string | null; company: string | null; sector: string; company_domain: string | null; sector_image?: string; top_comments?: string[];
  agent_takeaway: { author: string; text: string | null; model: string; pinned: boolean } | null;
  media?: { type: "image" | "video"; url: string; alt?: string; mime?: string }[];
  author_avatar?: string | null;
  verification?: "verified" | "unverified";
  provenance?: { kind: string; policy_version: string; provider: string; native_id: string };
};
type Portfolio = { generated_at: string; sources: Record<string, unknown>; pitchbook_investor: Record<string, unknown>; companies: SocialCompany[]; count: number };
type People = { generated_at: string; people: Person[]; founders: number; employees: number; count: number };
type Feed = { generated_at: string | null; posts: Post[]; count: number; by_platform: Record<string, number>; by_platform_split?: Record<string, { verified: number; unverified: number }>; verified_count?: number; unverified_count?: number; by_sector?: Record<string, number>; unavailable_sources: { platform: string; reason: string }[]; providers: SocialProviderState[]; quarantine: { excluded: number; reasons: Record<string, number>; reversible: boolean }; policy_version: string; data_state: "live-api" | "verified-cache" | "unavailable"; collection?: { status?: string; fetched?: number; admitted_unique?: number; duplicate?: number; excluded?: number; failed?: number; workers_launched?: number; worker_pool_size?: number; blocker?: string; finished_at?: string | null; jobs_ok?: number; storage?: { durable_configured?: boolean; warning?: string | null } } };

async function live<T>(name: string, fallback: T): Promise<T> {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 5000);
    const r = await fetch(`${backendBaseUrl}/data/${name}`, { next: { revalidate: 300 }, signal: ctl.signal, headers: { accept: "application/json" } });
    clearTimeout(t); if (!r.ok) throw new Error(String(r.status));
    return (await r.json()) as T;
  } catch { return fallback; }
}
export const getPortfolioData = () => live<Portfolio>("portfolio", portfolioSnap as unknown as Portfolio);
export const getPeople = () => live<People>("people", peopleSnap as unknown as People);
/** Shared B Social boundary: applies to initial render, pagination, profiles and Ask context.
 * Preserve the raw backend/bundled research dataset for the rest of the application. */
let feedMemo: { at: number; value: Feed } | null = null;
export const getFeed = async (): Promise<Feed> => {
  if (feedMemo && Date.now() - feedMemo.at < 60_000) return feedMemo.value;
  const v = await loadFeed(); if (v.data_state === "live-api") feedMemo = { at: Date.now(), value: v }; return v;
};
const loadFeed = async (): Promise<Feed> => {
  try {
    const r = await fetch(`${backendBaseUrl}/data/social-feed`, { cache: "no-store", signal: AbortSignal.timeout(25000) });
    if (!r.ok) throw new Error(`Feed HTTP ${r.status}`);
    const data = await r.json();
    // A filtered current-policy server view carries public receipts, not raw credentials/payloads.
    if (data.policy_version === SOCIAL_POLICY_VERSION && Array.isArray(data.posts)) {
      const posts = data.posts.filter(isPublicSocialPost) as Post[];
      const safe = filterSocialDataset({ posts: [] });
      const by_platform: Record<string, number> = {};
      for (const p of posts) by_platform[p.platform] = (by_platform[p.platform] ?? 0) + 1;
      return { ...safe, ...data, posts, count: posts.length, by_platform, providers: data.providers || safe.providers, data_state: "live-api" };
    }
    const safe = filterSocialDataset(data);
    return { ...safe, posts: safe.posts.map(publicSocialPost) as unknown as Post[], data_state: "live-api" };
  } catch {
    const snap = feedSnap as unknown as Feed;
    if (snap.policy_version === SOCIAL_POLICY_VERSION && Array.isArray(snap.posts)) { const posts = snap.posts.filter(isPublicSocialPost) as Post[]; return { ...filterSocialDataset({ posts: [] }), ...snap, posts, count: posts.length, data_state: posts.length ? "verified-cache" : "unavailable" }; }
    const safe = filterSocialDataset(feedSnap);
    return { ...safe, posts: safe.posts.map(publicSocialPost) as unknown as Post[], data_state: safe.count ? "verified-cache" : "unavailable" };
  }
};
