INSERT INTO "teams" (id, name, type) VALUES ('e54aed7e-92b8-4915-9cc1-47fdb3ca9636', 'GBP 2025 Playoffs', 'Mixed');

WITH "team_info" AS (
    SELECT 
        'e54aed7e-92b8-4915-9cc1-47fdb3ca9636'::uuid as team_id,
        (SELECT id FROM team_groups WHERE team_id = 'e54aed7e-92b8-4915-9cc1-47fdb3ca9636' LIMIT 1) as team_group_id
)
INSERT INTO players (first_name, last_name, is_fmp, is_handler, team_id, team_group_id)
SELECT 
    player_data.first_name,
    player_data.last_name,
    player_data.is_fmp,
    player_data.is_handler,
    team_info.team_id,
    team_info.team_group_id
FROM team_info
CROSS JOIN (
    VALUES 
('Sofia', 'Collins', true, true),
('Stephenie', 'Hui', true, true),
('Julie', 'Kwan', true, false),
('Clara', 'Liu', true, true),
('Anna', 'Luo', true, false),
('Brenda', 'Perras', true, false),
('Lucy', 'Gao', true, true),
('Vera', 'Hoang', true, false),
('Gareth', 'Cawley', false, true),
('Chen', 'Chou', false, false),
('Elliot', 'Currie', false, false),
('Hilary', 'Leung', false, true),
('Alan', 'Liu', false, false),
('Eryn', 'Maloney', false, true),
('Peter', 'Song', false, true),
('Justin', 'Wong', false, false)
) AS player_data(first_name, last_name, is_fmp, is_handler);

INSERT INTO "team_groups" (name, is_active, team_id) VALUES
('Gee Bees', true, 'e54aed7e-92b8-4915-9cc1-47fdb3ca9636'),
('Bee Pees', true, 'e54aed7e-92b8-4915-9cc1-47fdb3ca9636');