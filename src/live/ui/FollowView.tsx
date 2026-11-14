import { useEffect, useMemo, useRef, useState } from 'react'
import type { CarDataStore, LocationStore } from '../data'
import type { Row, Snapshot } from '../model'
import { carAt } from './telemetry'
import { TyreDot } from './common'

/*
 * « Suivre » : caméra qui survole le circuit et reste centrée sur une voiture.
 * Rendu canvas à ~60 i/s : la position est interpolée entre les échantillons OpenF1 (≈ 4 par seconde),
 * la caméra la rejoint avec un amorti exponentiel (position, zoom et rotation).
 * Coordonnées monde = (x, -y) des données OpenF1 (unités ≈ 1/10 m).
 */

type Mode = 'fixe' | 'embarquee'
const TRAIL_MS = 10_000
const TRAIL_STEPS = 80
const FOLLOW_SPAN = 4200 // largeur de piste visible (unités OpenF1) au zoom ×1
const ZMIN = 0.35, ZMAX = 8
const FONT = '"Inter Variable", Inter, ui-sans-serif, system-ui, sans-serif'

interface Cam { cx: number; cy: number; s: number; rot: number; ready: boolean }
interface Hit { n: number; x: number; y: number }

const lerpAngle = (a: number, b: number, k: number) => {
  let d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI
  if (!Number.isFinite(d)) d = 0
  return a + d * k
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export default function FollowView({ loc, car, now, snap, t, selected, onSelect, version, isLive, onClose }: {
  loc: LocationStore | null; car: CarDataStore | null; now: () => number; snap: Snapshot; t: number
  selected: number | null; onSelect: (n: number) => void; version: number; isLive: boolean; onClose: () => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<Mode>('fixe')
  const [following, setFollowing] = useState(true)
  const [zoomUi, setZoomUi] = useState(1)
  const [hasPos, setHasPos] = useState<boolean | null>(null)

  const rowsRef = useRef<Row[]>(snap.rows)
  const st = useRef({ mode, following, selected, zoom: 1, ovZoom: 1, pan: [0, 0] as [number, number], heading: 0 })
  const cam = useRef<Cam>({ cx: 0, cy: 0, s: 1, rot: 0, ready: false })
  const hits = useRef<Hit[]>([])
  useEffect(() => { rowsRef.current = snap.rows })
  useEffect(() => { st.current.mode = mode; st.current.following = following; st.current.selected = selected })
  // nouvelle voiture choisie : on repart en suivi
  const [prevSel, setPrevSel] = useState(selected)
  if (prevSel !== selected) { setPrevSel(selected); if (selected != null) setFollowing(true) }

  const outline = loc?.outline ?? null
  const track = useMemo(() => {
    void version
    if (!outline) return null
    const p = new Path2D()
    outline.pts.forEach(([x, y], i) => (i ? p.lineTo(x, -y) : p.moveTo(x, -y)))
    p.closePath()
    const a = outline.pts[0], b = outline.pts[Math.min(6, outline.pts.length - 1)]
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    return {
      path: p, cx: (outline.minX + outline.maxX) / 2, cy: -(outline.minY + outline.maxY) / 2,
      span: Math.max(outline.maxX - outline.minX, outline.maxY - outline.minY, 1),
      sf: { x: a[0], y: -a[1], nx: (b[1] - a[1]) / L, ny: (b[0] - a[0]) / L },
    }
  }, [outline, version])

  // repli sans tracé : enveloppe des positions reçues
  const bounds = useMemo(() => {
    void version
    if (track) return { cx: track.cx, cy: track.cy, span: track.span }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const arr of loc?.per.values() ?? []) for (let i = 0; i < arr.length; i += 8) {
      const s = arr[i]
      if (s.x === 0 && s.y === 0) continue
      minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x); minY = Math.min(minY, s.y); maxY = Math.max(maxY, s.y)
    }
    return Number.isFinite(minX) ? { cx: (minX + maxX) / 2, cy: -(minY + maxY) / 2, span: Math.max(maxX - minX, maxY - minY, 1) } : null
  }, [track, loc, version])

  // ---------- boucle de rendu ----------
  useEffect(() => {
    const cv = canvasRef.current, wrap = wrapRef.current
    if (!cv || !wrap || !loc) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0, lastTs = 0, lastHud = 0, w = 0, h = 0, dpr = 1
    const resize = () => {
      const r = wrap.getBoundingClientRect()
      dpr = Math.min(2, window.devicePixelRatio || 1)
      w = r.width; h = r.height
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
      cv.style.width = `${w}px`; cv.style.height = `${h}px`
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    // position interpolée ; masquée si le dernier échantillon est trop ancien (voiture arrêtée / données absentes)
    const fresh = (n: number, tt: number) => {
      const arr = loc.per.get(n)
      if (!arr || !arr.length) return false
      let lo = 0, hi = arr.length - 1, i = -1
      while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m].t <= tt) { i = m; lo = m + 1 } else hi = m - 1 }
      if (i < 0) return arr[0].t - tt < 3000
      return tt - arr[i].t < 20_000 || (arr[i + 1] != null && arr[i + 1].t - arr[i].t < 30_000)
    }
    const pos = (n: number, tt: number) => { if (!fresh(n, tt)) return null; const p = loc.at(n, tt); return p && !(p[0] === 0 && p[1] === 0) ? p : null }

    const frame = (ts: number) => {
      raf = requestAnimationFrame(frame)
      const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0.016
      lastTs = ts
      if (!w || !h) return
      const S = st.current, c = cam.current
      const tt = now()
      const base = Math.min(w, h)
      // cible de la caméra
      let tx: number, ty: number, ts_: number, trot = 0
      const me = S.selected != null ? pos(S.selected, tt) : null
      if (S.following && me) {
        const back = pos(S.selected as number, tt - 600)
        if (back) {
          const dx = me[0] - back[0], dy = -(me[1] - back[1])
          if (Math.hypot(dx, dy) > 25) S.heading = Math.atan2(dy, dx)
        }
        tx = me[0]; ty = -me[1]; ts_ = (base / FOLLOW_SPAN) * S.zoom
        if (S.mode === 'embarquee') trot = -Math.PI / 2 - S.heading
      } else if (bounds) {
        tx = bounds.cx + S.pan[0]; ty = bounds.cy + S.pan[1]; ts_ = ((base * 0.86) / bounds.span) * S.ovZoom
      } else { tx = 0; ty = 0; ts_ = 0.05 }
      if (!c.ready) { c.cx = tx; c.cy = ty; c.s = ts_; c.rot = trot; c.ready = !!bounds }
      else {
        const kp = 1 - Math.exp(-dt / (S.following && me ? 0.07 : 0.22))
        const ks = 1 - Math.exp(-dt / 0.28)
        const kr = 1 - Math.exp(-dt / 0.45)
        c.cx += (tx - c.cx) * kp; c.cy += (ty - c.cy) * kp
        c.s *= Math.exp((Math.log(ts_) - Math.log(c.s)) * ks)
        c.rot = lerpAngle(c.rot, trot, kr)
      }
      const cos = Math.cos(c.rot), sin = Math.sin(c.rot)
      const proj = (x: number, y: number): [number, number] => {
        const X = (x - c.cx) * c.s, Y = (-y - c.cy) * c.s
        return [w / 2 + X * cos - Y * sin, h / 2 + X * sin + Y * cos]
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = '#08090a'
      ctx.fillRect(0, 0, w, h)

      // tracé : bande d'asphalte + bords
      if (track) {
        ctx.save()
        ctx.translate(w / 2, h / 2); ctx.rotate(c.rot); ctx.scale(c.s, c.s); ctx.translate(-c.cx, -c.cy)
        ctx.lineJoin = 'round'; ctx.lineCap = 'round'
        const band = Math.max(150, 7 / c.s)
        ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = band + 2.5 / c.s; ctx.stroke(track.path)
        ctx.strokeStyle = '#141516'; ctx.lineWidth = band; ctx.stroke(track.path)
        ctx.setLineDash([24 / c.s, 22 / c.s])
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1 / c.s; ctx.stroke(track.path)
        ctx.setLineDash([])
        // ligne d'arrivée
        const { sf } = track
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(18, 2 / c.s)
        ctx.beginPath(); ctx.moveTo(sf.x - sf.nx * band * 0.62, sf.y - sf.ny * band * 0.62); ctx.lineTo(sf.x + sf.nx * band * 0.62, sf.y + sf.ny * band * 0.62); ctx.stroke()
        ctx.restore()
      }

      const rows = rowsRef.current
      const color = new Map(rows.map((r) => [r.n, r.color]))
      // traînée de la voiture suivie (10 s, s'estompe)
      if (S.selected != null && me) {
        const col = color.get(S.selected) ?? '#ffffff'
        let prev: [number, number] | null = null
        ctx.lineCap = 'round'
        for (let i = TRAIL_STEPS; i >= 0; i--) {
          const p = pos(S.selected, tt - (i / TRAIL_STEPS) * TRAIL_MS)
          if (!p) { prev = null; continue }
          const q = proj(p[0], p[1])
          if (prev) {
            const f = 1 - i / TRAIL_STEPS
            ctx.strokeStyle = col; ctx.globalAlpha = 0.05 + f * f * 0.9
            ctx.lineWidth = 1.5 + f * 3.5
            ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(q[0], q[1]); ctx.stroke()
          }
          prev = q
        }
        ctx.globalAlpha = 1
      }

      // voitures
      const cars: { r: Row; x: number; y: number; on: boolean }[] = []
      for (const r of rows) {
        const p = pos(r.n, tt)
        if (!p) continue
        const [x, y] = proj(p[0], p[1])
        if (x < -40 || y < -40 || x > w + 40 || y > h + 40) continue
        cars.push({ r, x, y, on: r.n === S.selected })
      }
      hits.current = cars.map((k) => ({ n: k.r.n, x: k.x, y: k.y }))
      const near = S.following && me
      const R = near ? 7 : 5
      for (const k of cars) {
        if (k.on) continue
        ctx.globalAlpha = k.r.out ? 0.3 : S.selected != null ? 0.85 : 1
        ctx.beginPath(); ctx.arc(k.x, k.y, R, 0, Math.PI * 2)
        ctx.fillStyle = k.r.color; ctx.fill()
        ctx.lineWidth = 2; ctx.strokeStyle = '#08090a'; ctx.stroke()
      }
      ctx.globalAlpha = 1
      const mine = cars.find((k) => k.on)
      if (mine) {
        const a = S.heading + c.rot
        ctx.beginPath(); ctx.arc(mine.x, mine.y, 17, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill()
        ctx.lineWidth = 1.25; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.stroke()
        // flèche de direction
        ctx.save(); ctx.translate(mine.x, mine.y); ctx.rotate(a)
        ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(4, -6.5); ctx.lineTo(7, 0); ctx.lineTo(4, 6.5); ctx.closePath()
        ctx.fillStyle = '#ffffff'; ctx.globalAlpha = near ? 0.95 : 0; ctx.fill(); ctx.globalAlpha = 1
        ctx.restore()
        ctx.beginPath(); ctx.arc(mine.x, mine.y, 8.5, 0, Math.PI * 2)
        ctx.fillStyle = mine.r.color; ctx.fill()
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffffff'; ctx.stroke()
      }

      // étiquettes sans chevauchement (glouton : voiture suivie puis ordre de course)
      ctx.font = `600 11px ${FONT}`
      ctx.textBaseline = 'middle'
      const placed: [number, number, number, number][] = cars.map((k) => [k.x - R - 1, k.y - R - 1, k.x + R + 1, k.y + R + 1])
      // zones couvertes par le HUD et les commandes : pas d'étiquette dessous
      const wr = wrap.getBoundingClientRect()
      for (const el of wrap.querySelectorAll<HTMLElement>('[data-overlay]')) {
        const b = el.getBoundingClientRect()
        placed.push([b.left - wr.left - 4, b.top - wr.top - 4, b.right - wr.left + 4, b.bottom - wr.top + 4])
      }
      const order = [...cars].sort((a, b) => Number(b.on) - Number(a.on) || a.r.pos - b.r.pos)
      const maxLabels = near ? 40 : 22
      let count = 0
      for (const k of order) {
        if (count >= maxLabels) break
        const txt = k.on ? `P${k.r.pos}  ${k.r.acr}` : k.r.acr
        const tw = ctx.measureText(txt).width + 14, th = 20
        const gap = k.on ? 14 : R + 5
        const cands: [number, number][] = [[k.x + gap, k.y - th / 2], [k.x - gap - tw, k.y - th / 2], [k.x - tw / 2, k.y - gap - th], [k.x - tw / 2, k.y + gap], [k.x + gap * 0.7, k.y - gap * 0.7 - th], [k.x - gap * 0.7 - tw, k.y + gap * 0.7]]
        const ok = cands.find(([x, y]) => x > 2 && y > 2 && x + tw < w - 2 && y + th < h - 2 && placed.every(([a, b, c2, d]) => x >= c2 || x + tw <= a || y >= d || y + th <= b))
        if (!ok) continue
        const [x, y] = ok
        placed.push([x - 3, y - 3, x + tw + 3, y + th + 3])
        count++
        ctx.globalAlpha = k.r.out ? 0.4 : 1
        ctx.beginPath(); ctx.roundRect(x, y, tw, th, th / 2)
        ctx.fillStyle = k.on ? '#ffffff' : 'rgba(8,9,10,0.86)'; ctx.fill()
        if (!k.on) { ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.stroke() }
        ctx.fillStyle = k.on ? '#08090a' : '#f7f8f8'
        ctx.fillText(txt, x + 7, y + th / 2 + 0.5)
      }
      ctx.globalAlpha = 1

      if (ts - lastHud > 300) {
        lastHud = ts
        const v = S.selected == null ? null : !!me
        setHasPos((p) => (p === v ? p : v))
      }
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [loc, now, track, bounds])

  const onSelectRef = useRef(onSelect)
  useEffect(() => { onSelectRef.current = onSelect })

  // ---------- gestes : pincer pour zoomer, molette, glisser (vue d'ensemble), toucher pour choisir ----------
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const pts = new Map<number, { x: number; y: number; x0: number; y0: number }>()
    let pinch = 0, moved = false
    const zoomBy = (f: number) => {
      const S = st.current
      if (S.following && S.selected != null) { S.zoom = clamp(S.zoom * f, ZMIN, ZMAX); setZoomUi(S.zoom) }
      else { S.ovZoom = clamp(S.ovZoom * f, 0.6, 12); setZoomUi(S.ovZoom) }
    }
    const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y) }
    const down = (e: PointerEvent) => {
      cv.setPointerCapture(e.pointerId)
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY })
      if (pts.size === 1) moved = false
      if (pts.size === 2) { pinch = dist(); moved = true }
    }
    const move = (e: PointerEvent) => {
      const p = pts.get(e.pointerId)
      if (!p) return
      const dx = e.clientX - p.x, dy = e.clientY - p.y
      p.x = e.clientX; p.y = e.clientY
      if (Math.hypot(p.x - p.x0, p.y - p.y0) > 8) moved = true
      if (pts.size === 2) { const d = dist(); if (pinch > 0) zoomBy(d / pinch); pinch = d; return }
      const S = st.current, c = cam.current
      if (pts.size === 1 && moved && !(S.following && S.selected != null)) {
        // glisser la carte (vue d'ensemble) en tenant compte de la rotation
        const cos = Math.cos(-c.rot), sin = Math.sin(-c.rot)
        S.pan[0] -= (dx * cos - dy * sin) / c.s; S.pan[1] -= (dx * sin + dy * cos) / c.s
      }
    }
    const up = (e: PointerEvent) => {
      const p = pts.get(e.pointerId)
      pts.delete(e.pointerId)
      if (pts.size < 2) pinch = 0
      if (!p || moved || pts.size) return
      const r = cv.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      let best: Hit | null = null, bd = 30
      for (const hh of hits.current) { const d = Math.hypot(hh.x - x, hh.y - y); if (d < bd) { bd = d; best = hh } }
      if (best) onSelectRef.current(best.n)
    }
    const wheel = (e: WheelEvent) => { e.preventDefault(); zoomBy(Math.exp(-e.deltaY * 0.0015)) }
    cv.addEventListener('pointerdown', down)
    cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerup', up)
    cv.addEventListener('pointercancel', up)
    cv.addEventListener('wheel', wheel, { passive: false })
    return () => {
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move)
      cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); cv.removeEventListener('wheel', wheel)
    }
  }, [])
  const zoomStep = (f: number) => {
    const S = st.current
    if (S.following && S.selected != null) { S.zoom = clamp(S.zoom * f, ZMIN, ZMAX); setZoomUi(S.zoom) }
    else { S.ovZoom = clamp(S.ovZoom * f, 0.6, 12); setZoomUi(S.ovZoom) }
  }
  const overview = () => { st.current.ovZoom = 1; st.current.pan = [0, 0]; setFollowing(false); setZoomUi(1) }
  const follow = () => { setFollowing(true); setZoomUi(st.current.zoom) }

  // ---------- HUD ----------
  const rows = snap.rows
  const me = selected != null ? rows.find((r) => r.n === selected) ?? null : null
  const ahead = me ? rows.find((r) => r.pos === me.pos - 1) ?? null : null
  const win = selected != null && car ? car.window(selected, t - 4000, t + 1500) : []
  const tel = carAt(win, t)
  const telStale = !tel || t - tel.t > 6000
  const isFollowing = following && selected != null
  const pill = 'min-h-11 px-4 rounded-full text-[13px] font-medium inline-flex items-center gap-2 transition-colors'
  const ghost = `${pill} bg-[#08090a]/85 border border-white/[0.12] text-zinc-200 hover:bg-[#161718]`

  return (
    <section className="bg-[#08090a] border border-white/10 rounded-3xl overflow-hidden" aria-label="Suivre une voiture">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight">Suivre une voiture</h2>
          {isLive && <span className="rounded-full bg-white text-[#08090a] text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-1">Direct</span>}
        </div>
        <div className="flex items-center gap-2">
          <div role="radiogroup" aria-label="Orientation de la caméra" className="inline-flex p-1 rounded-full bg-[#141516] border border-white/[0.08]">
            {([['fixe', 'Carte fixe'], ['embarquee', 'Caméra embarquée']] as const).map(([k, l]) => (
              <button key={k} role="radio" aria-checked={mode === k} onClick={() => setMode(k)} className={`min-h-9 px-3.5 rounded-full text-[12px] font-medium transition-colors ${mode === k ? 'bg-white text-[#08090a]' : 'text-zinc-400 hover:text-white'}`}>{l}</button>
            ))}
          </div>
          <button onClick={onClose} className="size-11 grid place-items-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06]" aria-label="Fermer le suivi">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </header>

      <div ref={wrapRef} className="relative h-[60dvh] sm:h-[64dvh] lg:h-[min(70dvh,760px)] min-h-[22rem]">
        <canvas ref={canvasRef} data-follow-canvas className="absolute inset-0 block select-none [touch-action:none] cursor-crosshair" role="img" aria-label={me ? `Caméra centrée sur ${me.name}` : 'Carte du circuit : touchez une voiture pour la suivre'} />

        {/* HUD */}
        {me && (
          <div data-overlay className="absolute left-3 top-3 sm:left-4 sm:top-4 w-[min(17.5rem,calc(100%-1.5rem))] rounded-2xl bg-[#08090a]/90 border border-white/[0.1] overflow-hidden pointer-events-none">
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
              <span className="w-1 self-stretch rounded-full" style={{ backgroundColor: me.color }} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-tight truncate">{me.name}</p>
                <p className="text-[11px] text-zinc-500 truncate">{me.team}</p>
              </div>
              <p className="text-2xl font-semibold tabular-nums tracking-[-0.03em]">P{me.pos}</p>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-3 px-4 pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">km/h</p>
                <p className={`text-[2.6rem] font-semibold leading-none tabular-nums tracking-[-0.04em] ${telStale ? 'text-zinc-600' : ''}`}>{tel && !telStale ? tel.speed : '—'}</p>
              </div>
              <div className="size-14 grid place-items-center rounded-xl border border-white/[0.1] bg-[#111213]">
                <span className="text-3xl font-semibold tabular-nums leading-none" aria-label="Rapport engagé">{tel && !telStale ? (tel.gear === 0 ? 'N' : tel.gear) : '—'}</span>
              </div>
            </div>
            {tel && !telStale && (
              <div className="px-4 pb-3 grid grid-cols-2 gap-2" aria-hidden>
                <div className="h-1 rounded-full bg-[#1d1e20] overflow-hidden"><div className="h-full bg-white" style={{ width: tel.brk > 0 ? '100%' : '0%' }} /></div>
                <div className="h-1 rounded-full bg-[#1d1e20] overflow-hidden"><div className="h-full" style={{ width: `${Math.min(100, tel.thr)}%`, backgroundColor: me.color }} /></div>
              </div>
            )}
            <div className="grid grid-cols-2 border-t border-white/[0.07] text-[12px]">
              <div className="px-4 py-2.5 border-r border-white/[0.07]">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{snap.timingMode === 'race' ? 'Écart devant' : 'Écart'}</p>
                <p className="mt-0.5 font-semibold tabular-nums truncate">{me.pos === 1 ? (snap.timingMode === 'race' ? 'En tête' : 'Meilleur temps') : `${ahead?.acr ?? ''} ${me.int}`.trim()}</p>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Tour</p>
                  <p className="mt-0.5 font-semibold tabular-nums">{me.lapNo || '—'}</p>
                </div>
                {me.tyre && <TyreDot c={me.tyre.compound} size={20} />}
              </div>
            </div>
            {telStale && <p className="px-4 pb-3 text-[10px] text-zinc-500">{car ? 'Télémétrie en chargement ou indisponible' : 'Télémétrie indisponible'}</p>}
          </div>
        )}

        {/* messages */}
        {(selected == null || hasPos === false || !bounds) && (
          <div className="absolute inset-x-0 bottom-20 flex justify-center px-4 pointer-events-none">
            <p className="max-w-md text-center text-[13px] leading-snug text-zinc-300 bg-[#08090a]/90 border border-white/[0.1] rounded-full px-5 py-2.5">
              {!bounds ? 'Chargement des positions des voitures…'
                : selected == null ? 'Touchez une voiture sur la carte ou choisissez un pilote ci-dessous.'
                : me?.out ? `${me.acr} n’est plus en piste.`
                : me?.inPit ? `${me?.acr ?? ''} est au stand : position momentanément indisponible.`
                : `Position de ${me?.acr ?? 'ce pilote'} indisponible à cet instant.`}
            </p>
          </div>
        )}

        {/* commandes */}
        <div data-overlay className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 flex items-center gap-2">
          {isFollowing ? (
            <button onClick={overview} className={ghost}>
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
              Vue d’ensemble
            </button>
          ) : selected != null && me ? (
            <button onClick={follow} className={`${pill} bg-white text-[#08090a] font-semibold`}>Suivre {me.acr}</button>
          ) : null}
          <div className="inline-flex rounded-full bg-[#08090a]/85 border border-white/[0.12] overflow-hidden">
            <button onClick={() => zoomStep(1 / 1.4)} className="size-11 grid place-items-center text-zinc-200 hover:bg-[#161718]" aria-label="Dézoomer">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /></svg>
            </button>
            <span className="min-w-12 grid place-items-center text-[11px] tabular-nums text-zinc-500 border-x border-white/[0.08]" aria-live="polite">×{zoomUi.toFixed(1).replace('.', ',')}</span>
            <button onClick={() => zoomStep(1.4)} className="size-11 grid place-items-center text-zinc-200 hover:bg-[#161718]" aria-label="Zoomer">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* choix du pilote */}
      <div className="flex gap-2 overflow-x-auto px-4 sm:px-5 py-3 border-t border-white/[0.07] [scrollbar-width:none]" role="listbox" aria-label="Choisir le pilote à suivre">
        {rows.map((r) => {
          const on = r.n === selected
          return (
            <button key={r.n} role="option" aria-selected={on} onClick={() => onSelect(r.n)}
              className={`shrink-0 min-h-10 pl-2.5 pr-3.5 rounded-full inline-flex items-center gap-2 text-[12px] font-medium tabular-nums transition-colors ${on ? 'bg-white text-[#08090a]' : 'bg-[#121314] text-zinc-300 border border-white/[0.07] hover:text-white'} ${r.out ? 'opacity-40' : ''}`}>
              <span className={`w-5 text-right text-zinc-500`}>{r.pos}</span>
              <span className="size-2 rounded-full" style={{ backgroundColor: r.color }} />
              {r.acr}
            </button>
          )
        })}
      </div>
    </section>
  )
}
