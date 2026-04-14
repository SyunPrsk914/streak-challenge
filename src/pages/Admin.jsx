import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../supabase'
import { formatTime, compareUsers } from '../utils/ranking'

const ADMIN_PW = import.meta.env.VITE_ADMIN_PASSWORD || ''

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
          <button className="btn btn-primary btn-full" onClick={attempt}>Unlock</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout narrow={false}>
      <div className="animate-fade-in space-y-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin panel</h1>
          <p className="text-sm text-zinc-400">Manage participants and results directly.</p>
        </div>
        <ResultsManager />
        <Section title="Environment variable status">
          <EnvCheck name="VITE_SUPABASE_URL"      value={import.meta.env.VITE_SUPABASE_URL} />
          <EnvCheck name="VITE_SUPABASE_ANON_KEY" value={import.meta.env.VITE_SUPABASE_ANON_KEY} />
          <EnvCheck name="VITE_CHALLENGE_START"   value={import.meta.env.VITE_CHALLENGE_START} />
          <EnvCheck name="VITE_CHALLENGE_END"     value={import.meta.env.VITE_CHALLENGE_END} />
          <EnvCheck name="VITE_ADMIN_PASSWORD"    value={import.meta.env.VITE_ADMIN_PASSWORD} />
        </Section>
      </div>
    </Layout>
  )
}

function ResultsManager() {
  const [players,  setPlayers]  = useState([])
  const [status,   setStatus]   = useState('loading')
  const [removing, setRemoving] = useState(null)
  const [working,  setWorking]  = useState(false)

  const load = async () => {
    setStatus('loading')
    try {
      const { data, error } = await supabase
        .from('participants')
        .select(`id, nickname, attempts(id, attempt_number, streak, time_ms)`)
        .order('created_at', { ascending: true })

      if (error) throw error

      const mapped = data.map(p => ({
        id:       p.id,
        name:     p.nickname,
        attempts: p.attempts
          .map(a => ({ id: a.id, attempt: a.attempt_number, streak: a.streak, timeMs: a.time_ms }))
          .sort((a, b) => a.attempt - b.attempt),
      })).sort(compareUsers)

      setPlayers(mapped)
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line

const removeAttempt = async () => {
  if (!removing) return
  setWorking(true)

  if (removing.type === 'person') {
    // Deleting participant cascades to all their attempts (set up in schema)
    await supabase.from('participants').delete().eq('id', removing.participantId)
  } else {
    // Delete the specific attempt
    await supabase.from('attempts').delete().eq('id', removing.attemptId)
    // Renumber subsequent attempts
    for (const a of removing.subsequent) {
      await supabase
        .from('attempts')
        .update({ attempt_number: a.attempt - 1 })
        .eq('id', a.id)
    }
  }

  setRemoving(null)
  setWorking(false)
  await load()
}

  return (
    <Section title="Results manager">
      {status === 'loading' && <p className="text-sm text-zinc-400 animate-pulse">Loading…</p>}
      {status === 'error'   && <p className="text-sm text-rose-500">Could not load data.</p>}

      {status === 'ok' && (
        <>
          <div className="flex justify-end mb-3">
            <button className="btn btn-outline text-xs py-1.5 px-3" onClick={load}>↻ Refresh</button>
          </div>

          {players.length === 0 && <p className="text-sm text-zinc-400">No participants yet.</p>}

          <div className="space-y-4">
            {players.map(player => {
              const attemptsLeft = 5 - player.attempts.length
              return (
                <div key={player.id} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                    <p className="font-semibold text-sm text-zinc-900">{player.name}</p>
                       <p className="text-xs text-zinc-400">
                       {player.attempts.length} / 5 used &nbsp;·&nbsp;
                       <span className={attemptsLeft === 0 ? 'text-rose-500 font-medium' : 'text-emerald-600 font-medium'}>
                         {attemptsLeft} remaining
                       </span>
                     </p>
                   </div>
                   <button
                     className="text-rose-400 hover:text-rose-600 text-xs font-medium underline shrink-0"
                     onClick={() => setRemoving({
                       type: 'person',
                       name: player.name,
                       participantId: player.id,
                     })}
                   >
                     Delete person
                   </button>
                 </div>

                  {player.attempts.length === 0
                    ? <p className="text-xs text-zinc-400">No attempts yet.</p>
                    : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-zinc-400 border-b border-zinc-100">
                            <th className="text-left py-1.5 font-medium">Attempt</th>
                            <th className="text-left py-1.5 font-medium">Streak</th>
                            <th className="text-left py-1.5 font-medium">Time</th>
                            <th className="text-right py-1.5 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {player.attempts.map(a => (
                            <tr key={a.id} className="border-b border-zinc-50 last:border-0">
                              <td className="py-2 font-mono">#{a.attempt}</td>
                              <td className="py-2 font-bold font-mono">{a.streak}</td>
                              <td className="py-2 font-mono text-zinc-500">{formatTime(a.timeMs)}</td>
                              <td className="py-2 text-right">
                                <button
                                  className="text-rose-500 hover:text-rose-700 text-xs font-medium underline"
                                  onClick={() => setRemoving({
                                    name:       player.name,
                                    attemptId:  a.id,
                                    attemptNum: a.attempt,
                                    subsequent: player.attempts.filter(x => x.attempt > a.attempt),
                                  })}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  }
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Confirm modal ── */}
      {removing && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-zinc-900">
              {removing.type === 'person'
                ? `Delete ${removing.name} completely?`
                : `Remove attempt #${removing.attemptNum} for ${removing.name}?`
              }
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {removing.type === 'person'
                ? `This will permanently delete ${removing.name} and all their attempts. They will be able to re-register with the same nickname.`
                : <>
                    This will permanently delete this attempt from the database
                    {removing.subsequent?.length > 0
                      ? ` and renumber ${removing.name}'s subsequent attempts automatically.`
                      : '.'
                    }
                    <br /><br />
                    <strong>{removing.name}</strong> will gain 1 attempt back immediately.
                  </>
              }
            </p>
            <div className="flex gap-2">
              <button
                className="btn btn-outline flex-1"
                onClick={() => setRemoving(null)}
                disabled={working}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger flex-1"
                onClick={removeAttempt}
                disabled={working}
              >
                {working ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Section>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-zinc-900 tracking-tight border-b border-zinc-100 pb-2">{title}</h2>
      {children}
    </div>
  )
}

function EnvCheck({ name, value }) {
  const ok = !!value
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
      <code className="font-mono text-xs text-zinc-600">{name}</code>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400'}`}>
        {ok ? '✓ set' : 'not set'}
      </span>
    </div>
  )
}
