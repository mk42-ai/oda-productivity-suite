import { backendBaseUrl, getNewsSummary } from "@/lib/api";
import { loadEvidence } from "@/lib/reputation/corpus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/news/summary — the News Pulse summary the page header and the e2e proof consume.
 * Routes around the historic `GET /news/summary → 404 "Route not found"` (the Vercel Services rewrite forwarded `/backend/news/summary`
 * verbatim to the Hono router; fixed server-side in src/app.ts, and this route is the client-side alias): it asks the backend first
 * (`${PORTFOLIO_API_URL}/news/summary`), reports which upstream answered, and always adds the corpus aggregate from the merged
 * 2026-10-19 evidence store (portfolio-company releases + portfolio social rows per company) so the page has a live number even when
 * the ephemeral backend is down.
 */
export async function GET() {
  const t0 = Date.now();
  const summary = await getNewsSummary();
  const { items } = loadEvidence();
  const perCompany: Record<string, number> = {};
  let corpusItems = 0;
  for (const it of items) {
    if (!it.companies?.length) continue;
    corpusItems++;
    for (const c of it.companies) perCompany[c] = (perCompany[c] ?? 0) + 1;
  }
  return Response.json({
    ok: true,
    backend: { url: `${backendBaseUrl}/news/summary`, source: summary.source, status: summary.source === "live" ? 200 : null, fetched_at: summary.fetched_at },
    total: summary.data.total,
    by_company: summary.data.by_company,
    companies: summary.data.companies,
    definition: summary.data.definition,
    corpus: { source: "web/data/reputation/evidence.json", items_naming_a_portfolio_company: corpusItems, companies: Object.keys(perCompany).length, by_company: perCompany },
    took_ms: Date.now() - t0,
  }, { headers: { "cache-control": "no-store" } });
}
