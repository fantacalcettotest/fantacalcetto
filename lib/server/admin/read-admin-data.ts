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

export async function getAdminLeagueMatchdayCreationData(leagueId: string) {
  return prisma.league.findUnique({
    where: {
      id: leagueId
    },
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
  });
}

export async function getAdminLeagueScheduleData(leagueId: string) {
  const league = await prisma.league.findUnique({
    where: {
      id: leagueId
    },
    select: {
      id: true,
      maxTeams: true,
      name: true,
      fantasyTeams: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true
        }
      },
      matchdays: {
        orderBy: [{ number: "asc" }],
        select: {
          fixtures: {
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            select: {
              awayTeam: {
                select: {
                  id: true,
                  name: true
                }
              },
              homeTeam: {
                select: {
                  id: true,
                  name: true
                }
              },
              id: true
            }
          },
          id: true,
          number: true,
          status: true,
          _count: {
            select: {
              fixtures: true
            }
          }
        }
      },
      _count: {
        select: {
          fantasyTeams: true,
          matchdays: true
        }
      }
    }
  });

  if (!league) {
    return null;
  }

  const fixtureCount = await prisma.fantasyFixture.count({
    where: {
      matchday: {
        leagueId
      }
    }
  });

  const teamCount = league._count.fantasyTeams;
  const singleRoundMatchdayCount =
    teamCount >= 2 ? (teamCount % 2 === 0 ? teamCount - 1 : teamCount) : 0;
  const singleRoundFixtureCount =
    teamCount >= 2 ? (teamCount * (teamCount - 1)) / 2 : 0;

  return {
    existingFixtureCount: fixtureCount,
    hasExistingSchedule: league._count.matchdays > 0 || fixtureCount > 0,
    league,
    previews: {
      doubleRoundFixtureCount: singleRoundFixtureCount * 2,
      doubleRoundMatchdayCount: singleRoundMatchdayCount * 2,
      hasBye: teamCount % 2 === 1,
      singleRoundFixtureCount,
      singleRoundMatchdayCount,
      teamCount
    }
  };
}

export async function getAdminMatchdayDetailData(matchdayId: string) {
  const matchday = await prisma.matchday.findUnique({
    where: {
      id: matchdayId
    },
    select: {
      id: true,
      fixtures: {
        select: {
          id: true,
          status: true
        }
      },
      league: {
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              fantasyTeams: true
            }
          }
        }
      },
      lineupDeadlineAt: true,
      number: true,
      requiredVotes: {
        select: {
          id: true,
          status: true
        }
      },
      status: true,
      _count: {
        select: {
          fixtures: true,
          lineups: true,
          playerVotes: true,
          requiredVotes: true,
          teamScores: true
        }
      }
    }
  });

  if (!matchday) {
    return null;
  }

  const completedVotesCount = matchday.requiredVotes.filter(
    (requiredVote) => requiredVote.status !== "PENDING"
  ).length;
  const missingVotesCount = matchday.requiredVotes.length - completedVotesCount;
  const hasCalculatedFixtures = matchday.fixtures.some(
    (fixture) => fixture.status === "CALCULATED"
  );
  const hasPublishedFixtures = matchday.fixtures.some(
    (fixture) => fixture.status === "PUBLISHED"
  );
  const hasScheduledFixtures = matchday.fixtures.some(
    (fixture) => fixture.status === "SCHEDULED"
  );

  return {
    ...matchday,
    completedVotesCount,
    hasCalculatedFixtures,
    hasPublishedFixtures,
    hasScheduledFixtures,
    missingVotesCount
  };
}
