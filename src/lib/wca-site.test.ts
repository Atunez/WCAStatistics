import { describe, expect, it } from 'vitest'
import { buildCompetitionCatalog } from './wca-coverage'
import { buildCompetitorPageData } from './wca-site'
import type { WcaCompetition, WcaPerson } from './wca-types'

const competitions: WcaCompetition[] = [
  {
    id: 'TexasOpen2024',
    name: 'Texas Open 2024',
    city: 'Houston, Texas',
    country: 'US',
    date: { from: '2024-04-14', till: '2024-04-14', numberOfDays: 1 },
    isCanceled: false,
    venue: { address: '123 Main St, Houston, TX 77001' },
  },
  {
    id: 'NevadaClassic2023',
    name: 'Nevada Classic 2023',
    city: 'Reno, Nevada',
    country: 'US',
    date: { from: '2023-08-12', till: '2023-08-13', numberOfDays: 2 },
    isCanceled: false,
    venue: { address: '500 Center St, Reno, NV 89501' },
  },
  {
    id: 'FloridaFuture2026',
    name: 'Florida Future 2026',
    city: 'Miami, Florida',
    country: 'US',
    date: { from: '2026-06-01', till: '2026-06-01', numberOfDays: 1 },
    isCanceled: false,
    venue: { address: '1 Ocean Rd, Miami, FL 33101' },
  },
]

const person: WcaPerson = {
  id: '2010ALFA01',
  name: 'Alpha',
  country: 'US',
  numberOfCompetitions: 2,
  competitionIds: ['TexasOpen2024', 'NevadaClassic2023'],
}

describe('buildCompetitorPageData', () => {
  it('partitions visited and unvisited states while attaching upcoming competitions', () => {
    const catalog = buildCompetitionCatalog(
      competitions,
      '2025-01-01',
      '2025-01-02T00:00:00.000Z',
    )

    const pageData = buildCompetitorPageData(person, catalog, {
      status: 'ok',
      fetchedAt: '2025-01-03T00:00:00.000Z',
      sourceItemCount: 1,
      competitionsByState: {
        FL: [
          {
            id: 'FloridaFuture2026',
            name: 'Florida Future 2026',
            city: 'Miami, Florida',
            stateCode: 'FL',
            stateName: 'Florida',
            startDate: '2026-06-01',
            endDate: '2026-06-01',
            wcaUrl:
              'https://www.worldcubeassociation.org/competitions/FloridaFuture2026',
          },
        ],
      },
    })

    expect(pageData.visitedStatesCount).toBe(2)
    expect(pageData.visitedStates.map((state) => state.stateCode)).toEqual([
      'NV',
      'TX',
    ])
    expect(
      pageData.unvisitedStates.find((state) => state.stateCode === 'FL')
        ?.upcomingCompetitions[0]?.id,
    ).toBe('FloridaFuture2026')
  })

  it('keeps historical coverage when upcoming data is degraded', () => {
    const catalog = buildCompetitionCatalog(
      competitions,
      '2025-01-01',
      '2025-01-02T00:00:00.000Z',
    )

    const pageData = buildCompetitorPageData(person, catalog, {
      status: 'degraded',
      fetchedAt: '2025-01-03T00:00:00.000Z',
      sourceItemCount: 0,
      competitionsByState: {},
      error: 'boom',
    })

    expect(pageData.upcomingStatus).toBe('degraded')
    expect(pageData.upcomingError).toBe('boom')
    expect(pageData.visitedStatesCount).toBe(2)
    expect(
      pageData.visitedStates.find((state) => state.stateCode === 'TX')
        ?.recentCompetitions[0]?.id,
    ).toBe('TexasOpen2024')
    expect(
      pageData.unvisitedStates.find((state) => state.stateCode === 'FL')
        ?.upcomingCompetitions,
    ).toEqual([])
  })
})
