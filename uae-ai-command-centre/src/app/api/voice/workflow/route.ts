import { NextRequest } from "next/server";
import { ONDEMAND_BASE_URL, serverApiKey, UPSTREAM_USER_AGENT, resolvePluginIds } from "@/lib/ondemand/config";
/**
 * Advanced voice mode relay (Agents Flow Builder — LIVE docs re-read 2026-10-12 via /config/v1/public/docs/reference/api/…):
 *   POST {base}/automation/api/workflow/{id}/execute                      → { executionID }                 (post_workflow-id-execute)
 *   GET  {base}/automation/api/execution/{executionID}                     → { data: { status, … } }        (get_execution-executionid)
 *   GET  {base}/automation/api/execution/{executionID}/logs                → { data: ExecutionLog[] }        (get_execution-executionid-logs)
 *   GET  {base}/automation/api/execution/{executionID}/transcript          → { data: Transcript[] | null }  (get_execution-executionid-transcript)
 * The workflow (VOICE_WORKFLOW_ID) holds ONE advancedVoiceMode node wired to the SAME plugin ids the chat sends. Keys stay server-side.
 *
 * POST /api/voice/workflow { transcript, pluginIds[], threadId?, sessionId? } → { ok, executionId, workflowId, pluginIds }
 * GET  /api/voice/workflow?executionId=…  → text/event-stream of `status` / `log` / `transcript` / `done` frames (polls every 1.5 s, ≤ 60 s)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;
const WF = () => (process.env.VOICE_WORKFLOW_ID ?? "").trim();
const AUTO = `${ONDEMAND_BASE_URL}/automation/api`;
const hdrs = (key: string) => ({ apikey: key, "content-type": "application/json", "user-agent": UPSTREAM_USER_AGENT });

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-ondemand-key")?.trim() || serverApiKey();
  if (!key) return Response.json({ ok: false, code: "no_key", message: "ONDEMAND_API_KEY is not configured on the server" }, { status: 503 });
  const wf = WF(); if (!wf) return Response.json({ ok: false, code: "no_workflow", message: "VOICE_WORKFLOW_ID is not configured" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { transcript?: string; pluginIds?: unknown; threadId?: string; sessionId?: string };
  const transcript = String(body.transcript ?? "").trim().slice(0, 4000);
  const { pluginIds } = resolvePluginIds(body.pluginIds, transcript); // per-turn selection, same allow-list + order as /api/chat
  const r = await fetch(`${AUTO}/workflow/${wf}/execute`, { method: "POST", headers: hdrs(key), body: JSON.stringify({ payload: { transcript, pluginIds, threadId: body.threadId ?? null, sessionId: body.sessionId ?? null, surface: "chat-voice-mode" } }), cache: "no-store" });
  const j = (await r.json().catch(() => ({}))) as { executionID?: string; message?: string };
  if (!r.ok || !j.executionID) return Response.json({ ok: false, code: "upstream", status: r.status, message: j.message ?? `execute answered HTTP ${r.status}` }, { status: r.status === 401 || r.status === 403 ? r.status : 502 });
  return Response.json({ ok: true, executionId: j.executionID, workflowId: wf, pluginIds });
}

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-ondemand-key")?.trim() || serverApiKey();
  const id = (req.nextUrl.searchParams.get("executionId") ?? "").trim();
  if (!/^[a-f0-9]{24}$/i.test(id)) return Response.json({ ok: false, code: "bad_request", message: "executionId is required" }, { status: 400 });
  if (!key) return Response.json({ ok: false, code: "no_key", message: "ONDEMAND_API_KEY is not configured on the server" }, { status: 503 });
  const enc = new TextEncoder(); const f = (o: unknown) => enc.encode(`data: ${JSON.stringify(o)}\n\n`);
  const stream = new ReadableStream<Uint8Array>({
    async start(c) {
      const seen = new Set<string>(); const t0 = Date.now(); let status = "";
      while (Date.now() - t0 < 60_000 && !req.signal.aborted) {
        try {
          const [ex, lg] = await Promise.all([
            fetch(`${AUTO}/execution/${id}`, { headers: hdrs(key), cache: "no-store" }).then((r) => r.json()).catch(() => null) as Promise<{ data?: { status?: string } } | null>,
            fetch(`${AUTO}/execution/${id}/logs`, { headers: hdrs(key), cache: "no-store" }).then((r) => r.json()).catch(() => null) as Promise<{ data?: { timestamp?: number; message?: string; status?: string; nodeKey?: string }[] } | null>,
          ]);
          for (const l of lg?.data ?? []) { const k = `${l.timestamp}|${l.message}`; if (!seen.has(k)) { seen.add(k); c.enqueue(f({ type: "log", at: l.timestamp, message: l.message, status: l.status, node: l.nodeKey || null })); } }
          const s = ex?.data?.status ?? ""; if (s && s !== status) { status = s; c.enqueue(f({ type: "status", status })); }
          if (/success|failed|ended|cancel/i.test(status)) {
            const tr = (await fetch(`${AUTO}/execution/${id}/transcript`, { headers: hdrs(key), cache: "no-store" }).then((r) => r.json()).catch(() => null)) as { data?: unknown } | null;
            c.enqueue(f({ type: "transcript", data: tr?.data ?? null })); break;
          }
        } catch { /* transient — keep polling */ }
        await new Promise((r) => setTimeout(r, 1500));
      }
      c.enqueue(f({ type: "done", status, ms: Date.now() - t0 })); c.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", "x-accel-buffering": "no" } });
}
