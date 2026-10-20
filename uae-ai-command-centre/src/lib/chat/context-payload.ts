/**
 * context-payload.ts — PURE builder for the grounded context sent with the first turn of every /api/chat thread.
 *
 * Preserved contract (turn-4 UNIT 2): ChatShell calls `buildContextPayload(companies, getSettings().companies, …)` AT SEND TIME so the payload
 * always mirrors the live context chips. For the UAE AI Command Centre the "companies" are watchlist organisations (namespace uae_cc_v1) and the
 * payload is a RETRIEVAL over the bundled digest: the selected organisations + every organisation, news item and attributed public statement whose
 * names/keywords match the question. Each row carries a [W…] tag and its source URL so the model can cite it, and the instructions require a
 * "Verified facts" vs "Interpretation" split. Nothing here is invented: rows are copied from the seed namespace (see /methodology).
 */
import digest from "@/data/uae_cc_v1/digest.json";

export type ContextInputCompany = {
  slug: string; name: string; sector: string; status: string; stage: string | null;
  sentiment: { score: number; label: string; delta?: number | null; updated_at?: string | null; basis?: string | null };
  prior_run_at?: string | null; news_count?: number;
  latest_news: { title: string; url: string | null; published_at: string | null; source?: string | null }[];
  estimated_ticket_size_usd?: number | null;
};
export type ContextCompany = { slug: string; name: string; type: string };
export type ContextPayload = { companies: ContextCompany[]; systemContext: string; sessionContext: { key: string; value: string }[]; summary: string };

type DOrg = { id: string; n: string; t: string; hq?: string; p?: string | null; a: string[]; b: string; s: { u: string; t: string }[]; tl: { d?: string; e: string; u: string }[]; intl: string; c?: number };
type DNews = { h: string; d?: string; u: string; p?: string; o: string[]; c?: string };
type DSent = { t: string; a?: string; u: string; d?: string; k: string; tc: string; o: string[]; pl: string };
const D = digest as unknown as { orgs: DOrg[]; news: DNews[]; sent: DSent[] };

export const EMPTY_CONTEXT_SUMMARY = "Context: whole watchlist — pick organisations in the inspector to focus";
export function contextSummary(names: string[]): string {
  if (!names.length) return EMPTY_CONTEXT_SUMMARY;
  return `Context: ${names.length} ${names.length === 1 ? "organisation" : "organisations"} — ${names.join(", ")}`;
}
const STOP = new Set("the a an and or of to in on for with what which who how has have is are was were this that these those about from by at as it its their there recently month week year uae emirates ai".split(" "));
const words = (s: string) => (s.toLowerCase().match(/[a-z0-9&]+/g) ?? []).filter((w) => w.length > 2 && !STOP.has(w));
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function mentions(q: string, o: DOrg) { return [o.n, ...o.a].some((a) => a.length > 2 && new RegExp(`(^|[^a-z0-9])${esc(a.toLowerCase())}([^a-z0-9]|$)`).test(q)); }
const THEMES: [RegExp, RegExp][] = [
  [/employ|job|hiring|layoff|workforce|emirati[sz]ation|skills?/, /jobs|skills|hiring|employ|workforce|emirati/],
  [/partner|mou|alliance|deal|agreement|collaborat/, /partner|mou|alliance|agreement|collaborat|deal|joins/],
  [/international|abroad|global|expan|overseas|us |india|france|europe/, /international|expan|new york|india|france|paris|global|us |overseas/],
  [/research|model|paper|falcon|jais|k2|llm/, /model|falcon|jais|k2|research|release|open-source|benchmark/],
  [/safety|govern|regulat|ethic|privacy|surveil|deepfake/, /safety|govern|regulat|ethic|privacy|surveil|deepfake|red line/],
  [/compute|data cent|stargate|chip|gpu|export/, /compute|data cent|stargate|chip|gpu|export|nvidia|mw|gw/],
];

