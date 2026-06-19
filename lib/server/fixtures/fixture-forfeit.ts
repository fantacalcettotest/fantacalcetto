export type FixtureForfeitOutcome =
  | "DOUBLE_FORFEIT"
  | "HOME_WIN_BY_FORFEIT"
  | "NONE"
  | "AWAY_WIN_BY_FORFEIT";

export function getFixtureForfeitOutcome(input: {
  awayTeamScoreId: string | null;
  homeTeamScoreId: string | null;
}): FixtureForfeitOutcome {
  const hasHomeScore = input.homeTeamScoreId !== null;
  const hasAwayScore = input.awayTeamScoreId !== null;

  if (hasHomeScore && hasAwayScore) {
    return "NONE";
  }

  if (hasHomeScore && !hasAwayScore) {
    return "HOME_WIN_BY_FORFEIT";
  }

  if (!hasHomeScore && hasAwayScore) {
    return "AWAY_WIN_BY_FORFEIT";
  }

  return "DOUBLE_FORFEIT";
}

export function getFixtureAdminNote(outcome: FixtureForfeitOutcome) {
  switch (outcome) {
    case "HOME_WIN_BY_FORFEIT":
      return "Vittoria a tavolino: formazione non inserita dalla squadra ospite.";
    case "AWAY_WIN_BY_FORFEIT":
      return "Vittoria a tavolino: formazione non inserita dalla squadra di casa.";
    case "DOUBLE_FORFEIT":
      return "Formazione non inserita da entrambe le squadre.";
    default:
      return null;
  }
}
