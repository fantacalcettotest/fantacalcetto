import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  generateRequiredVotePlayersAction,
  savePlayerVoteAction
} from "@/app/admin/actions";
import { getAdminMatchdayVotesData } from "@/lib/server/admin/read-admin-data";

export const dynamic = "force-dynamic";

type VotesPageProps = {
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

export default async function AdminMatchdayVotesPage({
  params,
  searchParams
}: VotesPageProps) {
  const { matchdayId } = await params;
  const { error, notice } = await searchParams;
  const data = await getAdminMatchdayVotesData(matchdayId);

  if (!data) {
    notFound();
  }

  const redirectPath = `/admin/matchdays/${matchdayId}/votes`;

  return (
    <AdminShell
      title={`Pagelle assistite · Giornata ${data.matchday.number}`}
      subtitle={`${data.matchday.league.name} · Stato giornata ${data.matchday.status}`}
    >
      <Feedback error={error} notice={notice} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Giocatori utili: <strong>{data.completion.totalRequired}</strong>
            </p>
            <p>
              Completati: <strong>{data.completion.completedCount}</strong> ·
              Mancanti: <strong>{data.completion.missingCount}</strong>
            </p>
            <p>
              Lineup: <strong>{data.matchday.lineupsCount}</strong> · Titolari
              per team: <strong>{data.matchday.league.startersCount}</strong> ·
              Max sostituzioni:{" "}
              <strong>{data.matchday.league.maxAutoSubs}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={data.matchday.status} />
            <form action={generateRequiredVotePlayersAction}>
              <input type="hidden" name="leagueId" value={data.matchday.league.id} />
              <input type="hidden" name="matchdayId" value={matchdayId} />
              <input type="hidden" name="redirectPath" value={redirectPath} />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Genera giocatori utili
              </button>
            </form>
            <Link
              href={`/admin/matchdays/${matchdayId}/scores`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Vai ai punteggi
            </Link>
          </div>
        </div>
      </section>

      {data.matchday.requiredVotePlayers.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Nessun giocatore utile generato per questa giornata. Usa il bottone in
          alto per creare la lista a partire dalle lineup.
        </section>
      ) : (
        <div className="space-y-4">
          {data.matchday.requiredVotePlayers.map((record) => (
            <section
              key={record.player.id}
              className={`rounded-2xl border bg-white p-6 shadow-sm ${
                record.status === "PENDING"
                  ? "border-amber-300"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {record.player.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {record.player.teamName ?? "Team non disponibile"} ·
                    Utilizzi: <strong>{record.usageCount}</strong>
                  </p>
                </div>

                <div className="space-y-2 text-right">
                  <StatusBadge status={record.status} />
                  <p className="text-sm text-slate-600">
                    Final fantavote:{" "}
                    <strong>
                      {record.playerVote?.finalFantavote ?? "non calcolato"}
                    </strong>
                  </p>
                </div>
              </div>

              <form
                action={savePlayerVoteAction}
                className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
              >
                <input type="hidden" name="leagueId" value={data.matchday.league.id} />
                <input type="hidden" name="matchdayId" value={matchdayId} />
                <input type="hidden" name="playerId" value={record.player.id} />
                <input type="hidden" name="redirectPath" value={redirectPath} />

                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-medium">Base vote</span>
                  <input
                    name="baseVote"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    defaultValue={record.playerVote?.baseVote ?? ""}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    name="isSv"
                    type="checkbox"
                    defaultChecked={record.playerVote?.isSv ?? false}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Segna come SV
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-medium">Goals</span>
                  <input
                    name="goals"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={record.playerVote?.goals ?? 0}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-medium">Assists</span>
                  <input
                    name="assists"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={record.playerVote?.assists ?? 0}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-medium">Yellow cards</span>
                  <input
                    name="yellowCards"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={record.playerVote?.yellowCards ?? 0}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-medium">Red cards</span>
                  <input
                    name="redCards"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={record.playerVote?.redCards ?? 0}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-medium">Own goals</span>
                  <input
                    name="ownGoals"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={record.playerVote?.ownGoals ?? 0}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-medium">Penalties missed</span>
                  <input
                    name="penaltiesMissed"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={record.playerVote?.penaltiesMissed ?? 0}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-medium">Penalties saved</span>
                  <input
                    name="penaltiesSaved"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={record.playerVote?.penaltiesSaved ?? 0}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-medium">Clean sheet</span>
                  <input
                    name="cleanSheet"
                    type="number"
                    min="0"
                    max="1"
                    step="1"
                    defaultValue={record.playerVote?.cleanSheet ?? 0}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700 md:col-span-2 xl:col-span-3">
                  <span className="font-medium">Notes</span>
                  <textarea
                    name="notes"
                    rows={2}
                    defaultValue={record.playerVote?.notes ?? ""}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
                  >
                    Salva voto
                  </button>
                </div>
              </form>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
