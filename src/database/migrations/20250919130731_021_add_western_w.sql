-- this didn't work before?
ALTER TABLE "players" ALTER COLUMN "last_name" DROP NOT NULL;

-- western women's
INSERT INTO "teams" (id, name, type) VALUES ('1ce50736-9a9d-42ba-a386-6127d3e9f80e', 'Western Women''s 2025', 'Women');

WITH team_info AS (
    SELECT 
        id as team_id, 
        true as is_active 
    FROM teams 
    WHERE name = 'Western Women''s 2025'
)
INSERT INTO team_groups (name, team_id, is_active)
SELECT 
    group_data.name, 
    team_info.team_id, 
    team_info.is_active 
FROM team_info
CROSS JOIN (VALUES ('White'), ('Purple')) AS group_data(name);

WITH "team_info" AS (
    SELECT 
        t.id as team_id,
        tg.id as team_group_id,
        true as is_fmp
    from teams t
    inner join team_groups tg on tg.team_id = t.id
    WHERE t.name = 'Western Women''s 2025' and tg.is_default=true limit 1
)
INSERT INTO players (first_name, type, is_fmp, team_id, team_group_id)
SELECT 
    player_data.first_name,
    player_data.type,
    team_info.is_fmp,
    team_info.team_id,
    team_info.team_group_id
FROM team_info
CROSS JOIN (
    VALUES
('Cedar', 'Cutter'::playertype),
('Leigh', 'Cutter'::playertype),
('Krysta', 'Handler'::playertype),
('Cousie', 'Cutter'::playertype),
('Danae', 'Handler'::playertype),
('Kaitlyn', 'Cutter'::playertype),
('Hannah', 'Handler'::playertype),
('Viv', 'Cutter'::playertype),
('Roro', 'Handler'::playertype),
('Avery', 'Cutter'::playertype),
('Shanti', 'Handler'::playertype),
('Nancy', 'Cutter'::playertype),
('Sof', 'Cutter'::playertype),
('Flip', 'Handler'::playertype),
('Mary', 'Cutter'::playertype),
('Tammy', 'Handler'::playertype),
('Bri', 'Handler'::playertype),
('Mads', 'Cutter'::playertype),
('Sidney', 'Cutter'::playertype),
('Biebs', 'Handler'::playertype),
('Jessie', 'Cutter'::playertype)
) AS player_data(first_name, type);
