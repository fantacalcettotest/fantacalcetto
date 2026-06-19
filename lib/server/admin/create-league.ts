import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma.ts";

export type CreateLeagueInput = {
  createdById: string;
  maxTeams: number;
  name: string;
};

export type CreateLeagueResult = {
  leagueId: string;
  maxTeams: number;
  name: string;
};

function normalizeLeagueName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function createLeague(
  input: CreateLeagueInput
): Promise<CreateLeagueResult> {
  const name = normalizeLeagueName(input.name);

  if (name.length === 0) {
    throw new Error("Il nome lega e obbligatorio.");
  }

  if (!Number.isInteger(input.maxTeams)) {
    throw new Error("maxTeams deve essere un numero intero.");
  }

  if (input.maxTeams < 2 || input.maxTeams > 50) {
    throw new Error("maxTeams deve essere compreso tra 2 e 50.");
  }

  const duplicateLeague = await prisma.league.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive"
      }
    },
    select: {
      id: true
    }
  });

  if (duplicateLeague) {
    throw new Error("Esiste gia una lega con questo nome.");
  }

  try {
    const league = await prisma.league.create({
      data: {
        createdById: input.createdById,
        maxTeams: input.maxTeams,
        name
      },
      select: {
        id: true,
        maxTeams: true,
        name: true
      }
    });

    return {
      leagueId: league.id,
      maxTeams: league.maxTeams,
      name: league.name
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Esiste gia una lega con questo nome.");
    }

    throw error;
  }
}
