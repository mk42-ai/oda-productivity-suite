// ondemand.js — OnDemand API client: session create + SSE streaming proxy.
// Verified behaviour (Phase-1 NOTES.md): session create returns 201 with data.id;
// stream frames: eventType "fulfillment" (answer token in .answer) vs
// "fulfillment_thinking" (thinking token in .thinking.delta); terminal data:[DONE].
import { ONDEMAND_API_KEY, ONDEMAND_BASE_URL, ENDPOINT_ID, REASONING_EFFORT } from './env.js';

const H = { apikey: ONDEMAND_API_KEY, 'Content-Type': 'application/json' };

export async function createOdSession(externalUserId, pluginIds = []) {
  const r = await fetch(`${ONDEMAND_BASE_URL}/chat/v1/sessions`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ externalUserId, pluginIds }),
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    console.error(`🔴 [HARD-FAIL] OnDemand session create HTTP ${r.status}: ${body.slice(0, 300)}`);
    throw new Error(`OnDemand session create failed (HTTP ${r.status})`);
  }
  const j = await r.json();
  return j?.data?.id;
}

/**
 * Stream a query. Emits normalized events via onEvent(type, payload):
 *   ('thinking', text) — reasoning token delta
 *   ('answer', text)   — answer token delta
 *   ('status', {statusType,statusMessage})
 *   ('metrics', {...})
 *   ('done', {fullAnswer})
 * EVERY call uses gpt-5.6-sol-medium (ENDPOINT_ID + REASONING_EFFORT) with streaming ON.
 */
export async function streamQuery({ odSessionId, query, pluginIds = [], systemPrompt, onEvent, signal }) {
  const body = {
    query,
    endpointId: ENDPOINT_ID,
    reasoningEffort: REASONING_EFFORT,   // reasoning tokens ON (thinking frames surface when the model emits them)
    responseMode: 'stream',
    pluginIds,
    modelConfigs: systemPrompt ? { fulfillmentPrompt: systemPrompt, temperature: 0.4 } : { temperature: 0.4 },
  };
  const r = await fetch(`${ONDEMAND_BASE_URL}/chat/v1/sessions/${odSessionId}/query`, {
    method: 'POST',
    headers: { ...H, Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  });
  if (!r.ok || !r.body) {
    const t = await r.text().catch(() => '');
    console.error(`🔴 [HARD-FAIL] OnDemand stream HTTP ${r.status} on ${ENDPOINT_ID}+${REASONING_EFFORT}: ${t.slice(0, 400)} — NO silent model fallback; surfacing to caller.`);
    throw new Error(`OnDemand query failed (HTTP ${r.status})`);
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let fullAnswer = '';

  const handleData = (payload) => {
    if (payload === '[DONE]') return 'done';
    let evt;
    try { evt = JSON.parse(payload); } catch { return null; } // ignore unparseable keep-alives
    const et = evt.eventType;
    if (et === 'fulfillment' && typeof evt.answer === 'string') {
      fullAnswer += evt.answer;
      onEvent('answer', evt.answer);
    } else if (et === 'fulfillment_thinking') {
      const delta = evt?.thinking?.delta;
      if (typeof delta === 'string' && delta.length) onEvent('thinking', delta);
    } else if (et === 'statusLog' && evt.currentStatusLog) {
      onEvent('status', {
        statusType: evt.currentStatusLog.statusType,
        statusMessage: evt.currentStatusLog.statusMessage,
      });
      // The fulfillment_completed status carries the full final answer — use it if token deltas were lost.
      if (evt.currentStatusLog.statusType === 'fulfillment_completed' && !fullAnswer && typeof evt.answer === 'string') {
        fullAnswer = evt.answer;
      }
    } else if (et === 'metricsLog' && evt.publicMetrics) {
      onEvent('metrics', evt.publicMetrics);
    }
    return null;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    // SSE frames are separated by blank lines; data lines start with "data:"
    let idx;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).replace(/\r$/, '');
      buf = buf.slice(idx + 1);
      if (line.startsWith('data:')) {
        const res = handleData(line.slice(5).trim());
        if (res === 'done') { onEvent('done', { fullAnswer }); return fullAnswer; }
      }
    }
  }
  onEvent('done', { fullAnswer });
  return fullAnswer;
}

/** Non-streaming helper for internal calls (router classification, title generation). Same model policy. */
export async function syncQuery({ odSessionId, query, systemPrompt, pluginIds = [] }) {
  const r = await fetch(`${ONDEMAND_BASE_URL}/chat/v1/sessions/${odSessionId}/query`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      query,
      endpointId: ENDPOINT_ID,
      reasoningEffort: REASONING_EFFORT,
      responseMode: 'sync',
      pluginIds,
      modelConfigs: systemPrompt ? { fulfillmentPrompt: systemPrompt, temperature: 0.2 } : { temperature: 0.2 },
    }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    console.error(`🔴 [HARD-FAIL] OnDemand sync HTTP ${r.status}: ${t.slice(0, 300)}`);
    throw new Error(`OnDemand sync query failed (HTTP ${r.status})`);
  }
  const j = await r.json();
  return j?.data?.answer || '';
}
