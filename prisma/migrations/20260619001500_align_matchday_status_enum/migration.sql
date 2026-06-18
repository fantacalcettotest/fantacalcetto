BEGIN;

ALTER TYPE "MatchdayStatus" RENAME TO "MatchdayStatus_old";

CREATE TYPE "MatchdayStatus" AS ENUM (
  'DRAFT',
  'LINEUPS_OPEN',
  'LINEUPS_LOCKED',
  'VOTES_PENDING',
  'VOTES_COMPLETED',
  'SCORES_CALCULATED',
  'PUBLISHED',
  'LOCKED'
);

ALTER TABLE "Matchday"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "MatchdayStatus"
  USING (
    CASE "status"::text
      WHEN 'OPEN' THEN 'LINEUPS_OPEN'
      WHEN 'LOCKED' THEN 'LINEUPS_LOCKED'
      WHEN 'SCORED' THEN 'SCORES_CALCULATED'
      WHEN 'CLOSED' THEN 'PUBLISHED'
      ELSE "status"::text
    END
  )::"MatchdayStatus",
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

DROP TYPE "MatchdayStatus_old";

COMMIT;
