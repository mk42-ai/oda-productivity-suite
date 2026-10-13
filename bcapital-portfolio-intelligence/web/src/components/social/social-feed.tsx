"use client";
/**
 * B Social — social-source posts with source-domain badges, original media when available,
 * local reactions (start at 0 — no fabricated engagement), and pinned B Capital Agent takeaways.
 * Generated hero, profile-cover, empty-state and avatar-ring artwork is deliberately not used.
 * Sector tabs page through GET /api/social/social-feed; the "Ask B Social" panel streams Cerebras Qwen 3.8 from POST /api/social/ask.
 */
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Bot, Heart, Lightbulb, PartyPopper, Pin, Send, Sparkles, UserPlus, Check, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { SECTOR_THEMES, SECTOR_KEYS, sectorTheme, faviconUrl, PLATFORM_LABEL, PLATFORM_DOMAIN } from "@/lib/social-sectors";
import { BrandLogo } from "@/components/brand/logo";
import { isPublicSocialPost, SOCIAL_PROVIDERS, type SocialProviderState } from "@/lib/social-content";
import { canonicalOriginalUrl, safeExternalUrl, stopOutbound } from "@/lib/outbound";
import "./social.css";

export type FeedPost = {
  author_handle?: string | null; provider_native_id?: string | null; subreddit?: string | null;
  id: string; platform: string; source_domain: string | null; author: string | null; text: string; url: string | null; image: string | null; posted_at: string | null;
  company_slug: string | null; company: string | null; sector: string; company_domain: string | null; sector_image?: string; top_comments?: string[];
  agent_takeaway: { author: string; text: string | null; model: string; pinned: boolean } | null;
  provenance?: { kind: string; policy_version: string; provider: string; native_id: string };
  media?: { type: "image" | "video"; url: string; alt?: string; mime?: string }[];
  author_avatar?: string | null;
  verification?: "verified" | "unverified";
};
export type Suggestion = { id: string; name: string; role: string; company: string; sector: string };
export type Story = { id: string; name: string; company: string; sector: string };
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const publishedTime = (d: string | null) => { if (!d || !Number.isFinite(Date.parse(d))) return null; return new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC"; };

export function Avatar({ name, sector, size = 44 }: { name: string; sector: string; size?: number }) {
  return (
    <span className="bs-avatar" style={{ width: size, height: size }} data-testid="bs-avatar">
      <span className="bs-avatar__core" style={{ fontSize: Math.round(size * 0.34) }}>{initials(name)}</span>
    </span>
  );
}

function SourceBadge({ p }: { p: FeedPost }) {
  const domain = p.source_domain ?? PLATFORM_DOMAIN[p.platform] ?? null; const [fail, setFail] = useState(false); const src = faviconUrl(domain);
  return (
    <span className="bs-source" data-testid="post-source-badge" data-platform={p.platform} data-domain={domain ?? ""} title={domain ?? p.platform}>
      {src && !fail ? <img src={src} alt="" width={14} height={14} onError={() => setFail(true)} data-testid="post-favicon" /> : <span className="bs-source__dot" />}
      {PLATFORM_LABEL[p.platform] ?? p.platform}{domain && p.platform === "news" ? ` · ${domain}` : ""}
    </span>
  );
}

function CompanyLogoMini({ p }: { p: FeedPost }) {
  const [fail, setFail] = useState(false); const src = p.author_avatar || faviconUrl(p.company_domain);
  return src && !fail ? <img className="bs-colo" src={src} alt="" width={20} height={20} onError={() => setFail(true)} data-testid="post-company-logo" /> : <span className="bs-colo bs-colo--mono" style={{ background: "var(--brand-green-soft)", color: "var(--brand-green-ink)" }}>{initials(p.company ?? "B")}</span>;
}

const REACTIONS = [{ k: "like", icon: Heart, label: "Like" }, { k: "celebrate", icon: PartyPopper, label: "Celebrate" }, { k: "insight", icon: Lightbulb, label: "Insightful" }] as const;
function Reactions({ id }: { id: string }) {
  const [mine, setMine] = useState<string | null>(null);
  useEffect(() => { try { setMine(localStorage.getItem(`bsocial.react.${id}`)); } catch {} }, [id]);
  const pick = (k: string) => { const v = mine === k ? null : k; setMine(v); try { if (v) localStorage.setItem(`bsocial.react.${id}`, v); else localStorage.removeItem(`bsocial.react.${id}`); } catch {} };
  return (
    <div className="bs-reactions" role="group" aria-label="Reactions" data-testid="post-reactions">
      {REACTIONS.map(({ k, icon: I, label }) => <button key={k} type="button" aria-pressed={mine === k} onClick={() => pick(k)}><I className="size-3.5" aria-hidden /> {label}{mine === k ? " · 1" : ""}</button>)}
    </div>
  );
}

function SourceMedia({ media, canonical, author }: { media: { type: "image" | "video"; url: string; alt?: string; mime?: string }; canonical: string | null; author: string }) {
  const [failed, setFailed] = useState(false);
  const safe = /^https:\/\//i.test(media.url) && !/\/(?:fallbacks|media)\/(?:hero-cover|sector-|cover-|avatar-ring|empty-state|stories-strip)/.test(media.url);
  if (!safe || failed) return <p className="bs-media-unavailable" role="status">Original media unavailable. {canonical ? <><a href={canonical} target="_blank" rel="noopener noreferrer" onClick={stopOutbound} data-testid="media-original-link">View the original post</a>.</> : null}</p>;
  if (media.type === "video") return <figure className="bs-post__media"><video controls preload="metadata" aria-label={media.alt || `Video shared by ${author}`} onError={() => setFailed(true)} data-testid="post-video"><source src={media.url} type={media.mime} />{canonical ? <a href={canonical} target="_blank" rel="noopener noreferrer" onClick={stopOutbound}>View video on the original post</a> : null}</video></figure>;
  return <figure className="bs-post__media"><img src={`/api/img?u=${encodeURIComponent(media.url)}&w=720`} alt={media.alt || `Media shared by ${author}`} loading="lazy" decoding="async" onError={() => setFailed(true)} data-testid="post-image" data-kind="source" /></figure>;
}

export function PostCard({ p }: { p: FeedPost }) {
  const t = sectorTheme(p.sector);
  if (!isPublicSocialPost(p)) return null;
  const published = publishedTime(p.posted_at);
  const original = canonicalOriginalUrl(p); // native-data URL only — no profile/search/proxy/homepage substitution
  const media = p.media?.length ? p.media : p.image ? [{ type: "image" as const, url: p.image }] : [];
  return (
    <article className="bs-post" data-testid="social-post" data-verification={p.verification ?? "verified"} data-platform={p.platform} data-sector={p.sector} data-provenance={p.provenance?.kind} style={{ "--bs-from": t.from, "--bs-to": t.to, "--bs-ink": t.ink, "--bs-soft": t.soft } as CSSProperties}>
      <header className="bs-post__head">
        <CompanyLogoMini p={p} />
        <div className="min-w-0 flex-1">
          <p className="bs-post__author">{p.company_slug ? <Link href={`/company/${p.company_slug}`}>{p.company}</Link> : (p.company ?? "Community")} <span className="bs-post__via">· {p.author ?? ""}</span></p>
          <p className="bs-post__meta"><SourceBadge p={p} />{p.verification === "unverified" && <span className="bs-unverified" data-testid="unverified-badge" title="Restored from the earlier research feed: native post link, but no provider receipt was captured">Unverified source</span>} {published ? (original ? <a className="bs-post__time" href={original} target="_blank" rel="noopener noreferrer" onClick={stopOutbound} data-testid="post-time-link"><time dateTime={p.posted_at!}>{published}</time></a> : <time dateTime={p.posted_at!}>{published}</time>) : <span>Publication time unavailable</span>} <span className="bs-post__sector" style={{ color: t.ink, background: t.soft }}>{t.label}</span></p>
        </div>
      </header>
      <p className="bs-post__text">{p.text}</p>
      {p.top_comments && p.top_comments.length > 0 && <ul className="bs-post__comments">{p.top_comments.slice(0, 2).map((c, i) => <li key={i}>“{c}”</li>)}</ul>}
      {media.map((item, i) => <SourceMedia key={`${item.url}-${i}`} media={item} canonical={original} author={p.author || "the author"} />)}
      <div className="bs-post__bar"><Reactions id={p.id} />{original ? <a className="bs-post__open" href={original} target="_blank" rel="noopener noreferrer" onClick={stopOutbound} data-testid="post-original-link" data-expected={original}>Open original <ExternalLink className="size-3" aria-hidden /></a> : <span className="bs-post__open bs-post__open--na" data-testid="original-unavailable" aria-disabled="true">Original source unavailable</span>}</div>
      {p.agent_takeaway?.text && <div className="bs-takeaway" data-testid="agent-takeaway" data-pinned="true">
        <span className="bs-takeaway__av"><Bot className="size-4" aria-hidden /></span>
        <div><p className="bs-takeaway__who"><Pin className="size-3" aria-hidden /> B Capital Agent <span>· AI-generated takeaway</span></p>
          <p className="bs-takeaway__text"><LinkedText text={p.agent_takeaway.text} /></p></div>
      </div>}
    </article>
  );
}


type AskSource = { title: string; url: string; domain: string };
/** Renders model text with safe outbound anchors: markdown [label](url), bare URLs, and numbered [n] markers mapped to the exact
 * Perplexity plugin_sources[n-1] URL. Anything that fails safeExternalUrl (perplexity.ai, search engines, redirect wrappers,
 * internal routes) is rendered as plain text — never substituted with another link. */
export function LinkedText({ text, sources = [] }: { text: string | null | undefined; sources?: AskSource[] }) {
  if (!text) return null;
  const out: React.ReactNode[] = []; const re = /\[([^\]\n]{1,200})\]\((https?:\/\/[^\s)]+)\)|\[(\d{1,2})\]|(https?:\/\/[^\s<>()\]]+[^\s<>()\].,;:!?'"])/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2]) { const u = safeExternalUrl(m[2]); out.push(u ? <a key={k++} href={u} target="_blank" rel="noopener noreferrer" onClick={stopOutbound} data-testid="ask-link">{m[1]}</a> : m[1]); }
    else if (m[3]) { const n = Number(m[3]); const src = sources[n - 1]; const u = src ? safeExternalUrl(src.url) : null;
      out.push(u ? <a key={k++} className="bs-cite" href={u} target="_blank" rel="noopener noreferrer" onClick={stopOutbound} data-testid="ask-citation" data-n={n} data-expected={u} title={src!.title || src!.domain}>[{n}]</a> : `[${n}]`); }
    else if (m[4]) { const u = safeExternalUrl(m[4]); out.push(u ? <a key={k++} href={u} target="_blank" rel="noopener noreferrer" onClick={stopOutbound} data-testid="ask-link">{m[4]}</a> : m[4]); }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

