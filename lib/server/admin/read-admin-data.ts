import { prisma } from "../../prisma.ts";
import { calculateLeagueStandings } from "../standings/calculate-league-standings.ts";
import { prismaDecimalToNumber } from "../votes/shared.ts";

export async function getAdminDashboardData() {
  const leagues = await prisma.league.findMany({
    orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    include: {
      matchdays: {
        orderBy: {
          number: "asc"
        },
        include: {
          _count: {
            select: {
              lineups: true,
              playerVotes: true,
              requiredVotes: true,
              teamScores: true
            }
          }
        }
      },
      _count: {
        select: {
          fantasyTeams: true,
          members: true
        }
      }
    }
  });

  return {
    leagues: leagues.map((league) => ({
      ...league,
      availableSpots: Math.max(league.maxTeams - league._count.fantasyTeams, 0)
    }))
  };
}

export async function getAdminMatchdayVotesData(matchdayId: string) {
  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    include: {
      league: {
        select: {
          id: true,
          maxAutoSubs: true,
          name: true,
          startersCount: true
        }
      },
      lineups: {
        select: {
          id: true
        }
      },
      requiredVotes: {
        orderBy: [{ usageCount: "desc" }, { player: { name: "asc" } }],
        include: {
          player: {
            select: {
              id: true,
              name: true,
              teamName: true
            }
          }
        }
      },
      playerVotes: {
        select: {
          assists: true,
          baseVote: true,
          cleanSheet: true,
          finalFantavote: true,
          goals: true,
          id: true,
          isSv: true,
          matchdayId: true,
          notes: true,
          ownGoals: true,
          penaltiesMissed: true,
          penaltiesSaved: true,
          playerId: true,
          redCards: true,
          status: true,
          yellowCards: true
        }
      }
    }
  });

  if (!matchday) {
    return null;
  }

  const votesByPlayerId = new Map(
    matchday.playerVotes.map((vote) => [vote.playerId, vote])
  );
  const pendingCount = matchday.requiredVotes.filter(
    (record) => record.status === "PENDING"
  ).length;
  const completedStatusCount = matchday.requiredVotes.filter(
    (record) => record.status === "COMPLETED"
  ).length;
  const svCount = matchday.requiredVotes.filter(
    (record) => record.status === "SV"
  ).length;
  const ignoredCount = matchday.requiredVotes.filter(
    (record) => record.status === "IGNORED"
  ).length;
  const completedCount = matchday.requiredVotes.filter(
    (record) => record.status !== "PENDING"
  ).length;
  const missingCount = matchday.requiredVotes.length - completedCount;

  return {
    completion: {
      completedStatusCount,
      completedCount,
      ignoredCount,
      isComplete:
        matchday.requiredVotes.length > 0 && missingCount === 0,
      missingCount,
      pendingCount,
      svCount,
      totalRequired: matchday.requiredVotes.length
    },
    matchday: {
      id: matchday.id,
      league: matchday.league,
      lineupDeadlineAt: matchday.lineupDeadlineAt,
      lineupsCount: matchday.lineups.length,
      number: matchday.number,
      requiredVotePlayers: matchday.requiredVotes.map((requiredVotePlayer) => {
        const playerVote = votesByPlayerId.get(requiredVotePlayer.playerId);

        return {
          player: requiredVotePlayer.player,
          playerVote: playerVote
            ? {
                ...playerVote,
                baseVote: prismaDecimalToNumber(playerVote.baseVote),
                finalFantavote: prismaDecimalToNumber(
                  playerVote.finalFantavote
                )
              }
            : null,
          status: requiredVotePlayer.status,
          usageCount: requiredVotePlayer.usageCount
        };
      }),
      status: matchday.status
    }
  };
}

export async function getAdminMatchdayScoresData(matchdayId: string) {
  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    include: {
      fixtures: {
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
      league: {
        select: {
          id: true,
          maxAutoSubs: true,
          name: true,
          startersCount: true
        }
      },
      requiredVotes: {
        orderBy: [{ usageCount: "desc" }, { player: { name: "asc" } }],
        include: {
          player: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      teamScores: {
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

  const completedCount = matchday.requiredVotes.filter(
    (record) => record.status !== "PENDING"
  ).length;
  const missingRecords = matchday.requiredVotes
    .filter((record) => record.status === "PENDING")
    .map((record) => ({
      playerId: record.player.id,
      playerName: record.player.name,
      status: record.status,
      usageCount: record.usageCount
    }));

  return {
    completion: {
      completedCount,
      isComplete:
        matchday.requiredVotes.length > 0 && missingRecords.length === 0,
      missingCount: missingRecords.length,
      missingRecords,
      totalRequired: matchday.requiredVotes.length
    },
    matchday: {
      id: matchday.id,
      fixtures: matchday.fixtures.map((fixture) => ({
        awayGoals: fixture.awayGoals,
        awayTeam: fixture.awayTeam,
        awayTeamScore: fixture.awayTeamScore
          ? {
              id: fixture.awayTeamScore.id,
              totalScore: prismaDecimalToNumber(fixture.awayTeamScore.totalScore)
            }
          : null,
        homeGoals: fixture.homeGoals,
        homeTeam: fixture.homeTeam,
        homeTeamScore: fixture.homeTeamScore
          ? {
              id: fixture.homeTeamScore.id,
              totalScore: prismaDecimalToNumber(fixture.homeTeamScore.totalScore)
            }
          : null,
        id: fixture.id,
        status: fixture.status
      })),
      league: matchday.league,
      number: matchday.number,
      status: matchday.status,
      teamScores: matchday.teamScores.map((teamScore) => ({
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
          slotType: player.slotType
        })),
        publishedAt: teamScore.publishedAt,
        status: teamScore.status,
        totalScore: prismaDecimalToNumber(teamScore.totalScore)
      }))
    }
  };
}

export async function getAdminLeagueStandingsData(leagueId: string) {
  const [league, standingsResult] = await Promise.all([
    prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        status: true,
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

  return {
    league,
    standings: standingsResult.standings
  };
}
