CREATE TABLE `categories` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`parent_id` varchar(36),
	`sort_order` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `note_content` (
	`note_id` varchar(36) NOT NULL,
	`plain_text` text NOT NULL,
	`raw_markdown` text NOT NULL,
	CONSTRAINT `note_content_note_id` PRIMARY KEY(`note_id`)
);
--> statement-breakpoint
CREATE TABLE `note_links` (
	`id` varchar(36) NOT NULL,
	`source_note_id` varchar(36) NOT NULL,
	`target_note_id` varchar(36),
	`target_slug` varchar(255) NOT NULL,
	`context` text,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `note_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `note_tags` (
	`note_id` varchar(36) NOT NULL,
	`tag_id` varchar(36) NOT NULL,
	CONSTRAINT `note_tags_note_id_tag_id_pk` PRIMARY KEY(`note_id`,`tag_id`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`category_id` varchar(36),
	`source_id` varchar(36),
	`cos_key` varchar(500) NOT NULL,
	`content_hash` varchar(64),
	`word_count` int DEFAULT 0,
	`status` enum('draft','published','archived') DEFAULT 'published',
	`ai_category_suggestion` varchar(100),
	`ai_tags_json` json,
	`ai_analyzed_at` datetime,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `notes_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `operation_logs` (
	`id` varchar(36) NOT NULL,
	`timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`type` enum('ingest','create','edit','delete','analyze','lint','query') NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`related_note_ids` json,
	CONSTRAINT `operation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` varchar(36) NOT NULL,
	`title` varchar(500) NOT NULL,
	`url` varchar(2048),
	`cos_key` varchar(500),
	`type` enum('article','paper','book_chapter','web_clip','podcast','video','other') DEFAULT 'article',
	`summary` text,
	`ingested_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` varchar(36) NOT NULL,
	`name` varchar(60) NOT NULL,
	`slug` varchar(60) NOT NULL,
	`color` varchar(7) DEFAULT '#6366f1',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_name_unique` UNIQUE(`name`),
	CONSTRAINT `tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `idx_links_source` ON `note_links` (`source_note_id`);--> statement-breakpoint
CREATE INDEX `idx_links_target` ON `note_links` (`target_note_id`);--> statement-breakpoint
CREATE INDEX `idx_links_slug` ON `note_links` (`target_slug`);--> statement-breakpoint
CREATE INDEX `idx_note_tags_tag` ON `note_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `idx_notes_slug` ON `notes` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_notes_category` ON `notes` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_notes_status` ON `notes` (`status`);--> statement-breakpoint
CREATE INDEX `idx_notes_source` ON `notes` (`source_id`);--> statement-breakpoint
CREATE INDEX `idx_logs_timestamp` ON `operation_logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_logs_type` ON `operation_logs` (`type`);