BEGIN;

ALTER TYPE "RequiredVoteStatus" RENAME TO "RequiredVoteStatus_old";

CREATE TYPE "RequiredVoteStatus" AS ENUM ('PENDING', 'COMPLETED', 'SV', 'IGNORED');

ALTER TABLE "RequiredVotePlayer"
  ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 1;

UPDATE "RequiredVotePlayer"
SET "usageCount" = 1
WHERE "usageCount" < 1;

ALTER TABLE "RequiredVotePlayer"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "RequiredVoteStatus"
  USING (
    CASE "status"::text
      WHEN 'SKIPPED' THEN 'IGNORED'
      ELSE "status"::text
    END
  )::"RequiredVoteStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING',
  ALTER COLUMN "usageCount" SET DEFAULT 1;

DROP TYPE "RequiredVoteStatus_old";

ALTER TYPE "ScoreStatus" RENAME TO "ScoreStatus_old";

CREATE TYPE "ScoreStatus" AS ENUM ('CALCULATED', 'PUBLISHED', 'LOCKED');

ALTER TABLE "TeamScore"
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

ALTER TABLE "TeamScore"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ScoreStatus"
  USING (
    CASE "status"::text
      WHEN 'PENDING' THEN 'CALCULATED'
      WHEN 'CALCULATED' THEN 'CALCULATED'
      WHEN 'PUBLISHED' THEN 'PUBLISHED'
      WHEN 'FINALIZED' THEN 'LOCKED'
      ELSE 'CALCULATED'
    END
  )::"ScoreStatus",
  ALTER COLUMN "status" SET DEFAULT 'CALCULATED';

DROP TYPE "ScoreStatus_old";

COMMIT;
