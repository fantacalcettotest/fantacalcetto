import {
  generateRoundRobinSchedule,
  type RoundRobinFixture,
  type RoundRobinMode,
  type RoundRobinRound
} from "../lib/server/schedules/generate-round-robin-schedule.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createTeamIds(count: number) {
  return Array.from({ length: count }, (_, index) => `team-${index + 1}`);
}

function getUnorderedPairKey(homeTeamId: string, awayTeamId: string) {
  return [homeTeamId, awayTeamId].sort().join("::");
}

function getOrderedPairKey(homeTeamId: string, awayTeamId: string) {
  return `${homeTeamId}::${awayTeamId}`;
}

function flattenFixtures(rounds: RoundRobinRound[]) {
  return rounds.flatMap((round) => round.fixtures);
}

function assertNoInvalidFixtures(rounds: RoundRobinRound[]) {
  for (const round of rounds) {
    for (const fixture of round.fixtures) {
      assert(
        fixture.homeTeamId !== fixture.awayTeamId,
        `Fixture non valida nel round ${round.roundNumber}: stessa squadra in casa e trasferta.`
      );
      assert(
        !fixture.homeTeamId.includes("BYE") && !fixture.awayTeamId.includes("BYE"),
        `Fixture non valida nel round ${round.roundNumber}: BYE non deve comparire nelle partite.`
      );
    }
  }
}

function assertSingleRoundRules(teamIds: string[], rounds: RoundRobinRound[]) {
  const allFixtures = flattenFixtures(rounds);
  const expectedFixturesCount = (teamIds.length * (teamIds.length - 1)) / 2;
  const pairKeys = allFixtures.map((fixture) =>
    getUnorderedPairKey(fixture.homeTeamId, fixture.awayTeamId)
  );

  assert(
    allFixtures.length === expectedFixturesCount,
    `Single round: attese ${expectedFixturesCount} partite, trovate ${allFixtures.length}.`
  );
  assert(
    new Set(pairKeys).size === pairKeys.length,
    "Single round: trovate coppie duplicate."
  );
}

function assertDoubleRoundRules(teamIds: string[], rounds: RoundRobinRound[]) {
  const firstLegRounds = rounds.slice(0, rounds.length / 2);
  const secondLegRounds = rounds.slice(rounds.length / 2);
  const allFixtures = flattenFixtures(rounds);
  const expectedFixturesCount = teamIds.length * (teamIds.length - 1);
  const unorderedPairCounts = new Map<string, number>();

  for (const fixture of allFixtures) {
    const pairKey = getUnorderedPairKey(fixture.homeTeamId, fixture.awayTeamId);
    unorderedPairCounts.set(pairKey, (unorderedPairCounts.get(pairKey) ?? 0) + 1);
  }

  assert(
    allFixtures.length === expectedFixturesCount,
    `Double round: attese ${expectedFixturesCount} partite, trovate ${allFixtures.length}.`
  );

  for (const pairCount of unorderedPairCounts.values()) {
    assert(pairCount === 2, "Double round: ogni coppia deve comparire esattamente due volte.");
  }

  for (let index = 0; index < firstLegRounds.length; index += 1) {
    const firstLegRound = firstLegRounds[index];
    const secondLegRound = secondLegRounds[index];

    assert(
      firstLegRound.fixtures.length === secondLegRound.fixtures.length,
      `Double round: il round di ritorno ${secondLegRound.roundNumber} non corrisponde al round ${firstLegRound.roundNumber}.`
    );

    const mirroredFixtures = new Set(
      secondLegRound.fixtures.map((fixture) =>
        getOrderedPairKey(fixture.homeTeamId, fixture.awayTeamId)
      )
    );

    for (const fixture of firstLegRound.fixtures) {
      const returnFixtureKey = getOrderedPairKey(
        fixture.awayTeamId,
        fixture.homeTeamId
      );

      assert(
        mirroredFixtures.has(returnFixtureKey),
        `Double round: manca il ritorno invertito per ${fixture.homeTeamId} vs ${fixture.awayTeamId}.`
      );
    }

    assert(
      firstLegRound.byeTeamId === secondLegRound.byeTeamId,
      `Double round: il turno di riposo del round ${firstLegRound.roundNumber} deve essere mantenuto nel ritorno.`
    );
  }
}

