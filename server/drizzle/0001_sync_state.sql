ALTER TABLE "players" ADD COLUMN "sync_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "sync_error" text;