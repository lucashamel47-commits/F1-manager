import { lazy, Suspense } from 'react'

const LivePage = lazy(() => import('../live/LivePage'))

/** Mode « Live Timing » : plein écran, indépendant de Hors Course. */
export default function LiveMode({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-dvh w-full flex flex-col text-white">
      <header className="sticky top-0 z-30 w-full bg-[#08090a]/75 backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.08]">
        <div className="flex items-center gap-3 px-4 sm:px-5 lg:px-6 h-14 lg:h-16">
          <button
            onClick={onBack}
            aria-label="Changer de mode"
            className="-ml-2 min-h-11 px-2 flex items-center gap-1.5 text-zinc-400 hover:text-white active:text-white"
          >
            <span className="text-xl leading-none">‹</span>
            <span className="text-sm font-medium">Modes</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white font-bold px-2 py-1 rounded-md text-sm leading-none tracking-tight shadow-[0_0_20px_-4px_rgb(234_42_31_/_0.8)]">F1</span>
            <span className="font-semibold tracking-tight text-lg leading-none">Manager</span>
          </div>
          <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium">
            <span className="size-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_2px_rgb(234_42_31_/_0.8)]" aria-hidden />
            Live Timing
          </span>
        </div>
      </header>
      <Suspense fallback={<p className="p-8 text-sm text-zinc-500">Chargement du live…</p>}>
        <LivePage />
      </Suspense>
    </div>
  )
}
