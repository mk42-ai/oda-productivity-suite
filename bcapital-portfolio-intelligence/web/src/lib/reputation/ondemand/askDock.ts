/**
 * v4.8 — the ASK dock store: the prompt now lives INSIDE the chat-bot panel (speech-bubble dock), not in the header drawer
 * and not inside the WHY CONNECTED card.
 *
 *  • `subject` — what the ASK is about: the edge (WHY CONNECTED payload) or the node (inspector) that was clicked, with the
 *    ≤ 3 KB on-screen context block, the preset chips and the investigation id. Publishing a subject is a pure state write:
 *    nothing is sent until the analyst presses Send / a preset.
 *  • `assembleAskPrompt()` — the FULL prompt exactly as it leaves the browser: the fulfillment (system) prompt with its two
 *    slots, the session contextMetadata key/values, the query text (question + context) and the request body the proxy
 *    forwards to POST /chat/v1/sessions/{id}/query. The chat panel shows this in a collapsible "Prompt preview" BEFORE sending.
 *  • `transcript` — every sent prompt and every reply (ASK and Run correlation alike), newest last, with model / elapsed /
 *    tokens / HTTP error text. Nothing is capped.
 *  • `pendingRun` — the assembled Run-correlation prompt published by the run composer as soon as it opens, so the analyst
 *    sees the exact text before execution; `runExecutor` lets the chat panel trigger the same send.
 */
import { create } from 'zustand';
import { ANALYST_CHAT_PLUGIN_IDS } from './analystPlugins';
import { reasoningModeFor } from './chatModels';
import type { AskPreset } from './prompts';
import { ASK_FULFILLMENT_PROMPT, buildAskQuery, DATASET_FULFILLMENT_PROMPT, DATASET_PRESETS, RUN_FULFILLMENT_PROMPT } from './prompts';
import { utf8Bytes } from './context';
// Port note (B Capital): the DEF-027 whole-dataset scope (DatasetContext / BM25 retrieval over the Rilian corpus) is not ported;
// `assembleAskPrompt` keeps the identical subject-scope path and falls back to the dataset prompt text without a retrieved block.
type DatasetContext = { block: string; items: number; candidates: number; header: string };
const datasetContextMetadata = (ctx: DatasetContext, investigationId: string): Array<{ key: string; value: string }> => [{ key: 'surface', value: 'whole-dataset' }, { key: 'investigation', value: investigationId }, { key: 'retrieved_items', value: String(ctx.items) }, { key: 'candidates', value: String(ctx.candidates) }];

/** v5.1.0 — a highlighted cluster (in-canvas ClusterCard) is a subject too: the FOCUS block of the Analyst Chat carries it. */
type AskScope = 'edge' | 'node' | 'cluster';
type DockTab = 'ask' | 'investigations' | 'analyst';
/** FIX DEF-027 — chat scope: `subject` (the clicked node / edge, ≤ 3 KB on-screen context) or `dataset` (whole corpus, retrieval-ranked). */
export type AskScopeMode = 'subject' | 'dataset';

export interface AskSubject {
  scope: AskScope;
  /** Stable key (edge id or handle) — a new subject clears the draft, never the transcript. */
  subjectKey: string;
  /** Human title shown in the panel header, e.g. "@a × @b · 3D · via canvas" or "@handle". */
  title: string;
  investigationId: string;
  /** ≤ 3 KB block built from what is ON SCREEN (buildEdgeContext / buildNodeContext). */
  context: string;
  presets: AskPreset[];
  /** Session contextMetadata derived from the context lines (contextToMetadata). */
  contextMetadata: Array<{ key: string; value: string }>;
  placeholder: string;
}

