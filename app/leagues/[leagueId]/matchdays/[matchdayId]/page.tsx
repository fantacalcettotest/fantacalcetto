import { ScorePlayerFinalType } from "@prisma/client";
import { notFound } from "next/navigation";

import { getFixtureAdminNote, getFixtureForfeitOutcome } from "@/lib/server/fixtures/fixture-forfeit";
import { getPublicMatchdayData } from "@/lib/server/public/read-public-league-data";

export const dynamic = "force-dynamic";

type PublicMatchdayPageProps = {
  params: Promise<{
    leagueId: string;
    matchdayId: string;
  }>;
};

const DETAIL_LABELS: Record<ScorePlayerFinalType, string> = {
  AUTO_SUB_IN: "Entrato dalla panchina",
  BENCH_UNUSED: "Panchina non usata",
  REPLACED_BY_BENCH: "Sostituito",
  STARTER_PLAYED: "Titolare",
  SV_NOT_REPLACED: "SV non sostituito"
};

const SLOT_LABELS = {
  BENCH: "Panchina",
  STARTER: "Titolare"
} as const;

const MATCHDAY_STATUS_LABELS = {
  LOCKED: "Bloccata",
  PUBLISHED: "Pubblicata"
} as const;

function formatScore(value: number | null) {
  if (value === null) {
    return "-";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function getDetailDescription(player: {
  finalType: ScorePlayerFinalType;
  replacedLineupPlayer: {
    id: string;
    player: {
      id: string;
      name: string;
    };
  } | null;
}) {
  if (
    player.finalType === ScorePlayerFinalType.AUTO_SUB_IN &&
    player.replacedLineupPlayer
  ) {
    return `Entra al posto di ${player.replacedLineupPlayer.player.name}`;
  }

  if (
    player.finalType === ScorePlayerFinalType.REPLACED_BY_BENCH &&
    player.replacedLineupPlayer
  ) {
    return `Sostituisce ${player.replacedLineupPlayer.player.name}`;
  }

  if (player.finalType === ScorePlayerFinalType.REPLACED_BY_BENCH) {
    return "Il titolare viene sostituito da un panchinaro valido.";
  }

  if (player.finalType === ScorePlayerFinalType.SV_NOT_REPLACED) {
    return "Il giocatore vale 0 per mancanza di sostituto valido.";
  }

  if (player.finalType === ScorePlayerFinalType.BENCH_UNUSED) {
    return "Rimasto in panchina senza entrare.";
  }

  if (player.finalType === ScorePlayerFinalType.STARTER_PLAYED) {
    return "Titolare con voto valido.";
  }

  return null;
}

export default async function PublicMatchdayPage({
  params
}: PublicMatchdayPageProps) {
  const { leagueId, matchdayId } = await params;
  const data = await getPublicMatchdayData(leagueId, matchdayId);

  if (!data) {
    notFound();
  }

  if (!data.isPublic) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
        Giornata non disponibile.
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          Giornata {data.matchday.number}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Stato:{" "}
          <strong>
            {
              MATCHDAY_STATUS_LABELS[
                data.matchday.status as keyof typeof MATCHDAY_STATUS_LABELS
              ]
            }
          </strong>{" "}
          | Team score:{" "}
          <strong>{data.matchday.teamScores.length}</strong> | Scontri pubblicati:{" "}
          <strong>{data.matchday.fixtures.length}</strong>
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Scontri diretti</h2>
        <p className="mt-2 text-sm text-slate-600">
          Sono mostrati solo gli scontri pubblicati.
        </p>

        {data.matchday.fixtures.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Nessuno scontro diretto pubblicato per questa giornata.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {data.matchday.fixtures.map((fixture) => (
              (() => {
                const forfeitOutcome = getFixtureForfeitOutcome({
                  awayTeamScoreId: fixture.awayTeamScore?.id ?? null,
                  homeTeamScoreId: fixture.homeTeamScore?.id ?? null
                });
                const fixtureNote = getFixtureAdminNote(forfeitOutcome);

                return (
                  <article
                    key={fixture.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="text-lg font-semibold text-slate-900">
                      {fixture.homeTeam.name} {fixture.homeGoals ?? "-"} -{" "}
                      {fixture.awayGoals ?? "-"} {fixture.awayTeam.name}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Fantapunti: {fixture.homeTeam.name}{" "}
                      <strong>{formatScore(fixture.homeTeamScore?.totalScore ?? null)}</strong>{" "}
                      | {fixture.awayTeam.name}{" "}
                      <strong>{formatScore(fixture.awayTeamScore?.totalScore ?? null)}</strong>
                    </p>
                    {fixtureNote ? (
                      <p className="mt-2 text-sm text-amber-700">{fixtureNote}</p>
                    ) : null}
                  </article>
                );
              })()
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Team score</h2>
          <p className="mt-2 text-sm text-slate-600">
            Dettaglio fantapunti, sostituzioni automatiche e panchina non usata.
          </p>
        </div>

        {data.matchday.teamScores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Nessun punteggio pubblicato per questa giornata.
          </div>
        ) : (
          data.matchday.teamScores.map((teamScore) => (
            <section
              key={teamScore.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {teamScore.fantasyTeam.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Fantapunti: <strong>{formatScore(teamScore.totalScore)}</strong> |
                    Sostituzioni automatiche:{" "}
                    <strong>{teamScore.autoSubsUsed}</strong>
                  </p>
                </div>

                <p className="text-sm text-slate-600">
                  Pubblicato:{" "}
                  <strong>
                    {teamScore.publishedAt
                      ? new Date(teamScore.publishedAt).toLocaleString("it-IT")
                      : "no"}
                  </strong>
                </p>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="px-3 py-2 font-medium">Giocatore</th>
                      <th className="px-3 py-2 font-medium">Esito</th>
                      <th className="px-3 py-2 font-medium">Dettaglio</th>
                      <th className="px-3 py-2 font-medium">Slot</th>
                      <th className="px-3 py-2 font-medium">Ordine</th>
                      <th className="px-3 py-2 font-medium">Conta</th>
                      <th className="px-3 py-2 font-medium">Fantavoto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamScore.players.map((player) => (
                      <tr key={player.id}>
                        <td className="px-3 py-2 text-slate-900">
                          {player.player.name}
                        </td>
                        <td className="px-3 py-2 text-slate-900">
                          {DETAIL_LABELS[player.finalType]}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {getDetailDescription(player) ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {SLOT_LABELS[player.slotType]}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {player.positionOrder}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {player.countsForScore ? "Si" : "No"}
                        </td>
                        <td className="px-3 py-2 text-slate-900">
                          {formatScore(player.finalFantavote)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </section>
    </div>
  );
}
