import { LeagueRole, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma.ts";

export type CreateUserFantasyTeamInput = {
  appUserId: string;
  leagueId: string;
  teamName: string;
};

export type CreateUserFantasyTeamResult = {
  created: boolean;
  teamId: string;
};

function normalizeTeamName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function createUserFantasyTeam(
  input: CreateUserFantasyTeamInput
): Promise<CreateUserFantasyTeamResult> {
  const teamName = normalizeTeamName(input.teamName);

  if (teamName.length === 0) {
    throw new Error("Il nome squadra e obbligatorio.");
  }

  if (teamName.length > 50) {
    throw new Error("Il nome squadra deve avere massimo 50 caratteri.");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const league = await tx.league.findUnique({
        where: {
          id: input.leagueId
        },
        select: {
          id: true
        }
      });

      if (!league) {
        throw new Error("Lega non trovata.");
      }

      const existingTeam = await tx.fantasyTeam.findUnique({
        where: {
          leagueId_userId: {
            leagueId: input.leagueId,
            userId: input.appUserId
          }
        },
        select: {
          id: true
        }
      });

      if (existingTeam) {
        return {
          created: false,
          teamId: existingTeam.id
        };
      }

      const duplicateName = await tx.fantasyTeam.findFirst({
        where: {
          leagueId: input.leagueId,
          name: {
            equals: teamName,
            mode: "insensitive"
          }
        },
        select: {
          id: true
        }
      });

      if (duplicateName) {
        throw new Error("Esiste gia una squadra con questo nome nella lega.");
      }

      await tx.leagueMember.upsert({
        where: {
          leagueId_userId: {
            leagueId: input.leagueId,
            userId: input.appUserId
          }
        },
        update: {},
        create: {
          leagueId: input.leagueId,
          role: LeagueRole.MEMBER,
          userId: input.appUserId
        }
      });

      const team = await tx.fantasyTeam.create({
        data: {
          leagueId: input.leagueId,
          name: teamName,
          userId: input.appUserId
        },
        select: {
          id: true
        }
      });

      return {
        created: true,
        teamId: team.id
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Hai gia una squadra in questa lega.");
    }

    throw error;
  }
}
