ALTER TABLE games ADD COLUMN client_draft_id uuid;

CREATE UNIQUE INDEX games_client_draft_id_unique_idx ON games (client_draft_id) WHERE client_draft_id IS NOT NULL;
