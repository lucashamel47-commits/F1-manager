interface Props {
  onSelectHors: () => void
  onLogout: () => void
  onInfo: (type: 'hors' | 'live') => void
}

export default function ModeSelect({ onSelectHors, onLogout, onInfo }: Props) {
  return (
    <div className="min-h-dvh bg-black text-white relative overflow-hidden">
      <div className="flex flex-col items-center justify-center min-h-dvh px-4 sm:px-6 pb-28">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-red-600 text-[11px] tracking-[0.6em] uppercase mb-4">Formula 1</p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-none">MANAGER</h1>
          <div className="mt-5 h-px w-16 bg-red-600 mx-auto" />
          <p className="mt-5 text-zinc-500 text-xs tracking-[0.3em] uppercase">Choisis ton mode</p>
        </div>

        <div className="flex flex-col gap-6 w-full max-w-xs sm:max-w-sm md:max-w-md">
          <div className="relative">
            <button
              onClick={onSelectHors}
              className="w-full py-5 bg-red-600 hover:bg-red-700 rounded-2xl font-semibold text-base transition"
            >
              Hors Course
            </button>
            <button
              aria-label="Informations"
              onClick={() => onInfo('hors')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white text-xs"
            >
              <span className="w-6 h-6 rounded-full border border-zinc-600 flex items-center justify-center">?</span>
            </button>
          </div>

          <div className="relative">
            <button
              disabled
              className="w-full py-5 bg-zinc-900/80 text-zinc-500 rounded-2xl font-semibold text-base cursor-not-allowed border border-zinc-800"
            >
              Live Timing
            </button>
            <button
              aria-label="Informations"
              onClick={() => onInfo('live')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white text-xs"
            >
              <span className="w-6 h-6 rounded-full border border-zinc-600 flex items-center justify-center">?</span>
            </button>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="mt-12 sm:mt-16 px-4 py-3 text-xs text-zinc-500 hover:text-zinc-400 tracking-wide"
        >
          Changer de compte
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 overflow-hidden border-t border-zinc-800/60 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-black/80 backdrop-blur-sm">
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