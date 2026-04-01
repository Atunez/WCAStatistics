import { Link, createFileRoute } from '@tanstack/react-router'
import {
  getLeaderboardEntries,
  getLeaderboardGeneratedAt,
} from '#/lib/wca-site'

export const Route = createFileRoute('/leaderboard')({
  loader: async () => ({
    entries: getLeaderboardEntries(100),
    generatedAt: getLeaderboardGeneratedAt(),
  }),
  component: LeaderboardPage,
})

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value))
}

function LeaderboardPage() {
  const { entries, generatedAt } = Route.useLoaderData()

  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
        <p className="island-kicker mb-3">Top 100 leaderboard</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="display-title m-0 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
              The widest U.S. state coverage in the WCA.
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sea-ink-soft)]">
              Ordered by visited U.S. states descending, then WCA ID ascending to
              keep ties deterministic.
            </p>
          </div>
          <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
            Snapshot generated {formatTimestamp(generatedAt)} UTC
          </p>
        </div>
      </section>

      <section className="island-shell mt-8 overflow-hidden rounded-[2rem] p-3 sm:p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-[var(--sea-ink-soft)]">
                <th className="px-3 py-2 font-semibold">Rank</th>
                <th className="px-3 py-2 font-semibold">Competitor</th>
                <th className="px-3 py-2 font-semibold">WCA ID</th>
                <th className="px-3 py-2 font-semibold">Country</th>
                <th className="px-3 py-2 font-semibold">Visited states</th>
                <th className="px-3 py-2 font-semibold">Total competitions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.wcaId} className="bg-white/45 text-[var(--sea-ink)]">
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
                  <td className="px-3 py-3">{entry.countryCode}</td>
                  <td className="px-3 py-3">{entry.visitedStatesCount}</td>
                  <td className="rounded-r-2xl px-3 py-3">{entry.totalCompetitions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
