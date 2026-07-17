// api.js — frontend client for the ODA suite backend. SSE parsing for /api/chat.
//
// ERROR CONTRACT (fix for the '[object Object]' failure):
// every error surfaced from this module is a StreamError with a STRUCTURED shape
//   { userMessage: string, errorCode: string, debugDetails: string }
// Nothing here ever passes a non-string into new Error() — that was the exact
// bug: `new Error(body.error)` where body.error was an OBJECT (e.g. a proxy
// timeout JSON `{error:{code,message}}`) stringifies to "[object Object]".

export class StreamError extends Error {
  constructor({ userMessage, errorCode = 'UNKNOWN', debugDetails = '' }) {
    super(userMessage);
    this.name = 'StreamError';
    this.userMessage = userMessage;
    this.errorCode = errorCode;
    this.debugDetails = debugDetails;
  }
}

/** Coerce ANY thrown/parsed value into {userMessage, errorCode, debugDetails}. */
export function normalizeError(raw, fallbackCode = 'UNKNOWN') {
  if (raw instanceof StreamError) return raw;
  // string
  if (typeof raw === 'string') return new StreamError({ userMessage: raw, errorCode: fallbackCode, debugDetails: raw });
  // Error instance
  if (raw instanceof Error) {
    return new StreamError({ userMessage: raw.message || 'Unexpected error', errorCode: raw.errorCode || fallbackCode, debugDetails: raw.stack || String(raw) });
  }
  // object payloads: {error}, {message}, {code}, nested proxy shapes
  if (raw && typeof raw === 'object') {
    const inner = raw.error !== undefined ? raw.error : raw;
    if (typeof inner === 'string') return new StreamError({ userMessage: inner, errorCode: raw.errorCode || raw.code || fallbackCode, debugDetails: safeJson(raw) });
    if (inner && typeof inner === 'object') {
      let msg = inner.userMessage ?? inner.message ?? inner.detail ?? inner.statusMessage;
      let code = inner.errorCode || inner.code || raw.errorCode || raw.code || fallbackCode;
      // message may ITSELF be a nested object (e.g. {message:{code,detail}}) — recurse, never stringify raw
      if (msg && typeof msg === 'object') {
        const nested = normalizeError(msg, code);
        return new StreamError({ userMessage: nested.userMessage, errorCode: nested.errorCode !== 'UNKNOWN' ? nested.errorCode : String(code), debugDetails: safeJson(raw) });
      }
      if (!msg) msg = inner.code || inner.statusText || 'The service returned an error.';
      return new StreamError({ userMessage: String(msg), errorCode: String(code), debugDetails: safeJson(raw) });
    }
  }
  return new StreamError({ userMessage: 'Unexpected error', errorCode: fallbackCode, debugDetails: safeJson(raw) });
}
function safeJson(x) { try { return JSON.stringify(x).slice(0, 2000); } catch { return String(x); } }

async function parseErrorResponse(r, fallbackCode) {
  let body = null;
  try { body = await r.json(); } catch { /* non-JSON body */ }
  const e = normalizeError(body || `HTTP ${r.status}`, fallbackCode);
  if (!body) e.userMessage = `HTTP ${r.status} ${r.statusText || ''}`.trim();
  e.debugDetails = `HTTP ${r.status} · ${e.debugDetails}`;
  return e;
}

export async function jget(url) {
  const r = await fetch(url);
  if (!r.ok) throw await parseErrorResponse(r, 'API_GET_FAILED');
  return r.json();
}
export async function jpost(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw await parseErrorResponse(r, 'API_POST_FAILED');
  return r.json();
}

export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!r.ok) throw await parseErrorResponse(r, 'UPLOAD_FAILED');
  return (await r.json()).file;
}

/**
 * Stream a chat turn. onEvent(type, payload) receives:
 *  routing / status / plugin_status / thinking / answer / metrics / error / done
 * Returns when the stream closes. Throws StreamError on transport-level failure.
 * SSE frames are buffered correctly across chunk boundaries, INCLUDING a final
 * unterminated line flushed when the reader reports done.
 */
export async function streamChat(body, onEvent, signal) {
  let r;
  try {
    r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (netErr) {
    if (netErr?.name === 'AbortError') throw normalizeError(netErr, 'ABORTED');
    throw new StreamError({ userMessage: 'Network error — could not reach the server.', errorCode: 'NETWORK', debugDetails: String(netErr) });
  }
  if (!r.ok || !r.body) throw await parseErrorResponse(r, 'CHAT_HTTP_' + r.status);

  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let sawDone = false;

  const handleLine = (line) => {
    if (!line.startsWith('data:')) return;
    let evt;
    try { evt = JSON.parse(line.slice(5)); } catch { return; } // keep-alives / partial JSON
    if (evt.type === 'done') sawDone = true;
    onEvent(evt.type, evt);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).replace(/\r$/, '');
        buf = buf.slice(idx + 1);
        handleLine(line);
      }
    }
    // FLUSH: final decoder bytes + any last unterminated SSE line
    buf += dec.decode();
    if (buf.trim()) handleLine(buf.trim());
  } catch (readErr) {
    if (readErr?.name === 'AbortError') throw normalizeError(readErr, 'ABORTED');
    // connection dropped mid-stream (proxy idle timeout, upstream termination…)
    throw new StreamError({
      userMessage: 'The connection dropped mid-stream.',
      errorCode: 'STREAM_DROPPED',
      debugDetails: String(readErr),
    });
  }
  return { sawDone };
}
