import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useCountdown } from '../hooks/useCountdown'

const START = import.meta.env.VITE_CHALLENGE_START || '2025-04-20T00:00:00+09:00'
const END   = import.meta.env.VITE_CHALLENGE_END   || '2025-05-11T23:59:59+09:00'

export default function Home() {
  const navigate = useNavigate()
  const now      = Date.now()
  const startMs  = new Date(START).getTime()
  const endMs    = new Date(END).getTime()

  const isOpen   = now >= startMs && now < endMs
  const hasEnded = now >= endMs
  const preOpen  = now < startMs

  const toStart = useCountdown(START)
  const toEnd   = useCountdown(END)
  const cd      = isOpen ? toEnd : toStart

  return (
    <Layout>
      <div className="animate-fade-in space-y-10">

        {/* ── Hero ── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-400">
            Apr 20 – May 11, 2025
          </p>
          <h1 className="text-3xl font-semibold tracking-tight leading-tight">
            Streak Challenge
          </h1>
          <p className="text-zinc-500 leading-relaxed text-sm max-w-sm">
            Answer questions correctly in a row. One mistake ends your run.
            How far can you go?
          </p>
        </div>

        {/* ── Countdown ── */}
        {!hasEnded && (
          <div className="card p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
              {isOpen ? 'Challenge closes in' : 'Challenge opens in'}
            </p>
            <div className="flex gap-5">
              {[
                { v: cd.days,    l: 'Days'    },
                { v: cd.hours,   l: 'Hours'   },
                { v: cd.minutes, l: 'Min'     },
                { v: cd.seconds, l: 'Sec'     },
              ].map(({ v, l }) => (
                <div key={l} className="flex flex-col items-center gap-1 min-w-[44px]">
                  <span className="font-mono font-bold text-3xl tabular-nums text-zinc-900 leading-none">
                    {String(v).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasEnded && (
          <div className="card p-5 text-sm text-zinc-500 font-medium">
            The challenge has ended — check the leaderboard!
          </div>
        )}

        {/* ── Start button ── */}
        {isOpen && (
          <div className="space-y-2">
            <button
              className="btn btn-primary btn-full text-base py-4"
              onClick={() => navigate('/quiz')}
            >
              Start Challenge →
            </button>
            <p className="text-center text-xs text-zinc-400">
              15 questions · no skipping · 3 attempts total over the 3 weeks
            </p>
          </div>
        )}

        {preOpen && (
          <button className="btn btn-primary btn-full opacity-40 cursor-not-allowed" disabled>
            Opens Apr 20
          </button>
        )}

        {/* ── Rules ── */}
        <div className="space-y-4 pt-2 border-t border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900 pt-4">Rules &amp; Notes</h2>
          <ol className="space-y-3">
            {RULES.map((rule, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-600 leading-relaxed">
                <span className="font-mono text-xs text-zinc-300 mt-0.5 shrink-0 w-5">
                  {i + 1}.
                </span>
                {rule}
              </li>
            ))}
          </ol>
        </div>

      </div>
    </Layout>
  )
}

const RULES = [
  'You have 3 attempts over the 3-week period. Your best result is your final score.',
  '15 questions are loaded when you press Start. You must answer each question before moving on — no skipping.',
  'One wrong answer ends your run immediately. Your streak at that point is your score.',
  'If you answer all 15 correctly, you score a perfect streak of 15.',
  'Do not close or refresh the tab mid-attempt — your run cannot be recovered.',
  'Take a clear screenshot of your result screen and send it to the organiser.',
  'Tiebreaks: compare 2nd and 3rd attempt streaks in order, then time taken on each attempt (faster = better).',
]
