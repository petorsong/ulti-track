-- devs 2025
INSERT INTO "teams" (id, name, type) VALUES ('6c9796c3-9330-4944-9f10-e5e62a0bca63', 'Devs 2026', 'Mixed');

WITH team_info AS (
    SELECT 
        id as team_id, 
        true as is_active 
    FROM teams 
    WHERE name = 'Devs 2026'
)
INSERT INTO team_groups (name, team_id, is_active)
SELECT 
    group_data.name, 
    team_info.team_id, 
    team_info.is_active 
FROM team_info
CROSS JOIN (VALUES ('Pink'), ('Purple')) AS group_data(name);

WITH team_info AS (
    SELECT 
        t.id as team_id,
        tg.id as team_group_id
    from teams t
    inner join team_groups tg on tg.team_id = t.id
    WHERE t.name = 'Devs 2026' and tg.is_default=true limit 1
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
('Marco', 'Handler'::playertype, FALSE),
('Gerry', 'Cutter'::playertype, FALSE),
('Spencer', 'Cutter'::playertype, FALSE),
('Michael', 'Cutter'::playertype, FALSE),
('Kai', 'Handler'::playertype, FALSE),
('Peter', 'Handler'::playertype, FALSE),
('Jason', 'Handler'::playertype, FALSE),
('Jaedan', 'Cutter'::playertype, FALSE),
('Austin', 'Cutter'::playertype, FALSE),
('Sam', 'Handler'::playertype, FALSE),
('Ricky', 'Cutter'::playertype, FALSE),
('John', 'Cutter'::playertype, FALSE),
('Alec', 'Cutter'::playertype, FALSE),
('Tomas', 'Cutter'::playertype, FALSE),
('Yuki', 'Cutter'::playertype, TRUE),
('Qiqi', 'Cutter'::playertype, TRUE),
('Wendy', 'Handler'::playertype, TRUE),
('Ivy', 'Cutter'::playertype, TRUE),
('Caroline', 'Handler'::playertype, TRUE),
('Ruolin', 'Cutter'::playertype, TRUE),
('Kary', 'Cutter'::playertype, TRUE),
('Hannalee', 'Cutter'::playertype, TRUE),
('Ma''ayan', 'Handler'::playertype, TRUE)
) AS player_data(first_name, type, is_fmp);
