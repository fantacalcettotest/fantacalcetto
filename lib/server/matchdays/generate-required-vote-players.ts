import { MatchdayStatus, RequiredVoteStatus } from "@prisma/client";

import { prisma } from "../../prisma.ts";
import { deriveRequiredVoteStatusFromStoredVote } from "../votes/shared.ts";

export type GenerateRequiredVotePlayersResult = {
  createdCount: number;
  ignoredCount: number;
  matchdayId: string;
  totalRequired: number;
  updatedCount: number;
};

export async function generateRequiredVotePlayers(
  matchdayId: string
): Promise<GenerateRequiredVotePlayersResult> {
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

    const lineupPlayers = await tx.lineupPlayer.findMany({
      where: {
        lineup: {
          matchdayId
        }
      },
      select: {
        playerId: true
      }
    });

    const usageByPlayerId = new Map<string, number>();
    for (const lineupPlayer of lineupPlayers) {
      usageByPlayerId.set(
        lineupPlayer.playerId,
        (usageByPlayerId.get(lineupPlayer.playerId) ?? 0) + 1
      );
    }

    const playerIds = Array.from(usageByPlayerId.keys());
    const existingRequiredVotePlayers = await tx.requiredVotePlayer.findMany({
      where: { matchdayId },
      select: {
        id: true,
        playerId: true
      }
    });

    const existingVotes = playerIds.length
      ? await tx.playerVote.findMany({
          where: {
            matchdayId,
            playerId: {
              in: playerIds
            }
          },
          select: {
            playerId: true,
            isSv: true
          }
        })
      : [];

    const votesByPlayerId = new Map(
      existingVotes.map((vote) => [vote.playerId, vote])
    );
    const requiredVotePlayersByPlayerId = new Map(
      existingRequiredVotePlayers.map((record) => [record.playerId, record])
    );

    const stalePlayerIds = existingRequiredVotePlayers
      .filter((record) => !usageByPlayerId.has(record.playerId))
      .map((record) => record.playerId);

    const ignoredCount = stalePlayerIds.length
      ? (
          await tx.requiredVotePlayer.updateMany({
            where: {
              matchdayId,
              playerId: {
                in: stalePlayerIds
              }
            },
            data: {
              status: RequiredVoteStatus.IGNORED,
              usageCount: 0
            }
          })
        ).count
      : 0;

    let createdCount = 0;
    let updatedCount = 0;

    for (const playerId of playerIds) {
      const usageCount = usageByPlayerId.get(playerId) ?? 0;
      const status = deriveRequiredVoteStatusFromStoredVote(
        votesByPlayerId.get(playerId)
      );
      const existingRequiredVotePlayer =
        requiredVotePlayersByPlayerId.get(playerId);

      await tx.requiredVotePlayer.upsert({
        where: {
          matchdayId_playerId: {
            matchdayId,
            playerId
          }
        },
      update: {
        status,
        usageCount
        },
      create: {
        matchdayId,
        playerId,
        status,
        usageCount
        }
      });

      if (existingRequiredVotePlayer) {
        updatedCount += 1;
      } else {
        createdCount += 1;
      }
    }

    const shouldMoveToVotesPending =
      playerIds.length > 0 &&
      (matchday.status === MatchdayStatus.DRAFT ||
        matchday.status === MatchdayStatus.LINEUPS_OPEN ||
        matchday.status === MatchdayStatus.LINEUPS_LOCKED);

    if (shouldMoveToVotesPending) {
      await tx.matchday.update({
        where: { id: matchdayId },
        data: {
          status: MatchdayStatus.VOTES_PENDING
        }
      });
    }

    return {
      createdCount,
      ignoredCount,
      matchdayId,
      totalRequired: playerIds.length,
      updatedCount
    };
  });
}
