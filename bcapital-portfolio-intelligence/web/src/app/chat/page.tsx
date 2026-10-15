import "@/components/companies/companies-redesign.css";
import type { Metadata } from "next";
import { listCompanies, getSignals } from "@/lib/api";
import { getPortfolioData, getFeed } from "@/lib/social";
import { buildRealCompanyProvenance, type RawSocialPostInput } from "@/lib/sentiment-provenance";
import { safeExternalUrl } from "@/lib/outbound";
import { ChatShell } from "@/components/chat/open-intelligent-ui/chat-shell";
import { InspectorDrawer, InspectorToggle } from "@/components/chat/inspector-drawer";
import { SidePane } from "@/components/media/side-pane";

export const metadata: Metadata = {
  title: "Chat",
  description:
    "Analyst chat over the B Capital portfolio — ask about any portfolio company; answers stream with interactive company cards, 4-factor sentiment provenance, and native source citations.",
};
export const revalidate = 120;

export default async function ChatPage() {
  const [cs, sig, pf, feed] = await Promise.all([
    listCompanies(),
    getSignals(),
    getPortfolioData(),
    getFeed(),
  ]);

  const sigBy = new Map(sig.data.data.map((x) => [x.slug, x]));
  const pfBySlug = new Map(pf.companies.map((c) => [c.slug, c]));
  const postsBySlug = new Map<string, RawSocialPostInput[]>();
  const socialCountBySlug = new Map<string, number>();

  for (const post of feed.posts) {
    if (post.company_slug) {
      socialCountBySlug.set(
        post.company_slug,
        (socialCountBySlug.get(post.company_slug) ?? 0) + 1
      );
      const list = postsBySlug.get(post.company_slug) ?? [];
      list.push(post as unknown as RawSocialPostInput);
      postsBySlug.set(post.company_slug, list);
    }
  }

  const companies = cs.data
    .filter((c) => c.b_capital_role !== "firm")
    .map((c) => {
      const pfc = pfBySlug.get(c.slug);
      const companyPosts = postsBySlug.get(c.slug) ?? [];
      const provenance = buildRealCompanyProvenance(
        {
          slug: c.slug,
          name: c.name,
          domain: pfc?.domain ?? null,
          latest_news: pfc?.latest_news ?? (c.latest_news ?? []).map((n) => ({
            title: n.title,
            url: n.url,
            source: n.source ?? null,
            published_at: n.published_at,
          })),
          funding_rounds: pfc?.funding_rounds ?? [],
          sentiment: {
            score: pfc?.sentiment.score ?? c.sentiment.score,
            label: pfc?.sentiment.label ?? c.sentiment.label,
            history: (pfc?.sentiment.history ?? []).map((h) => ({
              t: h.t,
              score: h.score,
            })),
          },
        },
        companyPosts
      );

      return {
        slug: c.slug,
        name: c.name,
        sector: pfc?.sector ?? c.sector,
        sector_label: pfc?.sector_label ?? c.sector,
        status: c.status,
        stage: pfc?.stage ?? c.stage,
        domain: pfc?.domain ?? null,
        hq: pfc?.hq ?? c.hq ?? null,
        region: pfc?.region ?? c.region ?? null,
        founded: pfc?.founded ?? null,
        employees: pfc?.employees ?? c.employees ?? null,
        total_raised_usd: pfc?.total_raised_usd ?? null,
        valuation_usd: pfc?.valuation_usd ?? null,
        linkedin: safeExternalUrl(pfc?.linkedin ?? c.linkedin_url),
        last_round: pfc?.last_round
          ? {
              round: pfc.last_round.round,
              amount_usd: pfc.last_round.amount_usd,
              date: pfc.last_round.date,
              source_url: safeExternalUrl(pfc.last_round.source_url),
            }
          : null,
        pitchbook: pfc?.pitchbook
          ? {
              investment_date: pfc.pitchbook.investment_date,
              investor_since: pfc.pitchbook.investor_since,
            }
          : null,
        sentiment: {
          score: c.sentiment.score,
          label: c.sentiment.label,
          delta: c.sentiment.delta ?? null,
          updated_at: c.sentiment.updated_at ?? null,
          basis: c.sentiment.basis ?? null,
        },
        prior_run_at: (c.sentiment as { prior_run_at?: string | null }).prior_run_at ?? null,
        news_count: pfc?.news_count ?? c.news_count ?? (c.latest_news ?? []).length,
        social_count: socialCountBySlug.get(c.slug) ?? 0,
        latest_news: (c.latest_news ?? []).slice(0, 5).map((n) => ({
          title: n.title,
          url: safeExternalUrl(n.url),
          published_at: n.published_at,
          source: n.source ?? null,
        })),
        estimated_ticket_size_usd: c.estimated_ticket_size_usd,
        estimated_ownership_pct: c.estimated_ownership_pct,
        b_capital_role: c.b_capital_role,
        provenance,
      };
    });

  const logos = new Map(cs.data.map((c) => [c.slug, c.logo_url]));
  const inspectorCompanies = companies.map((c) => ({
    slug: c.slug,
    name: c.name,
    sector: c.sector,
    logo_url: logos.get(c.slug) ?? null,
    score: c.sentiment.score,
    news: c.news_count ?? 0,
    signal: sigBy.get(c.slug)?.score ?? null,
    signal_confidence: sigBy.get(c.slug)?.confidence ?? null,
    signal_percentile: sigBy.get(c.slug)?.percentile ?? null,
  }));

  return (
    <div className="chat-row" data-testid="chat-row">
      <div className="chat-canvas" data-testid="chat-canvas" data-source={cs.source}>
        <ChatShell
          companies={companies}
          fetchedAt={cs.fetched_at}
          topBarRight={<InspectorToggle />}
        />
        <InspectorDrawer companies={inspectorCompanies} />
      </div>
      <SidePane />
    </div>
  );
}
