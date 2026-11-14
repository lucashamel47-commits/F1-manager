import { useEffect, useState } from 'react'
import { prefersReduced, useTween } from '../lib/motion'

/** Nombre qui défile jusqu'à sa valeur au premier affichage puis à chaque changement. */
export function Num({ value, decimals = 0, from = 0 }: { value: number | string; decimals?: number; from?: number }) {
  const n = typeof value === 'string' ? Number(value) : value
  const [start, setStart] = useState(prefersReduced() ? n : from)
  useEffect(() => { const id = requestAnimationFrame(() => setStart(n)); return () => cancelAnimationFrame(id) }, [n])
  const v = useTween(Number.isFinite(start) ? start : 0, 900)
  if (!Number.isFinite(n)) return <>{value}</>
  return <span className="tabular-nums">{v.toFixed(decimals)}</span>
}

