import {
  FantasyFixtureStatus,
  MatchdayStatus,
  ScoreStatus
} from "@prisma/client";

import { prisma } from "../../prisma.ts";
import { calculateLeagueStandings } from "../standings/calculate-league-standings.ts";
import { prismaDecimalToNumber } from "../votes/shared.ts";

const PUBLIC_MATCHDAY_STATUSES: MatchdayStatus[] = [
  MatchdayStatus.PUBLISHED,
  MatchdayStatus.LOCKED
];

const PUBLIC_TEAM_SCORE_STATUSES: ScoreStatus[] = [
  ScoreStatus.PUBLISHED,
  ScoreStatus.LOCKED
];

export async function getPublicLeagueLayoutData(leagueId: string) {
  return prisma.league.findUnique({
    where: { id: leagueId },
    select: {
      id: true,
      name: true
    }
  });
}

export async function getPublicLeagueHomeData(leagueId: string) {
  const [league, standingsResult] = await Promise.all([
    prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            fantasyTeams: true
          }
        },
        matchdays: {
          where: {
            status: {
              in: [...PUBLIC_MATCHDAY_STATUSES]
            }
          },
          orderBy: [{ number: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            number: true,
            status: true,
            _count: {
              select: {
                fixtures: true,
                teamScores: true
              }
            }
          }
        }
      }
    }),
    calculateLeagueStandings(leagueId)
  ]);

  if (!league) {
    return null;
  }

  return {
    league: {
      fantasyTeamsCount: league._count.fantasyTeams,
      id: league.id,
      name: league.name,
      publishedMatchdaysCount: league.matchdays.length
    },
    matchdays: league.matchdays,
    standings: standingsResult.standings
  };
}

export async function getPublicLeagueStandingsData(leagueId: string) {
  const [league, standingsResult] = await Promise.all([
    prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            fantasyTeams: true,
            matchdays: true
          }
        }
      }
    }),
    calculateLeagueStandings(leagueId)
  ]);

  if (!league) {
    return null;
  }

  const publishedMatchdaysCount = await prisma.matchday.count({
    where: {
      leagueId,
      status: {
        in: [...PUBLIC_MATCHDAY_STATUSES]
      }
    }
  });

  return {
    league: {
      fantasyTeamsCount: league._count.fantasyTeams,
      id: league.id,
      name: league.name,
      publishedMatchdaysCount,
      totalMatchdaysCount: league._count.matchdays
    },
    standings: standingsResult.standings
  };
}

export async function getPublicMatchdayData(
  leagueId: string,
  matchdayId: string
) {
  const matchday = await prisma.matchday.findFirst({
    where: {
      id: matchdayId,
      leagueId
    },
    include: {
      league: {
        select: {
          id: true,
          name: true
        }
      },
      fixtures: {
        where: {
          status: FantasyFixtureStatus.PUBLISHED
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: {
          awayTeam: {
            select: {
              id: true,
              name: true
            }
          },
          awayTeamScore: {
            select: {
              id: true,
              totalScore: true
            }
          },
          homeTeam: {
            select: {
              id: true,
              name: true
            }
          },
          homeTeamScore: {
            select: {
              id: true,
              totalScore: true
            }
          }
        }
      },
      teamScores: {
        where: {
          status: {
            in: [...PUBLIC_TEAM_SCORE_STATUSES]
          }
        },
        orderBy: [{ totalScore: "desc" }, { fantasyTeam: { name: "asc" } }],
        include: {
          fantasyTeam: {
            select: {
              id: true,
              name: true
            }
          },
          players: {
            orderBy: [{ countsForScore: "desc" }, { positionOrder: "asc" }],
            include: {
              player: {
                select: {
                  id: true,
                  name: true
                }
              },
              replacedLineupPlayer: {
                select: {
                  id: true,
                  player: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!matchday) {
    return null;
  }

  const isPublic = PUBLIC_MATCHDAY_STATUSES.includes(matchday.status);

  return {
    isPublic,
    matchday: {
      fixtures: isPublic
        ? matchday.fixtures.map((fixture) => ({
            awayGoals: fixture.awayGoals,
            awayTeam: fixture.awayTeam,
            awayTeamScore: fixture.awayTeamScore
              ? {
                  id: fixture.awayTeamScore.id,
                  totalScore: prismaDecimalToNumber(
                    fixture.awayTeamScore.totalScore
                  )
                }
              : null,
            homeGoals: fixture.homeGoals,
            homeTeam: fixture.homeTeam,
            homeTeamScore: fixture.homeTeamScore
              ? {
                  id: fixture.homeTeamScore.id,
                  totalScore: prismaDecimalToNumber(
                    fixture.homeTeamScore.totalScore
                  )
                }
              : null,
            id: fixture.id,
            status: fixture.status
          }))
        : [],
      id: matchday.id,
      league: matchday.league,
      number: matchday.number,
      status: matchday.status,
      teamScores: isPublic
        ? matchday.teamScores.map((teamScore) => ({
            autoSubsUsed: teamScore.autoSubsUsed,
            fantasyTeam: teamScore.fantasyTeam,
            id: teamScore.id,
            players: teamScore.players.map((player) => ({
              countsForScore: player.countsForScore,
              finalFantavote: prismaDecimalToNumber(player.finalFantavote),
              finalType: player.finalType,
              id: player.id,
              isSv: player.isSv,
              player: player.player,
              positionOrder: player.positionOrder,
              replacedLineupPlayer: player.replacedLineupPlayer
                ? {
                    id: player.replacedLineupPlayer.id,
                    player: player.replacedLineupPlayer.player
                  }
                : null,
              slotType: player.slotType
            })),
            publishedAt: teamScore.publishedAt,
            status: teamScore.status,
            totalScore: prismaDecimalToNumber(teamScore.totalScore)
          }))
        : []
    }
  };
}
