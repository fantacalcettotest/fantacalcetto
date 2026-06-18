import { VoteStatus } from "@prisma/client";

import { prisma } from "../../prisma.ts";
import {
  calculatePersistedFantavote,
  validatePlayerVoteInput,
  type SavePlayerVoteInput
} from "./shared.ts";

export type SavePlayerVoteResult = {
  finalFantavote: number | null;
  matchdayId: string;
  playerId: string;
  playerVoteId: string;
  requiredVoteStatus: string;
};

export async function savePlayerVote(
  input: SavePlayerVoteInput
): Promise<SavePlayerVoteResult> {
  const validatedInput = validatePlayerVoteInput(input);
  const { finalFantavote, requiredVoteStatus } =
    calculatePersistedFantavote(validatedInput);

  return prisma.$transaction(async (tx) => {
    const playerVote = await tx.playerVote.upsert({
      where: {
        matchdayId_playerId: {
          matchdayId: validatedInput.matchdayId,
          playerId: validatedInput.playerId
        }
      },
      update: {
        assists: validatedInput.assists,
        baseVote: validatedInput.baseVote,
        cleanSheet: validatedInput.cleanSheet,
        finalFantavote,
        goals: validatedInput.goals,
        isSv: validatedInput.isSv,
        notes: validatedInput.notes,
        ownGoals: validatedInput.ownGoals,
        penaltiesMissed: validatedInput.penaltiesMissed,
        penaltiesSaved: validatedInput.penaltiesSaved,
        redCards: validatedInput.redCards,
        status: VoteStatus.CONFIRMED,
        yellowCards: validatedInput.yellowCards
      },
      create: {
        assists: validatedInput.assists,
        baseVote: validatedInput.baseVote,
        cleanSheet: validatedInput.cleanSheet,
        finalFantavote,
        goals: validatedInput.goals,
        isSv: validatedInput.isSv,
        matchdayId: validatedInput.matchdayId,
        notes: validatedInput.notes,
        ownGoals: validatedInput.ownGoals,
        penaltiesMissed: validatedInput.penaltiesMissed,
        penaltiesSaved: validatedInput.penaltiesSaved,
        playerId: validatedInput.playerId,
        redCards: validatedInput.redCards,
        status: VoteStatus.CONFIRMED,
        yellowCards: validatedInput.yellowCards
      },
      select: {
        id: true,
        finalFantavote: true,
        matchdayId: true,
        playerId: true
      }
    });

    await tx.requiredVotePlayer.upsert({
      where: {
        matchdayId_playerId: {
          matchdayId: validatedInput.matchdayId,
          playerId: validatedInput.playerId
        }
      },
      update: {
        status: requiredVoteStatus
      },
      create: {
        matchdayId: validatedInput.matchdayId,
        playerId: validatedInput.playerId,
        status: requiredVoteStatus,
        usageCount: 1
      }
    });

    return {
      finalFantavote:
        playerVote.finalFantavote === null
          ? null
          : playerVote.finalFantavote.toNumber(),
      matchdayId: playerVote.matchdayId,
      playerId: playerVote.playerId,
      playerVoteId: playerVote.id,
      requiredVoteStatus
    };
  });
}
