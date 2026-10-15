"use client";
/**
 * Intelligent UI renderer — root-first statement stream (OnDemand Intelligent UI technical paper):
 *   root/layout statements arrive BEFORE any data statement → the skeleton (every declared slot) mounts on the first rAF commit; each data
 *   statement then fills its slot in place (no reflow of siblings). Hard cap IUI_MAX_STATEMENTS (60).
 *   HtmlView: run-produced HTML ONLY, inside <iframe sandbox=""> (no scripts, no same-origin, no forms) via srcDoc.
 *   Every raster image goes through ODImage (ONE <img> path: lazy, alt, broken-image → monogram fallback, click → the single Lightbox instance).
 */
import { useCallback, useMemo, useState } from "react";
import { Lightbox, type LightboxImage } from "@/components/media/lightbox";
import { safeExternalUrl } from "@/lib/outbound";
import { IUI_MAX_STATEMENTS, type IuiPayload, type IuiStatement } from "@/lib/chat-ui/types";
import "./renderer.css";

type Slot = { id: string; payload: IuiPayload | null };
type Tree = { title?: string; order: string[]; layouts: Map<string, { kind: "col" | "row" | "grid"; children: string[]; cols?: number }>; data: Map<string, IuiPayload>; rootSeen: boolean; truncated: boolean; dataBeforeRoot: boolean };

export function buildTree(statements: IuiStatement[]): Tree {
  const t: Tree = { order: [], layouts: new Map(), data: new Map(), rootSeen: false, truncated: statements.length > IUI_MAX_STATEMENTS, dataBeforeRoot: false };
  for (const s of statements.slice(0, IUI_MAX_STATEMENTS)) {
    if (s.op === "root") { t.rootSeen = true; t.order = s.children; t.title = s.title; }
    else if (s.op === "layout") t.layouts.set(s.id, { kind: s.kind, children: s.children, cols: s.cols });
    else if (s.op === "data") { if (!t.rootSeen) t.dataBeforeRoot = true; t.data.set(s.id, s.payload); }
  }
  return t;
}

export function IntelligentUiRenderer({ statements, live }: { statements: IuiStatement[]; live: boolean }) {
  const tree = useMemo(() => buildTree(statements), [statements]);
  const [lb, setLb] = useState<{ images: LightboxImage[]; index: number } | null>(null);
  const openImage = useCallback((img: LightboxImage) => setLb({ images: [img], index: 0 }), []);
  if (!tree.rootSeen) return null; // nothing mounts before the root statement (root-first contract)
  const render = (id: string, depth = 0): React.ReactNode => {
    const lay = tree.layouts.get(id);
    if (lay) return <div key={id} className={`iui-lay iui-lay--${lay.kind}`} style={lay.kind === "grid" && lay.cols ? { gridTemplateColumns: `repeat(${lay.cols}, minmax(0, 1fr))` } : undefined} data-testid="iui-layout" data-kind={lay.kind}>{lay.children.map((c) => render(c, depth + 1))}</div>;
    const slot: Slot = { id, payload: tree.data.get(id) ?? null };
    return <IuiSlot key={id} slot={slot} live={live} onImage={openImage} />;
  };
  return (
    <section className="iui" data-testid="iui-root" data-live={live ? "true" : "false"} data-statements={Math.min(statements.length, IUI_MAX_STATEMENTS)} data-filled={tree.data.size} aria-label={tree.title ?? "Interactive view"} data-root-first={tree.dataBeforeRoot ? "false" : "true"}>
      {tree.title && <h3 className="iui__title">{tree.title}</h3>}
      {tree.order.map((c) => render(c))}
      {tree.truncated && <p className="iui__warn" role="status">Statement stream truncated at {IUI_MAX_STATEMENTS}.</p>}
      {lb && <Lightbox images={lb.images} index={lb.index} onIndex={(i) => setLb((s) => (s ? { ...s, index: i } : s))} onClose={() => setLb(null)} />}
    </section>
  );
}

function IuiSlot({ slot, live, onImage }: { slot: Slot; live: boolean; onImage: (img: LightboxImage) => void }) {
  const p = slot.payload;
  if (!p) return <div className="iui-slot iui-slot--skeleton" data-testid="iui-slot" data-slot={slot.id} data-filled="false" aria-busy={live || undefined}><span className="iui-skel iui-skel--t" /><span className="iui-skel" /><span className="iui-skel iui-skel--s" /></div>;
  return <div className="iui-slot" data-testid="iui-slot" data-slot={slot.id} data-filled="true" data-type={p.type}><Payload p={p} onImage={onImage} /></div>;
}

const usd = (n: number | null) => n == null ? "—" : n >= 1e9 ? `$${(n / 1e9).toFixed(n % 1e9 ? 1 : 0)}B` : n >= 1e6 ? `$${Math.round(n / 1e6)}M` : `$${n.toLocaleString()}`;

