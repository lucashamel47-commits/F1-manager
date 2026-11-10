// Grille de la saison en cours, en direct depuis Jolpica-F1 : les pilotes qui ont pris part à la dernière course
// (donc les remplaçants éventuels aussi). Repli sur la grille 2026 de référence si l'API ne répond pas.
import { useEffect, useState } from 'react'
import { DRIVERS, F1_PHOTO_ID, TEAMS, teamByName, type GridDriver } from '../data/grid'

const URL_LAST = 'https://api.jolpi.ca/ergast/f1/current/last/results.json'
const LS = 'f1-grid-v1'

interface ApiResult { number: string; Driver: { code?: string; permanentNumber?: string; givenName: string; familyName: string }; Constructor: { constructorId: string; name: string } }

export async function fetchGrid(): Promise<GridDriver[]> {
  const r = await fetch(URL_LAST)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const j = await r.json()
  const res: ApiResult[] = j?.MRData?.RaceTable?.Races?.[0]?.Results ?? []
  const out: GridDriver[] = []
  for (const x of res) {
    const team = teamByName(x.Constructor.constructorId) ?? teamByName(x.Constructor.name)
    const code = (x.Driver.code ?? x.Driver.familyName.slice(0, 3)).toUpperCase()
    if (!team || out.some((d) => d.code === code)) continue
    out.push({ id: code.toLowerCase(), code, number: x.Driver.permanentNumber ?? x.number, givenName: x.Driver.givenName, familyName: x.Driver.familyName, teamId: team.id, f1: F1_PHOTO_ID[code] ?? '' })
  }
  if (out.length < 16) throw new Error('grille incomplète')
  return sortGrid(out)
}

/** Ordre stable : par écurie (ordre de TEAMS), puis numéro. */
export const sortGrid = (list: GridDriver[]) =>
  [...list].sort((a, b) => TEAMS.findIndex((t) => t.id === a.teamId) - TEAMS.findIndex((t) => t.id === b.teamId) || Number(a.number) - Number(b.number))

function cached(): GridDriver[] | null {
  try { const v = JSON.parse(localStorage.getItem(LS) ?? 'null'); return Array.isArray(v) && v.length >= 16 ? v : null } catch { return null }
}

/** Grille actuelle : affichée tout de suite (cache ou référence), puis mise à jour depuis l'API. */
export function useGrid() {
  const [grid, setGrid] = useState<GridDriver[]>(() => cached() ?? sortGrid(DRIVERS))
  const [source, setSource] = useState<'api' | 'fallback'>('fallback')
  useEffect(() => {
    let alive = true
    fetchGrid().then((g) => {
      if (!alive) return
      setGrid(g); setSource('api')
      try { localStorage.setItem(LS, JSON.stringify(g)) } catch { /* stockage indisponible */ }
    }, () => { /* on garde le cache / la référence */ })
    return () => { alive = false }
  }, [])
  return { grid, source }
}
