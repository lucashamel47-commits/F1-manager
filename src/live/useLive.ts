import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSessions, OpenF1Error, ms } from './openf1'
import type { OFSession } from './openf1'
import { loadStore, startLivePolling, LocationStore, CarDataStore, isSettled } from './data'
import type { Progress } from './data'
import type { Store } from './model'

export type Status = 'idle' | 'loading' | 'ready' | 'error'
export interface Runtime {
  mode: 'live' | 'replay'
  status: Status
  progress: Progress | null
  error: OpenF1Error | Error | null
  store: Store | null
  loc: LocationStore | null
  car: CarDataStore | null
  t: number
  now: () => number
  playing: boolean
  speed: number
  play: () => void
  pause: () => void
  setSpeed: (s: number) => void
  seek: (t: number) => void
  /** Live : message d'erreur courant (401 / 429 / réseau) sans couper l'écran. */
  liveIssue: OpenF1Error | null
  lastUpdate: number
  /** pilote dont on suit la télémétrie */
  watch: number | null
  setWatch: (n: number | null) => void
  version: number
  reload: () => void
}

export function useSessionList(years: number[]) {
  const [state, setState] = useState<{ status: 'loading' | 'ok' | 'error'; sessions: OFSession[]; error: Error | null }>({ status: 'loading', sessions: [], error: null })
  const key = years.join(',')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let alive = true
    const ac = new AbortController()
    // oxlint-disable-next-line react/set-state-in-effect
    setState((s) => ({ ...s, status: 'loading' }))
    ;(async () => {
      try {
        const all: OFSession[] = []
        for (const y of key.split(',').map(Number)) all.push(...(await getSessions(y, ac.signal)))
        if (alive) setState({ status: 'ok', sessions: all.filter((s) => !s.is_cancelled).sort((a, b) => a.date_start.localeCompare(b.date_start)), error: null })
      } catch (e) {
        if (alive) setState({ status: 'error', sessions: [], error: e as Error })
      }
    })()
    return () => { alive = false; ac.abort() }
  }, [key, retry])
  return { ...state, reload: () => setRetry((r) => r + 1) }
}

