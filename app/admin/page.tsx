import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminDashboardData } from "@/lib/server/admin/read-admin-data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { leagues } = await getAdminDashboardData();

  return (
    <AdminShell
      title="Dashboard amministrazione"
      subtitle="Area admin demo per gestire giornate, pagelle assistite e risultati senza autenticazione."
    >
      {leagues.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            Nessuna lega trovata. Esegui il seed demo prima di usare l&apos;area admin.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {leagues.map((league) => (
            <section
              key={league.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {league.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Membri: {league._count.members} · Fantasy team:{" "}
                    {league._count.fantasyTeams}
                  </p>
                </div>
                <StatusBadge status={league.status} />
              </div>

              <div className="mt-6 space-y-4">
                {league.matchdays.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    Nessuna giornata disponibile per questa lega.
                  </p>
                ) : (
                  league.matchdays.map((matchday) => (
                    <div
                      key={matchday.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            Giornata {matchday.number}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600">
                            Lineup: {matchday._count.lineups} · Giocatori utili:{" "}
                            {matchday._count.requiredVotes} · Voti salvati:{" "}
                            {matchday._count.playerVotes} · Team score:{" "}
                            {matchday._count.teamScores}
                          </p>
                        </div>
                        <StatusBadge status={matchday.status} />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href={`/admin/matchdays/${matchday.id}/votes`}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                        >
                          Gestisci voti
                        </Link>
                        <Link
                          href={`/admin/matchdays/${matchday.id}/scores`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                        >
                          Vedi punteggi
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
