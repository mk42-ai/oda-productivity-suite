import type { Metadata } from "next";
import { getFeed, getPeople, getPortfolioData } from "@/lib/social";
import { SocialFeed, type Suggestion, type Story } from "@/components/social/social-feed";
import { SECTOR_KEYS } from "@/lib/social-sectors";

export const metadata: Metadata = { title: "B Social", description: "The B Capital founder network — social-media posts with original source links and pinned B Capital Agent takeaways." };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SocialPage() {
  const [feed, ppl, pf] = await Promise.all([getFeed(), getPeople(), getPortfolioData()]);
  const counts: Record<string, number> = Object.fromEntries(SECTOR_KEYS.map((k) => [k, 0])); feed.posts.forEach((p) => { counts[p.sector] = (counts[p.sector] ?? 0) + 1; });
  const byPlatform: Record<string, number> = {}; feed.posts.forEach((p) => { byPlatform[p.platform] = (byPlatform[p.platform] ?? 0) + 1; });
  const split: Record<string, { verified: number; unverified: number }> = {}; let verifiedCount = 0;
  feed.posts.forEach((p) => { const v = (p as { verification?: string }).verification === "unverified" ? "unverified" : "verified"; if (v === "verified") verifiedCount++; (split[p.platform] ||= { verified: 0, unverified: 0 })[v]++; });
  const founders = ppl.people.filter((p) => p.kind === "founder");
  // Stories: one founder per company with the most recent dated post (latest first); follow suggestions: founders of the focus + latest-funded companies.
  const seen = new Set<string>(); const stories: Story[] = [];
  for (const p of feed.posts) { if (!p.company_slug || seen.has(p.company_slug)) continue; const f = founders.find((x) => x.company_slug === p.company_slug); if (!f) continue; seen.add(p.company_slug); stories.push({ id: f.id, name: f.name, company: f.company, sector: f.sector }); if (stories.length >= 14) break; }
  const order = new Map(pf.companies.map((c, i) => [c.slug, i]));
  const suggestions: Suggestion[] = [...founders].sort((a, b) => (order.get(a.company_slug) ?? 999) - (order.get(b.company_slug) ?? 999)).filter((f, i, arr) => arr.findIndex((x) => x.company_slug === f.company_slug) === i).slice(0, 6).map((f) => ({ id: f.id, name: f.name, role: f.role, company: f.company, sector: f.sector }));
  return <SocialFeed initial={feed.posts.slice(0, 20)} total={feed.posts.length} counts={counts} suggestions={suggestions} stories={stories} unavailable={feed.unavailable_sources ?? []} people={ppl.people.length} companies={pf.companies.length} providers={feed.providers} excluded={feed.quarantine.excluded} dataState={feed.data_state} collection={feed.collection} byPlatform={byPlatform} split={split} verifiedCount={verifiedCount} />;
}
