import { PlayerRole } from "@prisma/client";

import { prisma } from "../../prisma.ts";

export type ImportedPlayerInput = {
  externalId: string;
  isActive?: boolean;
  name: string;
  role: PlayerRole;
  source: string;
  teamName?: string | null;
};

export type ImportPlayerListResult = {
  createdCount: number;
  total: number;
  updatedCount: number;
};

function normalizeString(value: string) {
  return value.trim();
}

export async function importPlayerList(
  players: ImportedPlayerInput[]
): Promise<ImportPlayerListResult> {
  let createdCount = 0;
  let updatedCount = 0;

  for (const player of players) {
    const source = normalizeString(player.source);
    const externalId = normalizeString(player.externalId);
    const name = normalizeString(player.name);

    if (source.length === 0) {
      throw new Error("Player source is required.");
    }

    if (externalId.length === 0) {
      throw new Error("Player externalId is required.");
    }

    if (name.length === 0) {
      throw new Error("Player name is required.");
    }

    const existingPlayer = await prisma.player.findUnique({
      where: {
        source_externalId: {
          source,
          externalId
        }
      },
      select: {
        id: true
      }
    });

    if (existingPlayer) {
      await prisma.player.update({
        where: {
          id: existingPlayer.id
        },
        data: {
          isActive: player.isActive ?? true,
          name,
          role: player.role,
          source,
          externalId,
          teamName: player.teamName ?? null
        }
      });
      updatedCount += 1;
      continue;
    }

    await prisma.player.create({
      data: {
        isActive: player.isActive ?? true,
        name,
        role: player.role,
        source,
        externalId,
        teamName: player.teamName ?? null
      }
    });
    createdCount += 1;
  }

  return {
    createdCount,
    total: players.length,
    updatedCount
  };
}
