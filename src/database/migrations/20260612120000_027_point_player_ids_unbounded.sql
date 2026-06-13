-- Allow substitutions to append players beyond the starting line of 7.
ALTER TABLE "points" ALTER COLUMN "player_ids" TYPE uuid[] USING "player_ids"::uuid[];
