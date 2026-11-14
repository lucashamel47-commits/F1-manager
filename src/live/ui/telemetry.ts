import type { CarSample } from '../data'

/** Valeur interpolée au temps t (animation fluide entre deux mesures). */
export function carAt(s: CarSample[], t: number): CarSample | null {
  if (!s.length) return null
  let i = s.length - 1
  while (i > 0 && s[i].t > t) i--
  const a = s[i], b = s[i + 1]
  if (!b || b.t <= a.t || t <= a.t) return a
  const k = Math.min(1, (t - a.t) / (b.t - a.t))
  const mix = (x: number, y: number) => x + (y - x) * k
  return { ...a, speed: Math.round(mix(a.speed, b.speed)), rpm: Math.round(mix(a.rpm, b.rpm)), thr: Math.round(mix(a.thr, b.thr)) }
}
