import Link from "next/link";
import { notFound } from "next/navigation";

import { leaveLeagueAction } from "@/app/me/actions";
import { getPlayerRoleLabel } from "@/lib/players/player-role";
import { requireAuthenticatedAppUser } from "@/lib/auth/app-user";
import { getUserTeamPageData } from "@/lib/server/me/read-user-data";
import { validateRosterComposition } from "@/lib/server/rosters/validate-roster-composition";

export const dynamic = "force-dynamic";

type TeamPageProps = {
  params: Promise<{
    teamId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    notice?: string;
  }>;
};

function Feedback({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) {
    return null;
  }

  return (
    <>
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}
    </>
  );
}

function getFixtureSummary(
  teamId: string,
  fixture:
    | {
        awayGoals: number | null;
        awayTeam: { id: string; name: string };
        homeGoals: number | null;
        homeTeam: { id: string; name: string };
      }
    | undefined
) {
  if (!fixture) {
    return {
      isBye: true as const
    };
  }

  const isHome = fixture.homeTeam.id === teamId;
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
  const hasResult =
    fixture.homeGoals !== null && fixture.awayGoals !== null;

  return {
    hasResult,
    isAway: !isHome,
    isBye: false as const,
    isHome,
    opponent,
    resultLabel: hasResult
      ? `${fixture.homeGoals} - ${fixture.awayGoals}`
      : null
  };
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { teamId } = await params;
  const { error, notice } = await searchParams;
  const authContext = await requireAuthenticatedAppUser(`/me/teams/${teamId}`);
  const team = await getUserTeamPageData(teamId);

  if (!team) {
    notFound();
  }

  const canAccess =
    authContext.appUser.role === "ADMIN" ||
    authContext.appUser.id === team.userId;
  const isOwner = authContext.appUser.id === team.userId;

  if (!canAccess) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
        Accesso non autorizzato.
      </section>
    );
  }

  const rosterValidation = validateRosterComposition(
    team.roster.map((entry) => ({
      role: entry.player.role
    }))
  );
  const rosterStatus = !rosterValidation.isComplete
    ? "Rosa incompleta"
    : rosterValidation.isValid
      ? "Rosa valida"
      : "Rosa completa ma non valida";
  const nextMatchdaySummary = team.nextMatchday
    ? getFixtureSummary(team.id, team.nextMatchday.fixtures[0])
    : null;

  return (
    <div className="space-y-6">
      <Feedback error={error} notice={notice} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{team.name}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Lega: <strong>{team.league.name}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/me/teams/${team.id}/roster`}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Gestisci rosa
            </Link>
            <Link
              href={`/leagues/${team.league.id}`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Apri lega
            </Link>
            <Link
              href={`/leagues/${team.league.id}/standings`}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Classifica pubblica
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Stato rosa</h2>
        <p className="mt-2 text-sm text-slate-600">
          Stato: <strong>{rosterStatus}</strong> | Totale:{" "}
          <strong>{rosterValidation.total}</strong> | Portieri:{" "}
          <strong>{rosterValidation.goalkeeperCount}</strong> | Difensori:{" "}
          <strong>{rosterValidation.defenderCount}</strong> | Centrocampisti:{" "}
          <strong>{rosterValidation.midfielderCount}</strong> | Attaccanti:{" "}
          <strong>{rosterValidation.attackerCount}</strong>
        </p>

        {rosterValidation.errors.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm text-rose-700">
            {rosterValidation.errors.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          Prossima giornata
        </h2>

        {!team.nextMatchday ? (
          <p className="mt-4 text-sm text-slate-600">
            Nessuna giornata futura disponibile al momento.
          </p>
        ) : (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Giornata #{team.nextMatchday.number}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Stato: <strong>{team.nextMatchday.status}</strong>
                  {team.nextMatchday.lineupDeadlineAt ? (
                    <>
                      {" "}
                      | Deadline:{" "}
                      <strong>
                        {new Intl.DateTimeFormat("it-IT", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        }).format(team.nextMatchday.lineupDeadlineAt)}
                      </strong>
                    </>
                  ) : null}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {nextMatchdaySummary?.isBye
                    ? "Turno di riposo"
                    : `${nextMatchdaySummary?.isHome ? "Casa" : "Trasferta"} vs ${nextMatchdaySummary?.opponent.name}`}
                </p>
              </div>

              {!nextMatchdaySummary?.isBye &&
              team.nextMatchday.status === "LINEUPS_OPEN" ? (
                <Link
                  href={`/me/teams/${team.id}/matchdays/${team.nextMatchday.id}/lineup`}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Schiera formazione
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Calendario</h2>

        {team.league.matchdays.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            Nessuna giornata disponibile per questa lega.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {team.league.matchdays.map((matchday) => {
              const existingLineup = team.lineups.find(
                (lineup) => lineup.matchdayId === matchday.id
              );
              const fixtureSummary = getFixtureSummary(
                team.id,
                matchday.fixtures[0]
              );

              return (
                <article
                  key={matchday.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Giornata #{matchday.number}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        Stato: <strong>{matchday.status}</strong>
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {fixtureSummary.isBye
                          ? "Turno di riposo"
                          : `${fixtureSummary.isHome ? "Casa" : "Trasferta"} vs ${fixtureSummary.opponent.name}`}
                      </p>
                      {!fixtureSummary.isBye && fixtureSummary.resultLabel ? (
                        <p className="mt-2 text-sm text-slate-600">
                          Risultato: <strong>{fixtureSummary.resultLabel}</strong>
                        </p>
                      ) : null}
                      {existingLineup ? (
                        <p className="mt-2 text-sm text-emerald-700">
                          Formazione inserita
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {!fixtureSummary.isBye &&
                      matchday.status === "LINEUPS_OPEN" ? (
                        <Link
                          href={`/me/teams/${team.id}/matchdays/${matchday.id}/lineup`}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                        >
                          {existingLineup ? "Modifica formazione" : "Schiera formazione"}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {team.roster.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm">
          La rosa non e ancora stata assegnata.
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Rosa</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">Giocatore</th>
                  <th className="px-3 py-2 font-medium">Ruolo</th>
                  <th className="px-3 py-2 font-medium">Squadra reale</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.roster.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-3 py-2 text-slate-900">
                      {entry.player.name}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {getPlayerRoleLabel(entry.player.role)}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {entry.player.teamName ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {entry.player.source ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isOwner ? (
        <section className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Abbandona lega</h2>
          <p className="mt-2 text-sm text-slate-600">
            Puoi abbandonare questa lega solo se la squadra non ha ancora
            partecipato ad alcuna giornata.
          </p>

          {team.leagueScheduleGenerated ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Non puoi abbandonare questa lega perché il calendario è già stato
              generato.
            </div>
          ) : team.canLeaveLeague ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              L'operazione elimina la squadra e la rosa associata. Non verranno
              toccate altre leghe.
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Non puoi abbandonare questa lega perche la squadra ha gia
              partecipato a una giornata.
            </div>
          )}

          <form action={leaveLeagueAction.bind(null, team.id)} className="mt-5 space-y-4">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="confirmLeaveLeague"
                value="yes"
                disabled={!team.canLeaveLeague}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <span>Confermo di voler abbandonare questa lega</span>
            </label>

            <button
              type="submit"
              disabled={!team.canLeaveLeague}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition enabled:hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-200"
            >
              Abbandona lega
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
