CREATE TABLE IF NOT EXISTS "team_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "is_active" boolean DEFAULT false NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "team_id" uuid REFERENCES "teams"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "created_at" timestamp DEFAULT NOW() NOT NULL
);

CREATE INDEX "team_groups_team_id_idx" ON "team_groups" ("team_id");

CREATE UNIQUE INDEX "team_groups_team_id_is_default_unique_idx" 
ON "team_groups" ("team_id") 
WHERE "is_default" = true;

ALTER TABLE "players" ADD COLUMN "team_group_id" UUID REFERENCES "team_groups"(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- set up defaults for devs & test teams
INSERT INTO "team_groups" (name, is_default, team_id) VALUES
('None', true, '2e7603c3-c6be-419c-be32-4c9391c288da'),
('None', true, 'b3836ba2-c6f1-4e67-8d5b-afecd7c486ec');

update "players" set "team_group_id"= (
  select id from "team_groups"
  where "team_id"='b3836ba2-c6f1-4e67-8d5b-afecd7c486ec' and "is_default"=true
) where "team_id"='b3836ba2-c6f1-4e67-8d5b-afecd7c486ec';

update "players" set "team_group_id"= (
  select id from "team_groups"
  where "team_id"='2e7603c3-c6be-419c-be32-4c9391c288da' and "is_default"=true
) where "team_id"='2e7603c3-c6be-419c-be32-4c9391c288da';

ALTER TABLE "players" ALTER COLUMN "team_group_id" SET NOT NULL;

-- preload 2 lines for devs
INSERT INTO "team_groups" (name, is_active, team_id) VALUES
('Party Bus', true, 'b3836ba2-c6f1-4e67-8d5b-afecd7c486ec'),
('Duckies', true, 'b3836ba2-c6f1-4e67-8d5b-afecd7c486ec');
