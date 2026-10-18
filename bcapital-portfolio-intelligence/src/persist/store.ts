/**
 * Durable B Social store.
 *
 *  • Primary DB: libSQL via Drizzle migrations (drizzle-persist/). TURSO_DATABASE_URL + TURSO_AUTH_TOKEN → hosted Turso (permanent);
 *    otherwise PERSIST_DB_URL (default file:./data/b-social.db) — a local libSQL file that survives process restarts but NOT sandbox expiry.
 *  • Off-box durability: every snapshot (SQLite + posts NDJSON + posts CSV + manifest) is written to the OnDemand Media API with the
 *    server-side ONDEMAND_API_KEY (documented POST /media/v1/public/file, fed by the /media/v1/public/file/upload storage step), fetched
 *    back and SHA-256-verified before it is recorded in the `backups` table.
 *  • Boot guard (ensureDurableStore): DB unreachable → fall back to the local file; DB empty → restore from the latest verified OnDemand
 *    Media snapshot; Media unavailable → seed from the repo data files. Nothing here is ever sent to the browser except counts/ids.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { createClient, type Client, type InStatement } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { PERSIST_TABLES, PRIMARY_KEYS } from "./schema.js";
import { ONDEMAND_USER_AGENT } from "../config.js";

type Table = (typeof PERSIST_TABLES)[number];
export type Counts = { posts_by_status: Record<string, number>; posts_by_platform_status: Record<string, number>; posts_by_sector_visible: Record<string, number>; tables: Record<string, number> };
export type BackupFile = { kind: "sqlite" | "ndjson" | "csv" | "manifest"; name: string; media_id: string; media_url: string; bytes: number; sha256: string; encoded_sha256: string; encoding: string; verified: boolean; created_at: string };
export type BackupResult = { snapshot_ts: string; created_at: string; reason: string; counts: Counts; content_sha256: string; files: BackupFile[] };

const ROOT = process.cwd();
const MIGRATIONS = path.join(ROOT, "drizzle-persist");
const LOCAL_URL = () => process.env.PERSIST_DB_URL || `file:${path.join(ROOT, "data", "b-social.db")}`;
const OD_BASE = () => (process.env.ONDEMAND_BASE_URL || "https://api.on-demand.io").replace(/\/$/, "");
const OD_KEY = () => process.env.ONDEMAND_API_KEY || "";
export const BACKUP_EXTERNAL_USER = () => process.env.BACKUP_EXTERNAL_USER_ID || "bsocial-backup";
const MEDIA_PLUGIN = () => process.env.BACKUP_MEDIA_PLUGIN_ID || "plugin-1713954536"; // documented example ingest plugin; accepted for text/plain + application/json
const sha = (b: Buffer | string) => crypto.createHash("sha256").update(b).digest("hex");
const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

let client: Client | null = null;
export const state = {
  provider: "unset" as "turso" | "local-libsql" | "unset", hosted: false, ready: false, version: 0,
  boot: { at: null as string | null, action: null as string | null, restored_from: null as null | { media_id: string; name: string; sha256: string; verified: boolean }, error: null as string | null, fallback_reason: null as string | null },
  last_backup: null as null | { snapshot_ts: string; created_at: string; reason: string; files: { kind: string; media_id: string; sha256: string; bytes: number; verified: boolean }[] },
  backup_running: false, last_backup_error: null as string | null,
};
export const bump = () => { state.version++; };

async function open(url: string, authToken?: string) {
  const c = createClient({ url, authToken });
  await c.execute("select 1");
  await migrate(drizzle(c), { migrationsFolder: MIGRATIONS });
  return c;
}
export async function store(): Promise<Client> {
  if (client) return client;
  const turso = process.env.TURSO_DATABASE_URL || "";
  if (turso) {
    try { client = await open(turso, process.env.TURSO_AUTH_TOKEN || undefined); state.provider = "turso"; state.hosted = true; return client; }
    catch (e) { state.boot.fallback_reason = `TURSO_DATABASE_URL unreachable: ${(e as Error).message.slice(0, 160)}`; }
  }
  fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });
  client = await open(LOCAL_URL()); state.provider = "local-libsql"; state.hosted = false; return client;
}

const n = async (c: Client, q: string) => Number((await c.execute(q)).rows[0]?.[0] ?? 0);
export async function counts(c?: Client): Promise<Counts> {
  c ??= await store();
  const tables: Record<string, number> = {}; for (const t of PERSIST_TABLES) tables[t] = await n(c, `select count(*) from ${t}`);
  const pick = async (q: string) => Object.fromEntries((await c!.execute(q)).rows.map((r) => [String(r[0]), Number(r[1])]));
  return { tables, posts_by_status: await pick("select status, count(*) from posts group by 1 order by 1"), posts_by_platform_status: await pick("select platform || '/' || status, count(*) from posts group by 1 order by 1"),
    posts_by_sector_visible: await pick("select sector, count(*) from posts where status != 'hidden' group by 1 order by 1") };
}
/** Order-independent content fingerprint: sha256 over sorted platform|native_id|status|sha256(raw_json). Identical data ⇒ identical hash on any DB. */
export async function contentSha256(c?: Client): Promise<string> {
  c ??= await store(); const r = await c.execute("select platform, native_id, status, raw_json from posts order by platform, native_id");
  const h = crypto.createHash("sha256"); for (const row of r.rows) h.update(`${row[0]}|${row[1]}|${row[2]}|${sha(String(row[3] ?? ""))}\n`); return h.digest("hex");
}

