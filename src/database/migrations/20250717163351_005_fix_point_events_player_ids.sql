DROP TABLE point_events;

CREATE TABLE IF NOT EXISTS "point_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "point_id" uuid REFERENCES "points"(id) NOT NULL,
  "type" eventtype NOT NULL,
  "player_one_id" uuid REFERENCES "players"(id),
  "player_two_id" uuid REFERENCES "players"(id),
  "player_three_id" uuid REFERENCES "players"(id),
  "created_at" timestamp DEFAULT NOW() NOT NULL
);
