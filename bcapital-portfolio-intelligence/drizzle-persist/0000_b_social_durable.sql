CREATE TABLE `backups` (
	`media_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sha256` text NOT NULL,
	`bytes` integer,
	`created_at` text NOT NULL,
	`source_url` text
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sector` text,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ingestion_receipts` (
	`receipt_id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`received_at` text NOT NULL,
	`detail_json` text
);
--> statement-breakpoint
CREATE TABLE `meta` (
	`k` text PRIMARY KEY NOT NULL,
	`v` text
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text,
	`kind` text,
	`company_slug` text,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`platform` text NOT NULL,
	`native_id` text NOT NULL,
	`url` text NOT NULL,
	`status` text NOT NULL,
	`author` text,
	`author_handle` text,
	`author_avatar` text,
	`text` text,
	`posted_at` text,
	`company_slug` text,
	`company` text,
	`sector` text,
	`media_json` text,
	`engagement_json` text,
	`sentiment_score` real,
	`evidence_json` text,
	`provenance_json` text,
	`subreddit` text,
	`title` text,
	`hidden_reason` text,
	`raw_json` text,
	PRIMARY KEY(`native_id`, `platform`)
);
--> statement-breakpoint
CREATE INDEX `posts_status_sector` ON `posts` (`status`,`sector`);--> statement-breakpoint
CREATE INDEX `posts_posted` ON `posts` (`posted_at`);--> statement-breakpoint
CREATE TABLE `sectors` (
	`key` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`company_count` integer
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`slug` text PRIMARY KEY NOT NULL,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `takeaways` (
	`platform` text NOT NULL,
	`native_id` text NOT NULL,
	`text` text NOT NULL,
	`model` text,
	`sentiment_score` real,
	PRIMARY KEY(`native_id`, `platform`)
);
--> statement-breakpoint
CREATE TABLE `worker_runs` (
	`job_id` text PRIMARY KEY NOT NULL,
	`sector` text,
	`source` text,
	`status` text,
	`started_at` text,
	`finished_at` text,
	`posts_fetched` integer,
	`posts_admitted` integer,
	`posts_rejected` integer,
	`payload_json` text
);
