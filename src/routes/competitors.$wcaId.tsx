import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { StateCard } from '#/components/state-card'
import { getCompetitorPageData } from '#/lib/wca-site'

const loadCompetitorPage = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { wcaId: string }) => data)
  .handler(async ({ data }) => getCompetitorPageData(data.wcaId))

export const Route = createFileRoute('/competitors/$wcaId')({
  loader: async ({ params }) =>
    loadCompetitorPage({
      data: { wcaId: params.wcaId },
    }),
  component: CompetitorPage,
})

function normalizeWcaId(value: string) {
  return value.trim().toUpperCase()
}

function isValidWcaId(value: string) {
  return /^\d{4}[A-Z]{4}\d{2}$/.test(value)
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Unavailable'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value))
}

function CompetitorPage() {
  const navigate = useNavigate()
  const params = Route.useParams()
  const data = Route.useLoaderData()
  const [wcaId, setWcaId] = useState(params.wcaId)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalized = normalizeWcaId(wcaId)
    if (!isValidWcaId(normalized)) {
      setError('Enter a valid WCA ID like 2013FELI01.')
      return
    }

    setError(null)
    void navigate({
      to: '/competitors/$wcaId',
      params: { wcaId: normalized },
    })
  }

  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="island-kicker mb-3">Competitor lookup</p>
            <h1 className="display-title m-0 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
              {data.competitor ? data.competitor.name : 'Competitor not found'}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sea-ink-soft)]">
              {data.competitor
                ? `${data.competitor.wcaId} has visited ${data.visitedStatesCount} of ${data.totalStates} U.S. states in the current dataset.`
                : `We could not find ${params.wcaId.toUpperCase()} in the current WCA source. Try another ID from the homepage search.`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-3">
            <label htmlFor="competitor-search" className="sr-only">
              Search another WCA ID
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="competitor-search"
                value={wcaId}
                onChange={(event) => setWcaId(event.target.value)}
                placeholder="Search another WCA ID"
                className="h-12 flex-1 rounded-2xl border border-[var(--line)] bg-white/80 px-4 text-base text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon-deep)]"
              />
              <button
                type="submit"
                className="rounded-2xl bg-[linear-gradient(135deg,var(--lagoon-deep),var(--lagoon))] px-6 py-3 text-sm font-semibold text-white"
              >
                Search
              </button>
            </div>
            {error ? (
              <p className="m-0 text-sm font-medium text-[var(--palm)]">{error}</p>
            ) : null}
          </form>
        </div>
      </section>

      {data.competitor ? (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="island-shell rounded-2xl p-5">
              <p className="island-kicker mb-2">Visited states</p>
              <p className="m-0 text-4xl font-bold text-[var(--sea-ink)]">
                {data.visitedStatesCount}
              </p>
            </article>
            <article className="island-shell rounded-2xl p-5">
              <p className="island-kicker mb-2">Remaining states</p>
              <p className="m-0 text-4xl font-bold text-[var(--sea-ink)]">
                {data.unvisitedStates.length}
              </p>
            </article>
            <article className="island-shell rounded-2xl p-5">
              <p className="island-kicker mb-2">Total competitions</p>
              <p className="m-0 text-4xl font-bold text-[var(--sea-ink)]">
                {data.competitor.totalCompetitions}
              </p>
            </article>
            <article className="island-shell rounded-2xl p-5">
              <p className="island-kicker mb-2">Country</p>
              <p className="m-0 text-4xl font-bold text-[var(--sea-ink)]">
                {data.competitor.countryCode}
              </p>
            </article>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-2">
            <article className="island-shell rounded-2xl p-5 text-sm text-[var(--sea-ink-soft)]">
              <p className="island-kicker mb-2">Historical coverage source</p>
              <p className="m-0">Updated {formatTimestamp(data.historicalSourceUpdatedAt)} UTC</p>
            </article>
            <article className="island-shell rounded-2xl p-5 text-sm text-[var(--sea-ink-soft)]">
              <p className="island-kicker mb-2">Upcoming competition source</p>
              <p className="m-0">
                {data.upcomingStatus === 'ok'
                  ? `Updated ${formatTimestamp(data.upcomingSourceUpdatedAt)} UTC`
                  : 'Temporarily unavailable — historical state coverage still reflects official participation.'}
              </p>
              {data.upcomingError ? <p className="mb-0 mt-2">{data.upcomingError}</p> : null}
            </article>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="island-kicker mb-2">Visited</p>
                <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
                  States already completed
                </h2>
              </div>
              <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
                {data.visitedStates.length} states
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {data.visitedStates.map((coverage) => (
                <StateCard key={coverage.stateCode} coverage={coverage} variant="visited" />
              ))}
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="island-kicker mb-2">Unvisited</p>
                <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
                  States still remaining
                </h2>
              </div>
              <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
                {data.unvisitedStates.length} states
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {data.unvisitedStates.map((coverage) => (
                <StateCard key={coverage.stateCode} coverage={coverage} variant="unvisited" />
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="island-shell mt-8 rounded-2xl p-6">
          <p className="m-0 max-w-2xl text-base leading-7 text-[var(--sea-ink-soft)]">
            Double-check the WCA ID and try again, or browse the current public
            leaderboard while you search.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline"
            >
              Back to search
            </Link>
            <Link
              to="/leaderboard"
              className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline"
            >
              View leaderboard
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}
