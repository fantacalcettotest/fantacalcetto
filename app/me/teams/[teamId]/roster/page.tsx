import type { PlayerRole } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addPlayerToRosterAction,
  removePlayerFromRosterAction
} from "@/app/me/actions";
import { requireAuthenticatedAppUser } from "@/lib/auth/app-user";
import {
  getPlayerRoleFilterLabel,
  getPlayerRoleLabel,
  parsePlayerRoleFilter,
  PLAYER_ROLE_FILTERS
} from "@/lib/players/player-role";
import { getUserTeamRosterPageData } from "@/lib/server/me/read-user-data";

export const dynamic = "force-dynamic";

type RosterPageProps = {
  params: Promise<{
    teamId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    notice?: string;
    role?: string;
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

function getRosterStatus(validation: {
  isComplete: boolean;
  isValid: boolean;
}) {
  if (!validation.isComplete) {
    return {
      label: "Rosa incompleta",
      className: "border-amber-200 bg-amber-50 text-amber-800"
    };
  }

  if (!validation.isValid) {
    return {
      label: "Rosa completa ma non valida",
      className: "border-rose-200 bg-rose-50 text-rose-700"
    };
  }

  return {
    label: "Rosa valida",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };
}

function renderRole(role: PlayerRole) {
  return getPlayerRoleLabel(role);
}

export default async function TeamRosterPage({
  params,
  searchParams
}: RosterPageProps) {
  const { teamId } = await params;
  const { error, notice, role } = await searchParams;
  const roleFilter = parsePlayerRoleFilter(role);
  const authContext = await requireAuthenticatedAppUser(
    `/me/teams/${teamId}/roster`
  );
  const data = await getUserTeamRosterPageData(teamId, roleFilter);

  if (!data) {
    notFound();
  }

  const canAccess =
    authContext.appUser.role === "ADMIN" ||
    authContext.appUser.id === data.team.userId;

  if (!canAccess) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
        Accesso non autorizzato.
      </section>
    );
  }

  const rosterStatus = getRosterStatus(data.rosterValidation);
  const rosterIsFull = data.rosterValidation.total >= 8;

  return (
    <div className="space-y-6">
      <Feedback error={error} notice={notice} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Gestisci rosa | {data.team.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Lega: <strong>{data.team.league.name}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/me/teams/${data.team.id}`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Torna alla squadra
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Stato rosa</h3>
            <p className="mt-2 text-sm text-slate-600">
              Totale: <strong>{data.rosterValidation.total}</strong> | Portieri:{" "}
              <strong>{data.rosterValidation.goalkeeperCount}</strong> | Difensori:{" "}
              <strong>{data.rosterValidation.defenderCount}</strong> | Centrocampisti:{" "}
              <strong>{data.rosterValidation.midfielderCount}</strong> | Attaccanti:{" "}
              <strong>{data.rosterValidation.attackerCount}</strong>
            </p>
          </div>

          <div
            className={`rounded-xl border px-4 py-2 text-sm font-medium ${rosterStatus.className}`}
          >
            {rosterStatus.label}
          </div>
        </div>

        {data.rosterValidation.errors.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm text-rose-700">
            {data.rosterValidation.errors.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Rosa corrente</h3>
            <p className="mt-2 text-sm text-slate-600">
              I giocatori selezionati possono essere rimossi in qualsiasi momento.
            </p>
          </div>
        </div>

        {data.team.roster.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Rosa vuota.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">Giocatore</th>
                  <th className="px-3 py-2 font-medium">Ruolo</th>
                  <th className="px-3 py-2 font-medium">Squadra reale</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.team.roster.map((entry) => {
                  const removeAction = removePlayerFromRosterAction.bind(
                    null,
                    data.team.id,
                    entry.player.id,
                    roleFilter
                  );

                  return (
                    <tr key={entry.id}>
                      <td className="px-3 py-2 text-slate-900">
                        {entry.player.name}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {renderRole(entry.player.role)}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {entry.player.teamName ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {entry.player.source ?? "-"}
                      </td>
                      <td className="px-3 py-2">
                        <form action={removeAction}>
                          <button
                            type="submit"
                            className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
                          >
                            Rimuovi
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              Giocatori disponibili
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Sono mostrati solo i giocatori attivi.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {PLAYER_ROLE_FILTERS.map((filterOption) => (
            <Link
              key={filterOption}
              href={`/me/teams/${data.team.id}/roster?role=${filterOption}`}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                roleFilter === filterOption
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900"
              }`}
            >
              {getPlayerRoleFilterLabel(filterOption)}
            </Link>
          ))}
        </div>

        {data.activePlayersCount === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Nessun player disponibile.
          </div>
        ) : data.availablePlayers.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Nessun risultato per il filtro selezionato.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">Giocatore</th>
                  <th className="px-3 py-2 font-medium">Ruolo</th>
                  <th className="px-3 py-2 font-medium">Squadra reale</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">Stato</th>
                  <th className="px-3 py-2 font-medium">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.availablePlayers.map((player) => {
                  const addAction = addPlayerToRosterAction.bind(
                    null,
                    data.team.id,
                    player.id,
                    roleFilter
                  );
                  const isAddDisabled = player.isSelected || rosterIsFull;

                  return (
                    <tr key={player.id}>
                      <td className="px-3 py-2 text-slate-900">{player.name}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {renderRole(player.role)}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {player.teamName ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {player.source ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {player.isSelected
                          ? "Gia in rosa"
                          : rosterIsFull
                            ? "Rosa piena"
                            : "Disponibile"}
                      </td>
                      <td className="px-3 py-2">
                        <form action={addAction}>
                          <button
                            type="submit"
                            disabled={isAddDisabled}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-200"
                          >
                            Aggiungi
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
