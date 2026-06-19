import { MatchdayStatus } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { lockLineupsAction, openLineupsAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminMatchdayDetailData } from "@/lib/server/admin/read-admin-data";

export const dynamic = "force-dynamic";

type AdminMatchdayDetailPageProps = {
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

function canShowPostLineupLinks(status: MatchdayStatus) {
  return (
    status !== MatchdayStatus.DRAFT &&
    status !== MatchdayStatus.LINEUPS_OPEN
  );
}

export default async function AdminMatchdayDetailPage({
  params,
  searchParams
}: AdminMatchdayDetailPageProps) {
  const { matchdayId } = await params;
  const { error, notice } = await searchParams;
  const matchday = await getAdminMatchdayDetailData(matchdayId);

  if (!matchday) {
    notFound();
  }

  const openAction = openLineupsAction.bind(null, matchday.id);
  const closeAction = lockLineupsAction.bind(null, matchday.id);

  return (
    <AdminShell
      title={`Giornata ${matchday.number}`}
      subtitle="Controlla lo stato della giornata e gestisci apertura o chiusura dell'inserimento formazioni."
    >
      <Feedback error={error} notice={notice} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600">
              Lega: <strong>{matchday.league.name}</strong>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Numero giornata: <strong>{matchday.number}</strong> | Squadre lega:{" "}
              <strong>{matchday.league._count.fantasyTeams}</strong> | Formazioni
              inserite: <strong>{matchday._count.lineups}</strong>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Giocatori utili: <strong>{matchday._count.requiredVotes}</strong> | Voti
              salvati: <strong>{matchday._count.playerVotes}</strong> | Team score:{" "}
              <strong>{matchday._count.teamScores}</strong>
            </p>
          </div>

          <StatusBadge status={matchday.status} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Azioni disponibili</h2>

        <div className="mt-5 flex flex-wrap gap-3">
          {matchday.status === MatchdayStatus.DRAFT ? (
            <form action={openAction}>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Apri inserimento formazioni
              </button>
            </form>
          ) : null}

          {matchday.status === MatchdayStatus.LINEUPS_OPEN ? (
            <form action={closeAction}>
              <button
                type="submit"
                className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition hover:border-amber-400 hover:bg-amber-100"
              >
                Chiudi formazioni
              </button>
            </form>
          ) : null}

          {canShowPostLineupLinks(matchday.status) ? (
            <>
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
            </>
          ) : null}

          <Link
            href={`/admin/leagues/${matchday.league.id}/matchdays/new`}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Crea un'altra giornata
          </Link>
        </div>

        {matchday.status === MatchdayStatus.LINEUPS_LOCKED ? (
          <p className="mt-4 text-sm text-slate-600">
            Le formazioni sono chiuse. Da qui puoi proseguire con voti e punteggi.
          </p>
        ) : null}
      </section>
    </AdminShell>
  );
}
