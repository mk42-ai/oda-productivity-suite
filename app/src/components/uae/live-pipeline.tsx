"use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Activity, AlertTriangle, ExternalLink } from "lucide-react";
import type { LiveSnapshot } from "@/lib/uae/live";
/** Same palette as CLASS_COLOR in lib/uae/data.ts (kept local so the client bundle does not pull the seed JSON). */
const CLASS_COLOR: Record<string, string> = {
  Optimists: "#0D0D0D",
  Pragmatists: "#2F2F2F",
  Skeptics: "#A3A3A3",
  "Safety Advocates": "#5D5D5D",
  "Disruption Concerned": "#B4B4B4",
  "Pessimists/Doomers": "#D4D4D4",
  "Neutral/Informational": "#737373",
  Unclassified: "#ECECEC",
};

const ago = (iso?: string | null) => { if (!iso) return "—"; const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; };
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
function useLive() {
  const [s, setS] = useState<LiveSnapshot | null>(null); const [err, setErr] = useState<string | null>(null);
  useEffect(() => { let off = false; fetch("/api/uae/live", { cache: "no-store" }).then(async (r) => { const j = (await r.json()) as LiveSnapshot; if (!off) { setS(j); if (!j.ok) setErr(j.error ?? `HTTP ${r.status}`); } }).catch((e) => !off && setErr((e as Error).message)); return () => { off = true; }; }, []);
  return { s, err };
}

