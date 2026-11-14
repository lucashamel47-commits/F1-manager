import { useEffect, useMemo } from 'react'
import type { CarDataStore, CarSample } from '../data'
import type { Store } from '../model'
import { OpenF1Error } from '../openf1'
import { carAt } from './telemetry'

/*
 * « Vue pilote » : HUD façon volant / cockpit, alimenté par OpenF1 car_data (≈ 4 mesures par seconde).
 * Force G longitudinale estimée à partir de la dérivée de la vitesse (pas de capteur public) :
 *   g = Δv / Δt / 9,81, lissée sur ≈ 0,5 s et bornée pour écarter les mesures aberrantes.
 */

const G = 9.81
const MAX_BRAKE_G = 6.5
const MAX_ACC_G = 2.5
const drsOpen = (v: number) => v >= 10
const drsReady = (v: number) => v === 8

/** Force G longitudinale lissée pour chaque échantillon (négatif = freinage). */
function gSeries(s: CarSample[]): { t: number; g: number }[] {
  if (s.length < 3) return []
  const raw: { t: number; g: number }[] = []
  for (let i = 0; i < s.length; i++) {
    // fenêtre ≈ 0,8 s autour de l'échantillon (différence centrée, plus robuste que point à point)
    let a = i, b = i
    while (a > 0 && s[i].t - s[a].t < 260) a--
    while (b < s.length - 1 && s[b].t - s[i].t < 260) b++
    const dt = (s[b].t - s[a].t) / 1000
    if (dt < 0.3 || dt > 2) continue
    const g = ((s[b].speed - s[a].speed) / 3.6) / dt / G
    raw.push({ t: s[i].t, g: Math.max(-MAX_BRAKE_G, Math.min(MAX_ACC_G, g)) })
  }
  return raw.map((p, i) => {
    const w = raw.slice(Math.max(0, i - 1), i + 2)
    return { t: p.t, g: w.reduce((x, y) => x + y.g, 0) / w.length }
  })
}

const fmtG = (g: number) => `${Math.abs(g).toFixed(1).replace('.', ',')} G`

