import { NextRequest } from "next/server";
import { ONDEMAND_BASE_URL, serverApiKey, UPSTREAM_USER_AGENT, QWEN_ENDPOINT_ID, QWEN_ENDPOINT_LABEL } from "@/lib/ondemand/config";
import { getFeed } from "@/lib/social";
import { canonicalOriginalUrl } from "@/lib/outbound";
/**
 * POST /api/social/ask  { question, sessionId?, sector?, company? }  →  text/event-stream
 *   data: {"type":"session","sessionId","endpointId"} · data: {"type":"delta","text"} · data: {"type":"done","ms"} · data: {"type":"error","status","message"}
 * "Ask B Social" — streams Cerebras Qwen 3.8 (QWEN_ENDPOINT_ID) through the OnDemand Chat API with the SERVER key (or the user's own
 * x-ondemand-key override, same pattern as /api/chat). The latest 25 feed posts (filtered by the active sector/company tab) are passed as context.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;
const enc = new TextEncoder();
const PERPLEXITY_PLUGIN = "plugin-1722260873";
const frame = (o: unknown) => enc.encode(`data: ${JSON.stringify(o)}\n\n`);

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-ondemand-key")?.trim() || serverApiKey();
  const body = (await req.json().catch(() => ({}))) as { question?: string; sessionId?: string; sector?: string; company?: string; web?: boolean };
  // web=true attaches the Perplexity plugin; its plugin_sources items are forwarded as a {type:"sources"} frame so the UI maps each [n] to the exact cited URL.
  const plugins = body.web ? [PERPLEXITY_PLUGIN] : [];
  const question = String(body.question ?? "").trim().slice(0, 2000);
  if (!question) return Response.json({ errorCode: "bad_request", message: "question is required" }, { status: 400 });
  if (!key) return Response.json({ errorCode: "no_key", message: "ONDEMAND_API_KEY is not configured on the server" }, { status: 503 });
  const h = { apikey: key, "content-type": "application/json", "user-agent": UPSTREAM_USER_AGENT };
  const feed = await getFeed();
  if (!feed.posts.length) return Response.json({ errorCode: "no_verified_social_context", message: "No verified social posts are available for Ask B Social. No model or provider request was made." }, { status: 503 });
  const ctx = feed.posts.filter((p) => (!body.sector || p.sector === body.sector) && (!body.company || p.company_slug === body.company)).slice(0, 25)
    .map((p) => `- [${p.posted_at ?? "undated"} · ${p.platform} · ${p.company ?? "portfolio"}] ${p.text.slice(0, 220)}${(() => { const u = canonicalOriginalUrl(p); return u ? ` (${u})` : ""; })()}`).join("\n");
  const t0 = Date.now();
  const stream = new ReadableStream<Uint8Array>({
    async start(c) {
      try {
        let sid = body.sessionId && /^[a-f0-9]{24}$/i.test(body.sessionId) ? body.sessionId : "";
        if (!sid) {
          const r = await fetch(`${ONDEMAND_BASE_URL}/chat/v1/sessions`, { method: "POST", headers: h, body: JSON.stringify({ externalUserId: "b-social", pluginIds: plugins, contextMetadata: [{ key: "surface", value: "ask-b-social" }] }) });
          if (!r.ok) { c.enqueue(frame({ type: "error", status: r.status, message: `session create failed: HTTP ${r.status}` })); c.close(); return; }
          const j = (await r.json()) as { data?: { id?: string } }; sid = String(j?.data?.id ?? "");
        }
        c.enqueue(frame({ type: "session", sessionId: sid, endpointId: QWEN_ENDPOINT_ID, label: QWEN_ENDPOINT_LABEL }));
        const query = `You are "Ask B Social", the assistant inside B Capital's founder network. Answer concisely (≤ 120 words) using the feed context first; say plainly when the context does not cover it. Cite post URLs inline when you use them.${body.web ? " When you use web search results, cite them with numbered [n] markers that match the search result order; never invent URLs." : ""}\n\nFEED CONTEXT (latest first):\n${ctx || "(no posts for this tab)"}\n\nQUESTION: ${question}`;
        const r = await fetch(`${ONDEMAND_BASE_URL}/chat/v1/sessions/${sid}/query`, { method: "POST", headers: { ...h, accept: "text/event-stream" }, body: JSON.stringify({ query, endpointId: QWEN_ENDPOINT_ID, responseMode: "stream", pluginIds: plugins, modelConfigs: { temperature: 0.3 } }), signal: req.signal });
        if (!r.ok || !r.body) { c.enqueue(frame({ type: "error", status: r.status, message: `query failed: HTTP ${r.status}` })); c.close(); return; }
        const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = "";
        const handle = (line: string) => {
          if (!line.startsWith("data:")) return; const payload = line.slice(5).trim(); if (!payload || payload === "[DONE]") return;
          if (payload.startsWith("[ERROR]")) { c.enqueue(frame({ type: "error", status: 502, message: payload.slice(0, 300) })); return; }
          try { const f = JSON.parse(payload) as { eventType?: string; answer?: string; sources?: { items?: { title?: string; url?: string; domain?: string }[] } };
            if (f.eventType === "fulfillment" && typeof f.answer === "string" && f.answer) c.enqueue(frame({ type: "delta", text: f.answer }));
            if (f.eventType === "plugin_sources" && Array.isArray(f.sources?.items)) c.enqueue(frame({ type: "sources", items: f.sources!.items!.filter((i) => typeof i?.url === "string").map((i) => ({ title: String(i.title ?? ""), url: String(i.url), domain: String(i.domain ?? "") })) }));
          } catch { /* heartbeat */ }
        };
        for (;;) { const { value, done } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true }); let nl: number; while ((nl = buf.indexOf("\n")) >= 0) { handle(buf.slice(0, nl).replace(/\r$/, "")); buf = buf.slice(nl + 1); } }
        if (buf) handle(buf);
        c.enqueue(frame({ type: "done", ms: Date.now() - t0 }));
      } catch (e) { c.enqueue(frame({ type: "error", status: 500, message: String((e as Error)?.message ?? e).slice(0, 200) })); }
      c.close();
    },
  });
  return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", "x-accel-buffering": "no", "content-encoding": "identity" } });
}
