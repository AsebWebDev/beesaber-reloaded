CREATE INDEX "hive_members_member_id_index" ON "hive_members" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "user_playerId_idx" ON "user" USING btree ("player_id");