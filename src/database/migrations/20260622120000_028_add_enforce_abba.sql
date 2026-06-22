ALTER TABLE "games" ADD COLUMN "enforce_abba" boolean;

UPDATE "games" SET "enforce_abba" = true WHERE "start_f_ratio" IS NOT NULL;
