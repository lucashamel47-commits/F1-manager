import { lazy, Suspense } from 'react'
import { LogoMark, TopBar } from '../components/MotorNav'

const LivePage = lazy(() => import('../live/LivePage'))

/** Mode « Live Timing » : plein écran, indépendant de Hors Course. */
export default function LiveMode({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-dvh w-full flex flex-col text-white">
      <TopBar>
        <div className="app-wrap flex items-center gap-3 h-16 lg:h-[4.5rem]">
          <button onClick={onBack} aria-label="Changer de mode" className="-ml-2 min-h-11 min-w-11 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 text-xl active:text-white">‹</button>
          <LogoMark />
          <span className="ml-auto inline-flex items-center gap-2 chip"><span className="size-2 rounded-full bg-red-500 animate-pulse" aria-hidden />Live Timing</span>
        </div>
      </TopBar>
      <Suspense fallback={<p className="p-8 text-sm text-zinc-500">Chargement du live…</p>}>
        <LivePage />
      </Suspense>
    </div>
  )
}
