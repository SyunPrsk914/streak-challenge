import { useEffect, useState } from 'react'

function calc(ms) {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  return {
    days:    Math.floor(ms / 86_400_000),
    hours:   Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms %  3_600_000) /    60_000),
    seconds: Math.floor((ms %     60_000) /     1_000),
    done: false,
  }
}

export function useCountdown(isoString) {
  const target = new Date(isoString).getTime()
  const [state, setState] = useState(() => calc(target - Date.now()))
  useEffect(() => {
    const id = setInterval(() => setState(calc(target - Date.now())), 1_000)
    return () => clearInterval(id)
  }, [target])
  return state
}
