import type { StateCoverage } from '#/lib/wca-types'

type StateCardProps = {
  coverage: StateCoverage
  variant: 'visited' | 'unvisited'
}

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

  if (startDate === endDate) {
    return formatter.format(start)
  }

  return `${formatter.format(start)} – ${formatter.format(end)}`
}

function CompetitionList({
  title,
  emptyLabel,
  items,
}: {
  title: string
  emptyLabel: string
  items: StateCoverage['recentCompetitions']
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-[var(--sea-ink)]">{title}</h4>
      {items.length === 0 ? (
        <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{emptyLabel}</p>
      ) : (
        <ul className="m-0 space-y-3 pl-4 text-sm text-[var(--sea-ink-soft)]">
          {items.map((competition) => (
            <li key={competition.id} className="space-y-1">
              <a
                href={competition.wcaUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[var(--lagoon-deep)]"
              >
                {competition.name}
              </a>
              <div>{competition.city}</div>
              <div>{formatDateRange(competition.startDate, competition.endDate)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function StateCard({ coverage, variant }: StateCardProps) {
  return (
    <article className="island-shell rounded-2xl p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="island-kicker mb-2">{coverage.stateCode}</p>
          <h3 className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
            {coverage.stateName}
          </h3>
        </div>
        <span className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sea-ink-soft)]">
          {variant}
        </span>
      </div>

      <div className="space-y-4">
        <CompetitionList
          title="Last 3 competitions"
          emptyLabel="No completed competitions were found for this state in the current catalog."
          items={coverage.recentCompetitions}
        />

        {variant === 'unvisited' ? (
          <CompetitionList
            title="Upcoming competitions"
            emptyLabel="No upcoming competitions are currently listed for this state."
            items={coverage.upcomingCompetitions}
          />
        ) : null}
      </div>
    </article>
  )
}
