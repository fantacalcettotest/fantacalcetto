"use server";

import { Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedAppUser } from "@/lib/auth/app-user";
import type { PlayerRoleFilter } from "@/lib/players/player-role.ts";
import { parsePlayerRoleFilter } from "@/lib/players/player-role.ts";
import { prisma } from "@/lib/prisma.ts";
import { createUserFantasyTeam } from "@/lib/server/teams/create-user-fantasy-team";

function buildJoinLeagueRedirectPath(leagueId: string, error?: string) {
  const searchParams = new URLSearchParams();

  if (error) {
    searchParams.set("error", error);
  }

  const search = searchParams.toString();
  return search.length > 0
    ? `/leagues/${leagueId}/join?${search}`
    : `/leagues/${leagueId}/join`;
}

function buildRosterRedirectPath(
  teamId: string,
  roleFilter?: string | null,
  options?: {
    error?: string;
    notice?: string;
  }
) {
  const searchParams = new URLSearchParams();
  const parsedFilter = parsePlayerRoleFilter(roleFilter);

  searchParams.set("role", parsedFilter);

  if (options?.error) {
    searchParams.set("error", options.error);
  }

  if (options?.notice) {
    searchParams.set("notice", options.notice);
  }

  return `/me/teams/${teamId}/roster?${searchParams.toString()}`;
}

async function assertTeamOwnerOrAdmin(teamId: string) {
  const authContext = await requireAuthenticatedAppUser(`/me/teams/${teamId}`);
  const team = await prisma.fantasyTeam.findUnique({
    where: {
      id: teamId
    },
    select: {
      id: true,
      userId: true
    }
  });

  if (!team) {
    throw new Error("Squadra non trovata.");
  }

  const canAccess =
    authContext.appUser.role === UserRole.ADMIN ||
    authContext.appUser.id === team.userId;

  if (!canAccess) {
    throw new Error("Accesso non autorizzato.");
  }

  return team;
}

function revalidateRosterPaths(teamId: string) {
  revalidatePath("/me");
  revalidatePath(`/me/teams/${teamId}`);
  revalidatePath(`/me/teams/${teamId}/roster`);
}

export async function createFantasyTeamAction(formData: FormData) {
  const rawLeagueId = formData.get("leagueId");
  const rawTeamName = formData.get("teamName");

  const leagueId = typeof rawLeagueId === "string" ? rawLeagueId : "";
  const teamName = typeof rawTeamName === "string" ? rawTeamName : "";

  if (leagueId.trim().length === 0) {
    redirect("/me");
  }

  const authContext = await requireAuthenticatedAppUser(
    `/leagues/${leagueId}/join`
  );

  try {
    const result = await createUserFantasyTeam({
      appUserId: authContext.appUser.id,
      leagueId,
      teamName
    });

    revalidatePath("/me");
    revalidatePath(`/leagues/${leagueId}`);
    revalidatePath(`/leagues/${leagueId}/join`);

    redirect(`/me/teams/${result.teamId}`);
  } catch (error) {
    redirect(
      buildJoinLeagueRedirectPath(
        leagueId,
        error instanceof Error
          ? error.message
          : "Impossibile creare la squadra fantasy."
      )
    );
  }
}

export async function addPlayerToRosterAction(
  teamId: string,
  playerId: string,
  currentRoleFilter: PlayerRoleFilter | undefined,
  _formData: FormData
) {
  const team = await assertTeamOwnerOrAdmin(teamId);

  try {
    await prisma.$transaction(async (tx) => {
      const fullTeam = await tx.fantasyTeam.findUnique({
        where: {
          id: team.id
        },
        select: {
          id: true,
          roster: {
            select: {
              id: true,
              playerId: true
            }
          }
        }
      });

      if (!fullTeam) {
        throw new Error("Squadra non trovata.");
      }

      const player = await tx.player.findUnique({
        where: {
          id: playerId
        },
        select: {
          id: true,
          isActive: true,
          name: true
        }
      });

      if (!player || !player.isActive) {
        throw new Error("Giocatore non disponibile.");
      }

      if (fullTeam.roster.some((entry) => entry.playerId === player.id)) {
        throw new Error("Questo giocatore e gia presente nella rosa.");
      }

      if (fullTeam.roster.length >= 8) {
        throw new Error("La rosa ha gia raggiunto il limite di 8 giocatori.");
      }

      await tx.fantasyRoster.create({
        data: {
          fantasyTeamId: fullTeam.id,
          playerId: player.id
        }
      });
    });

    revalidateRosterPaths(teamId);
    redirect(
      buildRosterRedirectPath(teamId, currentRoleFilter, {
        notice: "Giocatore aggiunto alla rosa."
      })
    );
  } catch (error) {
    const errorMessage =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
        ? "Questo giocatore e gia presente nella rosa."
        : error instanceof Error
          ? error.message
          : "Impossibile aggiungere il giocatore alla rosa.";

    redirect(
      buildRosterRedirectPath(teamId, currentRoleFilter, {
        error: errorMessage
      })
    );
  }
}

export async function removePlayerFromRosterAction(
  teamId: string,
  playerId: string,
  currentRoleFilter: PlayerRoleFilter | undefined,
  _formData: FormData
) {
  const team = await assertTeamOwnerOrAdmin(teamId);

  try {
    await prisma.$transaction(async (tx) => {
      const rosterEntry = await tx.fantasyRoster.findUnique({
        where: {
          fantasyTeamId_playerId: {
            fantasyTeamId: team.id,
            playerId
          }
        },
        select: {
          id: true
        }
      });

      if (!rosterEntry) {
        throw new Error("Il giocatore non e presente nella rosa.");
      }

      await tx.fantasyRoster.delete({
        where: {
          id: rosterEntry.id
        }
      });
    });

    revalidateRosterPaths(teamId);
    redirect(
      buildRosterRedirectPath(teamId, currentRoleFilter, {
        notice: "Giocatore rimosso dalla rosa."
      })
    );
  } catch (error) {
    redirect(
      buildRosterRedirectPath(teamId, currentRoleFilter, {
        error:
          error instanceof Error
            ? error.message
            : "Impossibile rimuovere il giocatore dalla rosa."
      })
    );
  }
}