/** Idempotent upsert of every row of `rows` into `table` (ON CONFLICT(pk) DO UPDATE). */
export async function upsert(c: Client, table: Table, rows: Record<string, unknown>[], chunk = 200) {
  if (!rows.length) return 0; const cols = Object.keys(rows[0]); const pk = PRIMARY_KEYS[table]; const upd = cols.filter((k) => !pk.includes(k));
  const sqlText = `insert into ${table} (${cols.join(",")}) values (${cols.map(() => "?").join(",")}) on conflict(${pk.join(",")}) do ${upd.length ? `update set ${upd.map((k) => `${k}=excluded.${k}`).join(",")}` : "nothing"}`;
  for (let i = 0; i < rows.length; i += chunk) {
    const batch: InStatement[] = rows.slice(i, i + chunk).map((r) => ({ sql: sqlText, args: cols.map((k) => (r[k] === undefined ? null : (r[k] as any))) }));
    await c.batch(batch, "write");
  }
  bump(); return rows.length;
}
/** Copy every table of a snapshot SQLite file into the store (idempotent; keyed on each table's PK, posts on (native_id, platform)). */
export async function importSnapshotFile(file: string, c?: Client) {
  c ??= await store(); const src = createClient({ url: `file:${file}` }); const loaded: Record<string, number> = {};
  try {
    for (const t of PERSIST_TABLES) {
      const exists = await n(src, `select count(*) from sqlite_master where type='table' and name='${t}'`); if (!exists) { loaded[t] = 0; continue; }
      let off = 0; loaded[t] = 0;
      for (;;) { const r = await src.execute(`select * from ${t} limit 1000 offset ${off}`); if (!r.rows.length) break;
        await upsert(c, t, r.rows.map((row) => Object.fromEntries(r.columns.map((col, i) => [col, row[i]])))); loaded[t] += r.rows.length; off += r.rows.length; }
    }
  } finally { src.close(); }
  return loaded;
}

