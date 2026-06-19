"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedAppUser } from "@/lib/auth/app-user";
import { createUserFantasyTeam } from "@/lib/server/teams/create-user-fantasy-team";

function buildJoinLeagueRedirectPath(leagueId: string, error?: string) {
  const searchParams = new URLSearchParams();

  if (error) {
    searchParams.set("error", error);
  }

  const search = searchParams.toString();
  return search.length > 0
    ? `/leagues/${leagueId}/join?${search}`
    : `/leagues/${leagueId}/join`;
}

export async function createFantasyTeamAction(formData: FormData) {
  const rawLeagueId = formData.get("leagueId");
  const rawTeamName = formData.get("teamName");

  const leagueId = typeof rawLeagueId === "string" ? rawLeagueId : "";
  const teamName = typeof rawTeamName === "string" ? rawTeamName : "";

  if (leagueId.trim().length === 0) {
    redirect("/me");
  }

  const authContext = await requireAuthenticatedAppUser(
    `/leagues/${leagueId}/join`
  );

  try {
    const result = await createUserFantasyTeam({
      appUserId: authContext.appUser.id,
      leagueId,
      teamName
    });

    revalidatePath("/me");
    revalidatePath(`/leagues/${leagueId}`);
    revalidatePath(`/leagues/${leagueId}/join`);

    redirect(`/me/teams/${result.teamId}`);
  } catch (error) {
    redirect(
      buildJoinLeagueRedirectPath(
        leagueId,
        error instanceof Error
          ? error.message
          : "Impossibile creare la squadra fantasy."
      )
    );
  }
}
