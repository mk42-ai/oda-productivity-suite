/**
 * social-data.ts — read-only access to the merged chat-batch datasets (data/portfolio.json, data/people.json, data/social-feed.json).
 * Built by the 2026-10-12 merge (backend roster + Step 2 sentiment + Perplexity chat batches + PitchBook investor profile + Step 4 Reddit) and
 * refreshed daily by the OnDemand workflow `bcap-social-daily-chatbatch-refresh`. Files are read once and cached (mtime-checked).
 */
import fs from "node:fs";
import path from "node:path";
import { filterSocialDataset, publicSocialPost, canonicalAnySocialPost, SOCIAL_POLICY_VERSION, UNVERIFIED_LABELS } from "./social-policy.js";
import { readNativePosts, readCollectionState, nativeStorageStatus } from "./social-native.js";
import { readFeedFromStore, durableStorageStatus } from "./persist/feed.js";

const DIR = path.join(process.cwd(), "data");
type Cache = { mtime: number; json: any };
const cache = new Map<string, Cache>();
export type DatasetName = "portfolio" | "people" | "social-feed";
export const DATASETS: DatasetName[] = ["portfolio", "people", "social-feed"];

export function readDataset(name: DatasetName): any | null {
  const file = path.join(DIR, `${name}.json`);
  try {
    const st = fs.statSync(file);
    const hit = cache.get(name);
    if (hit && hit.mtime === st.mtimeMs) return hit.json;
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    cache.set(name, { mtime: st.mtimeMs, json });
    return json;
  } catch { return null; }
}

/** Public derived view; raw readDataset is reserved for internal refresh/backups.
 * Policy is reapplied on every call, even when the raw mtime cache hits. */
let feedCache: { key: string; value: any } | null = null;
const VERIFIED = path.join(DIR, "social", "verified-posts.json");
const SOURCES = path.join(DIR, "social", "sources.json");
const mt = (f: string) => { try { return fs.statSync(f).mtimeMs; } catch { return 0; } };
/** Public B Social view: verified native posts (data/social/verified-posts.json, merged from per-job checkpoints) + legacy receipts,
 *  re-checked against the current policy on load. Legacy research rows in data/social-feed.json stay quarantined. */
/** Public B Social view. Durable DB first (src/persist — Turso/libSQL, restored from OnDemand Media on boot); the file-built view
 *  below is only used when the durable store is empty/unavailable (and is what gets synced INTO the store after each ingestion). */
