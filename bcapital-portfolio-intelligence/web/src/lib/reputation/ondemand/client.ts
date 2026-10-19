/**
 * Browser client for the workbench's own `/api/ondemand` proxy (the key never reaches the browser).
 *
 * One chat session per investigation is created lazily and cached in localStorage (`ondemand:session:<INV>`); the proxy
 * creates it when no `sessionId` is sent and returns it in the `x-ondemand-session-id` header / JSON `sessionId`.
 * `ask()` streams the answer (SSE passthrough) and reports progress; any non-2xx becomes an `OndemandHttpError` carrying
 * the HTTP status and the upstream body so the UI can show "HTTP 403 …" instead of failing silently.
 */
import { AnswerAssembler, iterateSse, type SseEvent } from './sse';
// Port note (B Capital): the Rilian Settings-drawer key opt-in (./live browserKeyForRequests) is not ported — the server env key is always used.
const browserKeyForRequests = (): string => '';
import { DEFAULT_ASK_TIMEOUT_MS, askTimeoutMs, chatModelSpec, fallbackModelFor, reasoningModeFor, stripThinking } from './chatModels';

/** v4.8 — any live, non-denylisted registry id (the dropdown in the chat-panel header decides; the proxy re-validates). */
export type OndemandModel = string;

export class OndemandHttpError extends Error {
  status: number;
  upstream: unknown;
  /** v5.2 (fix E): the upstream Retry-After header, when the proxy forwarded one. */
  retryAfter: string | null;
  /** FIX DEF-025 — the response body VERBATIM (raw text, e.g. the 503 `no_api_key` JSON) so the transcript can show it unaltered. */
  bodyText: string | null;
  constructor(status: number, message: string, upstream?: unknown, retryAfter: string | null = null, bodyText: string | null = null) {
    super(message);
    this.name = 'OndemandHttpError';
    this.status = status;
    this.retryAfter = retryAfter;
    this.upstream = upstream;
    this.bodyText = bodyText;
  }
}

export interface AskRequest {
  /** v4.7: edge / node metadata attached to the session (contextMetadata) — WHY CONNECTED goes through the live-session path. */
  contextMetadata?: Array<{ key: string; value: string }>;
  investigationId: string;
  endpointId: OndemandModel;
  query: string;
  fulfillmentPrompt?: string;
  temperature?: number;
  /** Force a fresh session instead of the cached per-investigation one (Run correlation uses one session per run). */
  freshSession?: boolean;
  signal?: AbortSignal;
  /** v5.1.0 — one-shot fallback model. Default: `fallbackModelFor(endpointId)` (anything → Claude Fable 5.1; Fable → DeepSeek V4.1); `null` disables it. */
  fallbackEndpointId?: string | null;
  /** v5.1.0 — per-attempt wall clock before the attempt counts as a timeout (default `askTimeoutMs()`: 45 000 ms, configurable in Settings). */
  timeoutMs?: number;
  /** v5.1.0 (DEF-046) — plugin / agent ids forwarded verbatim by the proxy (RAG + plugin execution on when non-empty). */
  pluginIds?: string[];
  /** v5.1.0 — guide-only `reasoningMode`; `undefined` = derive from the model table (`reasoningModeFor`), `null` = never send. */
  reasoningMode?: string | null;
  /** v5.1.0 — explicit RAG switch; omitted → the proxy picks false-with-plugins / true-without. */
  fulfillmentOnly?: boolean;
  /** v5.1.0 — extra allow-listed modelConfigs (stopSequences, topP, …) forwarded verbatim. */
  modelConfigs?: Record<string, unknown>;
  /** v5.1.0 — where the OnDemand session id for this conversation lives (default: localStorage `ondemand:session:<INV>`; the Analyst Chat passes a per-thread sessionStorage store). */
  sessionStore?: SessionStore;
  /** v5.1.0 — strip <think>…</think>-style blocks from the answer (default: the model table's `stripThinking`, true for every chat model). */
  stripThinking?: boolean;
  /** Called once when the primary attempt failed and the fallback attempt is about to start. */
  onFallback?: (info: { from: string; to: string; reason: string }) => void;
  onEvent?: (ev: SseEvent) => void;
  onChunk?: (text: string, answerSoFar: string) => void;
  onStatus?: (statusMessage: string) => void;
}

