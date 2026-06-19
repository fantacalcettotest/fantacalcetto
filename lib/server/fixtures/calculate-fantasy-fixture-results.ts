import { FantasyFixtureStatus } from "@prisma/client";

import { prisma } from "../../prisma.ts";
import { convertScoreToGoals } from "../../scoring/convert-score-to-goals.ts";
import { prismaDecimalToNumber } from "../votes/shared.ts";

export type CalculateFantasyFixtureResultsResult = {
  calculatedCount: number;
  matchdayId: string;
  results: Array<{
    awayGoals: number;
    awayTeamId: string;
    fixtureId: string;
    homeGoals: number;
    homeTeamId: string;
  }>;
  totalFixtures: number;
};

export async function calculateFantasyFixtureResults(
  matchdayId: string
): Promise<CalculateFantasyFixtureResultsResult> {
  return prisma.$transaction(async (tx) => {
    const matchday = await tx.matchday.findUnique({
      where: { id: matchdayId },
      select: {
        id: true
      }
    });

    if (!matchday) {
      throw new Error(`Matchday ${matchdayId} not found.`);
    }

    const fixtures = await tx.fantasyFixture.findMany({
      where: { matchdayId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        awayTeamId: true,
        homeTeamId: true,
        id: true
      }
    });

    if (fixtures.length === 0) {
      throw new Error(`No fantasy fixtures found for matchday ${matchdayId}.`);
    }

    const teamScores = await tx.teamScore.findMany({
      where: { matchdayId },
      select: {
        fantasyTeamId: true,
        id: true,
        totalScore: true
      }
    });

    if (teamScores.length === 0) {
      throw new Error(`No TeamScore records found for matchday ${matchdayId}.`);
    }

    const scoreByFantasyTeamId = new Map(
      teamScores.map((teamScore) => [teamScore.fantasyTeamId, teamScore])
    );
    const results: CalculateFantasyFixtureResultsResult["results"] = [];

    for (const fixture of fixtures) {
      const homeTeamScore = scoreByFantasyTeamId.get(fixture.homeTeamId);
      if (!homeTeamScore) {
        throw new Error(
          `Missing TeamScore for home team ${fixture.homeTeamId} in matchday ${matchdayId}.`
        );
      }

      const awayTeamScore = scoreByFantasyTeamId.get(fixture.awayTeamId);
      if (!awayTeamScore) {
        throw new Error(
          `Missing TeamScore for away team ${fixture.awayTeamId} in matchday ${matchdayId}.`
        );
      }

      const homeTotalScore = prismaDecimalToNumber(homeTeamScore.totalScore);
      const awayTotalScore = prismaDecimalToNumber(awayTeamScore.totalScore);

      if (homeTotalScore === null) {
        throw new Error(
          `TeamScore ${homeTeamScore.id} has null totalScore and cannot be converted to goals.`
        );
      }

      if (awayTotalScore === null) {
        throw new Error(
          `TeamScore ${awayTeamScore.id} has null totalScore and cannot be converted to goals.`
        );
      }

      const homeGoals = convertScoreToGoals(homeTotalScore);
      const awayGoals = convertScoreToGoals(awayTotalScore);

      await tx.fantasyFixture.update({
        where: {
          id: fixture.id
        },
        data: {
          awayGoals,
          awayTeamScoreId: awayTeamScore.id,
          homeGoals,
          homeTeamScoreId: homeTeamScore.id,
          status: FantasyFixtureStatus.CALCULATED
        }
      });

      results.push({
        awayGoals,
        awayTeamId: fixture.awayTeamId,
        fixtureId: fixture.id,
        homeGoals,
        homeTeamId: fixture.homeTeamId
      });
    }

    return {
      calculatedCount: results.length,
      matchdayId,
      results,
      totalFixtures: fixtures.length
    };
  });
}
