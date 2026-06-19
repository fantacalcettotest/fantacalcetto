import Link from "next/link";

import { createLeagueAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

type NewLeaguePageProps = {
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

export default async function NewLeaguePage({
  searchParams
}: NewLeaguePageProps) {
  const { error } = await searchParams;

  return (
    <AdminShell
      title="Nuova lega"
      subtitle="Crea una lega impostando nome e numero massimo di squadre."
    >
      <Feedback error={error} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={createLeagueAction} className="space-y-4">
          <label className="block space-y-2 text-sm text-slate-700">
            <span className="font-medium">Nome lega</span>
            <input
              type="text"
              name="name"
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Inserisci il nome della lega"
            />
          </label>

          <label className="block space-y-2 text-sm text-slate-700">
            <span className="font-medium">Numero massimo squadre</span>
            <input
              type="number"
              name="maxTeams"
              min={2}
              max={50}
              step={1}
              defaultValue={8}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </label>

          <p className="text-sm text-slate-600">
            Il numero massimo di squadre deve essere un intero, minimo 2 e massimo 50.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Crea lega
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
