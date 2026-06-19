import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminLeagueStandingsData } from "@/lib/server/admin/read-admin-data";

export const dynamic = "force-dynamic";

type StandingsPageProps = {
  params: Promise<{
    leagueId: string;
  }>;
};

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export default async function AdminLeagueStandingsPage({
  params
}: StandingsPageProps) {
  const { leagueId } = await params;
  const data = await getAdminLeagueStandingsData(leagueId);

  if (!data) {
    notFound();
  }

  return (
    <AdminShell
      title={`Classifica | ${data.league.name}`}
      subtitle={`Stato lega ${data.league.status} | Team ${data.league._count.fantasyTeams} | Giornate ${data.league._count.matchdays}`}
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Classifica lega</h2>
            <p className="mt-2 text-sm text-slate-600">
              Ordinamento calcolato dal servizio server-side sugli scontri
              pubblicati.
            </p>
          </div>
          <StatusBadge status={data.league.status} />
        </div>
      </section>

      {data.standings.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Nessuna fantasy team disponibile per questa lega.
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">Pos</th>
                  <th className="px-3 py-2 font-medium">Squadra</th>
                  <th className="px-3 py-2 font-medium">Punti</th>
                  <th className="px-3 py-2 font-medium">G</th>
                  <th className="px-3 py-2 font-medium">V</th>
                  <th className="px-3 py-2 font-medium">N</th>
                  <th className="px-3 py-2 font-medium">P</th>
                  <th className="px-3 py-2 font-medium">GF</th>
                  <th className="px-3 py-2 font-medium">GS</th>
                  <th className="px-3 py-2 font-medium">DR</th>
                  <th className="px-3 py-2 font-medium">Fantapunti</th>
                  <th className="px-3 py-2 font-medium">Best score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.standings.map((row, index) => (
                  <tr key={row.teamId}>
                    <td className="px-3 py-2 text-slate-900">{index + 1}</td>
                    <td className="px-3 py-2 text-slate-900">{row.teamName}</td>
                    <td className="px-3 py-2 text-slate-900">{row.leaguePoints}</td>
                    <td className="px-3 py-2 text-slate-600">{row.played}</td>
                    <td className="px-3 py-2 text-slate-600">{row.wins}</td>
                    <td className="px-3 py-2 text-slate-600">{row.draws}</td>
                    <td className="px-3 py-2 text-slate-600">{row.losses}</td>
                    <td className="px-3 py-2 text-slate-600">{row.goalsFor}</td>
                    <td className="px-3 py-2 text-slate-600">{row.goalsAgainst}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {row.goalDifference}
                    </td>
                    <td className="px-3 py-2 text-slate-900">
                      {formatScore(row.fantasyPointsTotal)}
                    </td>
                    <td className="px-3 py-2 text-slate-900">
                      {formatScore(row.bestFantasyScore)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AdminShell>
  );
}
