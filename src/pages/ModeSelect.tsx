import NextSessionLine from '../components/NextSessionLine'

interface Props {
  onSelectHors: () => void
  onSelectLive: () => void
  onSelectNotif: () => void
  onLogout: () => void
  onInfo: (type: 'hors' | 'live') => void
}

export default function ModeSelect({ onSelectHors, onSelectLive, onSelectNotif, onLogout, onInfo }: Props) {
  return (
    <div className="min-h-dvh text-white relative overflow-hidden">
      <div aria-hidden className="absolute left-1/2 top-[-280px] h-[600px] w-[860px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(99_102_241_/_0.24),transparent)] blur-2xl pointer-events-none" />
      <div className="relative flex flex-col items-center justify-center min-h-dvh px-4 sm:px-6 pb-28">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur">
            <span className="size-1.5 rounded-full bg-accent-400 shadow-[0_0_10px_2px_rgb(99_102_241_/_0.8)]" aria-hidden />
            Formula 1
          </span>
          <h1 className="mt-6 text-gradient text-5xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.045em] leading-[0.95]">F1 Manager</h1>
          <p className="mt-5 text-zinc-400 text-base">Choisis ton mode</p>
        </div>

        <div className="flex flex-col gap-3.5 w-full max-w-sm md:max-w-md">
          <div className="relative">
            <button
              onClick={onSelectHors}
              className="btn-primary w-full min-h-[4.25rem] rounded-full font-semibold text-base active:scale-[0.985]"
            >
              Hors Course
            </button>
            <button
              aria-label="Informations"
              onClick={() => onInfo('hors')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 size-11 rounded-full flex items-center justify-center text-white/80 hover:text-white text-xs"
            >
              <span className="size-6 rounded-full border border-white/40 flex items-center justify-center">?</span>
            </button>
          </div>

          <div className="relative">
            <button
              onClick={onSelectLive}
              className="glass w-full min-h-[4.25rem] text-white rounded-full font-semibold text-base transition hover:border-white/25 active:scale-[0.985] flex items-center justify-center gap-3"
            >
              <span className="size-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_2px_rgb(234_42_31_/_0.8)]" aria-hidden />
              Live Timing
              <span className="text-[10px] font-bold tracking-[0.15em] bg-accent-500 px-2 py-1 rounded-full leading-none">LIVE</span>
            </button>
            <button
              aria-label="Informations"
              onClick={() => onInfo('live')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 size-11 rounded-full flex items-center justify-center text-zinc-400 hover:text-white text-xs"
            >
              <span className="size-6 rounded-full border border-white/25 flex items-center justify-center">?</span>
            </button>
          </div>

          <button
            onClick={onSelectNotif}
            className="btn-ghost w-full min-h-14 rounded-full font-medium text-sm text-zinc-200 active:scale-[0.985] flex items-center justify-center gap-2.5"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
              <path d="M10.3 20a2 2 0 0 0 3.4 0" />
            </svg>
            Rappels &amp; calendrier
          </button>
          <NextSessionLine />
        </div>

        <button
          onClick={onLogout}
          className="mt-10 sm:mt-14 px-4 min-h-11 text-xs text-zinc-500 hover:text-zinc-300 tracking-wide"
        >
          Changer de compte
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 overflow-hidden border-t border-white/[0.07] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#08090a]/70 backdrop-blur-md [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] [-webkit-mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, group) => (
            <div key={group} className="flex">
              {['Red Bull Racing', 'Ferrari', 'Mercedes', 'McLaren', 'Aston Martin', 'Alpine', 'Williams', 'RB', 'Haas', 'Sauber'].map((team, i) => (
                <span key={`${group}-${i}`} className="mx-10 text-xs text-zinc-500 font-medium tracking-wide">
                  {team}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
