import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../supabase'

const NICKNAME_KEY = 'sc_nickname'

export default function Result() {
  const { state }  = useLocation()
  const navigate   = useNavigate()
  const nickname   = localStorage.getItem(NICKNAME_KEY) || 'Anonymous'

  const streak  = state?.streak  ?? 0
  const timeMs  = state?.timeMs  ?? 0
  const perfect = state?.perfect ?? false

  const [attemptNumber, setAttemptNumber] = useState('…')
  const [saved,         setSaved]         = useState(false)

  useEffect(() => {
    saveResult()
  }, []) // eslint-disable-line

  const saveResult = async () => {
    // Get participant
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('nickname', nickname)
      .single()

    if (!participant) return

    // Count existing attempts to determine attempt number
    const { count } = await supabase
      .from('attempts')
      .select('id', { count: 'exact', head: true })
      .eq('participant_id', participant.id)

    const nextAttempt = (count ?? 0) + 1
    if (nextAttempt > 5) return
    setAttemptNumber(nextAttempt)

    // Save attempt
    await supabase.from('attempts').insert({
      participant_id: participant.id,
      attempt_number: nextAttempt,
      streak,
      time_ms: timeMs,
    })

    setSaved(true)
  }

  const fmtTime = (ms) => {
    const s = Math.round(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const accentBar =
    perfect      ? 'bg-emerald-500' :
    streak >= 12 ? 'bg-violet-500'  :
    streak >= 8  ? 'bg-amber-400'   :
    streak >= 4  ? 'bg-zinc-400'    :
                   'bg-zinc-200'

  const headline =
    perfect      ? '🏆 完璧!'                    :
    streak === 0 ? '😬 次のチャレンジで頑張りましょう'           :
    streak >= 10 ? `⚡ ${streak} 連続 - すごい！` :
                   `🔥 ${streak} 連続正解！`

  const sub =
    perfect      ? '15問すべて正解です！' :
    streak === 0 ? '最初は誰でもミスします。'       :
                   ''

  return (
    <Layout>
      <div className="animate-slide-up space-y-8 max-w-md mx-auto">

        <h1 className="text-xl font-semibold tracking-tight">あなたの結果</h1>

        <div id="result-card" className="card overflow-hidden">
          <div className={`h-1.5 w-full ${accentBar}`} />
          <div className="p-8 space-y-7">

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                {nickname} · {attemptNumber}回目の挑戦
              </p>
              <p className="text-lg font-semibold text-zinc-900">{headline}</p>
              {sub && <p className="text-sm text-zinc-400">{sub}</p>}
            </div>

            <div className="grid grid-cols-2 divide-x divide-zinc-100 border border-zinc-100 rounded-xl overflow-hidden">
              <StatCell label="連続記録" value={`${streak}`} unit="/ 15" />
              <StatCell label="時間"   value={fmtTime(timeMs)} mono />
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-100 pt-5">
              {saved
                ? '✓ セーブされました'
                : '⏳ セーブ中...'
              }
            </p>

          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button className="btn btn-primary btn-full" onClick={() => navigate('/')}>
            ホームに戻る
          </button>
          <button className="btn btn-outline btn-full" onClick={() => navigate('/leaderboard')}>
            リーダーボードを見る
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
