-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "LeagueRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "LeagueStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MatchdayStatus" AS ENUM ('DRAFT', 'OPEN', 'LOCKED', 'SCORED', 'CLOSED');

-- CreateEnum
CREATE TYPE "LineupStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LOCKED');

-- CreateEnum
CREATE TYPE "SlotType" AS ENUM ('STARTER', 'BENCH');

-- CreateEnum
CREATE TYPE "RequiredVoteStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "VoteStatus" AS ENUM ('PENDING', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "ScoreStatus" AS ENUM ('PENDING', 'CALCULATED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "ScorePlayerFinalType" AS ENUM ('STARTER_PLAYED', 'REPLACED_BY_BENCH', 'AUTO_SUB_IN', 'SV_NOT_REPLACED', 'BENCH_UNUSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "authUserId" TEXT,
    "displayName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "LeagueStatus" NOT NULL DEFAULT 'DRAFT',
    "startersCount" INTEGER NOT NULL DEFAULT 5,
    "maxAutoSubs" INTEGER NOT NULL DEFAULT 3,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueMember" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "LeagueRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyTeam" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FantasyTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyRoster" (
    "id" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyRoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matchday" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "MatchdayStatus" NOT NULL DEFAULT 'DRAFT',
    "lineupDeadlineAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matchday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lineup" (
    "id" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "status" "LineupStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineupPlayer" (
    "id" TEXT NOT NULL,
    "lineupId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "slotType" "SlotType" NOT NULL,
    "positionOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LineupPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequiredVotePlayer" (
    "id" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "RequiredVoteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequiredVotePlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerVote" (
    "id" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "VoteStatus" NOT NULL DEFAULT 'PENDING',
    "isSv" BOOLEAN NOT NULL DEFAULT false,
    "baseVote" DECIMAL(4,2),
    "bonusPoints" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "malusPoints" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "finalFantavote" DECIMAL(5,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamScore" (
    "id" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "lineupId" TEXT NOT NULL,
    "status" "ScoreStatus" NOT NULL DEFAULT 'PENDING',
    "totalScore" DECIMAL(6,2),
    "autoSubsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamScorePlayer" (
    "id" TEXT NOT NULL,
    "teamScoreId" TEXT NOT NULL,
    "lineupPlayerId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerVoteId" TEXT,
    "replacedLineupPlayerId" TEXT,
    "finalType" "ScorePlayerFinalType" NOT NULL,
    "slotType" "SlotType" NOT NULL,
    "positionOrder" INTEGER NOT NULL,
    "countsForScore" BOOLEAN NOT NULL DEFAULT false,
    "isSv" BOOLEAN NOT NULL DEFAULT false,
    "finalFantavote" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamScorePlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

-- CreateIndex
CREATE INDEX "League_createdById_idx" ON "League"("createdById");

-- CreateIndex
CREATE INDEX "LeagueMember_userId_idx" ON "LeagueMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMember_leagueId_userId_key" ON "LeagueMember"("leagueId", "userId");

-- CreateIndex
CREATE INDEX "FantasyTeam_userId_idx" ON "FantasyTeam"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyTeam_leagueId_userId_key" ON "FantasyTeam"("leagueId", "userId");

-- CreateIndex
CREATE INDEX "FantasyRoster_playerId_idx" ON "FantasyRoster"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyRoster_fantasyTeamId_playerId_key" ON "FantasyRoster"("fantasyTeamId", "playerId");

-- CreateIndex
CREATE INDEX "Matchday_leagueId_status_idx" ON "Matchday"("leagueId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Matchday_leagueId_number_key" ON "Matchday"("leagueId", "number");

-- CreateIndex
CREATE INDEX "Lineup_matchdayId_status_idx" ON "Lineup"("matchdayId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Lineup_fantasyTeamId_matchdayId_key" ON "Lineup"("fantasyTeamId", "matchdayId");

-- CreateIndex
CREATE INDEX "LineupPlayer_playerId_idx" ON "LineupPlayer"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "LineupPlayer_lineupId_playerId_key" ON "LineupPlayer"("lineupId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "LineupPlayer_lineupId_slotType_positionOrder_key" ON "LineupPlayer"("lineupId", "slotType", "positionOrder");

-- CreateIndex
CREATE INDEX "RequiredVotePlayer_status_idx" ON "RequiredVotePlayer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RequiredVotePlayer_matchdayId_playerId_key" ON "RequiredVotePlayer"("matchdayId", "playerId");

-- CreateIndex
CREATE INDEX "PlayerVote_status_isSv_idx" ON "PlayerVote"("status", "isSv");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerVote_matchdayId_playerId_key" ON "PlayerVote"("matchdayId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamScore_lineupId_key" ON "TeamScore"("lineupId");

-- CreateIndex
CREATE INDEX "TeamScore_matchdayId_status_idx" ON "TeamScore"("matchdayId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeamScore_fantasyTeamId_matchdayId_key" ON "TeamScore"("fantasyTeamId", "matchdayId");

-- CreateIndex
CREATE INDEX "TeamScorePlayer_teamScoreId_finalType_idx" ON "TeamScorePlayer"("teamScoreId", "finalType");

-- CreateIndex
CREATE INDEX "TeamScorePlayer_playerId_idx" ON "TeamScorePlayer"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamScorePlayer_teamScoreId_lineupPlayerId_key" ON "TeamScorePlayer"("teamScoreId", "lineupPlayerId");

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyTeam" ADD CONSTRAINT "FantasyTeam_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyTeam" ADD CONSTRAINT "FantasyTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyRoster" ADD CONSTRAINT "FantasyRoster_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyRoster" ADD CONSTRAINT "FantasyRoster_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matchday" ADD CONSTRAINT "Matchday_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lineup" ADD CONSTRAINT "Lineup_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lineup" ADD CONSTRAINT "Lineup_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "Matchday"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineupPlayer" ADD CONSTRAINT "LineupPlayer_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "Lineup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineupPlayer" ADD CONSTRAINT "LineupPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequiredVotePlayer" ADD CONSTRAINT "RequiredVotePlayer_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "Matchday"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequiredVotePlayer" ADD CONSTRAINT "RequiredVotePlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerVote" ADD CONSTRAINT "PlayerVote_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "Matchday"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerVote" ADD CONSTRAINT "PlayerVote_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScore" ADD CONSTRAINT "TeamScore_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScore" ADD CONSTRAINT "TeamScore_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "Matchday"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScore" ADD CONSTRAINT "TeamScore_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "Lineup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScorePlayer" ADD CONSTRAINT "TeamScorePlayer_teamScoreId_fkey" FOREIGN KEY ("teamScoreId") REFERENCES "TeamScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScorePlayer" ADD CONSTRAINT "TeamScorePlayer_lineupPlayerId_fkey" FOREIGN KEY ("lineupPlayerId") REFERENCES "LineupPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScorePlayer" ADD CONSTRAINT "TeamScorePlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScorePlayer" ADD CONSTRAINT "TeamScorePlayer_playerVoteId_fkey" FOREIGN KEY ("playerVoteId") REFERENCES "PlayerVote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScorePlayer" ADD CONSTRAINT "TeamScorePlayer_replacedLineupPlayerId_fkey" FOREIGN KEY ("replacedLineupPlayerId") REFERENCES "LineupPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