/** Une instance par session affichée : chargement, horloge (rejeu) ou polling (live). */
export function useRuntime(session: OFSession | null, mode: 'live' | 'replay', simulate = false): Runtime {
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState<Progress | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [version, setVersion] = useState(0)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeedState] = useState(1)
  const [liveIssue, setLiveIssue] = useState<OpenF1Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState(0)
  const [watch, setWatch] = useState<number | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [objs, setObjs] = useState<{ store: Store; loc: LocationStore; car: CarDataStore } | null>(null)

  const storeRef = useRef<Store | null>(null)
  const locRef = useRef<LocationStore | null>(null)
  const carRef = useRef<CarDataStore | null>(null)
  const clock = useRef({ playing: false, speed: 1, anchorT: 0, anchorReal: 0, simOffset: 0 })
  const watchRef = useRef<number | null>(null)
  useEffect(() => { watchRef.current = watch }, [watch])

  const now = useCallback(() => {
    const c = clock.current
    if (mode === 'live') return Date.now() - c.simOffset
    const st = storeRef.current
    if (!c.playing) return c.anchorT
    return Math.min(st?.t1 ?? c.anchorT, c.anchorT + (performance.now() - c.anchorReal) * c.speed)
  }, [mode])

  const sessionKey = session?.session_key
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    if (!session) { setStatus('idle'); return }
    let alive = true
    const ac = new AbortController()
    let stopPoll: (() => void) | null = null
    storeRef.current = null; locRef.current = null; carRef.current = null
    setObjs(null)
    setStatus('loading'); setError(null); setProgress(null); setPlaying(false); setLiveIssue(null); setWatch(null)
    clock.current = { playing: false, speed: 1, anchorT: 0, anchorReal: 0, simOffset: 0 }
    setSpeedState(1)
    ;(async () => {
      try {
        const sim = mode === 'live' && simulate
        if (sim) clock.current.simOffset = Date.now() - (ms(session.date_start) + 14 * 60_000)
        const store = await loadStore(session, { onProgress: (p) => alive && setProgress(p), signal: ac.signal, until: sim ? now() : undefined })
        if (!alive) return
        const settled = mode === 'replay' && isSettled(session)
        const loc = new LocationStore(session.session_key, store.t0, settled)
        const car = new CarDataStore(session.session_key, settled)
        storeRef.current = store; locRef.current = loc; carRef.current = car
        setObjs({ store, loc, car })
        if (mode === 'replay') {
          clock.current.anchorT = store.t0
          setT(store.t0)
        } else {
          setT(now())
          stopPoll = startLivePolling({
            store, now, loc, car, simulated: sim,
            carWatch: () => watchRef.current,
            onUpdate: () => { if (alive) { setVersion((v) => v + 1); setLastUpdate(Date.now()) } },
            onOk: () => alive && setLiveIssue(null),
            onError: (e) => { if (alive && e instanceof OpenF1Error) setLiveIssue(e) },
          }).stop
        }
        setStatus('ready')
        setVersion((v) => v + 1)
        loc.buildOutline(store, ac.signal).then(() => alive && setVersion((v) => v + 1)).catch(() => {})
      } catch (e) {
        if (alive && !(e instanceof OpenF1Error && e.kind === 'abort')) { setError(e as Error); setStatus('error') }
      }
    })()
    return () => { alive = false; ac.abort(); stopPoll?.() }
  }, [sessionKey, mode, simulate, reloadKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // horloge d'affichage (4 Hz en rejeu / 1 Hz en live) + préchargement des positions
  useEffect(() => {
    if (status !== 'ready') return
    const tickMs = mode === 'live' ? 1000 : 250
    const id = setInterval(() => {
      const n = now()
      const st = storeRef.current
      if (mode === 'replay' && st && clock.current.playing && n >= st.t1) {
        clock.current = { ...clock.current, playing: false, anchorT: st.t1 }
        setPlaying(false)
      }
      if (mode === 'live' || clock.current.playing) setT(n)
    }, tickMs)
    return () => clearInterval(id)
  }, [status, mode, now])

  useEffect(() => {
    if (status !== 'ready' || mode !== 'replay') return
    const id = setInterval(() => {
      locRef.current?.ensure(now(), clock.current.speed, clock.current.playing)
      const w = watchRef.current
      if (w != null && storeRef.current) carRef.current?.ensure(w, now(), storeRef.current.t0)
    }, 500)
    locRef.current?.ensure(now(), clock.current.speed, clock.current.playing)
    return () => clearInterval(id)
  }, [status, mode, now])

  const rebase = useCallback((over: Partial<typeof clock.current>) => {
    const c = clock.current
    const cur = now()
    clock.current = { ...c, anchorT: cur, anchorReal: performance.now(), ...over }
  }, [now])

  const play = useCallback(() => {
    const st = storeRef.current
    if (!st) return
    const at = now() >= st.t1 - 500 ? st.t0 : now()
    clock.current = { ...clock.current, playing: true, anchorT: at, anchorReal: performance.now() }
    setPlaying(true); setT(at)
  }, [now])
  const pause = useCallback(() => { rebase({ playing: false }); setPlaying(false); setT(clock.current.anchorT) }, [rebase])
  const setSpeed = useCallback((s: number) => { rebase({ speed: s }); setSpeedState(s) }, [rebase])
  const seek = useCallback((tt: number) => {
    const st = storeRef.current
    const v = st ? Math.max(st.t0, Math.min(st.t1, tt)) : tt
    clock.current = { ...clock.current, anchorT: v, anchorReal: performance.now() }
    setT(v)
    locRef.current?.ensure(v, clock.current.speed, false)
  }, [])

  return useMemo(() => ({
    mode, status, progress, error, store: objs?.store ?? null, loc: objs?.loc ?? null, car: objs?.car ?? null,
    t, now, playing, speed, play, pause, setSpeed, seek, liveIssue, lastUpdate, watch, setWatch, version,
    reload: () => setReloadKey((k) => k + 1),
  }), [mode, status, progress, error, t, now, playing, speed, play, pause, setSpeed, seek, liveIssue, lastUpdate, watch, version, objs])
}
