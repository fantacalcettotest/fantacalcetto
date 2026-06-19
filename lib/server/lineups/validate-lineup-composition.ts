import { PlayerRole } from "@prisma/client";

export type LineupCompositionPlayer = {
  id: string;
  role: PlayerRole;
};

export type LineupCompositionValidationResult = {
  attackerStarterCount: number;
  benchCount: number;
  defenderStarterCount: number;
  errors: string[];
  goalkeeperStarterCount: number;
  isValid: boolean;
  midfielderStarterCount: number;
  starterCount: number;
};

const REQUIRED_STARTERS = 5;
const REQUIRED_BENCH = 3;
const REQUIRED_TOTAL_PLAYERS = 8;
const REQUIRED_GOALKEEPERS = 1;
const MIN_DEFENDERS = 1;
const MAX_DEFENDERS = 2;
const MIN_ATTACKERS = 1;
const MAX_ATTACKERS = 2;

export function validateLineupComposition(
  starters: LineupCompositionPlayer[],
  bench: LineupCompositionPlayer[]
): LineupCompositionValidationResult {
  const starterCount = starters.length;
  const benchCount = bench.length;
  const goalkeeperStarterCount = starters.filter(
    (player) => player.role === PlayerRole.GOALKEEPER
  ).length;
  const defenderStarterCount = starters.filter(
    (player) => player.role === PlayerRole.DEFENDER
  ).length;
  const midfielderStarterCount = starters.filter(
    (player) => player.role === PlayerRole.MIDFIELDER
  ).length;
  const attackerStarterCount = starters.filter(
    (player) => player.role === PlayerRole.ATTACKER
  ).length;

  const errors: string[] = [];
  const uniquePlayerIds = new Set([...starters, ...bench].map((player) => player.id));

  if (starterCount !== REQUIRED_STARTERS) {
    errors.push(
      `La formazione deve avere esattamente ${REQUIRED_STARTERS} titolari. Totale attuale: ${starterCount}.`
    );
  }

  if (benchCount !== REQUIRED_BENCH) {
    errors.push(
      `La formazione deve avere esattamente ${REQUIRED_BENCH} panchinari. Totale attuale: ${benchCount}.`
    );
  }

  if (uniquePlayerIds.size !== REQUIRED_TOTAL_PLAYERS) {
    errors.push(
      `La formazione deve contenere ${REQUIRED_TOTAL_PLAYERS} giocatori unici tra titolari e panchina.`
    );
  }

  if (goalkeeperStarterCount !== REQUIRED_GOALKEEPERS) {
    errors.push("I titolari devono avere esattamente 1 portiere.");
  }

  if (defenderStarterCount < MIN_DEFENDERS) {
    errors.push(`I titolari devono avere almeno ${MIN_DEFENDERS} difensore.`);
  }

  if (defenderStarterCount > MAX_DEFENDERS) {
    errors.push(`I titolari possono avere al massimo ${MAX_DEFENDERS} difensori.`);
  }

  if (attackerStarterCount < MIN_ATTACKERS) {
    errors.push(`I titolari devono avere almeno ${MIN_ATTACKERS} attaccante.`);
  }

  if (attackerStarterCount > MAX_ATTACKERS) {
    errors.push(`I titolari possono avere al massimo ${MAX_ATTACKERS} attaccanti.`);
  }

  return {
    attackerStarterCount,
    benchCount,
    defenderStarterCount,
    errors,
    goalkeeperStarterCount,
    isValid: errors.length === 0,
    midfielderStarterCount,
    starterCount
  };
}
