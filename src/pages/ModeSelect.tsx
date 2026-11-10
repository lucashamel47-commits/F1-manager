import NextSessionLine from '../components/NextSessionLine'
import { Brand } from '../components/landing/Sections'

interface Props {
  onSelectHors: () => void
  onSelectLive: () => void
  onSelectNotif: () => void
  onLogout: () => void
  onInfo: (type: 'hors' | 'live') => void
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)

/** Choix du mode : mise en page Novex (en-tête 64 px, titre à gauche) et grandes rangées façon Canal+ (titre 26 px, filet fin, flèche). */
export default function ModeSelect({ onSelectHors, onSelectLive, onSelectNotif, onLogout, onInfo }: Props) {
  const row = 'group flex min-h-[7.5rem] flex-1 items-center gap-6 py-8 text-left sm:min-h-[9rem]'
  const info = 'grid size-11 shrink-0 place-items-center rounded-full text-[#636464] hover:text-white'
  return (
    <div className="min-h-dvh text-white">
      <header className="sticky top-0 z-30 border-b border-[#2b2c2d] bg-[#08090a]">
        <div className="app-wrap flex h-16 items-center justify-between">
          <Brand />
          <button onClick={onLogout} className="inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-medium text-[#939494] hover:text-white">Changer de compte</button>
        </div>
      </header>

      <main className="app-wrap pb-24 pt-16 sm:pt-24">
        
        <h1 className="app-in mt-6 max-w-[40rem] text-[2.25rem] font-[560] leading-[1.06] tracking-[-0.035em] sm:text-[2.75rem]">Choisis ton mode.</h1>
        

        <div className="app-in app-in-3 mt-14 border-b border-[#2b2c2d] sm:mt-20">
          <div className="flex items-center border-t border-[#2b2c2d] hover:bg-[#0c0d0e]">
            <button onClick={onSelectHors} className={row}>
              <span className="min-w-0 flex-1">
                <span className="rail-title block">Hors Course</span>
                <span className="mt-2 block max-w-md text-[15px] leading-snug text-[#939494]">Classements, calendrier, statistiques, tes favoris.</span>
              </span>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#0a0a0a] transition group-hover:translate-x-1"><Arrow /></span>
            </button>
            <button aria-label="Informations" onClick={() => onInfo('hors')} className={info}><span className="grid size-6 place-items-center rounded-full border border-[#3d3e3f] text-xs">?</span></button>
          </div>

          <div className="flex items-center border-t border-[#2b2c2d] hover:bg-[#0c0d0e]">
            <button onClick={onSelectLive} className={row}>
              <span className="min-w-0 flex-1">
                <span className="rail-title flex items-center gap-3">
                  <span className="size-2 rounded-full bg-red-500 animate-pulse" aria-hidden />
                  Live Timing
                  <span className="rounded-full border border-[#3d3e3f] px-2 py-1 font-sans text-[10px] font-medium uppercase leading-none tracking-wider text-[#c4c5c5]">Live</span>
                </span>
                <span className="mt-2 block max-w-md text-[15px] leading-snug text-[#939494]">Positions, pneus, carte du circuit, radios. Rejeu des courses passées.</span>
              </span>
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#3d3e3f] text-[#c4c5c5] transition group-hover:translate-x-1 group-hover:bg-[#222324]"><Arrow /></span>
            </button>
            <button aria-label="Informations" onClick={() => onInfo('live')} className={info}><span className="grid size-6 place-items-center rounded-full border border-[#3d3e3f] text-xs">?</span></button>
          </div>

          <div className="flex items-center border-t border-[#2b2c2d] hover:bg-[#0c0d0e]">
            <button onClick={onSelectNotif} className={row}>
              <span className="min-w-0 flex-1">
                <span className="rail-title block">Rappels &amp; calendrier</span>
                <span className="mt-2 block max-w-md text-[15px] leading-snug text-[#939494]">Un email avant les sessions que tu choisis.</span>
              </span>
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#3d3e3f] text-[#c4c5c5] transition group-hover:translate-x-1 group-hover:bg-[#222324]"><Arrow /></span>
            </button>
            <span className="size-11 shrink-0" aria-hidden />
          </div>
        </div>
        <div className="mt-6 text-left"><NextSessionLine /></div>
      </main>
    </div>
  )
}
