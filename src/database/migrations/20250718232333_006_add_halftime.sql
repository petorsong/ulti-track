ALTER TABLE "points" DROP COLUMN "is_first_half";
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "halftime_at" INTEGER;
