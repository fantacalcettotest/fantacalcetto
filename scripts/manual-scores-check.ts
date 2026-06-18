import { MatchdayStatus } from "@prisma/client";

import { prisma } from "../lib/prisma.ts";
import { checkVotesCompletion } from "../lib/server/matchdays/check-votes-completion.ts";
import { generateRequiredVotePlayers } from "../lib/server/matchdays/generate-required-vote-players.ts";
import { publishMatchday } from "../lib/server/matchdays/publish-matchday.ts";
import { calculateMatchdayScores } from "../lib/server/scores/calculate-matchday-scores.ts";
import { savePlayerVote } from "../lib/server/votes/save-player-vote.ts";

const DEMO_LEAGUE_NAME = "Lega Fantacalcetto Demo";

function buildDemoVote(index: number) {
  if (index % 7 === 0) {
    return {
      assists: 0,
      baseVote: null,
      cleanSheet: 0,
      goals: 0,
      isSv: true,
      ownGoals: 0,
      penaltiesMissed: 0,
      penaltiesSaved: 0,
      redCards: 0,
      yellowCards: 0
    };
  }

  return {
    assists: index % 4 === 0 ? 1 : 0,
    baseVote: 6 + (index % 3) * 0.5,
    cleanSheet: index % 5 === 0 ? 1 : 0,
    goals: index % 6 === 0 ? 1 : 0,
    isSv: false,
    ownGoals: 0,
    penaltiesMissed: 0,
    penaltiesSaved: index % 8 === 0 ? 1 : 0,
    redCards: index % 11 === 0 ? 1 : 0,
    yellowCards: index % 3 === 0 ? 1 : 0
  };
}

async function main() {
  const matchday = await prisma.matchday.findFirst({
    where: {
      league: {
        name: DEMO_LEAGUE_NAME
      },
      number: 1
    },
    select: {
      id: true,
      status: true
    }
  });

  if (!matchday) {
    throw new Error("Demo matchday not found. Run the seed first.");
  }

  if (matchday.status === MatchdayStatus.PUBLISHED) {
    const existingScores = await prisma.teamScore.findMany({
      where: {
        matchdayId: matchday.id
      },
      select: {
        fantasyTeamId: true,
        totalScore: true
      }
    });

    console.log("Demo matchday already published.");
    console.log(
      existingScores.map((score) => ({
        fantasyTeamId: score.fantasyTeamId,
        totalScore: score.totalScore?.toNumber() ?? null
      }))
    );
    return;
  }

  const generated = await generateRequiredVotePlayers(matchday.id);
  console.log("Generated required vote players:", generated);

  const requiredVotePlayers = await prisma.requiredVotePlayer.findMany({
    where: {
      matchdayId: matchday.id
    },
    orderBy: [{ usageCount: "desc" }, { playerId: "asc" }]
  });

  for (const [index, requiredVotePlayer] of requiredVotePlayers.entries()) {
    if (index >= 3) {
      break;
    }

    await savePlayerVote({
      matchdayId: matchday.id,
      playerId: requiredVotePlayer.playerId,
      ...buildDemoVote(index)
    });
  }

  const partialCompletion = await checkVotesCompletion(matchday.id);
  console.log("Partial completion:", partialCompletion);

  for (const [index, requiredVotePlayer] of requiredVotePlayers.entries()) {
    await savePlayerVote({
      matchdayId: matchday.id,
      playerId: requiredVotePlayer.playerId,
      ...buildDemoVote(index)
    });
  }

  const completion = await checkVotesCompletion(matchday.id);
  console.log("Completion:", completion);

  const scores = await calculateMatchdayScores(matchday.id);
  console.log("Calculated scores:", scores);

  const published = await publishMatchday(matchday.id);
  console.log("Published matchday:", published);

  const scoreSummary = await prisma.teamScore.findMany({
    where: {
      matchdayId: matchday.id
    },
    select: {
      fantasyTeamId: true,
      totalScore: true,
      autoSubsUsed: true,
      status: true
    },
    orderBy: {
      totalScore: "desc"
    }
  });

  console.log(
    "Final team scores:",
    scoreSummary.map((score) => ({
      autoSubsUsed: score.autoSubsUsed,
      fantasyTeamId: score.fantasyTeamId,
      status: score.status,
      totalScore: score.totalScore?.toNumber() ?? null
    }))
  );
}

main()
  .catch((error) => {
    console.error("Manual scores check failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
