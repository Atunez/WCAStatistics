export default function Footer() {
  return (
    <footer className="site-footer mt-16 px-4 py-10 text-[var(--sea-ink-soft)]">
      <div className="page-wrap flex flex-col gap-4 text-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="island-kicker m-0">Public cubing stats</p>
          <p className="m-0 max-w-2xl leading-6">
            Search any WCA ID to see which U.S. states a competitor has already
            visited, review recent competition history, and scout upcoming
            competitions in the remaining states.
          </p>
        </div>
        <div className="space-y-1 sm:text-right">
          <p className="m-0 font-semibold text-[var(--sea-ink)]">
            WCA U.S. State Coverage
          </p>
          <p className="m-0">Built with TanStack Start and public WCA data.</p>
        </div>
      </div>
    </footer>
  )
}
