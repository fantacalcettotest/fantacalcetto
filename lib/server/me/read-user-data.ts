import { prisma } from "@/lib/prisma.ts";
import type { PlayerRoleFilter } from "@/lib/players/player-role.ts";
import { validateRosterComposition } from "@/lib/server/rosters/validate-roster-composition.ts";

export async function getUserDashboardData(appUserId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: appUserId
    },
    select: {
      displayName: true,
      email: true,
      fantasyTeams: {
        orderBy: [{ createdAt: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          league: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      id: true,
      leagueMembers: {
        orderBy: [{ createdAt: "asc" }],
        select: {
          role: true,
          league: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      role: true
    }
  });

  if (!user) {
    return null;
  }

  const leaguesMap = new Map<
    string,
    {
      id: string;
      membershipRole: string | null;
      myTeam: { id: string; name: string } | null;
      name: string;
    }
  >();

  const myTeam = user.fantasyTeams[0] ?? null;

  for (const membership of user.leagueMembers) {
    leaguesMap.set(membership.league.id, {
      id: membership.league.id,
      membershipRole: membership.role,
      myTeam: null,
      name: membership.league.name
    });
  }

  for (const team of user.fantasyTeams) {
    const existing = leaguesMap.get(team.league.id);
    leaguesMap.set(team.league.id, {
      id: team.league.id,
      membershipRole: existing?.membershipRole ?? null,
      myTeam: {
        id: team.id,
        name: team.name
      },
      name: team.league.name
    });
  }

  return {
    leagues: Array.from(leaguesMap.values()).sort((left, right) =>
      left.name.localeCompare(right.name, "it")
    ),
    myTeam,
    user
  };
}

export async function getLeagueJoinPageData(leagueId: string, appUserId: string) {
  const [league, existingLeagueTeam, existingGlobalTeam] = await Promise.all([
    prisma.league.findUnique({
      where: {
        id: leagueId
      },
      select: {
        id: true,
        maxTeams: true,
        name: true,
        status: true,
        _count: {
          select: {
            fantasyTeams: true,
            members: true
          }
        }
      }
    }),
    prisma.fantasyTeam.findUnique({
      where: {
        leagueId_userId: {
          leagueId,
          userId: appUserId
        }
      },
      select: {
        id: true,
        league: {
          select: {
            id: true,
            name: true
          }
        },
        name: true
      }
    }),
    prisma.fantasyTeam.findUnique({
      where: {
        userId: appUserId
      },
      select: {
        id: true,
        league: {
          select: {
            id: true,
            name: true
          }
        },
        name: true
      }
    })
  ]);

  if (!league) {
    return null;
  }

  return {
    canJoin:
      !existingGlobalTeam &&
      league._count.fantasyTeams < league.maxTeams,
    existingGlobalTeam,
    existingLeagueTeam,
    isFull: league._count.fantasyTeams >= league.maxTeams,
    league
  };
}

export async function getUserTeamPageData(teamId: string) {
  return prisma.fantasyTeam.findUnique({
    where: {
      id: teamId
    },
    select: {
      id: true,
      league: {
        select: {
          id: true,
          name: true
        }
      },
      name: true,
      roster: {
        orderBy: [{ player: { role: "asc" } }, { player: { name: "asc" } }],
        select: {
          id: true,
          player: {
            select: {
              id: true,
              name: true,
              role: true,
              source: true,
              teamName: true
            }
          }
        }
      },
      userId: true
    }
  });
}

export async function getUserTeamRosterPageData(
  teamId: string,
  roleFilter: PlayerRoleFilter
) {
  const [team, activePlayersCount, availablePlayers] = await Promise.all([
    getUserTeamPageData(teamId),
    prisma.player.count({
      where: {
        isActive: true
      }
    }),
    prisma.player.findMany({
      where: {
        isActive: true,
        ...(roleFilter === "ALL" ? {} : { role: roleFilter })
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        role: true,
        source: true,
        teamName: true
      }
    })
  ]);

  if (!team) {
    return null;
  }

  const rosterPlayerIds = new Set(team.roster.map((entry) => entry.player.id));

  return {
    activePlayersCount,
    availablePlayers: availablePlayers.map((player) => ({
      ...player,
      isSelected: rosterPlayerIds.has(player.id)
    })),
    rosterValidation: validateRosterComposition(
      team.roster.map((entry) => ({
        role: entry.player.role
      }))
    ),
    team
  };
}
