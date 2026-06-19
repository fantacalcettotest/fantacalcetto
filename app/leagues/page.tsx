import Link from "next/link";

import { getPublicLeaguesListData } from "@/lib/server/public/read-public-league-data";

export const dynamic = "force-dynamic";

export default async function PublicLeaguesPage() {
  const leagues = await getPublicLeaguesListData();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-pitch to-emerald-700 px-6 py-8 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-100">
                Fantacalcetto
              </p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                Leghe disponibili
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-emerald-50 sm:text-base">
                Elenco pubblico delle leghe con disponibilita attuale e accesso
                rapido alla pagina lega o alla creazione squadra.
              </p>
            </div>
          </div>
        </header>

        {leagues.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600 shadow-sm">
            Nessuna lega disponibile al momento.
          </section>
        ) : (
          <section className="space-y-4">
            {leagues.map((league) => (
              <article
                key={league.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {league.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Squadre iscritte: <strong>{league.fantasyTeamsCount}</strong> /{" "}
                      <strong>{league.maxTeams}</strong> | Posti disponibili:{" "}
                      <strong>{league.availableSpots}</strong>
                    </p>
                    <div
                      className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        league.registrationsClosed
                          ? "bg-slate-200 text-slate-700"
                          : league.availableSpots > 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {league.statusLabel}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/leagues/${league.id}`}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                    >
                      Vedi lega
                    </Link>
                    {!league.registrationsClosed ? (
                      <Link
                        href={`/leagues/${league.id}/join`}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                      >
                        Entra / Crea squadra
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
