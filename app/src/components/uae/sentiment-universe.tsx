"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, ExternalLink, X } from "lucide-react";

export type U = { id: string; text: string; author?: string; outlet?: string; platform: string; url?: string; url_verified?: boolean; date?: string; age: number | null; org_ids: string[]; orgNames: string[]; topic_cluster: string; location_evidence: string; lane?: string; sentiment_class: string; class_confidence?: number; rationale?: string; x: number; y: number; mentions: number; is_verbatim?: boolean };
type Win = "24h" | "7d" | "30d" | "all";
const WIN_DAYS: Record<Win, number> = { "24h": 1, "7d": 7, "30d": 30, all: 100000 };

/**
 * Sentiment Universe — every bubble is one attributable public statement.
 *   size = volume (times the statement surfaced across research sources, de-duplicated) · colour = 7-class taxonomy
 *   position = semantic similarity (TF-IDF → SVD → t-SNE over statement text) · border thickness = classifier confidence
 * Playback replays the sample by publication date (24h / 7d / 30d windows ending at each playhead day). Undated items only appear in "All".
 */
export function SentimentUniverse({ items, classes, colors, topics, orgs, initialOrg }: { items: U[]; classes: string[]; colors: Record<string, string>; topics: string[]; orgs: { id: string; name: string }[]; initialOrg?: string }) {
  const [win, setWin] = useState<Win>("all"); const [play, setPlay] = useState(false); const [head, setHead] = useState(0); // head = days back from as-of (0 = 2026-10-21)
  const [cls, setCls] = useState<string[]>([]); const [topic, setTopic] = useState("all"); const [org, setOrg] = useState(initialOrg ?? "all"); const [geo, setGeo] = useState(false); const [lane, setLane] = useState<"all" | "UAE-topic" | "global-discourse">("all");
  const [hover, setHover] = useState<U | null>(null); const [sel, setSel] = useState<U | null>(null); const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const box = useRef<HTMLDivElement>(null);
  const maxBack = 400;
  useEffect(() => { if (!play) return; if (win === "all") setWin("30d"); const t = setInterval(() => setHead((h) => { if (h <= 0) { setPlay(false); return 0; } return Math.max(0, h - (win === "24h" ? 1 : win === "7d" ? 3 : 10)); }), 450); return () => clearInterval(t); }, [play, win]);
  const startPlay = () => { if (head <= 0) setHead(maxBack); setPlay(true); };
  const visible = useMemo(() => items.filter((r) => {
    if (cls.length && !cls.includes(r.sentiment_class)) return false;
    if (topic !== "all" && r.topic_cluster !== topic) return false;
    if (org !== "all" && !r.org_ids.includes(org)) return false;
    if (geo && r.location_evidence !== "EXPLICIT_UAE") return false;
    if (lane !== "all" && (r.lane ?? "UAE-topic") !== lane) return false;
    if (win !== "all") { if (r.age == null) return false; const lo = head, hi = head + WIN_DAYS[win]; if (r.age < lo || r.age > hi) return false; }
    return true;
  }), [items, cls, topic, org, geo, win, head, lane]);
  const counts = useMemo(() => { const m: Record<string, number> = {}; for (const r of visible) m[r.sentiment_class] = (m[r.sentiment_class] ?? 0) + 1; return m; }, [visible]);
  const W = 1000, H = 620, pad = 40;
  const radius = (r: U) => 7 + Math.sqrt(r.mentions) * 5;
  const headDate = new Date(Date.UTC(2026, 9, 21) - head * 86400000).toISOString().slice(0, 10);
  const dated = items.filter((r) => r.age != null).length;
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]" data-testid="sentiment-universe">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2" role="toolbar" aria-label="Universe controls">
          <div className="inline-flex overflow-hidden rounded-lg border border-border" role="group" aria-label="Time window">{(["24h", "7d", "30d", "all"] as Win[]).map((w) => <button key={w} type="button" onClick={() => { setWin(w); if (w === "all") { setPlay(false); setHead(0); } }} aria-pressed={win === w} data-testid={`win-${w}`} className={`h-8 px-3 text-xs ${win === w ? "bg-[#147B58] text-white" : "text-muted hover:bg-surface-2"}`}>{w}</button>)}</div>
          <button type="button" onClick={() => (play ? setPlay(false) : startPlay())} data-testid="playback" className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs hover:bg-surface-2">{play ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}{play ? "Pause" : "Play"}</button>
          {win !== "all" && <label className="flex items-center gap-2 text-xs text-muted">window ends <input type="range" min={0} max={maxBack} value={maxBack - head} onChange={(e) => { setPlay(false); setHead(maxBack - Number(e.target.value)); }} aria-label="Playhead" className="w-36 accent-[#147B58]" /><span className="tabular-nums text-foreground" data-testid="playhead">{headDate}</span></label>}
          <select value={lane} onChange={(e) => setLane(e.target.value as "all" | "UAE-topic" | "global-discourse")} aria-label="Lane" data-testid="filter-lane" className="h-8 rounded-lg border border-border bg-surface px-2 text-xs"><option value="UAE-topic">Lane: UAE-topic</option><option value="global-discourse">Lane: global discourse</option><option value="all">Both lanes</option></select>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic" data-testid="filter-topic" className="h-8 rounded-lg border border-border bg-surface px-2 text-xs"><option value="all">All topics</option>{topics.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <select value={org} onChange={(e) => setOrg(e.target.value)} aria-label="Organisation" data-testid="filter-org" className="h-8 max-w-[180px] rounded-lg border border-border bg-surface px-2 text-xs"><option value="all">All organisations</option>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
          <label className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2 text-xs" title="Show only statements whose author/speaker is explicitly in the UAE"><input type="checkbox" checked={geo} onChange={(e) => setGeo(e.target.checked)} data-testid="filter-geo" className="accent-[#147B58]" />Explicit-UAE only</label>
          <span className="ml-auto text-xs tabular-nums text-muted" data-testid="visible-count">{visible.length} / {items.length} statements</span>
        </div>
        <div className="mb-2 flex flex-wrap gap-1" role="group" aria-label="Classes">{classes.map((k) => <button key={k} type="button" onClick={() => setCls((c) => c.includes(k) ? c.filter((x) => x !== k) : [...c, k])} aria-pressed={cls.includes(k)} data-testid="class-filter" className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] ${cls.length && !cls.includes(k) ? "opacity-40" : ""} ${cls.includes(k) ? "border-foreground" : "border-border"}`}><span className="size-2.5 rounded-full" style={{ background: colors[k] }} />{k} <span className="tabular-nums text-muted">{counts[k] ?? 0}</span></button>)}</div>
        <div ref={box} className="relative overflow-hidden rounded-2xl border border-border bg-[#0F1419]" onMouseMove={(e) => { const r = box.current?.getBoundingClientRect(); if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top }); }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/uae/sections/sentiment-universe.webp" srcSet="/brand/uae/sections/sentiment-universe.webp 1x, /brand/uae/sections/sentiment-universe@2x.webp 2x" alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25" />
          <svg viewBox={`0 0 ${W} ${H}`} className="relative block h-auto w-full" role="img" aria-label={`Sentiment Universe: ${visible.length} statements plotted by semantic similarity`} data-testid="universe-svg">
            {items.map((r) => { const on = visible.includes(r); const cx = pad + r.x * (W - 2 * pad), cy = pad + r.y * (H - 2 * pad); const conf = r.class_confidence ?? 0.5;
              return <circle key={r.id} cx={cx} cy={cy} r={radius(r)} fill={colors[r.sentiment_class] ?? "#888"} fillOpacity={on ? 0.78 : 0.06} stroke={on ? "#ECE6DA" : "transparent"} strokeOpacity={0.35 + conf * 0.6} strokeWidth={0.5 + conf * 3}
                style={{ transition: "fill-opacity .35s, r .35s", cursor: on ? "pointer" : "default" }} data-testid={on ? "bubble" : undefined} data-class={r.sentiment_class}
                onMouseEnter={() => on && setHover(r)} onMouseLeave={() => setHover(null)} onClick={() => on && setSel(r)} tabIndex={on ? 0 : -1} onKeyDown={(e) => { if (on && (e.key === "Enter" || e.key === " ")) setSel(r); }} aria-label={on ? `${r.sentiment_class}: ${r.text.slice(0, 80)}` : undefined} />; })}
          </svg>
          {hover && <div className="pointer-events-none absolute z-10 w-72 rounded-lg border border-white/15 bg-[#12171D]/95 p-3 text-xs text-[#ECE6DA] shadow-xl" style={{ left: Math.min(pos.x + 14, (box.current?.clientWidth ?? 600) - 300), top: Math.max(8, pos.y - 20) }} data-testid="hover-evidence">
            <p className="flex items-center gap-1.5 font-semibold"><span className="size-2.5 rounded-full" style={{ background: colors[hover.sentiment_class] }} />{hover.sentiment_class} · {Math.round((hover.class_confidence ?? 0) * 100)}%</p>
            <p className="mt-1 leading-snug">{hover.is_verbatim ? "“" : ""}{hover.text}{hover.is_verbatim ? "”" : ""}</p>
            <p className="mt-1.5 text-[#A9ADB3]">{hover.author && hover.author !== "unattributed" ? hover.author : "unattributed"} · {hover.outlet || hover.platform} · {hover.date || "undated"} · ×{hover.mentions}</p>
          </div>}
          <div className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-[#A9ADB3]">size = volume · colour = class · position = semantic similarity · border = confidence</div>
        </div>
        <p className="mt-2 text-[11px] text-muted">{dated} of {items.length} statements carry a publication date; undated ones appear only in “all”. Geography filter uses EXPLICIT_UAE evidence only — UAE_TOPIC_ONLY and UNKNOWN are never mapped to a place.</p>
      </div>
      <aside className="min-w-0 space-y-3">
        <div className="card p-4" data-testid="evidence-panel">
          {sel ? <>
            <div className="flex items-start justify-between gap-2"><p className="flex items-center gap-1.5 text-sm font-semibold"><span className="size-3 rounded-full" style={{ background: colors[sel.sentiment_class] }} />{sel.sentiment_class}</p><button type="button" onClick={() => setSel(null)} aria-label="Close evidence" className="text-muted hover:text-foreground"><X className="size-4" /></button></div>
            <blockquote className="mt-2 border-l-2 border-[var(--uae-gold)] pl-3 text-sm leading-relaxed">{sel.text}</blockquote>
            <dl className="mt-3 grid grid-cols-[86px_1fr] gap-x-2 gap-y-1 text-xs"><dt className="text-muted">Author</dt><dd>{sel.author || "unattributed"}</dd><dt className="text-muted">Outlet</dt><dd>{sel.outlet || "—"} ({sel.platform})</dd><dt className="text-muted">Date</dt><dd>{sel.date || "undated"}</dd><dt className="text-muted">Topic</dt><dd>{sel.topic_cluster}</dd><dt className="text-muted">Location</dt><dd>{sel.location_evidence}</dd><dt className="text-muted">Confidence</dt><dd>{Math.round((sel.class_confidence ?? 0) * 100)}% — {sel.rationale}</dd><dt className="text-muted">Organisations</dt><dd>{sel.orgNames.join(", ") || "—"}</dd><dt className="text-muted">Verbatim</dt><dd>{sel.is_verbatim ? "yes" : "paraphrase"}</dd></dl>
            {sel.url && sel.url_verified ? <a href={sel.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-green-ink)] hover:underline" data-testid="evidence-source">Open source <ExternalLink className="size-3" /></a> : <p className="mt-3 text-xs text-muted">Source URL not verified — link disabled.</p>}
          </> : <p className="text-sm text-muted">Hover a bubble for evidence; click to pin it here with its source link.</p>}
        </div>
      </aside>
    </div>
  );
}
