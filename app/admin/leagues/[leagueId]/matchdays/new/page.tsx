import Link from "next/link";
import { notFound } from "next/navigation";

import { createMatchdayAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminLeagueMatchdayCreationData } from "@/lib/server/admin/read-admin-data";

export const dynamic = "force-dynamic";

type NewMatchdayPageProps = {
  params: Promise<{
    leagueId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

function Feedback({ error }: { error?: string }) {
  if (!error) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {error}
    </div>
  );
}

export default async function NewMatchdayPage({
  params,
  searchParams
}: NewMatchdayPageProps) {
  const { leagueId } = await params;
  const { error } = await searchParams;
  const league = await getAdminLeagueMatchdayCreationData(leagueId);

  if (!league) {
    notFound();
  }

  return (
    <AdminShell
      title="Nuova giornata"
      subtitle={`Crea una nuova giornata per la lega ${league.name}.`}
    >
      <Feedback error={error} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Lega: <strong>{league.name}</strong> | Squadre attuali:{" "}
          <strong>{league._count.fantasyTeams}</strong> | Giornate esistenti:{" "}
          <strong>{league._count.matchdays}</strong>
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={createMatchdayAction} className="space-y-4">
          <input type="hidden" name="leagueId" value={league.id} />

          <label className="block space-y-2 text-sm text-slate-700">
            <span className="font-medium">Numero giornata</span>
            <input
              type="number"
              name="number"
              min={1}
              step={1}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Inserisci il numero giornata"
            />
          </label>

          <p className="text-sm text-slate-600">
            La giornata verra creata in stato <strong>DRAFT</strong>.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Crea giornata
            </button>
            <Link
              href="/admin"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Annulla
            </Link>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}
