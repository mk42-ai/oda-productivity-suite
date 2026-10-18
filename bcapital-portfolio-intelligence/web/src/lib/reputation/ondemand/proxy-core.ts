/**
 * Reputation quick-chat — OnDemand proxy core, ported VERBATIM from gulf-io-light-workbench/server/ondemand.ts
 * (constants, denylist, validateBody, sanitisers, upstreamQueryBody / upstreamSessionBody, noKeyBody, healthBody, createSession).
 * Only the Node `req/res` transport (readJson / sendJson / handleOndemand / SSE pump) is replaced by the Next.js Route Handler in
 * src/app/api/reputation/ondemand/route.ts. The apikey is read server-side only (ONDEMAND_API_KEY) and never reaches a client bundle.
 */
import 'server-only';
export const KEY_HEADER = 'x-ondemand-key';
const ONDEMAND_BASE = 'https://api.on-demand.io';
/* v4.8 — the model is any live registry id that (a) matches the id shape and (b) is not on the denylist. The denylist mirrors
 * src/lib/ondemand/models.ts (base64-stored so the excluded names never appear as literal strings in the repo). The two ids
 * below are the documented defaults kept for the health endpoint and the tests, not an allowlist. */
const DENYLIST_B64 = ['bHVuYQ==', 'b3B1cy01', 'b3B1cyA1', 'b3B1czU=', 'YXN0cmE='];
export const MODEL_DENYLIST: readonly string[] = DENYLIST_B64.map((x) => Buffer.from(x, 'base64').toString('utf8').toLowerCase());
export const ENDPOINT_ID_PATTERN = /^(predefined|byoi|byom)-[A-Za-z0-9._/-]{1,80}$/;
export function isDeniedModel(id: string): boolean {
  const s = id.toLowerCase();
  return MODEL_DENYLIST.some((tok) => s.includes(tok));
}
export function isAllowedEndpointId(id: unknown): id is string {
  return typeof id === 'string' && ENDPOINT_ID_PATTERN.test(id) && !isDeniedModel(id);
}
/** v5.1.0 — the three chat picker ids (live registry snapshot 2026-09-15T23:48:13Z, src/data/ondemand/endpoints.snapshot.json): DeepSeek V4.1-Flash (default) · Cerebras Qwen 3.8 27B · Claude Fable 5.1 (fallback). Informational (health/GET) — validation is shape + denylist. */
export const ALLOWED_MODELS = ['predefined-deepseek-flash', 'predefined-cerebras-qwen-3.8-27b', 'predefined-claude-fable-5.1'] as const;
/** FIX A3 (2026-09-15) — pluginIds allow-list for the query action. This app's OWN naming (pluginResolution.json /
 * RESOLVED_PLUGINS in src/lib/ondemand/live.ts use `pluginId` strings shaped `plugin-<digits>`) differs from the LIVE
 * submitquery/createchatsession OpenAPI (docs.on-demand.io/reference/submitquery, re-read 2026-09-15), which names the
 * wire field `agentIds` with ids shaped `agent-<digits>` — recorded in docs/ONDEMAND_INTEGRATION_SPEC_v1.md. Both id
 * shapes are accepted here. No Cerebras-backed endpointId is documented on fulfillment-models as of this read (see
 * src/lib/ondemand/models.ts CEREBRAS_CHOICE), so ALLOWED_MODELS is unchanged.
 */
export const PLUGIN_ID_PATTERN = /^(plugin|agent)-\d+$/;
export const MAX_PLUGIN_IDS = 20;
export const MAX_REASONING_MODE_CHARS = 32;
const MAX_QUERY_CHARS = 12_000;
const MAX_PROMPT_CHARS = 6_000;
/** v5.1.0 — modelConfigs keys of the LIVE submitquery OpenAPI (docs/ONDEMAND_INTEGRATION_SPEC_v1.md §2.2); anything else is dropped. */
export const MODEL_CONFIG_KEYS = ['fulfillmentPrompt', 'temperature', 'stopSequences', 'topP', 'presencePenalty', 'frequencyPenalty'] as const;
export type ModelConfigs = Partial<{ fulfillmentPrompt: string; temperature: number; stopSequences: string[]; topP: number; presencePenalty: number; frequencyPenalty: number }>;
const MAX_TEMPERATURE = 1.2;
export const isoNow = (): string => new Date().toISOString();