export interface AskResult {
  answer: string;
  sessionId: string | null;
  messageId: string | null;
  metrics: Record<string, number> | null;
  elapsedMs: number;
  httpStatus: number;
  endpointId: OndemandModel;
  chunks: number;
  /** v5.0.1 (A) — set when the answer came from the fallback model: the endpointId that failed first + why. */
  fallbackFrom: string | null;
  fallbackReason: string | null;
}

export const ASK_TIMEOUT_MS = DEFAULT_ASK_TIMEOUT_MS;
/** v5.1.0 — pluggable session persistence (one OnDemand session per conversation). */
export interface SessionStore {
  get(): string | null;
  set(sessionId: string | null): void;
}
/** Upstream / SSE error texts that mean "this model cannot answer" → worth one retry on the fallback model. */
const MODEL_UNAVAILABLE_RX = /model[^.]{0,40}(unavailable|not available|not found|unknown|disabled|deprecated)|unknown (endpoint|model)|endpoint[^.]{0,40}(not found|unavailable|invalid|unknown)|no such model/i;
export class AskTimeoutError extends Error {
  ms: number;
  constructor(ms: number) {
    super(`no answer within ${ms} ms`);
    this.name = 'AskTimeoutError';
    this.ms = ms;
  }
}
/**
 * v5.0.1 (A) — should a failed PRIMARY attempt be retried once on the fallback model?
 *  yes: proxy / upstream 4xx or 5xx, a timeout, an SSE `error` event or a stream error that reads as model-unavailable / unknown endpoint
 *  no : the caller aborted; `503 no_api_key` (no model can answer without a key — retrying only doubles the noise)
 */
