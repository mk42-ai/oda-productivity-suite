import Link from "next/link";

/**
 * Cross-navigation links (QA cycle 9 — Lane A owns this file).
 * Consistent path: rail → overview → watchlist → dossier → related news / radar / graph / sentiment → chat / briefing.
 */
export function DossierCrossLinks({ id, name }: { id: string; name: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs" data-testid="dossier-crosslinks">
      <Link
        href={`/news?org=${id}`}
        className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-[#F9F9F9] px-2.5 py-1 text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D] transition-colors"
      >
        News about {name}
      </Link>
      <Link
        href={`/radar?org=${id}`}
        className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-[#F9F9F9] px-2.5 py-1 text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D] transition-colors"
      >
        Radar
      </Link>
      <Link
        href={`/graph?focus=${id}`}
        className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-[#F9F9F9] px-2.5 py-1 text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D] transition-colors"
      >
        Graph
      </Link>
      <Link
        href={`/sentiment?org=${id}`}
        className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-[#F9F9F9] px-2.5 py-1 text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D] transition-colors"
      >
        Sentiment
      </Link>
      <Link
        href={`/chat?org=${id}`}
        className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-[#F9F9F9] px-2.5 py-1 text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D] transition-colors"
      >
        Ask in chat
      </Link>
      <Link
        href={`/briefing?focus=${id}`}
        className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-[#F9F9F9] px-2.5 py-1 text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D] transition-colors"
      >
        Briefing
      </Link>
    </div>
  );
}

export function NewsCrossLinks({
  newsId,
  orgIds,
  technology,
}: {
  newsId: string;
  orgIds: string[];
  technology?: string | null;
}) {
  const firstOrgId = orgIds && orgIds.length > 0 ? orgIds[0] : null;
  const techSlug = technology
    ? technology.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    : "";

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#737373]" data-testid="news-crosslinks">
      <Link
        href={techSlug ? `/radar#${techSlug}` : "/radar"}
        className="hover:text-[#2563EB] hover:underline"
      >
        Radar
      </Link>
      {firstOrgId && (
        <>
          <span aria-hidden="true">·</span>
          <Link
            href={`/graph?focus=${firstOrgId}`}
            className="hover:text-[#2563EB] hover:underline"
          >
            Graph
          </Link>
        </>
      )}
    </span>
  );
}
