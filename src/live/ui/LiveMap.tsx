import { useEffect, useMemo, useRef } from 'react'
import type { LocationStore } from '../data'
import type { Row } from '../model'

/** Mini-carte : tracé du circuit (un tour de référence) + une pastille par voiture, mise à jour en continu. */
export default function LiveMap({ loc, now, rows, selected, onSelect, version }: { loc: LocationStore | null; now: () => number; rows: Row[]; selected: number | null; onSelect: (n: number) => void; version: number }) {
  const gRefs = useRef(new Map<number, SVGGElement>())
  const lRefs = useRef(new Map<number, SVGGElement>())
  const lnRefs = useRef(new Map<number, SVGLineElement>())
  const selRef = useRef(selected)
  useEffect(() => { selRef.current = selected })
  const rowsRef = useRef(rows)
  useEffect(() => { rowsRef.current = rows })
  const o = loc?.outline ?? null

  // cadre : tracé si disponible, sinon enveloppe des positions déjà reçues
  const frame = useMemo(() => {
    void version
    if (o) return { minX: o.minX, maxX: o.maxX, minY: o.minY, maxY: o.maxY }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const arr of loc?.per.values() ?? []) for (let i = 0; i < arr.length; i += 4) {
      const s = arr[i]
      if (s.x === 0 && s.y === 0) continue
      minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x); minY = Math.min(minY, s.y); maxY = Math.max(maxY, s.y)
    }
    return Number.isFinite(minX) ? { minX, maxX, minY, maxY } : null
  }, [o, loc, version])

  const geo = useMemo(() => {
    if (!frame) return null
    const w = frame.maxX - frame.minX, h = frame.maxY - frame.minY
    const span = Math.max(w, h, 1)
    const pad = span * 0.1
    const vb = `${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`
    const px = (x: number) => x - frame.minX
    const py = (y: number) => frame.maxY - y
    const d = o ? o.pts.map((p, i) => `${i ? 'L' : 'M'}${px(p[0]).toFixed(0)} ${py(p[1]).toFixed(0)}`).join('') + 'Z' : ''
    let sf: { x: number; y: number; dx: number; dy: number } | null = null
    if (o) {
      const a = o.pts[0], b = o.pts[Math.min(6, o.pts.length - 1)]
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
      sf = { x: px(a[0]), y: py(a[1]), dx: (b[0] - a[0]) / L, dy: -(b[1] - a[1]) / L }
    }
    return { vb, px, py, d, span, sf }
  }, [frame, o])

  useEffect(() => {
    if (!geo || !loc) return
    let raf = 0
    let last = 0
    const loop = (ts: number) => {
      raf = requestAnimationFrame(loop)
      if (ts - last < 16) return
      last = ts
      const t = now()
      const R = geo.span * 0.016
      const cars: { r: Row; x: number; y: number }[] = []
      for (const r of rowsRef.current) {
        const g = gRefs.current.get(r.n)
        if (!g) continue
        const p = loc.at(r.n, t)
        if (!p) { g.setAttribute('visibility', 'hidden'); continue }
        const x = geo.px(p[0]), y = geo.py(p[1])
        g.setAttribute('visibility', 'visible')
        g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`)
        cars.push({ r, x, y })
      }
      placeLabels(cars, R, selRef.current, lRefs.current, lnRefs.current)
      for (const r of rowsRef.current) if (!cars.some((c) => c.r.n === r.n)) { lRefs.current.get(r.n)?.setAttribute('visibility', 'hidden'); lnRefs.current.get(r.n)?.setAttribute('visibility', 'hidden') }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [geo, loc, now])

  if (!geo) {
    return (
      <div className="aspect-[4/3] flex items-center justify-center text-sm text-zinc-500 px-6 text-center">
        Chargement des positions des voitures…
      </div>
    )
  }
  const R = geo.span * 0.016
  const ordered = [...rows].sort((a, b) => Number(a.n === selected) - Number(b.n === selected))
  return (
    <svg data-livemap viewBox={geo.vb} className="w-full aspect-[4/3] max-h-[52dvh] lg:max-h-[36dvh] select-none [touch-action:manipulation]" role="img" aria-label="Carte du circuit avec la position des voitures">
      {geo.d && (
        <>
          <path d={geo.d} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth={R * 2.2} strokeLinejoin="round" strokeLinecap="round" />
          <path d={geo.d} fill="none" stroke="rgb(255 255 255 / 0.32)" strokeWidth={R * 0.22} strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
      {geo.sf && <line x1={geo.sf.x - geo.sf.dy * R * 1.4} y1={geo.sf.y + geo.sf.dx * R * 1.4} x2={geo.sf.x + geo.sf.dy * R * 1.4} y2={geo.sf.y - geo.sf.dx * R * 1.4} stroke="#fff" strokeWidth={R * 0.22} strokeLinecap="round" />}
      {ordered.map((r) => {
        const on = r.n === selected
        const dim = selected != null && !on
        const k = on ? 1.35 : 1
        return (
          <g
            key={r.n}
            data-car={r.pos}
            ref={(el) => { if (el) gRefs.current.set(r.n, el); else gRefs.current.delete(r.n) }}
            visibility="hidden"
            onClick={() => onSelect(r.n)}
            style={{ cursor: 'pointer', transition: 'opacity .3s' }}
            opacity={r.out ? 0.3 : dim ? 0.4 : 1}
          >
            <circle r={R * 2.6} fill="transparent" />
            {on && <circle r={R * 2} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={R * 0.14} />}
            <circle r={R * k} fill={r.color} stroke="#0a0a0a" strokeWidth={R * 0.28} />
          </g>
        )
      })}
      {/* étiquettes au-dessus des pastilles, placées sans chevauchement à chaque image */}
      {ordered.map((r) => (
        <line key={'l' + r.n} ref={(el) => { if (el) lnRefs.current.set(r.n, el); else lnRefs.current.delete(r.n) }} visibility="hidden" stroke={r.n === selected ? '#fff' : r.color} strokeOpacity={0.55} strokeWidth={R * 0.12} pointerEvents="none" />
      ))}
      {ordered.map((r) => {
        const on = r.n === selected
        const k = on ? 1.2 : 1
        const w = labelW(R, on), h = R * 1.9 * k
        return (
          <g key={'t' + r.n} data-label={r.acr} ref={(el) => { if (el) lRefs.current.set(r.n, el); else lRefs.current.delete(r.n) }} visibility="hidden" onClick={() => onSelect(r.n)} style={{ cursor: 'pointer' }} opacity={r.out ? 0.35 : selected != null && !on ? 0.55 : 1}>
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={on ? '#fff' : 'rgb(10 10 10 / 0.86)'} stroke="rgb(255 255 255 / 0.14)" strokeWidth={R * 0.08} />
            <text x={0} y={R * 0.42 * k} textAnchor="middle" fontSize={R * 1.15 * k} fontWeight={600} fill={on ? '#0a0a0a' : '#fff'} style={{ fontFamily: 'inherit' }}>{on ? `P${r.pos} ${r.acr}` : r.acr}</text>
          </g>
        )
      })}
    </svg>
  )
}

const labelW = (R: number, on: boolean) => R * (on ? 5.6 : 3.5)

/**
 * Placement glouton des étiquettes : voiture sélectionnée d'abord, puis ordre de course.
 * Chaque étiquette essaie 8 positions proches, puis 6 plus éloignées reliées par un trait ;
 * si rien ne tient, elle est masquée (sauf pour la voiture sélectionnée).
 */
function placeLabels(cars: { r: Row; x: number; y: number }[], R: number, selected: number | null, labels: Map<number, SVGGElement>, lines: Map<number, SVGLineElement>) {
  const boxes: [number, number, number, number][] = cars.map((c) => [c.x - R * 1.15, c.y - R * 1.15, c.x + R * 1.15, c.y + R * 1.15])
  const order = [...cars].sort((a, b) => Number(b.r.n === selected) - Number(a.r.n === selected) || a.r.pos - b.r.pos)
  for (const c of order) {
    const on = c.r.n === selected
    const w = labelW(R, on), h = R * 1.9 * (on ? 1.2 : 1)
    const g = R * (on ? 2.2 : 1.6), f = g * 2.3
    const cands: [number, number][] = [
      [g + w / 2, -g], [-g - w / 2, -g], [g + w / 2, g], [-g - w / 2, g], [0, -g - h / 2], [0, g + h / 2], [g + w / 2, 0], [-g - w / 2, 0],
      [f + w / 2, -f], [-f - w / 2, -f], [f + w / 2, f], [-f - w / 2, f], [0, -f - h / 2], [0, f + h / 2],
    ]
    const box = ([dx, dy]: [number, number]): [number, number, number, number] => [c.x + dx - w / 2, c.y + dy - h / 2, c.x + dx + w / 2, c.y + dy + h / 2]
    const free = (b: [number, number, number, number]) => boxes.every(([a, b2, c2, d]) => b[0] >= c2 || b[2] <= a || b[1] >= d || b[3] <= b2)
    const i = cands.findIndex((q) => free(box(q)))
    const pick = i >= 0 ? i : on ? 0 : -1
    const el = labels.get(c.r.n), ln = lines.get(c.r.n)
    if (pick < 0) { el?.setAttribute('visibility', 'hidden'); ln?.setAttribute('visibility', 'hidden'); continue }
    const [dx, dy] = cands[pick]
    const b = box([dx, dy])
    boxes.push([b[0] - R * 0.2, b[1] - R * 0.2, b[2] + R * 0.2, b[3] + R * 0.2])
    el?.setAttribute('visibility', 'visible')
    el?.setAttribute('transform', `translate(${(c.x + dx).toFixed(1)} ${(c.y + dy).toFixed(1)})`)
    if (ln) {
      if (pick >= 8) {
        const lx = Math.max(b[0], Math.min(b[2], c.x)), ly = Math.max(b[1], Math.min(b[3], c.y))
        ln.setAttribute('x1', c.x.toFixed(1)); ln.setAttribute('y1', c.y.toFixed(1)); ln.setAttribute('x2', lx.toFixed(1)); ln.setAttribute('y2', ly.toFixed(1))
        ln.setAttribute('visibility', 'visible')
      } else ln.setAttribute('visibility', 'hidden')
    }
  }
}
