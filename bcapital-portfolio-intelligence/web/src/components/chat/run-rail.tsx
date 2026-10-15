"use client";
import { Card } from "@/components/ui/card";
import { useStreamState, hasPayload, PlannerPayloadDetails } from "@/components/chat/open-intelligent-ui/chat-shell";
import { MODEL_ID, MODEL_LABEL, REASONING_MODE } from "@/lib/plugins";
import { PluginChip } from "@/components/ui/plugin-favicon";
import { pluginName } from "@/lib/plugin-catalogue";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PIPELINE_STAGES, type PipelineStageId } from "@/lib/chat-ui/types";
import { publisherOf, hostOf } from "@/components/chat/open-intelligent-ui/citations";
import { faviconFor } from "@/components/chat/open-intelligent-ui/chat-shell";
import { safeExternalUrl } from "@/lib/outbound";
import "./run-rail.css";

const MAX_CHIPS = 4;
/** Active skill · 5-stage pipeline · publisher-first citation chips (+N → focuses the Verified sources panel) · favicon/title source cards with
 *  prev/next · Assumptions. All values come from the SAME rAF-coalesced stream store (useStreamState) — no extra setState per SSE frame. */
export function RunPipelineRail() {
  const st = useStreamState();
  const live = st.phase !== "idle";
  const rail = st.rail;
  const sources = useMemo(() => st.sources.filter((s) => !!safeExternalUrl(s.url)), [st.sources]);
  const [idx, setIdx] = useState(0);
  const cur = sources[Math.min(idx, Math.max(0, sources.length - 1))];
  const overflow = Math.max(0, sources.length - MAX_CHIPS);
  const focusSources = () => { const el = document.getElementById("rail-verified-sources"); el?.focus(); el?.scrollIntoView({ block: "nearest", behavior: "smooth" }); };
  const activeLabel = rail.activeSkill ?? (live && st.tools.some((t) => t.status === "running") ? pluginName(st.tools.find((t) => t.status === "running")!.pluginId) : null);
  const stageState = (id: PipelineStageId): "done" | "running" | "failed" | "pending" => rail.pipeline.failed === id ? "failed" : rail.pipeline.done.includes(id) ? "done" : rail.pipeline.current === id ? "running" : "pending";
  return (
    <Card className="p-3 rr" data-testid="run-pipeline-rail">
      <h2 className="mb-2 text-sm font-semibold">Run</h2>
      <p className="rr__row" data-testid="rail-active-skill" data-active={activeLabel ? "true" : "false"}>
        <span className="rr__k">Active skill</span>
        <span className={`rr__v${activeLabel ? " rr__v--on" : ""}`}>{activeLabel ? <><i className="rr__pulse" aria-hidden />{activeLabel}</> : "No active skill"}</span>
      </p>
      <ol className="rr__pipe" data-testid="rail-pipeline" aria-label="Pipeline">
        {PIPELINE_STAGES.map((s, i) => { const state = stageState(s.id); return (
          <li key={s.id} className={`rr__stage rr__stage--${state}`} data-testid="rail-stage" data-stage={s.id} data-state={state} aria-current={state === "running" ? "step" : undefined}>
            <span className="rr__stage-n" aria-hidden>{i + 1}</span><span className="rr__stage-l">{s.label}</span>
          </li>
        ); })}
      </ol>
      <div className="rr__block">
        <p className="rr__k">Citations</p>
        {sources.length === 0 ? <p className="rr__empty" data-testid="rail-citations-empty">{live ? "Collecting sources…" : "No citations yet"}</p> : (
          <ul className="rr__chips" data-testid="rail-citation-chips" aria-label="Citations by publisher">
            {sources.slice(0, MAX_CHIPS).map((s, i) => (
              <li key={s.url}><button type="button" className={`rr__chip${i === idx ? " rr__chip--on" : ""}`} data-testid="rail-citation-chip" title={s.title} onClick={() => { setIdx(i); focusSources(); }}>
                <img src={faviconFor(s.url)} alt="" width={12} height={12} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />{publisherOf(s.url)}
              </button></li>
            ))}
            {overflow > 0 && <li><button type="button" className="rr__chip rr__chip--more" data-testid="rail-citation-overflow" aria-label={`${overflow} more sources — open Verified sources`} onClick={() => { setIdx(MAX_CHIPS); focusSources(); }}>+{overflow}</button></li>}
          </ul>
        )}
      </div>
      <section id="rail-verified-sources" tabIndex={-1} className="rr__block rr__srcs" data-testid="rail-verified-sources" aria-label="Verified sources" data-count={sources.length}>
        <div className="rr__srcs-head"><p className="rr__k">Verified sources{sources.length ? ` · ${Math.min(idx, sources.length - 1) + 1} / ${sources.length}` : ""}</p>
          {sources.length > 1 && <span className="rr__nav">
            <button type="button" aria-label="Previous source" data-testid="rail-source-prev" onClick={() => setIdx((i) => (i - 1 + sources.length) % sources.length)}><ChevronLeft className="size-3.5" aria-hidden /></button>
            <button type="button" aria-label="Next source" data-testid="rail-source-next" onClick={() => setIdx((i) => (i + 1) % sources.length)}><ChevronRight className="size-3.5" aria-hidden /></button>
          </span>}
        </div>
        {cur ? (
          <a className="rr__card" href={safeExternalUrl(cur.url) ?? "#"} target="_blank" rel="noopener noreferrer" data-testid="rail-source-card" data-host={hostOf(cur.url)}>
            <img className="rr__card-ico" src={faviconFor(cur.url)} alt="" width={16} height={16} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
            <span className="rr__card-body"><span className="rr__card-title">{cur.title || hostOf(cur.url)}</span><span className="rr__card-host">{hostOf(cur.url)}</span></span>
          </a>
        ) : <p className="rr__empty" data-testid="rail-sources-empty">No verified sources yet</p>}
      </section>
      <div className="rr__block">
        <p className="rr__k">Assumptions</p>
        {rail.assumptions.length === 0 ? <p className="rr__empty" data-testid="rail-assumptions-empty">No assumptions recorded</p> : (
          <ul className="rr__asm" data-testid="rail-assumptions">{rail.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
        )}
      </div>
    </Card>
  );
}

/**
 * "This run" card inside the inspector drawer (model row, plugin chips, agent events). Telemetry and the raw SSE request frame
 * live behind ONE reveal (<details data-testid=dev-disclosure>) — the only developer disclosure in the chat UI.
 * a6: the raw planner JSON (<details data-testid=planner-payload>) is rendered ONLY inside that reveal, never in the run view.
 * Everything here is fed by the same live store the chat shell tees from the SSE body; nothing is fetched client-side.
 */
export function RunRail() {
  const st = useStreamState();
  const live = st.phase !== "idle";
  const plugins = st.pluginIds.length ? st.pluginIds : [];
  return (
    <Card className="p-3" data-testid="run-rail">
      <h2 className="mb-2 text-sm font-semibold">This run</h2>
      <p className="text-xs text-muted" data-testid="run-model" data-model-id={MODEL_ID}><span className="font-medium text-foreground">{MODEL_LABEL}</span> · reasoning {REASONING_MODE}</p>
      {plugins.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Plugins in this run" data-testid="run-plugins">
          {plugins.map((id) => { const failed = st.error?.code === "plugin_error" && id === "plugin-1722260873"; const done = st.answerDone || st.sources.length > 0; const state = failed ? "failed" : done ? "done" : live && (st.phase === "researching" || st.phase === "answering" || st.phase === "planning") ? "running" : "queued"; return <li key={id}><PluginChip id={id} state={state} input={st.request ? `${pluginName(id)} · ${String((st.request.body as Record<string, unknown> | undefined)?.queryChars ?? "")} chars query` : undefined} /></li>; })}
        </ul>
      )}
      {/* Plan checklist intentionally NOT here: it lives only in the run view (data-testid=run-view, plan-stepper). */}
      {st.agentLog.length > 0 && (
        <details className="mt-3 text-xs"><summary className="cursor-pointer font-semibold">Agent events ({st.agentLog.length})</summary>
          <ul className="mt-1 space-y-0.5 text-muted">{st.agentLog.slice(-12).map((a, i) => <li key={i}><code>{a.subtype}</code> · {(a.at / 1000).toFixed(1)} s</li>)}</ul>
        </details>
      )}
      {/* ONE reveal for everything developer-facing: telemetry (first event / first token / tokens / stream integrity) + the raw SSE request frame. */}
      <details className="mt-3" data-testid="dev-disclosure">
        <summary className="cursor-pointer select-none text-[11px] font-medium text-muted hover:text-foreground">Developer details</summary>
        <p className="mt-1 text-[11px] text-muted" data-testid="rail-metrics">
          {/* a8 — the verbose first-event / first-token / total values live here (the run footer shows only the compact tools-vs-answer bar). */}
          {st.metrics?.totalTokens != null ? `${st.metrics.totalTokens.toLocaleString()} tokens` : "tokens —"} · first event {st.firstStatusMs != null && Number.isFinite(st.firstStatusMs) ? st.firstStatusMs.toLocaleString() : "—"} ms · first token {st.firstTokenMs != null && Number.isFinite(st.firstTokenMs) ? st.firstTokenMs.toLocaleString() : "—"} ms · tools {st.toolsMs != null && Number.isFinite(st.toolsMs) ? `${(st.toolsMs / 1000).toFixed(1)} s` : "—"} · answer {st.answerMs != null && Number.isFinite(st.answerMs) ? `${(st.answerMs / 1000).toFixed(1)} s` : "—"} · total {st.finishedAt != null && st.startedAt ? `${((st.finishedAt - st.startedAt) / 1000).toFixed(1)} s` : "—"}
          {st.integrity ? ` · ${st.integrity.frames} frames` : ""}
        </p>
        {st.integrity && (st.integrity.dupes > 0 || st.integrity.gaps > 0) && <p className="mt-1 text-[10px] text-muted" data-testid="rail-integrity">stream integrity: {st.integrity.dupes} duplicate frame{st.integrity.dupes === 1 ? "" : "s"} dropped · {st.integrity.gaps} gap{st.integrity.gaps === 1 ? "" : "s"}</p>}
        <p className="mt-1 font-mono text-[10px] text-muted" data-testid="dev-ids">model {MODEL_ID} · plugins {plugins.join(", ") || "—"}{st.attachments ? ` · attachments ${st.attachments.length}` : ""}{st.voice ? ` · voice ${st.voice.phase}` : ""}</p>
        {/* 2026-10-12: the "Why it's interactive" card and the "Request body" placeholder copy were removed; raw frames (request + any
            upstream error frame) are shown ONLY here, inside this single reveal, and only once a run produced them. */}
        {st.request && <pre className="mt-1 max-h-48 overflow-auto rounded-md border border-border bg-surface-2 p-2 text-[10.5px] leading-snug" data-testid="request-body">{JSON.stringify(st.request.body, null, 2)}</pre>}
        {st.error?.raw && <pre className="mt-1 max-h-40 overflow-auto rounded-md border border-border bg-surface-2 p-2 text-[10.5px] leading-snug" data-testid="chat-error-raw">{st.error.raw}</pre>}
        {/* a6: raw planner / tool-definition JSON — developer-only, so it lives here and nowhere else (the Plan card shows the checklist only). */}
        {hasPayload(st.plannerPayload) && <div className="mt-2 text-[11px]"><PlannerPayloadDetails payload={st.plannerPayload} /></div>}
      </details>
    </Card>
  );
}
