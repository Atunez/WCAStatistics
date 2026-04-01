import { US_STATES, normalizeUsState } from "./us-states";
import type {
  CompetitionSummary,
  CompetitorCoverageView,
  LeaderboardEntry,
  StateCoverage,
  WcaCompetition,
  WcaPerson,
} from "./wca-types";

type NormalizedCompetition = CompetitionSummary & {
  isUpcoming: boolean;
};

type StateCompetitionCatalog = {
  byCompetitionId: Map<string, NormalizedCompetition>;
  byStateCode: Map<
    string,
    {
      recentCompetitions: CompetitionSummary[];
      upcomingCompetitions: CompetitionSummary[];
    }
  >;
  sourceUpdatedAt: string;
};

const WCA_COMPETITION_URL = "https://www.worldcubeassociation.org/competitions";

function compareAsc(a: CompetitionSummary, b: CompetitionSummary) {
  return a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id);
}

function compareDesc(a: CompetitionSummary, b: CompetitionSummary) {
  return compareAsc(b, a);
}

export function extractUsStateFromCompetition(competition: WcaCompetition) {
  const locationTokens = [competition.city, competition.venue?.address]
    .filter(Boolean)
    .flatMap((value) => `${value}`.split(","));

  for (const token of locationTokens.reverse()) {
    const normalized = normalizeUsState(token);
    if (normalized) {
      return normalized;
    }
  }

  const address = competition.venue?.address ?? "";
  const abbreviationMatch = address.match(/\b([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/);
  if (abbreviationMatch) {
    return normalizeUsState(abbreviationMatch[1]);
  }

  return null;
}

export function buildCompetitionCatalog(
  competitions: WcaCompetition[],
  todayIso = new Date().toISOString().slice(0, 10),
  sourceUpdatedAt = new Date().toISOString(),
): StateCompetitionCatalog {
  const normalized = competitions
    .filter((competition) => competition.country === "US" && !competition.isCanceled)
    .map((competition) => {
      const state = extractUsStateFromCompetition(competition);
      if (!state) {
        return null;
      }

      return {
        id: competition.id,
        name: competition.name,
        city: competition.city,
        stateCode: state.code,
        stateName: state.name,
        startDate: competition.date.from,
        endDate: competition.date.till,
        wcaUrl: `${WCA_COMPETITION_URL}/${competition.id}`,
        isUpcoming: competition.date.from >= todayIso,
      } satisfies NormalizedCompetition;
    })
    .filter((competition): competition is NormalizedCompetition => Boolean(competition));

  const byCompetitionId = new Map(normalized.map((competition) => [competition.id, competition]));
  const byStateCode = new Map(
    US_STATES.map((state) => [
      state.code,
      { recentCompetitions: [] as CompetitionSummary[], upcomingCompetitions: [] as CompetitionSummary[] },
    ]),
  );

  for (const competition of normalized) {
    const stateBucket = byStateCode.get(competition.stateCode);
    if (!stateBucket) {
      continue;
    }

    if (competition.isUpcoming) {
      stateBucket.upcomingCompetitions.push(competition);
    } else {
      stateBucket.recentCompetitions.push(competition);
    }
  }

  for (const bucket of byStateCode.values()) {
    bucket.recentCompetitions.sort(compareDesc);
    bucket.upcomingCompetitions.sort(compareAsc);
  }

  return {
    byCompetitionId,
    byStateCode,
    sourceUpdatedAt,
  };
}

function makeStateCoverage(
  stateCode: string,
  catalog: StateCompetitionCatalog,
): StateCoverage {
  const stateBucket = catalog.byStateCode.get(stateCode);
  const state = normalizeUsState(stateCode);

  return {
    stateCode,
    stateName: state?.name ?? stateCode,
    recentCompetitions: stateBucket?.recentCompetitions.slice(0, 3) ?? [],
    upcomingCompetitions: stateBucket?.upcomingCompetitions.slice(0, 3) ?? [],
  };
}

export function buildCompetitorCoverageView(
  person: WcaPerson,
  catalog: StateCompetitionCatalog,
): CompetitorCoverageView {
  const visitedStates = new Set<string>();

  for (const competitionId of person.competitionIds) {
    const competition = catalog.byCompetitionId.get(competitionId);
    if (competition) {
      visitedStates.add(competition.stateCode);
    }
  }

  const visitedStateCodes = [...visitedStates].sort((a, b) => a.localeCompare(b));
  const unvisitedStateCodes = US_STATES.map((state) => state.code).filter(
    (stateCode) => !visitedStates.has(stateCode),
  );

  return {
    competitor: {
      wcaId: person.id,
      name: person.name,
      countryCode: person.country,
      totalCompetitions: person.numberOfCompetitions,
    },
    visitedStatesCount: visitedStateCodes.length,
    visitedStates: visitedStateCodes.map((stateCode) => makeStateCoverage(stateCode, catalog)),
    unvisitedStates: unvisitedStateCodes.map((stateCode) => makeStateCoverage(stateCode, catalog)),
    sourceUpdatedAt: catalog.sourceUpdatedAt,
  };
}

export function countVisitedStates(
  person: Pick<WcaPerson, "competitionIds">,
  catalog: StateCompetitionCatalog,
) {
  const visited = new Set<string>();
  for (const competitionId of person.competitionIds) {
    const competition = catalog.byCompetitionId.get(competitionId);
    if (competition) {
      visited.add(competition.stateCode);
    }
  }

  return visited.size;
}

export function rankLeaderboard(
  people: WcaPerson[],
  catalog: StateCompetitionCatalog,
  limit = 100,
): LeaderboardEntry[] {
  return people
    .map((person) => ({
      wcaId: person.id,
      name: person.name,
      countryCode: person.country,
      totalCompetitions: person.numberOfCompetitions,
      visitedStatesCount: countVisitedStates(person, catalog),
    }))
    .filter((entry) => entry.visitedStatesCount > 0)
    .sort(
      (a, b) =>
        b.visitedStatesCount - a.visitedStatesCount || a.wcaId.localeCompare(b.wcaId),
    )
    .slice(0, limit)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
}
