import Link from "next/link";
import { CLASS_COLOR, TYPE_LABEL, type Org, type Src } from "@/lib/uae/data";
// Lane split (QA cycle 9): OrgLogo lives in ./org-logo (Lane C — logos), SourceLink in ./source-link (Lane A — link health); both re-exported here so existing imports keep working.
export { OrgLogo } from "./org-logo";
export { SourceLink } from "./source-link";
import { cn } from "@/lib/utils";

export function TypeChip({ type }: { type: Org["type"] }) {
  const tone: Record<string, string> = { company: "bg-[#F0F0F0] text-[#0D0D0D]", subsidiary: "bg-[#F9F9F9] border border-[#E5E5E5] text-[#0D0D0D]", government: "bg-[#ECECEC] text-[#0D0D0D]", university: "bg-[#F0F0F0] text-[#0D0D0D]", "research centre": "bg-[#F0F0F0] text-[#0D0D0D]" };
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", tone[type])} data-testid="type-chip">{TYPE_LABEL[type]}</span>;
}
export function ConfidenceMeter({ value, label = "confidence" }: { value?: number | null; label?: string }) {
  const v = Math.max(0, Math.min(1, value ?? 0)); const pct = Math.round(v * 100);
  const color = v >= 0.75 ? "#0D0D0D" : v >= 0.55 ? "#737373" : "#A3A3A3";
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted" title={`${label} ${pct}%`} data-testid="confidence">
      <span className="relative h-1.5 w-14 overflow-hidden rounded-full bg-[#ECECEC]"><span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: color }} /></span>
      <span className="tabular-nums">{pct}%</span> <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
export function Unavailable({ what }: { what?: string }) { return <span className="rounded border border-dashed border-border-strong px-1.5 py-0.5 text-[11px] text-muted" data-testid="unavailable">unavailable{what ? ` · ${what}` : ""}</span>; }
export function hostOf(u?: string | null) { try { return u ? new URL(u).hostname.replace(/^www\./, "") : ""; } catch { return ""; } }
/** Briefing text with [n] citation indices rendered as superscript links into the org's sources. */
export function CitedText({ text, sources }: { text?: string; sources?: Src[] }) {
  if (!text) return <Unavailable what="briefing" />;
  const parts = text.split(/(\[\d+(?:,\s*\d+)*\])/g);
  return <>{parts.map((p, i) => { const m = p.match(/^\[(\d+(?:,\s*\d+)*)\]$/); if (!m) return <span key={i}>{p}</span>;
    return <sup key={i} className="mx-0.5">{m[1].split(/,\s*/).map((n) => { const s = sources?.find((x) => String(x.n) === n); return s?.url ? <a key={n} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] hover:underline" title={s.title || hostOf(s.url)}>[{n}]</a> : <span key={n} className="text-muted" title="source not verified">[{n}]</span>; })}</sup>; })}</>;
}
export function ClassDot({ k, size = 10 }: { k: string; size?: number }) { return <span aria-hidden className="inline-block shrink-0 rounded-full border border-[#737373]" style={{ width: size, height: size, background: CLASS_COLOR[k] ?? "#A3A3A3" }} />; }
export function SectionHeader({ title, lede, image: _image, eyebrow, children }: { title: string; lede?: string; image?: string; eyebrow?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 py-2" data-testid="section-header">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#737373]">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-[#0D0D0D] sm:text-[28px]">{title}</h1>
        {lede && <p className="mt-2 text-sm text-[#5D5D5D] sm:text-[15px]">{lede}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}
export function Stat({ label, value, sub, href }: { label: string; value: React.ReactNode; sub?: React.ReactNode; href?: string }) {
  const body = (<><p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-[#0D0D0D]">{value}</p>{sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}</>);
  return href ? <Link href={href} className="card block p-4 transition-colors hover:border-[#D4D4D4]" data-testid="stat">{body}</Link> : <div className="card p-4" data-testid="stat">{body}</div>;
}
export function Panel({ title, action, children, className, testId }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; testId?: string }) {
  return (
    <section id={testId} className={cn("card min-w-0 p-4 sm:p-5 scroll-mt-16", className)} data-testid={testId}>
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold tracking-tight">{title}</h2>{action}</div>
      {children}
    </section>
  );
}