function AskBSocial({ sector }: { sector: string }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<{ role: "user" | "bot"; text: string; ms?: number; err?: boolean; sources?: AskSource[]; query?: string }[]>([]);
  const [web, setWeb] = useState(false);
  const sid = useRef<string | null>(null);
  const threadRef = useRef<string>(`bsocial-${Math.random().toString(36).slice(2, 10)}`);
  const box = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [msgs]);

  const syncHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = 6 * 24; // 1 to 6 rows max
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  }, []);

  useEffect(() => {
    syncHeight();
  }, [q, syncHeight]);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setBusy(false);
  }, []);

  /** Sends through the MAIN chat proxy (POST /api/chat → OnDemand /chat/v1/sessions/{id}/query) with the same bridge, plugins and
   *  AG-UI streaming the main chat uses. The feed context is passed as systemContext; the session id is kept across turns. */
  const ask = useCallback(async (question: string, webOverride?: boolean) => {
    const useWeb = webOverride ?? web;
    const trimmed = question.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setQ("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMsgs((m) => [...m, { role: "user", text: trimmed }, { role: "bot", text: "", query: trimmed }]);
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const t0 = Date.now();
    const setLast = (patch: Partial<{ text: string; ms: number; err: boolean; sources: AskSource[] }>, append?: string) =>
      setMsgs((m) => { const n = [...m]; const last = n[n.length - 1]; n[n.length - 1] = { ...last, ...patch, text: append !== undefined ? last.text + append : (patch.text ?? last.text) }; return n; });
    const fail = (message: string) => setLast({ text: message, err: true });
    try {
      // Feed context: the latest 25 verified posts for the active sector (native links only), built at ask time.
      let systemContext = "";
      try {
        const fr = await fetch(`/api/social/social-feed?limit=25${sector ? `&sector=${encodeURIComponent(sector)}` : ""}`, { cache: "no-store", signal: ac.signal });
        const fj = (await fr.json()) as { data?: FeedPost[] };
        const lines = (fj.data ?? []).map((p) => { const u = canonicalOriginalUrl(p); return `- [${p.posted_at ?? "undated"} · ${p.platform} · ${p.company ?? "portfolio"}] ${p.text.slice(0, 220)}${u ? ` (${u})` : ""}`; });
        systemContext = `You are "Ask B Social", the assistant inside B Capital's founder network. Answer concisely (≤ 120 words) using the feed context first; say plainly when the context does not cover it. Cite post URLs inline when you use them.\n\nFEED CONTEXT (latest ${lines.length} verified posts${sector ? `, sector ${sector}` : ""}):\n${lines.join("\n")}`;
      } catch { /* context is best-effort */ }
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: threadRef.current, messages: [{ role: "user", content: trimmed }], context: { sessionId: sid.current ?? undefined, externalUserId: "b-social", systemContext, pluginIds: useWeb ? ["plugin-1722260873"] : [] } }),
        signal: ac.signal,
      });
      const headerSid = r.headers.get("x-ondemand-session"); if (headerSid) sid.current = headerSid;
      if (!r.ok || !r.body) {
        const text = await r.text().catch(() => "");
        let msg = `HTTP ${r.status}`;
        try { const j = JSON.parse(text); msg = `HTTP ${r.status}: ${j?.error?.message || j?.message || "request failed"}`; } catch { if (text) msg = `HTTP ${r.status}: ${text.slice(0, 160)}`; }
        fail(msg); return;
      }
      const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = ""; let finished = false; let gotText = false;
      const handle = (line: string) => {
        const payload = line.replace(/^data:\s*/, "").trim(); if (!payload) return;
        if (payload === "[DONE]") { finished = true; return; }
        let f: any; try { f = JSON.parse(payload); } catch { return; }
        switch (f.type) {
          case "CUSTOM": {
            if (f.name === "ondemand.session" && f.value?.sessionId) sid.current = String(f.value.sessionId);
            if (f.name === "ondemand.sources" && Array.isArray(f.value?.sources)) {
              const items: AskSource[] = f.value.sources.filter((x: any) => typeof x?.url === "string").map((x: any) => ({ title: String(x.title ?? ""), url: String(x.url), domain: String(x.sourceName ?? x.domain ?? (() => { try { return new URL(x.url).hostname; } catch { return ""; } })()) }));
              if (items.length) setLast({ sources: items });
            }
            if (f.name === "ondemand.error" && f.value?.message && !gotText) fail(String(f.value.message));
            break;
          }
          case "TEXT_MESSAGE_CONTENT": if (typeof f.delta === "string" && f.delta) { gotText = true; setLast({}, f.delta); } break;
          case "RUN_ERROR": fail(String(f.message ?? "The assistant could not answer.")); finished = true; break;
          case "RUN_FINISHED": finished = true; break;
          default: break;
        }
      };
      for (;;) {
        const { value, done } = await reader.read();
        if (done) { buf += dec.decode(); if (buf.trim()) handle(buf); break; }
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) { handle(buf.slice(0, nl).replace(/\r$/, "")); buf = buf.slice(nl + 1); }
        if (finished) break;
      }
      setMsgs((m) => { const n = [...m]; const last = n[n.length - 1]; if (!last.err && !last.text) n[n.length - 1] = { ...last, text: "The assistant returned no answer for this question.", err: true }; else if (!last.err) n[n.length - 1] = { ...last, ms: Date.now() - t0 }; return n; });
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      fail(String(err?.message ?? err));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [busy, sector, web]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy && q.trim()) {
        void ask(q);
      }
    }
  };

  // Deep link: /social?ask=<question> asks once on load (same pattern as /chat?q=) — also how a headless browser exercises the Qwen stream.
  const asked = useRef(false);
  useEffect(() => {
    if (asked.current) return;
    const qs = new URLSearchParams(window.location.search);
    const v = qs.get("ask")?.trim();
    if (!v) return;
    asked.current = true;
    const w = qs.get("web") === "1";
    if (w) setWeb(true);
    void ask(v.slice(0, 500), w);
  }, [ask]);

  const panelState = busy
    ? "streaming"
    : msgs.length === 0
    ? "idle"
    : msgs[msgs.length - 1]?.err
    ? "error"
    : "done";

  return (
    <section className="bs-card bs-ask" data-testid="ask-b-social" aria-label="Ask B Social" data-state={panelState}>
      <h2 className="bs-card__title"><Sparkles className="size-4" aria-hidden /> Ask B Social <span className="bs-ask__model">B Capital agent</span></h2>
      <div className="bs-ask__log" ref={box} data-testid="ask-log" aria-live="polite">
        {msgs.length === 0 && <p className="bs-ask__hint">Ask about anything in the feed — e.g. “Which fintech companies raised this year?”</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`bs-ask__msg bs-ask__msg--${m.role}${m.err ? " bs-ask__msg--err" : ""}`} role={m.err ? "alert" : undefined} data-testid={m.role === "bot" ? "ask-reply" : "ask-question"}>
            {m.role === "bot" ? (
              m.err ? (
                <div>
                  <span>{m.text}</span>
                  <div>
                    <button
                      type="button"
                      className="bs-ask__retry"
                      data-testid="ask-retry"
                      onClick={() => void ask(m.query || "")}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : m.text ? (
                <LinkedText text={m.text} sources={m.sources} />
              ) : busy && i === msgs.length - 1 ? (
                <span className="bs-ask__thinking" data-testid="ask-thinking">
                  <Loader2 className="size-4 oiu-spin" aria-label="streaming" /> Thinking…
                </span>
              ) : null
            ) : (
              m.text
            )}
            {m.ms ? <span className="bs-ask__ms"> · {(m.ms / 1000).toFixed(1)} s</span> : null}
            {m.role === "bot" && m.sources && m.sources.length > 0 && (
              <ol className="bs-ask__sources" data-testid="ask-sources">
                {m.sources.map((src, j) => {
                  const u = safeExternalUrl(src.url);
                  const domain = src.domain || (u ? new URL(u).hostname : "");
                  const label = src.title || domain || (u ? `Source ${j + 1}` : "Source");
                  return (
                    <li key={j} value={j + 1}>
                      {u ? (
                        <a
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={stopOutbound}
                          data-testid="ask-source-link"
                          data-n={j + 1}
                        >
                          [{j + 1}] {label}
                        </a>
                      ) : (
                        <span data-testid="ask-source-unavailable">[{j + 1}] Original source unavailable</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        ))}
      </div>
      <label className="bs-ask__web"><input type="checkbox" checked={web} onChange={(e) => setWeb(e.target.checked)} data-testid="ask-web-toggle" /> Include web sources (Perplexity, cited)</label>
      <form className="bs-ask__form" onSubmit={(e) => { e.preventDefault(); if (!busy && q.trim()) void ask(q); }}>
        <textarea
          ref={textareaRef}
          value={q}
          rows={1}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask B Social…"
          aria-label="Ask B Social"
          data-testid="ask-input"
        />
        {busy && (
          <button
            type="button"
            className="bs-ask__stop"
            onClick={stop}
            aria-label="Stop"
            data-testid="ask-stop"
          >
            Stop
          </button>
        )}
        <button type="submit" disabled={busy || !q.trim()} aria-label="Send" data-testid="ask-send"><Send className="size-4" aria-hidden /></button>
      </form>
    </section>
  );
}

function Follow({ s }: { s: Suggestion }) {
  const [on, setOn] = useState(false);
  useEffect(() => { try { setOn(localStorage.getItem(`bsocial.follow.${s.id}`) === "1"); } catch {} }, [s.id]);
  return (
    <li className="bs-follow">
      <Avatar name={s.name} sector={s.sector} size={36} />
      <div className="min-w-0 flex-1"><Link href={`/social/people/${encodeURIComponent(s.id)}`} className="bs-follow__name">{s.name}</Link><p className="bs-follow__role">{s.role} · {s.company}</p></div>
      <button type="button" aria-pressed={on} onClick={() => { const v = !on; setOn(v); try { localStorage.setItem(`bsocial.follow.${s.id}`, v ? "1" : "0"); } catch {} }} data-testid="follow-btn">{on ? <><Check className="size-3.5" aria-hidden /> Following</> : <><UserPlus className="size-3.5" aria-hidden /> Follow</>}</button>
    </li>
  );
}

export function SocialFeed({ initial, total, counts, suggestions, stories, unavailable, people, companies, providers, excluded, dataState, collection, byPlatform = {}, split = {}, verifiedCount }: { initial: FeedPost[]; total: number; counts: Record<string, number>; suggestions: Suggestion[]; stories: Story[]; unavailable: { platform: string; reason: string }[]; people: number; companies: number; providers: SocialProviderState[]; excluded: number; dataState: string; collection?: { status?: string; fetched?: number; admitted_unique?: number; duplicate?: number; excluded?: number; failed?: number; workers_launched?: number; worker_pool_size?: number; blocker?: string; finished_at?: string | null; jobs_ok?: number; storage?: { durable_configured?: boolean; warning?: string | null } } ; byPlatform?: Record<string, number>; split?: Record<string, { verified: number; unverified: number }>; verifiedCount?: number}) {
  const [sector, setSector] = useState(""); const [posts, setPosts] = useState(initial.filter(isPublicSocialPost)); const [tot, setTot] = useState(total); const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState(""); const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const load = useCallback(async (sec: string, offset: number, source = platform, query = search) => {
    const version = ++requestVersion.current; setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/social/social-feed?limit=20&offset=${offset}${sec ? `&sector=${encodeURIComponent(sec)}` : ""}${source ? `&platform=${encodeURIComponent(source)}` : ""}${query ? `&q=${encodeURIComponent(query)}` : ""}`, { cache: "no-store" });
      if (!r.ok) throw new Error("Feed unavailable");
      const j = (await r.json()) as { data: FeedPost[]; total: number };
      if (version !== requestVersion.current) return;
      const safe = j.data.filter(isPublicSocialPost); setTot(j.total); setPosts((p) => offset ? [...p, ...safe.filter((n) => !p.some((old) => old.id === n.id))] : safe);
    } catch { if (version === requestVersion.current) { setPosts([]); setTot(0); setError("Social posts could not be loaded. Please try again."); } }
    finally { if (version === requestVersion.current) setLoading(false); }
  }, [platform, search]);
  const pickSector = (k: string) => { setSector(k); void load(k, 0); };
  // Deep link: /social?q=&platform=&sector= — shareable filtered views (also used by headless verification).
  const deep = useRef(false);
  useEffect(() => { if (deep.current) return; deep.current = true; const sp = new URLSearchParams(window.location.search); const q = sp.get("q")?.trim() ?? ""; const pl = sp.get("platform") ?? ""; const se = sp.get("sector") ?? ""; if (!q && !pl && !se) return; setSearch(q); setPlatform(pl); setSector(se); void load(se, 0, pl, q); }, [load]);
  return (
    <div className="bs-shell" data-testid="b-social">
      <header className="bs-header" data-testid="bs-header">
        <BrandLogo height={24} />
        <div><h1>B Social</h1><p data-testid="bs-total" data-verified={verifiedCount ?? total} data-unverified={total - (verifiedCount ?? total)}>{(verifiedCount ?? total).toLocaleString()} verified · {(total - (verifiedCount ?? total)).toLocaleString()} unverified social posts · X {(byPlatform.x ?? 0).toLocaleString()} · Reddit {(byPlatform.reddit ?? 0).toLocaleString()} · Instagram {(byPlatform.instagram ?? 0).toLocaleString()}{byPlatform.linkedin ? ` · LinkedIn ${byPlatform.linkedin.toLocaleString()} (unverified)` : ""}{byPlatform.tiktok ? ` · TikTok ${byPlatform.tiktok.toLocaleString()} (unverified)` : ""}</p></div>
      </header>
      {collection && <section className="bs-card" data-testid="collection-status" aria-label="Collection run">
        <h2 className="bs-card__title">Collection run · {collection.status || "not started"}</h2>
        <p className="bs-source-note" data-testid="collection-counts">{collection.jobs_ok ?? 0} of {collection.workers_launched ?? 0} parallel jobs succeeded · {(collection.fetched ?? 0).toLocaleString()} fetched · {(collection.admitted_unique ?? total).toLocaleString()} admitted · {(collection.duplicate ?? 0).toLocaleString()} duplicates · {(collection.excluded ?? 0).toLocaleString()} rejected{collection.finished_at ? ` · merged ${collection.finished_at}` : ""}</p>
        <p className="bs-source-note">{collection.storage?.warning || "Durable storage configured."}</p>
      </section>}
      <form className="bs-ask__form" onSubmit={(e) => { e.preventDefault(); void load(sector, 0, platform, search); }} role="search"><input aria-label="Search social posts" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search original posts, author or company"/><button type="submit" aria-label="Search posts">Go</button></form>
      <section className="bs-card bs-provider-status" data-testid="social-provider-status" aria-label="Social provider status">
        <h2 className="bs-card__title">Source availability</h2>
        <p className="bs-source-note">{total ? "Every post links to its original native post. Verified posts come first; restored posts without a provider receipt carry an “Unverified source” badge." : "No social posts are available."} {excluded > 0 && `${excluded.toLocaleString()} legacy web, news, company or profile records stay excluded, not deleted.`} {dataState === "unavailable" && "The live feed is unavailable; no unverified fallback is displayed."}</p>
        <ul>{providers.map((provider) => <li key={provider.platform} data-provider={provider.platform} data-status={provider.status} data-count={byPlatform[provider.platform] ?? 0} data-verified={split[provider.platform]?.verified ?? 0} data-unverified={split[provider.platform]?.unverified ?? 0}><strong>{provider.label}</strong><span>{provider.status.replace(/_/g, " ")} · {(split[provider.platform]?.verified ?? 0).toLocaleString()} verified · {(split[provider.platform]?.unverified ?? 0).toLocaleString()} unverified</span><p>{provider.reason}</p></li>)}</ul>
      </section>
      <nav className="bs-tabs" aria-label="Social providers" data-testid="bs-provider-tabs"><button type="button" aria-pressed={!platform} onClick={() => { setPlatform(""); void load(sector, 0, ""); }}>All sources</button>{[...Object.entries(SOCIAL_PROVIDERS).map(([k, v]) => [k, v.label] as const), ["linkedin", "LinkedIn"] as const].filter(([key]) => key !== "tiktok" && (byPlatform[key] ?? 0) > 0).map(([key, label]) => <button key={key} type="button" data-provider={key} data-testid="bs-provider-tab" aria-pressed={platform === key} onClick={() => { setPlatform(key); void load(sector, 0, key); }}>{label}{split[key] && !split[key].verified ? " (unverified)" : ""} <span>{(byPlatform[key] ?? 0).toLocaleString()}</span></button>)}</nav>
      <section className="bs-stories" aria-label="Founders" data-testid="bs-stories">
        {stories.map((s) => <Link key={s.id} href={`/social/people/${encodeURIComponent(s.id)}`} className="bs-story" title={`${s.name} · ${s.company}`}><Avatar name={s.name} sector={s.sector} size={58} /><span>{s.name.split(" ")[0]}</span><small>{s.company}</small></Link>)}
      </section>
      <nav className="bs-tabs" aria-label="Sectors" data-testid="bs-sector-tabs">
        <button type="button" aria-pressed={!sector} onClick={() => pickSector("")}>All <span>{total}</span></button>
        {SECTOR_KEYS.map((k) => { const t = SECTOR_THEMES[k]; return <button key={k} type="button" aria-pressed={sector === k} data-sector={k} data-testid="bs-sector-tab" onClick={() => pickSector(k)}>{t.label} <span>{counts[k] ?? 0}</span></button>; })}
      </nav>
      <div className="bs-cols">
        <div className="bs-feed" data-testid="social-feed" data-total={tot}>
          {error && <p role="alert" className="bs-unavailable">{error}</p>}
          {posts.map((p) => <PostCard key={p.id} p={p} />)}
          {posts.length === 0 && !loading && <div className="bs-empty"><p>No posts for this source and sector.</p></div>}
          {posts.length < tot && <button type="button" className="bs-more" onClick={() => void load(sector, posts.length)} disabled={loading} data-testid="bs-load-more">{loading ? "Loading…" : `Show more (${tot - posts.length} left)`}</button>}
        </div>
        <aside className="bs-side">
          <AskBSocial sector={sector} />
          <section className="bs-card" data-testid="follow-suggestions"><h2 className="bs-card__title"><UserPlus className="size-4" aria-hidden /> Founders to follow</h2><ul className="bs-follow-list">{suggestions.map((s) => <Follow key={s.id} s={s} />)}</ul></section>
        </aside>
      </div>
    </div>
  );
}
