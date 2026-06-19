import {
  LineupStatus,
  MatchdayStatus,
  PrismaClient,
  SlotType
} from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_LEAGUE_NAME = "Lega Fantacalcetto Demo";
const STARTERS_COUNT = 5;
const BENCH_COUNT = 3;
const REQUIRED_ROSTER_SIZE = STARTERS_COUNT + BENCH_COUNT;

type TeamWithRoster = {
  id: string;
  name: string;
  roster: Array<{
    id: string;
    playerId: string;
  }>;
};

function buildDeadline() {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 3);
  deadline.setHours(20, 30, 0, 0);
  return deadline;
}

function assertRosterSize(team: TeamWithRoster) {
  if (team.roster.length < REQUIRED_ROSTER_SIZE) {
    throw new Error(
      `La fantasy team ${team.name} ha solo ${team.roster.length} giocatori in rosa. Ne servono almeno ${REQUIRED_ROSTER_SIZE}.`
    );
  }
}

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const league = await tx.league.findFirst({
      where: {
        name: DEMO_LEAGUE_NAME
      },
      select: {
        id: true,
        name: true,
        fantasyTeams: {
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            name: true,
            roster: {
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
              select: {
                id: true,
                playerId: true
              }
            }
          }
        }
      }
    });

    if (!league) {
      throw new Error(
        `Lega demo "${DEMO_LEAGUE_NAME}" non trovata. Esegui prima il seed demo.`
      );
    }

    if (league.fantasyTeams.length === 0) {
      throw new Error("La lega demo non ha fantasy team.");
    }

    for (const team of league.fantasyTeams) {
      assertRosterSize(team);
    }

    const latestMatchday = await tx.matchday.findFirst({
      where: {
        leagueId: league.id
      },
      orderBy: [{ number: "desc" }],
      select: {
        number: true
      }
    });

    const nextMatchdayNumber = (latestMatchday?.number ?? 0) + 1;
    const lineupDeadlineAt = buildDeadline();

    const matchday = await tx.matchday.create({
      data: {
        leagueId: league.id,
        lineupDeadlineAt,
        number: nextMatchdayNumber,
        status: MatchdayStatus.LINEUPS_LOCKED
      },
      select: {
        id: true,
        number: true
      }
    });

    let lineupsCreated = 0;

    for (const team of league.fantasyTeams) {
      const lineup = await tx.lineup.create({
        data: {
          fantasyTeamId: team.id,
          matchdayId: matchday.id,
          status: LineupStatus.LOCKED,
          submittedAt: new Date()
        },
        select: {
          id: true
        }
      });

      const starters = team.roster.slice(0, STARTERS_COUNT);
      const bench = team.roster.slice(STARTERS_COUNT, REQUIRED_ROSTER_SIZE);

      await tx.lineupPlayer.createMany({
        data: [
          ...starters.map((rosterPlayer, index) => ({
            lineupId: lineup.id,
            playerId: rosterPlayer.playerId,
            positionOrder: index + 1,
            slotType: SlotType.STARTER
          })),
          ...bench.map((rosterPlayer, index) => ({
            lineupId: lineup.id,
            playerId: rosterPlayer.playerId,
            positionOrder: index + 1,
            slotType: SlotType.BENCH
          }))
        ]
      });

      lineupsCreated += 1;
    }

    return {
      adminPath: `/admin/matchdays/${matchday.id}/votes`,
      leagueName: league.name,
      lineupsCreated,
      matchdayId: matchday.id,
      matchdayNumber: matchday.number
    };
  });

  console.log("Nuova giornata demo creata.");
  console.log(`Lega: ${result.leagueName}`);
  console.log(`Matchday ID: ${result.matchdayId}`);
  console.log(`Numero giornata: ${result.matchdayNumber}`);
  console.log(`Lineup create: ${result.lineupsCreated}`);
  console.log(`Admin votes: ${result.adminPath}`);
}

main()
  .catch((error) => {
    console.error("Creazione giornata demo fallita:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
