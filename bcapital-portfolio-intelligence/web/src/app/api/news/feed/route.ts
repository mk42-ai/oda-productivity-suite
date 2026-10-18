import { getAllNews } from "@/lib/api";
import { slimNewsItem } from "@/lib/news-feed";

/** Full News Pulse feed for the client-side filters (same deterministic order as the /news document — see getAllNews). */
export const revalidate = 120;
export async function GET() {
  const news = await getAllNews();
  return Response.json({ items: news.data.map(slimNewsItem), total: news.data.length, fetched_at: news.fetched_at });
}
