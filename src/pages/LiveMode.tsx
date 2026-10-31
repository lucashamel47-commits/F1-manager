import { lazy, Suspense } from 'react'

const LivePage = lazy(() => import('../live/LivePage'))

/** Mode « Live Timing » : plein écran, indépendant de Hors Course. */
export default function LiveMode({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-dvh w-full flex flex-col bg-black text-white">
      <header className="sticky top-0 z-30 w-full bg-black/95 backdrop-blur border-b border-zinc-800">
        <div className="h-1 bg-red-600" />
        <div className="flex items-center gap-3 px-4 sm:px-5 lg:px-6 h-14 lg:h-16">
          <button
            onClick={onBack}
            aria-label="Changer de mode"
            className="-ml-2 min-h-11 px-2 flex items-center gap-1.5 text-zinc-400 hover:text-white active:text-white"
          >
            <span className="text-xl leading-none">‹</span>
            <span className="text-xs font-bold uppercase tracking-wider">Modes</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white font-black italic px-2 py-0.5 text-lg leading-none">F1</span>
            <span className="font-black uppercase tracking-tight text-lg leading-none">Manager</span>
          </div>
          <span className="ml-auto inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em]">
            <span className="size-2 rounded-full bg-red-600 animate-pulse" aria-hidden />
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
