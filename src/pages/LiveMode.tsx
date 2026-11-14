import { lazy, Suspense } from 'react'

const LivePage = lazy(() => import('../live/LivePage'))

/** Mode « Live Timing » : plein écran, indépendant de Hors Course. */
export default function LiveMode(_props: { onBack: () => void }) {
  return (
    <div className="min-h-dvh w-full flex flex-col text-white">
      <Suspense fallback={<p className="p-8 text-sm text-zinc-500">Chargement du live…</p>}>
        <LivePage />
      </Suspense>
    </div>
  )
}
