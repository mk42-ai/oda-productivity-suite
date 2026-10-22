import { ORGS, TYPE_LABEL, logoFor, sentimentFor } from "@/lib/uae/data";
export const dynamic = "force-static";
/** Watchlist index for the ⌘K palette (same shape the palette already parsed: { data: [{slug,name,sector,logo_url,sentiment}] }). */
export function GET() {
  return Response.json({ namespace: "uae_cc_v1", data: ORGS.map((o) => ({ slug: o.id, name: o.name, sector: TYPE_LABEL[o.type], logo_url: logoFor(o.id), sentiment: { score: null }, voices: sentimentFor(o.id).length })) });
}
