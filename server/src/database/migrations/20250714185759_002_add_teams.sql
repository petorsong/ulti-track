CREATE TABLE IF NOT EXISTS "teams" (
	"id" uuid PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL
);

INSERT INTO "teams" (id, name) VALUES ('b3836ba2-c6f1-4e67-8d5b-afecd7c486ec', 'Devs 2025');

ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "team_id" uuid REFERENCES "teams"(id);
UPDATE "players" SET "team_id"='b3836ba2-c6f1-4e67-8d5b-afecd7c486ec';
ALTER TABLE "players" ALTER COLUMN "team_id" SET NOT NULL;
