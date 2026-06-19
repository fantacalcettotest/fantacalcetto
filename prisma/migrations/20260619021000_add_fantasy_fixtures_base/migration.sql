BEGIN;

CREATE TYPE "FantasyFixtureStatus" AS ENUM (
  'SCHEDULED',
  'CALCULATED',
  'PUBLISHED',
  'LOCKED'
);

CREATE TABLE "FantasyFixture" (
  "id" TEXT NOT NULL,
  "matchdayId" TEXT NOT NULL,
  "homeTeamId" TEXT NOT NULL,
  "awayTeamId" TEXT NOT NULL,
  "homeTeamScoreId" TEXT,
  "awayTeamScoreId" TEXT,
  "homeGoals" INTEGER,
  "awayGoals" INTEGER,
  "status" "FantasyFixtureStatus" NOT NULL DEFAULT 'SCHEDULED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FantasyFixture_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FantasyFixture_homeTeamScoreId_key" ON "FantasyFixture"("homeTeamScoreId");
CREATE UNIQUE INDEX "FantasyFixture_awayTeamScoreId_key" ON "FantasyFixture"("awayTeamScoreId");
CREATE UNIQUE INDEX "FantasyFixture_matchdayId_homeTeamId_awayTeamId_key" ON "FantasyFixture"("matchdayId", "homeTeamId", "awayTeamId");
CREATE INDEX "FantasyFixture_matchdayId_idx" ON "FantasyFixture"("matchdayId");

ALTER TABLE "FantasyFixture" ADD CONSTRAINT "FantasyFixture_matchdayId_fkey"
  FOREIGN KEY ("matchdayId") REFERENCES "Matchday"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FantasyFixture" ADD CONSTRAINT "FantasyFixture_homeTeamId_fkey"
  FOREIGN KEY ("homeTeamId") REFERENCES "FantasyTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FantasyFixture" ADD CONSTRAINT "FantasyFixture_awayTeamId_fkey"
  FOREIGN KEY ("awayTeamId") REFERENCES "FantasyTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FantasyFixture" ADD CONSTRAINT "FantasyFixture_homeTeamScoreId_fkey"
  FOREIGN KEY ("homeTeamScoreId") REFERENCES "TeamScore"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FantasyFixture" ADD CONSTRAINT "FantasyFixture_awayTeamScoreId_fkey"
  FOREIGN KEY ("awayTeamScoreId") REFERENCES "TeamScore"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