export async function readSocialFeed() {
  try { const v = await readFeedFromStore(); if (v) return v; } catch (e) { console.error(JSON.stringify({ msg: "feed.store.error", error: (e as Error).message })); }
  return readSocialFeedFromFiles();
}
export async function readSocialFeedFromFiles() {
  const dataset = readDataset("social-feed") ?? { posts: [] };
  const native = await readNativePosts();
  const key = `${mt(VERIFIED)}|${mt(SOURCES)}|${cache.get("social-feed")?.mtime ?? 0}|${native.length}`;
  if (feedCache?.key === key) return feedCache.value;
  const legacy = filterSocialDataset(dataset);
  let verified: any = { posts: [], jobs: [] }; try { verified = JSON.parse(fs.readFileSync(VERIFIED, "utf8")); } catch { /* not collected yet */ }
  let sources: any = null; try { sources = JSON.parse(fs.readFileSync(SOURCES, "utf8")); } catch { /* none */ }
  const checked = filterSocialDataset({ posts: verified.posts ?? [] });
  const seen = new Set<string>(); const posts: any[] = [];
  for (const p of [...checked.posts.map(publicSocialPost), ...native]) { const k = String(p.url); if (seen.has(k)) continue; seen.add(k); posts.push(p); }
  posts.sort((a, b) => String(b.posted_at || "").localeCompare(String(a.posted_at || "")));
  for (const p of posts) p.verification = "verified";
  // Restore legacy records ONLY when they carry a native social post permalink (X/Reddit/Instagram/LinkedIn/TikTok post URLs).
  // Web/news/company/profile pages stay excluded. Each restored row is marked unverified and deduped against verified posts.
  const seenIds = new Set<string>(posts.map((p) => `${p.platform}:${p.provider_native_id ?? p.provenance?.native_id ?? ""}`));
  let recovered: Record<string, any> = {}; try { recovered = JSON.parse(fs.readFileSync(path.join(DIR, "social", "legacy-reddit-recovered.json"), "utf8")); } catch { /* none */ }
  const unverified: any[] = []; const legacyExcluded: Record<string, number> = {};
  for (const raw of dataset.posts ?? []) {
    const url = raw.url || recovered[raw.id]?.url || null;
    const c = canonicalAnySocialPost(url);
    if (!c) { const k = raw.platform === "reddit" ? "reddit_no_native_permalink" : `${raw.platform}_not_a_social_post`; legacyExcluded[k] = (legacyExcluded[k] || 0) + 1; continue; }
    const key = `${c.platform}:${c.nativeId}`;
    if (seen.has(c.url) || seenIds.has(key)) { legacyExcluded.duplicate_of_verified = (legacyExcluded.duplicate_of_verified || 0) + 1; continue; }
    seen.add(c.url); seenIds.add(key);
    unverified.push({ id: `unverified:${key}`, platform: c.platform, verification: "unverified", url: c.url, source_domain: new URL(c.url).hostname.replace(/^www\./, ""), author: recovered[raw.id]?.author || raw.author || null,
      author_handle: null, author_avatar: null, text: String(raw.text || "").trim(), image: null, media: [], posted_at: raw.posted_at || recovered[raw.id]?.posted_at || null,
      company_slug: raw.company_slug ?? null, company: raw.company ?? null, sector: raw.sector ?? "ai-enterprise", company_domain: raw.company_domain ?? null, top_comments: raw.top_comments ?? undefined,
      agent_takeaway: raw.agent_takeaway?.text ? raw.agent_takeaway : null, provider_native_id: c.nativeId,
      provenance: { kind: "restored-legacy", provider: c.platform, native_id: c.nativeId, policy_version: SOCIAL_POLICY_VERSION, note: `Restored from the earlier research feed; ${UNVERIFIED_LABELS[c.platform]} permalink is native but no provider receipt was captured.` } });
  }
  unverified.sort((a, b) => String(b.posted_at || "").localeCompare(String(a.posted_at || "")));
  const verifiedCount = posts.length;
  posts.push(...unverified.filter((p) => p.text));
  const by_platform: Record<string, number> = {}; const by_sector: Record<string, number> = {}; const by_platform_split: Record<string, { verified: number; unverified: number }> = {};
  for (const p of posts) { by_platform[String(p.platform)] = (by_platform[String(p.platform)] || 0) + 1; by_sector[String(p.sector)] = (by_sector[String(p.sector)] || 0) + 1;
    const s2 = (by_platform_split[String(p.platform)] ||= { verified: 0, unverified: 0 }); s2[p.verification as "verified" | "unverified"]++; }
  const cfg = sources ? { x_queries: sources.companies.reduce((n: number, c: any) => n + (c.x_queries?.length ?? 0), 0), subreddits: [...new Set<string>(sources.companies.flatMap((c: any) => (c.subreddits ?? []) as string[]))], instagram_usernames: sources.companies.filter((c: any) => c.instagram).map((c: any) => c.instagram) } : null;
  const providers: any[] = legacy.providers.map((p) => ({ ...p, admitted: by_platform[p.platform] || 0, verified: by_platform_split[p.platform]?.verified || 0, unverified: by_platform_split[p.platform]?.unverified || 0, status: by_platform[p.platform] ? "configured · collected" : cfg ? "configured · no posts yet" : "not_configured",
    reason: p.platform === "x" && cfg ? `${cfg.x_queries} configured X queries (company names, handles, founders). ${p.reason}` : p.platform === "reddit" && cfg ? `${cfg.subreddits.length} configured subreddits (${(cfg.subreddits as string[]).slice(0, 6).map((s) => "r/" + s).join(", ")}…) plus per-company keyword search. ${p.reason}` : p.platform === "instagram" && cfg ? `${cfg.instagram_usernames.length} configured usernames. ${p.reason}` : p.reason }));
  for (const extra of ["linkedin", "tiktok"] as const) if (by_platform_split[extra]?.unverified) providers.push({ platform: extra, label: UNVERIFIED_LABELS[extra], status: "unverified only", admitted: by_platform[extra], verified: 0, unverified: by_platform_split[extra].unverified,
    reason: `No ${UNVERIFIED_LABELS[extra]} collector is configured. These are native ${UNVERIFIED_LABELS[extra]} post permalinks restored from the earlier research feed without a provider receipt.` });
  const jobs = verified.jobs ?? [];
  const collection = { status: jobs.length ? "completed" : "not_started", method: "50 parallel independent jobs (sector × source × company group), each checkpointed to data/social/verified/", workers_launched: jobs.length, worker_pool_size: jobs.length || 50,
    jobs_ok: jobs.filter((j: any) => j.status === "ok").length, fetched: jobs.reduce((n: number, j: any) => n + (j.posts_fetched || 0), 0), admitted_unique: verifiedCount, duplicate: verified.duplicates_removed ?? 0,
    excluded: jobs.reduce((n: number, j: any) => n + (j.posts_rejected || 0), 0), finished_at: verified.generated_at ?? null, storage: { ...nativeStorageStatus(), ...durableStorageStatus(), dataset_file: "data/social/verified-posts.json" } };
  const value = { generated_at: verified.generated_at ?? dataset.generated_at ?? null, policy_version: legacy.policy_version, posts, count: posts.length, verified_count: verifiedCount, unverified_count: posts.length - verifiedCount, by_platform, by_platform_split, by_sector, providers, unavailable_sources: [], source_config: cfg,
    collection, quarantine: { excluded: Object.values(legacyExcluded).reduce((a, b) => a + b, 0), legacy_total: (dataset.posts ?? []).length, restored_unverified: posts.length - verifiedCount, excluded_reasons: legacyExcluded, reasons: legacy.quarantine.reasons, reversible: true, note: "Legacy rows with a native social post permalink are restored as unverified; web, news, company and profile pages stay excluded (not deleted)." } };
  feedCache = { key, value };
  return value;
}

