/**
 * Durable-store ⇄ feed bridge.
 *  • readFeedFromStore(): builds the exact public /data/social-feed shape from the `posts` table (status verified | unverified;
 *    hidden rows stay reversible in the DB but are never served) + the `feed_meta` row (providers, source config, collection).
 *  • syncFilesToStore(): after an ingestion run, upserts the freshly file-built feed (verified + restored-unverified posts, takeaways,
 *    companies, people, sectors, sources, worker runs) into the store — upsert-only, keyed on (native_id, platform), so nothing is lost.
 */
import fs from "node:fs";
import path from "node:path";
import { store, state, upsert, counts, scheduleBackup } from "./store.js";

let memo: { v: number; value: any } | null = null;
export function durableStorageStatus() {
  const hosted = state.hosted;
  return { durable_backend: hosted ? "turso-libsql" : state.provider === "local-libsql" ? "local-libsql + ondemand-media-snapshots" : null,
    durable_configured: hosted || !!state.last_backup || !!state.boot.restored_from,
    db_provider: state.provider, offsite_backup: state.last_backup ? { snapshot_ts: state.last_backup.snapshot_ts, media_ids: state.last_backup.files.map((f) => f.media_id) } : null,
    warning: hosted ? null : state.last_backup || state.boot.restored_from
      ? "Posts are stored in libSQL and snapshotted to OnDemand Media after every ingestion; on a fresh sandbox the boot guard restores the latest verified snapshot automatically. Hosted Turso: awaiting credentials."
      : "Local libSQL only — no verified OnDemand Media snapshot yet." };
}
const j = (s: unknown) => { try { return s == null ? null : JSON.parse(String(s)); } catch { return null; } };

export async function readFeedFromStore() {
  if (!state.ready) return null;
  if (memo && memo.v === state.version) return memo.value;
  const c = await store();
  const total = Number((await c.execute("select count(*) from posts where status in ('verified','unverified')")).rows[0][0]);
  if (!total) return null;
  const metaRow = (await c.execute("select v from meta where k='feed_meta'")).rows[0]; const meta = j(metaRow?.[0]) ?? {};
  const posts: any[] = []; const verified: any[] = []; const unverified: any[] = [];
  let off = 0; for (;;) {
    const r = await c.execute({ sql: "select status, raw_json from posts where status in ('verified','unverified') order by posted_at desc limit 2000 offset ?", args: [off] }); if (!r.rows.length) break;
    for (const row of r.rows) { const p = j(row[1]); if (!p) continue; p.verification = String(row[0]); (p.verification === "verified" ? verified : unverified).push(p); }
    off += r.rows.length;
  }
  posts.push(...verified, ...unverified);
  const by_platform: Record<string, number> = {}; const by_sector: Record<string, number> = {}; const by_platform_split: Record<string, { verified: number; unverified: number }> = {};
  for (const p of posts) { by_platform[p.platform] = (by_platform[p.platform] || 0) + 1; by_sector[p.sector] = (by_sector[p.sector] || 0) + 1; (by_platform_split[p.platform] ||= { verified: 0, unverified: 0 })[p.verification as "verified" | "unverified"]++; }
  const providers = (meta.providers ?? []).filter((p: any) => p.platform !== "tiktok" || by_platform.tiktok).map((p: any) => ({ ...p, admitted: by_platform[p.platform] || 0, verified: by_platform_split[p.platform]?.verified || 0, unverified: by_platform_split[p.platform]?.unverified || 0, status: by_platform[p.platform] ? (p.status === "unverified only" ? p.status : "configured · collected") : p.status }));
  const hidden = Number((await c.execute("select count(*) from posts where status='hidden'")).rows[0][0]);
  const collection = { ...(meta.collection ?? {}), admitted_unique: verified.length, storage: { ...(meta.collection?.storage ?? {}), ...durableStorageStatus(), dataset_file: null, rows: total } };
  const value = { ...meta, generated_at: meta.generated_at ?? null, posts, count: posts.length, verified_count: verified.length, unverified_count: unverified.length, by_platform, by_platform_split, by_sector, providers, unavailable_sources: [],
    collection, quarantine: { ...(meta.quarantine ?? {}), hidden_rows_in_db: hidden }, data_source: { kind: "durable-store", provider: state.provider, version: state.version } };
  memo = { v: state.version, value }; return value;
}

