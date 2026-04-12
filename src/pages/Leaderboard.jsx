import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { parseSheetCSV, formatTime, bestAttemptIndex } from '../utils/ranking'

const SHEET_URL = import.meta.env.VITE_SHEET_CSV_URL || ''

export default function Leaderboard() {
  const [players, setPlayers] = useState([])
  const [status,  setStatus]  = useState('loading') // 'loading' | 'ok' | 'error' | 'unconfigured'

  useEffect(() => {
    if (!SHEET_URL) { setStatus('unconfigured'); return }

    const load = async () => {
      try {
        const res = await fetch(SHEET_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        setPlayers(parseSheetCSV(text))
        setStatus('ok')
      } catch (e) {
        console.error('[Leaderboard]', e)
        setStatus('error')
      }
    }

    load()
    // Refresh every 60 s so the leaderboard stays current after you update the sheet
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <Layout narrow={false}>
      <div className="animate-fade-in space-y-6">

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-zinc-400">
            Updated each time you edit the Google Sheet · auto-refreshes every 60 s
          </p>
        </div>

        {status === 'loading' && (
          <div className="py-16 text-center text-sm text-zinc-400 animate-pulse-slow">
            Loading…
          </div>
        )}

        {status === 'unconfigured' && (
          <Notice>
            The leaderboard is not configured yet.
            Set <code className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">VITE_SHEET_CSV_URL</code> in your environment variables.
          </Notice>
        )}

        {status === 'error' && (
          <Notice warn>
            Could not load the leaderboard. Make sure the Google Sheet is shared publicly and the CSV URL is correct.
          </Notice>
        )}

        {status === 'ok' && players.length === 0 && (
          <Notice>No results yet — check back soon!</Notice>
        )}

        {status === 'ok' && players.length > 0 && (
          <div className="space-y-2.5">
            {players.map((player, rank) => (
              <PlayerRow key={player.name} player={player} rank={rank} />
            ))}
          </div>
        )}

      </div>
    </Layout>
  )
}

function PlayerRow({ player, rank }) {
  const bestIdx = bestAttemptIndex(player.attempts)
  const isMedal = rank < 3

  const medal = ['🥇', '🥈', '🥉'][rank] ?? null

  return (
    <div className={`card p-4 flex items-center gap-4 transition-all
      ${isMedal ? 'ring-1 ring-zinc-200' : ''}`}>

      {/* Rank */}
      <div className="w-8 shrink-0 text-center">
        {medal
          ? <span className="text-xl">{medal}</span>
          : <span className="text-sm font-mono font-bold text-zinc-300">{rank + 1}</span>
        }
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-zinc-900 truncate">{player.name}</p>
        <p className="text-xs text-zinc-400 mt-0.5">
          {player.attempts.length} attempt{player.attempts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Attempt boxes */}
      <div className="flex gap-2 shrink-0">
        {[0, 1, 2].map(i => {
          const a = player.attempts[i]
          const isBest = i === bestIdx
          if (!a) {
            return (
              <AttemptBox key={i} label={`#${i + 1}`} empty />
            )
          }
          return (
            <AttemptBox
              key={i}
              label={`#${a.attempt}`}
              streak={a.streak}
              time={formatTime(a.timeMs)}
              best={isBest}
            />
          )
        })}
      </div>

    </div>
  )
}

function AttemptBox({ label, streak, time, best, empty }) {
  if (empty) {
    return (
      <div className="flex flex-col items-center gap-0.5 w-[64px] border border-dashed border-zinc-200 rounded-lg px-2 py-2 opacity-40">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">{label}</span>
        <span className="text-xs text-zinc-300">—</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center gap-0.5 w-[64px] rounded-lg px-2 py-2
      ${best
        ? 'bg-zinc-900 text-white ring-2 ring-zinc-900 ring-offset-1'
        : 'bg-zinc-50 border border-zinc-200 text-zinc-700'
      }`}>
      <span className={`text-[10px] uppercase tracking-wider font-semibold ${best ? 'text-zinc-400' : 'text-zinc-400'}`}>
        {label}
      </span>
      <span className={`text-xl font-bold font-mono leading-none ${best ? 'text-white' : 'text-zinc-900'}`}>
        {streak}
      </span>
      <span className={`text-[11px] font-mono tabular-nums ${best ? 'text-zinc-400' : 'text-zinc-500'}`}>
        {time}
      </span>
    </div>
  )
}

function Notice({ children, warn }) {
  return (
    <div className={`rounded-xl px-5 py-4 text-sm leading-relaxed
      ${warn ? 'bg-amber-50 text-amber-800 border border-amber-200'
             : 'bg-zinc-50 text-zinc-500 border border-zinc-200'}`}>
      {children}
    </div>
  )
}
