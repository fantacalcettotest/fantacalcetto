import { prisma } from "@/lib/prisma.ts";

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
    user
  };
}

export async function getLeagueJoinPageData(leagueId: string, appUserId: string) {
  const [league, existingTeam] = await Promise.all([
    prisma.league.findUnique({
      where: {
        id: leagueId
      },
      select: {
        id: true,
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
        name: true
      }
    })
  ]);

  if (!league) {
    return null;
  }

  return {
    existingTeam,
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
        orderBy: [{ player: { name: "asc" } }],
        select: {
          id: true,
          player: {
            select: {
              id: true,
              name: true,
              teamName: true
            }
          }
        }
      },
      userId: true
    }
  });
}
