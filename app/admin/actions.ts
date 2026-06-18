"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

function revalidateAdminPaths(matchdayId: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/matchdays/${matchdayId}/votes`);
  revalidatePath(`/admin/matchdays/${matchdayId}/scores`);
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

export async function generateRequiredVotePlayersAction(formData: FormData) {
  const matchdayId = readRequiredString(formData, "matchdayId");
  const redirectPath = readRequiredString(formData, "redirectPath");
  let notice: string | undefined;
  let errorMessage: string | undefined;

  try {
    const result = await generateRequiredVotePlayers(matchdayId);
    await checkVotesCompletion(matchdayId);
    revalidateAdminPaths(matchdayId);
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
    revalidateAdminPaths(matchdayId);
    notice = `Voto salvato per ${result.playerId}.`;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Salvataggio non riuscito.";
  }

  redirectWithMessage(redirectPath, { error: errorMessage, notice });
}

export async function calculateMatchdayScoresAction(formData: FormData) {
  const matchdayId = readRequiredString(formData, "matchdayId");
  const redirectPath = readRequiredString(formData, "redirectPath");
  let notice: string | undefined;
  let errorMessage: string | undefined;

  try {
    const result = await calculateMatchdayScores(matchdayId);
    revalidateAdminPaths(matchdayId);
    notice = `Punteggi calcolati per ${result.teamsScored.length} squadre.`;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Calcolo punteggi non riuscito.";
  }

  redirectWithMessage(redirectPath, { error: errorMessage, notice });
}

export async function publishMatchdayAction(formData: FormData) {
  const matchdayId = readRequiredString(formData, "matchdayId");
  const redirectPath = readRequiredString(formData, "redirectPath");
  let notice: string | undefined;
  let errorMessage: string | undefined;

  try {
    const result = await publishMatchday(matchdayId);
    revalidateAdminPaths(matchdayId);
    notice = `Giornata pubblicata. Team score pubblicati: ${result.publishedTeamScoresCount}.`;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Pubblicazione non riuscita.";
  }

  redirectWithMessage(redirectPath, { error: errorMessage, notice });
}
