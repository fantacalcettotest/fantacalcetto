import { PlayerRole } from "@prisma/client";

export const PLAYER_ROLE_FILTERS = [
  "ALL",
  "GOALKEEPER",
  "DEFENDER",
  "MIDFIELDER",
  "ATTACKER"
] as const;

export type PlayerRoleFilter = (typeof PLAYER_ROLE_FILTERS)[number];

export function parsePlayerRoleFilter(
  value: string | null | undefined
): PlayerRoleFilter {
  if (
    typeof value === "string" &&
    PLAYER_ROLE_FILTERS.includes(value as PlayerRoleFilter)
  ) {
    return value as PlayerRoleFilter;
  }

  return "ALL";
}

export function getPlayerRoleLabel(role: PlayerRole): string {
  switch (role) {
    case PlayerRole.GOALKEEPER:
      return "Portiere";
    case PlayerRole.DEFENDER:
      return "Difensore";
    case PlayerRole.MIDFIELDER:
      return "Centrocampista";
    case PlayerRole.ATTACKER:
      return "Attaccante";
    default:
      return role;
  }
}

export function getPlayerRoleFilterLabel(role: PlayerRoleFilter): string {
  if (role === "ALL") {
    return "Tutti";
  }

  return getPlayerRoleLabel(role);
}
