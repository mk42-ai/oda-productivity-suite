/**
 * Shared contracts for the chat-UI parity pass 1 (deliverables shelf · run rail pipeline · OnDemand settings drawer · intelligent-UI renderer).
 * Every surface reads from the ONE rAF-coalesced stream store in chat-shell.tsx (setStream) — these types are the payloads the bridge /
 * fixtures emit as AG-UI CUSTOM frames (see CLIENT_EVENT in lib/ondemand/eventMap.ts) and that the components render. No component here
 * fetches on its own.
 */

/* ------------------------------------------------------------------ Deliverables shelf (CUSTOM ondemand.deliverables) */
export type DeliverableVersion = { version: number; preview: string; contentUrl?: string | null; at?: string | null };
export type Deliverable = {
  id: string;
  /** Card title, e.g. "Problem-solving workbook" / "Run synthesis" */
  title: string;
  /** Format pill, e.g. "workbook-md" | "markdown" */
  format: string;
  version: number;
  verified: boolean;
  /** Raw (markdown) preview text — rendered as LITERAL text, ellipsis-truncated by CSS. */
  preview: string;
  /** Same-origin or data: URL for the per-card Download button. Omit/null → no per-card Download button. */
  downloadUrl?: string | null;
  /** Older versions (v1..vN-1 + current). Omit/empty → no "Version history" toggle. */
  versions?: DeliverableVersion[];
};
export type DeliverablesShelfData = {
  items: Deliverable[];
  /** Run wall-clock in ms → "run completed in 7m 32s". null → the line is omitted. */
  durationMs: number | null;
  /** The shelf-level gold "Download final document" CTA target. */
  finalDownloadUrl?: string | null;
  finalDownloadName?: string | null;
};

/* ------------------------------------------------------------------ Run rail (CUSTOM ondemand.skill / ondemand.stage / ondemand.assumptions) */
export type PipelineStageId = "data-scout" | "benchmark" | "problem-solve" | "storyline" | "design";
export const PIPELINE_STAGES: ReadonlyArray<{ id: PipelineStageId; label: string }> = [
  { id: "data-scout", label: "data-scout" },
  { id: "benchmark", label: "benchmark" },
  { id: "problem-solve", label: "problem-solve" },
  { id: "storyline", label: "storyline" },
  { id: "design", label: "design" },
];
export type PipelineState = { current: PipelineStageId | null; done: PipelineStageId[]; failed: PipelineStageId | null };
export type RailState = {
  /** Running plugin/skill label; null → "No active skill". */
  activeSkill: string | null;
  pipeline: PipelineState;
  /** Assumptions recorded by the run; [] → "No assumptions recorded". */
  assumptions: string[];
};
export const IDLE_RAIL: RailState = { activeSkill: null, pipeline: { current: null, done: [], failed: null }, assumptions: [] };

/* ------------------------------------------------------------------ Intelligent UI (CUSTOM ondemand.iui — root-first statement stream) */
export type IuiPayloadType = "kpi-cards" | "comparison-table" | "funding-timeline" | "sentiment-breakdown" | "country-profile" | "workbook-preview" | "html";
export type IuiPayload =
  | { type: "kpi-cards"; items: { label: string; value: string; delta?: string | null; tone?: "up" | "down" | "flat" }[] }
  | { type: "comparison-table"; columns: string[]; rows: (string | number)[][]; caption?: string }
  | { type: "funding-timeline"; company: string; rounds: { round: string; date: string; amountUsd: number | null; sourceUrl?: string | null }[] }
  | { type: "sentiment-breakdown"; company: string; score: number; factors: { label: string; weight: number; value: number }[]; sources?: { channel: string; count: number }[] }
  | { type: "country-profile"; country: string; flagUrl?: string | null; facts: { label: string; value: string }[]; imageUrl?: string | null; imageAlt?: string | null }
  | { type: "workbook-preview"; title: string; markdown: string; version?: number }
  /** Run-produced HTML, rendered ONLY inside the sandboxed HtmlView iframe (sandbox="" → no scripts, no same-origin). */
  | { type: "html"; html: string; title?: string; height?: number };
export type IuiStatement =
  | { op: "root"; id: string; children: string[]; title?: string }
  | { op: "layout"; id: string; kind: "col" | "row" | "grid"; children: string[]; cols?: number }
  | { op: "data"; id: string; payload: IuiPayload };
/** Hard cap from the spec: a root-first stream is < 60 statements. */
export const IUI_MAX_STATEMENTS = 60;
