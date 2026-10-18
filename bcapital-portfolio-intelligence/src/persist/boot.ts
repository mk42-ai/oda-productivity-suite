/**
 * Boot-time guard for the durable B Social store. Order:
 *   1. open DB (Turso when configured, else local libSQL file) + run Drizzle migrations;
 *   2. DB has posts → ready;
 *   3. DB empty → restore from the latest SHA-256-verified OnDemand Media snapshot;
 *   4. Media unavailable/empty → seed from the repo data files (the file-built feed) and take a first Media backup.
 * Never throws: on total failure the API keeps serving the file-built feed (src/social-data.ts fallback).
 */
import { store, state, counts, restoreFromMedia, bump } from "./store.js";
import { syncFilesToStore } from "./feed.js";

export async function ensureDurableStore(buildFromFiles: () => Promise<any>) {
  state.boot.at = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  try {
    const c = await store();
    const before = await counts(c);
    if ((before.tables.posts ?? 0) > 0) {
      state.boot.action = "existing-db";
      // merge (upsert-only) any NEWER verified Media snapshot than the one this DB last contained — never deletes rows
      try { const last = String((await c.execute("select v from meta where k='restored_snapshot_ts'")).rows[0]?.[0] ?? "");
        const r = process.env.PERSIST_SKIP_MEDIA_RESTORE === "1" ? null : await restoreFromMedia(c, { newerThan: last || null });
        if (r) { state.boot.action = "existing-db+merged-newer-media-snapshot"; state.boot.restored_from = { media_id: r.media_id, name: r.name, sha256: r.sha256, verified: r.verified }; } }
      catch (e) { state.boot.error = `newer-snapshot check: ${(e as Error).message}`; }
    }
    else {
      try {
        if (process.env.PERSIST_SKIP_MEDIA_RESTORE === "1") throw new Error("PERSIST_SKIP_MEDIA_RESTORE=1");
        const r = await restoreFromMedia(c); if (!r) throw new Error("no snapshot"); state.boot.action = "restored-from-ondemand-media"; state.boot.restored_from = { media_id: r.media_id, name: r.name, sha256: r.sha256, verified: r.verified };
      } catch (e) {
        state.boot.error = (e as Error).message; state.boot.action = "seeded-from-repo-files";
        await syncFilesToStore("boot-seed", buildFromFiles);
      }
    }
    // re-hydrate the last verified OnDemand Media backup from the durable `backups` table (survives restarts)
    try { const r = await c.execute("select media_id, name, sha256, bytes, created_at from backups order by created_at desc limit 4");
      if (r.rows.length) { const ts = (String(r.rows[0][1]).match(/b-social-snapshot-(\d{8}T\d{6}Z)/) || [])[1] ?? "";
        const same = r.rows.filter((x) => String(x[1]).includes(ts));
        state.last_backup = { snapshot_ts: ts, created_at: String(r.rows[0][4]), reason: "persisted", files: same.map((x) => ({ kind: /\.manifest\.json$/.test(String(x[1])) ? "manifest" : /\.ndjson/.test(String(x[1])) ? "ndjson" : /\.csv/.test(String(x[1])) ? "csv" : "sqlite", media_id: String(x[0]), sha256: String(x[2]), bytes: Number(x[3]), verified: true })) }; } } catch { /* optional */ }
    state.ready = true; bump();
    const after = await counts(c);
    console.log(JSON.stringify({ msg: "persist.boot", provider: state.provider, hosted: state.hosted, action: state.boot.action, restored_from: state.boot.restored_from, posts_by_status: after.posts_by_status, tables: after.tables, fallback_reason: state.boot.fallback_reason, note: state.boot.error }));
  } catch (e) {
    state.boot.error = (e as Error).message; state.boot.action = "unavailable"; state.ready = false;
    console.error(JSON.stringify({ msg: "persist.boot.failed", error: state.boot.error }));
  }
}
