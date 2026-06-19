import { prisma } from "../../prisma.ts";

export type ResetLeagueDataSummary = {
  fantasyFixtureCount: number;
  fantasyTeamCount: number;
  leagueCount: number;
  lineupCount: number;
  matchdayCount: number;
  rosterCount: number;
  scoreCount: number;
  voteCount: number;
};

export async function resetLeagueData(): Promise<ResetLeagueDataSummary> {
  return prisma.$transaction(async (tx) => {
    const [
      leagueCount,
      fantasyTeamCount,
      matchdayCount,
      lineupCount,
      fantasyFixtureCount,
      rosterCount,
      voteCount,
      scoreCount
    ] = await Promise.all([
      tx.league.count(),
      tx.fantasyTeam.count(),
      tx.matchday.count(),
      tx.lineup.count(),
      tx.fantasyFixture.count(),
      tx.fantasyRoster.count(),
      tx.playerVote.count(),
      tx.teamScore.count()
    ]);

    await tx.teamScorePlayer.deleteMany();
    await tx.teamScore.deleteMany();
    await tx.playerVote.deleteMany();
    await tx.requiredVotePlayer.deleteMany();
    await tx.lineupPlayer.deleteMany();
    await tx.lineup.deleteMany();
    await tx.fantasyFixture.deleteMany();
    await tx.fantasyRoster.deleteMany();
    await tx.fantasyTeam.deleteMany();
    await tx.leagueMember.deleteMany();
    await tx.matchday.deleteMany();
    await tx.league.deleteMany();

    return {
      fantasyFixtureCount,
      fantasyTeamCount,
      leagueCount,
      lineupCount,
      matchdayCount,
      rosterCount,
      scoreCount,
      voteCount
    };
  });
}
