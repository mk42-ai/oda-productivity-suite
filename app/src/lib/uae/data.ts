/**
 * UAE AI National Intelligence Command Centre — data access over the FRESH namespace `uae_cc_v1` (src/data/uae_cc_v1/*.json).
 * Every record carries provenance: it was extracted from the OnDemand research-plugin corpus (Perplexity, GPT Search, Internet search,
 * Wikipedia, HuggingFace) and structured/classified through OnDemand chat sessions (POST /chat/v1/sessions/{id}/query). URLs that could not
 * be matched verbatim to the research corpus were removed (shown as "source unverified"), never invented.
 */
import orgsPack from "@/data/uae_cc_v1/orgs.json";
import sentPack from "@/data/uae_cc_v1/sentiment.json";
import newsPack from "@/data/uae_cc_v1/news.json";
import graphPack from "@/data/uae_cc_v1/graph.json";
import hfPack from "@/data/uae_cc_v1/hf.json";
import radarPack from "@/data/uae_cc_v1/radar.json";
import logos from "@/data/uae_cc_v1/logos.json";

export type OrgType = "company" | "government" | "university" | "research centre" | "subsidiary";
export type Src = { n?: number; title?: string; url?: string; publisher?: string; date?: string; note?: string };
export type Leader = { name: string; role: string; source_url?: string; as_of?: string; source_unverified?: boolean };
export type Tech = { name: string; category: string; source_url?: string; source_unverified?: boolean };
export type TimelineItem = { date: string; event: string; source_url?: string; source_unverified?: boolean };
export type Related = { org: string; relation: string; source_url?: string; source_unverified?: boolean };
export type Org = {
  id: string; name: string; type: OrgType; website?: string; hq?: string; founded?: string; parent?: string | null; parent_id?: string | null; ownership?: string;
  leadership?: Leader[]; ai_focus?: string[]; technologies?: Tech[]; timeline?: TimelineItem[]; related?: Related[]; briefing?: string; sources?: Src[];
  confidence?: number; conflicts?: string[]; unavailable?: string[]; international?: string; seed_facts?: string; coverage: number; dropped_unverified_urls?: number;
  provenance?: { method: string; generated_at: string; namespace: string };
};
export type SentClass = "Optimists" | "Pragmatists" | "Skeptics" | "Safety Advocates" | "Disruption Concerned" | "Pessimists/Doomers" | "Neutral/Informational";
export type SentRecord = {
  id: string; text: string; is_verbatim?: boolean; author?: string; author_role?: string; outlet?: string; platform: string; url?: string; url_verified?: boolean; date?: string;
  entities?: string[]; org_ids: string[]; topic?: string; topic_cluster: string; location_evidence: "EXPLICIT_UAE" | "UAE_TOPIC_ONLY" | "UNKNOWN";
  sentiment_class: SentClass | "Unclassified"; class_confidence?: number; stance_score?: number; rationale?: string; classified_by?: string | null;
  x: number; y: number; mentions: number; lane?: "UAE-topic" | "global-discourse"; captured_at?: string; platform_source?: string;
};
export type NewsItem = { id: string; headline: string; date?: string; publisher?: string; url?: string; url_verified?: boolean; summary?: string; orgs?: string[]; org_ids: string[]; category?: string; radar_ring?: string | null; technology?: string | null; also?: { headline: string; url?: string; publisher?: string }[] };
export type Edge = { source: string; target: string; relation: string; label?: string; url?: string; date?: string; origin: string };
export type GNode = { id: string; label: string; type: string; kind: "watchlist" | "external" };
export type HfModel = { id: string; author: string; downloads?: number | null; likes?: number | null; pipeline_tag?: string | null; created_at?: string | null; org_id: string; url: string };
export type RadarItem = { name: string; ring: "adopt" | "trial" | "assess" | "hold"; signals: number; latest: string; ring_votes: Record<string, number>; top_orgs: string[]; news_ids: string[]; method: string };
export type Meta = { namespace: string; generated_at: string; as_of: string; demo_window: string; disclaimer: string; identity_check: string; sampling: string; ecosystem_groups: Record<string, string[]> };

export const META = (orgsPack as unknown as { meta: Meta }).meta;
export const ORGS: Org[] = (orgsPack as unknown as { organizations: Org[] }).organizations;
export const SENTIMENT: SentRecord[] = (sentPack as unknown as { records: SentRecord[] }).records;
export const NEWS: NewsItem[] = (newsPack as unknown as { news: NewsItem[] }).news;
export const GRAPH = graphPack as unknown as { nodes: GNode[]; edges: Edge[] };
export const HF = hfPack as unknown as { models: HfModel[]; empty_orgs: string[]; note: string };
export const RADAR: RadarItem[] = (radarPack as unknown as { radar: RadarItem[] }).radar;
const LOGOS = logos as Record<string, { status: string; source?: string; reason?: string }>;

