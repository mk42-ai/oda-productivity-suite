import { NextResponse } from "next/server";
import { META, ORGS, SENTIMENT, NEWS, GRAPH } from "@/lib/uae/data";
import { pluginAvailability } from "@/lib/ondemand/plugin-availability";
import { PLUGIN_ID } from "@/lib/ondemand/config-public";
export const dynamic = "force-dynamic";
/** Liveness + namespace counts + `web_research` (lane D: pinned Perplexity plugin availability/backoff state — plugin-availability.ts). `ondemand_key` reports only whether a server key is configured (never the value). */
export function GET() {
  return NextResponse.json({ ok: true, app: "uae-ai-command-centre", disclaimer: META.disclaimer, namespace: META.namespace, as_of: META.as_of, orgs: ORGS.length, sentiment: SENTIMENT.length, news: NEWS.length, edges: GRAPH.edges.length, ondemand_key: !!process.env.ONDEMAND_API_KEY, commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? null, web_research: webResearch(), checked_at: new Date().toISOString() });
}
function webResearch() {
  const a = pluginAvailability(PLUGIN_ID);
  return { plugin: PLUGIN_ID, available: a.available, reason: a.reason, lastError: a.lastError, lastFailureAt: a.lastFailureAt, failures: a.failures, backoffMinutes: a.backoffMinutes, nextRetryAt: a.nextRetryAt };
}