function assertByeDistribution(
  teamIds: string[],
  mode: RoundRobinMode,
  rounds: RoundRobinRound[]
) {
  if (teamIds.length % 2 === 0) {
    assert(
      rounds.every((round) => round.byeTeamId === undefined),
      "Con numero pari di squadre non deve esserci nessun bye."
    );
    return;
  }

  const byeCounts = new Map<string, number>();
  for (const round of rounds) {
    assert(round.byeTeamId, `Round ${round.roundNumber}: byeTeamId mancante.`);
    byeCounts.set(round.byeTeamId as string, (byeCounts.get(round.byeTeamId as string) ?? 0) + 1);
  }

  const expectedByeCountPerTeam = mode === "DOUBLE_ROUND" ? 2 : 1;
  for (const teamId of teamIds) {
    assert(
      byeCounts.get(teamId) === expectedByeCountPerTeam,
      `${teamId}: bye attesi ${expectedByeCountPerTeam}, trovati ${byeCounts.get(teamId) ?? 0}.`
    );
  }
}

function assertRoundCount(teamIds: string[], mode: RoundRobinMode, rounds: RoundRobinRound[]) {
  const singleRoundCount =
    teamIds.length % 2 === 0 ? teamIds.length - 1 : teamIds.length;
  const expectedRounds = mode === "DOUBLE_ROUND" ? singleRoundCount * 2 : singleRoundCount;

  assert(
    rounds.length === expectedRounds,
    `Numero round non valido: attesi ${expectedRounds}, trovati ${rounds.length}.`
  );
}

function assertSchedule(teamIds: string[], mode: RoundRobinMode) {
  const rounds = generateRoundRobinSchedule({
    mode,
    teamIds
  });

  assertRoundCount(teamIds, mode, rounds);
  assertNoInvalidFixtures(rounds);
  assertByeDistribution(teamIds, mode, rounds);

  if (mode === "SINGLE_ROUND") {
    assertSingleRoundRules(teamIds, rounds);
  } else {
    assertDoubleRoundRules(teamIds, rounds);
  }

  return rounds;
}

function logScenarioResult(teamCount: number, mode: RoundRobinMode, rounds: RoundRobinRound[]) {
  const fixturesCount = flattenFixtures(rounds).length;
  console.log(
    `${teamCount} squadre | ${mode} | giornate: ${rounds.length} | partite: ${fixturesCount}`
  );
}

function main() {
  const scenarios: Array<{ mode: RoundRobinMode; teamCount: number }> = [
    { mode: "SINGLE_ROUND", teamCount: 2 },
    { mode: "DOUBLE_ROUND", teamCount: 2 },
    { mode: "SINGLE_ROUND", teamCount: 3 },
    { mode: "DOUBLE_ROUND", teamCount: 3 },
    { mode: "SINGLE_ROUND", teamCount: 4 },
    { mode: "DOUBLE_ROUND", teamCount: 4 },
    { mode: "SINGLE_ROUND", teamCount: 5 },
    { mode: "DOUBLE_ROUND", teamCount: 5 },
    { mode: "SINGLE_ROUND", teamCount: 12 },
    { mode: "DOUBLE_ROUND", teamCount: 12 }
  ];

  for (const scenario of scenarios) {
    const rounds = assertSchedule(createTeamIds(scenario.teamCount), scenario.mode);
    logScenarioResult(scenario.teamCount, scenario.mode, rounds);
  }

  const twelveTeamsSingle = generateRoundRobinSchedule({
    mode: "SINGLE_ROUND",
    teamIds: createTeamIds(12)
  });
  const twelveTeamsDouble = generateRoundRobinSchedule({
    mode: "DOUBLE_ROUND",
    teamIds: createTeamIds(12)
  });

  assert(twelveTeamsSingle.length === 11, "12 squadre single: attese 11 giornate.");
  assert(
    flattenFixtures(twelveTeamsSingle).length === 66,
    "12 squadre single: attese 66 partite."
  );
  assert(twelveTeamsDouble.length === 22, "12 squadre double: attese 22 giornate.");
  assert(
    flattenFixtures(twelveTeamsDouble).length === 132,
    "12 squadre double: attese 132 partite."
  );

  console.log("Manual schedule checks passed.");
}

main();