// ---------------- snapshot export ----------------
const CSV_COLS = ["platform", "native_id", "url", "status", "author", "author_handle", "author_avatar", "text", "posted_at", "company_slug", "company", "sector", "media_json", "engagement_json", "sentiment_score", "evidence_json", "provenance_json", "subreddit", "title", "hidden_reason"];
const csvCell = (v: unknown) => { if (v === null || v === undefined) return ""; const s = String(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export async function exportSnapshot(dir = fs.mkdtempSync(path.join(os.tmpdir(), "bsocial-snap-"))) {
  const c = await store(); const ts = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"); const base = path.join(dir, `b-social-snapshot-${ts}`);
  const sqliteFile = `${base}.sqlite`;
  if (state.provider === "local-libsql") { await c.execute({ sql: "vacuum into ?", args: [sqliteFile] }); }
  else { const out = await open(`file:${sqliteFile}`); try { for (const t of PERSIST_TABLES) { let off = 0; for (;;) { const r = await c.execute(`select * from ${t} limit 1000 offset ${off}`); if (!r.rows.length) break; await upsert(out, t, r.rows.map((row) => Object.fromEntries(r.columns.map((col, i) => [col, row[i]])))); off += r.rows.length; } } } finally { out.close(); } }
  const nd = fs.openSync(`${base}.posts.ndjson`, "w"); const cv = fs.openSync(`${base}.posts.csv`, "w"); fs.writeSync(cv, CSV_COLS.join(",") + "\n");
  let off = 0; for (;;) { const r = await c.execute(`select * from posts order by status, posted_at desc, platform, native_id limit 1000 offset ${off}`); if (!r.rows.length) break;
    for (const row of r.rows) { const o = Object.fromEntries(r.columns.map((col, i) => [col, row[i]])); fs.writeSync(nd, JSON.stringify(o) + "\n"); fs.writeSync(cv, CSV_COLS.map((k) => csvCell(o[k])).join(",") + "\n"); }
    off += r.rows.length; }
  fs.closeSync(nd); fs.closeSync(cv);
  return { ts, dir, files: { sqlite: sqliteFile, ndjson: `${base}.posts.ndjson`, csv: `${base}.posts.csv` }, counts: await counts(c), content_sha256: await contentSha256(c) };
}

// ---------------- OnDemand Media (live docs: Media API → createmediaurl / fetchmedia / deletemedia) ----------------
const odHeaders = () => ({ apikey: OD_KEY(), "user-agent": ONDEMAND_USER_AGENT });
async function odUploadBytes(name: string, bytes: Buffer, mime: string): Promise<string> {
  const fd = new FormData(); fd.append("file", new Blob([new Uint8Array(bytes)], { type: mime }), name);
  const r = await fetch(`${OD_BASE()}/media/v1/public/file/upload`, { method: "POST", headers: odHeaders(), body: fd, signal: AbortSignal.timeout(300_000) });
  const j: any = await r.json().catch(() => ({})); if (!r.ok || typeof j?.data !== "string") throw new Error(`media upload HTTP ${r.status}: ${j?.message ?? ""}`); return j.data;
}
async function odCreate(name: string, url: string, sizeBytes: number) {
  const body = { url, name, plugins: [MEDIA_PLUGIN()], responseMode: "sync", externalUserId: BACKUP_EXTERNAL_USER(), sizeBytes, createdBy: "b-social-backup", updatedBy: "b-social-backup" };
  const r = await fetch(`${OD_BASE()}/media/v1/public/file`, { method: "POST", headers: { ...odHeaders(), "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(300_000) });
  const j: any = await r.json().catch(() => ({})); if (!r.ok || !j?.data?.id) throw new Error(`create media HTTP ${r.status}: ${j?.message ?? ""}`); return j.data as { id: string; url: string; createdAt?: string };
}
export async function odList(limit = 50, page = 1): Promise<any[]> {
  const r = await fetch(`${OD_BASE()}/media/v1/public/file?limit=${limit}&page=${page}&sort=-createdAt&externalUserId=${encodeURIComponent(BACKUP_EXTERNAL_USER())}`, { headers: odHeaders(), signal: AbortSignal.timeout(30_000) });
  const j: any = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`fetch media HTTP ${r.status}`); return Array.isArray(j?.data) ? j.data : [];
}
const fetchBytes = async (u: string) => { const r = await fetch(u, { signal: AbortSignal.timeout(300_000) }); if (!r.ok) throw new Error(`download HTTP ${r.status}`); return Buffer.from(await r.arrayBuffer()); };
/** Binary files are gzip+base64 encoded into a .txt (the Media API rejects application/octet-stream and application/gzip — errors.mime.type.not.supported). */
export async function storeFile(kind: BackupFile["kind"], file: string): Promise<BackupFile> {
  const raw = fs.readFileSync(file); const binary = kind !== "manifest";
  const enc = binary ? Buffer.from(zlib.gzipSync(raw, { level: 9 }).toString("base64")) : raw;
  const name = binary ? `${path.basename(file)}.gz.b64.txt` : path.basename(file);
  const stored = await odUploadBytes(name, enc, binary ? "text/plain" : "application/json");
  const media = await odCreate(name, stored, enc.length);
  const back = await fetchBytes(media.url); // fetch back and verify
  const verified = sha(back) === sha(enc) && (!binary || sha(zlib.gunzipSync(Buffer.from(back.toString("utf8"), "base64"))) === sha(raw));
  if (!verified) throw new Error(`checksum mismatch after fetch-back for ${name}`);
  return { kind, name, media_id: media.id, media_url: media.url, bytes: raw.length, sha256: sha(raw), encoded_sha256: sha(enc), encoding: binary ? "gzip+base64" : "identity", verified, created_at: media.createdAt ?? nowIso() };
}
export async function runBackup(reason: string): Promise<BackupResult> {
  if (!OD_KEY()) throw new Error("ONDEMAND_API_KEY is not configured on the server");
  if (state.backup_running) throw new Error("a backup is already running");
  state.backup_running = true;
  try {
    const snap = await exportSnapshot(); const files: BackupFile[] = [];
    for (const k of ["sqlite", "ndjson", "csv"] as const) files.push(await storeFile(k, snap.files[k]));
    const created_at = nowIso();
    const manifest = { kind: "b-social-snapshot", snapshot_ts: snap.ts, created_at, reason, provider: state.provider, counts: snap.counts, content_sha256: snap.content_sha256,
      files: files.map(({ media_url, ...f }) => f), restore: "Download the sqlite part (fresh signed URL from GET /media/v1/public/file), base64-decode, gunzip, verify sha256, then importSnapshotFile()." };
    const mf = path.join(snap.dir, `b-social-snapshot-${snap.ts}.manifest.json`); fs.writeFileSync(mf, JSON.stringify(manifest, null, 1));
    files.push(await storeFile("manifest", mf));
    const c = await store();
    await upsert(c, "meta", [{ k: "restored_snapshot_ts", v: snap.ts }]);
    await upsert(c, "backups", files.map((f) => ({ media_id: f.media_id, name: f.name, sha256: f.sha256, bytes: f.bytes, created_at: f.created_at, source_url: f.media_url.split("?")[0] })));
    await upsert(c, "ingestion_receipts", [{ receipt_id: `backup-${snap.ts}`, kind: "backup", received_at: created_at, detail_json: JSON.stringify({ reason, media_ids: files.map((f) => f.media_id), content_sha256: snap.content_sha256 }) }]);
    fs.rmSync(snap.dir, { recursive: true, force: true });
    state.last_backup = { snapshot_ts: snap.ts, created_at, reason, files: files.map((f) => ({ kind: f.kind, media_id: f.media_id, sha256: f.sha256, bytes: f.bytes, verified: f.verified })) }; state.last_backup_error = null;
    return { snapshot_ts: snap.ts, created_at, reason, counts: snap.counts, content_sha256: snap.content_sha256, files };
  } catch (e) { state.last_backup_error = (e as Error).message; throw e; }
  finally { state.backup_running = false; }
}
let pending: NodeJS.Timeout | null = null;
/** Debounced post-ingestion backup (coalesces bursts of writes into one Media snapshot). */
export function scheduleBackup(reason: string, delayMs = 15_000) {
  if (!OD_KEY()) return; if (pending) clearTimeout(pending);
  pending = setTimeout(() => { pending = null; runBackup(reason).then((r) => console.log(JSON.stringify({ msg: "backup.ok", reason, ts: r.snapshot_ts, media: r.files.map((f) => f.media_id) }))).catch((e) => console.error(JSON.stringify({ msg: "backup.error", reason, error: (e as Error).message }))); }, delayMs);
  pending.unref?.();
}

/** Latest verified snapshot in OnDemand Media → decode → verify sha256 against its manifest → import. */
export async function restoreFromMedia(c?: Client, opts: { newerThan?: string | null } = {}) {
  c ??= await store(); const list = [...(await odList(50, 1)), ...(await odList(50, 2).catch(() => []))];
  const manifests = list.filter((m) => /^b-social-snapshot-.*\.manifest\.json$/.test(String(m.name)));
  for (const m of manifests) {
    try {
      const man = JSON.parse((await fetchBytes(m.url)).toString("utf8"));
      if (opts.newerThan && String(man.snapshot_ts) <= opts.newerThan) return null; // DB already contains this (or a newer) snapshot
      const part = (man.files || []).find((f: any) => f.kind === "sqlite"); if (!part) continue;
      const media = list.find((x) => x.id === part.media_id); if (!media?.url) continue;
      const enc = await fetchBytes(media.url); if (sha(enc) !== part.encoded_sha256) throw new Error("encoded checksum mismatch");
      const raw = zlib.gunzipSync(Buffer.from(enc.toString("utf8"), "base64")); if (sha(raw) !== part.sha256) throw new Error("sqlite checksum mismatch");
      const tmp = path.join(os.tmpdir(), `restore-${part.media_id}.sqlite`); fs.writeFileSync(tmp, raw);
      const loaded = await importSnapshotFile(tmp, c); fs.rmSync(tmp, { force: true });
      await upsert(c, "meta", [{ k: "restored_snapshot_ts", v: String(man.snapshot_ts) }]);
      return { media_id: part.media_id, manifest_media_id: m.id, name: part.name, sha256: part.sha256, verified: true, loaded, snapshot_ts: man.snapshot_ts };
    } catch (e) { console.error(JSON.stringify({ msg: "restore.skip", manifest: m.id, error: (e as Error).message })); }
  }
  throw new Error(`no verifiable b-social snapshot found in OnDemand Media (externalUserId=${BACKUP_EXTERNAL_USER()}, ${manifests.length} manifests checked)`);
}