/** Jauge G en demi-cercle : gauche = freinage (jusqu'à 6 G), droite = accélération (jusqu'à 2,5 G). */
function GMeter({ g }: { g: number }) {
  // angle : -90° (6 G freinage) … 0° (0 G) … +90° (2,5 G accélération) ; échelle asymétrique
  const ang = g < 0 ? (g / 6) * 90 : (g / MAX_ACC_G) * 90
  const a = Math.max(-90, Math.min(90, ang))
  const R = 70
  const arc = (from: number, to: number) => {
    const p = (d: number) => [80 + R * Math.sin((d * Math.PI) / 180), 84 - R * Math.cos((d * Math.PI) / 180)]
    const [x1, y1] = p(from), [x2, y2] = p(to)
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 0 ${to > from ? 1 : 0} ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  const ticks = [-6, -4, -2, 0, 1, 2]
  const braking = g < -0.5
  return (
    <svg viewBox="0 0 160 100" className="w-full max-w-[15rem]" role="img" aria-label={`Force G longitudinale : ${fmtG(g)} ${braking ? 'au freinage' : g > 0.2 ? 'en accélération' : ''}`}>
      <path d={arc(-90, 90)} fill="none" stroke="#1d1e20" strokeWidth="9" strokeLinecap="round" />
      {a < 0 && <path d={arc(a, 0)} fill="none" stroke="#f7f8f8" strokeWidth="9" strokeLinecap="round" />}
      {a > 0 && <path d={arc(0, a)} fill="none" stroke="#8a8b8c" strokeWidth="9" strokeLinecap="round" />}
      {ticks.map((v) => {
        const d = v < 0 ? (v / 6) * 90 : (v / MAX_ACC_G) * 90
        const x = 80 + (R - 15) * Math.sin((d * Math.PI) / 180), y = 84 - (R - 15) * Math.cos((d * Math.PI) / 180)
        return <text key={v} x={x} y={y + 3} textAnchor="middle" fontSize="7.5" fill="#636464">{Math.abs(v)}</text>
      })}
      <text x="80" y="78" textAnchor="middle" fontSize="22" fontWeight="600" fill="#f7f8f8" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>{Math.abs(g).toFixed(1).replace('.', ',')}</text>
      <text x="80" y="93" textAnchor="middle" fontSize="7.5" fill="#939494" letterSpacing="1.2">{braking ? 'G · FREINAGE' : g > 0.3 ? 'G · ACCÉLÉRATION' : 'G'}</text>
    </svg>
  )
}

/** Trace de la force G sur 30 s : au-dessous de la ligne = freinage. */
function GTrace({ pts, t }: { pts: { t: number; g: number }[]; t: number }) {
  if (pts.length < 4) return null
  const t0 = t - 30_000
  const X = (ts: number) => ((ts - t0) / 30_000) * 300
  const Y = (g: number) => 22 - (g / MAX_ACC_G) * 18 * (g > 0 ? 1 : 0) - (g < 0 ? (g / 6) * 50 : 0)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)} ${Y(p.g).toFixed(1)}`).join('')
  return (
    <svg viewBox="0 0 300 76" preserveAspectRatio="none" className="h-16 w-full" role="img" aria-label="Force G sur les 30 dernières secondes">
      <line x1="0" x2="300" y1="22" y2="22" stroke="#2b2c2d" />
      {[2, 4, 6].map((v) => <line key={v} x1="0" x2="300" y1={Y(-v)} y2={Y(-v)} stroke="#17181a" strokeDasharray="2 4" />)}
      <path d={d} fill="none" stroke="#f7f8f8" strokeWidth="1.4" strokeLinejoin="round" />
      <text x="298" y="18" textAnchor="end" fontSize="7" fill="#636464">accélération</text>
      <text x="298" y="70" textAnchor="end" fontSize="7" fill="#636464">freinage −6 G</text>
    </svg>
  )
}

export default function DriverView({ store, car, n, t, color, issue }: { store: Store; car: CarDataStore | null; n: number; t: number; color: string; issue: OpenF1Error | null }) {
  // dernier tour bouclé : sert au pic de freinage
  const lastLap = useMemo(() => {
    const ls = (store.laps.get(n) ?? []).filter((l) => l.dur != null && l.start + (l.dur as number) * 1000 <= t)
    return ls[ls.length - 1] ?? null
  }, [store, n, t])

  // en rejeu : on précharge aussi la minute précédente pour couvrir tout le dernier tour
  useEffect(() => {
    if (car && lastLap) car.ensure(n, lastLap.start, store.t0)
  }, [car, n, lastLap, store.t0])

  const win = car?.window(n, t - 30_000, t + 1500) ?? []
  const past = win.filter((s) => s.t <= t)
  const cur = carAt(win, t)
  const stale = !cur || t - (past[past.length - 1]?.t ?? 0) > 6000
  const gPts = gSeries(win).filter((p) => p.t <= t)
  const gNow = gPts.length ? gPts[gPts.length - 1].g : 0
  const peak30 = gPts.reduce((m, p) => Math.min(m, p.g), 0)

  const lapPeak = useMemo(() => {
    if (!car || !lastLap) return null
    const s = car.window(n, lastLap.start, lastLap.start + (lastLap.dur as number) * 1000)
    if (s.length < 20) return null
    const gs = gSeries(s)
    let best = { g: 0, speed: 0 }
    for (const p of gs) if (p.g < best.g) best = { g: p.g, speed: s.find((x) => x.t >= p.t - 1200)?.speed ?? 0 }
    return best.g < -0.5 ? { ...best, lap: lastLap.lap } : null
  }, [car, n, lastLap, car?.version]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!cur) {
    return (
      <div className="rounded-2xl border border-[#2b2c2d] bg-[#0c0d0e] p-5 text-sm text-zinc-500">
        {store.live
          ? 'Pendant le direct, la télémétrie (vitesse, freinage, force G) est réservée à F1 TV. Elle sera disponible en rejeu gratuit quelques heures après la session.'
          : issue?.kind === 'auth'
          ? 'La télémétrie en direct demande un abonnement OpenF1. Lance un rejeu pour voir la vue pilote.'
          : car ? 'Chargement de la télémétrie du pilote…' : 'Pas de télémétrie disponible pour cette session.'}
      </div>
    )
  }

  const LEDS = 15
  const lit = Math.max(0, Math.min(LEDS, Math.round(((cur.rpm - 9000) / 3200) * LEDS)))
  const brk = cur.brk > 0
  return (
    <div className={`rounded-2xl border border-[#2b2c2d] bg-[#0a0b0c] p-4 sm:p-5 transition-opacity ${stale ? 'opacity-50' : ''}`}>
      {/* lumières de régime */}
      <div className="flex justify-center gap-1" aria-hidden>
        {Array.from({ length: LEDS }, (_, i) => (
          <span key={i} className="h-1.5 flex-1 max-w-6 rounded-full transition-colors duration-100" style={{ backgroundColor: i < lit ? (i >= LEDS - 3 ? '#ffffff' : color) : '#1d1e20' }} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-[2.25rem_1fr_2.25rem] items-stretch gap-4">
        {/* frein */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-3 flex-1 min-h-28 overflow-hidden rounded-full bg-[#1d1e20]">
            <span className="absolute inset-x-0 bottom-0 rounded-full bg-white transition-[height] duration-150" style={{ height: brk ? '100%' : '0%' }} />
          </div>
          <span className={`text-[10px] font-medium uppercase tracking-wider ${brk ? 'text-white' : 'text-[#636464]'}`}>Frein</span>
        </div>

        {/* écran central */}
        <div className="text-center">
          <div className="flex items-start justify-center gap-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#636464]">km/h</p>
              <p className="mt-1 text-6xl font-semibold leading-none tabular-nums tracking-[-0.04em]">{cur.speed}</p>
            </div>
            <div className="grid size-16 place-items-center rounded-xl border border-[#2b2c2d] bg-[#111213]">
              <span className="text-4xl font-semibold leading-none tabular-nums" aria-label="Rapport engagé">{cur.gear === 0 ? 'N' : cur.gear}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px]">
            <span className="rounded-full border border-[#2b2c2d] px-2.5 py-1 tabular-nums text-[#c4c5c5]">{cur.rpm.toLocaleString('fr-FR')} tr/min</span>
            <span className={`rounded-full px-2.5 py-1 font-semibold ${drsOpen(cur.drs) ? 'bg-white text-black' : drsReady(cur.drs) ? 'border border-white/50 text-white' : 'border border-[#2b2c2d] text-[#636464]'}`}>
              DRS {drsOpen(cur.drs) ? 'ouvert' : drsReady(cur.drs) ? 'disponible' : 'fermé'}
            </span>
          </div>
          <div className="mt-3 flex justify-center"><GMeter g={gNow} /></div>
        </div>

        {/* accélérateur */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-3 flex-1 min-h-28 overflow-hidden rounded-full bg-[#1d1e20]">
            <span className="absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-150" style={{ height: `${Math.min(100, cur.thr)}%`, backgroundColor: color }} />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#636464]">Gaz</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#2b2c2d] bg-[#2b2c2d] text-center">
        <div className="bg-[#0c0d0e] px-2 py-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#636464]">Freinage max · {lapPeak ? `tour ${lapPeak.lap}` : 'dernier tour'}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{lapPeak ? fmtG(lapPeak.g) : '—'}</p>
          {lapPeak && lapPeak.speed > 0 && <p className="text-[10px] text-[#636464]">depuis {lapPeak.speed} km/h</p>}
        </div>
        <div className="bg-[#0c0d0e] px-2 py-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#636464]">Freinage max · 30 s</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{peak30 < -0.5 ? fmtG(peak30) : '—'}</p>
        </div>
      </div>

      <div className="mt-4"><GTrace pts={gPts} t={t} /></div>
      <p className="mt-1 text-[10px] leading-snug text-[#636464]">Force G estimée à partir de la vitesse (≈ 4 mesures/s). La vraie caméra embarquée n'est pas disponible gratuitement.</p>
    </div>
  )
}
