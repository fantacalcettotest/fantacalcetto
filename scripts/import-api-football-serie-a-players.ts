import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { PlayerRole } from "@prisma/client";

import { prisma } from "../lib/prisma.ts";
import {
  importPlayerList,
  type ImportedPlayerInput
} from "../lib/server/players/import-player-list.ts";

const API_BASE_URL = "https://v3.football.api-sports.io";
const DEFAULT_SERIE_A_LEAGUE_ID = "135";

type ApiFootballEnvelope<T> = {
  errors?: unknown[];
  paging?: {
    current?: number;
    total?: number;
  };
  response?: T[];
  results?: number;
};

type ApiFootballTeamEntry = {
  team?: {
    id?: number;
    name?: string;
  };
};

type ApiFootballStandingsEntry = {
  league?: {
    standings?: Array<
      Array<{
        team?: {
          id?: number;
          name?: string;
        };
      }>
    >;
  };
};

type ApiFootballSquadEntry = {
  players?: Array<{
    id?: number;
    name?: string;
    position?: string | null;
  }>;
  team?: {
    id?: number;
    name?: string;
  };
};

type Config = {
  apiKey: string;
  maxTeamsPerRun: number | null;
  requestDelayMs: number;
  leagueId: string;
  season: string;
  startTeamIndex: number;
};

type PreparedPlayersResult = {
  players: ImportedPlayerInput[];
  skippedCount: number;
};

class ApiFootballRateLimitError extends Error {
  statusCode: number;

  constructor(statusCode: number) {
    super(`API-Football ha risposto con HTTP ${statusCode}.`);
    this.name = "ApiFootballRateLimitError";
    this.statusCode = statusCode;
  }
}

function loadLocalEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const fileContent = readFileSync(envPath, "utf8");

  for (const rawLine of fileContent.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function readConfig(): Config {
  loadLocalEnvFile();

  const apiKey = process.env.API_FOOTBALL_KEY?.trim();
  const season = process.env.API_FOOTBALL_SEASON?.trim();
  const leagueId =
    process.env.API_FOOTBALL_SERIE_A_LEAGUE_ID?.trim() ||
    DEFAULT_SERIE_A_LEAGUE_ID;
  const requestDelayMsRaw =
    process.env.API_FOOTBALL_REQUEST_DELAY_MS?.trim() || "1500";
  const maxTeamsPerRunRaw =
    process.env.API_FOOTBALL_MAX_TEAMS_PER_RUN?.trim() || "";
  const startTeamIndexRaw =
    process.env.API_FOOTBALL_START_TEAM_INDEX?.trim() || "1";
  const requestDelayMs = Number.parseInt(requestDelayMsRaw, 10);
  const maxTeamsPerRun = maxTeamsPerRunRaw
    ? Number.parseInt(maxTeamsPerRunRaw, 10)
    : null;
  const startTeamIndex = Number.parseInt(startTeamIndexRaw, 10);

  if (!apiKey) {
    throw new Error(
      "API_FOOTBALL_KEY non configurata. Aggiungila al file .env prima di eseguire lo script."
    );
  }

  if (!season) {
    throw new Error(
      "API_FOOTBALL_SEASON non configurata. Imposta la stagione nel file .env, ad esempio API_FOOTBALL_SEASON=2025."
    );
  }

  if (!Number.isInteger(requestDelayMs) || requestDelayMs < 0) {
    throw new Error(
      "API_FOOTBALL_REQUEST_DELAY_MS non valida. Usa un intero >= 0."
    );
  }

  if (
    maxTeamsPerRun !== null &&
    (!Number.isInteger(maxTeamsPerRun) || maxTeamsPerRun <= 0)
  ) {
    throw new Error(
      "API_FOOTBALL_MAX_TEAMS_PER_RUN non valida. Usa un intero > 0."
    );
  }

  if (!Number.isInteger(startTeamIndex) || startTeamIndex < 1) {
    throw new Error(
      "API_FOOTBALL_START_TEAM_INDEX non valida. Usa un intero >= 1."
    );
  }

  return {
    apiKey,
    maxTeamsPerRun,
    requestDelayMs,
    leagueId,
    season,
    startTeamIndex
  };
}

async function callApiFootball<T>(
  pathName: string,
  apiKey: string,
  query: Record<string, string>
) {
  const url = new URL(`${API_BASE_URL}${pathName}`);

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey
    },
    method: "GET"
  });

  if (response.status === 429) {
    throw new ApiFootballRateLimitError(429);
  }

  if (!response.ok) {
    throw new Error(`API-Football ha risposto con HTTP ${response.status}.`);
  }

  return (await response.json()) as ApiFootballEnvelope<T>;
}

function mapApiPositionToPlayerRole(position: string | null | undefined) {
  const normalized = position?.trim().toLowerCase();

  switch (normalized) {
    case "goalkeeper":
      return PlayerRole.GOALKEEPER;
    case "defender":
      return PlayerRole.DEFENDER;
    case "midfielder":
      return PlayerRole.MIDFIELDER;
    case "attacker":
      return PlayerRole.ATTACKER;
    default:
      return null;
  }
}

