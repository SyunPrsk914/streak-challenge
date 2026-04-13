import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const ATTEMPT_KEY = 'sc_attempts_used'

export default function Result() {
  const { state }  = useLocation()
  const navigate   = useNavigate()

  const streak  = state?.streak  ?? 0

  useEffect(() => {
  const used = parseInt(localStorage.getItem(ATTEMPT_KEY) || '0', 10)
  localStorage.setItem(ATTEMPT_KEY, String(Math.min(used + 1, 3)))
  }, [])
  
  const timeMs  = state?.timeMs  ?? 0
  const perfect = state?.perfect ?? false

  const fmtTime = (ms) => {
    const s = Math.round(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const accentBar =
    perfect     ? 'bg-emerald-500' :
    streak >= 12 ? 'bg-violet-500' :
    streak >= 8  ? 'bg-amber-400'  :
    streak >= 4  ? 'bg-zinc-400'   :
                   'bg-zinc-200'

  const headline =
    perfect     ? '🏆 Perfect run!' :
    streak === 0 ? '😬 Better luck next time.' :
    streak >= 10 ? `⚡ ${streak} in a row — great run!` :
                   `🔥 ${streak} in a row!`

  const sub =
    perfect      ? 'All 15 questions answered correctly.' :
    streak === 0 ? 'Everyone misses the first one.' :
                   ''

  return (
    <Layout>
      <div className="animate-slide-up space-y-8 max-w-md mx-auto">

        <h1 className="text-xl font-semibold tracking-tight">Your result</h1>

        {/* ═══ Screenshot card ═══════════════════════════════════
            Keep this block visually self-contained — it's what
            participants screenshot and send to the organiser.    */}
        <div id="result-card" className="card overflow-hidden">
          {/* Colour bar encodes performance at a glance */}
          <div className={`h-1.5 w-full ${accentBar}`} />

          <div className="p-8 space-y-7">

            {/* Headline */}
            <div className="space-y-1">
              <p className="text-lg font-semibold text-zinc-900">{headline}</p>
              {sub && <p className="text-sm text-zinc-400">{sub}</p>}
            </div>

            {/* Big stats — streak + time */}
            <div className="grid grid-cols-2 divide-x divide-zinc-100 border border-zinc-100 rounded-xl overflow-hidden">
              <StatCell label="Streak" value={`${streak}`} unit="/ 15" />
              <StatCell label="Time" value={fmtTime(timeMs)} mono />
            </div>

            {/* Screenshot prompt */}
            <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-100 pt-5">
              📸 &nbsp;Screenshot this screen and send it to the organiser.<br />
              Your best score across all 3 attempts will be your final ranking.
            </p>

          </div>
        </div>
        {/* ═══ end screenshot card ═══════════════════════════════ */}

        {/* Navigation — outside the card so it doesn't appear in screenshots */}
        <div className="flex flex-col gap-3">
          <button className="btn btn-primary btn-full" onClick={() => navigate('/')}>
            Back to Home
          </button>
          <button className="btn btn-outline btn-full" onClick={() => navigate('/leaderboard')}>
            View Leaderboard
          </button>
        </div>

      </div>
    </Layout>
  )
}

function StatCell({ label, value, unit, mono }) {
  return (
    <div className="flex flex-col items-center py-5 gap-1">
      <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-4xl font-bold text-zinc-900 leading-none ${mono ? 'font-mono tabular-nums' : ''}`}>
          {value}
        </span>
        {unit && <span className="text-sm text-zinc-400 font-medium">{unit}</span>}
      </div>
    </div>
  )
}
