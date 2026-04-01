import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-3 py-3 sm:py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-3 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--lagoon),#7ed3bf)] text-sm font-bold text-white">
            50
          </span>
          <span>
            <span className="block text-left text-[11px] uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
              WCA
            </span>
            <span className="block">U.S. State Coverage</span>
          </span>
        </Link>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold sm:order-2 sm:w-auto sm:pl-3">
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Search
          </Link>
          <Link
            to="/leaderboard"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Leaderboard
          </Link>
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            About
          </Link>
          <a
            href="https://www.worldcubeassociation.org/"
            target="_blank"
            rel="noreferrer"
            className="nav-link"
          >
            WCA
          </a>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
