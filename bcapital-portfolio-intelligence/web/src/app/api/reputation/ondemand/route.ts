import { NextRequest } from 'next/server';
import { createSession, healthBody, isoNow, noKeyBody, upstreamQueryBody, validateBody, KEY_HEADER, type ProxyEnv } from '@/lib/reputation/ondemand/proxy-core';
import { serverApiKey, UPSTREAM_USER_AGENT } from '@/lib/ondemand/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Reputation & Prestige quick-chat proxy — the Next.js Route Handler transport over the Rilian proxy core (proxy-core.ts, verbatim).
 *
 *   Browser → POST /api/reputation/ondemand  { action:'createSession' | 'query', sessionId?, externalUserId, endpointId, query,
 *             fulfillmentPrompt?, temperature?, responseMode, contextMetadata?, pluginIds?, reasoningMode?, fulfillmentOnly?, modelConfigs? }
 *   Server  → POST https://api.on-demand.io/chat/v1/sessions  then  POST /chat/v1/sessions/{id}/query (SSE passthrough)
 *
 * The apikey comes from the server env (ONDEMAND_API_KEY) or the opt-in `x-ondemand-key` header — never from the client bundle, never logged.
 */
const ONDEMAND_BASE = 'https://api.on-demand.io';
const env = (req: NextRequest): ProxyEnv => ({ apiKey: req.headers.get(KEY_HEADER)?.trim() || serverApiKey() || null, log: (line) => console.info(line) });
const json = (status: number, body: unknown, headers: Record<string, string> = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

export async function GET(req: NextRequest) {
  return json(200, healthBody(env(req)));
}

export async function POST(req: NextRequest) {
  const e = env(req);
  if (!e.apiKey) return json(503, noKeyBody());
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { error: 'invalid JSON', status: 400 });
  }
  const v = validateBody(raw);
  if ('err' in v) return json(v.err.status, { error: v.err.error, status: v.err.status });
  const body = v.body;
  if (body.action === 'createSession') {
    const s = await createSession(body.externalUserId, e, { contextMetadata: body.contextMetadata });
    if (!s.sessionId) return json(s.status >= 400 ? s.status : 502, { error: 'createSession failed upstream', status: s.status, upstream: s.upstream });
    return json(200, { sessionId: s.sessionId, status: s.status });
  }
  /* ---------------- query (mirrors server/ondemand.ts handleOndemand) */
  let sessionId = body.sessionId;
  let created = false;
  if (!sessionId) {
    const s = await createSession(body.externalUserId as string, e, { contextMetadata: body.contextMetadata, pluginIds: body.pluginIds });
    if (!s.sessionId) return json(s.status >= 400 ? s.status : 502, { error: 'createSession failed upstream', status: s.status, upstream: s.upstream });
    sessionId = s.sessionId;
    created = true;
  }
  const t0 = Date.now();
  const upstreamBody = upstreamQueryBody({ ...body, sessionId });
  const r = await fetch(`${ONDEMAND_BASE}/chat/v1/sessions/${encodeURIComponent(sessionId)}/query`, {
    method: 'POST',
    headers: { apikey: e.apiKey, 'Content-Type': 'application/json', 'user-agent': UPSTREAM_USER_AGENT, Accept: body.responseMode === 'stream' ? 'text/event-stream' : 'application/json' },
    body: JSON.stringify(upstreamBody),
    signal: req.signal,
  });
  const audit = (extra: Record<string, unknown>): void =>
    console.info(`[ondemand-audit] ${JSON.stringify({ ts: isoNow(), endpoint: `POST /chat/v1/sessions/${sessionId}/query`, model: body.endpointId, responseMode: body.responseMode, pluginIds: (upstreamBody.pluginIds as string[]).length, fulfillmentOnly: upstreamBody.fulfillmentOnly, reasoningMode: body.reasoningMode ?? null, status: r.status, latency_ms: Date.now() - t0, sessionId, sessionCreatedHere: created, apikey: '<masked>', ...extra })}`);
  if (!r.ok) {
    const text = await r.text();
    let upstream: unknown = text;
    try { upstream = JSON.parse(text); } catch { /* text */ }
    audit({ error: typeof upstream === 'object' ? upstream : String(text).slice(0, 200) });
    return json(r.status, { error: `OnDemand returned HTTP ${r.status}`, status: r.status, upstream, sessionId }, { 'x-ondemand-session-id': sessionId });
  }
  if (body.responseMode !== 'stream' || !r.body) {
    const text = await r.text();
    let parsed: unknown = text;
    try { parsed = JSON.parse(text); } catch { /* text */ }
    audit({ answerChars: typeof parsed === 'object' && parsed ? String((parsed as { data?: { answer?: string } }).data?.answer ?? '').length : text.length });
    const payload = typeof parsed === 'object' && parsed ? { ...(parsed as Record<string, unknown>), sessionId } : { raw: text, sessionId };
    return json(200, payload, { 'x-ondemand-session-id': sessionId });
  }
  /* ---------------- SSE passthrough (same frames, same leading `: session` comment) */
  const upstreamReader = r.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let tail = '';
  let tokens: unknown = null;
  let answerChars = 0;
  let frames = 0;
  const sid = sessionId;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`: session ${sid}\n\n`));
    },
    async pull(controller) {
      try {
        const { value, done } = await upstreamReader.read();
        if (done) {
          audit({ tokens, answerChars, frames });
          controller.close();
          return;
        }
        controller.enqueue(value);
        const chunk = decoder.decode(value, { stream: true });
        tail += chunk;
        let idx: number;
        while ((idx = tail.indexOf('\n\n')) >= 0) {
          const frame = tail.slice(0, idx);
          tail = tail.slice(idx + 2);
          frames++;
          const data = frame.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('\n');
          if (!data || data === '[DONE]' || data.startsWith('[ERROR]:')) continue;
          try {
            const d = JSON.parse(data) as { eventType?: string; answer?: string; publicMetrics?: unknown };
            if (d.eventType === 'fulfillment') answerChars += (d.answer ?? '').length;
            else if (d.eventType === 'metricsLog') tokens = d.publicMetrics ?? null;
          } catch { /* partial / non-JSON frame */ }
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`event:message\ndata:[ERROR]:${JSON.stringify({ message: (err as Error).message, errorCode: 'proxy_stream_error' })}\n\n`));
        audit({ tokens, answerChars, frames, error: (err as Error).message });
        controller.close();
      }
    },
    cancel() {
      void upstreamReader.cancel().catch(() => undefined);
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no', 'x-ondemand-session-id': sid },
  });
}
