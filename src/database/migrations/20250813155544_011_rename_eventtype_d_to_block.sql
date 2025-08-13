UPDATE "point_events" SET "type"='BLOCK' WHERE "type"='D';

CREATE TYPE eventtypenew AS ENUM ('VS_SCORE', 'SCORE', 'BLOCK', 'TA', 'DROP', 'PASS', 'CALLAHAN', 'SUBSTITUTION', 'TIMEOUT', 'VS_TIMEOUT');
ALTER TABLE "point_events" ALTER COLUMN "type" TYPE eventtypenew 
    USING (type::text::eventtypenew);

DROP TYPE eventtype;
ALTER TYPE eventtypenew RENAME TO eventtype;
