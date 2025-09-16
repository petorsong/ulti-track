CREATE TYPE playertype AS ENUM ('Cutter', 'Handler', 'Hybrid');

ALTER TABLE "players" ADD COLUMN "type" playertype;
UPDATE "players" SET "type" =
  CASE "is_handler"
    WHEN TRUE THEN 'Handler'::playertype
    WHEN FALSE THEN 'Cutter'::playertype
  END;
ALTER TABLE "players" ALTER COLUMN "type" SET NOT NULL;

CREATE INDEX "players_type_idx" ON "players" ("type");

ALTER TABLE "players"
  DROP COLUMN "is_handler",
  ALTER COLUMN "last_name" DROP NOT NULL;
