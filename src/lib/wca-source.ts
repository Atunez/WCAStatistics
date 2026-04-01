import {
  buildCompetitionCatalog,
  buildCompetitorCoverageView,
} from "./wca-coverage";
import type { CompetitorCoverageView, WcaCompetition, WcaPerson } from "./wca-types";

const RAW_BASE =
  "https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/master/api";
const PERSON_URL = (wcaId: string) => `${RAW_BASE}/persons/${wcaId.toUpperCase()}.json`;
const US_COMPETITIONS_URL = `${RAW_BASE}/competitions/US.json`;

let competitionCatalogPromise:
  | Promise<ReturnType<typeof buildCompetitionCatalog>>
  | undefined;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return (await response.json()) as T;
}

export async function getUsCompetitionCatalog() {
  if (!competitionCatalogPromise) {
    competitionCatalogPromise = fetchJson<{ items: WcaCompetition[] }>(US_COMPETITIONS_URL).then(
      (payload) => buildCompetitionCatalog(payload.items, undefined, new Date().toISOString()),
    );
  }

  return competitionCatalogPromise;
}

export async function getPersonByWcaId(wcaId: string) {
  const normalized = wcaId.trim().toUpperCase();
  const response = await fetch(PERSON_URL(normalized), {
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Unable to fetch competitor ${normalized}.`);
  }

  return (await response.json()) as WcaPerson;
}

export async function getCompetitorCoverageByWcaId(
  wcaId: string,
): Promise<CompetitorCoverageView | null> {
  const [person, competitionCatalog] = await Promise.all([
    getPersonByWcaId(wcaId),
    getUsCompetitionCatalog(),
  ]);

  if (!person) {
    return null;
  }

  return buildCompetitorCoverageView(person, competitionCatalog);
}
