INSERT INTO "teams" (id, name, type) VALUES ('7b2d1083-e20a-4d0c-a5c2-ba4cf1ac04f5', 'Roses (Summer 2026)', 'Mixed');

WITH team_info AS (
    SELECT
        id as team_id,
        true as is_active
    FROM teams
    WHERE name = 'Roses (Summer 2026)'
)
INSERT INTO team_groups (name, team_id, is_active)
SELECT
    group_data.name,
    team_info.team_id,
    team_info.is_active
FROM team_info
CROSS JOIN (VALUES ('Red'), ('Roses')) AS group_data(name);

WITH team_info AS (
    SELECT
        t.id as team_id,
        tg.id as team_group_id
    from teams t
    inner join team_groups tg on tg.team_id = t.id
    WHERE t.name = 'Roses (Summer 2026)' and tg.is_default=true limit 1
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
('Sofia', 'Hybrid'::playertype, TRUE),
('Alan', 'Hybrid'::playertype, FALSE),
('Bruce', 'Hybrid'::playertype, FALSE),
('Leslie', 'Hybrid'::playertype, FALSE),
('Beccy', 'Hybrid'::playertype, TRUE),
('Chen', 'Hybrid'::playertype, FALSE),
('Josh', 'Hybrid'::playertype, FALSE),
('Sean', 'Hybrid'::playertype, FALSE),
('Francesca', 'Hybrid'::playertype, TRUE),
('Ellery', 'Hybrid'::playertype, TRUE),
('Chloe', 'Hybrid'::playertype, TRUE),
('Elizabeth', 'Hybrid'::playertype, TRUE),
('Jason', 'Hybrid'::playertype, FALSE)
) AS player_data(first_name, type, is_fmp);
