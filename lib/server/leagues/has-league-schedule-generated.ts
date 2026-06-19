import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma.ts";

type LeagueScheduleDbClient = typeof prisma | Prisma.TransactionClient;

export async function hasLeagueScheduleGeneratedWithDb(
  db: LeagueScheduleDbClient,
  leagueId: string
) {
  const [existingMatchday, existingFixture] = await Promise.all([
    db.matchday.findFirst({
      where: {
        leagueId
      },
      select: {
        id: true
      }
    }),
    db.fantasyFixture.findFirst({
      where: {
        matchday: {
          leagueId
        }
      },
      select: {
        id: true
      }
    })
  ]);

  return Boolean(existingMatchday || existingFixture);
}

export async function hasLeagueScheduleGenerated(leagueId: string) {
  return hasLeagueScheduleGeneratedWithDb(prisma, leagueId);
}
