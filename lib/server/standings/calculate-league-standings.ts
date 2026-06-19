import { FantasyFixtureStatus } from "@prisma/client";

import { prisma } from "../../prisma.ts";
import { prismaDecimalToNumber } from "../votes/shared.ts";

export type LeagueStandingRow = {
  bestFantasyScore: number;
  fantasyPointsTotal: number;
  goalDifference: number;
  goalsAgainst: number;
  goalsFor: number;
  leaguePoints: number;
  losses: number;
  played: number;
  teamId: string;
  teamName: string;
  wins: number;
  draws: number;
};

export type CalculateLeagueStandingsResult = {
  leagueId: string;
  standings: LeagueStandingRow[];
};

function createEmptyStanding(team: { id: string; name: string }): LeagueStandingRow {
  return {
    bestFantasyScore: 0,
    draws: 0,
    fantasyPointsTotal: 0,
    goalDifference: 0,
    goalsAgainst: 0,
    goalsFor: 0,
    leaguePoints: 0,
    losses: 0,
    played: 0,
    teamId: team.id,
    teamName: team.name,
    wins: 0
  };
}

function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function calculateLeagueStandings(
  leagueId: string
): Promise<CalculateLeagueStandingsResult> {
  const [teams, publishedFixtures] = await Promise.all([
    prisma.fantasyTeam.findMany({
      where: { leagueId },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true
      }
    }),
    prisma.fantasyFixture.findMany({
      where: {
        matchday: {
          leagueId
        },
        status: FantasyFixtureStatus.PUBLISHED
      },
      include: {
        awayTeam: {
          select: {
            id: true,
            name: true
          }
        },
        awayTeamScore: {
          select: {
            totalScore: true
          }
        },
        homeTeam: {
          select: {
            id: true,
            name: true
          }
        },
        homeTeamScore: {
          select: {
            totalScore: true
          }
        }
      }
    })
  ]);

  const standings = new Map<string, LeagueStandingRow>();
  for (const team of teams) {
    standings.set(team.id, createEmptyStanding(team));
  }

  for (const fixture of publishedFixtures) {
    if (fixture.homeGoals === null || fixture.awayGoals === null) {
      throw new Error(
        `Published fantasy fixture ${fixture.id} is missing calculated goals.`
      );
    }

    const homeStanding = standings.get(fixture.homeTeamId);
    const awayStanding = standings.get(fixture.awayTeamId);

    if (!homeStanding || !awayStanding) {
      throw new Error(
        `Fantasy fixture ${fixture.id} references a team outside league ${leagueId}.`
      );
    }

    const homeFantasyScore =
      prismaDecimalToNumber(fixture.homeTeamScore?.totalScore) ?? 0;
    const awayFantasyScore =
      prismaDecimalToNumber(fixture.awayTeamScore?.totalScore) ?? 0;

    homeStanding.played += 1;
    awayStanding.played += 1;

    homeStanding.goalsFor += fixture.homeGoals;
    homeStanding.goalsAgainst += fixture.awayGoals;
    awayStanding.goalsFor += fixture.awayGoals;
    awayStanding.goalsAgainst += fixture.homeGoals;

    homeStanding.fantasyPointsTotal = roundToTwoDecimals(
      homeStanding.fantasyPointsTotal + homeFantasyScore
    );
    awayStanding.fantasyPointsTotal = roundToTwoDecimals(
      awayStanding.fantasyPointsTotal + awayFantasyScore
    );

    homeStanding.bestFantasyScore = Math.max(
      homeStanding.bestFantasyScore,
      homeFantasyScore
    );
    awayStanding.bestFantasyScore = Math.max(
      awayStanding.bestFantasyScore,
      awayFantasyScore
    );

    if (fixture.homeGoals > fixture.awayGoals) {
      homeStanding.wins += 1;
      homeStanding.leaguePoints += 3;
      awayStanding.losses += 1;
    } else if (fixture.homeGoals < fixture.awayGoals) {
      awayStanding.wins += 1;
      awayStanding.leaguePoints += 3;
      homeStanding.losses += 1;
    } else {
      homeStanding.draws += 1;
      awayStanding.draws += 1;
      homeStanding.leaguePoints += 1;
      awayStanding.leaguePoints += 1;
    }
  }

  const rows = Array.from(standings.values()).map((standing) => ({
    ...standing,
    goalDifference: standing.goalsFor - standing.goalsAgainst
  }));

  rows.sort((left, right) => {
    if (right.leaguePoints !== left.leaguePoints) {
      return right.leaguePoints - left.leaguePoints;
    }

    if (right.goalDifference !== left.goalDifference) {
      return right.goalDifference - left.goalDifference;
    }

    if (right.goalsFor !== left.goalsFor) {
      return right.goalsFor - left.goalsFor;
    }

    if (right.fantasyPointsTotal !== left.fantasyPointsTotal) {
      return right.fantasyPointsTotal - left.fantasyPointsTotal;
    }

    return left.teamName.localeCompare(right.teamName, "it");
  });

  return {
    leagueId,
    standings: rows
  };
}
