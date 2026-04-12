import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children, narrow = true }) {
  const { pathname } = useLocation()
  const width = narrow ? 'max-w-xl' : 'max-w-3xl'

  return (
    <div className="min-h-dvh flex flex-col bg-white text-zinc-900">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-zinc-100">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold tracking-tight hover:text-zinc-500 transition-colors">
            Streak Challenge
          </Link>
          <nav className="flex items-center gap-1">
            <Pill to="/"            active={pathname === '/'           }>Home</Pill>
            <Pill to="/leaderboard" active={pathname === '/leaderboard'}>Leaderboard</Pill>
          </nav>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="flex-1">
        <div className={`${width} mx-auto w-full px-5 py-10`}>
          {children}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-100 py-5 text-center text-xs text-zinc-400 font-medium tracking-wide">
        Streak Challenge &nbsp;·&nbsp; Apr 20 – May 11, 2026
      </footer>

    </div>
  )
}

function Pill({ to, active, children }) {
  return (
    <Link to={to} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
      ${active ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}>
      {children}
    </Link>
  )
}
