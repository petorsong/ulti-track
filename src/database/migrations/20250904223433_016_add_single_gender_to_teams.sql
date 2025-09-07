CREATE TYPE teamtype AS ENUM ('Mixed', 'Open', 'Women');

ALTER TABLE "teams" ADD COLUMN "type" teamtype;
UPDATE "teams" SET "type"='Mixed';
ALTER TABLE "teams" ALTER COLUMN "type" SET NOT NULL;

CREATE INDEX "teams_name_type_idx" ON "teams" ("name", "type");

