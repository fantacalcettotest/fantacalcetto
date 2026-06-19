import Link from "next/link";

import { requireAuthenticatedAppUser } from "@/lib/auth/app-user";
import { getUserDashboardData } from "@/lib/server/me/read-user-data";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const authContext = await requireAuthenticatedAppUser("/me");
  const data = await getUserDashboardData(authContext.appUser.id);

  if (!data) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
        Impossibile caricare il profilo utente applicativo.
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Profilo</h2>
        <p className="mt-2 text-sm text-slate-600">
          Nome: <strong>{data.user.displayName ?? "Non disponibile"}</strong> |
          Email: <strong>{data.user.email}</strong>
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">La mia squadra</h2>
        {data.myTeam ? (
          <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {data.myTeam.name}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Lega: <strong>{data.myTeam.league.name}</strong>
                </p>
              </div>

              <Link
                href={`/me/teams/${data.myTeam.id}`}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Apri la mia squadra
              </Link>
            </div>

            {data.myTeamOpenMatchdays.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Giornate aperte
                </h4>
                <div className="mt-3 flex flex-wrap gap-3">
                  {data.myTeamOpenMatchdays.map((matchday) => (
                    <Link
                      key={matchday.id}
                      href={`/me/teams/${data.myTeam.id}/matchdays/${matchday.id}/lineup`}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                    >
                      Giornata #{matchday.number}
                      {matchday.hasLineup ? " | Formazione inserita" : ""}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            Entra in una lega per creare la tua squadra.
          </p>
        )}
      </section>

      {data.leagues.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Entra in una lega per creare la tua squadra.
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Le mie leghe</h2>
          <div className="mt-5 space-y-4">
            {data.leagues.map((league) => (
              <article
                key={league.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {league.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Membership:{" "}
                      <strong>{league.membershipRole ?? "Nessuna"}</strong> |
                      Squadra: <strong>{league.myTeam?.name ?? "-"}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/leagues/${league.id}`}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                    >
                      Apri lega
                    </Link>
                    {league.myTeam ? (
                      <Link
                        href={`/me/teams/${league.myTeam.id}`}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                      >
                        La mia squadra
                      </Link>
                    ) : (
                      <span className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-500">
                        Nessuna squadra
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
