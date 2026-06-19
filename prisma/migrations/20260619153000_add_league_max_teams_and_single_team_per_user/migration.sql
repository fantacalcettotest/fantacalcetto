ALTER TABLE "League"
ADD COLUMN "maxTeams" INTEGER NOT NULL DEFAULT 8;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT "userId"
      FROM "FantasyTeam"
      GROUP BY "userId"
      HAVING COUNT(*) > 1
    ) AS duplicated_teams
  ) THEN
    RAISE EXCEPTION 'Cannot enforce one fantasy team per user because duplicate FantasyTeam rows already exist for one or more userId values.';
  END IF;
END
$$;

CREATE UNIQUE INDEX "FantasyTeam_userId_key" ON "FantasyTeam"("userId");
