CREATE TABLE IF NOT EXISTS `pitchbook_batch_runs` (
	`batch_id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`method` text NOT NULL,
	`endpoint_id` text,
	`plugin_id` text,
	`submitted_at` text NOT NULL,
	`completed_at` text,
	`total` integer,
	`succeeded` integer,
	`failed` integer,
	`retried` integer,
	`unmatched` integer,
	`notes_json` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pitchbook_batch_queries` (
	`query_id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`slug` text NOT NULL,
	`pb_id` text,
	`lookup` text,
	`session_id` text,
	`message_id` text,
	`status` text NOT NULL,
	`attempt` integer NOT NULL,
	`submitted_at` text NOT NULL,
	`completed_at` text,
	`http_status` integer,
	`error` text,
	`answer_chars` integer
);
--> statement-breakpoint
CREATE INDEX `pbq_batch` ON `pitchbook_batch_queries` (`batch_id`);--> statement-breakpoint
CREATE INDEX `pbq_slug` ON `pitchbook_batch_queries` (`slug`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pitchbook_company_profiles` (
	`slug` text PRIMARY KEY NOT NULL,
	`pb_id` text,
	`state` text NOT NULL,
	`batch_id` text,
	`query_id` text,
	`fetched_at` text NOT NULL,
	`profile_json` text NOT NULL,
	`raw_json` text,
	`fields_populated` integer,
	`fields_unavailable` integer
);