export interface ProxyEnv {
  apiKey?: string | null;
  /** Injectable fetch (tests). */
  fetchImpl?: typeof fetch;
  /** Injectable clock / logger (tests). */
  now?: () => string;
  log?: (line: string) => void;
}

export interface ContextMetadataEntry {
  key: string;
  value: string;
}
export interface CreateSessionBody {
  action: 'createSession';
  externalUserId: string;
  /** FIX DEF-028 — session contextMetadata (≤ 10 × {key ≤ 64, value ≤ 512} — live cap, v5.0.1); travels on the create-session body only. */
  contextMetadata?: ContextMetadataEntry[];
}
export interface QueryBody {
  action: 'query';
  sessionId?: string | null;
  externalUserId?: string | null;
  endpointId: string;
  query: string;
  fulfillmentPrompt?: string | null;
  temperature?: number | null;
  responseMode?: 'sync' | 'stream';
  /** FIX DEF-028 — used when the proxy has to CREATE the session for this query (never forwarded on the query body). */
  contextMetadata?: ContextMetadataEntry[];
  /** FIX A3 — fulfillment-chat plugin/agent ids (≤ 20, `plugin-\d+` / `agent-\d+`); validated by validateBody. */
  pluginIds?: string[];
  /** FIX A3 — optional reasoning-effort hint documented on Query And Responses Modes (e.g. 'low', 'grok-4-fast'); ≤ 32 chars. */
  reasoningMode?: string | null;
  /** v5.1.0 — explicit RAG switch; when omitted: false with plugins, true without (see upstreamQueryBody). */
  fulfillmentOnly?: boolean | null;
  /** v5.1.0 — allow-listed modelConfigs forwarded verbatim (merged over the fulfillmentPrompt / temperature shorthands). */
  modelConfigs?: ModelConfigs;
}
export type ProxyBody = CreateSessionBody | QueryBody;

interface ValidationError {
  status: number;
  error: string;
}

/* v5.0.1 (E) LIVE FINDING (local preview smoke, 2026-09-16T00:11:58Z): POST /chat/v1/sessions answers HTTP 400
 * `contextMetadata must not exceed 10 characters` for more than 10 entries (the message's "characters" means ENTRIES) — the
 * dataset-scope ASK sent 11+ labels and every send failed at createSession, on the primary AND the fallback model. Cap = 10. */
export const MAX_CONTEXT_METADATA = 10;
export const MAX_METADATA_KEY_CHARS = 64;
export const MAX_METADATA_VALUE_CHARS = 512;
/**
 * FIX DEF-028 — contextMetadata sanitiser: strings only, ≤ 10 entries (live cap), key clipped to 64 chars, value to 512, duplicate /
 * empty keys dropped, everything else (numbers, nested objects, non-arrays) ignored. Pure; exported for the unit tests.
 */
export function sanitizeContextMetadata(raw: unknown): ContextMetadataEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: ContextMetadataEntry[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const { key, value } = item as { key?: unknown; value?: unknown };
    if (typeof key !== 'string' || typeof value !== 'string') continue;
    const k = key.trim().slice(0, MAX_METADATA_KEY_CHARS);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push({ key: k, value: value.slice(0, MAX_METADATA_VALUE_CHARS) });
    if (out.length >= MAX_CONTEXT_METADATA) break;
  }
  return out.length ? out : undefined;
}

