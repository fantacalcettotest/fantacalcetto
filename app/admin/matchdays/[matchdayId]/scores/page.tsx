import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  calculateMatchdayScoresAction,
  publishMatchdayAction
} from "@/app/admin/actions";
import { getAdminMatchdayScoresData } from "@/lib/server/admin/read-admin-data";

export const dynamic = "force-dynamic";

type ScoresPageProps = {
  params: Promise<{
    matchdayId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    notice?: string;
  }>;
};

function Feedback({
  error,
  notice
}: {
  error?: string;
  notice?: string;
}) {
  if (!error && !notice) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        error
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {error ?? notice}
    </div>
  );
}

export default async function AdminMatchdayScoresPage({
  params,
  searchParams
}: ScoresPageProps) {
  const { matchdayId } = await params;
  const { error, notice } = await searchParams;
  const data = await getAdminMatchdayScoresData(matchdayId);

  if (!data) {
    notFound();
  }

  const redirectPath = `/admin/matchdays/${matchdayId}/scores`;
  const canCalculate = data.completion.isComplete;
  const canPublish = data.matchday.status === "SCORES_CALCULATED";

  return (
    <AdminShell
      title={`Punteggi · Giornata ${data.matchday.number}`}
      subtitle={`${data.matchday.league.name} · Stato giornata ${data.matchday.status}`}
    >
      <Feedback error={error} notice={notice} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Voti richiesti: <strong>{data.completion.totalRequired}</strong>
            </p>
            <p>
              Completati: <strong>{data.completion.completedCount}</strong> ·
              Mancanti: <strong>{data.completion.missingCount}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={data.matchday.status} />

            <form action={calculateMatchdayScoresAction}>
              <input type="hidden" name="matchdayId" value={matchdayId} />
              <input type="hidden" name="redirectPath" value={redirectPath} />
              <button
                type="submit"
                disabled={!canCalculate}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition enabled:hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Calcola punteggi
              </button>
            </form>

            <form action={publishMatchdayAction}>
              <input type="hidden" name="matchdayId" value={matchdayId} />
              <input type="hidden" name="redirectPath" value={redirectPath} />
              <button
                type="submit"
                disabled={!canPublish}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-200"
              >
                Pubblica giornata
              </button>
            </form>

            <Link
              href={`/admin/matchdays/${matchdayId}/votes`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Torna ai voti
            </Link>
          </div>
        </div>

        {!canCalculate ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Non puoi calcolare i punteggi finché tutti i voti richiesti non sono
            completi.
          </div>
        ) : null}

        {data.completion.missingRecords.length > 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Giocatori ancora mancanti
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {data.completion.missingRecords.map((record) => (
                <li key={record.playerId}>
                  {record.playerName} · status {record.status} · usage{" "}
                  {record.usageCount}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {data.matchday.teamScores.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Nessun punteggio calcolato per questa giornata.
        </section>
      ) : (
        <div className="space-y-4">
          {data.matchday.teamScores.map((teamScore) => (
            <section
              key={teamScore.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {teamScore.fantasyTeam.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Totale: <strong>{teamScore.totalScore ?? 0}</strong> · Auto
                    subs: <strong>{teamScore.autoSubsUsed}</strong>
                  </p>
                </div>

                <div className="space-y-2 text-right">
                  <StatusBadge status={teamScore.status} />
                  <p className="text-sm text-slate-600">
                    Pubblicato:{" "}
                    <strong>
                      {teamScore.publishedAt
                        ? new Date(teamScore.publishedAt).toLocaleString("it-IT")
                        : "no"}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="px-3 py-2 font-medium">Giocatore</th>
                      <th className="px-3 py-2 font-medium">Tipo</th>
                      <th className="px-3 py-2 font-medium">Slot</th>
                      <th className="px-3 py-2 font-medium">Ordine</th>
                      <th className="px-3 py-2 font-medium">Conta</th>
                      <th className="px-3 py-2 font-medium">SV</th>
                      <th className="px-3 py-2 font-medium">Fantavoto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamScore.players.map((player) => (
                      <tr key={player.id}>
                        <td className="px-3 py-2 text-slate-900">
                          {player.player.name}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {player.finalType}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {player.slotType}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {player.positionOrder}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {player.countsForScore ? "Si" : "No"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {player.isSv ? "Si" : "No"}
                        </td>
                        <td className="px-3 py-2 text-slate-900">
                          {player.finalFantavote ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
