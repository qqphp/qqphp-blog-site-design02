CREATE TABLE `aa_language_model_snapshots` (
	`key` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`stored_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `api_integration_keys` (
	`service` text PRIMARY KEY NOT NULL,
	`api_key` text NOT NULL,
	`updated_at` text NOT NULL
);
