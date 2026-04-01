import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
        <p className="island-kicker mb-3">About the project</p>
        <h1 className="display-title mb-4 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          A public tracker for U.S. competition coverage.
        </h1>
        <p className="max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
          This site is focused on one question: which U.S. states has a WCA
          competitor already competed in? Enter a WCA ID to see visited versus
          unvisited states, recent competitions in each state, and a simple look
          at upcoming competitions where coverage is still missing.
        </p>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {[
          [
            'Historical coverage',
            'Visited states are derived from official WCA competition participation and limited to the 50 U.S. states.',
          ],
          [
            'Upcoming competitions',
            'Future competitions are informational only. If the source is unavailable, the historical coverage view still renders.',
          ],
          [
            'Public leaderboard',
            'The leaderboard is fixed to the top 100 competitors, ordered deterministically by visited-state count and then WCA ID.',
          ],
        ].map(([title, description]) => (
          <article key={title} className="island-shell rounded-2xl p-5">
            <h2 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
              {title}
            </h2>
            <p className="m-0 text-sm leading-6 text-[var(--sea-ink-soft)]">
              {description}
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}