export interface AssembledPrompt {
  kind: 'ask' | 'run';
  /** FIX DEF-027 — which ASK scope produced this prompt (`run` prompts carry 'subject' for compatibility). */
  scope?: AskScopeMode;
  endpointId: string;
  temperature: number;
  /** The fulfillment / system prompt sent as modelConfigs.fulfillmentPrompt (slots {context} / {question} are filled by OnDemand). */
  fulfillmentPrompt: string;
  contextMetadata: Array<{ key: string; value: string }>;
  /** The query string (question + on-screen context, or run prompt + material). */
  query: string;
  /** Bytes of the query. */
  queryBytes: number;
  /** Exactly what the proxy forwards upstream (server/ondemand.ts upstreamQueryBody). */
  requestBody: Record<string, unknown>;
  /** One readable block: system prompt + metadata + query — what the analyst reads in the Prompt preview. */
  text: string;
}

export interface TranscriptItem {
  id: string;
  kind: 'ask' | 'run';
  role: 'prompt' | 'reply' | 'system';
  ts: string;
  /** The short question / label (prompt) or the answer text (reply). */
  text: string;
  /** The full assembled prompt behind a prompt entry (collapsible in the UI). */
  prompt?: AssembledPrompt;
  subjectTitle?: string;
  endpointId?: string;
  status?: 'streaming' | 'done' | 'error';
  elapsedMs?: number | null;
  tokens?: number | null;
  error?: string | null;
  /** FIX DEF-025 — HTTP status + response body VERBATIM of a failed send (rendered under the friendly headline, never swallowed). */
  errorStatus?: number | null;
  errorBody?: string | null;
  sessionId?: string | null;
  /** v5.0.1 (A) — the endpointId that failed first when this reply came from the fallback model (meta line only). */
  fallbackFrom?: string | null;
  fallbackReason?: string | null;
}

interface PendingRun {
  label: string;
  prompt: AssembledPrompt;
  investigationId: string;
  publishedAt: string;
}

interface AskDockState {
  tab: DockTab;
  subject: AskSubject | null;
  /** FIX DEF-027 — 'dataset' while no subject is loaded; a new node / edge subject switches to 'subject'; the analyst can switch back. */
  scopeMode: AskScopeMode;
  draft: string;
  transcript: TranscriptItem[];
  pendingRun: PendingRun | null;
  runExecutor: (() => void) | null;
  setTab: (t: DockTab) => void;
  setSubject: (s: AskSubject | null) => void;
  setScopeMode: (m: AskScopeMode) => void;
  setDraft: (d: string) => void;
  append: (item: TranscriptItem) => void;
  patch: (id: string, p: Partial<TranscriptItem>) => void;
  clearTranscript: () => void;
  setPendingRun: (r: PendingRun | null) => void;
  setRunExecutor: (fn: (() => void) | null) => void;
}

