WITH team_info AS (
    SELECT 
        t.id as team_id,
        tg.id as team_group_id,
        TRUE as is_fmp
    from teams t
    inner join team_groups tg on tg.team_id = t.id
    WHERE t.name = 'Devs 2026' and tg.is_default=true limit 1
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
('Connie', 'Cutter'::playertype),
('Roxine', 'Handler'::playertype)
) AS player_data(first_name, type);