/**
 * v5.1.0 — ONE model routing table shared by the Analyst Chat and the ASK · OnDemand panel (DEF-048).
 *
 *  • DeepSeek V4.1         `predefined-deepseek-flash`          DEFAULT for Investigations / Analyst Chat (cost: 9.5–11.2 s, 4.8–8.3 k tok per
 *                                                                heavy prompt in the 2026-09-16 live run — docs/live_sessions_2026-09-16).
 *  • Cerebras Qwen 3.8 27B `predefined-cerebras-qwen-3.8-27b`   sent with `reasoningMode: 'low'` (the documented guide value; the registry row
 *                                                                offers reasoning_efforts low|medium|max) AND every <think>/<reasoning> block is
 *                                                                stripped client-side, so NO thinking tokens reach the bubble.
 *  • Claude Fable 5.1      `predefined-claude-fable-5.1`        the FALLBACK: any 4xx / 5xx / timeout on the selected model is retried ONCE here
 *                                                                (client.ts `ask()`); when Fable itself is the selected model the one retry goes
 *                                                                to DeepSeek so the analyst still gets an answer.
 *
 * Every id is checked against the registry catalogue (`src/data/ondemand/endpoints.snapshot.json`, fetched 2026-09-15T23:48:13Z, 81 rows,
 * plus the live rows when the registry was refreshed this session): an id that is NOT in the catalogue is rendered greyed
 * "not on OnDemand" by the selector and is never sent (`isOnCatalogue`). The 45 s per-attempt timeout is configurable
 * (`askTimeoutMs()`, localStorage `gulf-io.chat.askTimeoutMs`). The selection itself persists in localStorage through
 * `useModelRegistry.select()` → `ondemand:live:settings.endpointId`.
 */
import snapshot from '../data/endpoints.snapshot.json';

export const DEEPSEEK_V41_ENDPOINT_ID = 'predefined-deepseek-flash';
export const CEREBRAS_QWEN_38_ENDPOINT_ID = 'predefined-cerebras-qwen-3.8-27b';
export const CLAUDE_FABLE_51_ENDPOINT_ID = 'predefined-claude-fable-5.1';

export interface ChatModelSpec {
  id: string;
  /** Full label ("DeepSeek V4.1"). */
  label: string;
  /** Chip label in the compact subject bar. */
  short: string;
  role: 'default' | 'alternative' | 'fallback';
  /** The guide-only `reasoningMode` sent on the query body; `null` = the field is not sent. */
  reasoningMode: string | null;
  /** Strip <think>…</think>-style blocks from the fulfillment text before it reaches the bubble. */
  stripThinking: boolean;
  note: string;
}

export const CHAT_MODELS: readonly ChatModelSpec[] = [
  { id: DEEPSEEK_V41_ENDPOINT_ID, label: 'DeepSeek V4.1', short: 'DeepSeek V4.1', role: 'default', reasoningMode: null, stripThinking: true, note: 'default for Investigations / Analyst Chat (cost)' },
  { id: CEREBRAS_QWEN_38_ENDPOINT_ID, label: 'Cerebras Qwen 3.8 27B', short: 'Qwen 3.8', role: 'alternative', reasoningMode: 'low', stripThinking: true, note: 'reasoning sent low · think blocks stripped — no thinking tokens in the bubble' },
  { id: CLAUDE_FABLE_51_ENDPOINT_ID, label: 'Claude Fable 5.1', short: 'Fable 5.1', role: 'fallback', reasoningMode: null, stripThinking: true, note: 'fallback on any 4xx / 5xx / timeout (one retry)' },
];
export const DEFAULT_CHAT_MODEL_ID: string = DEEPSEEK_V41_ENDPOINT_ID;
export const FALLBACK_CHAT_MODEL_ID: string = CLAUDE_FABLE_51_ENDPOINT_ID;

export function chatModelSpec(id: string): ChatModelSpec | undefined {
  return CHAT_MODELS.find((m) => m.id === id);
}
/** The one-hop fallback: anything → Fable 5.1; Fable 5.1 itself → DeepSeek V4.1. */
export function fallbackModelFor(endpointId: string): string {
  return endpointId === FALLBACK_CHAT_MODEL_ID ? DEFAULT_CHAT_MODEL_ID : FALLBACK_CHAT_MODEL_ID;
}
/** `reasoningMode` to send for a model (`null` → field omitted). Unknown ids send nothing. */
export function reasoningModeFor(endpointId: string): string | null {
  return chatModelSpec(endpointId)?.reasoningMode ?? null;
}
export function chatModelLabel(endpointId: string): string {
  return chatModelSpec(endpointId)?.label ?? endpointId;
}
export function chatModelShort(endpointId: string): string {
  return chatModelSpec(endpointId)?.short ?? endpointId;
}

