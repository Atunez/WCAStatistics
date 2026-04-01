import { leaderboardGeneratedAt, leaderboardSnapshot } from '#/data/leaderboard-snapshot'
import { buildCompetitionCatalog, extractUsStateFromCompetition } from './wca-coverage'
import { getPersonByWcaId, getUsCompetitionCatalog } from './wca-source'
import { US_STATES } from './us-states'
import type {
  CompetitionSummary,
  LeaderboardEntry,
  StateCoverage,
  WcaCompetition,
  WcaPerson,
} from './wca-types'

const RAW_BASE =
  'https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/master/api'
const US_COMPETITIONS_URL = `${RAW_BASE}/competitions/US.json`
const WCA_COMPETITION_URL = 'https://www.worldcubeassociation.org/competitions'

type CompetitionCatalog = ReturnType<typeof buildCompetitionCatalog>

export type UpcomingCompetitionSnapshot = {
  status: 'ok' | 'degraded'
  competitionsByState: Partial<Record<string, CompetitionSummary[]>>
  fetchedAt: string
  sourceItemCount: number
  error?: string
}

export type CompetitorPageData = {
  competitor: {
    wcaId: string
    name: string
    countryCode: string
    totalCompetitions: number
  } | null
  visitedStatesCount: number
  totalStates: number
  visitedStates: StateCoverage[]
  unvisitedStates: StateCoverage[]
  historicalSourceUpdatedAt: string | null
  upcomingSourceUpdatedAt: string | null
  upcomingStatus: UpcomingCompetitionSnapshot['status']
  upcomingError?: string
}

function compareAsc(a: CompetitionSummary, b: CompetitionSummary) {
  return a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id)
}

function compareDesc(a: CompetitionSummary, b: CompetitionSummary) {
  return compareAsc(b, a)
}

function buildUpcomingCompetitionSnapshotFromCompetitions(
  competitions: WcaCompetition[],
  todayIso = new Date().toISOString().slice(0, 10),
  fetchedAt = new Date().toISOString(),
): UpcomingCompetitionSnapshot {
  const competitionsByState: Partial<Record<string, CompetitionSummary[]>> = {}

  for (const competition of competitions) {
    if (competition.country !== 'US' || competition.isCanceled) {
      continue
    }

    if (competition.date.from < todayIso) {
      continue
    }

    const state = extractUsStateFromCompetition(competition)
    if (!state) {
      continue
    }

    const stateBucket = competitionsByState[state.code] ?? []
    stateBucket.push({
      id: competition.id,
      name: competition.name,
      city: competition.city,
      stateCode: state.code,
      stateName: state.name,
      startDate: competition.date.from,
      endDate: competition.date.till,
      wcaUrl: `${WCA_COMPETITION_URL}/${competition.id}`,
    })
    competitionsByState[state.code] = stateBucket
  }

  for (const [stateCode, items] of Object.entries(competitionsByState)) {
    if (!items) {
      continue
    }
    competitionsByState[stateCode] = items.sort(compareAsc).slice(0, 3)
  }

  return {
    status: 'ok',
    competitionsByState,
    fetchedAt,
    sourceItemCount: competitions.length,
  }
}

export async function getUpcomingCompetitionSnapshot(): Promise<UpcomingCompetitionSnapshot> {
  const fetchedAt = new Date().toISOString()

  try {
    const response = await fetch(US_COMPETITIONS_URL, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return {
        status: 'degraded',
        competitionsByState: {},
        fetchedAt,
        sourceItemCount: 0,
        error: `Unexpected upcoming feed status: ${response.status}`,
      }
    }

    const payload = (await response.json()) as { items: WcaCompetition[] }
    return buildUpcomingCompetitionSnapshotFromCompetitions(
      payload.items,
      fetchedAt.slice(0, 10),
      fetchedAt,
    )
  } catch (error) {
    return {
      status: 'degraded',
      competitionsByState: {},
      fetchedAt,
      sourceItemCount: 0,
      error: error instanceof Error ? error.message : 'Unknown upcoming feed error',
    }
  }
}

function makeStateCoverage(
  stateCode: string,
  catalog: CompetitionCatalog,
  upcomingCompetitionsByState: Partial<Record<string, CompetitionSummary[]>>,
): StateCoverage {
  const state = US_STATES.find((entry) => entry.code === stateCode)
  const historicalBucket = catalog.byStateCode.get(stateCode)

  return {
    stateCode,
    stateName: state?.name ?? stateCode,
    recentCompetitions:
      historicalBucket?.recentCompetitions.slice().sort(compareDesc).slice(0, 3) ?? [],
    upcomingCompetitions:
      upcomingCompetitionsByState[stateCode]?.slice().sort(compareAsc).slice(0, 3) ?? [],
  }
}

export function buildCompetitorPageData(
  person: WcaPerson | null,
  catalog: CompetitionCatalog,
  upcomingSnapshot: UpcomingCompetitionSnapshot,
): CompetitorPageData {
  if (!person) {
    return {
      competitor: null,
      visitedStatesCount: 0,
      totalStates: US_STATES.length,
      visitedStates: [],
      unvisitedStates: US_STATES.map((state) =>
        makeStateCoverage(state.code, catalog, upcomingSnapshot.competitionsByState),
      ),
      historicalSourceUpdatedAt: catalog.sourceUpdatedAt,
      upcomingSourceUpdatedAt: upcomingSnapshot.fetchedAt,
      upcomingStatus: upcomingSnapshot.status,
      upcomingError: upcomingSnapshot.error,
    }
  }

  const visitedStates = new Set<string>()
  for (const competitionId of person.competitionIds) {
    const competition = catalog.byCompetitionId.get(competitionId)
    if (competition) {
      visitedStates.add(competition.stateCode)
    }
  }

  const visitedStateCodes = [...visitedStates].sort((a, b) => a.localeCompare(b))
  const unvisitedStateCodes = US_STATES.map((state) => state.code).filter(
    (stateCode) => !visitedStates.has(stateCode),
  )

  return {
    competitor: {
      wcaId: person.id,
      name: person.name,
      countryCode: person.country,
      totalCompetitions: person.numberOfCompetitions,
    },
    visitedStatesCount: visitedStateCodes.length,
    totalStates: US_STATES.length,
    visitedStates: visitedStateCodes.map((stateCode) =>
      makeStateCoverage(stateCode, catalog, upcomingSnapshot.competitionsByState),
    ),
    unvisitedStates: unvisitedStateCodes.map((stateCode) =>
      makeStateCoverage(stateCode, catalog, upcomingSnapshot.competitionsByState),
    ),
    historicalSourceUpdatedAt: catalog.sourceUpdatedAt,
    upcomingSourceUpdatedAt: upcomingSnapshot.fetchedAt,
    upcomingStatus: upcomingSnapshot.status,
    upcomingError: upcomingSnapshot.error,
  }
}

export async function getCompetitorPageData(
  wcaId: string,
): Promise<CompetitorPageData> {
  const [person, catalog, upcomingSnapshot] = await Promise.all([
    getPersonByWcaId(wcaId),
    getUsCompetitionCatalog(),
    getUpcomingCompetitionSnapshot(),
  ])

  return buildCompetitorPageData(person, catalog, upcomingSnapshot)
}

export function getLeaderboardEntries(limit = 100): LeaderboardEntry[] {
  return leaderboardSnapshot.slice(0, limit)
}

export function getLeaderboardGeneratedAt() {
  return leaderboardGeneratedAt
}