/** v5.1.0 — modelConfigs sanitiser: only the documented keys, typed and range-checked; returns undefined when nothing usable is left. */
export function sanitizeModelConfigs(raw: unknown): { ok: true; value: ModelConfigs | undefined } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, value: undefined };
  if (typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'modelConfigs must be an object' };
  const m = raw as Record<string, unknown>;
  const out: ModelConfigs = {};
  if (m.fulfillmentPrompt !== undefined && m.fulfillmentPrompt !== null) {
    if (typeof m.fulfillmentPrompt !== 'string' || m.fulfillmentPrompt.length > MAX_PROMPT_CHARS) return { ok: false, error: `modelConfigs.fulfillmentPrompt exceeds ${MAX_PROMPT_CHARS} chars` };
    out.fulfillmentPrompt = m.fulfillmentPrompt;
  }
  if (m.temperature !== undefined && m.temperature !== null) {
    if (typeof m.temperature !== 'number' || m.temperature < 0 || m.temperature > MAX_TEMPERATURE) return { ok: false, error: `modelConfigs.temperature must be 0…${MAX_TEMPERATURE}` };
    out.temperature = m.temperature;
  }
  if (m.stopSequences !== undefined && m.stopSequences !== null) {
    if (!Array.isArray(m.stopSequences) || m.stopSequences.length > 4 || !m.stopSequences.every((x) => typeof x === 'string' && x.length <= 64)) return { ok: false, error: 'modelConfigs.stopSequences must be ≤ 4 strings' };
    out.stopSequences = m.stopSequences as string[];
  }
  for (const k of ['topP', 'presencePenalty', 'frequencyPenalty'] as const) {
    const v = m[k];
    if (v === undefined || v === null) continue;
    const max = k === 'topP' ? 1 : 2;
    if (typeof v !== 'number' || v < 0 || v > max) return { ok: false, error: `modelConfigs.${k} must be 0…${max}` };
    out[k] = v;
  }
  return { ok: true, value: Object.keys(out).length ? out : undefined };
}

/** Pure request validation — exported for the unit tests. */
export function validateBody(raw: unknown): { ok: true; body: ProxyBody } | { ok: false; err: ValidationError } {
  if (!raw || typeof raw !== 'object') return { ok: false, err: { status: 400, error: 'JSON body required' } };
  const b = raw as Record<string, unknown>;
  if (b.action === 'createSession') {
    if (typeof b.externalUserId !== 'string' || !b.externalUserId.trim() || b.externalUserId.length > 120) return { ok: false, err: { status: 400, error: 'externalUserId (string ≤ 120 chars) required' } };
    const contextMetadata = sanitizeContextMetadata(b.contextMetadata);
    return { ok: true, body: { action: 'createSession', externalUserId: b.externalUserId.trim(), ...(contextMetadata ? { contextMetadata } : {}) } };
  }
  if (b.action === 'query') {
    if (!isAllowedEndpointId(b.endpointId)) return { ok: false, err: { status: 400, error: typeof b.endpointId === 'string' && isDeniedModel(b.endpointId) ? 'endpointId is on the model denylist' : 'endpointId must be a live registry id (predefined-… / byoi-… / byom-…)' } };
    if (typeof b.query !== 'string' || !b.query.trim()) return { ok: false, err: { status: 400, error: 'query (non-empty string) required' } };
    if (b.query.length > MAX_QUERY_CHARS) return { ok: false, err: { status: 413, error: `query exceeds ${MAX_QUERY_CHARS} chars` } };
    if (b.fulfillmentPrompt !== undefined && b.fulfillmentPrompt !== null && (typeof b.fulfillmentPrompt !== 'string' || b.fulfillmentPrompt.length > MAX_PROMPT_CHARS)) return { ok: false, err: { status: 413, error: `fulfillmentPrompt exceeds ${MAX_PROMPT_CHARS} chars` } };
    if (b.temperature !== undefined && b.temperature !== null && (typeof b.temperature !== 'number' || b.temperature < 0 || b.temperature > MAX_TEMPERATURE)) return { ok: false, err: { status: 400, error: `temperature must be 0…${MAX_TEMPERATURE}` } };
    // FIX A3 — pluginIds / reasoningMode allow-list (see PLUGIN_ID_PATTERN comment above for the pluginIds/agentIds naming note)
    if (b.pluginIds !== undefined && (!Array.isArray(b.pluginIds) || b.pluginIds.length > MAX_PLUGIN_IDS || !b.pluginIds.every((x) => typeof x === 'string' && PLUGIN_ID_PATTERN.test(x)))) {
      return { ok: false, err: { status: 400, error: `pluginIds must be an array of \u2264 ${MAX_PLUGIN_IDS} ids matching plugin-\\d+ / agent-\\d+` } };
    }
    if (b.reasoningMode !== undefined && b.reasoningMode !== null && (typeof b.reasoningMode !== 'string' || b.reasoningMode.length > MAX_REASONING_MODE_CHARS)) {
      return { ok: false, err: { status: 400, error: `reasoningMode must be a string \u2264 ${MAX_REASONING_MODE_CHARS} chars` } };
    }
    // v5.1.0 — fulfillmentOnly (boolean) + modelConfigs (allow-listed) pass through verbatim
    if (b.fulfillmentOnly !== undefined && b.fulfillmentOnly !== null && typeof b.fulfillmentOnly !== 'boolean') return { ok: false, err: { status: 400, error: 'fulfillmentOnly must be a boolean' } };
    const mc = sanitizeModelConfigs(b.modelConfigs);
    if (!mc.ok) return { ok: false, err: { status: 400, error: mc.error } };
    const responseMode = b.responseMode === 'stream' ? 'stream' : 'sync';
    const sessionId = typeof b.sessionId === 'string' && b.sessionId.trim() ? b.sessionId.trim() : null;
    const externalUserId = typeof b.externalUserId === 'string' && b.externalUserId.trim() ? b.externalUserId.trim() : null;
    if (!sessionId && !externalUserId) return { ok: false, err: { status: 400, error: 'sessionId or externalUserId required' } };
    if (sessionId && !/^[A-Za-z0-9_-]{6,64}$/.test(sessionId)) return { ok: false, err: { status: 400, error: 'sessionId malformed' } };
    const contextMetadata = sanitizeContextMetadata(b.contextMetadata);
    const pluginIds = Array.isArray(b.pluginIds) ? (b.pluginIds as string[]) : undefined;
    const reasoningMode = typeof b.reasoningMode === 'string' && b.reasoningMode.trim() ? b.reasoningMode.trim() : undefined;
    const fulfillmentOnly = typeof b.fulfillmentOnly === 'boolean' ? b.fulfillmentOnly : undefined;
    return { ok: true, body: { action: 'query', sessionId, externalUserId, endpointId: b.endpointId, query: b.query, fulfillmentPrompt: (b.fulfillmentPrompt as string | null | undefined) ?? null, temperature: (b.temperature as number | null | undefined) ?? null, responseMode, ...(contextMetadata ? { contextMetadata } : {}), ...(pluginIds ? { pluginIds } : {}), ...(reasoningMode ? { reasoningMode } : {}), ...(fulfillmentOnly !== undefined ? { fulfillmentOnly } : {}), ...(mc.value ? { modelConfigs: mc.value } : {}) } };
  }
  return { ok: false, err: { status: 400, error: "action must be 'createSession' or 'query'" } };
}

