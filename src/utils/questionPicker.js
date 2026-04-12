function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Pick exactly 15 questions from the bank:
 *   - At least 3 "advanced"
 *   - At least 1 "pro"
 *   - At least 1 "trivia"
 *   - Remaining 10 slots: random from anything not already picked
 * Returns a shuffled array of 15 question objects.
 */
export function pickQuestions(bank) {
  const by = cat => shuffle(bank.filter(q => q.category === cat))

  const advanced = by('advanced')
  const pro      = by('pro')
  const trivia   = by('trivia')

  if (advanced.length < 3 || !pro.length || !trivia.length) {
    console.warn('[pickQuestions] Bank too small for requirements — picking randomly.')
    return shuffle(bank).slice(0, 15)
  }

  const mandatory = [advanced[0], advanced[1], advanced[2], pro[0], trivia[0]]
  const usedIds   = new Set(mandatory.map(q => q.id))
  const pool      = shuffle(bank.filter(q => !usedIds.has(q.id)))

  return shuffle([...mandatory, ...pool.slice(0, 10)])
}
