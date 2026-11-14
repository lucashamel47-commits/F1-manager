import { useEffect, useMemo, useRef } from 'react'
import type { LocationStore } from '../data'
import type { Row } from '../model'

/** Mini-carte : tracé du circuit (un tour de référence) + une pastille par voiture, mise à jour en continu. */
export default function LiveMap({ loc, now, rows, selected, onSelect, version }: { loc: LocationStore | null; now: () => number; rows: Row[]; selected: number | null; onSelect: (n: number) => void; version: number }) {
  const gRefs = useRef(new Map<number, SVGGElement>())
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
      for (const r of rowsRef.current) {
        const g = gRefs.current.get(r.n)
        if (!g) continue
        const p = loc.at(r.n, t)
        if (!p) { g.setAttribute('visibility', 'hidden'); continue }
        g.setAttribute('visibility', 'visible')
        g.setAttribute('transform', `translate(${geo.px(p[0]).toFixed(1)} ${geo.py(p[1]).toFixed(1)})`)
      }
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
            <g transform={`translate(${R * 1.7 * k} ${-R * 1.7 * k})`}>
              <rect x={0} y={-R * 0.95 * k} width={R * 3.5 * k} height={R * 1.9 * k} rx={R * 0.95 * k} fill={on ? '#fff' : 'rgb(10 10 10 / 0.82)'} stroke="rgb(255 255 255 / 0.12)" strokeWidth={R * 0.08} />
              <text x={R * 1.75 * k} y={R * 0.42 * k} textAnchor="middle" fontSize={R * 1.15 * k} fontWeight={600} fill={on ? '#0a0a0a' : '#fff'} style={{ fontFamily: 'inherit' }}>{r.acr}</text>
            </g>
          </g>
        )
      })}
    </svg>
  )
}