export const SENT_CLASSES: SentClass[] = ["Optimists", "Pragmatists", "Skeptics", "Safety Advocates", "Disruption Concerned", "Pessimists/Doomers", "Neutral/Informational"];
/** Class colours — institutional palette, hue-distinct and AA on both themes. */
export const CLASS_COLOR: Record<string, string> = {
  Optimists: "#6B8F71",
  Pragmatists: "#6B7280",
  Skeptics: "#B8A98F",
  "Safety Advocates": "#7C9CBF",
  "Disruption Concerned": "#C4A6A6",
  "Pessimists/Doomers": "#A06A6A",
  "Neutral/Informational": "#A3A3A3",
  Unclassified: "#D4D4D4",
};
export const TYPE_LABEL: Record<OrgType, string> = { company: "Company", government: "Government", university: "University", "research centre": "Research centre", subsidiary: "Subsidiary" };

const byId = new Map(ORGS.map((o) => [o.id, o] as const));
export const getOrg = (id: string) => byId.get(id) ?? null;
export const orgName = (id: string) => byId.get(id)?.name ?? GRAPH.nodes.find((n) => n.id === id)?.label ?? id;
export const logoFor = (id: string): string | null => (LOGOS[id]?.status === "official" ? `/logos/uae/${id}.png` : null);
export const logoProvenance = (id: string) => LOGOS[id] ?? { status: "monogram", reason: "no verified official domain" };
export const newsFor = (id: string) => NEWS.filter((n) => n.org_ids.includes(id));
export const sentimentFor = (id: string) => SENTIMENT.filter((r) => r.org_ids.includes(id));
export const edgesFor = (id: string) => GRAPH.edges.filter((e) => e.source === id || e.target === id);
export const modelsFor = (id: string) => HF.models.filter((m) => m.org_id === id);
export const childrenOf = (id: string) => ORGS.filter((o) => o.parent_id === id);
/** Ecosystem root (parent chain) — used to de-duplicate parents and subsidiaries in aggregates (G42 ⊃ Core42 / Inception / Khazna / Presight ⊃ AIQ; ATRC ⊃ TII / AI71). */
export function rootOf(id: string): string { let cur = id; const seen = new Set<string>(); while (byId.get(cur)?.parent_id && !seen.has(cur)) { seen.add(cur); cur = byId.get(cur)!.parent_id!; } return cur; }
/** Intelligence engine credit — factual, understated (no marketing copy). */
export const ENGINE_CREDIT = { name: "OnDemand", vendor: "AIREV", logo: "/plugins/ondemand.svg", note: "Intelligence engine: OnDemand (AIREV) — chat sessions, briefing and 2-hourly ingest run through the OnDemand Chat & Agents Flow Builder APIs." };
export const ECOSYSTEM_GROUPS = [...new Set(ORGS.map((o) => rootOf(o.id)))];

export function classCounts(rs: SentRecord[] = SENTIMENT) {
  const c: Record<string, number> = Object.fromEntries(SENT_CLASSES.map((k) => [k, 0]));
  for (const r of rs) c[r.sentiment_class] = (c[r.sentiment_class] ?? 0) + 1;
  return c;
}
export function countBy<T>(xs: T[], f: (x: T) => string | undefined | null) { const m: Record<string, number> = {}; for (const x of xs) { const k = f(x) ?? "unknown"; m[k] = (m[k] ?? 0) + 1; } return m; }
export const AS_OF = "2026-10-21";
/** Days between an ISO-ish date (YYYY, YYYY-MM or YYYY-MM-DD) and AS_OF; null when undated. Month-only dates use the 15th. */
export function ageDays(d?: string | null): number | null {
  if (!d) return null; const m = d.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/); if (!m) return null;
  const t = Date.UTC(+m[1], m[2] ? +m[2] - 1 : 6, m[3] ? +m[3] : 15); return Math.round((Date.UTC(2026, 9, 21) - t) / 86400000);
}
export function coverageStats() {
  const n = ORGS.length; const mean = ORGS.reduce((a, o) => a + (o.coverage ?? 0), 0) / n;
  const withSrc = ORGS.filter((o) => (o.sources ?? []).some((s) => s.url)).length;
  return { orgs: n, meanCoverage: mean, withVerifiedSource: withSrc, highConfidence: ORGS.filter((o) => (o.confidence ?? 0) >= 0.75).length };
}
