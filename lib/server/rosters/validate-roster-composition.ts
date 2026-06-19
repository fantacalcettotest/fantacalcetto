import { PlayerRole } from "@prisma/client";

export type RosterCompositionPlayer = {
  isBlockedInLeague?: boolean;
  isGloballyInactive?: boolean;
  role: PlayerRole;
};

export type RosterCompositionValidationResult = {
  attackerCount: number;
  blockedCount: number;
  defenderCount: number;
  errors: string[];
  goalkeeperCount: number;
  isComplete: boolean;
  isValid: boolean;
  midfielderCount: number;
  total: number;
};

const REQUIRED_ROSTER_SIZE = 8;
const MIN_GOALKEEPERS = 1;
const MIN_DEFENDERS = 2;
const MIN_ATTACKERS = 2;

export function validateRosterComposition(
  players: RosterCompositionPlayer[]
): RosterCompositionValidationResult {
  const total = players.length;
  const goalkeeperCount = players.filter(
    (player) => player.role === PlayerRole.GOALKEEPER
  ).length;
  const defenderCount = players.filter(
    (player) => player.role === PlayerRole.DEFENDER
  ).length;
  const midfielderCount = players.filter(
    (player) => player.role === PlayerRole.MIDFIELDER
  ).length;
  const attackerCount = players.filter(
    (player) => player.role === PlayerRole.ATTACKER
  ).length;
  const blockedCount = players.filter((player) => player.isBlockedInLeague).length;
  const globallyInactiveCount = players.filter(
    (player) => player.isGloballyInactive
  ).length;
  const unavailableCount = blockedCount + globallyInactiveCount;

  const errors: string[] = [];
  const isComplete = total === REQUIRED_ROSTER_SIZE;

  if (!isComplete) {
    errors.push(
      `La rosa deve avere esattamente ${REQUIRED_ROSTER_SIZE} giocatori. Totale attuale: ${total}.`
    );
  }

  if (goalkeeperCount < MIN_GOALKEEPERS) {
    errors.push(`La rosa deve avere almeno ${MIN_GOALKEEPERS} portiere.`);
  }

  if (defenderCount < MIN_DEFENDERS) {
    errors.push(`La rosa deve avere almeno ${MIN_DEFENDERS} difensori.`);
  }

  if (attackerCount < MIN_ATTACKERS) {
    errors.push(`La rosa deve avere almeno ${MIN_ATTACKERS} attaccanti.`);
  }

  if (unavailableCount > 0) {
    errors.push("La rosa contiene giocatori non disponibili.");
  }

  return {
    attackerCount,
    blockedCount,
    defenderCount,
    errors,
    goalkeeperCount,
    isComplete,
    isValid: isComplete && errors.length === 0,
    midfielderCount,
    total
  };
}
