export type RoundRobinMode = "SINGLE_ROUND" | "DOUBLE_ROUND";

export type RoundRobinFixture = {
  awayTeamId: string;
  homeTeamId: string;
};

export type RoundRobinRound = {
  byeTeamId?: string;
  fixtures: RoundRobinFixture[];
  roundNumber: number;
};

const BYE_TEAM_ID = "__ROUND_ROBIN_BYE__";

function assertValidTeamIds(teamIds: string[]) {
  if (teamIds.length < 2) {
    throw new Error("Sono necessarie almeno 2 squadre per generare il calendario.");
  }

  if (teamIds.some((teamId) => teamId.trim().length === 0)) {
    throw new Error("Tutti i teamIds devono essere stringhe non vuote.");
  }

  if (new Set(teamIds).size !== teamIds.length) {
    throw new Error("I teamIds devono essere univoci.");
  }
}

function buildSingleRound(participants: string[]) {
  const rounds: RoundRobinRound[] = [];
  const rotation = [...participants];
  const roundsCount = rotation.length - 1;
  const halfSize = rotation.length / 2;

  for (let roundIndex = 0; roundIndex < roundsCount; roundIndex += 1) {
    const fixtures: RoundRobinFixture[] = [];
    let byeTeamId: string | undefined;

    for (let pairIndex = 0; pairIndex < halfSize; pairIndex += 1) {
      const leftTeamId = rotation[pairIndex];
      const rightTeamId = rotation[rotation.length - 1 - pairIndex];

      if (leftTeamId === BYE_TEAM_ID || rightTeamId === BYE_TEAM_ID) {
        byeTeamId = leftTeamId === BYE_TEAM_ID ? rightTeamId : leftTeamId;
        continue;
      }

      const shouldSwapHomeAway =
        pairIndex === 0 ? roundIndex % 2 === 1 : roundIndex % 2 === 0;

      fixtures.push(
        shouldSwapHomeAway
          ? {
              awayTeamId: leftTeamId,
              homeTeamId: rightTeamId
            }
          : {
              awayTeamId: rightTeamId,
              homeTeamId: leftTeamId
            }
      );
    }

    rounds.push({
      ...(byeTeamId ? { byeTeamId } : {}),
      fixtures,
      roundNumber: roundIndex + 1
    });

    const fixedTeam = rotation[0];
    const rotatingTeams = rotation.slice(1);
    rotatingTeams.unshift(rotatingTeams.pop() as string);
    rotation.splice(0, rotation.length, fixedTeam, ...rotatingTeams);
  }

  return rounds;
}

export function generateRoundRobinSchedule(input: {
  mode: RoundRobinMode;
  teamIds: string[];
}): RoundRobinRound[] {
  assertValidTeamIds(input.teamIds);

  const participants =
    input.teamIds.length % 2 === 0
      ? [...input.teamIds]
      : [...input.teamIds, BYE_TEAM_ID];

  const firstLegRounds = buildSingleRound(participants);

  if (input.mode === "SINGLE_ROUND") {
    return firstLegRounds;
  }

  return [
    ...firstLegRounds,
    ...firstLegRounds.map((round, index) => ({
      ...(round.byeTeamId ? { byeTeamId: round.byeTeamId } : {}),
      fixtures: round.fixtures.map((fixture) => ({
        awayTeamId: fixture.homeTeamId,
        homeTeamId: fixture.awayTeamId
      })),
      roundNumber: firstLegRounds.length + index + 1
    }))
  ];
}
