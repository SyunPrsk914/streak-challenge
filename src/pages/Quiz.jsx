import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pickQuestions } from '../utils/questionPicker'
import bank from '../data/questions.json'

const START = import.meta.env.VITE_CHALLENGE_START || '2025-04-20T00:00:00+09:00'
const END   = import.meta.env.VITE_CHALLENGE_END   || '2025-05-11T23:59:59+09:00'

// Phase constants
const IDLE     = 'idle'      // no choice selected
const SELECTED = 'selected'  // choice picked, not yet submitted
const CORRECT  = 'correct'   // submitted, was right
const WRONG    = 'wrong'     // submitted, was wrong
const PERFECT  = 'perfect'   // all 15 done

export default function Quiz() {
  const now    = Date.now()
  const isOpen = now >= new Date(START).getTime() && now < new Date(END).getTime()

  if (!isOpen) {
    return (
      <QuizShell>
        <div className="py-20 text-center text-sm text-zinc-500">
          The challenge is not currently open.
        </div>
      </QuizShell>
    )
  }
  return <Engine />
}

function Engine() {
  const navigate = useNavigate()

  // Questions preloaded once on mount
  const [questions]             = useState(() => pickQuestions(bank))
  const [qIdx,    setQIdx]      = useState(0)
  const [selected, setSelected] = useState(null)   // index of chosen answer
  const [phase,   setPhase]     = useState(IDLE)
  const [streak,  setStreak]    = useState(0)
  const [elapsed, setElapsed]   = useState(0)      // ms, display only

  // ── Timer refs ────────────────────────────────────────────
  const intervalRef = useRef(null)
  const startRef    = useRef(Date.now())
  const pauseRef    = useRef(null)   // timestamp when paused
  const offsetRef   = useRef(0)      // total ms paused so far

  const startTimer = () => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current - offsetRef.current)
    }, 100)
  }
  const pauseTimer = () => {
    clearInterval(intervalRef.current)
    pauseRef.current = Date.now()
  }
  const resumeTimer = () => {
    if (pauseRef.current) {
      offsetRef.current += Date.now() - pauseRef.current
      pauseRef.current = null
    }
    startTimer()
  }

  useEffect(() => { startTimer(); return () => clearInterval(intervalRef.current) }, []) // eslint-disable-line

  const q = questions[qIdx]

  // ── Select a choice ───────────────────────────────────────
  const select = (i) => {
    if (phase !== IDLE && phase !== SELECTED) return
    setSelected(i)
    setPhase(SELECTED)
  }

  // ── Submit ────────────────────────────────────────────────
  const submit = () => {
    if (phase !== SELECTED) return
    pauseTimer()

    if (selected === q.answer) {
      const newStreak = streak + 1
      setStreak(newStreak)
      if (newStreak === 15) {
        setPhase(PERFECT)
      } else {
        setPhase(CORRECT)
      }
    } else {
      setPhase(WRONG)
      const finalMs = Date.now() - startRef.current - offsetRef.current
      // Brief pause so player can see the correct answer highlighted
      setTimeout(() => navigate('/result', { state: { streak, timeMs: finalMs, perfect: false } }), 2200)
    }
  }

  // ── Next question ─────────────────────────────────────────
  const next = () => {
    setQIdx(i => i + 1)
    setSelected(null)
    setPhase(IDLE)
    resumeTimer()
  }

  // ── Complete (all 15) ─────────────────────────────────────
  const complete = () => {
    const finalMs = Date.now() - startRef.current - offsetRef.current
    navigate('/result', { state: { streak: 15, timeMs: finalMs, perfect: true } })
  }

  const fmtMs = (ms) => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <QuizShell>
      <div className="animate-fade-in space-y-6">

        {/* ── Progress bar ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
            <span>Question {qIdx + 1} / 15</span>
            <span className="font-mono tabular-nums">{fmtMs(elapsed)}</span>
            <span className="flex items-center gap-1">
              <FireIcon />
              {streak}
            </span>
          </div>
          <div className="h-[3px] bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(qIdx / 15) * 100}%` }}
            />
          </div>
        </div>

        {/* ── Category badge ── */}
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${catStyle(q.category)}`}>
          {q.category}
        </span>

        {/* ── Question ── */}
        <p className="text-[17px] font-medium leading-snug text-zinc-900">
          {q.question}
        </p>

        {/* ── Choices ── */}
        <div className="space-y-2.5">
          {q.choices.map((text, i) => {
            let cls = 'choice'
            if (phase === SELECTED && i === selected)   cls += ' choice-selected'
            if ((phase === CORRECT || phase === PERFECT) && i === selected) cls += ' choice-correct'
            if (phase === WRONG) {
              if (i === q.answer)                       cls += ' choice-reveal'
              else if (i === selected)                  cls += ' choice-wrong'
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => select(i)}
                disabled={phase !== IDLE && phase !== SELECTED}
              >
                <span className="inline-block w-5 shrink-0 font-mono text-[11px] text-zinc-400 mr-1.5 leading-none">
                  {['A', 'B', 'C', 'D'][i]}
                </span>
                {text}
              </button>
            )
          })}
        </div>

        {/* ── Feedback ── */}
        {phase === CORRECT && (
          <p className="text-sm font-medium text-emerald-600 animate-fade-in">✓ Correct!</p>
        )}
        {phase === PERFECT && (
          <p className="text-sm font-medium text-emerald-600 animate-fade-in">🏆 Perfect — all 15 correct!</p>
        )}
        {phase === WRONG && (
          <p className="text-sm font-medium text-rose-600 animate-fade-in">
            ✗ Incorrect. The correct answer is highlighted above.
          </p>
        )}

        {/* ── Action button ── */}
        <div className="pt-1">
          {(phase === IDLE || phase === SELECTED) && (
            <button className="btn btn-primary btn-full" onClick={submit} disabled={phase !== SELECTED}>
              Submit
            </button>
          )}
          {phase === CORRECT && (
            <button className="btn btn-primary btn-full" onClick={next}>
              Next Question →
            </button>
          )}
          {phase === WRONG && (
            <button className="btn btn-outline btn-full" onClick={() => navigate('/')}>
              Go Back to Home
            </button>
          )}
          {phase === PERFECT && (
            <button className="btn btn-primary btn-full" onClick={complete}>
              Complete! 🎉
            </button>
          )}
        </div>

      </div>
    </QuizShell>
  )
}

// No nav bar during quiz — prevents accidental navigation
function QuizShell({ children }) {
  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <div className="flex-1 max-w-xl mx-auto w-full px-5 py-10">
        {children}
      </div>
    </div>
  )
}

function FireIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 0-5 4-5 10a5 5 0 0010 0c0-6-5-10-5-10z"/>
    </svg>
  )
}

function catStyle(cat) {
  return {
    advanced: 'bg-violet-100 text-violet-700',
    pro:      'bg-amber-100  text-amber-700',
    trivia:   'bg-sky-100    text-sky-700',
    basic:    'bg-zinc-100   text-zinc-600',
  }[cat] ?? 'bg-zinc-100 text-zinc-600'
}
