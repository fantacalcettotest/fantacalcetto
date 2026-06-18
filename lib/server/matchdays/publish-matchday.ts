import { MatchdayStatus, ScoreStatus } from "@prisma/client";

import { prisma } from "../../prisma.ts";

export type PublishMatchdayResult = {
  matchdayId: string;
  publishedAt: Date;
  publishedTeamScoresCount: number;
};

export async function publishMatchday(
  matchdayId: string
): Promise<PublishMatchdayResult> {
  return prisma.$transaction(async (tx) => {
    const matchday = await tx.matchday.findUnique({
      where: { id: matchdayId },
      select: {
        id: true,
        status: true
      }
    });

    if (!matchday) {
      throw new Error(`Matchday ${matchdayId} not found.`);
    }

    if (matchday.status !== MatchdayStatus.SCORES_CALCULATED) {
      throw new Error(
        `Matchday ${matchdayId} can be published only from SCORES_CALCULATED status.`
      );
    }

    const publishedAt = new Date();
    const publishedScores = await tx.teamScore.updateMany({
      where: {
        matchdayId
      },
      data: {
        publishedAt,
        status: ScoreStatus.PUBLISHED
      }
    });

    if (publishedScores.count === 0) {
      throw new Error(`Matchday ${matchdayId} has no calculated team scores.`);
    }

    await tx.matchday.update({
      where: { id: matchdayId },
      data: {
        status: MatchdayStatus.PUBLISHED
      }
    });

    return {
      matchdayId,
      publishedAt,
      publishedTeamScoresCount: publishedScores.count
    };
  });
}
