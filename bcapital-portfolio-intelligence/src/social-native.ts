import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import initSqlJs, { type Database } from "sql.js";
import { get as blobGet, put as blobPut } from "@vercel/blob";
import { socialRejection, publicSocialPost } from "./social-policy.js";

const require = createRequire(import.meta.url);
const file = () => process.env.SOCIAL_DB_PATH || path.join(process.cwd(), "data/social-native.sqlite");
const blobPath = () => process.env.SOCIAL_BLOB_PATHNAME || "b-capital/social-native.sqlite";
const blobToken = () => process.env.SOCIAL_BLOB_TOKEN || "";
const publicKeyPath = () => process.env.SOCIAL_RECEIPT_PUBLIC_KEY_PATH || path.join(process.cwd(), "data/social-receipt-public.pem");
let cache: { db: Database; mtime: number } | null = null;
const sha = (x: string) => crypto.createHash("sha256").update(x).digest("hex");
const sign = (x: string, privateKey: string) => crypto.sign(null, Buffer.from(x), privateKey).toString("base64");
export async function nativeDb() {
  const mtime = fs.existsSync(file()) ? fs.statSync(file()).mtimeMs : 0;
  if (cache && cache.mtime === mtime) return cache.db;
  const SQL = await initSqlJs({ locateFile: (f) => require.resolve(`sql.js/dist/${f}`) });
  let bytes: Uint8Array | undefined;
  if (!mtime && blobToken()) {
    const res = await blobGet(blobPath(), { access: "private", token: blobToken(), useCache: false });
    if (res?.stream) bytes = new Uint8Array(await new Response(res.stream).arrayBuffer());
  }
  const db = new SQL.Database(bytes || (mtime ? fs.readFileSync(file()) : undefined));
  db.run(`CREATE TABLE IF NOT EXISTS native_posts (key TEXT PRIMARY KEY, canonical TEXT NOT NULL UNIQUE, payload TEXT NOT NULL, receipt TEXT NOT NULL, signature TEXT NOT NULL, first_seen_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS quarantine (key TEXT PRIMARY KEY, payload TEXT NOT NULL, reason TEXT NOT NULL, received_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS collection_state (id TEXT PRIMARY KEY, payload TEXT NOT NULL);`);
  cache = { db, mtime }; return db;
}
export async function persistNative() {
  if (!cache) return;
  const bytes = Buffer.from(cache.db.export());
  fs.mkdirSync(path.dirname(file()), { recursive: true });
  const temp = `${file()}.tmp`; fs.writeFileSync(temp, bytes); fs.renameSync(temp, file());
  cache.mtime = fs.statSync(file()).mtimeMs;
  if (blobToken()) await blobPut(blobPath(), bytes, { access: "private", token: blobToken(), addRandomSuffix: false, allowOverwrite: true, contentType: "application/vnd.sqlite3" });
}
function rows(db: Database, sql: string) { const r = db.exec(sql); return r[0]?.values || []; }
export function nativeStorageStatus() { return { backend: "sqlite", local_persistent: fs.existsSync(file()), durable_configured: !!blobToken(), durable_backend: blobToken() ? "private-vercel-blob" : null, warning: blobToken() ? null : "Local SQLite survives process restarts only. Durable remote storage is not configured; an ephemeral sandbox is not production persistence." }; }
export async function readNativePosts(): Promise<any[]> {
  const db = await nativeDb(); if (!fs.existsSync(publicKeyPath())) return [];
  return rows(db, "SELECT payload, receipt, signature FROM native_posts WHERE key NOT IN (SELECT key FROM quarantine) ORDER BY json_extract(payload,'$.posted_at') DESC").flatMap((r) => {
    try { const payload = String(r[0]); const receipt = String(r[1]); const sig = String(r[2]); if (!crypto.verify(null, Buffer.from(payload + "\n" + receipt), fs.readFileSync(publicKeyPath()), Buffer.from(sig, "base64"))) return []; const p = JSON.parse(payload); const companies = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/portfolio.json"), "utf8")).companies; const relevance = matchNativeRelevance(p.text, companies); return socialRejection(p) === null && relevance?.company_slug === p.company_slug ? [publicSocialPost(p)] : []; } catch { return []; }
  });
}
export async function readCollectionState() {
  const db = await nativeDb(); const r = rows(db, "SELECT payload FROM collection_state WHERE id='current'");
  return r.length ? JSON.parse(String(r[0][0])) : { status: "not_started", workers: [], fetched: 0, admitted_unique: 0, duplicate: 0, excluded: 0, failed: 0, storage: nativeStorageStatus() };
}
export async function writeCollectionState(state: any) { const db = await nativeDb(); db.run("INSERT OR REPLACE INTO collection_state (id,payload) VALUES ('current',?)", [JSON.stringify(state)]); await persistNative(); }
export function matchNativeRelevance(text: string, companies: any[]) {
  if (/@BCapitalGroup\b/i.test(text) && /\bB Capital\b/i.test(text)) return { company_slug: "b-capital", company: "B Capital", sector: "ai-enterprise", evidence: "Native post explicitly mentions @BCapitalGroup and B Capital; portfolio-owner relevance." };
  const hits = companies.filter((c) => c.name.length >= 5 && /raised|funding|series|round|portfolio|investment|partnership|B Capital/.test(text) && new RegExp(`(^|[^\\p{L}\\p{N}])${c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}\\p{N}]|$)`, "u").test(text));
  return hits.length === 1 ? { company_slug: hits[0].slug, company: hits[0].name, sector: hits[0].sector, evidence: `Unique exact portfolio name '${hits[0].name}' in original native post text; membership from data/portfolio.json.` } : null;
}
export async function importNativeXReceipt(envelope: any, companies: any[], source: { container_sha256: string; received_at: string; source_ref: string }, privateKey: string) {
  if (envelope.name !== "FetchTweetDetails" || envelope.pluginId !== "plugin-1716326559" || envelope.statusCode !== 200 || !privateKey) throw new Error("An original successful native connector envelope and local signing key are required");
  const response = typeof envelope.response === "string" ? JSON.parse(envelope.response) : envelope.response;
  const db = await nativeDb(); let fetched = 0, admitted = 0, duplicate = 0, excluded = 0;
  for (const item of response.results || []) {
    fetched++; const id = String(item.tweet_id || ""); const username = String(item.user?.username || ""); const key = `x:${id}`;
    let reason: string | null = null;
    const published = Date.parse(item.creation_date || ""); const nativeDate = /^\d+$/.test(id) ? Number((BigInt(id) >> 22n) + 1288834974657n) : NaN;
    const relevance = matchNativeRelevance(String(item.text || ""), companies);
    if (!id || !/^[A-Za-z0-9_]+$/.test(username)) reason = "missing_native_identity";
    else if (!Number.isFinite(published) || Math.abs(nativeDate - published) > 2000) reason = "native_timestamp_mismatch";
    else if (!relevance) reason = "not_portfolio_relevant";
    if (reason) { db.run("INSERT OR IGNORE INTO quarantine VALUES (?,?,?,?)", [key, JSON.stringify(item), reason, source.received_at]); excluded++; continue; }
    const url = `https://x.com/${username}/status/${id}`;
    const media = (Array.isArray(item.media_url) ? item.media_url : []).filter((u: any) => typeof u === "string" && /^https:\/\//.test(u)).map((u: string) => ({ type: "image", url: u }));
    const videos = (Array.isArray(item.video_url) ? item.video_url : []).filter((u: any) => typeof u === "string" && /^https:\/\//.test(u)).map((u: string) => ({ type: "video", url: u }));
    const when = new Date(published).toISOString();
    const projection = { id, url, author: item.user.name || username, text: item.text, posted_at: when, author_avatar: item.user.profile_pic_url || null, media: [...media, ...videos] };
    const receipt = { origin: "platform-attached-native-response", connector: envelope.pluginId, action: envelope.name, status_code: envelope.statusCode, received_at: source.received_at, provider_retrieved_at: null, source_ref: source.source_ref, source_container_sha256: source.container_sha256, native_payload_sha256: sha(JSON.stringify(item)), raw_native: item, projection_note: "Normalized projection below is derived, not the original provider payload; raw_native is preserved unchanged." };
    const payload = { id: key, platform: "x", provider_native_id: id, url, source_domain: "x.com", author: projection.author, author_handle: username, author_avatar: projection.author_avatar, text: item.text, posted_at: when, retrieved_at: null, first_seen_at: source.received_at, image: media[0]?.url || null, media: projection.media, ...relevance, relevance_evidence: relevance!.evidence, agent_takeaway: null,
      source_evidence: { kind: "provider-response", provider: "x", transport: "server", authenticated: true, plugin_id: envelope.pluginId, native_id: id, fetched_at: source.received_at, raw: projection, receipt_sha256: sha(JSON.stringify(receipt)) } };
    const rejection = socialRejection(payload); if (rejection) { db.run("INSERT OR IGNORE INTO quarantine VALUES (?,?,?,?)", [key, JSON.stringify(item), rejection, source.received_at]); excluded++; continue; }
    const old = db.exec("SELECT key FROM native_posts WHERE key=? OR canonical=?", [key, url]); if (old[0]?.values.length) { duplicate++; continue; }
    const body = JSON.stringify(payload), evidence = JSON.stringify(receipt); db.run("INSERT INTO native_posts VALUES (?,?,?,?,?,?)", [key, url, body, evidence, sign(body + "\n" + evidence, privateKey), source.received_at]); admitted++;
  }
  await persistNative(); return { fetched, admitted_unique: admitted, duplicate, excluded, failed: 0, storage: nativeStorageStatus() };
}

export async function quarantineLegacyPosts(posts: any[]) {
  const db = await nativeDb(); const at = new Date().toISOString(); let count = 0;
  for (const post of posts) { const reason = socialRejection(post) || "legacy_receipt_not_registered"; db.run("INSERT OR IGNORE INTO quarantine VALUES (?,?,?,?)", [`legacy:${post.id}`, JSON.stringify(post), reason, at]); count++; }
  await persistNative(); return count;
}
