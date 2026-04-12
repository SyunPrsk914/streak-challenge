/* ─────────────────────────────────────────────────────────────
   ranking.js
   Tiebreak rules (in order):
     1. Best streak  DESC
     2. 2nd streak   DESC  (if 1st equal)
     3. 3rd streak   DESC  (if 2nd equal)
     4. Time of best attempt ASC  (faster = better)
     5. Time of 2nd attempt  ASC  (if still equal)
   ───────────────────────────────────────────────────────────── */

/** Sort one player's attempts: streak desc, then time asc */
function rankSort(attempts) {
  return [...attempts].sort((a, b) =>
    b.streak !== a.streak ? b.streak - a.streak : a.timeMs - b.timeMs
  )
}

/** Compare two players {name, attempts:[]}. Returns <0 if a ranks higher. */
export function compareUsers(a, b) {
  const sa = rankSort(a.attempts)
  const sb = rankSort(b.attempts)

  for (let i = 0; i < 3; i++) {
    const va = sa[i]?.streak ?? -1
    const vb = sb[i]?.streak ?? -1
    if (va !== vb) return vb - va
  }
  for (let i = 0; i < 3; i++) {
    const ta = sa[i]?.timeMs ?? Infinity
    const tb = sb[i]?.timeMs ?? Infinity
    if (ta !== tb) return ta - tb
  }
  return 0
}

/**
 * Return the index (0-based) of the "best" attempt within a player's
 * attempt array (already in chronological order 1,2,3).
 */
export function bestAttemptIndex(attempts) {
  if (!attempts?.length) return -1
  return attempts.reduce((best, cur, i) => {
    const cmp = compareUsers({ attempts: [cur] }, { attempts: [attempts[best]] })
    return cmp < 0 ? i : best
  }, 0)
}

/** ms → "M:SS" */
export function formatTime(ms) {
  if (ms == null) return '—'
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * Parse the raw CSV text exported from Google Sheets and return
 * a ranked array of player objects.
 *
 * Expected sheet columns (row 1 = header, ignored):
 *   Name | Attempt | Streak | Time (M:SS)
 *
 * Example rows:
 *   Alice | 1 | 12 | 2:34
 *   Alice | 2 |  7 | 1:10
 *   Bob   | 1 | 15 | 4:02
 */
export function parseSheetCSV(csvText) {
  const lines = csvText.trim().split('\n').slice(1) // skip header
  const map   = {}

  for (const raw of lines) {
    const cols = raw.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const [name, attemptStr, streakStr, timeStr] = cols
    if (!name || !streakStr) continue

    const attempt = parseInt(attemptStr, 10) || 1
    const streak  = parseInt(streakStr,  10) || 0
    const timeMs  = parseTimeToMs(timeStr)

    if (!map[name]) map[name] = { name, attempts: [] }
    map[name].attempts.push({ attempt, streak, timeMs })
  }

  // Sort each player's own attempts chronologically
  for (const p of Object.values(map)) {
    p.attempts.sort((a, b) => a.attempt - b.attempt)
  }

  return Object.values(map).sort(compareUsers)
}

/** "M:SS" → milliseconds */
function parseTimeToMs(str) {
  if (!str) return 0
  const [m, s] = str.split(':').map(Number)
  return ((m || 0) * 60 + (s || 0)) * 1000
}
