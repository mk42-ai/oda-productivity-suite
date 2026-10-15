"use client";
/**
 * Verified Deliverables shelf — reference contract (canvas-screenshot-1097x307.png):
 *   serif header "N verified deliverables" + muted "run completed in 7m 32s" · right-aligned gold "Download final document" CTA (download icon)
 *   two equal-width white cards on a cream ground (1440) / single-column stack (390, no horizontal overflow)
 *   card: title · pills [format] · [vN] · green "● ✓ verified" · raw-markdown preview as LITERAL text (ellipsis-truncated)
 *         optional gold "Download" button · optional collapsed "▶ Version history (N)" toggle → v1…vN rows, selecting one swaps the preview
 * Fed ONLY by the run's CUSTOM ondemand.deliverables frame (through the shared rAF store) — nothing is fetched here.
 */
import { useId, useMemo, useState } from "react";
import { Download, Check, ChevronRight } from "lucide-react";
import type { Deliverable, DeliverablesShelfData } from "@/lib/chat-ui/types";
import "./deliverables-shelf.css";

export function formatRunDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000)); const m = Math.floor(s / 60); const r = s % 60;
  if (m >= 60) { const h = Math.floor(m / 60); return `${h}h ${String(m % 60).padStart(2, "0")}m`; }
  return m > 0 ? `${m}m ${String(r).padStart(2, "0")}s` : `${r}s`;
}
/** Collapse a markdown body to ONE line of literal text (the preview is never rendered as markdown). */
export const previewLine = (md: string) => md.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean).join(" ");

const sameOrigin = (u: string | null | undefined) => !!u && (u.startsWith("/") || u.startsWith("data:") || u.startsWith("blob:") || (typeof window !== "undefined" && u.startsWith(window.location.origin)));

export function DeliverablesShelf({ data }: { data: DeliverablesShelfData }) {
  const n = data.items.length;
  if (!n) return null;
  const finalUrl = sameOrigin(data.finalDownloadUrl) ? data.finalDownloadUrl! : null;
  return (
    <section className="dlv" data-testid="deliverables-shelf" data-count={n} aria-label="Verified deliverables">
      <header className="dlv__head">
        <div className="dlv__head-left">
          <h3 className="dlv__title" data-testid="deliverables-title">{n} verified deliverable{n === 1 ? "" : "s"}</h3>
          {data.durationMs != null && <p className="dlv__sub" data-testid="deliverables-duration">run completed in {formatRunDuration(data.durationMs)}</p>}
        </div>
        {finalUrl && (
          <a className="dlv__cta" href={finalUrl} download={data.finalDownloadName ?? undefined} data-testid="deliverables-final-download">
            <Download className="size-4" aria-hidden strokeWidth={2.2} /> Download final document
          </a>
        )}
      </header>
      <div className="dlv__grid" data-testid="deliverables-grid">
        {data.items.map((d) => <DeliverableCard key={d.id} d={d} />)}
      </div>
    </section>
  );
}

function DeliverableCard({ d }: { d: Deliverable }) {
  const versions = useMemo(() => (d.versions ?? []).slice().sort((a, b) => a.version - b.version), [d.versions]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number>(d.version);
  const listId = useId();
  const cur = versions.find((v) => v.version === selected);
  const preview = previewLine(cur?.preview ?? d.preview);
  const dl = sameOrigin(d.downloadUrl) ? d.downloadUrl! : null;
  const dlName = `${d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-v${selected}.md`;
  return (
    <article className="dlv-card" data-testid="deliverable-card" data-deliverable-id={d.id} data-version={selected}>
      <h4 className="dlv-card__title" data-testid="deliverable-title">{d.title}</h4>
      <div className="dlv-card__pills" data-testid="deliverable-pills">
        <span className="dlv-pill" data-testid="deliverable-format">{d.format}</span>
        <span className="dlv-pill" data-testid="deliverable-version">v{selected}</span>
        {d.verified && <span className="dlv-pill dlv-pill--ok" data-testid="deliverable-verified"><i className="dlv-dot" aria-hidden />{" "}<Check className="size-3" aria-hidden strokeWidth={3} /> verified</span>}
      </div>
      {/* LITERAL text — never markdown-rendered; CSS clamps to two lines with an ellipsis. */}
      <p className="dlv-card__preview" data-testid="deliverable-preview" title={preview}>{preview}</p>
      {(dl || versions.length > 0) && (
        <div className="dlv-card__foot">
          {dl && <a className="dlv-btn" href={cur?.contentUrl && sameOrigin(cur.contentUrl) ? cur.contentUrl : dl} download={dlName} data-testid="deliverable-download"><Download className="size-3.5" aria-hidden strokeWidth={2.2} /> Download</a>}
          {versions.length > 0 && (
            <button type="button" className="dlv-vh" aria-expanded={open} aria-controls={listId} data-testid="deliverable-history-toggle" onClick={() => setOpen((o) => !o)}>
              <ChevronRight className={`size-3.5 dlv-vh__chev${open ? " dlv-vh__chev--open" : ""}`} aria-hidden /> Version history ({Math.max(0, versions.filter((v) => v.version !== d.version).length)})
            </button>
          )}
        </div>
      )}
      {open && versions.length > 0 && (
        <ul id={listId} className="dlv-versions" data-testid="deliverable-history" role="listbox" aria-label={`${d.title} versions`}>
          {versions.map((v) => (
            <li key={v.version}>
              <button type="button" role="option" aria-selected={v.version === selected} className={`dlv-versions__row${v.version === selected ? " dlv-versions__row--active" : ""}`} data-testid="deliverable-history-row" data-version={v.version} onClick={() => setSelected(v.version)}>
                <span className="dlv-pill">v{v.version}</span>
                <span className="dlv-versions__txt">{previewLine(v.preview)}</span>
                {v.at && <time className="dlv-versions__at" dateTime={v.at}>{v.at.slice(11, 16)} UTC</time>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
