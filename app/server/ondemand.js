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
      // Surface upstream error statuses loudly instead of silently stalling.
      if (/error|failed/i.test(evt.currentStatusLog.statusType || '')) {
        const msg = evt.currentStatusLog.statusMessage || evt.currentStatusLog.statusType;
        console.error(`🔴 [HARD-FAIL] OnDemand statusLog error frame: ${msg}`);
        const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        err.errorCode = 'UPSTREAM_STATUS_ERROR';
        throw err;
      }
    } else if (et === 'metricsLog' && evt.publicMetrics) {
      onEvent('metrics', evt.publicMetrics);
    } else if (et === 'error' || evt.error) {
      // Explicit upstream error frame (previously IGNORED → silent stream stop).
      const inner = evt.error !== undefined ? evt.error : evt;
      const msg = typeof inner === 'string' ? inner : (inner?.message || JSON.stringify(inner).slice(0, 300));
      console.error(`🔴 [HARD-FAIL] OnDemand upstream error frame: ${msg}`);
      const err = new Error(msg);
      err.errorCode = 'UPSTREAM_ERROR_FRAME';
      throw err;
    }
    return null;
  };

  // Inactivity watchdog: if NO bytes arrive for WATCHDOG_MS the upstream is
  // considered wedged (proxy half-close) — abort with a structured error rather
  // than hanging forever. OnDemand emits keep-alives, so a healthy stream never trips this.
  const WATCHDOG_MS = 90000;
  let watchdog;
  const armWatchdog = (reject) => {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => {
      const err = new Error(`No stream activity for ${WATCHDOG_MS / 1000}s — upstream stalled`);
      err.errorCode = 'STREAM_STALLED';
      reject(err);
    }, WATCHDOG_MS);
  };

  try {
    while (true) {
      const { done, value } = await Promise.race([
        reader.read(),
        new Promise((_, reject) => armWatchdog(reject)),
      ]);
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      // SSE frames are separated by blank lines; data lines start with "data:"
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).replace(/\r$/, '');
        buf = buf.slice(idx + 1);
        if (line.startsWith('data:')) {
          const res = handleData(line.slice(5).trim());
          if (res === 'done') { clearTimeout(watchdog); onEvent('done', { fullAnswer }); return fullAnswer; }
        }
      }
    }
    // FLUSH the final unterminated line (previously dropped at chunk boundary).
    buf += decoder.decode();
    const tail = buf.replace(/\r$/, '').trim();
    if (tail.startsWith('data:')) handleData(tail.slice(5).trim());
  } catch (e) {
    clearTimeout(watchdog);
    // attach partial output so the caller can persist what streamed before the drop
    e.partialAnswer = fullAnswer;
    if (!e.errorCode) e.errorCode = 'STREAM_TRANSPORT';
    try { reader.cancel().catch(() => {}); } catch { /* already closed */ }
    throw e;
  }
  clearTimeout(watchdog);
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
