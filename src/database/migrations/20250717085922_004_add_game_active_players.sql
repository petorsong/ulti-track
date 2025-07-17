DELETE FROM "games";

ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "active_player_ids" uuid[] NOT NULL;
