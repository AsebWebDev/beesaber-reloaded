CREATE TABLE "hive_members" (
	"owner_id" text NOT NULL,
	"member_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hive_members_owner_id_member_id_pk" PRIMARY KEY("owner_id","member_id"),
	CONSTRAINT "not_self" CHECK ("hive_members"."owner_id" <> "hive_members"."member_id")
);
--> statement-breakpoint
CREATE TABLE "leaderboards" (
	"id" integer PRIMARY KEY NOT NULL,
	"map_hash" text NOT NULL,
	"song_name" text NOT NULL,
	"song_sub_name" text NOT NULL,
	"song_author_name" text NOT NULL,
	"level_author_name" text NOT NULL,
	"cover_url" text NOT NULL,
	"difficulty" integer NOT NULL,
	"game_mode" text NOT NULL,
	"max_score" integer NOT NULL,
	"stars" double precision NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"avatar_url" text NOT NULL,
	"rank" integer NOT NULL,
	"country_rank" integer NOT NULL,
	"total_pp" double precision NOT NULL,
	"total_played" integer NOT NULL,
	"inactive" boolean NOT NULL,
	"profile_synced_at" timestamp with time zone NOT NULL,
	"scores_synced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "score_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"leaderboard_id" integer NOT NULL,
	"previous_score" integer,
	"new_score" integer NOT NULL,
	"played_at" timestamp with time zone NOT NULL,
	"is_news" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"player_id" text NOT NULL,
	"leaderboard_id" integer NOT NULL,
	"score_saber_id" integer NOT NULL,
	"modified_score" integer NOT NULL,
	"unmodified_score" integer NOT NULL,
	"accuracy" double precision NOT NULL,
	"pp" double precision NOT NULL,
	"rank" integer NOT NULL,
	"mods" text[] NOT NULL,
	"full_combo" boolean NOT NULL,
	"missed_notes" integer NOT NULL,
	"bad_cuts" integer NOT NULL,
	"max_combo" integer NOT NULL,
	"played_at" timestamp with time zone NOT NULL,
	CONSTRAINT "scores_player_id_leaderboard_id_pk" PRIMARY KEY("player_id","leaderboard_id")
);
--> statement-breakpoint
ALTER TABLE "hive_members" ADD CONSTRAINT "hive_members_owner_id_players_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hive_members" ADD CONSTRAINT "hive_members_member_id_players_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_events" ADD CONSTRAINT "score_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_events" ADD CONSTRAINT "score_events_leaderboard_id_leaderboards_id_fk" FOREIGN KEY ("leaderboard_id") REFERENCES "public"."leaderboards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_leaderboard_id_leaderboards_id_fk" FOREIGN KEY ("leaderboard_id") REFERENCES "public"."leaderboards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leaderboards_map_hash_index" ON "leaderboards" USING btree ("map_hash");--> statement-breakpoint
CREATE INDEX "score_events_player_id_played_at_index" ON "score_events" USING btree ("player_id","played_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "score_events_leaderboard_id_index" ON "score_events" USING btree ("leaderboard_id");--> statement-breakpoint
CREATE INDEX "scores_player_id_played_at_index" ON "scores" USING btree ("player_id","played_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "scores_leaderboard_id_index" ON "scores" USING btree ("leaderboard_id");