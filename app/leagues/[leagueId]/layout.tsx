import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { getPublicLeagueLayoutData } from "@/lib/server/public/read-public-league-data";

export const dynamic = "force-dynamic";

type PublicLeagueLayoutProps = {
  children: ReactNode;
  params: Promise<{
    leagueId: string;
  }>;
};

export default async function PublicLeagueLayout({
  children,
  params
}: PublicLeagueLayoutProps) {
  const { leagueId } = await params;
  const league = await getPublicLeagueLayoutData(leagueId);

  if (!league) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-pitch to-emerald-700 px-6 py-8 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-100">
                Fantacalcetto
              </p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                {league.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-emerald-50 sm:text-base">
                Area partecipanti in sola lettura con classifica, giornate
                pubblicate, risultati e scontri diretti.
              </p>
            </div>

            <nav className="flex flex-wrap gap-3">
              <Link
                href={`/leagues/${league.id}`}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                Home lega
              </Link>
              <Link
                href={`/leagues/${league.id}/standings`}
                className="rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Classifica
              </Link>
            </nav>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
