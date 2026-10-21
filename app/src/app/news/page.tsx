import type { Metadata } from "next";
import { NEWS, orgName, ageDays, countBy } from "@/lib/uae/data";
import { SectionHeader, Stat } from "@/components/uae/bits";
import { NewsClient, type NI } from "@/components/uae/news-client";
export const metadata: Metadata = { title: "News Intelligence", description: "Dated UAE AI news events with sources, entities and corroboration." };
export default function NewsPage() {
  const items: NI[] = NEWS.map((n) => ({ id: n.id, headline: n.headline, date: n.date, publisher: n.publisher, url: n.url, summary: n.summary, category: n.category, orgs: n.org_ids.map((id) => ({ id, name: orgName(id) })), also: (n.also ?? []).length }));
  const cats = Object.entries(countBy(NEWS, (n) => n.category)).sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const d30 = NEWS.filter((n) => (ageDays(n.date) ?? 999) <= 30).length; const verified = NEWS.filter((n) => n.url).length;
  return (
    <>
      <SectionHeader eyebrow="News Intelligence" title="What happened, who did it, where it came from" image="/brand/uae/sections/news-header" lede="Events extracted by the OnDemand News-Retrieval agent from Perplexity, GPT Search and Internet-search results, de-duplicated by headline similarity with corroborating reports folded in." />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Events" value={NEWS.length} /><Stat label="Last 30 days" value={d30} /><Stat label="With verified link" value={`${verified}`} sub={`${Math.round((verified / NEWS.length) * 100)}%`} /><Stat label="Categories" value={cats.length} /></div>
      <NewsClient items={items} categories={cats} />
    </>
  );
}
