import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../supabase'
import { compareUsers, formatTime, bestAttemptIndex, getTiebreakerInfo } from '../utils/ranking'

export default function Leaderboard() {
  const [players, setPlayers] = useState([])
  const [status,  setStatus]  = useState('loading')

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select(`
          id,
          nickname,
          attempts (
            id,
            attempt_number,
            streak,
            time_ms
          )
        `)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Only show participants with at least 1 attempt
      const withAttempts = data
        .filter(p => p.attempts.length > 0)
        .map(p => ({
          name: p.nickname,
          id:   p.id,
          attempts: p.attempts.map(a => ({
            attempt:  a.attempt_number,
            streak:   a.streak,
            timeMs:   a.time_ms,
          })).sort((a, b) => a.attempt - b.attempt),
        }))
        .sort(compareUsers)

      setPlayers(withAttempts)
      setStatus('ok')
    } catch (e) {
      console.error(e)
      setStatus('error')
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <Layout narrow={false}>
      <div className="animate-fade-in space-y-6">

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
        </div>

        {status === 'loading' && (
          <div className="py-16 text-center text-sm text-zinc-400 animate-pulse">ロード中...</div>
        )}
        {status === 'error' && (
          <div className="rounded-xl px-5 py-4 text-sm bg-amber-50 text-amber-800 border border-amber-200">
            ロードできませんでした。もう一度お試しください。
          </div>
        )}
        {status === 'ok' && players.length === 0 && (
          <div className="rounded-xl px-5 py-4 text-sm bg-zinc-50 text-zinc-500 border border-zinc-200">
            まだ記録はありません...
          </div>
        )}
        {status === 'ok' && players.length > 0 && (
          <div className="space-y-2.5">
            {players.map((player, rank) => (
              <PlayerRow
                key={player.name}
                player={player}
                rank={rank}
                tiebreaker={getTiebreakerInfo(player, players)}
              />
            ))}
          </div>
        )}

      </div>
    </Layout>
  )
}

function PlayerRow({ player, rank, tiebreaker }) {
  const bestIdx = bestAttemptIndex(player.attempts)
  const medal   = ['🥇', '🥈', '🥉'][rank] ?? null

  return (
    <div className={`card p-4 flex items-center gap-4 ${rank < 3 ? 'ring-1 ring-zinc-200' : ''}`}>
      <div className="w-8 shrink-0 text-center">
        {medal
          ? <span className="text-xl">{medal}</span>
          : <span className="text-sm font-mono font-bold text-zinc-300">{rank + 1}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-zinc-900 truncate">{player.name}</p>
        <p className="text-xs text-zinc-400 mt-0.5">
          {player.attempts.length} attempt{player.attempts.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        {[0, 1, 2, 3, 4].map(i => {
          const a = player.attempts[i]
          if (!a) return <AttemptBox key={i} label={`#${i + 1}`} empty />
          return (
            <AttemptBox
              key={i}
              label={`#${a.attempt}`}
              streak={a.streak}
              time={formatTime(a.timeMs)}
              best={i === bestIdx}
              highlightStreak={tiebreaker?.type === 'streak' && tiebreaker?.rank === i}
              highlightTime={tiebreaker?.type === 'time'   && tiebreaker?.rank === i}
            />
          )
        })}
      </div>
    </div>
  )
}

function AttemptBox({ label, streak, time, best, empty, highlightStreak, highlightTime }) {
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
      ${best ? 'bg-zinc-900 text-white ring-2 ring-zinc-900 ring-offset-1' : 'bg-zinc-50 border border-zinc-200 text-zinc-700'}`}>
      <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">{label}</span>
      <span className={`text-xl font-bold font-mono leading-none
        ${best ? 'text-white' : 'text-zinc-900'}
        ${highlightStreak ? 'underline decoration-amber-400 decoration-2' : ''}`}>
        {streak}
      </span>
      <span className={`text-[11px] font-mono tabular-nums
        ${best ? 'text-zinc-400' : 'text-zinc-500'}
        ${highlightTime ? 'underline decoration-amber-400 decoration-2' : ''}`}>
        {time}
      </span>
    </div>
  )
}
