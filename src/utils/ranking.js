/* ─────────────────────────────────────────────────────────────
   ranking.js
   Tiebreak rules (in order):
     1. Best streak DESC
     2. 2nd-best streak DESC  (if 1st equal)
     3. 3rd-best streak DESC  (if 2nd equal)
     4. Fastest time among attempts that achieved the best streak
     5. Fastest time among attempts that achieved the 2nd streak
     6. Fastest time among attempts that achieved the 3rd streak
   ───────────────────────────────────────────────────────────── */

/** Sort one player's attempts: streak desc, then timeMs asc */
function rankSort(attempts) {
  return [...attempts].sort((a, b) =>
    b.streak !== a.streak ? b.streak - a.streak : a.timeMs - b.timeMs
  )
}

/** Fastest timeMs among all attempts that achieved exactly this streak value */
function fastestTimeForStreak(attempts, streakVal) {
  const matching = attempts.filter(a => a.streak === streakVal)
  if (!matching.length) return Infinity
  return Math.min(...matching.map(a => a.timeMs))
}

/** Compare two players {name, attempts:[]}. Returns <0 if a ranks higher. */
export function compareUsers(a, b) {
  const sa = rankSort(a.attempts)
  const sb = rankSort(b.attempts)

  // Steps 1–3: compare streak values at each rank position
  for (let i = 0; i < 5; i++) {
    const va = sa[i]?.streak ?? -1
    const vb = sb[i]?.streak ?? -1
    if (va !== vb) return vb - va
  }

  // Steps 4–6: streaks all equal — compare fastest time for each streak rank
  for (let i = 0; i < 5; i++) {
    const streakVal = sa[i]?.streak
    if (streakVal == null) break
    const ta = fastestTimeForStreak(a.attempts, streakVal)
    const tb = fastestTimeForStreak(b.attempts, streakVal)
    if (ta !== tb) return ta - tb
  }

  return 0
}

/**
 * Return the index (0-based, in original chronological order) of the
 * "best" attempt for highlighting on the leaderboard.
 */
export function bestAttemptIndex(attempts) {
  if (!attempts?.length) return -1
  const sorted = rankSort(attempts)
  const best = sorted[0]
  return attempts.findIndex(a => a.attempt === best.attempt)
}

/** ms → "M:SS" */
export function formatTime(ms) {
  if (ms == null) return '—'
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * Parse CSV text from Google Sheets into a ranked array of player objects.
 *
 * Sheet columns (row 1 = header, skipped):
 *   Name | Attempt | Streak | Time (M:SS)
 */
export function parseSheetCSV(csvText) {
  const lines = csvText.trim().split('\n').slice(1)
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

  for (const p of Object.values(map)) {
    p.attempts.sort((a, b) => a.attempt - b.attempt)
  }

  return Object.values(map).sort(compareUsers)
}

export function getTiebreakerInfo(player, allPlayers) {
  const idx = allPlayers.indexOf(player)
  if (idx === 0 && allPlayers.length === 1) return null
  const neighbor = allPlayers[idx - 1] ?? allPlayers[idx + 1]
  if (!neighbor) return null

  const sa = rankSort(player.attempts)
  const sb = rankSort(neighbor.attempts)

  for (let i = 0; i < 5; i++) {
    const va = sa[i]?.streak ?? -1
    const vb = sb[i]?.streak ?? -1
    if (va !== vb) {
      const best = player.attempts
        .map((a, idx) => ({ ...a, idx }))
        .filter(a => a.streak === va)
        .sort((a, b) => a.timeMs - b.timeMs)[0]
      return { type: 'streak', rank: best?.idx ?? i }
    }
  }
   
  for (let i = 0; i < 5; i++) {
    const streakVal = sa[i]?.streak
    if (streakVal == null) break
    const ta = fastestTimeForStreak(player.attempts, streakVal)
    const tb = fastestTimeForStreak(neighbor.attempts, streakVal)
    if (ta !== tb) {
      // Find the chronological index of the attempt with this streak and fastest time
      const best = player.attempts
        .map((a, idx) => ({ ...a, idx }))
        .filter(a => a.streak === streakVal)
        .sort((a, b) => a.timeMs - b.timeMs)[0]
      return { type: 'time', rank: best.idx }
    }
  }
  return null
}

/** "M:SS" → milliseconds */
function parseTimeToMs(str) {
  if (!str) return 0
  const [m, s] = str.split(':').map(Number)
  return ((m || 0) * 60 + (s || 0)) * 1000
}