/** Upsert the current file-built feed into the store, then schedule an OnDemand Media backup. Returns per-table counts after. */
export async function syncFilesToStore(reason: string, build: () => Promise<any>) {
  const c = await store(); const feed = await build(); const DIR = path.join(process.cwd(), "data");
  const rows = (feed.posts ?? []).map((p: any) => ({ platform: p.platform, native_id: String(p.provider_native_id ?? p.provenance?.native_id ?? p.id), url: p.url, status: p.verification === "unverified" ? "unverified" : "verified",
    author: p.author ?? null, author_handle: p.author_handle ?? null, author_avatar: p.author_avatar ?? null, text: p.text ?? null, posted_at: p.posted_at ?? null, company_slug: p.company_slug ?? null, company: p.company ?? null, sector: p.sector ?? null,
    media_json: JSON.stringify(p.media ?? []), engagement_json: p.engagement == null ? null : JSON.stringify(p.engagement), sentiment_score: typeof p.sentiment?.score === "number" ? p.sentiment.score : null,
    evidence_json: null, provenance_json: JSON.stringify(p.provenance ?? null), subreddit: p.subreddit ?? null, title: p.title ?? null, hidden_reason: null, raw_json: JSON.stringify(p) }));
  // never downgrade: a verified row is not overwritten by an unverified duplicate
  const existing = new Map<string, string>(); { const r = await c.execute("select platform || ':' || native_id, status from posts"); for (const x of r.rows) existing.set(String(x[0]), String(x[1])); }
  const keep = rows.filter((r: any) => !(existing.get(`${r.platform}:${r.native_id}`) === "verified" && r.status !== "verified"));
  await upsert(c, "posts", keep);
  await upsert(c, "takeaways", keep.flatMap((r: any) => { const p = JSON.parse(r.raw_json); return p.agent_takeaway?.text ? [{ platform: r.platform, native_id: r.native_id, text: p.agent_takeaway.text, model: p.agent_takeaway.model ?? null, sentiment_score: r.sentiment_score }] : []; }));
  try { const pf = JSON.parse(fs.readFileSync(path.join(DIR, "portfolio.json"), "utf8")); await upsert(c, "companies", pf.companies.map((x: any) => ({ slug: x.slug, name: x.name, sector: x.sector ?? null, payload_json: JSON.stringify(x) })));
    const sec: Record<string, { label: string; n: number }> = {}; for (const x of pf.companies) { (sec[x.sector] ||= { label: x.sector_label || x.sector, n: 0 }).n++; } await upsert(c, "sectors", Object.entries(sec).map(([key, v]) => ({ key, label: v.label, company_count: v.n }))); } catch { /* optional */ }
  try { const pp = JSON.parse(fs.readFileSync(path.join(DIR, "people.json"), "utf8")); await upsert(c, "people", pp.people.map((x: any) => ({ id: x.id, name: x.name, role: x.role ?? null, kind: x.kind ?? null, company_slug: x.company_slug ?? null, payload_json: JSON.stringify(x) }))); } catch { /* optional */ }
  const { posts, ...meta } = feed; await upsert(c, "meta", [{ k: "feed_meta", v: JSON.stringify(meta) }]);
  const at = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  await upsert(c, "ingestion_receipts", [{ receipt_id: `sync-${at}-${Math.random().toString(36).slice(2, 8)}`, kind: "ingestion-sync", received_at: at, detail_json: JSON.stringify({ reason, upserted: keep.length, skipped_downgrade: rows.length - keep.length }) }]);
  scheduleBackup(`after-ingestion:${reason}`);
  return { upserted: keep.length, skipped_downgrade: rows.length - keep.length, counts: await counts(c) };
}
