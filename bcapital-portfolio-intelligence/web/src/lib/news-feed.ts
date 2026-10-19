import type { NewsItem } from "@/lib/types";

/** Items shipped inside the /news document. The rest arrive from /api/news/feed after hydration. */
export const NEWS_FIRST_PAGE = 120;

export type NewsFeedItem = NewsItem & { company_slug: string; company_name: string; company_logo?: string | null; sector: string; sentiment_score: number | null; sentiment_delta: number | null };

/** Strip fields the feed card never renders, so the document and the RSC payload stay small. */
export function slimNewsItem<T extends NewsFeedItem>(n: T): NewsFeedItem {
  return {
    id: n.id, title: n.title, url: n.url, source: n.source, kind: n.kind, published_at: n.published_at,
    summary: n.summary ? n.summary.slice(0, 400) : null, image_url: n.image_url, fetched_at: n.fetched_at ?? null,
    company_slug: n.company_slug, company_name: n.company_name, company_logo: n.company_logo ?? null, sector: n.sector,
    sentiment_score: n.sentiment_score, sentiment_delta: n.sentiment_delta,
  };
}
