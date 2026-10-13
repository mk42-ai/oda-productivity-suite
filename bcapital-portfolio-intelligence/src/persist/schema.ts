/**
 * B Social durable schema (Drizzle, SQLite dialect → libSQL / Turso). Mirrors scripts/persistence/schema.sql (the snapshot format),
 * so a snapshot file and the hosted DB are interchangeable. Every table is keyed for idempotent upserts; posts on (native_id, platform).
 * Migrations: `npx drizzle-kit generate --config drizzle.persist.config.ts` → drizzle-persist/, applied at boot by src/persist/store.ts.
 */
import { sqliteTable, text, integer, real, primaryKey, index } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  platform: text("platform").notNull(), native_id: text("native_id").notNull(), url: text("url").notNull(),
  status: text("status", { enum: ["verified", "unverified", "hidden"] }).notNull(),
  author: text("author"), author_handle: text("author_handle"), author_avatar: text("author_avatar"), text: text("text"), posted_at: text("posted_at"),
  company_slug: text("company_slug"), company: text("company"), sector: text("sector"), media_json: text("media_json"), engagement_json: text("engagement_json"), sentiment_score: real("sentiment_score"),
  evidence_json: text("evidence_json"), provenance_json: text("provenance_json"), subreddit: text("subreddit"), title: text("title"), hidden_reason: text("hidden_reason"), raw_json: text("raw_json"),
}, (t) => [primaryKey({ columns: [t.native_id, t.platform] }), index("posts_status_sector").on(t.status, t.sector), index("posts_posted").on(t.posted_at)]);

export const takeaways = sqliteTable("takeaways", {
  platform: text("platform").notNull(), native_id: text("native_id").notNull(), text: text("text").notNull(), model: text("model"), sentiment_score: real("sentiment_score"),
}, (t) => [primaryKey({ columns: [t.native_id, t.platform] })]);

export const companies = sqliteTable("companies", { slug: text("slug").primaryKey(), name: text("name").notNull(), sector: text("sector"), payload_json: text("payload_json").notNull() });
export const people = sqliteTable("people", { id: text("id").primaryKey(), name: text("name").notNull(), role: text("role"), kind: text("kind"), company_slug: text("company_slug"), payload_json: text("payload_json").notNull() });
export const sectors = sqliteTable("sectors", { key: text("key").primaryKey(), label: text("label").notNull(), company_count: integer("company_count") });
export const sources = sqliteTable("sources", { slug: text("slug").primaryKey(), payload_json: text("payload_json").notNull() });
export const workerRuns = sqliteTable("worker_runs", {
  job_id: text("job_id").primaryKey(), sector: text("sector"), source: text("source"), status: text("status"), started_at: text("started_at"), finished_at: text("finished_at"),
  posts_fetched: integer("posts_fetched"), posts_admitted: integer("posts_admitted"), posts_rejected: integer("posts_rejected"), payload_json: text("payload_json"),
});
export const ingestionReceipts = sqliteTable("ingestion_receipts", { receipt_id: text("receipt_id").primaryKey(), kind: text("kind").notNull(), received_at: text("received_at").notNull(), detail_json: text("detail_json") });
export const backups = sqliteTable("backups", { media_id: text("media_id").primaryKey(), name: text("name").notNull(), sha256: text("sha256").notNull(), bytes: integer("bytes"), created_at: text("created_at").notNull(), source_url: text("source_url") });
export const meta = sqliteTable("meta", { k: text("k").primaryKey(), v: text("v") });
/** PitchBook company profiles — written by the monthly sync workflow (POST /pitchbook/sync/webhook), read server-side by the company section. */
export const pitchbookProfiles = sqliteTable("pitchbook_profiles", {
  company_id: text("company_id").primaryKey(), name: text("name").notNull(), profile_json: text("profile_json").notNull(), availability_json: text("availability_json").notNull(),
  source_url: text("source_url"), fetched_at: text("fetched_at").notNull(), updated_at: text("updated_at").notNull(),
});
export const pitchbookSyncRuns = sqliteTable("pitchbook_sync_runs", {
  run_id: text("run_id").primaryKey(), started_at: text("started_at").notNull(), finished_at: text("finished_at"), trigger: text("trigger").notNull(),
  companies_refreshed: integer("companies_refreshed").notNull().default(0), fields_populated: integer("fields_populated").notNull().default(0), empty_state_count: integer("empty_state_count").notNull().default(0),
  errors_json: text("errors_json").notNull().default("[]"), detail_json: text("detail_json"),
});

/** Copy order for snapshot import/export (also the per-table row-count report). */
export const pitchbookBatchRuns = sqliteTable("pitchbook_batch_runs", {
  batch_id: text("batch_id").primaryKey(), status: text("status").notNull(), method: text("method").notNull(), endpoint_id: text("endpoint_id"), plugin_id: text("plugin_id"),
  submitted_at: text("submitted_at").notNull(), completed_at: text("completed_at"), total: integer("total"), succeeded: integer("succeeded"), failed: integer("failed"), retried: integer("retried"), unmatched: integer("unmatched"), notes_json: text("notes_json"),
});
export const pitchbookBatchQueries = sqliteTable("pitchbook_batch_queries", {
  query_id: text("query_id").primaryKey(), batch_id: text("batch_id").notNull(), slug: text("slug").notNull(), pb_id: text("pb_id"), lookup: text("lookup"), session_id: text("session_id"), message_id: text("message_id"),
  status: text("status").notNull(), attempt: integer("attempt").notNull(), submitted_at: text("submitted_at").notNull(), completed_at: text("completed_at"), http_status: integer("http_status"), error: text("error"), answer_chars: integer("answer_chars"),
}, (t) => [index("pbq_batch").on(t.batch_id), index("pbq_slug").on(t.slug)]);
export const pitchbookCompanyProfiles = sqliteTable("pitchbook_company_profiles", {
  slug: text("slug").primaryKey(), pb_id: text("pb_id"), state: text("state").notNull(), batch_id: text("batch_id"), query_id: text("query_id"), fetched_at: text("fetched_at").notNull(),
  profile_json: text("profile_json").notNull(), raw_json: text("raw_json"), fields_populated: integer("fields_populated"), fields_unavailable: integer("fields_unavailable"),
});

export const PERSIST_TABLES = ["posts", "takeaways", "companies", "people", "sectors", "sources", "worker_runs", "ingestion_receipts", "backups", "meta", "pitchbook_profiles", "pitchbook_sync_runs", "pitchbook_batch_runs", "pitchbook_batch_queries", "pitchbook_company_profiles"] as const;
export const PRIMARY_KEYS: Record<(typeof PERSIST_TABLES)[number], string[]> = {
  posts: ["native_id", "platform"], takeaways: ["native_id", "platform"], companies: ["slug"], people: ["id"], sectors: ["key"], sources: ["slug"], worker_runs: ["job_id"], ingestion_receipts: ["receipt_id"], backups: ["media_id"], meta: ["k"], pitchbook_profiles: ["company_id"], pitchbook_sync_runs: ["run_id"], pitchbook_batch_runs: ["batch_id"], pitchbook_batch_queries: ["query_id"], pitchbook_company_profiles: ["slug"],
};
