import "@/components/companies/companies-mobile.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { CompaniesGallery, type GalleryCompany } from "@/components/companies/companies-gallery";
import { getPortfolioData, getPeople, getFeed } from "@/lib/social";

export const metadata: Metadata = { title: "Companies", description: "Every B Capital portfolio company, colour-coded by sector, with funding timelines, sentiment, news counts, PitchBook fields and founders." };
export const revalidate = 300;

/** 2026-10-12 redesign: rows come from the merged chat-batch dataset (data/portfolio.json via backend /data/portfolio, bundled fallback).
 *  Only the fields the cards render cross the RSC boundary. Seed sentiment points are excluded from the sparkline series. */
async function rows(): Promise<{ rows: GalleryCompany[]; generatedAt: string }> {
  const [p, ppl, feed] = await Promise.all([getPortfolioData(), getPeople(), getFeed()]);
  const socialBySlug = new Map<string, number>(); for (const post of feed.posts) { if (post.company_slug) socialBySlug.set(post.company_slug, (socialBySlug.get(post.company_slug) ?? 0) + 1); }
  const byId = new Map(ppl.people.map((x) => [x.id, x]));
  const rows = p.companies.map((c): GalleryCompany => ({
    slug: c.slug, name: c.name, domain: c.domain, logo_url: c.logo_url, sector: c.sector, sector_label: c.sector_label, region: c.region, hq: c.hq, stage: c.stage,
    description: c.description ? c.description.slice(0, 220) : null, employees: c.employees, founded: c.founded, total_raised_usd: c.total_raised_usd, valuation_usd: c.valuation_usd, linkedin: c.linkedin,
    last_round: c.last_round ? { round: c.last_round.round, amount_usd: c.last_round.amount_usd, date: c.last_round.date } : null,
    rounds: c.funding_rounds.map((r) => ({ round: r.round, amount_usd: r.amount_usd, date: r.date })),
    pitchbook: c.pitchbook ? { investment_date: c.pitchbook.investment_date, investor_since: c.pitchbook.investor_since } : null, news_count: c.news_count, social_count: socialBySlug.get(c.slug) ?? 0,
    sentiment: { score: c.sentiment.score, label: c.sentiment.label, history: c.sentiment.history.map((h) => ({ t: h.t, score: h.score })), history_state: c.sentiment.history_state, step2_seed: c.sentiment.step2_snapshot?.model === "seed" },
    founders: c.founders.map((id) => byId.get(id)).filter((x): x is NonNullable<typeof x> => !!x).map((f) => ({ id: f.id, name: f.name, role: f.role })),
  }));
  return { rows, generatedAt: p.generated_at };
}

async function Body() {
  const { rows: r, generatedAt } = await rows();
  return (
    <>
      <PageHeader title="Companies" lede={`${r.length} portfolio companies, colour-coded by sector. Filter by sector and region; sorted latest funding first.`} fetchedAt={generatedAt} />
      <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}><CompaniesGallery rows={r} /></Suspense>
    </>
  );
}
export default function CompaniesPage() {
  return <Suspense fallback={<PageHeader title="Companies" lede="Loading the portfolio…" />}><Body /></Suspense>;
}
