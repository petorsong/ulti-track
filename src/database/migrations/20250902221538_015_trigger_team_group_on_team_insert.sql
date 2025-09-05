CREATE OR REPLACE FUNCTION "default_team_group_trigger_function"()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "team_groups" (name, is_default, team_id) VALUES ('None', true, NEW.id);
  RETURN NULL;
END; $$ LANGUAGE "plpgsql";

CREATE TRIGGER "default_team_group_trigger"
AFTER INSERT ON "teams" FOR EACH ROW
EXECUTE FUNCTION default_team_group_trigger_function();
