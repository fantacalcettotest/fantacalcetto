import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const API_BASE_URL = "https://v3.football.api-sports.io";

type ApiFootballEnvelope<T> = {
  errors?: unknown[];
  get?: string;
  paging?: {
    current?: number;
    total?: number;
  };
  parameters?: Record<string, unknown>;
  response?: T[];
  results?: number;
};

type StatusResponse = {
  account?: {
    firstname?: string;
    lastname?: string;
  };
  requests?: {
    current?: number;
    limit_day?: number;
  };
  subscription?: {
    active?: boolean;
    end?: string;
    plan?: string;
  };
};

type LeagueResponse = {
  country?: {
    code?: string | null;
    flag?: string | null;
    name?: string;
  };
  league?: {
    id?: number;
    logo?: string | null;
    name?: string;
    type?: string;
  };
  seasons?: Array<{
    current?: boolean;
    end?: number;
    start?: number;
    year?: number;
  }>;
};

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

function ensureApiKey() {
  const apiKey = process.env.API_FOOTBALL_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "API_FOOTBALL_KEY non configurata. Aggiungila al file .env prima di eseguire lo script."
    );
  }

  return apiKey;
}

async function callApiFootball<T>(
  path: string,
  apiKey: string,
  query?: Record<string, string>
) {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey
    },
    method: "GET"
  });

  if (!response.ok) {
    throw new Error(`API-Football ha risposto con HTTP ${response.status}.`);
  }

  return (await response.json()) as ApiFootballEnvelope<T>;
}

function formatSeasonYears(seasons: LeagueResponse["seasons"]) {
  if (!seasons || seasons.length === 0) {
    return "non disponibili";
  }

  return seasons
    .map((season) => `${season.year ?? "?"}${season.current ? " (current)" : ""}`)
    .join(", ");
}

function pickSerieALeague(leagues: LeagueResponse[]) {
  return (
    leagues.find(
      (entry) =>
        entry.league?.name?.toLowerCase() === "serie a" &&
        entry.country?.name?.toLowerCase() === "italy"
    ) ??
    leagues.find((entry) => entry.league?.name?.toLowerCase() === "serie a") ??
    null
  );
}

async function main() {
  loadLocalEnvFile();
  const apiKey = ensureApiKey();

  console.log("Verifica connessione API-Football...");

  const statusPayload = await callApiFootball<StatusResponse>("/status", apiKey);
  const status = statusPayload.response?.[0];

  if (status) {
    const accountName = [status.account?.firstname, status.account?.lastname]
      .filter(Boolean)
      .join(" ")
      .trim();

    console.log(
      `Account: ${accountName || "non disponibile"} | Piano: ${status.subscription?.plan ?? "non disponibile"} | Attivo: ${status.subscription?.active ? "si" : "no"}`
    );
    console.log(
      `Requests: ${status.requests?.current ?? "?"} / ${status.requests?.limit_day ?? "?"}`
    );
  } else {
    console.log("Status account/requests non disponibile nella risposta.");
  }

  const leaguesPayload = await callApiFootball<LeagueResponse>("/leagues", apiKey, {
    search: "Serie A"
  });
  const serieA = pickSerieALeague(leaguesPayload.response ?? []);

  if (!serieA) {
    console.log("Competizione Serie A non trovata con la ricerca corrente.");
    return;
  }

  console.log(
    `Serie A trovata: id=${serieA.league?.id ?? "?"} | paese=${serieA.country?.name ?? "?"} | tipo=${serieA.league?.type ?? "?"}`
  );
  console.log(`Seasons: ${formatSeasonYears(serieA.seasons)}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Errore sconosciuto.";
  console.error(`Check API-Football fallito: ${message}`);
  process.exitCode = 1;
});
