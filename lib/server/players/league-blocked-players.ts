import { prisma } from "@/lib/prisma";

export async function getBlockedPlayerIdsForLeague(leagueId: string) {
  const blockedPlayers = await prisma.leagueBlockedPlayer.findMany({
    where: {
      leagueId
    },
    select: {
      playerId: true
    }
  });

  return blockedPlayers.map((entry) => entry.playerId);
}

export async function isPlayerBlockedInLeague(
  leagueId: string,
  playerId: string
) {
  const blockedPlayer = await prisma.leagueBlockedPlayer.findUnique({
    where: {
      leagueId_playerId: {
        leagueId,
        playerId
      }
    },
    select: {
      id: true
    }
  });

  return blockedPlayer !== null;
}

export async function blockPlayerInLeague(
  leagueId: string,
  playerId: string,
  reason?: string | null
) {
  const normalizedReason =
    typeof reason === "string" && reason.trim().length > 0
      ? reason.trim()
      : null;

  return prisma.leagueBlockedPlayer.upsert({
    where: {
      leagueId_playerId: {
        leagueId,
        playerId
      }
    },
    update: {
      reason: normalizedReason
    },
    create: {
      leagueId,
      playerId,
      reason: normalizedReason
    }
  });
}

export async function unblockPlayerInLeague(leagueId: string, playerId: string) {
  const result = await prisma.leagueBlockedPlayer.deleteMany({
    where: {
      leagueId,
      playerId
    }
  });

  return {
    deletedCount: result.count
  };
}