/**
 * Upstream body for POST /chat/v1/sessions/{id}/query — exported for the tests (documents exactly what leaves the proxy).
 * Field set matches the LIVE spec fetched 2026-09-15 from
 * https://gateway.on-demand.io/config/v1/public/docs/reference/api/submitquery — required: query, endpointId, responseMode
 * (sync|stream|webhook); optional: pluginIds[≤20], fulfillmentOnly (default false), modelConfigs{fulfillmentPrompt, temperature 0…2,
 * stopSequences, topP, presencePenalty, frequencyPenalty}; guide-only: reasoningMode (stream). The spec has NO agentIds and NO
 * contextMetadata on the query body, so neither is sent here (contextMetadata goes on the create-session body, see createSession()).
 *
 * v5.1.0 (DEF-046) — PASSTHROUGH, not policy: `pluginIds` and `reasoningMode` leave exactly as validated; `fulfillmentOnly` is the
 * caller's boolean when given, otherwise FALSE with plugins (RAG + plugin execution — the OpenAPI says fulfillmentOnly:true "will
 * also skip the plugins execution") and TRUE without plugins (legacy Run-composer behaviour). modelConfigs = the top-level
 * fulfillmentPrompt / temperature shorthands, overridden by any explicit allow-listed `modelConfigs` entries.
 */
export function upstreamQueryBody(b: QueryBody): Record<string, unknown> {
  const modelConfigs: Record<string, unknown> = {};
  if (b.fulfillmentPrompt) modelConfigs.fulfillmentPrompt = b.fulfillmentPrompt;
  if (typeof b.temperature === 'number') modelConfigs.temperature = b.temperature;
  if (b.modelConfigs) for (const k of MODEL_CONFIG_KEYS) if (b.modelConfigs[k] !== undefined) modelConfigs[k] = b.modelConfigs[k];
  const pluginIds = Array.isArray(b.pluginIds) ? b.pluginIds.slice(0, MAX_PLUGIN_IDS) : [];
  const fulfillmentOnly = typeof b.fulfillmentOnly === 'boolean' ? b.fulfillmentOnly : pluginIds.length === 0;
  return {
    endpointId: b.endpointId,
    query: b.query,
    responseMode: b.responseMode ?? 'sync',
    fulfillmentOnly,
    pluginIds,
    ...(Object.keys(modelConfigs).length ? { modelConfigs } : {}),
    ...(b.reasoningMode ? { reasoningMode: b.reasoningMode } : {}),
  };
}

