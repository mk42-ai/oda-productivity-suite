import type { Metadata } from "next";
import { ChatShell } from "@/components/chat/open-intelligent-ui/chat-shell";
import { InspectorDrawer, InspectorToggle } from "@/components/chat/inspector-drawer";
import { SidePane } from "@/components/media/side-pane";
import { ORGS, TYPE_LABEL, newsFor, sentimentFor, logoFor, META } from "@/lib/uae/data";
export const metadata: Metadata = { title: "Executive Intelligence Chat", description: "OnDemand-powered executive chat over the UAE AI watchlist — answers split verified facts vs interpretation, with citations.", alternates: { canonical: "/chat" } };
/**
 * /chat — preserved full-width thread canvas (virtualized thinking/activity, rAF-coalesced stream state, scroll anchoring, run rail, credits
 * failure path). Context = watchlist organisations (uae_cc_v1); the grounded digest is attached to the first turn by context-payload.ts.
 */
export default function ChatPage() {
  const companies = ORGS.map((o) => {
    const n = newsFor(o.id);
    return { slug: o.id, name: o.name, sector: TYPE_LABEL[o.type], status: o.type, stage: o.hq ?? null, sentiment: { score: 0, label: "n/a" }, prior_run_at: null, news_count: n.length, latest_news: n.slice(0, 5).map((x) => ({ title: x.headline, url: x.url || null, published_at: x.date ?? null, source: x.publisher ?? null })), estimated_ticket_size_usd: null };
  });
  const inspectorCompanies = ORGS.map((o) => ({ slug: o.id, name: o.name, sector: TYPE_LABEL[o.type], logo_url: logoFor(o.id), score: sentimentFor(o.id).length, news: newsFor(o.id).length }));
  return (
    <div className="chat-row" data-testid="chat-row">
      <div className="chat-canvas" data-testid="chat-canvas" data-source="uae_cc_v1">
        <ChatShell companies={companies} fetchedAt={META.generated_at} topBarRight={<InspectorToggle />} />
        <InspectorDrawer companies={inspectorCompanies} />
      </div>
      <SidePane />
    </div>
  );
}
