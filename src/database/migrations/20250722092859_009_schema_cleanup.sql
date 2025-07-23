-- remove player_three_id from point_events
ALTER TABLE "point_events" DROP COLUMN "player_three_id";

-- `isFemaleMatching` -> `isFMP`
ALTER TABLE "players" RENAME COLUMN "is_female_matching" TO "is_fmp";

-- add throwType to point_events (huck, assist, second assist)
ALTER TABLE "point_events" ADD COLUMN IF NOT EXISTS "event_json" JSONB;

-- cascade foreign keys
ALTER TABLE "point_events"
    DROP CONSTRAINT "point_events_point_id_fkey",
    ADD CONSTRAINT "point_events_point_id_fkey"
    FOREIGN KEY ("point_id")
    REFERENCES "points"(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
-- ALTER TABLE "points" ALTER COLUMN "game_id" TYPE uuid REFERENCES "games"(id) NOT NULL ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "points"
    DROP CONSTRAINT "points_game_id_fkey",
    ADD CONSTRAINT "points_game_id_fkey"
    FOREIGN KEY ("game_id")
    REFERENCES "games"(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
-- ALTER TABLE "players" ALTER COLUMN "team_id" TYPE uuid REFERENCES "teams"(id) NOT NULL ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "players"
    DROP CONSTRAINT "players_team_id_fkey",
    ADD CONSTRAINT "players_team_id_fkey"
    FOREIGN KEY ("team_id")
    REFERENCES "teams"(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
-- ALTER TABLE "games" ALTER COLUMN "team_id" TYPE uuid REFERENCES "teams"(id) NOT NULL ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "games"
    DROP CONSTRAINT "games_team_id_fkey",
    ADD CONSTRAINT "games_team_id_fkey"
    FOREIGN KEY ("team_id")
    REFERENCES "teams"(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- (+ not null)
DELETE FROM "games" WHERE "was_last_score_us" IS NULL;
ALTER TABLE "games"
  ALTER COLUMN "was_last_score_us" TYPE BOOLEAN,
  ALTER COLUMN "was_last_score_us" SET NOT NULL;
