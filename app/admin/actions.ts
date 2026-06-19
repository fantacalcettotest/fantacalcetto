"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { calculateFantasyFixtureResults } from "@/lib/server/fixtures/calculate-fantasy-fixture-results.ts";
import { generateFantasyFixtures } from "@/lib/server/fixtures/generate-fantasy-fixtures.ts";
import { checkVotesCompletion } from "@/lib/server/matchdays/check-votes-completion.ts";
import { generateRequiredVotePlayers } from "@/lib/server/matchdays/generate-required-vote-players.ts";
import { publishMatchday } from "@/lib/server/matchdays/publish-matchday.ts";
import { calculateMatchdayScores } from "@/lib/server/scores/calculate-matchday-scores.ts";
import { savePlayerVote } from "@/lib/server/votes/save-player-vote.ts";

function redirectWithMessage(
  redirectPath: string,
  options: { error?: string; notice?: string }
): never {
  const url = new URL(`http://localhost${redirectPath}`);

  if (options.notice) {
    url.searchParams.set("notice", options.notice);
  }

  if (options.error) {
    url.searchParams.set("error", options.error);
  }

  redirect(`${url.pathname}${url.search}`);
}

function revalidateAdminPaths(matchdayId: string, leagueId?: string | null) {
  revalidatePath("/admin");
  revalidatePath(`/admin/matchdays/${matchdayId}/votes`);
  revalidatePath(`/admin/matchdays/${matchdayId}/scores`);
  if (leagueId) {
    revalidatePath(`/admin/leagues/${leagueId}/standings`);
  }
}

function readRequiredString(
  formData: FormData,
  fieldName: string
): string {
  const value = formData.get(fieldName);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required field: ${fieldName}.`);
  }

  return value;
}

function readOptionalNumber(
  formData: FormData,
  fieldName: string
): number | null {
  const value = formData.get(fieldName);
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${fieldName}.`);
  }

  return parsed;
}

function readCounter(formData: FormData, fieldName: string): number {
  return readOptionalNumber(formData, fieldName) ?? 0;
}

function readOptionalString(formData: FormData, fieldName: string): string | null {
  const value = formData.get(fieldName);
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return value;
}

export async function generateRequiredVotePlayersAction(formData: FormData) {
  const matchdayId = readRequiredString(formData, "matchdayId");
  const leagueId = readOptionalString(formData, "leagueId");
  const redirectPath = readRequiredString(formData, "redirectPath");
  let notice: string | undefined;
  let errorMessage: string | undefined;

  try {
    const result = await generateRequiredVotePlayers(matchdayId);
    await checkVotesCompletion(matchdayId);
    revalidateAdminPaths(matchdayId, leagueId);
    notice = `Giocatori utili aggiornati: ${result.totalRequired}.`;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Operazione non riuscita.";
  }

  redirectWithMessage(redirectPath, { error: errorMessage, notice });
}

export async function savePlayerVoteAction(formData: FormData) {
  const matchdayId = readRequiredString(formData, "matchdayId");
  const playerId = readRequiredString(formData, "playerId");
  const leagueId = readOptionalString(formData, "leagueId");
  const redirectPath = readRequiredString(formData, "redirectPath");
  const isSv = formData.get("isSv") === "on";
  const baseVote = isSv ? null : readOptionalNumber(formData, "baseVote");
  let notice: string | undefined;
  let errorMessage: string | undefined;

  try {
    const result = await savePlayerVote({
      assists: readCounter(formData, "assists"),
      baseVote,
      cleanSheet: readCounter(formData, "cleanSheet"),
      goals: readCounter(formData, "goals"),
      isSv,
      matchdayId,
      notes:
        typeof formData.get("notes") === "string"
          ? String(formData.get("notes"))
          : null,
      ownGoals: readCounter(formData, "ownGoals"),
      penaltiesMissed: readCounter(formData, "penaltiesMissed"),
      penaltiesSaved: readCounter(formData, "penaltiesSaved"),
      playerId,
      redCards: readCounter(formData, "redCards"),
      yellowCards: readCounter(formData, "yellowCards")
    });

    await checkVotesCompletion(matchdayId);
    revalidateAdminPaths(matchdayId, leagueId);
    notice = `Voto salvato per ${result.playerId}.`;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Salvataggio non riuscito.";
  }

  redirectWithMessage(redirectPath, { error: errorMessage, notice });
}

export async function calculateMatchdayScoresAction(formData: FormData) {
  const matchdayId = readRequiredString(formData, "matchdayId");
  const leagueId = readOptionalString(formData, "leagueId");
  const redirectPath = readRequiredString(formData, "redirectPath");
  let notice: string | undefined;
  let errorMessage: string | undefined;

  try {
    const result = await calculateMatchdayScores(matchdayId);
    revalidateAdminPaths(matchdayId, leagueId);
    notice = `Punteggi calcolati per ${result.teamsScored.length} squadre.`;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Calcolo punteggi non riuscito.";
  }

  redirectWithMessage(redirectPath, { error: errorMessage, notice });
}

export async function publishMatchdayAction(formData: FormData) {
  const matchdayId = readRequiredString(formData, "matchdayId");
  const leagueId = readOptionalString(formData, "leagueId");
  const redirectPath = readRequiredString(formData, "redirectPath");
  let notice: string | undefined;
  let errorMessage: string | undefined;

  try {
    const result = await publishMatchday(matchdayId);
    revalidateAdminPaths(matchdayId, leagueId);
    notice = `Giornata pubblicata. Team score pubblicati: ${result.publishedTeamScoresCount}. Fixture pubblicate: ${result.publishedFixturesCount}.`;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Pubblicazione non riuscita.";
  }

  redirectWithMessage(redirectPath, { error: errorMessage, notice });
}

export async function generateFantasyFixturesAction(formData: FormData) {
  const matchdayId = readRequiredString(formData, "matchdayId");
  const leagueId = readOptionalString(formData, "leagueId");
  const redirectPath = readRequiredString(formData, "redirectPath");
  let notice: string | undefined;
  let errorMessage: string | undefined;

  try {
    const result = await generateFantasyFixtures(matchdayId);
    revalidateAdminPaths(matchdayId, leagueId);
    notice = `Scontri generati: ${result.createdCount}. Totale fixture attese: ${result.totalFixtures}.`;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Generazione scontri non riuscita.";
  }

  redirectWithMessage(redirectPath, { error: errorMessage, notice });
}

export async function calculateFantasyFixtureResultsAction(formData: FormData) {
  const matchdayId = readRequiredString(formData, "matchdayId");
  const leagueId = readOptionalString(formData, "leagueId");
  const redirectPath = readRequiredString(formData, "redirectPath");
  let notice: string | undefined;
  let errorMessage: string | undefined;

  try {
    const result = await calculateFantasyFixtureResults(matchdayId);
    revalidateAdminPaths(matchdayId, leagueId);
    notice = `Risultati scontri calcolati: ${result.calculatedCount}.`;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Calcolo risultati scontri non riuscito.";
  }

  redirectWithMessage(redirectPath, { error: errorMessage, notice });
}
