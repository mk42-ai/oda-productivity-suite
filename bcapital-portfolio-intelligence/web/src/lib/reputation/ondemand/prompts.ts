/**
 * Prompts for the OnDemand surfaces (v4.5):
 *   • ASK — WHY CONNECTED edge panel / node inspector quick blast (predefined-deepseek-flash).
 *   • ASK · whole dataset (FIX DEF-027, 2026-09-15) — DATASET_FULFILLMENT_PROMPT + DATASET_PRESETS over the retrieved CONTEXT block.
 *   • RUN — the Run correlation composer (deepseek-flash by default, toggle to claude-fable-5.1) returning STRICT JSON.
 * The fulfillment prompt MUST keep the `Context: {context}` / `Question: {question}` slots (docs: Fulfillment Prompts).
 */
import { STANDING_RULE } from './context';

export interface AskPreset {
  id: string;
  label: string;
  question: string;
}

export const EDGE_PRESETS: AskPreset[] = [
  { id: 'why-linked', label: 'why linked?', question: 'Why are these two nodes linked in this run? Explain only the co-action shown in the CONTEXT block.' },
  { id: 'timeline', label: 'timeline of co-action', question: 'Give a short timeline of the co-action between these two nodes using only the window, min Δt, per-mode counts and the EVID summaries in the context.' },
  { id: 'recycled', label: 'is this recycled footage?', question: 'Does anything in the EVID trail indicate recycled or re-used footage / imagery? Answer only from the EVID summaries; if nothing indicates it, say so.' },
  { id: 'evid-check', label: 'check EVID trail', question: 'Check the EVID trail: for each EVID id state what it supports, its reliability grade and claim status, and whether the trail is consistent with the shown weight and counts.' },
];

export const NODE_PRESETS: AskPreset[] = [
  { id: 'who', label: 'who is this?', question: 'Summarise what the local evidence says about this handle: role, platform, network membership and the EVID that cite it. Do not add outside knowledge.' },
  { id: 'timeline', label: 'timeline of activity', question: 'Give a short dated timeline of this handle\'s activity strictly from the EVID summaries in the context.' },
  { id: 'recycled', label: 'is this recycled footage?', question: 'Does any EVID citing this handle indicate recycled or re-used footage / imagery? Answer only from the context.' },
  { id: 'evid-check', label: 'check EVID trail', question: 'Check the EVID citing this handle: reliability grade vs claim status for each, and any contradiction between them.' },
];

export const ASK_FULFILLMENT_PROMPT = [
  'You are the WHY CONNECTED quick-blast explainer inside an OSINT narrative-monitoring workbench.',
  'Answer in at most 160 words, plain text, no headings. Ground every ledger statement in the CONTEXT block in the question; live plugin results (X, Perplexity, Deep Translation, File Retrieval) may be quoted only with their date and URL, in a separate final sentence starting "Live:".',
  'Cite evidence only by the EVID ids that appear in the context (format EVID-xxxxxx); never invent ids, handles, numbers, dates, URLs or sources.',
  'Never assert coordination, intent, direction or central control — co-occurrence shows co-action, not intent.',
  `Keep the framing: ${STANDING_RULE}.`,
  "If the context does not support an answer, say 'unresolved' and name what is missing.",
  '',
  'Context: {context}',
  'Question: {question}',
].join('\n');

/** The question the model sees: preset/user text + the ≤ 3 KB context block. */
export function buildAskQuery(question: string, context: string): string {
  return `${question.trim()}\n\n${context}`;
}

/* ------------------------------------------------------------------ FIX DEF-027 — whole-dataset scope */
/** Preset chips for the whole-dataset scope (the question text is what gets sent). */
export const DATASET_PRESETS: AskPreset[] = [
  { id: 'changed', label: 'summarize what changed this cycle', question: 'Summarize what changed this cycle across the retrieved context: new or updated EVID rows, narratives whose status moved, and edges or clusters from the latest run. Cite EVID ids only from the context.' },
  { id: 'top-accounts', label: 'which accounts appear most across EVID rows', question: 'Which accounts appear most across the EVID rows in the retrieved context? List handle, platform, network and the EVID ids that cite each; say "not in the retrieved context" for anything you cannot see.' },
  { id: 'strongest-edges', label: 'list edges with strongest dedup-adjusted score', question: 'List the edges with the strongest dedup-adjusted score in the retrieved context (weight, count vs raw count, syndicated flag, EVID trail). Co-action only — never intent.' },
  { id: 'net-001', label: 'what narratives does NET-001 push', question: 'What narratives does NET-001 push according to the retrieved context? Name the NAR ids, their status and the EVID ids that support each; never assert coordination or intent.' },
];

