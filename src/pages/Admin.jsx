import { useState } from 'react'
import Layout from '../components/Layout'

const ADMIN_PW = import.meta.env.VITE_ADMIN_PASSWORD || ''

/* ─── Sheet column format reference shown to admin ─────────── */
const SAMPLE_ROWS = [
  { name: 'Alice',   attempt: 1, streak: 12, time: '2:34' },
  { name: 'Alice',   attempt: 2, streak:  7, time: '1:10' },
  { name: 'Alice',   attempt: 3, streak: 12, time: '2:11' },
  { name: 'Bob',     attempt: 1, streak: 15, time: '4:02' },
  { name: 'Charlie', attempt: 1, streak:  3, time: '0:45' },
]

export default function Admin() {
  const [input,    setInput]    = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [shake,    setShake]    = useState(false)

  const attempt = () => {
    if (input === ADMIN_PW) {
      setUnlocked(true)
    } else {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setInput('')
    }
  }

  if (!unlocked) {
    return (
      <Layout>
        <div className="max-w-xs mx-auto pt-20 space-y-4 animate-fade-in">
          <p className="text-sm font-medium text-zinc-700">Admin access</p>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && attempt()}
            placeholder="Password"
            autoFocus
            className={`w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm
                        outline-none focus:border-zinc-500 transition-all font-sans
                        ${shake ? 'border-rose-400 bg-rose-50' : ''}`}
          />
          <button className="btn btn-primary btn-full" onClick={attempt}>
            Unlock
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout narrow={false}>
      <div className="animate-fade-in space-y-10">

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin panel</h1>
          <p className="text-sm text-zinc-400">Leaderboard is driven by a Google Sheet. Edit the sheet — the site updates within 60 seconds.</p>
        </div>

        {/* ── Step 1: Sheet setup ── */}
        <Section title="Step 1 — Set up the Google Sheet">
          <ol className="space-y-3 text-sm text-zinc-600 leading-relaxed list-none">
            {[
              <>Create a new Google Sheet at <a href="https://sheets.new" target="_blank" rel="noreferrer" className="underline text-zinc-900">sheets.new</a>.</>,
              <>In row 1 add exactly these four column headers: <Code>Name</Code> &nbsp;<Code>Attempt</Code> &nbsp;<Code>Streak</Code> &nbsp;<Code>Time (M:SS)</Code></>,
              <>From row 2 onwards, add one row per attempt (up to 3 per person). See the example below.</>,
              <>When you receive a screenshot, add the result to the sheet. The site re-reads it every 60 seconds.</>,
              <>Share the sheet: File → Share → Share with anyone on the internet → Viewer access.</>,
              <>Get the CSV export URL: File → Share → Publish to web → Sheet 1 → CSV → Publish. Copy that URL.</>,
              <>Paste it as <Code>VITE_SHEET_CSV_URL</Code> in your Vercel environment variables (or <Code>.env.local</Code>).</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-xs text-zinc-300 w-5 shrink-0 mt-0.5">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── Step 2: Column format ── */}
        <Section title="Step 2 — Sheet column format">
          <p className="text-sm text-zinc-500 mb-3">
            One row = one attempt. Time is entered as <Code>M:SS</Code> (e.g. <Code>2:34</Code> for 2 minutes 54 seconds).
            The site will automatically apply the tiebreak rules when sorting the leaderboard.
          </p>
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  {['Name', 'Attempt', 'Streak', 'Time (M:SS)'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLE_ROWS.map((r, i) => (
                  <tr key={i} className={`border-b border-zinc-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-zinc-50/50'}`}>
                    <td className="px-4 py-2.5 font-medium text-zinc-800">{r.name}</td>
                    <td className="px-4 py-2.5 text-zinc-500 font-mono">{r.attempt}</td>
                    <td className="px-4 py-2.5 font-bold text-zinc-900 font-mono">{r.streak}</td>
                    <td className="px-4 py-2.5 text-zinc-500 font-mono">{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Step 3: Tiebreak reminder ── */}
        <Section title="Tiebreak rules (applied automatically)">
          <ol className="space-y-2 text-sm text-zinc-600 leading-relaxed">
            {[
              'Best streak — higher is better.',
              'If equal, compare each player\'s 2nd-best streak.',
              'If still equal, compare 3rd-best streak.',
              'If all streaks are equal, compare the time taken on the best-streak attempt — faster wins.',
              'If still equal, compare time on the 2nd-best-streak attempt.',
            ].map((rule, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-xs text-zinc-300 w-5 shrink-0 mt-0.5">{i + 1}.</span>
                {rule}
              </li>
            ))}
          </ol>
        </Section>

        {/* ── Current env check ── */}
        <Section title="Environment variable status">
          <EnvCheck
            name="VITE_SHEET_CSV_URL"
            value={import.meta.env.VITE_SHEET_CSV_URL}
          />
          <EnvCheck
            name="VITE_CHALLENGE_START"
            value={import.meta.env.VITE_CHALLENGE_START}
          />
          <EnvCheck
            name="VITE_CHALLENGE_END"
            value={import.meta.env.VITE_CHALLENGE_END}
          />
        </Section>

      </div>
    </Layout>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-zinc-900 tracking-tight border-b border-zinc-100 pb-2">
        {title}
      </h2>
      {children}
    </div>
  )
}

function Code({ children }) {
  return (
    <code className="font-mono text-xs bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded">
      {children}
    </code>
  )
}

function EnvCheck({ name, value }) {
  const ok = !!value
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
      <code className="font-mono text-xs text-zinc-600">{name}</code>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full
        ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400'}`}>
        {ok ? '✓ set' : 'not set'}
      </span>
    </div>
  )
}