export function shouldFallback(err: unknown, userAborted: boolean): { retry: boolean; reason: string } {
  if (userAborted) return { retry: false, reason: 'cancelled' };
  if (err instanceof AskTimeoutError) return { retry: true, reason: `timeout ${err.ms} ms` };
  if (err instanceof OndemandHttpError) {
    const code = (err.upstream as { code?: string } | null)?.code;
    if (err.status === 503 && (code === 'no_api_key' || /no OnDemand API key/i.test(err.message))) return { retry: false, reason: 'no_api_key' };
    if (err.status >= 400 && err.status <= 599) return { retry: true, reason: `HTTP ${err.status}` };
    return { retry: false, reason: `HTTP ${err.status}` };
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (MODEL_UNAVAILABLE_RX.test(msg)) return { retry: true, reason: 'model unavailable' };
  return { retry: false, reason: msg.slice(0, 80) };
}

const PROXY_URL = '/api/reputation/ondemand';
const sessionKey = (inv: string): string => `ondemand:session:${inv}`;

/** The default store: one session per investigation in localStorage (`ondemand:session:<INV>`). */
export function investigationSessionStore(investigationId: string): SessionStore {
  return {
    get: () => {
      try {
        return globalThis.localStorage?.getItem(sessionKey(investigationId)) ?? null;
      } catch {
        return null;
      }
    },
    set: (sessionId) => {
      try {
        if (sessionId) globalThis.localStorage?.setItem(sessionKey(investigationId), sessionId);
        else globalThis.localStorage?.removeItem(sessionKey(investigationId));
      } catch {
        /* storage unavailable */
      }
    },
  };
}
/** v5.1.0 — a store backed by `sessionStorage` under an arbitrary key (Analyst Chat: `analystChat.session.<invId>.<threadId>`). */
export function keyedSessionStore(key: string, storage: () => Storage | null | undefined = () => globalThis.sessionStorage): SessionStore {
  return {
    get: () => {
      try {
        return storage()?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    set: (sessionId) => {
      try {
        if (sessionId) storage()?.setItem(key, sessionId);
        else storage()?.removeItem(key);
      } catch {
        /* storage unavailable */
      }
    },
  };
}

/** Human-readable HTTP failure ("HTTP 403 — OnDemand returned HTTP 403: plan does not include this model"). */
export function describeHttpError(err: unknown): string {
  if (err instanceof OndemandHttpError) {
    const up = err.upstream as { message?: string; errorCode?: string; error?: string } | string | undefined;
    const detail = typeof up === 'string' ? up.slice(0, 160) : up ? [up.errorCode, up.message ?? up.error].filter(Boolean).join(' · ') : '';
    return `HTTP ${err.status} — ${err.message}${detail ? ` (${detail})` : ''}`;
  }
  if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
  return err instanceof Error ? err.message : String(err);
}

async function parseErrorResponse(r: Response): Promise<OndemandHttpError> {
  const text = await r.text().catch(() => '');
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* text */
  }
  const b = body as { error?: string; upstream?: unknown } | string;
  const msg = typeof b === 'object' && b && b.error ? b.error : `proxy returned HTTP ${r.status}`;
  return new OndemandHttpError(r.status, msg, typeof b === 'object' && b ? (b.upstream ?? b) : b, r.headers.get('retry-after'), text);
}

/** FIX DEF-025 — `{ status, body }` for the transcript: the HTTP status and the raw body text of a failed send (null for non-HTTP errors). */
export function httpErrorDetail(err: unknown): { status: number; body: string | null } | null {
  return err instanceof OndemandHttpError ? { status: err.status, body: err.bodyText } : null;
}

/** ONE attempt (no fallback): streamed question → assembled answer. Throws OndemandHttpError on any non-2xx (proxy or upstream), AskTimeoutError after `timeoutMs`. */
export async function askOnce(req: AskRequest, fetchImpl: typeof fetch = fetch): Promise<AskResult> {
  const t0 = performance.now();
  const store = req.sessionStore ?? investigationSessionStore(req.investigationId);
  const sessionId = req.freshSession ? null : store.get();
  // v5.0.1 (A) — a per-attempt timeout that is distinguishable from the caller's own abort
  const ctrl = new AbortController();
  let timedOut = false;
  const timeoutMs = req.timeoutMs ?? askTimeoutMs();
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, timeoutMs);
  const onUserAbort = (): void => ctrl.abort();
  if (req.signal?.aborted) ctrl.abort();
  else req.signal?.addEventListener('abort', onUserAbort, { once: true });
  try {
    return await askAttempt(req, fetchImpl, sessionId, ctrl.signal, t0, store);
  } catch (err) {
    if (timedOut) throw new AskTimeoutError(timeoutMs);
    throw err;
  } finally {
    clearTimeout(timer);
    req.signal?.removeEventListener('abort', onUserAbort);
  }
}

/**
 * v5.1.0 — `ask()` = the primary attempt on `req.endpointId`, then EXACTLY ONE retry of the same query on the fallback model
 * (default: anything → Claude Fable 5.1, Fable → DeepSeek V4.1 — `fallbackModelFor`) when the primary answered 4xx/5xx, timed out,
 * or reported the model unavailable (`shouldFallback`). The result says so in `fallbackFrom` / `fallbackReason` (meta line only —
 * never body text). A caller abort never triggers the fallback; a `503 no_api_key` is not retried either. The fallback attempt
 * re-derives `reasoningMode` for ITS model from the table (a Qwen 'low' never travels to Fable).
 */
export async function ask(req: AskRequest, fetchImpl: typeof fetch = fetch): Promise<AskResult> {
  const fallbackId = req.fallbackEndpointId === undefined ? fallbackModelFor(req.endpointId) : req.fallbackEndpointId;
  try {
    return await askOnce(req, fetchImpl);
  } catch (err) {
    const verdict = shouldFallback(err, Boolean(req.signal?.aborted));
    if (!fallbackId || fallbackId === req.endpointId || !verdict.retry) throw err;
    req.onFallback?.({ from: req.endpointId, to: fallbackId, reason: verdict.reason });
    const second = await askOnce({ ...req, endpointId: fallbackId, fallbackEndpointId: null, reasoningMode: undefined }, fetchImpl);
    return { ...second, fallbackFrom: req.endpointId, fallbackReason: verdict.reason };
  }
}

/** The exact `POST /api/ondemand` body for one attempt — exported so the prompt inspector shows what really left the browser. */
export function askPayload(req: Pick<AskRequest, 'investigationId' | 'endpointId' | 'query' | 'fulfillmentPrompt' | 'temperature' | 'contextMetadata' | 'pluginIds' | 'reasoningMode' | 'fulfillmentOnly' | 'modelConfigs'>, sessionId: string | null): Record<string, unknown> {
  const reasoningMode = req.reasoningMode === undefined ? reasoningModeFor(req.endpointId) : req.reasoningMode;
  return {
    action: 'query',
    sessionId,
    externalUserId: req.investigationId,
    endpointId: req.endpointId,
    query: req.query,
    fulfillmentPrompt: req.fulfillmentPrompt ?? null,
    temperature: req.temperature ?? 0.2,
    responseMode: 'stream',
    contextMetadata: req.contextMetadata ?? null,
    ...(req.pluginIds && req.pluginIds.length ? { pluginIds: req.pluginIds.slice(0, 20) } : {}),
    ...(reasoningMode ? { reasoningMode } : {}),
    ...(typeof req.fulfillmentOnly === 'boolean' ? { fulfillmentOnly: req.fulfillmentOnly } : {}),
    ...(req.modelConfigs && Object.keys(req.modelConfigs).length ? { modelConfigs: req.modelConfigs } : {}),
  };
}

async function askAttempt(req: AskRequest, fetchImpl: typeof fetch, sessionId: string | null, signal: AbortSignal, t0: number, store: SessionStore): Promise<AskResult> {
  const payload = askPayload(req, sessionId);
  const strip = req.stripThinking ?? chatModelSpec(req.endpointId)?.stripThinking ?? true;
  const clean = (text: string): string => (strip ? stripThinking(text) : text);
  // FIX DEF-026 — the browser-stored key is attached ONLY with the explicit opt-in (Settings → browserKeyOptIn); otherwise the
  // server env key decides and a missing one is a visible 503 `no_api_key`, never a silent header fallback.
  const browserKey = browserKeyForRequests();
  const r = await fetchImpl(PROXY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...(browserKey ? { 'x-ondemand-key': browserKey } : {}) }, body: JSON.stringify(payload), signal });
  if (!r.ok) {
    const err = await parseErrorResponse(r);
    // a stale cached session is the one recoverable client error: forget it so the next ask creates a new one
    if ((r.status === 404 || r.status === 400) && sessionId) store.set(null);
    throw err;
  }
  const returnedSession = r.headers.get('x-ondemand-session-id') ?? sessionId;
  if (returnedSession && !req.freshSession) store.set(returnedSession);
  if (!r.body) throw new OndemandHttpError(502, 'empty response body from proxy');
  const assembler = new AnswerAssembler();
  let messageId: string | null = null;
  let metrics: Record<string, number> | null = null;
  for await (const ev of iterateSse(r.body)) {
    req.onEvent?.(ev);
    if (ev.kind === 'chunk') {
      assembler.add(ev);
      messageId = ev.messageId ?? messageId;
      req.onChunk?.(ev.answer, clean(assembler.text));
    } else if (ev.kind === 'status') req.onStatus?.(ev.statusMessage);
    else if (ev.kind === 'metrics') metrics = ev.publicMetrics;
    else if (ev.kind === 'error') throw new OndemandHttpError(502, `stream error: ${ev.message}`, { errorCode: ev.errorCode, message: ev.message });
  }
  return { answer: clean(assembler.text), sessionId: returnedSession, messageId, metrics, elapsedMs: Math.round(performance.now() - t0), httpStatus: r.status, endpointId: req.endpointId, chunks: assembler.count, fallbackFrom: null, fallbackReason: null };
}
