import { MatchdayStatus } from "@prisma/client";

import { prisma } from "../lib/prisma.ts";
import { calculateFantasyFixtureResults } from "../lib/server/fixtures/calculate-fantasy-fixture-results.ts";
import { generateFantasyFixtures } from "../lib/server/fixtures/generate-fantasy-fixtures.ts";
import { calculateLeagueStandings } from "../lib/server/standings/calculate-league-standings.ts";
import { publishMatchday } from "../lib/server/matchdays/publish-matchday.ts";

const DEMO_LEAGUE_NAME = "Lega Fantacalcetto Demo";

async function main() {
  const matchday = await prisma.matchday.findFirst({
    where: {
      league: {
        name: DEMO_LEAGUE_NAME
      },
      number: 1
    },
    include: {
      league: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!matchday) {
    throw new Error("Demo matchday not found. Run the seed first.");
  }

  const fixtures = await generateFantasyFixtures(matchday.id);
  console.log("Generated fixtures:", fixtures);

  const teamScoresCount = await prisma.teamScore.count({
    where: {
      matchdayId: matchday.id
    }
  });

  if (teamScoresCount === 0) {
    throw new Error(
      "No TeamScore found for the demo matchday. Run `npm run scores:check` first."
    );
  }

  const fixtureResults = await calculateFantasyFixtureResults(matchday.id);
  console.log("Calculated fixture results:", fixtureResults);

  const refreshedMatchday = await prisma.matchday.findUnique({
    where: {
      id: matchday.id
    },
    select: {
      status: true
    }
  });

  if (!refreshedMatchday) {
    throw new Error(`Matchday ${matchday.id} not found after fixture calculation.`);
  }

  if (
    refreshedMatchday.status === MatchdayStatus.SCORES_CALCULATED ||
    refreshedMatchday.status === MatchdayStatus.PUBLISHED
  ) {
    const published = await publishMatchday(matchday.id);
    console.log("Published matchday and fixtures:", published);
    console.log(`Fixtures published in this run: ${published.publishedFixturesCount}`);
  } else {
    console.log(
      `Matchday is in status ${refreshedMatchday.status}. Publication skipped.`
    );
  }

  const standings = await calculateLeagueStandings(matchday.league.id);
  console.log("League standings:");
  console.table(
    standings.standings.map((row) => ({
      bestFantasyScore: row.bestFantasyScore,
      draws: row.draws,
      fantasyPointsTotal: row.fantasyPointsTotal,
      goalDifference: row.goalDifference,
      goalsAgainst: row.goalsAgainst,
      goalsFor: row.goalsFor,
      leaguePoints: row.leaguePoints,
      losses: row.losses,
      played: row.played,
      team: row.teamName,
      wins: row.wins
    }))
  );
}

main()
  .catch((error) => {
    console.error("Manual fixtures check failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
