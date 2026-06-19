-- CreateTable
CREATE TABLE "LeagueBlockedPlayer" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueBlockedPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeagueBlockedPlayer_leagueId_idx" ON "LeagueBlockedPlayer"("leagueId");

-- CreateIndex
CREATE INDEX "LeagueBlockedPlayer_playerId_idx" ON "LeagueBlockedPlayer"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueBlockedPlayer_leagueId_playerId_key" ON "LeagueBlockedPlayer"("leagueId", "playerId");

-- AddForeignKey
ALTER TABLE "LeagueBlockedPlayer" ADD CONSTRAINT "LeagueBlockedPlayer_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueBlockedPlayer" ADD CONSTRAINT "LeagueBlockedPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