/** Builds the grounded payload. `query` (latest user text) drives retrieval; selected slugs are always included first. */
export function buildContextPayload(_companies: ContextInputCompany[], selectedSlugs: string[], opts: { fetchedAt?: string; query?: string } = {}): ContextPayload {
  const q = (opts.query ?? "").toLowerCase(); const qw = new Set(words(q));
  const byId = new Map(D.orgs.map((o) => [o.id, o] as const));
  const picked = selectedSlugs.map((s) => byId.get(s)).filter((o): o is DOrg => !!o);
  const named = D.orgs.filter((o) => mentions(q, o));
  const themeRes = THEMES.filter(([qq]) => qq.test(q)).map(([, rx]) => rx);
  const orgIds = new Set([...named, ...picked].map((o) => o.id));
  const scoreText = (t: string, o: string[]) => { let s = 0; const tl = t.toLowerCase(); for (const w of qw) if (tl.includes(w)) s += 1; for (const id of o) if (orgIds.has(id)) s += 3; for (const rx of themeRes) if (rx.test(tl)) s += 2; return s; };
  const news = D.news.map((n) => ({ n, s: scoreText(`${n.h} ${n.c ?? ""}`, n.o) + (n.d && n.d >= "2026-09-20" ? 0.5 : 0) })).filter((x) => x.s > 0.5).sort((a, b) => b.s - a.s || (b.n.d ?? "").localeCompare(a.n.d ?? "")).slice(0, 18).map((x) => x.n);
  const sent = D.sent.map((r) => ({ r, s: scoreText(`${r.t} ${r.tc} ${r.k}`, r.o) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 14).map((x) => x.r);
  const orgs = [...picked, ...named.filter((o) => !picked.includes(o))].slice(0, 8);
  const lines: string[] = [];
  lines.push(`[CONTEXT · UAE AI watchlist namespace uae_cc_v1 · as of 2026-10-20 · ${D.orgs.length} organisations · built ${opts.fetchedAt ?? new Date().toISOString()}]`);
  lines.push("RULES: Answer as the UAE AI Command Centre executive analyst. Structure the answer with two headed sections: '## Verified facts' (each bullet ends with a markdown link to its source — use the URLs below or ones the web plugin returns; never invent a URL) and '## Interpretation' (analysis, clearly labelled as judgement). Say 'unavailable' when a fact is not in the sources. Never claim this is an official government system. Prefer events dated within the last 30 days for 'recent'/'this month' (today is 2026-10-20). Sentiment rows are a purposive sample of public statements, not a population survey.");
  for (const o of orgs) {
    lines.push(`\n[W:${o.id}] ${o.n} (${o.t}${o.hq ? `, ${o.hq}` : ""}${o.p ? `, parent ${byId.get(o.p)?.n ?? o.p}` : ""}; confidence ${o.c ?? "n/a"}) — ${o.b}`);
    for (const t of o.tl) lines.push(`  · ${t.d ?? "undated"}: ${t.e}${t.u ? ` <${t.u}>` : ""}`);
    if (o.intl && !/unavailable/i.test(o.intl)) lines.push(`  · international: ${o.intl}`);
    for (const s of o.s) lines.push(`  · source: ${s.t} <${s.u}>`);
  }
  if (!orgs.length) lines.push(`\nWatchlist organisations: ${D.orgs.map((o) => o.n).join("; ")}`);
  if (news.length) { lines.push("\n[NEWS — newest first where relevant]"); for (const n of news) lines.push(`- ${n.d ?? "undated"} · ${n.h}${n.p ? ` (${n.p})` : ""}${n.u ? ` <${n.u}>` : ""}`); }
  if (sent.length) { lines.push("\n[PUBLIC STATEMENTS — attributed, OnDemand-classified]"); for (const r of sent) lines.push(`- [${r.k} · ${r.tc} · ${r.pl}] ${r.a && r.a !== "unattributed" ? `${r.a}: ` : ""}"${r.t}"${r.d ? ` (${r.d})` : ""}${r.u ? ` <${r.u}>` : ""}`); }
  const systemContext = lines.join("\n").slice(0, 14000);
  const companies = orgs.map((o) => ({ slug: o.id, name: o.n, type: o.t }));
  const sessionContext = picked.map((o) => ({ key: `org:${o.id}`, value: JSON.stringify({ name: o.n, type: o.t, hq: o.hq, confidence: o.c }).slice(0, 900) }));
  return { companies, systemContext, sessionContext, summary: contextSummary(picked.map((o) => o.n)) };
}