function preparePlayersFromSquads(
  squads: ApiFootballSquadEntry[]
): PreparedPlayersResult {
  const dedupedPlayers = new Map<string, ImportedPlayerInput>();
  let skippedCount = 0;

  for (const squad of squads) {
    const teamName = squad.team?.name?.trim() || null;

    for (const player of squad.players ?? []) {
      const externalId = player.id;
      const name = player.name?.trim();
      const role = mapApiPositionToPlayerRole(player.position);

      if (!externalId || !name || !role) {
        skippedCount += 1;
        continue;
      }

      dedupedPlayers.set(String(externalId), {
        externalId: String(externalId),
        isActive: true,
        name,
        role,
        source: "api-football",
        teamName
      });
    }
  }

  return {
    players: [...dedupedPlayers.values()],
    skippedCount
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const config = readConfig();

  console.log(
    `Import giocatori Serie A da API-Football | leagueId=${config.leagueId} | season=${config.season} | delay=${config.requestDelayMs}ms | startTeamIndex=${config.startTeamIndex}${config.maxTeamsPerRun ? ` | maxTeamsPerRun=${config.maxTeamsPerRun}` : ""}`
  );

  const teamsPayload = await callApiFootball<ApiFootballTeamEntry>("/teams", config.apiKey, {
    league: config.leagueId,
    season: config.season
  });

  let teams = (teamsPayload.response ?? [])
    .map((entry) => ({
      id: entry.team?.id,
      name: entry.team?.name?.trim()
    }))
    .filter((team): team is { id: number; name: string } => Boolean(team.id && team.name));

  if (teams.length === 0) {
    console.log(
      "Endpoint /teams senza risultati utili. Provo fallback su /standings per recuperare gli ID squadra."
    );

    const standingsPayload = await callApiFootball<ApiFootballStandingsEntry>(
      "/standings",
      config.apiKey,
      {
        league: config.leagueId,
        season: config.season
      }
    );

    const dedupedTeams = new Map<number, { id: number; name: string }>();

    for (const leagueEntry of standingsPayload.response ?? []) {
      for (const table of leagueEntry.league?.standings ?? []) {
        for (const row of table) {
          const id = row.team?.id;
          const name = row.team?.name?.trim();

          if (!id || !name) {
            continue;
          }

          dedupedTeams.set(id, { id, name });
        }
      }
    }

    teams = [...dedupedTeams.values()];
  }

  if (teams.length === 0) {
    throw new Error(
      "Nessuna squadra trovata per la lega/stagione richiesta. Verifica API_FOOTBALL_SERIE_A_LEAGUE_ID e API_FOOTBALL_SEASON."
    );
  }

  const totalTeamsFound = teams.length;
  const startOffset = config.startTeamIndex - 1;

  if (startOffset >= totalTeamsFound) {
    throw new Error(
      `API_FOOTBALL_START_TEAM_INDEX fuori range. Squadre disponibili: ${totalTeamsFound}.`
    );
  }

  const endExclusive =
    config.maxTeamsPerRun === null
      ? totalTeamsFound
      : Math.min(startOffset + config.maxTeamsPerRun, totalTeamsFound);

  const processedRangeStart = startOffset + 1;
  const processedRangeEnd = endExclusive;

  teams = teams.slice(startOffset, endExclusive);

  console.log(
    `Squadre trovate: ${totalTeamsFound} | Range processato: ${processedRangeStart}-${processedRangeEnd} | Squadre in questa run: ${teams.length}`
  );
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let total = 0;
  let processedTeams = 0;

  for (let index = 0; index < teams.length; index += 1) {
    const team = teams[index];
    console.log(
      `Recupero rosa ${processedRangeStart + index}/${totalTeamsFound} (${index + 1}/${teams.length} nella run): ${team.name}`
    );

    try {
      const squadPayload = await callApiFootball<ApiFootballSquadEntry>(
        "/players/squads",
        config.apiKey,
        {
          team: String(team.id)
        }
      );

      const prepared = preparePlayersFromSquads(squadPayload.response ?? []);
      const importResult =
        prepared.players.length > 0
          ? await importPlayerList(prepared.players)
          : { createdCount: 0, total: 0, updatedCount: 0 };

      processedTeams += 1;
      created += importResult.createdCount;
      updated += importResult.updatedCount;
      skipped += prepared.skippedCount;
      total += importResult.total;

      console.log(
        `Squadra completata: ${team.name} | created=${importResult.createdCount} updated=${importResult.updatedCount} skipped=${prepared.skippedCount} total=${importResult.total}`
      );
    } catch (error) {
      if (error instanceof ApiFootballRateLimitError) {
        console.error(
          `Rate limit API-Football raggiunto (HTTP 429). Squadre processate con successo: ${processedTeams}/${teams.length}.`
        );
        console.log(
          `Import parziale salvato. created=${created} updated=${updated} skipped=${skipped} total=${total}`
        );
        return;
      }

      throw error;
    }

    if (index < teams.length - 1 && config.requestDelayMs > 0) {
      await sleep(config.requestDelayMs);
    }
  }

  console.log(
    `Import API-Football completato. created=${created} updated=${updated} skipped=${skipped} total=${total}`
  );
}

main()
  .catch((error) => {
    const message =
      error instanceof Error ? error.message : "Errore sconosciuto.";
    console.error(`Errore durante l'import API-Football Serie A: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
