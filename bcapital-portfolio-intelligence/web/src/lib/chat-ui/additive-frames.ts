/**
 * Additive SSE demux for the chat-ui parity frames (pass 1 + pass 2).
 *
 * `applyAdditiveRunFrames(base, frame)` is a PURE reducer: it takes the current additive slice of the stream state and ONE AG-UI CUSTOM
 * frame ({name, value}) and returns the next slice. It is wrapped in try/catch and returns `base` unchanged on ANY parser failure, so a
 * malformed or unexpected payload can never break the run view, the answer stream, or the existing reducers — the frame is simply ignored.
 * It is called from the chat shell's tee loop, and its result is committed through the SAME `setStream()` rAF/80 ms coalescer as every
 * other frame (no extra React commit per SSE event).
 */
import { CLIENT_EVENT as CE } from "@/lib/ondemand/eventMap";
import { IDLE_RAIL, IUI_MAX_STATEMENTS, type DeliverablesShelfData, type IuiStatement, type PipelineStageId, type RailState } from "./types";

export type AdditiveSlice = { deliverables: DeliverablesShelfData | null; rail: RailState; iui: IuiStatement[] };
export const IDLE_ADDITIVE: AdditiveSlice = { deliverables: null, rail: IDLE_RAIL, iui: [] };
export const ADDITIVE_FRAME_NAMES: ReadonlySet<string> = new Set([CE.deliverables, CE.skill, CE.stage, CE.assumptions, CE.iui]);

const STAGE_IDS: ReadonlySet<string> = new Set(["data-scout", "benchmark", "problem-solve", "storyline", "design"]);

export function applyAdditiveRunFrames(base: AdditiveSlice, frame: { name?: string; value?: unknown }): AdditiveSlice {
  try {
    const v = (frame.value && typeof frame.value === "object" ? frame.value : {}) as Record<string, unknown>;
    switch (frame.name) {
      case CE.deliverables: {
        if (!Array.isArray(v.items)) return base;
        const items = (v.items as Record<string, unknown>[]).filter((d) => d && typeof d.id === "string" && typeof d.title === "string").map((d) => ({
          id: String(d.id), title: String(d.title), format: String(d.format ?? "file"), version: Number.isFinite(Number(d.version)) ? Number(d.version) : 1,
          verified: d.verified === true, preview: typeof d.preview === "string" ? d.preview : "",
          downloadUrl: typeof d.downloadUrl === "string" ? d.downloadUrl : null,
          versions: Array.isArray(d.versions) ? (d.versions as Record<string, unknown>[]).filter((x) => Number.isFinite(Number(x.version))).map((x) => ({ version: Number(x.version), preview: typeof x.preview === "string" ? x.preview : "", contentUrl: typeof x.contentUrl === "string" ? x.contentUrl : null, at: typeof x.at === "string" ? x.at : null })) : [],
        }));
        return { ...base, deliverables: { items, durationMs: typeof v.durationMs === "number" && Number.isFinite(v.durationMs) ? v.durationMs : null, finalDownloadUrl: typeof v.finalDownloadUrl === "string" ? v.finalDownloadUrl : null, finalDownloadName: typeof v.finalDownloadName === "string" ? v.finalDownloadName : null } };
      }
      case CE.skill:
        return { ...base, rail: { ...base.rail, activeSkill: typeof v.label === "string" && v.label.trim() ? v.label.trim() : null } };
      case CE.stage: {
        const id = String(v.id ?? "");
        if (!STAGE_IDS.has(id)) return base;
        const sid = id as PipelineStageId; const ph = String(v.phase ?? "start"); const pl = base.rail.pipeline;
        const pipeline = ph === "start" ? { current: sid, done: pl.done.filter((d) => d !== sid), failed: null }
          : ph === "failed" ? { current: null, done: pl.done, failed: sid }
          : { current: pl.current === sid ? null : pl.current, done: pl.done.includes(sid) ? pl.done : [...pl.done, sid], failed: pl.failed === sid ? null : pl.failed };
        return { ...base, rail: { ...base.rail, pipeline } };
      }
      case CE.assumptions:
        if (!Array.isArray(v.items)) return base;
        return { ...base, rail: { ...base.rail, assumptions: (v.items as unknown[]).map((x) => String(x)).filter(Boolean).slice(0, 50) } };
      case CE.iui: {
        const add = (Array.isArray(v.statements) ? v.statements : v.statement ? [v.statement] : []) as IuiStatement[];
        const ok = add.filter((s) => s && typeof s === "object" && typeof (s as { op?: unknown }).op === "string" && typeof (s as { id?: unknown }).id === "string");
        if (!ok.length) return base;
        return { ...base, iui: [...base.iui, ...ok].slice(0, IUI_MAX_STATEMENTS) };
      }
      default:
        return base;
    }
  } catch {
    return base; // parser failure → base state, the run continues untouched
  }
}
