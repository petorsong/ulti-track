INSERT INTO "teams" (id, name, type) VALUES ('310a0e94-dbcf-45a9-be43-acfaa42765fb', 'GBP (Summer 2026)', 'Mixed');

WITH team_info AS (
    SELECT
        id as team_id,
        true as is_active
    FROM teams
    WHERE name = 'GBP (Summer 2026)'
)
INSERT INTO team_groups (name, team_id, is_active)
SELECT
    group_data.name,
    team_info.team_id,
    team_info.is_active
FROM team_info
CROSS JOIN (VALUES ('Great British Pound'), ('Roses')) AS group_data(name);

WITH team_info AS (
    SELECT
        t.id as team_id,
        tg.id as team_group_id
    from teams t
    inner join team_groups tg on tg.team_id = t.id
    WHERE t.name = 'GBP (Summer 2026)' and tg.is_default=true limit 1
)
INSERT INTO players (first_name, type, is_fmp, team_id, team_group_id)
SELECT
    player_data.first_name,
    player_data.type,
    player_data.is_fmp,
    team_info.team_id,
    team_info.team_group_id
FROM team_info
CROSS JOIN (
    VALUES
('Sofia', 'Handler'::playertype, TRUE),
('Alan', 'Cutter'::playertype, FALSE),
('Pia', 'Handler'::playertype, TRUE),
('Georgia', 'Cutter'::playertype, TRUE),
('Clara', 'Handler'::playertype, TRUE),
('Rebecca', 'Cutter'::playertype, TRUE),
('Brenda', 'Cutter'::playertype, TRUE),
('Linda', 'Cutter'::playertype, TRUE),
('Chen', 'Hybrid'::playertype, FALSE),
('Elliot', 'Cutter'::playertype, FALSE),
('Ted', 'Hybrid'::playertype, FALSE),
('Hilary', 'Cutter'::playertype, FALSE),
('Eryn', 'Handler'::playertype, FALSE),
('Gustavo', 'Cutter'::playertype, FALSE),
('Allison', 'Cutter'::playertype, TRUE),
('Stephenie', 'Handler'::playertype, TRUE),
('Julie', 'Cutter'::playertype, TRUE),
('Janelle', 'Cutter'::playertype, TRUE),
('Peter', 'Handler'::playertype, FALSE)
) AS player_data(first_name, type, is_fmp);
