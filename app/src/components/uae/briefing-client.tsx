"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Loader2, Printer, Copy, AlertTriangle } from "lucide-react";
import { getSettings } from "@/lib/settings";

type Res = { ok: boolean; markdown?: string; error?: string; stage?: string; status?: number; sessionId?: string; latency_ms?: number; generated_at?: string; endpointId?: string; pluginIds?: string[]; metrics?: Record<string, number> | null };
export function BriefingClient() {
  const [focus, setFocus] = useState(""); const [web, setWeb] = useState(false); const [aud, setAud] = useState("government"); const [busy, setBusy] = useState(false); const [res, setRes] = useState<Res | null>(null); const [t, setT] = useState(0);
  async function run() {
    setBusy(true); setRes(null); const t0 = Date.now(); const iv = setInterval(() => setT(Math.round((Date.now() - t0) / 1000)), 500);
    try { const k = getSettings().apikey; const r = await fetch("/api/briefing", { method: "POST", headers: { "content-type": "application/json", ...(k ? { "x-ondemand-key": k } : {}) }, body: JSON.stringify({ focus, web, audience: aud }) }); setRes((await r.json()) as Res); }
    catch (e) { setRes({ ok: false, error: (e as Error).message, stage: "browser" }); } finally { clearInterval(iv); setBusy(false); }
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]" data-testid="briefing">
      <div className="card h-fit space-y-3 p-4 print:hidden">
        <label className="block text-sm font-medium" htmlFor="b-focus">Focus (optional)</label>
        <textarea id="b-focus" value={focus} onChange={(e) => setFocus(e.target.value)} rows={3} placeholder="e.g. AI employment sentiment; Stargate UAE progress; TII model releases" className="w-full rounded-lg border border-border bg-surface p-2 text-sm" data-testid="briefing-focus" />
        <label className="block text-sm font-medium" htmlFor="b-aud">Audience</label>
        <select id="b-aud" value={aud} onChange={(e) => setAud(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"><option value="government">Government leadership</option><option value="investor">Investors</option><option value="research">Research community</option></select>
        <label className="flex items-start gap-2 text-xs text-muted"><input type="checkbox" checked={web} onChange={(e) => setWeb(e.target.checked)} className="mt-0.5 accent-[#0D0D0D]" data-testid="briefing-web" />Add live web research (Perplexity plugin-1722260873 — slower, ~60 s)</label>
        <button type="button" onClick={run} disabled={busy} data-testid="briefing-generate" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0D0D0D] text-sm font-semibold text-white hover:bg-[#2F2F2F] disabled:opacity-60">{busy ? <><Loader2 className="size-4 animate-spin" />Generating… {t}s</> : <><FileText className="size-4" />Generate briefing</>}</button>
        <p className="text-[11px] text-muted">Runs a real OnDemand session (POST /chat/v1/sessions → /query, endpoint predefined-gpt-5.6-luna) grounded on namespace uae_cc_v1. Failures are shown verbatim — no canned text is substituted.</p>
      </div>
      <div className="min-w-0">
        {!res && !busy && <div className="card grid min-h-[320px] place-items-center p-8 text-center">{/* eslint-disable-next-line @next/next/no-img-element */}<div><img src="/illustrations/empty-state.png" alt="" width={160} height={160} loading="lazy" className="mx-auto mb-3 rounded-xl opacity-90" /><p className="text-sm text-muted">Your briefing will appear here.</p></div></div>}
        {busy && <div className="card grid min-h-[320px] place-items-center p-8 text-center" data-testid="briefing-loading">{/* eslint-disable-next-line @next/next/no-img-element */}<div><img src="/illustrations/loading-state.png" alt="" width={160} height={160} loading="lazy" className="mx-auto mb-3 animate-pulse rounded-xl" /><p className="text-sm text-muted">OnDemand agent is drafting the briefing… {t}s</p></div></div>}
        {res && !res.ok && <div role="alert" className="card border border-[#E5E5E5] border-l-[3px] border-l-[#A06A6A] bg-white p-4 text-sm text-[#0D0D0D]" data-testid="briefing-error"><p className="flex items-center gap-2 font-semibold text-[#A06A6A]"><AlertTriangle className="size-4" />Briefing failed at {res.stage}{res.status ? ` (HTTP ${res.status})` : ""}</p><p className="mt-1 text-[#0D0D0D]">{res.error}</p></div>}
        {res?.ok && res.markdown && <article className="card p-6 print:border-0 print:p-0" data-testid="briefing-output">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 print:hidden"><p className="text-xs text-muted">Generated {res.generated_at} · {res.endpointId}{res.pluginIds?.length ? ` + ${res.pluginIds.join(",")}` : ""} · {res.latency_ms} ms · session {res.sessionId}</p>
            <div className="flex gap-1"><button type="button" onClick={() => navigator.clipboard.writeText(res.markdown!)} className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E5E5E5] px-2 text-xs hover:bg-[#F0F0F0]"><Copy className="size-3.5" />Copy</button><button type="button" onClick={() => window.print()} className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E5E5E5] px-2 text-xs hover:bg-[#F0F0F0]"><Printer className="size-3.5" />Print / PDF</button></div></div>
          <p className="mb-3 rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] px-3 py-1.5 text-center text-xs font-medium text-[#5D5D5D]">Concept Demonstration — not an official government system</p>
          <div className="prose-briefing min-w-0 break-words text-[14.5px] leading-relaxed [&_a]:text-[#2563EB] [&_a]:underline [&_code]:break-all [&_code]:whitespace-pre-wrap [&_pre]:overflow-x-auto [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-1.5 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:my-1 [&_ul]:ml-5 [&_ul]:list-disc"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>{res.markdown}</ReactMarkdown></div>
        </article>}
      </div>
    </div>
  );
}