/**
 * Upstream body for POST /chat/v1/sessions — exported for the tests. Matches the LIVE spec fetched 2026-09-15 from
 * https://gateway.on-demand.io/config/v1/public/docs/reference/api/createchatsession — required: externalUserId; optional:
 * pluginIds[≤20]. `contextMetadata` is the platform-tooling extension (chat_v1_sessions_create: "array of key-value pairs for
 * session context") — it is NOT in the public OpenAPI, so it is only ever attached here, already sanitised by validateBody.
 */
export function upstreamSessionBody(externalUserId: string, extra: { contextMetadata?: ContextMetadataEntry[]; pluginIds?: string[] } = {}): Record<string, unknown> {
  const body: Record<string, unknown> = { externalUserId, pluginIds: Array.isArray(extra.pluginIds) ? extra.pluginIds.slice(0, 20) : [] };
  const meta = sanitizeContextMetadata(extra.contextMetadata);
  if (meta) body.contextMetadata = meta;
  return body;
}

/** FIX DEF-025/DEF-028 — ONE "no key" answer for every route (was: 503 on the main route, 401 on the passthrough). */
export const NO_KEY_CODE = 'no_api_key';
export const ENV_VAR = 'ONDEMAND_API_KEY';
const HOW_TO = { local: 'app/.env → ONDEMAND_API_KEY=<key> (never commit it)', vercel: 'vercel env add ONDEMAND_API_KEY production  (then redeploy)' } as const;
export function noKeyBody(): { error: string; status: 503; code: typeof NO_KEY_CODE; envVar: typeof ENV_VAR; keyHeader: typeof KEY_HEADER; howTo: { local: string; vercel: string } } {
  return {
    error: `no OnDemand API key: send it in the ${KEY_HEADER} header (Settings drawer) or configure ${ENV_VAR} on the server`,
    status: 503,
    code: NO_KEY_CODE,
    envVar: ENV_VAR,
    keyHeader: KEY_HEADER,
    howTo: HOW_TO,
  };
}

/** FIX DEF-025 — GET /api/ondemand/health payload (pure; never echoes a key). */
export function healthBody(env: ProxyEnv, now: string = isoNow()): Record<string, unknown> {
  const configured = Boolean(env.apiKey && env.apiKey.trim());
  return { ok: true, service: 'ondemand-proxy', configured, keySource: configured ? 'server-env' : null, envVar: ENV_VAR, keyHeader: KEY_HEADER, howTo: HOW_TO, upstream: ONDEMAND_BASE, ts: now };
}
/** `/health` (optionally with a query string) relative to the mount point — works for the vite middleware (url = '/health') and the Vercel catch-all (url = '/api/ondemand/health'). */


export async function createSession(externalUserId: string, env: ProxyEnv, extra: { contextMetadata?: ContextMetadataEntry[]; pluginIds?: string[] } = {}): Promise<{ status: number; sessionId: string | null; upstream: unknown }> {
  const f = env.fetchImpl ?? fetch;
  const t0 = Date.now();
  const created = upstreamSessionBody(externalUserId, extra);
  const r = await f(`${ONDEMAND_BASE}/chat/v1/sessions`, { method: 'POST', headers: { apikey: env.apiKey ?? '', 'Content-Type': 'application/json' }, body: JSON.stringify(created) });
  const text = await r.text();
  let upstream: unknown = text;
  try {
    upstream = JSON.parse(text);
  } catch {
    /* keep text */
  }
  const sessionId = r.ok && upstream && typeof upstream === 'object' ? ((upstream as { data?: { id?: string } }).data?.id ?? null) : null;
  (env.log ?? console.info)(`[ondemand-audit] ${JSON.stringify({ ts: env.now?.() ?? isoNow(), endpoint: 'POST /chat/v1/sessions', model: null, status: r.status, latency_ms: Date.now() - t0, sessionId, externalUserId, apikey: '<masked>' })}`);
  return { status: r.status, sessionId, upstream };
}

