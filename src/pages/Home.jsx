import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useCountdown } from '../hooks/useCountdown'
import { supabase } from '../supabase'

const NICKNAME_KEY = 'sc_nickname'
const START = import.meta.env.VITE_CHALLENGE_START || '2026-04-20T00:00:00+09:00'
const END   = import.meta.env.VITE_CHALLENGE_END   || '2026-05-11T23:59:59+09:00'

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

  const [nickname,     setNickname]     = useState(() => localStorage.getItem(NICKNAME_KEY) || '')
  const [nickInput,    setNickInput]    = useState('')
  const [attemptsLeft, setAttemptsLeft] = useState(null)  // null = loading
  const [nickError,    setNickError]    = useState('')
  const [saving,       setSaving]       = useState(false)

  // Load attempt count from DB whenever nickname is known
  useEffect(() => {
    if (!nickname) { setAttemptsLeft(null); return }
    loadAttemptsLeft(nickname)
  }, [nickname])

  const loadAttemptsLeft = async (name) => {
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('nickname', name)
      .single()

    if (!participant) { setAttemptsLeft(5); return }

    const { count } = await supabase
      .from('attempts')
      .select('id', { count: 'exact', head: true })
      .eq('participant_id', participant.id)

    setAttemptsLeft(Math.max(0, 5 - (count ?? 0)))
  }

  const handleNicknameSubmit = async () => {
    const name = nickInput.trim()
    if (!name) return
    setSaving(true)
    setNickError('')

    // Check if nickname already taken
    const { data: existing } = await supabase
      .from('participants')
      .select('id')
      .eq('nickname', name)
      .single()

    if (existing) {
      setNickError('This nickname is already taken — please choose another.')
      setSaving(false)
      return
    }

    // Register new participant
    const { error } = await supabase
      .from('participants')
      .insert({ nickname: name })

    if (error) {
      setNickError('Something went wrong — please try again.')
      setSaving(false)
      return
    }

    localStorage.setItem(NICKNAME_KEY, name)
    setNickname(name)
    setSaving(false)
    navigate('/quiz')
  }

  return (
    <Layout>
      <div className="animate-fade-in space-y-10">

        {/* ── Hero ── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-400">
            Apr 20 – May 11, 2026
          </p>
          <h1 className="text-3xl font-semibold tracking-tight leading-tight">
            IYNA QotD Streak Challenge
          </h1>
          <p className="text-zinc-500 leading-relaxed text-sm max-w-sm">
            Answer 15 questions correctly in a row. One mistake ends your run.
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

        {/* ── Start / nickname ── */}
        {isOpen && (
          <div className="space-y-2">
            {!nickname ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-700">Enter your nickname to begin</p>
                <input
                  type="text"
                  value={nickInput}
                  onChange={e => { setNickInput(e.target.value); setNickError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleNicknameSubmit()}
                  placeholder="Your nickname"
                  maxLength={30}
                  disabled={saving}
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-500 transition-all font-sans disabled:opacity-50"
                />
                {nickError && <p className="text-xs text-rose-500 font-medium">{nickError}</p>}
                <button
                  className="btn btn-primary btn-full text-base py-4"
                  onClick={handleNicknameSubmit}
                  disabled={!nickInput.trim() || saving}
                >
                  {saving ? 'Saving…' : 'Save & Start Challenge →'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-zinc-500">
                  Playing as <span className="font-semibold text-zinc-900">{nickname}</span>
                  {attemptsLeft !== null && (
                    <span className={`ml-2 text-xs font-medium ${attemptsLeft === 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      · {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                    </span>
                  )}
                </p>
                <button
                  className="btn btn-primary btn-full text-base py-4"
                  onClick={() => navigate('/quiz')}
                  disabled={attemptsLeft === 0 || attemptsLeft === null}
                >
                  {attemptsLeft === 0 ? 'No attempts remaining' : 'Start Challenge →'}
                </button>
              </div>
            )}
            <p className="text-center text-xs text-zinc-400">
              15 questions · no skipping · 5 attempts total over the 3 weeks
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
                <span className="font-mono text-xs text-zinc-300 mt-0.5 shrink-0 w-5">{i + 1}.</span>
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
  'You have 5 attempts over the 3-week period. All results will be recorded.',
  'One wrong answer ends your run immediately! Your streak at that point is your score.',
  'A streak of 15 questions is the maximum. Aim for perfect score!.',
  'Higher streak = Higher rank! You can check the leaderboard from the button on top-right.',
  'If multiple people has the same highest streak, the one with higher 2nd-best streak will win. If still the same, one with higher 3rd-best streak will win.',
  'If all the streaks are the same, one that completed the highest streak faster will be the winner - try to get highest streak faster.',
  'Do not close or refresh the tab mid-attempt — your run cannot be recovered in that case.',
  'If any bug/glitch happens, please contact via IYNA discord. We can restore your attempt if the run was cut due to the system.',
]
