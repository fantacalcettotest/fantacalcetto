import assert from "node:assert/strict";

import { SlotType, ScorePlayerFinalType } from "@prisma/client";

import { calculateFantavote } from "../lib/scoring/calculate-fantavote.ts";
import { calculateTeamScore } from "../lib/scoring/calculate-team-score.ts";
import { convertScoreToGoals } from "../lib/scoring/convert-score-to-goals.ts";

function player(playerId, slotType, positionOrder, vote) {
  return {
    lineupPlayerId: `${playerId}-lineup`,
    playerId,
    playerName: playerId,
    positionOrder,
    slotType,
    vote
  };
}

function validVote(baseVote, overrides = {}) {
  return {
    assists: 0,
    baseVote,
    cleanSheet: 0,
    goals: 0,
    isSv: false,
    ownGoals: 0,
    penaltiesMissed: 0,
    penaltiesSaved: 0,
    redCards: 0,
    yellowCards: 0,
    ...overrides
  };
}

function svVote() {
  return {
    baseVote: null,
    isSv: true
  };
}

function runChecks() {
  assert.equal(convertScoreToGoals(29.5), 0, "29.5 -> 0 goals");
  assert.equal(convertScoreToGoals(30), 1, "30 -> 1 goal");
  assert.equal(convertScoreToGoals(34.5), 1, "34.5 -> 1 goal");
  assert.equal(convertScoreToGoals(35), 2, "35 -> 2 goals");
  assert.equal(convertScoreToGoals(39.5), 2, "39.5 -> 2 goals");
  assert.equal(convertScoreToGoals(40), 3, "40 -> 3 goals");
  assert.equal(convertScoreToGoals(41.5), 3, "41.5 -> 3 goals");
  assert.equal(convertScoreToGoals(55), 6, "55 -> 6 goals");
  assert.equal(convertScoreToGoals(60), 7, "60 -> 7 goals");

  const fantavote = calculateFantavote(
    validVote(6, {
      assists: 1,
      cleanSheet: 1,
      goals: 1,
      penaltiesMissed: 1,
      yellowCards: 1
    })
  );
  assert.equal(fantavote.finalFantavote, 7.5, "Fantavote with bonus and malus");

  const allStartersValid = calculateTeamScore({
    lineupPlayers: [
      player("s1", SlotType.STARTER, 1, validVote(6)),
      player("s2", SlotType.STARTER, 2, validVote(6.5)),
      player("s3", SlotType.STARTER, 3, validVote(7)),
      player("s4", SlotType.STARTER, 4, validVote(5.5)),
      player("s5", SlotType.STARTER, 5, validVote(6)),
      player("b1", SlotType.BENCH, 1, validVote(7.5)),
      player("b2", SlotType.BENCH, 2, validVote(6)),
      player("b3", SlotType.BENCH, 3, validVote(5))
    ]
  });
  assert.equal(allStartersValid.totalScore, 31);
  assert.equal(allStartersValid.substitutionsCount, 0);

  const oneStarterReplaced = calculateTeamScore({
    lineupPlayers: [
      player("s1", SlotType.STARTER, 1, validVote(6)),
      player("s2", SlotType.STARTER, 2, svVote()),
      player("s3", SlotType.STARTER, 3, validVote(7)),
      player("s4", SlotType.STARTER, 4, validVote(5.5)),
      player("s5", SlotType.STARTER, 5, validVote(6)),
      player("b1", SlotType.BENCH, 1, validVote(7.5)),
      player("b2", SlotType.BENCH, 2, validVote(6)),
      player("b3", SlotType.BENCH, 3, validVote(5))
    ]
  });
  assert.equal(oneStarterReplaced.totalScore, 32);
  assert.equal(oneStarterReplaced.substitutionsCount, 1);
  assert.equal(
    oneStarterReplaced.detailLines.some(
      (line) => line.finalType === ScorePlayerFinalType.AUTO_SUB_IN
    ),
    true
  );

  const skipSvBench = calculateTeamScore({
    lineupPlayers: [
      player("s1", SlotType.STARTER, 1, svVote()),
      player("s2", SlotType.STARTER, 2, validVote(6)),
      player("s3", SlotType.STARTER, 3, svVote()),
      player("s4", SlotType.STARTER, 4, validVote(6)),
      player("s5", SlotType.STARTER, 5, validVote(6)),
      player("b1", SlotType.BENCH, 1, svVote()),
      player("b2", SlotType.BENCH, 2, validVote(7)),
      player("b3", SlotType.BENCH, 3, validVote(6.5))
    ]
  });
  assert.equal(skipSvBench.totalScore, 31.5);
  assert.equal(skipSvBench.substitutionsCount, 2);

  const noValidBench = calculateTeamScore({
    lineupPlayers: [
      player("s1", SlotType.STARTER, 1, svVote()),
      player("s2", SlotType.STARTER, 2, validVote(6)),
      player("s3", SlotType.STARTER, 3, validVote(6)),
      player("s4", SlotType.STARTER, 4, validVote(6)),
      player("s5", SlotType.STARTER, 5, validVote(6)),
      player("b1", SlotType.BENCH, 1, svVote()),
      player("b2", SlotType.BENCH, 2, { baseVote: null, isSv: false }),
      player("b3", SlotType.BENCH, 3, svVote())
    ]
  });
  assert.equal(noValidBench.totalScore, 24);
  assert.equal(noValidBench.substitutionsCount, 0);
  assert.equal(
    noValidBench.detailLines.some(
      (line) => line.finalType === ScorePlayerFinalType.SV_NOT_REPLACED
    ),
    true
  );

  const maxThreeSubstitutions = calculateTeamScore({
    lineupPlayers: [
      player("s1", SlotType.STARTER, 1, svVote()),
      player("s2", SlotType.STARTER, 2, svVote()),
      player("s3", SlotType.STARTER, 3, svVote()),
      player("s4", SlotType.STARTER, 4, svVote()),
      player("s5", SlotType.STARTER, 5, validVote(6)),
      player("b1", SlotType.BENCH, 1, validVote(7)),
      player("b2", SlotType.BENCH, 2, validVote(6.5)),
      player("b3", SlotType.BENCH, 3, validVote(6)),
      player("b4", SlotType.BENCH, 4, validVote(9))
    ],
    maxSubstitutions: 3
  });
  assert.equal(maxThreeSubstitutions.substitutionsCount, 3);
  assert.equal(maxThreeSubstitutions.totalScore, 25.5);
  assert.equal(
    maxThreeSubstitutions.detailLines.filter(
      (line) => line.finalType === ScorePlayerFinalType.SV_NOT_REPLACED
    ).length,
    1
  );

  const benchCannotBeUsedTwice = calculateTeamScore({
    lineupPlayers: [
      player("s1", SlotType.STARTER, 1, svVote()),
      player("s2", SlotType.STARTER, 2, svVote()),
      player("s3", SlotType.STARTER, 3, validVote(6)),
      player("s4", SlotType.STARTER, 4, validVote(6)),
      player("s5", SlotType.STARTER, 5, validVote(6)),
      player("b1", SlotType.BENCH, 1, validVote(7)),
      player("b2", SlotType.BENCH, 2, svVote()),
      player("b3", SlotType.BENCH, 3, svVote())
    ]
  });
  assert.deepEqual(benchCannotBeUsedTwice.usedBenchPlayerIds, ["b1"]);
  assert.equal(benchCannotBeUsedTwice.substitutionsCount, 1);
  assert.equal(benchCannotBeUsedTwice.totalScore, 25);

  console.log("Manual scoring checks passed.");
}

runChecks();
