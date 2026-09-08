CREATE TABLE `story_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`story_id` text NOT NULL,
	`parent_id` text,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`is_admin` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_story_comments_story_date` ON `story_comments` (`story_id`,`created_at`);