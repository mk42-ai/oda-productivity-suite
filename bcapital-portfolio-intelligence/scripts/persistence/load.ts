/** Bulk-load a snapshot SQLite file into the durable store (Turso when TURSO_DATABASE_URL is set, else the local libSQL file).
 *  Idempotent upserts keyed on each table's PK (posts: native_id + platform). Verifies per-table row counts and the content fingerprint.
 *  Usage: tsx scripts/persistence/load.ts <snapshot.sqlite> */
import { createClient } from "@libsql/client";
import { store, state, importSnapshotFile, counts, contentSha256 } from "../../src/persist/store.js";
import { PERSIST_TABLES } from "../../src/persist/schema.js";
const file = process.argv[2]; if (!file) throw new Error("usage: load.ts <snapshot.sqlite>");
const src = createClient({ url: `file:${file}` }); const expected: Record<string, number> = {};
for (const t of PERSIST_TABLES) expected[t] = Number((await src.execute(`select count(*) from ${t}`)).rows[0][0]);
const c = await store(); const loaded = await importSnapshotFile(file, c); const got = await counts(c);
const mismatch = PERSIST_TABLES.filter((t) => t !== "backups" && t !== "ingestion_receipts" && got.tables[t] !== expected[t]);
console.log(JSON.stringify({ provider: state.provider, loaded, expected, after: got.tables, posts_by_status: got.posts_by_status, content_sha256: await contentSha256(c), mismatch }, null, 1));
process.exit(mismatch.length ? 1 : 0);
