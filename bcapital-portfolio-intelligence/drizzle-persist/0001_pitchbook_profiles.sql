CREATE TABLE IF NOT EXISTS `pitchbook_profiles` (
	`company_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`profile_json` text NOT NULL,
	`availability_json` text NOT NULL,
	`source_url` text,
	`fetched_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pitchbook_sync_runs` (
	`run_id` text PRIMARY KEY NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`trigger` text NOT NULL,
	`companies_refreshed` integer DEFAULT 0 NOT NULL,
	`fields_populated` integer DEFAULT 0 NOT NULL,
	`empty_state_count` integer DEFAULT 0 NOT NULL,
	`errors_json` text DEFAULT '[]' NOT NULL,
	`detail_json` text
);
