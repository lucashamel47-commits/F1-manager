// Résultats de la dernière course (Jolpica-F1) : sert à l'accueil personnalisé (dernier résultat du pilote et de l'écurie).
import { useEffect, useState } from 'react'

export interface LastRace {
  name: string
  byDriver: Record<string, { pos: string; points: string }>
  byConstructor: Record<string, string[]>
}

export async function fetchLastRace(): Promise<LastRace | null> {
  const r = await fetch('https://api.jolpi.ca/ergast/f1/current/last/results.json?limit=40', { cache: 'no-store' })
  if (!r.ok) return null
  const race = (await r.json()).MRData?.RaceTable?.Races?.[0]
  if (!race) return null
  const out: LastRace = { name: String(race.raceName ?? '').replace(/\s*Grand Prix$/i, ' GP'), byDriver: {}, byConstructor: {} }
  for (const x of race.Results ?? []) {
    const code = x.Driver?.code as string | undefined
    const pos = x.positionText === 'R' || x.positionText === 'D' || x.positionText === 'W' ? 'Abandon' : `P${x.position}`
    if (code) out.byDriver[code] = { pos, points: x.points }
    const c = x.Constructor?.constructorId as string | undefined
    if (c) (out.byConstructor[c] ??= []).push(pos)
  }
  return out
}

export function useLastRace(enabled: boolean) {
  const [data, setData] = useState<LastRace | null>(null)
  useEffect(() => {
    if (!enabled) return
    let alive = true
    fetchLastRace().then((d) => { if (alive) setData(d) }, () => {})
    return () => { alive = false }
  }, [enabled])
  return data
}
