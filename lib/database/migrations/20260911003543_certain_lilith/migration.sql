CREATE TABLE `scheduler_actions` (
	`id` text PRIMARY KEY,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`queued_at` text NOT NULL,
	`started_at` text,
	`finished_at` text,
	`result` text,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `scheduler_actions_queue_idx` ON `scheduler_actions` (`status`,`queued_at`,`id`);--> statement-breakpoint
CREATE INDEX `scheduler_actions_retention_idx` ON `scheduler_actions` (`status`,`finished_at`,`id`);