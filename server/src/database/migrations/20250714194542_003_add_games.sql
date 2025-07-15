CREATE TABLE IF NOT EXISTS "games" (
	"id" uuid PRIMARY KEY NOT NULL,
  "team_id" uuid REFERENCES "teams"(id) NOT NULL,
  "vs_team_name" varchar(255) NOT NULL,
  "start_on_o" boolean DEFAULT false NOT NULL,
  "start_f_ratio" boolean DEFAULT false NOT NULL,
  "start_left" boolean DEFAULT false NOT NULL,
  "team_score" integer DEFAULT 0 NOT NULL,
  "vs_team_score" integer DEFAULT 0 NOT NULL,
  "is_complete" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "points" (
	"id" uuid PRIMARY KEY NOT NULL,
  "game_id" uuid REFERENCES "games"(id) NOT NULL,
  "player_ids" uuid[7] NOT NULL,
  "created_at" timestamp DEFAULT NOW() NOT NULL
);

CREATE TYPE eventtype AS ENUM ('VS_SCORE', 'SCORE', 'D', 'TA', 'DROP', 'PASS', 'CALLAHAN', 'SUBSTITUTION');

CREATE TABLE IF NOT EXISTS "point_events" (
	"id" uuid PRIMARY KEY NOT NULL,
  "point_id" uuid REFERENCES "points"(id) NOT NULL,
  "type" eventtype NOT NULL,
  "playerOneId" uuid REFERENCES "players"(id),
  "playerTwoId" uuid REFERENCES "players"(id),
  "playerThreeId" uuid REFERENCES "players"(id),
  "created_at" timestamp DEFAULT NOW() NOT NULL
);
