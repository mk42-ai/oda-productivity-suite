import { NextResponse } from "next/server";
import { META, ORGS, SENTIMENT, NEWS, GRAPH } from "@/lib/uae/data";
export const dynamic = "force-dynamic";
/** Liveness + namespace counts. `ondemand_key` reports only whether a server key is configured (never the value). */
export function GET() {
  return NextResponse.json({ ok: true, app: "uae-ai-command-centre", disclaimer: META.disclaimer, namespace: META.namespace, as_of: META.as_of, orgs: ORGS.length, sentiment: SENTIMENT.length, news: NEWS.length, edges: GRAPH.edges.length, ondemand_key: !!process.env.ONDEMAND_API_KEY, commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? null, checked_at: new Date().toISOString() });
}
