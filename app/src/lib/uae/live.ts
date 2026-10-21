import "server-only";
import { ONDEMAND_BASE_URL, serverApiKey, UPSTREAM_USER_AGENT } from "@/lib/ondemand/config";
import wf from "../../../mission/workflows.json";
/**
 * Live uae_cc_v1 increments — read from the OnDemand Agents Flow Builder execution store (the app's live datastore).
 * Workflows (scripts/uae/workflows.mjs → mission/workflows.json): ingest (cron 0 0 *\/2 * * *), briefing (0 30 2 * * *), checkpoint (0 *\/30 * * * *).
 * Read path (live docs): GET /automation/api/execution/list?workflowID= → newest first; GET /execution/{id}/node/outputs → {outputs:{key:{value}}}.
 * Provenance is attached to every record: source URL (from the plugin result), workflow id, execution id, run timestamp, plugin, confidence.
 * Records without an http(s) URL are dropped here as well (defence in depth) — nothing is synthesised.
 */
type WfEntry = { id: string; name: string; cron6: string; isActive?: boolean; next_runs_utc?: string[] };
export const WORKFLOWS = (wf as unknown as { workflows: Record<string, WfEntry> }).workflows;
const API = `${ONDEMAND_BASE_URL}/automation/api`;

export type LiveRun = { workflowId: string; executionId: string; status: string; trigger: string; startedAt: string; endedAt: string | null };
export type Prov = { source_url: string; timestamp: string; plugin: string; confidence: number | null; workflow_id: string; execution_id: string };
export type LiveNews = { headline: string; publisher?: string; published_at?: string; summary?: string; org_ids: string[]; entities: string[]; provenance: Prov };
export type LiveStatement = { text: string; is_verbatim?: boolean; author?: string; outlet?: string; platform?: string; published_at?: string; sentiment_class: string; class_confidence: number | null; rationale?: string; org_ids: string[]; provenance: Prov };
export type LiveSignal = { org_id: string; signal: string; direction?: string; evidence_urls: string[]; provenance: Omit<Prov, "source_url" | "plugin" | "confidence"> };
export type LiveSnapshot = {
  ok: boolean; error?: string; fetched_at: string; namespace: "uae_cc_v1";
  workflows: { kind: string; id: string; name: string; cron: string; next_runs_utc: string[]; last: LiveRun | null; last_success: LiveRun | null }[];
  ingest: { run: LiveRun | null; news: LiveNews[]; statements: LiveStatement[]; org_signals: LiveSignal[]; dropped_no_url: number; parse_error?: string };
  briefing: { run: LiveRun | null; markdown: string | null };
  checkpoint: { run: LiveRun | null; synced_at: string | null };
};

