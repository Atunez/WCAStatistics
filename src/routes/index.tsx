import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { getLeaderboardEntries } from '#/lib/wca-site'

export const Route = createFileRoute('/')({
  loader: async () => getLeaderboardEntries(10),
  component: HomePage,
})

function normalizeWcaId(value: string) {
  return value.trim().toUpperCase()
}

function isValidWcaId(value: string) {
  return /^\d{4}[A-Z]{4}\d{2}$/.test(value)
}

function HomePage() {
  const navigate = useNavigate()
  const leaderboardPreview = Route.useLoaderData()
  const [wcaId, setWcaId] = useState('')
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
    <main className="page-wrap px-4 pb-8 pt-12">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Track your U.S. coverage</p>
        <h1 className="display-title mb-5 max-w-4xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          See which U.S. states your WCA career has already reached.
        </h1>
        <p className="mb-8 max-w-3xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Search by WCA ID to compare visited and unvisited states, review the
          last three competitions in each state, and spot upcoming competitions
          in the places you still need.
        </p>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-3">
          <label htmlFor="wca-id" className="sr-only">
            WCA ID
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="wca-id"
              name="wcaId"
              value={wcaId}
              onChange={(event) => setWcaId(event.target.value)}
              placeholder="Enter a WCA ID, like 2013FELI01"
              className="h-12 flex-1 rounded-2xl border border-[var(--line)] bg-white/80 px-4 text-base text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon-deep)]"
            />
            <button
              type="submit"
              className="rounded-2xl bg-[linear-gradient(135deg,var(--lagoon-deep),var(--lagoon))] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(50,143,151,0.22)]"
            >
              Open competitor page
            </button>
          </div>
          {error ? (
            <p className="m-0 text-sm font-medium text-[var(--palm)]">{error}</p>
          ) : (
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
              Valid IDs look like four digits, four letters, and two digits.
            </p>
          )}
        </form>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ['50 states', 'Every competitor is partitioned into visited and unvisited U.S. states.'],
          ['Last 3 comps', 'Each state card keeps the latest three historical competitions in descending order.'],
          ['Top 100 leaderboard', 'A public ranking highlights the competitors with the widest U.S. state coverage.'],
        ].map(([title, description], index) => (
          <article
            key={title}
            className="island-shell feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">
              {title}
            </h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{description}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <article className="island-shell rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="island-kicker mb-2">Leaderboard preview</p>
              <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
                Current top competitors
              </h2>
            </div>
            <Link
              to="/leaderboard"
              className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline"
            >
              View top 100
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-[var(--sea-ink-soft)]">
                  <th className="px-3 py-2 font-semibold">Rank</th>
                  <th className="px-3 py-2 font-semibold">Competitor</th>
                  <th className="px-3 py-2 font-semibold">WCA ID</th>
                  <th className="px-3 py-2 font-semibold">Visited states</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardPreview.map((entry) => (
                  <tr key={entry.wcaId} className="rounded-2xl bg-white/45 text-[var(--sea-ink)]">
                    <td className="rounded-l-2xl px-3 py-3 font-semibold">#{entry.rank}</td>
                    <td className="px-3 py-3">
                      <Link
                        to="/competitors/$wcaId"
                        params={{ wcaId: entry.wcaId }}
                        className="font-semibold no-underline"
                      >
                        {entry.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{entry.wcaId}</td>
                    <td className="rounded-r-2xl px-3 py-3">{entry.visitedStatesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="island-shell rounded-2xl p-6">
          <p className="island-kicker mb-2">How it works</p>
          <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
            What you will see on each competitor page
          </h2>
          <ul className="mt-4 space-y-3 pl-5 text-sm leading-6 text-[var(--sea-ink-soft)]">
            <li>Visited-state total based on official WCA competition history.</li>
            <li>Every U.S. state in exactly one bucket: visited or unvisited.</li>
            <li>The last three historical competitions available for each state.</li>
            <li>Upcoming competitions for unvisited states when that source is available.</li>
            <li>A clear degraded state if the upcoming-competition source is temporarily unavailable.</li>
          </ul>
        </article>
      </section>
    </main>
  )
}
