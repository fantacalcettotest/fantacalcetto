import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAuthenticatedAppUser } from "@/lib/auth/app-user";
import { getUserTeamPageData } from "@/lib/server/me/read-user-data";

export const dynamic = "force-dynamic";

type TeamPageProps = {
  params: Promise<{
    teamId: string;
  }>;
  searchParams: Promise<{
    notice?: string;
  }>;
};

function Feedback({ notice }: { notice?: string }) {
  if (!notice) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      {notice}
    </div>
  );
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { teamId } = await params;
  const { notice } = await searchParams;
  const authContext = await requireAuthenticatedAppUser(`/me/teams/${teamId}`);
  const team = await getUserTeamPageData(teamId);

  if (!team) {
    notFound();
  }

  const canAccess =
    authContext.appUser.role === "ADMIN" ||
    authContext.appUser.id === team.userId;

  if (!canAccess) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
        Accesso non autorizzato.
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <Feedback notice={notice} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{team.name}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Lega: <strong>{team.league.name}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/leagues/${team.league.id}`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Apri lega
            </Link>
            <Link
              href={`/leagues/${team.league.id}/standings`}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Classifica pubblica
            </Link>
          </div>
        </div>
      </section>

      {team.roster.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm">
          La rosa non e ancora stata assegnata.
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Rosa</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">Giocatore</th>
                  <th className="px-3 py-2 font-medium">Squadra reale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.roster.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-3 py-2 text-slate-900">
                      {entry.player.name}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {entry.player.teamName ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
