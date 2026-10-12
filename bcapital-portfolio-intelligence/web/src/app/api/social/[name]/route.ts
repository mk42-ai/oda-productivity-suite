import { NextRequest } from "next/server";
import { getPortfolioData, getPeople, getFeed } from "@/lib/social";
import { SOCIAL_PROVIDERS } from "@/lib/social-content";
/**
 * GET /api/social/portfolio | /api/social/people | /api/social/social-feed — the merged chat-batch datasets (backend /data/{name} first,
 * bundled copy as fallback). `social-feed` accepts ?sector=&platform=&company=&limit=&offset= (latest-first is preserved).
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET(req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params; const n = name.replace(/\.json$/, "");
  if (n === "portfolio") return Response.json(await getPortfolioData());
  if (n === "people") return Response.json(await getPeople());
  if (n === "social-feed" || n === "feed") {
    const f = await getFeed(); const sp = req.nextUrl.searchParams;
    let posts = f.posts;
    const platform = sp.get("platform");
    if (platform && !Object.prototype.hasOwnProperty.call(SOCIAL_PROVIDERS, platform) && platform !== "linkedin" && platform !== "tiktok") return Response.json({ errorCode: "provider_not_allowed", message: "Only configured social providers are allowed" }, { status: 400 });
    for (const k of ["sector", "platform"] as const) { const v = sp.get(k); if (v) posts = posts.filter((p) => p[k] === v); }
    const co = sp.get("company"); if (co) posts = posts.filter((p) => p.company_slug === co);
    const ver = sp.get("verification"); if (ver) posts = posts.filter((p) => (p as { verification?: string }).verification === ver);
    const query = sp.get("q")?.toLocaleLowerCase(); if (query) posts = posts.filter((p) => [p.text, p.author, p.company].some((v) => String(v || "").toLocaleLowerCase().includes(query)));
    const limit = Math.min(Math.max(Number(sp.get("limit") ?? 50) || 50, 1), 500); const offset = Math.max(Number(sp.get("offset") ?? 0) || 0, 0);
    return Response.json({ generated_at: f.generated_at, total: posts.length, offset, limit, unavailable_sources: f.unavailable_sources, providers: f.providers, quarantine: f.quarantine, policy_version: f.policy_version, data_state: f.data_state, collection: f.collection, data: posts.slice(offset, offset + limit) });
  }
  return Response.json({ errorCode: "not_found", message: `unknown dataset ${n} (portfolio | people | social-feed)` }, { status: 404 });
}