function Payload({ p, onImage }: { p: IuiPayload; onImage: (img: LightboxImage) => void }) {
  switch (p.type) {
    case "kpi-cards":
      return <div className="iui-kpis" data-testid="iui-kpi-cards">{p.items.map((k, i) => <div key={i} className={`iui-kpi iui-kpi--${k.tone ?? "flat"}`}><span className="iui-kpi__l">{k.label}</span><span className="iui-kpi__v">{k.value}</span>{k.delta && <span className="iui-kpi__d">{k.delta}</span>}</div>)}</div>;
    case "comparison-table":
      return (
        <div className="iui-tablewrap" data-testid="iui-comparison-table"><table className="iui-table">{p.caption && <caption>{p.caption}</caption>}
          <thead><tr>{p.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
          <tbody>{p.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={typeof c === "number" ? "iui-num" : undefined}>{String(c)}</td>)}</tr>)}</tbody>
        </table></div>
      );
    case "funding-timeline": {
      const max = Math.max(1, ...p.rounds.map((r) => r.amountUsd ?? 0));
      return (
        <div className="iui-tl" data-testid="iui-funding-timeline"><p className="iui-h">{p.company}</p>
          <ol className="iui-tl__list">{p.rounds.map((r, i) => { const href = safeExternalUrl(r.sourceUrl); return (
            <li key={i} className="iui-tl__row"><span className="iui-tl__date">{r.date.slice(0, 7)}</span><span className="iui-tl__bar" style={{ width: `${Math.max(6, ((r.amountUsd ?? 0) / max) * 100)}%` }} aria-hidden /><span className="iui-tl__lbl">{href ? <a href={href} target="_blank" rel="noopener noreferrer">{r.round}</a> : r.round} · {usd(r.amountUsd)}</span></li>
          ); })}</ol>
        </div>
      );
    }
    case "sentiment-breakdown":
      return (
        <div className="iui-sent" data-testid="iui-sentiment-breakdown"><p className="iui-h">{p.company} <strong className="iui-sent__score">{p.score >= 0 ? "+" : ""}{p.score.toFixed(2)}</strong></p>
          <ul className="iui-sent__f">{p.factors.map((f) => <li key={f.label}><span className="iui-sent__fl">{f.label} <em>{Math.round(f.weight * 100)}%</em></span><span className="iui-sent__track"><span className="iui-sent__fill" style={{ width: `${Math.round(Math.max(0, Math.min(1, f.value)) * 100)}%` }} /></span><span className="iui-sent__fv">{f.value.toFixed(2)}</span></li>)}</ul>
          {p.sources && p.sources.length > 0 && <ul className="iui-sent__src">{p.sources.map((s) => <li key={s.channel}>{s.channel} · {s.count}</li>)}</ul>}
        </div>
      );
    case "country-profile":
      return (
        <div className="iui-country" data-testid="iui-country-profile">
          <div className="iui-country__head">{p.flagUrl && <ODImage src={p.flagUrl} alt={`${p.country} flag`} size={28} onOpen={onImage} />}<p className="iui-h">{p.country}</p></div>
          {p.imageUrl && <div className="iui-country__img"><ODImage src={p.imageUrl} alt={p.imageAlt ?? p.country} size={120} onOpen={onImage} /></div>}
          <dl className="iui-country__facts">{p.facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
        </div>
      );
    case "workbook-preview":
      return <div className="iui-wb" data-testid="iui-workbook-preview"><p className="iui-h">{p.title}{p.version != null && <span className="iui-pill">v{p.version}</span>}</p><pre className="iui-wb__pre">{p.markdown}</pre></div>;
    case "html":
      return <HtmlView html={p.html} title={p.title} height={p.height} />;
    default:
      return null;
  }
}

/** Sandboxed HTML view: `sandbox=""` disables scripts, forms, popups, same-origin access; srcDoc keeps the bytes off the network. */
export function HtmlView({ html, title, height }: { html: string; title?: string; height?: number }) {
  return (
    <figure className="iui-html" data-testid="iui-html-view">
      {title && <figcaption className="iui-h">{title}</figcaption>}
      <iframe className="iui-html__frame" title={title ?? "Run-produced HTML"} sandbox="" referrerPolicy="no-referrer" loading="lazy" srcDoc={html} style={height ? { height } : undefined} data-testid="iui-html-frame" />
    </figure>
  );
}

/** The ONE image component in the Intelligent UI: lazy, decoded async, broken-image → monogram tile (never the browser's broken-image icon). */
export function ODImage({ src, alt, size, onOpen }: { src: string; alt: string; size: number; onOpen?: (img: LightboxImage) => void }) {
  const [broken, setBroken] = useState(false);
  const safe = src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:") ? src : safeExternalUrl(src);
  if (!safe || broken) return <span className="iui-img iui-img--fallback" style={{ width: size, height: size }} role="img" aria-label={alt} data-testid="od-image" data-fallback="true">{(alt.trim()[0] ?? "?").toUpperCase()}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img className="iui-img" src={safe} alt={alt} width={size} height={size} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} data-testid="od-image" data-fallback="false" />;
  return onOpen ? <button type="button" className="iui-img__btn" onClick={() => onOpen({ src: safe, alt })} aria-label={`Open image: ${alt}`}>{img}</button> : img;
}
