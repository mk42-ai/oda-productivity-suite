import type { Metadata } from "next";
import { ORGS, newsFor, sentimentFor, modelsFor, rootOf, orgName, coverageStats, ECOSYSTEM_GROUPS } from "@/lib/uae/data";
import { SectionHeader } from "@/components/uae/bits";
import { WatchlistClient, type Card } from "@/components/uae/watchlist-client";
export const metadata: Metadata = { title: "Watchlist", description: "50 UAE AI organisations — companies, government bodies, universities, research centres and subsidiaries — with source-backed dossiers." };
export default function WatchlistPage() {
  const cov = coverageStats();
  const cards: Card[] = ORGS.map((o) => ({ id: o.id, name: o.name, type: o.type, hq: o.hq, parent: o.parent_id ? orgName(o.parent_id) : null, focus: o.ai_focus ?? [], confidence: o.confidence ?? 0, coverage: o.coverage, news: newsFor(o.id).length, voices: sentimentFor(o.id).length, models: modelsFor(o.id).length, unavailable: (o.unavailable ?? []).length, summary: (o.briefing ?? "").replace(/\[\d+(?:,\s*\d+)*\]/g, "").trim(), root: rootOf(o.id) }));
  const rootNames = Object.fromEntries(ECOSYSTEM_GROUPS.map((id) => [id, orgName(id)]));
  return (
    <>
      <SectionHeader eyebrow="Watchlist" title="50 organisations shaping UAE AI" image="/brand/uae/sections/dossier-header"
        lede={`Companies, government bodies, universities, research centres and subsidiaries. Mean research coverage ${Math.round(cov.meanCoverage * 100)}% · ${cov.highConfidence} high-confidence dossiers · parents and subsidiaries are de-duplicated into ${ECOSYSTEM_GROUPS.length} ecosystem groups for aggregates.`} />
      <WatchlistClient cards={cards} rootNames={rootNames} />
    </>
  );
}
