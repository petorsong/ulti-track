ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "timeouts" JSONB DEFAULT '{}'::JSONB;
UPDATE "games" SET timeouts='{}'::JSONB;
ALTER TABLE "games" ALTER COLUMN "timeouts" SET NOT NULL;

-- preload 2 test lines
INSERT INTO "team_groups" (name, is_active, team_id) VALUES
('Pod 1', true, '2e7603c3-c6be-419c-be32-4c9391c288da'),
('Pod 2', true, '2e7603c3-c6be-419c-be32-4c9391c288da');
