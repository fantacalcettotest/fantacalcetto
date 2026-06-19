import { MatchdayStatus } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getFixtureAdminNote,
  getFixtureForfeitOutcome
} from "@/lib/server/fixtures/fixture-forfeit";
import { getPublicLeagueScheduleData } from "@/lib/server/public/read-public-league-data";

export const dynamic = "force-dynamic";

type PublicLeagueSchedulePageProps = {
  params: Promise<{
    leagueId: string;
  }>;
};

const MATCHDAY_STATUS_LABELS: Record<MatchdayStatus, string> = {
  DRAFT: "Bozza",
  LINEUPS_LOCKED: "Formazioni chiuse",
  LINEUPS_OPEN: "Formazioni aperte",
  LOCKED: "Bloccata",
  PUBLISHED: "Pubblicata",
  SCORES_CALCULATED: "Punteggi calcolati",
  VOTES_COMPLETED: "Voti completati",
  VOTES_PENDING: "Voti in compilazione"
};

export default async function PublicLeagueSchedulePage({
  params
}: PublicLeagueSchedulePageProps) {
  const { leagueId } = await params;
  const data = await getPublicLeagueScheduleData(leagueId);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Calendario lega</h2>
            <p className="mt-2 text-sm text-slate-600">
              Squadre: <strong>{data.league.fantasyTeamsCount}</strong> /{" "}
              <strong>{data.league.maxTeams}</strong> | Giornate:{" "}
              <strong>{data.matchdays.length}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/leagues/${data.league.id}`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Pagina lega
            </Link>
            <Link
              href={`/leagues/${data.league.id}/standings`}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Classifica
            </Link>
          </div>
        </div>
      </section>

      {data.matchdays.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Calendario non ancora generato.
        </section>
      ) : (
        <section className="space-y-4">
          {data.matchdays.map((matchday) => (
            <article
              key={matchday.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    Giornata {matchday.number}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Stato:{" "}
                    <strong>{MATCHDAY_STATUS_LABELS[matchday.status]}</strong> |{" "}
                    Scontri: <strong>{matchday.fixtures.length}</strong>
                  </p>
                </div>

                {matchday.isPublic ? (
                  <Link
                    href={`/leagues/${data.league.id}/matchdays/${matchday.id}`}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                  >
                    Dettaglio giornata
                  </Link>
                ) : null}
              </div>

              {matchday.fixtures.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Nessuno scontro programmato per questa giornata.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {matchday.fixtures.map((fixture) => {
                    const note =
                      fixture.showResult && fixture.teamScoreState
                        ? getFixtureAdminNote(
                            getFixtureForfeitOutcome(fixture.teamScoreState)
                          )
                        : null;

                    return (
                      <div
                        key={fixture.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <p className="text-sm font-medium text-slate-900">
                          {fixture.showResult ? (
                            <>
                              {fixture.homeTeam.name} {fixture.homeGoals ?? "-"} -{" "}
                              {fixture.awayGoals ?? "-"} {fixture.awayTeam.name}
                            </>
                          ) : (
                            <>
                              {fixture.homeTeam.name} vs {fixture.awayTeam.name}
                            </>
                          )}
                        </p>
                        {note ? (
                          <p className="mt-2 text-sm text-amber-700">{note}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}

              {matchday.restingTeams.length > 0 ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {matchday.restingTeams.length === 1
                    ? `Turno di riposo: ${matchday.restingTeams[0].name}`
                    : `Riposo/non abbinate: ${matchday.restingTeams
                        .map((team) => team.name)
                        .join(", ")}`}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
