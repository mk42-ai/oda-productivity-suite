import { NextRequest } from "next/server";
import { getText as attachmentText } from "@/lib/media/store";
import { ONDEMAND_BASE_URL, serverApiKey, UPSTREAM_USER_AGENT, CHAT_SESSION_HEADER_WAIT_MS, PAYLOAD_AUDIT } from "@/lib/ondemand/config";
import { runChatBridge, SSE_HEADERS, type AttachmentText, type BridgeBody } from "@/lib/ondemand/chat-bridge";
import { buildFixtureStream } from "@/lib/ondemand/chat-fixtures";
import { DISABLED_PLUGIN_IDS } from "@/lib/ondemand/config-public";
import { persistChatArtifact } from "@/lib/artifacts/chat";
import { originFrom } from "@/lib/artifacts/media";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * PROXY transport for the chat query. By default the browser now runs the OnDemand query itself (lib/ondemand/browser-chat.ts); this route runs
 * the SAME bridge (lib/ondemand/chat-bridge.ts — event schema documented there) server-side and is used when NEXT_PUBLIC_CHAT_TRANSPORT=proxy,
 * when the browser has no OnDemand key, or when NEXT_PUBLIC_CHAT_API_URL points the shell at a mock.
 *
 *   Browser → POST /api/chat { threadId, messages[], context{ sessionId?, externalUserId?, systemContext?, sessionContext? } }
 *   Server  → HTTP 200 text/event-stream immediately, then one AG-UI frame per upstream event.
 *
 * Headers: text/event-stream; no-cache, no-transform; keep-alive; x-accel-buffering: no; content-encoding: identity; x-ondemand-session (when known).
 * The apikey is read from the server env (or an `x-ondemand-key` override header) and is never logged.
 * Audit: PAYLOAD_AUDIT (default on) appends {request (key redacted), first 10 raw upstream events, timings} per turn to <cwd>/proof/chat-payload-audit.json.
 */
/** Append-only, redacted payload audit (never the apikey; sessionId kept — it is not a secret). Best-effort; failures are swallowed. */
async function appendAudit(entry: Record<string, unknown>) {
  if (!PAYLOAD_AUDIT) return;
  try {
    const [fs, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
    const dir = path.join(process.cwd(), "proof"); await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, "chat-payload-audit.json");
    let arr: unknown[] = [];
    try { arr = JSON.parse(await fs.readFile(file, "utf8")) as unknown[]; if (!Array.isArray(arr)) arr = []; } catch { arr = []; }
    arr.push(entry); if (arr.length > 40) arr = arr.slice(-40);
    await fs.writeFile(file, JSON.stringify(arr, null, 2));
  } catch { /* audit only */ }
}

/** pass-2 — ONDEMAND SETTINGS overrides arrive as request headers. They are validated + echoed back (x-ondemand-overrides) and the
 *  external user id is applied to the session; endpointId / pluginIds stay staged (the bridge keeps its fixed-model + pinned-plugin
 *  contract — see resolvePluginIds). The plugin list is sanitised the same way the drawer does it: DISABLED_PLUGIN_IDS removed, max 20. */
function readOverrides(req: NextRequest) {
  const endpointId = (req.headers.get("x-ondemand-endpoint-id") ?? "").trim().slice(0, 80) || null;
  const rawIds = (req.headers.get("x-ondemand-plugin-ids") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const pluginIds = [...new Set(rawIds.filter((id) => !DISABLED_PLUGIN_IDS.has(id)))].slice(0, 20);
  const externalUserId = (req.headers.get("x-ondemand-external-user-id") ?? "").trim().slice(0, 64) || null;
  return { endpointId, pluginIds, droppedPluginIds: rawIds.length - pluginIds.length, externalUserId, clientKey: !!req.headers.get("x-ondemand-key")?.trim() };
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-ondemand-key")?.trim() || serverApiKey();
  const ov = readOverrides(req);
  let body: BridgeBody = {};
  try { body = await req.json(); } catch { return Response.json({ error: { message: "expected JSON body" } }, { status: 400 }); }
  if (ov.externalUserId && body.context && typeof body.context === "object" && !body.context.externalUserId) body.context.externalUserId = ov.externalUserId;
  const echo = { "x-ondemand-overrides": JSON.stringify({ endpointId: ov.endpointId, pluginIds: ov.pluginIds.length, dropped: ov.droppedPluginIds, externalUserId: ov.externalUserId, keySource: ov.clientKey ? "client" : "server-env" }) };
  const fixtureMode = req.headers.get("x-chat-fixture")?.trim() || (typeof body.context?.fixture === "string" ? body.context.fixture.trim() : "");
  if (fixtureMode) {
    const fxDelay = Number(req.headers.get("x-chat-fixture-delay") ?? (body.context as { fixtureDelayMs?: unknown } | undefined)?.fixtureDelayMs ?? 0);
    const fx = buildFixtureStream(fixtureMode, Number.isFinite(fxDelay) ? fxDelay : 0);
    if (fx) { for (const [k, v] of Object.entries(echo)) fx.headers.set(k, v); return fx; }
  }
  const origin = originFrom(req);
  const r = await runChatBridge(body, {
    baseUrl: ONDEMAND_BASE_URL, key, headers: { "user-agent": UPSTREAM_USER_AGENT }, transport: "/api/chat", signal: req.signal,
    sessionHeaderWaitMs: CHAT_SESSION_HEADER_WAIT_MS,
    attachmentText: async (refs) => new Map(refs.map((a): [string, AttachmentText] => { const t = attachmentText(a.mediaId); return [a.mediaId, t ? { name: t.name, kind: t.kind, text: t.text } : null]; })),
    persistArtifact: (job, ctx) => persistChatArtifact(job, { ...ctx, origin, key }),
    audit: (entry) => { void appendAudit(entry); },
  });
  if (!r.ok) return Response.json({ error: { message: r.message } }, { status: r.status });
  return new Response(r.stream, { status: 200, headers: { ...SSE_HEADERS(r.sessionId), ...echo } });
}
