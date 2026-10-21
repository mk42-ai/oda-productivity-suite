import { NextRequest } from "next/server";
import { ONDEMAND_BASE_URL, serverApiKey, UPSTREAM_USER_AGENT, PLUGIN_ID } from "@/lib/ondemand/config";
import { buildContextPayload } from "@/lib/chat/context-payload";
import { ORGS, SENTIMENT, NEWS, RADAR, classCounts, ageDays, META } from "@/lib/uae/data";
import { PLUGIN_ERROR_PATTERNS } from "@/lib/ondemand/eventMap";
import { pluginAvailability, recordPluginFailure, recordPluginSuccess, shouldAttachPlugin } from "@/lib/ondemand/plugin-availability";

/** Lane D 2026-10-21: honest web-research coverage of a briefing. `web:"unavailable"` = the plugin was skipped (backoff) or failed upstream. */
export type BriefingCoverage = { web: "not-requested" | "attached" | "unavailable"; reason: "ok" | "not-requested" | "backoff" | "credits" | "upstream"; nextRetryAt: string | null; pluginId: string };
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
/**
 * National AI Briefing generator — real OnDemand call (POST /chat/v1/sessions → POST /chat/v1/sessions/{id}/query, responseMode sync,
 * endpoint predefined-gpt-5.6-luna). Grounded on the uae_cc_v1 digest; optional live web research via the pinned Perplexity plugin.
 * Honest failure: any upstream error is returned as-is (status + message) — no canned briefing is ever substituted.
 * Coverage (lane D): `coverage.web` = "attached" | "unavailable" (backoff / credits / upstream) | "not-requested" — the client renders the banner.
 */
export async function POST(req: NextRequest) {
  const key = req.headers.get("x-ondemand-key")?.trim() || serverApiKey();
  if (!key) return Response.json({ ok: false, error: "No OnDemand key configured (ONDEMAND_API_KEY) and none supplied in Settings." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { focus?: string; web?: boolean; audience?: string };
  const focus = (body.focus ?? "").slice(0, 300); const web = body.web === true;
  const recent = NEWS.filter((n) => (ageDays(n.date) ?? 999) <= 30).slice(0, 25);
  const cc = classCounts();
  const ctx = buildContextPayload([], [], { query: `${focus} partnerships research jobs safety compute models international`, fetchedAt: META.generated_at });
  const facts = [
    `Watchlist: ${ORGS.length} organisations. Sentiment sample: ${SENTIMENT.length} statements — ${Object.entries(cc).map(([k, v]) => `${k} ${v}`).join(", ")}.`,
    `Radar: ${RADAR.map((r) => `${r.name}=${r.ring} (${r.signals})`).join("; ")}.`,
    `Recent events (≤30 days):\n${recent.map((n) => `- ${n.date} · ${n.headline}${n.url ? ` <${n.url}>` : ""}`).join("\n")}`,
  ].join("\n");
  const query = `You are the National AI Briefing agent of a CONCEPT DEMONSTRATION command centre (not an official government system). Write a one-page "National AI Briefing — UAE" dated 21 October 2026 for a senior ${body.audience || "government"} audience${focus ? `, with special focus on: ${focus}` : ""}.
Format (markdown): title line; a bold one-line bottom line up front; "## Key developments (last 30 days)" 5–7 bullets; "## Ecosystem & capability"; "## Public sentiment (sample, not a survey)"; "## Risks & watch items"; "## Recommended questions for leadership". In every section separate **Verified** bullets (each ends with a markdown link to a source URL from the context${web ? " or from your web research" : ""}) from **Interpretation** bullets. Never invent URLs, numbers or quotes; write "unavailable" when unsupported. End with the line: "Concept Demonstration — not an official government system."
${facts}

${ctx.systemContext}`;
  const t0 = Date.now();
  // Availability backoff: while the pinned plugin is inside a credits-failure window it is NOT attached (plugin-availability.ts) — the
  // briefing stays grounded on the curated digest and the response says so in `coverage` (never silently, never another plugin).
  const availAtStart = pluginAvailability(PLUGIN_ID);
  const attach = web && shouldAttachPlugin(PLUGIN_ID);
  const pluginIds = attach ? [PLUGIN_ID] : [];
  let coverage: BriefingCoverage = !web
    ? { web: "not-requested", reason: "not-requested", nextRetryAt: null, pluginId: PLUGIN_ID }
    : attach ? { web: "attached", reason: "ok", nextRetryAt: null, pluginId: PLUGIN_ID }
    : { web: "unavailable", reason: "backoff", nextRetryAt: availAtStart.nextRetryAt, pluginId: PLUGIN_ID };
  const headers = { apikey: key, "content-type": "application/json", "user-agent": UPSTREAM_USER_AGENT };
  try {
    const s = await fetch(`${ONDEMAND_BASE_URL}/chat/v1/sessions`, { method: "POST", headers, body: JSON.stringify({ externalUserId: "uae-cc-briefing", pluginIds }) });
    const sj = (await s.json().catch(() => ({}))) as { data?: { id?: string }; message?: string };
    if (!s.ok || !sj.data?.id) return Response.json({ ok: false, stage: "createchatsession", status: s.status, error: sj.message ?? `HTTP ${s.status}` }, { status: 502 });
    const q = await fetch(`${ONDEMAND_BASE_URL}/chat/v1/sessions/${sj.data.id}/query`, { method: "POST", headers, signal: req.signal, body: JSON.stringify({ endpointId: "predefined-gpt-5.6-luna", query, responseMode: "sync", pluginIds }) });
    const qj = (await q.json().catch(() => ({}))) as { data?: { answer?: string; messageId?: string; metrics?: Record<string, number> }; message?: string };
    if (!q.ok || !qj.data?.answer) return Response.json({ ok: false, stage: "submitquery", status: q.status, error: qj.message ?? `HTTP ${q.status}`, sessionId: sj.data.id }, { status: 502 });
    const answer = qj.data.answer;
    if (attach) {
      // The sync answer carries the plugin failure inline ("web search failed due to insufficient credits", "Not enough credits", …) —
      // OnDemand returns HTTP 200 for it. Detect it, open/extend the backoff window and label the coverage honestly.
      const hit = PLUGIN_ERROR_PATTERNS.exec(answer) ?? /web search failed[^.\n]*/i.exec(answer);
      if (hit) {
        const credits = /credits/i.test(hit[0]);
        const a = recordPluginFailure(PLUGIN_ID, `Perplexity (briefing, sync): "${hit[0].replace(/\s+/g, " ").trim().slice(0, 160)}"`);
        coverage = { web: "unavailable", reason: credits ? "credits" : "upstream", nextRetryAt: a.nextRetryAt, pluginId: PLUGIN_ID };
      } else recordPluginSuccess(PLUGIN_ID); // attached and no failure signature in the sync answer → close the backoff window
    }
    return Response.json({ ok: true, markdown: answer, sessionId: sj.data.id, messageId: qj.data.messageId, metrics: qj.data.metrics ?? null, endpointId: "predefined-gpt-5.6-luna", pluginIds, webRequested: web, coverage, latency_ms: Date.now() - t0, generated_at: new Date().toISOString() });
  } catch (e) {
    return Response.json({ ok: false, stage: "network", error: (e as Error).message }, { status: 502 });
  }
}
