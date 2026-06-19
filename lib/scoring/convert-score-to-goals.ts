export function convertScoreToGoals(score: number): number {
  if (!Number.isFinite(score)) {
    throw new Error("score must be a finite number.");
  }

  if (score < 30) {
    return 0;
  }

  return Math.floor((score - 30) / 5) + 1;
}
