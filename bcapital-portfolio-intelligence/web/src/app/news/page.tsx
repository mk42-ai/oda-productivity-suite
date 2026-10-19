import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllNews, listCompanies } from "@/lib/api";
import { PageHeader } from "@/components/shell/page-header";
import { NewsFeed } from "@/components/news/news-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { NEWS_FIRST_PAGE, slimNewsItem } from "@/lib/news-feed";
export const metadata: Metadata = { title: "News Pulse", description: "Live news across every B Capital portfolio company — filter by company, sector and sentiment, with original source links.", openGraph: { title: "News Pulse", description: "Live news across every B Capital portfolio company — filter by company, sector and sentiment, with original source links." }, twitter: { title: "News Pulse", description: "Live news across every B Capital portfolio company — filter by company, sector and sentiment, with original source links." }, alternates: { canonical: "/news" } };
export const revalidate = 120;
export default async function NewsPage() {
  const [news, cs] = await Promise.all([getAllNews(), listCompanies()]);
  const companies = cs.data.filter((c) => c.b_capital_role !== "firm").map((c) => ({ slug: c.slug, name: c.name, sector: c.sector, score: c.sentiment.score, delta: c.sentiment.delta ?? null }));
  return (
    <>
      <PageHeader title="News Pulse" lede={`${news.total.toLocaleString("en-US")} items · ${Object.keys(news.perCompany).length} companies · daily 06:00 UTC`} sources={[{ name: "companies", source: cs.source }, { name: "news total", source: news.summarySource }, { name: news.failedCompanies.length ? `news lists of ${news.failedCompanies.length} companies` : "news lists", source: news.failedCompanies.length || news.liveCompanies === 0 ? "snapshot" : "live" }]} fetchedAt={news.fetched_at} />
      {/* 2026-10-19: the summary line the e2e/proof reads — GET /news/summary (backend, via the /backend prefix on Vercel Services) answered or not,
          plus the corpus aggregate served by /api/news/summary. `data-summary-source=live` means the backend route returned 200. */}
      <p className="mono mb-3 text-[11px] text-secondary" data-testid="news-summary-line" data-summary-source={news.summarySource} data-summary-total={news.total}>
        GET /news/summary → {news.summarySource === "live" ? "200 · backend" : "snapshot fallback"} · {news.total.toLocaleString("en-US")} items across {Object.keys(news.perCompany).length} companies · {news.definition}
      </p>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}><NewsFeed items={news.data.slice(0, NEWS_FIRST_PAGE).map(slimNewsItem)} total={news.data.length} companies={companies} /></Suspense>
    </>
  );
}
