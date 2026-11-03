import type { ReactNode } from 'react'
import { compound } from './style'


export function TyreDot({ c, size = 18 }: { c?: string | null; size?: number }) {
  const k = compound(c)
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold leading-none shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.55, border: `2.5px solid ${k.color}`, color: k.color }}
      title={k.label}
      aria-label={k.label}
    >
      {k.letter}
    </span>
  )
}


export function FlagIcon({ flag, cat, msg, size = 18 }: { flag?: string | null; cat?: string; msg?: string; size?: number }) {
  const f = (flag ?? '').toUpperCase()
  const s = { width: size, height: size * 0.72 }
  if (cat === 'SafetyCar') {
    const v = /VSC|VIRTUAL/i.test(msg ?? '')
    return <span className="inline-flex items-center justify-center rounded-sm bg-orange-500 text-black font-bold shrink-0" style={{ ...s, width: size * 1.5, fontSize: size * 0.5 }}>{v ? 'VSC' : 'SC'}</span>
  }
  if (f === 'CHEQUERED') {
    return (
      <span className="shrink-0 rounded-sm overflow-hidden border border-zinc-600" style={{ ...s, backgroundImage: 'conic-gradient(#fff 25%, #000 0 50%, #fff 0 75%, #000 0)', backgroundSize: '50% 50%' }} />
    )
  }
  if (f === 'DOUBLE YELLOW') {
    return (
      <span className="inline-flex gap-0.5 shrink-0" style={s}>
        <span className="flex-1 rounded-[1px] bg-yellow-400" /><span className="flex-1 rounded-[1px] bg-yellow-400" />
      </span>
    )
  }
  if (f === 'BLACK AND WHITE') {
    return <span className="shrink-0 rounded-sm border border-zinc-500" style={{ ...s, background: 'linear-gradient(135deg,#fff 50%,#000 50%)' }} />
  }
  if (f === 'BLACK') return <span className="shrink-0 rounded-sm border border-zinc-500 bg-black" style={s} />
  const bg = f === 'GREEN' ? 'bg-emerald-500' : f === 'YELLOW' ? 'bg-yellow-400' : f === 'RED' ? 'bg-red-600' : f === 'BLUE' ? 'bg-sky-500' : f === 'CLEAR' ? 'bg-zinc-600' : ''
  if (!bg) return <span className="shrink-0 rounded-sm border border-zinc-700 text-zinc-500 text-[10px] leading-none flex items-center justify-center" style={s}>i</span>
  return <span className={`shrink-0 rounded-[2px] ${bg}`} style={s} />
}


export function Card({ title, right, children, className = '' }: { title?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 px-4 sm:px-5 h-12 border-b border-white/[0.07]">
          {title && <h3 className="kicker">{title}</h3>}
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { key: T; label: string }[]; value: T; onChange: (k: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="seg m-3 !flex overflow-x-auto [scrollbar-width:none]">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className="seg-item shrink-0 !min-h-9 !px-3.5 !text-xs sm:!text-sm"
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-sm text-zinc-500 text-center">{children}</p>
}