export const useAskDock = create<AskDockState>((set) => ({
  tab: 'ask',
  subject: null,
  scopeMode: 'dataset',
  draft: '',
  transcript: [],
  pendingRun: null,
  runExecutor: null,
  setTab: (tab) => set({ tab }),
  // a subject arriving (even the same one, re-clicked) puts the dock in subject scope; clearing the subject falls back to the dataset
  setSubject: (subject) =>
    set((s) => {
      const scopeMode: AskScopeMode = subject ? 'subject' : 'dataset';
      if (s.subject?.subjectKey === subject?.subjectKey && s.subject?.context === subject?.context) return s.scopeMode === scopeMode ? {} : { scopeMode };
      return { subject, draft: '', scopeMode };
    }),
  // subject scope needs a subject — without one the switch is a no-op (the UI disables that option)
  setScopeMode: (scopeMode) => set((s) => (scopeMode === 'subject' && !s.subject ? {} : { scopeMode })),
  setDraft: (draft) => set({ draft }),
  append: (item) => set((s) => ({ transcript: [...s.transcript, item] })),
  patch: (id, p) => set((s) => ({ transcript: s.transcript.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
  clearTranscript: () => set({ transcript: [] }),
  setPendingRun: (pendingRun) => set({ pendingRun }),
  setRunExecutor: (runExecutor) => set({ runExecutor }),
}));

/**
 * Mirrors server/ondemand.ts upstreamQueryBody — the body that reaches POST /chat/v1/sessions/{id}/query.
 * v5.1.0 (DEF-046): ASK turns carry ANALYST_CHAT_PLUGIN_IDS with fulfillmentOnly:false (RAG + plugin execution on) and the model's
 * reasoningMode (Qwen 3.8 → 'low'); Run-correlation prompts stay plugin-free / fulfillmentOnly:true (strict JSON, no RAG).
 */
export function requestBodyPreview(p: { endpointId: string; query: string; fulfillmentPrompt: string; temperature: number; responseMode?: 'stream' | 'sync'; pluginIds?: readonly string[] }): Record<string, unknown> {
  const pluginIds = [...(p.pluginIds ?? [])];
  const reasoningMode = reasoningModeFor(p.endpointId);
  return { endpointId: p.endpointId, query: p.query, responseMode: p.responseMode ?? 'stream', fulfillmentOnly: pluginIds.length === 0, pluginIds, modelConfigs: { fulfillmentPrompt: p.fulfillmentPrompt, temperature: p.temperature }, ...(reasoningMode ? { reasoningMode } : {}) };
}
/** The plugin ids every ASK turn sends (same constant as the Analyst Chat). */
export const ASK_PLUGIN_IDS: readonly string[] = ANALYST_CHAT_PLUGIN_IDS;

function renderText(kind: 'ask' | 'run', endpointId: string, temperature: number, fulfillmentPrompt: string, meta: Array<{ key: string; value: string }>, query: string, scopeLabel = ''): string {
  return [
    `# ${kind === 'ask' ? `ASK${scopeLabel ? ` · ${scopeLabel}` : ''}` : 'RUN CORRELATION'} — full prompt as sent · endpointId ${endpointId} · temperature ${temperature} · responseMode stream${kind === 'ask' ? ` · pluginIds ${ASK_PLUGIN_IDS.join(', ')}` : ' · no plugins (strict JSON)'}`,
    '',
    '## 1 · fulfillment (system) prompt — modelConfigs.fulfillmentPrompt',
    fulfillmentPrompt,
    '',
    `## 2 · session contextMetadata (${meta.length})`,
    meta.length ? meta.map((m) => `${m.key}: ${m.value}`).join('\n') : '(none)',
    '',
    '## 3 · query — the {question} + {context} the model reads',
    query,
  ].join('\n');
}

export interface AssembleAskOptions {
  /** Defaults to 'subject' when a subject is given, 'dataset' otherwise. */
  scope?: AskScopeMode;
  /** Dataset scope: the retrieved CONTEXT block (context.ts buildDatasetContext) — required for a meaningful dataset prompt. */
  datasetContext?: DatasetContext | null;
  /** Dataset scope: the investigation the session is keyed on (externalUserId). */
  investigationId?: string;
}
const EMPTY_QUESTION = '<your question — type it or pick a preset chip>';
/** Scope label for the preview header line. */
export function scopeLabelOf(scope: AskScopeMode, subject: AskSubject | null): string {
  return scope === 'dataset' ? 'scope: whole dataset' : `scope: this ${subject?.scope ?? 'node/edge'}`;
}
/**
 * The complete ASK prompt for the current scope + question (question may be empty while the analyst is still typing).
 * FIX DEF-027 — scope-aware: subject scope = ASK_FULFILLMENT_PROMPT over the ≤ 3 KB on-screen context; dataset scope =
 * DATASET_FULFILLMENT_PROMPT over the retrieved dataset CONTEXT block (opts.datasetContext). The header line names the scope.
 */
export function assembleAskPrompt(subject: AskSubject | null, question: string, endpointId: string, temperature = 0.2, opts: AssembleAskOptions = {}): AssembledPrompt {
  const scope: AskScopeMode = opts.scope ?? (subject ? 'subject' : 'dataset');
  const q = question.trim() || EMPTY_QUESTION;
  if (scope === 'dataset' || !subject) {
    const ctx = opts.datasetContext ?? null;
    const context = ctx?.block ?? 'CONTEXT (retrieved from the whole dataset for this question): (no corpus loaded)';
    const query = buildAskQuery(q, context);
    const contextMetadata = ctx ? datasetContextMetadata(ctx, opts.investigationId ?? subject?.investigationId ?? 'INV-001') : [{ key: 'surface', value: 'whole-dataset' }];
    return {
      kind: 'ask',
      scope: 'dataset',
      endpointId,
      temperature,
      fulfillmentPrompt: DATASET_FULFILLMENT_PROMPT,
      contextMetadata,
      query,
      queryBytes: utf8Bytes(query),
      requestBody: requestBodyPreview({ endpointId, query, fulfillmentPrompt: DATASET_FULFILLMENT_PROMPT, temperature, pluginIds: ASK_PLUGIN_IDS }),
      text: renderText('ask', endpointId, temperature, DATASET_FULFILLMENT_PROMPT, contextMetadata, query, scopeLabelOf('dataset', subject)),
    };
  }
  const query = buildAskQuery(q, subject.context);
  return {
    kind: 'ask',
    scope: 'subject',
    endpointId,
    temperature,
    fulfillmentPrompt: ASK_FULFILLMENT_PROMPT,
    contextMetadata: subject.contextMetadata,
    query,
    queryBytes: utf8Bytes(query),
    requestBody: requestBodyPreview({ endpointId, query, fulfillmentPrompt: ASK_FULFILLMENT_PROMPT, temperature, pluginIds: ASK_PLUGIN_IDS }),
    text: renderText('ask', endpointId, temperature, ASK_FULFILLMENT_PROMPT, subject.contextMetadata, query, scopeLabelOf('subject', subject)),
  };
}
/** Preset chips for a scope (dataset chips are fixed; subject chips come with the subject). */
export function presetsFor(scope: AskScopeMode, subject: AskSubject | null): AskPreset[] {
  return scope === 'dataset' ? DATASET_PRESETS : (subject?.presets ?? []);
}

/** The complete Run-correlation prompt: analyst prompt + material block under the RUN fulfillment prompt. */
export function assembleRunPrompt(prompt: string, material: string, endpointId: string, contextMetadata: Array<{ key: string; value: string }> = [], temperature = 0.1): AssembledPrompt {
  const query = `${prompt.trim()}\n\n${material}`;
  return {
    kind: 'run',
    endpointId,
    temperature,
    fulfillmentPrompt: RUN_FULFILLMENT_PROMPT,
    contextMetadata,
    query,
    queryBytes: utf8Bytes(query),
    requestBody: requestBodyPreview({ endpointId, query, fulfillmentPrompt: RUN_FULFILLMENT_PROMPT, temperature }),
    text: renderText('run', endpointId, temperature, RUN_FULFILLMENT_PROMPT, contextMetadata, query),
  };
}

/**
 * GATE_2026-09-14 — key that changes whenever the transcript TAIL changes shape: a new item, streamed text, or the last reply
 * flipping to `done` / `error` (the LIVE OFF notice is rendered from `error`, which the old `[length, lastText]` dependency did
 * not see — the 503 notice could land below the transcript's scroll viewport when the pending-run block pushed it down).
 * The panel's auto-scroll effect depends on this key, so the newest reply / notice is always scrolled into view.
 */
export function transcriptTailKey(transcript: readonly TranscriptItem[]): string {
  const last = transcript[transcript.length - 1];
  if (!last) return '0';
  return `${transcript.length}|${last.id}|${last.text.length}|${last.status ?? ''}|${last.error ? last.error.length : 0}`;
}

let seq = 0;
export const nextTranscriptId = (prefix: string): string => `${prefix}-${Date.now()}-${++seq}`;