/* ------------------------------------------------------------------ catalogue check */
interface CatalogueRow {
  endpoint_id: string;
  status?: string | null;
}
const SNAPSHOT_ROWS: CatalogueRow[] = (snapshot as { endpoints: CatalogueRow[] }).endpoints;
export const CATALOGUE_SNAPSHOT_FETCHED_AT: string = (snapshot as { fetchedAt: string }).fetchedAt;
/** Endpoint ids present (and not inactive) in the snapshot ∪ the live rows handed in. */
export function catalogueIds(live: CatalogueRow[] = []): Set<string> {
  const out = new Set<string>();
  for (const r of [...SNAPSHOT_ROWS, ...live]) if (r && typeof r.endpoint_id === 'string' && (!r.status || r.status === 'active')) out.add(r.endpoint_id);
  return out;
}
export function isOnCatalogue(endpointId: string, live: CatalogueRow[] = []): boolean {
  return catalogueIds(live).has(endpointId);
}
export interface ChatModelOption extends ChatModelSpec {
  /** false → rendered greyed "not on OnDemand", never sent. */
  available: boolean;
}
export function chatModelOptions(live: CatalogueRow[] = []): ChatModelOption[] {
  const ids = catalogueIds(live);
  return CHAT_MODELS.map((m) => ({ ...m, available: ids.has(m.id) }));
}
export const NOT_ON_CATALOGUE_LABEL = 'not on OnDemand';
/** The id to actually send: the selection when it is on the catalogue, else the first available model (default first), else the default. */
export function resolveSendableModel(selected: string, live: CatalogueRow[] = []): { endpointId: string; substituted: boolean } {
  const opts = chatModelOptions(live);
  if (opts.some((o) => o.id === selected && o.available) || (!chatModelSpec(selected) && isOnCatalogue(selected, live))) return { endpointId: selected, substituted: false };
  const first = opts.find((o) => o.available);
  return { endpointId: first?.id ?? DEFAULT_CHAT_MODEL_ID, substituted: true };
}

/* ------------------------------------------------------------------ thinking-token guard */
const THINK_BLOCK_RE = /<(think|thinking|reasoning|analysis)\b[^>]*>[\s\S]*?<\/\1>\s*/gi;
const THINK_OPEN_RE = /<(think|thinking|reasoning|analysis)\b[^>]*>[\s\S]*$/i;
/**
 * Removes closed `<think>…</think>` / `<thinking>` / `<reasoning>` / `<analysis>` blocks and, while a stream is still open, everything
 * after an unclosed opening tag — so a reasoning model's scratchpad never renders in the reply bubble.
 */
export function stripThinking(text: string): string {
  if (!text || text.indexOf('<') < 0) return text;
  return text.replace(THINK_BLOCK_RE, '').replace(THINK_OPEN_RE, '').replace(/^\s+/, '');
}

/* ------------------------------------------------------------------ configurable per-attempt timeout */
export const DEFAULT_ASK_TIMEOUT_MS = 45_000;
export const ASK_TIMEOUT_KEY = 'gulf-io.chat.askTimeoutMs';
export const ASK_TIMEOUT_MIN_MS = 5_000;
export const ASK_TIMEOUT_MAX_MS = 180_000;
export function clampTimeoutMs(ms: number): number {
  if (!Number.isFinite(ms)) return DEFAULT_ASK_TIMEOUT_MS;
  return Math.min(ASK_TIMEOUT_MAX_MS, Math.max(ASK_TIMEOUT_MIN_MS, Math.round(ms)));
}
/** The per-attempt timeout in force (localStorage override, else 45 000 ms). */
export function askTimeoutMs(): number {
  try {
    const raw = globalThis.localStorage?.getItem(ASK_TIMEOUT_KEY);
    return raw ? clampTimeoutMs(Number(raw)) : DEFAULT_ASK_TIMEOUT_MS;
  } catch {
    return DEFAULT_ASK_TIMEOUT_MS;
  }
}
export function saveAskTimeoutMs(ms: number): number {
  const v = clampTimeoutMs(ms);
  try {
    if (v === DEFAULT_ASK_TIMEOUT_MS) globalThis.localStorage?.removeItem(ASK_TIMEOUT_KEY);
    else globalThis.localStorage?.setItem(ASK_TIMEOUT_KEY, String(v));
  } catch {
    /* storage unavailable */
  }
  return v;
}