const H = () => ({ apikey: serverApiKey(), "user-agent": UPSTREAM_USER_AGENT });
async function getJson<T>(p: string): Promise<T | null> {
  const r = await fetch(`${API}${p}`, { headers: H(), cache: "no-store", signal: AbortSignal.timeout(12_000) });
  if (!r.ok) throw new Error(`GET ${p.split("?")[0]} → HTTP ${r.status}`);
  return (await r.json()) as T;
}
type Exec = { id: string; workflowID: string; status: string; trigger?: { type?: string }; startedAtInMilliseconds: number; endedAtInMilliseconds?: number };
const toRun = (e: Exec): LiveRun => ({ workflowId: e.workflowID, executionId: e.id, status: e.status, trigger: e.trigger?.type ?? "", startedAt: new Date(e.startedAtInMilliseconds).toISOString(), endedAt: e.endedAtInMilliseconds ? new Date(e.endedAtInMilliseconds).toISOString() : null });
const isUrl = (u: unknown): u is string => typeof u === "string" && /^https?:\/\/[^\s]+\.[^\s]+/.test(u);
const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);
/** Pull the first JSON object out of an LLM node value (tolerates ```json fences and trailing ". "). */
export function extractJson(v: string): Record<string, unknown> | null {
  const s = v.replace(/```(?:json)?/g, ""); const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)) as Record<string, unknown>; } catch { return null; }
}

async function execs(id: string) { return ((await getJson<{ data?: Exec[] }>(`/execution/list?workflowID=${id}`))?.data ?? []); }
async function outputs(eid: string) { return ((await getJson<{ data?: { outputs?: Record<string, { value?: string }> } }>(`/execution/${eid}/node/outputs`))?.data?.outputs ?? {}); }

export async function liveSnapshot(): Promise<LiveSnapshot> {
  const base: LiveSnapshot = { ok: false, fetched_at: new Date().toISOString(), namespace: "uae_cc_v1", workflows: [], ingest: { run: null, news: [], statements: [], org_signals: [], dropped_no_url: 0 }, briefing: { run: null, markdown: null }, checkpoint: { run: null, synced_at: null } };
  if (!serverApiKey()) return { ...base, error: "ONDEMAND_API_KEY not configured on the server" };
  try {
    const kinds = Object.entries(WORKFLOWS);
    const lists = await Promise.all(kinds.map(([, w]) => execs(w.id)));
    const nowIso = new Date().toISOString();
    base.workflows = kinds.map(([kind, w], i) => {
      const l = lists[i]; const ok = l.find((e) => e.status === "success");
      return { kind, id: w.id, name: w.name, cron: w.cron6, next_runs_utc: (w.next_runs_utc ?? []).filter((t) => t > nowIso), last: l[0] ? toRun(l[0]) : null, last_success: ok ? toRun(ok) : null };
    });
    const ls = (k: string) => base.workflows.find((x) => x.kind === k)?.last_success ?? null;
    const [ing, brf, chk] = [ls("ingest"), ls("briefing"), ls("checkpoint")];
    const [oi, ob, oc] = await Promise.all([ing ? outputs(ing.executionId) : null, brf ? outputs(brf.executionId) : null, chk ? outputs(chk.executionId) : null]);
    if (ing && oi) {
      base.ingest.run = ing;
      const j = extractJson(oi["classify"]?.value ?? oi["analyzer-0"]?.value ?? "");
      if (!j) base.ingest.parse_error = "ingest output was not valid JSON";
      else {
        const p = (u: string, plugin: unknown, conf: unknown): Prov => ({ source_url: u, timestamp: ing.endedAt ?? ing.startedAt, plugin: String(plugin || "OnDemand plugin"), confidence: num(conf), workflow_id: ing.workflowId, execution_id: ing.executionId });
        let dropped = Number(j.dropped_no_url) || 0;
        for (const n of (j.news as Record<string, unknown>[] | undefined) ?? []) {
          if (!isUrl(n.url) || !n.headline) { dropped++; continue; }
          base.ingest.news.push({ headline: String(n.headline), publisher: n.publisher as string, published_at: n.published_at as string, summary: n.summary as string, org_ids: (n.org_ids as string[]) ?? [], entities: (n.entities as string[]) ?? [], provenance: p(n.url, n.plugin, n.confidence) });
        }
        for (const s of (j.statements as Record<string, unknown>[] | undefined) ?? []) {
          if (!isUrl(s.url) || !s.text) { dropped++; continue; }
          base.ingest.statements.push({ text: String(s.text), is_verbatim: s.is_verbatim === true, author: s.author as string, outlet: s.outlet as string, platform: s.platform as string, published_at: s.published_at as string, sentiment_class: String(s.sentiment_class || "Unclassified"), class_confidence: num(s.class_confidence), rationale: s.rationale as string, org_ids: (s.org_ids as string[]) ?? [], provenance: p(s.url, s.plugin, s.confidence ?? s.class_confidence) });
        }
        for (const g of (j.org_signals as Record<string, unknown>[] | undefined) ?? []) {
          const ev = ((g.evidence_urls as unknown[]) ?? []).filter(isUrl);
          if (!g.org_id || !ev.length) continue;
          base.ingest.org_signals.push({ org_id: String(g.org_id), signal: String(g.signal ?? ""), direction: g.direction as string, evidence_urls: ev, provenance: { timestamp: ing.endedAt ?? ing.startedAt, workflow_id: ing.workflowId, execution_id: ing.executionId } });
        }
        base.ingest.dropped_no_url = dropped;
      }
    }
    if (brf && ob) { base.briefing.run = brf; base.briefing.markdown = (ob["briefing"]?.value ?? ob["analyzer-0"]?.value ?? "").trim() || null; }
    if (chk && oc) { base.checkpoint.run = chk; const j = extractJson(oc["state"]?.value ?? ""); base.checkpoint.synced_at = (j?.synced_at as string) ?? null; }
    base.ok = true; return base;
  } catch (e) {
    return { ...base, error: (e as Error).message };
  }
}
