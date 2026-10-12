-- Written by hand: the two DELETEs. The rest is generated.
-- Events of first syncs were logged but never read; they are history, not news.
DELETE FROM "score_events" WHERE "is_news" = false;--> statement-breakpoint
-- Keep one event per play, so that the unique index below can be created.
DELETE FROM "score_events" a USING "score_events" b WHERE a."id" > b."id" AND a."player_id" = b."player_id" AND a."leaderboard_id" = b."leaderboard_id" AND a."played_at" = b."played_at";--> statement-breakpoint
DROP INDEX "score_events_leaderboard_id_index";--> statement-breakpoint
DROP INDEX "scores_leaderboard_id_index";--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "sync_failures" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "sync_failed_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "score_events_player_id_leaderboard_id_played_at_index" ON "score_events" USING btree ("player_id","leaderboard_id","played_at");--> statement-breakpoint
ALTER TABLE "score_events" DROP COLUMN "is_news";