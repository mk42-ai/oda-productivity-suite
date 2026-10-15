import "@/components/companies/companies-mobile.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { CompaniesGallery, type GalleryCompany } from "@/components/companies/companies-gallery";
import { getPortfolioData, getPeople, getFeed } from "@/lib/social";
import { buildRealCompanyProvenance, type RawSocialPostInput } from "@/lib/sentiment-provenance";
import { safeExternalUrl } from "@/lib/outbound";

export const metadata: Metadata = {
  title: "Companies",
  description:
    "Every B Capital portfolio company, organized by sector, with interactive funding timelines, evidence-weighted sentiment provenance, native source citations, PitchBook records and leadership.",
};
export const revalidate = 300;

async function rows(): Promise<{ rows: GalleryCompany[]; generatedAt: string }> {
  const [p, ppl, feed] = await Promise.all([getPortfolioData(), getPeople(), getFeed()]);
  const socialBySlug = new Map<string, number>();
  const postsBySlug = new Map<string, RawSocialPostInput[]>();

  for (const post of feed.posts) {
    if (post.company_slug) {
      socialBySlug.set(post.company_slug, (socialBySlug.get(post.company_slug) ?? 0) + 1);
      const list = postsBySlug.get(post.company_slug) ?? [];
      list.push(post as unknown as RawSocialPostInput);
      postsBySlug.set(post.company_slug, list);
    }
  }

  const byId = new Map(ppl.people.map((x) => [x.id, x]));
  const rows = p.companies.map((c): GalleryCompany => {
    const companyPosts = postsBySlug.get(c.slug) ?? [];
    const provenance = buildRealCompanyProvenance(
      {
        slug: c.slug,
        name: c.name,
        domain: c.domain,
        latest_news: c.latest_news,
        funding_rounds: c.funding_rounds,
        sentiment: {
          score: c.sentiment.score,
          label: c.sentiment.label,
          history: c.sentiment.history.map((h) => ({ t: h.t, score: h.score })),
        },
      },
      companyPosts
    );

    return {
      slug: c.slug,
      name: c.name,
      domain: c.domain,
      logo_url: c.logo_url,
      sector: c.sector,
      sector_label: c.sector_label,
      region: c.region,
      hq: c.hq,
      stage: c.stage,
      description: c.description ? c.description.slice(0, 600) : null,
      employees: c.employees,
      founded: c.founded,
      total_raised_usd: c.total_raised_usd,
      valuation_usd: c.valuation_usd,
      linkedin: safeExternalUrl(c.linkedin),
      last_round: c.last_round
        ? {
            round: c.last_round.round,
            amount_usd: c.last_round.amount_usd,
            date: c.last_round.date,
            source_url: safeExternalUrl(c.last_round.source_url),
          }
        : null,
      rounds: c.funding_rounds.map((r) => ({
        round: r.round,
        amount_usd: r.amount_usd,
        date: r.date,
        source_url: safeExternalUrl(r.source_url),
      })),
      pitchbook: c.pitchbook
        ? {
            investment_date: c.pitchbook.investment_date,
            investor_since: c.pitchbook.investor_since,
          }
        : null,
      news_count: c.news_count,
      social_count: socialBySlug.get(c.slug) ?? 0,
      sentiment: {
        score: c.sentiment.score,
        label: c.sentiment.label,
        history: c.sentiment.history.map((h) => ({ t: h.t, score: h.score })),
        history_state: c.sentiment.history_state,
        step2_seed: c.sentiment.step2_snapshot?.model === "seed",
      },
      provenance,
      founders: c.founders
        .map((id) => byId.get(id))
        .filter((x): x is NonNullable<typeof x> => !!x)
        .map((f) => ({ id: f.id, name: f.name, role: f.role })),
    };
  });
  return { rows, generatedAt: p.generated_at };
}

async function Body() {
  const { rows: r, generatedAt } = await rows();
  return (
    <>
      <PageHeader
        title="Companies"
        lede={`${r.length} portfolio companies across 10 core sectors. Filter by sector and region, inspect interactive funding timelines and multi-source sentiment provenance, or open any card for a full preview.`}
        fetchedAt={generatedAt}
      />
      <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
        <CompaniesGallery rows={r} />
      </Suspense>
    </>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<PageHeader title="Companies" lede="Loading the portfolio…" />}>
      <Body />
    </Suspense>
  );
}