/** Verified social posts only, before filters/counts/pagination. */
export async function queryFeed(q: { sector?: string; platform?: string; company?: string; search?: string; verification?: string; limit?: number; offset?: number }) {
  const d = await readSocialFeed(); if (!d) return null;
  let posts: any[] = d.posts ?? [];
  if (q.sector) posts = posts.filter((p) => p.sector === q.sector);
  if (q.platform) posts = posts.filter((p) => p.platform === q.platform);
  if (q.company) posts = posts.filter((p) => p.company_slug === q.company);
  if (q.verification) posts = posts.filter((p) => p.verification === q.verification);
  if (q.search) { const term = q.search.toLocaleLowerCase(); posts = posts.filter((p) => [p.text, p.author, p.company].some((v) => String(v || "").toLocaleLowerCase().includes(term))); }
  const limit = Math.min(Math.max(q.limit ?? 50, 1), 500); const offset = Math.max(q.offset ?? 0, 0);
  return { generated_at: d.generated_at, by_platform: d.by_platform, by_platform_split: d.by_platform_split, verified_count: d.verified_count, unverified_count: d.unverified_count, by_sector: d.by_sector, total: posts.length, offset, limit, unavailable_sources: d.unavailable_sources, providers: d.providers, quarantine: d.quarantine, policy_version: d.policy_version, collection: d.collection, data: posts.slice(offset, offset + limit) };
}
