import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** Bandeaux de l'app installable : hors ligne, prête hors ligne, nouvelle version disponible. */
export default function PwaStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)
  const [readyDismissed, setReadyDismissed] = useState(false)
  const [updDismissed, setUpdDismissed] = useState(false)
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Vérifie les mises à jour toutes les heures tant que l'app reste ouverte.
      if (reg) setInterval(() => { if (navigator.onLine) reg.update().catch(() => {}) }, 60 * 60 * 1000)
    },
  })

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // « Prêt hors ligne » disparaît tout seul.
  useEffect(() => {
    if (!offlineReady) return
    const t = setTimeout(() => setOfflineReady(false), 5000)
    return () => clearTimeout(t)
  }, [offlineReady, setOfflineReady])

  const showUpdate = needRefresh && !updDismissed
  const showReady = offlineReady && !readyDismissed && !showUpdate

  return (
    <>
      {!online && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pointer-events-none"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <p className="pointer-events-auto flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm px-4 py-2.5 shadow-xl">
            <span className="size-2 rounded-full bg-amber-400" aria-hidden />
            Hors ligne — données enregistrées affichées
          </p>
        </div>
      )}

      {(showUpdate || showReady) && (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pointer-events-none"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <div className="pointer-events-auto w-full max-w-md flex items-center gap-3 bg-zinc-950 border border-zinc-700 border-l-4 border-l-red-600 px-4 py-3 shadow-2xl">
            {showUpdate ? (
              <>
                <p className="flex-1 text-sm text-zinc-100">Une nouvelle version de F1 Manager est disponible.</p>
                <button onClick={() => setUpdDismissed(true)} className="min-h-11 px-2 text-xs text-zinc-400 active:text-white">Plus tard</button>
                <button onClick={() => updateServiceWorker(true)} className="min-h-11 px-4 text-xs font-bold uppercase tracking-wider bg-white text-black active:bg-zinc-300">Mettre à jour</button>
              </>
            ) : (
              <>
                <p className="flex-1 text-sm text-zinc-100">Prêt pour une utilisation hors ligne.</p>
                <button onClick={() => setReadyDismissed(true)} className="min-h-11 px-2 text-xs text-zinc-400 active:text-white">OK</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
