CREATE TABLE `checkout_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`tour` text NOT NULL,
	`departure` text NOT NULL,
	`travellers` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text NOT NULL,
	`checkout_id` text,
	`invoice_id` text,
	`created_at` integer NOT NULL,
	`event_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stripe_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`created_at` integer NOT NULL
);
