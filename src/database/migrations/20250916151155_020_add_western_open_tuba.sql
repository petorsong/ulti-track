-- western
INSERT INTO "teams" (id, name, type) VALUES ('2f0a7ec8-b9b5-4223-b9e7-9938abffe949', 'Western Open 2025', 'Open');

WITH team_info AS (
    SELECT 
        id as team_id, 
        true as is_active 
    FROM teams 
    WHERE name = 'Western Open 2025'
)
INSERT INTO team_groups (name, team_id, is_active)
SELECT 
    group_data.name, 
    team_info.team_id, 
    team_info.is_active 
FROM team_info
CROSS JOIN (VALUES ('Line 1'), ('Line 2'), ('Line 3')) AS group_data(name);

WITH "team_info" AS (
    SELECT 
        t.id as team_id,
        tg.id as team_group_id,
        false as is_fmp
    from teams t
    inner join team_groups tg on tg.team_id = t.id
    WHERE t.name = 'Western Open 2025' and tg.is_default=true limit 1
)
INSERT INTO players (first_name, last_name, nickname, type, is_fmp, team_id, team_group_id)
SELECT 
    player_data.first_name,
    player_data.last_name,
    player_data.nickname,
    player_data.type,
    team_info.is_fmp,
    team_info.team_id,
    team_info.team_group_id
FROM team_info
CROSS JOIN (
    VALUES
('Adam', 'Johnston', 'Cutter'::playertype, null),
('Aiden', 'Wang', 'Handler'::playertype, null),
('Alex', 'Gin', 'Cutter'::playertype, null),
('Andrew', 'Kerr', 'Handler'::playertype, null),
('Avery', 'Au', 'Handler'::playertype, null),
('Ben', 'Angel', 'Hybrid'::playertype, null),
('Brayden', 'Yeung', 'Handler'::playertype, null),
('Chance', 'Jiang', 'Hybrid'::playertype, null),
('Christopher', 'Montgomery', 'Cutter'::playertype, null),
('Eric', 'Wang', 'Hybrid'::playertype, 'Eric W'),
('Eric', 'Xie', 'Handler'::playertype, 'Eric X'),
('Ethan', 'Paananrn', 'Handler'::playertype, null),
('Kai', 'Laugesen', 'Cutter'::playertype, null),
('Kevin', 'Zhao', 'Hybrid'::playertype, null),
('Kiran', 'Grieve', 'Hybrid'::playertype, null),
('Luke', 'Levesque', 'Cutter'::playertype, null),
('Malcolm', 'McLellan', 'Cutter'::playertype, null),
('Matthew', 'Sutherland', 'Cutter'::playertype, null),
('Nathan', 'Fraleigh', 'Hybrid'::playertype, null),
('Owen', 'McGowan', 'Cutter'::playertype, null),
('Rowan', 'Hanes', 'Cutter'::playertype, null),
('Ryan', 'Beasant', 'Cutter'::playertype, 'Ryan B'),
('Ryan', 'Qian', 'Handler'::playertype, 'Ryan Q'),
('Terrence', 'Horng', 'Handler'::playertype, null),
('Travis', 'Mah', 'Handler'::playertype, null),
('Viljar', 'McGee', 'Cutter'::playertype, null),
('William', 'Neault', 'Hybrid'::playertype, null),
('Zachary', 'Bernardi', 'Cutter'::playertype, null)
) AS player_data(first_name, last_name, type, nickname);

-- TUBA
INSERT INTO "teams" (id, name, type) VALUES ('0ee681de-8dcb-4d0c-b5f8-3dc0e5896634', 'TUBA 2025', 'Open');

WITH team_info AS (
    SELECT 
        id as team_id, 
        true as is_active 
    FROM teams 
    WHERE name = 'TUBA 2025'
)
INSERT INTO team_groups (name, team_id, is_active)
SELECT 
    group_data.name, 
    team_info.team_id, 
    team_info.is_active 
FROM team_info
CROSS JOIN (VALUES ('Line 1'), ('Line 2'), ('Line 3')) AS group_data(name);

WITH "team_info" AS (
    SELECT 
        t.id as team_id,
        tg.id as team_group_id
    from teams t
    inner join team_groups tg on tg.team_id = t.id
    WHERE t.name = 'TUBA 2025' and tg.is_default=true limit 1
)
INSERT INTO players (first_name, last_name, nickname, type, is_fmp, team_id, team_group_id)
SELECT 
    player_data.first_name,
    player_data.last_name,
    player_data.nickname,
    player_data.type,
    player_data.is_fmp,
    team_info.team_id,
    team_info.team_group_id
FROM team_info
CROSS JOIN (
    VALUES
('Samuel', 'Zanbilowicz', 'Handler'::playertype, NULL, FALSE),
('Henry', 'Trinh', 'Hybrid'::playertype, NULL, FALSE),
('Tristan', 'Leung', 'Cutter'::playertype, NULL, FALSE),
('Brandon', 'Chong', 'Handler'::playertype, NULL, FALSE),
('Jeff', 'Lu', 'Hybrid'::playertype, NULL, FALSE),
('Jaylen', 'Sze', 'Cutter'::playertype, NULL, FALSE),
('William', 'Wang', 'Handler'::playertype, NULL, FALSE),
('Eddie', 'Chen', 'Hybrid'::playertype, NULL, FALSE),
('Konrad', 'Yee', 'Cutter'::playertype, NULL, FALSE),
('Peter', 'Zhu', 'Handler'::playertype, NULL, FALSE),
('Ezra', 'Lee', 'Hybrid'::playertype, NULL, FALSE),
('Mark', 'Hanlan', 'Handler'::playertype, NULL, FALSE),
('Kai', 'Simpson',	'Hybrid'::playertype, NULL, FALSE),
('Mithun', 'Pathmarajah', 'Cutter'::playertype, NULL, FALSE),
('Chris', 'Jiang', 'Handler'::playertype, NULL, FALSE),
('Ben', 'Liu', 'Cutter'::playertype, NULL, FALSE),
('Kevin', 'Zhao', 'Handler'::playertype, NULL, FALSE),
('Mycroft', 'Guo', 'Cutter'::playertype, NULL, FALSE),
('Benjamin', 'Kaul', 'Cutter'::playertype, NULL, FALSE),
('Gary', 'Zhou', 'Handler'::playertype, NULL, FALSE),
('Aravind', 'Subramanian', 'Cutter'::playertype, NULL, FALSE),
('Chiara', 'Urban', 'Cutter'::playertype, NULL, TRUE),
('Ma''ayan', 'Shai', 'Handler'::playertype, NULL, TRUE),
('Elizabeth', 'Menjivar', 'Handler'::playertype, 'Liz', TRUE)
) AS player_data(first_name, last_name, type, nickname, is_fmp);