/** Overview panel: scheduled OnDemand workflows + the newest ingested, provenance-carrying records. */
export function LivePipelinePanel() {
  const { s, err } = useLive();
  return (
    <section className="card min-w-0 p-4 sm:p-5" data-testid="live-pipeline">
      <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] text-muted" data-testid="engine-credit">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/logos/on-demand/list-64.png" srcSet="/logos/on-demand/list-64.png 1x, /logos/on-demand/list-128.png 2x" width={14} height={14} alt="" aria-hidden style={{ filter: "grayscale(1)" }} />Intelligence engine: OnDemand (AIREV) · Agents Flow Builder execution store</p>
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight"><Activity className="size-4 text-[#5D5D5D]" />Live pipeline — scheduled OnDemand workflows</h2><span className="text-[11px] text-muted">namespace uae_cc_v1</span></div>
      {!s && !err && <p className="flex items-center gap-2 text-sm text-muted" data-testid="live-loading">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/illustrations/loading-state.png" alt="" aria-hidden width={28} height={28} className="animate-pulse rounded" />Reading the workflow execution store…</p>}
      {err && <p role="alert" className="flex items-center gap-2 rounded-md border border-[#B91C1C]/50 bg-[#F9F9F9] px-3 py-2 text-sm text-[#0D0D0D]" data-testid="live-error"><AlertTriangle className="size-4 text-[#737373]" />Live pipeline unavailable: {err}. Seed data below is unaffected.</p>}
      {s?.ok && <>
        <div className="grid gap-2 sm:grid-cols-3">{s.workflows.map((w) => (
          <div key={w.kind} className="rounded-lg border border-border p-3 text-xs" data-testid={`wf-${w.kind}`}>
            <p className="font-semibold capitalize">{w.kind} <code className="ml-1 font-normal text-muted">{w.cron}</code></p>
            <p className="mt-1 text-muted">last run: <span className={w.last?.status === "success" ? "text-[#0D0D0D]" : "text-[#B91C1C]"}>{w.last?.status ?? "none yet"}</span> · {ago(w.last?.startedAt)} ({w.last?.trigger || "—"})</p>
            <p className="text-muted">next: {w.next_runs_utc[0]?.replace("T", " ").replace(":00Z", " UTC") ?? "—"}</p>
            <p className="truncate text-[10px] text-muted" title={w.id}>workflow {w.id}</p>
          </div>))}</div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div><p className="mb-1 text-xs font-semibold">Newest ingested news ({s.ingest.news.length})</p>
            {s.ingest.news.length === 0 ? <p className="text-xs text-muted" data-testid="live-news-empty">No live news records yet{s.ingest.parse_error ? ` (${s.ingest.parse_error})` : ""}.</p> :
              <ul className="space-y-1.5" data-testid="live-news">{s.ingest.news.slice(0, 6).map((n, i) => <li key={i} className="text-xs"><a href={n.provenance.source_url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{n.headline}<ExternalLink className="ml-1 inline size-3 text-[#5D5D5D]" /></a><span className="block text-[10px] text-muted">{n.publisher || host(n.provenance.source_url)} · {n.published_at || "date n/a"} · via {n.provenance.plugin}{n.provenance.confidence != null ? ` · conf ${n.provenance.confidence}` : ""}</span></li>)}</ul>}
          </div>
          <div><p className="mb-1 text-xs font-semibold">Newest classified statements ({s.ingest.statements.length})</p>
            {s.ingest.statements.length === 0 ? <p className="text-xs text-muted" data-testid="live-statements-empty">No attributable statements in the latest run — none are synthesised.</p> :
              <ul className="space-y-1.5" data-testid="live-statements">{s.ingest.statements.slice(0, 6).map((r, i) => <li key={i} className="text-xs"><span className="mr-1 inline-block size-2 rounded-full border border-[#737373] align-middle" style={{ background: CLASS_COLOR[r.sentiment_class] ?? "#A3A3A3" }} /><span className="font-medium">{r.sentiment_class}</span> — “{r.text.slice(0, 160)}{r.text.length > 160 ? "…" : ""}” <a href={r.provenance.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted underline">{r.author || "unattributed"} · {host(r.provenance.source_url)}</a></li>)}</ul>}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted">Provenance on every record: source URL, run timestamp {s.ingest.run?.endedAt ?? "—"}, plugin, confidence, execution {s.ingest.run?.executionId ?? "—"}. Records without a source URL are dropped ({s.ingest.dropped_no_url} this run). Live records are additive to the curated seed and are not merged into its counts.</p>
      </>}
    </section>
  );
}

/** Briefing page: the latest briefing produced by the daily 06:30 GST workflow. */
export function ScheduledBriefing() {
  const { s, err } = useLive();
  const b = s?.briefing;
  return (
    <section className="card mt-4 min-h-[60vh] p-4 sm:p-6" data-testid="scheduled-briefing">
      <h2 className="text-sm font-semibold">Latest scheduled briefing <span className="font-normal text-muted">· workflow cron 0 30 2 * * * (06:30 GST)</span></h2>
      {!s && !err && <p className="mt-2 flex items-center gap-2 text-sm text-muted" data-testid="scheduled-briefing-loading">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/illustrations/loading-state.png" alt="" aria-hidden width={28} height={28} className="animate-pulse rounded" />Loading…</p>}
      {err && <p role="alert" className="mt-2 text-sm text-[#B91C1C]">Scheduled briefing unavailable: {err}</p>}
      {s?.ok && !b?.markdown && <p className="mt-2 text-sm text-muted" data-testid="scheduled-briefing-empty">No scheduled briefing has completed yet. Next run: {s.workflows.find((w) => w.kind === "briefing")?.next_runs_utc[0] ?? "—"}.</p>}
      {b?.markdown && <>
        <p className="mt-1 text-xs text-muted">Generated by execution {b.run?.executionId} · {b.run?.endedAt} ({b.run?.trigger})</p>
        <div className="mt-3 min-w-0 break-words text-[14px] leading-relaxed [&_a]:text-[#2563EB] [&_a]:underline [&_code]:break-all [&_code]:whitespace-pre-wrap [&_pre]:overflow-x-auto [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:font-semibold [&_li]:my-1 [&_ul]:ml-5 [&_ul]:list-disc"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>{b.markdown}</ReactMarkdown></div>
      </>}
    </section>
  );
}
