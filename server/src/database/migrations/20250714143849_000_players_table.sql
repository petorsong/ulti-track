CREATE TABLE IF NOT EXISTS "players" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"is_female_matching" boolean DEFAULT false NOT NULL,
	"is_handler" boolean DEFAULT false NOT NULL,
	"is_pr" boolean DEFAULT false NOT NULL
);
