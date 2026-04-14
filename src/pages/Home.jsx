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
      setNickError('このニックネームは既に使用されています。')
      setSaving(false)
      return
    }

    // Register new participant
    const { error } = await supabase
      .from('participants')
      .insert({ nickname: name })

    if (error) {
      setNickError('エラーが発生しました。もう一度お試しください。')
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
            IYNA QotD 連続チャレンジ
          </h1>
          <p className="text-zinc-500 leading-relaxed text-sm max-w-sm">
            15問連続で正解しましょう！1度間違えるとチャレンジ終了です。
            あなたはどこまで続けられますか？
          </p>
        </div>

        {/* ── Countdown ── */}
        {!hasEnded && (
          <div className="card p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
              {isOpen ? 'チャレンジ終了まで' : 'チャレンジ開始まで'}
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
            チャレンジは終了しました。リーダーボードをチェック！
          </div>
        )}

        {/* ── Start / nickname ── */}
        {isOpen && (
          <div className="space-y-2">
            {!nickname ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-700">ニックネームを入力して開始</p>
                <input
                  type="text"
                  value={nickInput}
                  onChange={e => { setNickInput(e.target.value); setNickError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleNicknameSubmit()}
                  placeholder="あなたのニックネーム"
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
                  {saving ? 'セーブ中...' : 'セーブ & チャレンジ開始 →'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-zinc-500">
                  プレイヤー名：<span className="font-semibold text-zinc-900">{nickname}</span>
                  {attemptsLeft !== null && (
                    <span className={`ml-2 text-xs font-medium ${attemptsLeft === 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      · 残り挑戦可能回数： {attemptsLeft} 回
                    </span>
                  )}
                </p>
                <button
                  className="btn btn-primary btn-full text-base py-4"
                  onClick={() => navigate('/quiz')}
                  disabled={attemptsLeft === 0 || attemptsLeft === null}
                >
                  {attemptsLeft === 0 ? '挑戦可能回数がすべて使われました' : 'チャレンジ開始 →'}
                </button>
              </div>
            )}
            <p className="text-center text-xs text-zinc-400">
              15問 · スキップなし · 3週間で最大5回チャレンジできます
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
          <h2 className="text-sm font-semibold text-zinc-900 pt-4">ルール &amp; 注意</h2>
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
  '3週間で合計5回このチャレンジに挑戦できます。すべての結果は記録されます。',
  '1度間違えるとそこで終了です！間違えた時点までの連続正答がスコアになります。',
  '最大スコアは15問連続正解です。パーフェクトを目指しましょう！',
  '連続記録が長ければ長いほど、順位も上がります！右上のボタンからリーダーボードを確認できます。',
  '最高連続記録が同じ場合、2番目に長い連続記録が長いほうが上順位となります。それでも同じ場合は、同様に3番目、4番目、5番目の順に比べて決定されます。',
  'すべての記録が同じ場合は、より早く最高記録を達成した人が上順位となります - できるだけ早く、正確に答えましょう！',
  '挑戦中にタブを閉じたり更新したりしないでください。その場合、挑戦結果は復元できません。',
  '不具合やエラーが発生した場合は、IYNAのDiscordまでご連絡ください。システムの不具合により挑戦が中断された場合、そのプレイデータを復元いたします。',
]
