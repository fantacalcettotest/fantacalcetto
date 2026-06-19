import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  generateDemoVotesForPendingPlayersAction,
  generateRequiredVotePlayersAction,
  saveBulkPlayerVotesAction,
  saveSinglePlayerVoteFromBulkAction
} from "@/app/admin/actions";
import { getAdminMatchdayVotesData } from "@/lib/server/admin/read-admin-data";

export const dynamic = "force-dynamic";

type VotesPageProps = {
  params: Promise<{
    matchdayId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    filter?: string;
    notice?: string;
  }>;
};

type FilterValue = "all" | "pending";

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

function buildFilterHref(matchdayId: string, filter: FilterValue) {
  return `/admin/matchdays/${matchdayId}/votes?filter=${filter}`;
}

function getVoteFieldName(playerId: string, fieldName: string) {
  return `votes.${playerId}.${fieldName}`;
}

function FilterLink({
  active,
  href,
  label
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

export default async function AdminMatchdayVotesPage({
  params,
  searchParams
}: VotesPageProps) {
  const { matchdayId } = await params;
  const { error, filter: rawFilter, notice } = await searchParams;
  const data = await getAdminMatchdayVotesData(matchdayId);

  if (!data) {
    notFound();
  }

  const filter: FilterValue = rawFilter === "pending" ? "pending" : "all";
  const isDev = process.env.NODE_ENV !== "production";
  const redirectPath = buildFilterHref(matchdayId, filter);
  const visibleRecords =
    filter === "pending"
      ? data.matchday.requiredVotePlayers.filter((record) => record.status === "PENDING")
      : data.matchday.requiredVotePlayers;

  return (
    <AdminShell
      title={`Pagelle assistite | Giornata ${data.matchday.number}`}
      subtitle={`${data.matchday.league.name} | Stato giornata ${data.matchday.status}`}
    >
      <Feedback error={error} notice={notice} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Giocatori utili: <strong>{data.completion.totalRequired}</strong>
            </p>
            <p>
              Pending: <strong>{data.completion.pendingCount}</strong> |
              Completati: <strong>{data.completion.completedStatusCount}</strong> |
              SV: <strong>{data.completion.svCount}</strong>
              {data.completion.ignoredCount > 0 ? (
                <>
                  {" "}
                  | Ignorati: <strong>{data.completion.ignoredCount}</strong>
                </>
              ) : null}
            </p>
            <p>
              Lineup: <strong>{data.matchday.lineupsCount}</strong> | Titolari per
              team: <strong>{data.matchday.league.startersCount}</strong> | Max
              sostituzioni: <strong>{data.matchday.league.maxAutoSubs}</strong>
            </p>
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
              Compila piu righe e premi Salva tutti. Le righe vuote vengono
              ignorate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={data.matchday.status} />
            {isDev ? (
              <form action={generateDemoVotesForPendingPlayersAction.bind(null, matchdayId)}>
                <button
                  type="submit"
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition hover:border-amber-400 hover:bg-amber-100"
                >
                  DEV: compila voti demo pending
                </button>
              </form>
            ) : null}
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

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Filtro:</span>
          <FilterLink
            active={filter === "all"}
            href={buildFilterHref(matchdayId, "all")}
            label="Mostra tutti"
          />
          <FilterLink
            active={filter === "pending"}
            href={buildFilterHref(matchdayId, "pending")}
            label="Mostra solo pending"
          />
        </div>

        {isDev ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Solo per test locale. Non usare per voti reali.
          </p>
        ) : null}
      </section>

      {data.matchday.requiredVotePlayers.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Nessun giocatore utile generato per questa giornata. Usa il bottone in
          alto per creare la lista a partire dalle lineup.
        </section>
      ) : visibleRecords.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Nessun giocatore visibile con il filtro corrente.
        </section>
      ) : (
        <form action={saveBulkPlayerVotesAction} className="space-y-4">
          <input type="hidden" name="leagueId" value={data.matchday.league.id} />
          <input type="hidden" name="matchdayId" value={matchdayId} />
          <input type="hidden" name="redirectPath" value={redirectPath} />

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Salva tutti i voti inseriti
            </button>
          </div>

          {visibleRecords.map((record) => {
            const saveSingleAction = saveSinglePlayerVoteFromBulkAction.bind(
              null,
              record.player.id
            );

            return (
              <section
                key={record.player.id}
                className={`rounded-2xl border bg-white p-6 shadow-sm ${
                  record.status === "PENDING" ? "border-amber-300" : "border-slate-200"
                }`}
              >
                <input type="hidden" name="playerIds" value={record.player.id} />
                <input
                  type="hidden"
                  name={`playerLabels.${record.player.id}`}
                  value={record.player.name}
                />

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {record.player.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {record.player.teamName ?? "Team non disponibile"} | Utilizzi:{" "}
                      <strong>{record.usageCount}</strong>
                    </p>
                  </div>

                  <div className="space-y-2 text-right">
                    <StatusBadge status={record.status} />
                    <p className="text-sm text-slate-600">
                      Final fantavote:{" "}
                      <strong>{record.playerVote?.finalFantavote ?? "non calcolato"}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2 text-sm text-slate-700">
                    <span className="font-medium">Base vote</span>
                    <input
                      name={getVoteFieldName(record.player.id, "baseVote")}
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
                      name={getVoteFieldName(record.player.id, "isSv")}
                      type="checkbox"
                      defaultChecked={record.playerVote?.isSv ?? false}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Segna come SV
                  </label>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span className="font-medium">Goals</span>
                    <input
                      name={getVoteFieldName(record.player.id, "goals")}
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
                      name={getVoteFieldName(record.player.id, "assists")}
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
                      name={getVoteFieldName(record.player.id, "yellowCards")}
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
                      name={getVoteFieldName(record.player.id, "redCards")}
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
                      name={getVoteFieldName(record.player.id, "ownGoals")}
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
                      name={getVoteFieldName(record.player.id, "penaltiesMissed")}
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
                      name={getVoteFieldName(record.player.id, "penaltiesSaved")}
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
                      name={getVoteFieldName(record.player.id, "cleanSheet")}
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
                      name={getVoteFieldName(record.player.id, "notes")}
                      rows={2}
                      defaultValue={record.playerVote?.notes ?? ""}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>

                  <div className="flex items-end">
                    <button
                      formAction={saveSingleAction}
                      type="submit"
                      className="w-full rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100"
                    >
                      Salva questo
                    </button>
                  </div>
                </div>
              </section>
            );
          })}

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Salva tutti i voti inseriti
            </button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
