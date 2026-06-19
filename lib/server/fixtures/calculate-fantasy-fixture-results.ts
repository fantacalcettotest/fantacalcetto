import { FantasyFixtureStatus } from "@prisma/client";

import { prisma } from "../../prisma.ts";
import { convertScoreToGoals } from "../../scoring/convert-score-to-goals.ts";
import { getFixtureForfeitOutcome } from "./fixture-forfeit.ts";
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

    const scoreByFantasyTeamId = new Map(
      teamScores.map((teamScore) => [teamScore.fantasyTeamId, teamScore])
    );
    const results: CalculateFantasyFixtureResultsResult["results"] = [];

    for (const fixture of fixtures) {
      const homeTeamScore = scoreByFantasyTeamId.get(fixture.homeTeamId);
      const awayTeamScore = scoreByFantasyTeamId.get(fixture.awayTeamId);
      const forfeitOutcome = getFixtureForfeitOutcome({
        awayTeamScoreId: awayTeamScore?.id ?? null,
        homeTeamScoreId: homeTeamScore?.id ?? null
      });

      let homeGoals = 0;
      let awayGoals = 0;

      if (forfeitOutcome === "NONE") {
        const homeTotalScore = prismaDecimalToNumber(homeTeamScore?.totalScore ?? null);
        const awayTotalScore = prismaDecimalToNumber(awayTeamScore?.totalScore ?? null);

        if (homeTotalScore === null) {
          throw new Error(
            `TeamScore ${homeTeamScore?.id ?? "unknown"} has null totalScore and cannot be converted to goals.`
          );
        }

        if (awayTotalScore === null) {
          throw new Error(
            `TeamScore ${awayTeamScore?.id ?? "unknown"} has null totalScore and cannot be converted to goals.`
          );
        }

        homeGoals = convertScoreToGoals(homeTotalScore);
        awayGoals = convertScoreToGoals(awayTotalScore);
      } else if (forfeitOutcome === "HOME_WIN_BY_FORFEIT") {
        homeGoals = 3;
        awayGoals = 0;
      } else if (forfeitOutcome === "AWAY_WIN_BY_FORFEIT") {
        homeGoals = 0;
        awayGoals = 3;
      }

      await tx.fantasyFixture.update({
        where: {
          id: fixture.id
        },
        data: {
          awayGoals,
          awayTeamScoreId: awayTeamScore?.id ?? null,
          homeGoals,
          homeTeamScoreId: homeTeamScore?.id ?? null,
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
