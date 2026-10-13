-- B Social durable schema (SQLite / libSQL / Turso compatible). Idempotent: every table keyed for upsert.
CREATE TABLE IF NOT EXISTS posts (
  platform TEXT NOT NULL, native_id TEXT NOT NULL, url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('verified','unverified','hidden')),
  author TEXT, author_handle TEXT, author_avatar TEXT, text TEXT, posted_at TEXT,
  company_slug TEXT, company TEXT, sector TEXT, media_json TEXT, engagement_json TEXT, sentiment_score REAL,
  evidence_json TEXT, provenance_json TEXT, subreddit TEXT, title TEXT, hidden_reason TEXT, raw_json TEXT,
  PRIMARY KEY (native_id, platform));
CREATE INDEX IF NOT EXISTS posts_status_sector ON posts(status, sector);
CREATE INDEX IF NOT EXISTS posts_posted ON posts(posted_at);
CREATE TABLE IF NOT EXISTS takeaways (platform TEXT NOT NULL, native_id TEXT NOT NULL, text TEXT NOT NULL, model TEXT, sentiment_score REAL, PRIMARY KEY (native_id, platform));
CREATE TABLE IF NOT EXISTS companies (slug TEXT PRIMARY KEY, name TEXT NOT NULL, sector TEXT, payload_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS people (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT, kind TEXT, company_slug TEXT, payload_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS worker_runs (job_id TEXT PRIMARY KEY, sector TEXT, source TEXT, status TEXT, started_at TEXT, finished_at TEXT, posts_fetched INTEGER, posts_admitted INTEGER, posts_rejected INTEGER, payload_json TEXT);
CREATE TABLE IF NOT EXISTS sectors (key TEXT PRIMARY KEY, label TEXT NOT NULL, company_count INTEGER);
CREATE TABLE IF NOT EXISTS sources (slug TEXT PRIMARY KEY, payload_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ingestion_receipts (receipt_id TEXT PRIMARY KEY, kind TEXT NOT NULL, received_at TEXT NOT NULL, detail_json TEXT);
CREATE TABLE IF NOT EXISTS backups (media_id TEXT PRIMARY KEY, name TEXT NOT NULL, sha256 TEXT NOT NULL, bytes INTEGER, created_at TEXT NOT NULL, source_url TEXT);
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