/** Whole-dataset fulfillment prompt: structured, ≤ ~300 words, EVID ids only from the CONTEXT, standing rule kept, `not in the retrieved context` when absent. */
export const DATASET_FULFILLMENT_PROMPT = [
  'You are the whole-dataset analyst inside an OSINT narrative-monitoring workbench. The question carries a CONTEXT block retrieved from the local dataset (summary header + ranked rows: EVID evidence, accounts, networks, narratives, claims, correlation edges and clusters).',
  'Answer in at most 320 words, structured as short headed sections or bullets (plain text, no tables). Ground every ledger statement in the CONTEXT block; live plugin results (X, Perplexity, Deep Translation, File Retrieval, OnDemand Agent) belong in ONE final section headed "Live" with an ISO date and a URL per item — never mixed into the ledger sections.',
  'Cite evidence only by the EVID ids that appear in the CONTEXT (format EVID-xxxxxx); never invent ids, handles, numbers, dates, URLs or sources. Name networks / narratives by the NET- / NAR- ids shown.',
  "If the CONTEXT does not contain what is asked, say 'not in the retrieved context' and name what is missing instead of guessing; a live item never substitutes for a missing ledger row.",
  'Never assert coordination, intent, direction or central control — co-occurrence and edges show co-action, not intent; source reliability (A–F) stays separate from claim status.',
  `Keep the framing: ${STANDING_RULE}.`,
  '',
  'Context: {context}',
  'Question: {question}',
].join('\n');

/* ------------------------------------------------------------------ Run correlation */
export interface RunComposerParams {
  investigationId: string;
  cycle: number;
  baseline: string;
  activeNetworkIds: string[];
  handles: string[];
  windowSeconds: number;
  minCoOccurrences: number;
  maxAgeDays: number | null;
  scope: string;
  /** FULL_CORPUS_CORRELATION: true when no account / URL / hashtag chip narrows the run — the roster is EVERY live account. */
  scopeAll?: boolean;
  /** FULL_CORPUS_CORRELATION: rows the engine considers for this scope (the store row count when scopeAll). */
  postsConsidered?: number;
  corpus?: 'investigation' | 'all';
  corpusRows?: Record<string, number>;
}

const RUN_JSON_SHAPE =
  '{"nodes":[{"id":"@handle","platform":"tiktok|x|reddit|web|instagram|telegram|youtube|facebook","network":"NET-00x or null"}],' +
  '"edges":[{"source":"@a","target":"@b","mode":"co-share|co-link|co-hashtag|co-reply|co-text","weight":0.0,"window":60,"co_occurrences":0,' +
  '"per_mode":{"co-share":0,"co-hashtag":0},"min_dt":0,"evid":["EVID-000000"]}],"quality_score":0.0,"caveat":"UNPROVEN — co-action, not intent"}';

export const RUN_FULFILLMENT_PROMPT = [
  'You are the correlation-run composer of an OSINT workbench. You receive an analyst prompt plus the run parameters and the handles / EVID ids in scope.',
  `Return STRICT JSON ONLY — no prose, no markdown fences — exactly in this shape: ${RUN_JSON_SHAPE}`,
  'Rules: use only handles and EVID ids given in the question (never invent ids); every edge must connect two listed nodes; weight in [0,1]; window in seconds equal to the requested window;',
  'co_occurrences is an integer ≥ min co-occurrence; per_mode counts sum to co_occurrences; min_dt in seconds ≤ window; quality_score in [0,1] is your confidence that the edges reflect the supplied evidence, not a coordination score.',
  'Never assert coordination or intent: the caveat field must stay "UNPROVEN — co-action, not intent". If the material supports no edge, return {"nodes":[],"edges":[],"quality_score":0,"caveat":"UNPROVEN — co-action, not intent"}.',
  '',
  'Context: {context}',
  'Question: {question}',
].join('\n');

/** Pre-filled, editable composer text. */
export function buildRunPrompt(p: RunComposerParams): string {
  const nets = p.activeNetworkIds.length ? p.activeNetworkIds.join(', ') : 'all live networks (NET-004 excluded, HISTORICAL ONLY)';
  return [
    p.corpus === 'all'
      ? `Re-run the correlation over ALL investigations (${Object.entries(p.corpusRows ?? {}).map(([k, v]) => `${k} ${v}`).join(' + ')} = ${p.postsConsidered ?? '?'} accepted rows; started from ${p.investigationId}).`
      : `Re-run the correlation for ${p.investigationId} (cycle ${p.cycle}, baseline C1 ${p.baseline}).`,
    `Scope: ${p.scope}. Active network(s): ${nets}.`,
    `Window ${p.windowSeconds}s · min co-occurrence ${p.minCoOccurrences} · MAX AGE ${p.maxAgeDays === null ? 'all' : `${p.maxAgeDays}d`}.`,
    p.scopeAll
      ? `Handles in scope = ALL (${p.handles.length}) · posts considered ${p.postsConsidered ?? p.handles.length}: every live account, outlet, URL and hashtag entity of the store — no roster cap.`
      : `Handles in scope (${p.handles.length}): ${p.handles.join(', ') || 'none selected — use every handle listed in the material'}.`,
    'Return the co-occurrence graph as strict JSON (nodes, edges with per-mode counts, min Δt and EVID trails, quality_score). Co-action only — never intent.',
  ].join('\n');
}

/** Material block appended after the analyst prompt: the handles, their EVID ids and short summaries (kept ≤ ~6 KB by the caller). */
export function buildRunMaterial(lines: string[]): string {
  return ['MATERIAL (the only handles / EVID ids you may use):', ...lines].join('\n');
}
