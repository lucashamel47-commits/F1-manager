import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getCalendar } from '../lib/f1api'
import { allSessions, countdown, formatWhen, type Session } from '../lib/sessions'
import { useChampionship } from '../lib/championship'
import { DRIVERS, TEAMS, driverPhoto, teamById, teamLogo } from '../data/grid'
import type { HorsPage } from './HorsCourse'
import { Num } from '../components/Num'

interface Props {
  userEmail: string
  onOpenSeason: (page: HorsPage) => void
  onOpenLive: () => void
  onOpenReminders: () => void
}

const Arrow = ({ className = 'size-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)

function useTick(ms: number) {
  const [n, setN] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setN(Date.now()), ms); return () => clearInterval(id) }, [ms])
  return n
}

/** Prochaine session (ou session en cours) d'après le calendrier Jolpica. */
function useSessions() {
  const [list, setList] = useState<Session[] | null>(null)
  useEffect(() => { getCalendar().then((c) => setList(allSessions(c))).catch(() => setList([])) }, [])
  return list
}

const card = 'rounded-[1.75rem] border border-[#232425] bg-[#0c0d0e]'

/**
 * Accueil de l'app, structure Novex : l'essentiel en haut (prochaine session + compte à rebours, état du direct,
 * ton pilote et ton écurie), puis trois grandes entrées. Les outils secondaires sont à un geste, pas tous affichés.
 */
export default function AppHome({ userEmail, onOpenSeason, onOpenLive, onOpenReminders }: Props) {
  const now = useTick(1000)
  const sessions = useSessions()
  const champ = useChampionship()
  const live = useMemo(() => sessions?.find((s) => s.start.getTime() - 5 * 60_000 <= now && now < s.start.getTime() + s.minutes * 60_000) ?? null, [sessions, now])
  const next = useMemo(() => sessions?.find((s) => s.start.getTime() > now) ?? null, [sessions, now])
  const weekend = useMemo(() => (next && sessions ? sessions.filter((s) => s.round === next.round) : []), [sessions, next])

  // favoris enregistrés pendant l'accueil « Saison »
  const favIds: string[] = useMemo(() => { try { return JSON.parse(localStorage.getItem(`f1-fav-drivers-${userEmail}`) ?? '[]') } catch { return [] } }, [userEmail])
  const team = teamById(localStorage.getItem(`f1-fav-team-${userEmail}`))
  const drv = DRIVERS.find((d) => d.id === favIds[0])
  const drvTeam = drv ? TEAMS.find((t) => t.id === drv.teamId) : undefined
  const standing = drv ? champ.data?.drivers.find((x: { Driver: { code?: string } }) => x.Driver.code === drv.code) : undefined
  const teamStanding = team ? champ.data?.constructors.find((x: { Constructor: { constructorId: string } }) => x.Constructor.constructorId === team.ref) : undefined

  const cd = next ? countdown(next.start.getTime() - now) : null
  const local = userEmail.split('@')[0].split(/[._-]/)[0] ?? ''
  const first = local.charAt(0).toUpperCase() + local.slice(1)

  return (
    <div className="min-h-dvh text-white">

      <main className="app-wrap pb-28 pt-10 sm:pt-16">
        <h1 className="app-in max-w-[40rem] text-[2.25rem] font-[560] leading-[1.06] tracking-[-0.035em] sm:text-[3rem]">
          {live ? 'C’est en direct.' : `Salut ${first}.`}
        </h1>

        {/* ── l'essentiel ─────────────────────────────────────────── */}
        <section className="app-in app-in-2 mt-12 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] sm:mt-16" aria-label="L'essentiel">
          <div className={`${card} flex flex-col p-7 sm:p-9`} data-home="next">
            <div className="flex flex-wrap items-center gap-3">
              {live ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#08090a]"><span className="size-1.5 animate-pulse rounded-full bg-[#08090a]" />En direct</span>
              ) : (
                <span className="rounded-full border border-[#2b2c2d] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#939494]">Prochaine session</span>
              )}
              {(live ?? next) && <span className="text-[13px] text-[#636464]">Manche {(live ?? next)!.round}</span>}
            </div>
            {sessions === null ? (
              <div className="mt-8 h-24 animate-pulse rounded-2xl bg-white/[0.03]" />
            ) : live ? (
              <>
                <p className="mt-7 text-[1.75rem] font-medium leading-tight tracking-[-0.03em] sm:text-[2.25rem]">{live.label}</p>
                <p className="mt-2 text-[15px] text-[#939494]">{live.gp} · {live.circuit}</p>
                <button onClick={onOpenLive} className="mt-9 inline-flex min-h-12 items-center gap-2 self-start rounded-full bg-white px-6 text-[15px] font-semibold text-[#08090a] hover:bg-[#e6e6e6]">Ouvrir le direct <Arrow /></button>
              </>
            ) : next && cd ? (
              <>
                <p className="mt-7 text-[1.75rem] font-medium leading-tight tracking-[-0.03em] sm:text-[2.25rem]">{next.label}</p>
                <p className="mt-2 text-[15px] text-[#939494]">{next.gp} · <span className="first-letter:uppercase">{formatWhen(next.start)}</span></p>
                <div className="mt-9 grid max-w-md grid-cols-4 gap-2" role="timer" aria-label="Compte à rebours">
                  {([['jours', cd.d], ['h', cd.h], ['min', cd.m], ['s', cd.s]] as const).map(([u, v]) => (
                    <div key={u} className="rounded-2xl border border-[#1d1e1f] bg-[#08090a] py-4 text-center">
                      <p className="text-[2rem] font-medium leading-none tabular-nums tracking-[-0.04em] sm:text-[2.5rem]"><span key={v} className="tick-in">{String(v).padStart(2, '0')}</span></p>
                      <p className="mt-2 text-[11px] text-[#636464]">{u}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-2">
                  <button onClick={onOpenReminders} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#08090a] hover:bg-[#e6e6e6]">Me prévenir</button>
                  <button onClick={() => onOpenSeason('calendar')} className="inline-flex min-h-11 items-center rounded-full border border-[#2b2c2d] px-5 text-[14px] font-medium text-[#d6d7d7] hover:bg-[#161718]">Tout le calendrier</button>
                </div>
                {weekend.length > 1 && (
                  <details className="group mt-8 border-t border-[#1d1e1f] pt-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-[14px] text-[#c4c5c5] [&::-webkit-details-marker]:hidden">
                      Programme du week-end
                      <span className="text-[#636464] transition group-open:rotate-45" aria-hidden>+</span>
                    </summary>
                    <ul className="mt-3 divide-y divide-[#1d1e1f]">
                      {weekend.map((s) => (
                        <li key={s.id} className={`flex items-center justify-between py-2.5 text-[14px] ${s.id === next.id ? 'text-white' : 'text-[#939494]'}`}>
                          <span>{s.label}</span><span className="tabular-nums first-letter:uppercase">{formatWhen(s.start)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            ) : (
              <p className="mt-7 text-[1.75rem] font-medium tracking-[-0.03em]">Saison terminée</p>
            )}
          </div>

          <div className="grid gap-4">
            <button onClick={() => onOpenSeason(drv ? 'favorites' : 'onboarding')} className={`${card} group flex items-center gap-5 p-6 text-left transition hover:border-[#3a3b3c]`} data-home="driver">
              {drv ? (
                <>
                  <img src={driverPhoto(drvTeam?.slug ?? 'fallback', drv.f1, 240)} alt="" className="size-20 shrink-0 rounded-full border border-white/10 bg-[#17181a] object-cover object-top" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] text-[#636464]">Ton pilote</span>
                    <span className="mt-1 block truncate text-[19px] font-medium tracking-[-0.02em]">{drv.givenName} {drv.familyName}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-[13px] text-[#939494]"><span className="size-1.5 rounded-full" style={{ backgroundColor: drvTeam?.color }} />{drvTeam?.name}</span>
                  </span>
                  {standing && <span className="text-right"><span className="block text-[1.75rem] font-medium leading-none tabular-nums tracking-[-0.03em]">P{standing.position}</span><span className="mt-1 block text-[12px] tabular-nums text-[#636464]"><Num value={standing.points} /> pts</span></span>}
                </>
              ) : (
                <span className="flex-1"><span className="block text-[12px] text-[#636464]">Ton pilote</span><span className="mt-1 block text-[17px] font-medium">Choisis tes favoris</span></span>
              )}
            </button>
            <button onClick={() => onOpenSeason(team ? 'favorites' : 'onboarding')} className={`${card} group flex items-center gap-5 p-6 text-left transition hover:border-[#3a3b3c]`} data-home="team">
              {team ? (
                <>
                  <span className="grid size-20 shrink-0 place-items-center rounded-full border border-white/10 bg-[#141516]"><img src={teamLogo(team)} alt="" className="size-11 object-contain" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] text-[#636464]">Ton écurie</span>
                    <span className="mt-1 block truncate text-[19px] font-medium tracking-[-0.02em]">{team.name}</span>
                  </span>
                  {teamStanding && <span className="text-right"><span className="block text-[1.75rem] font-medium leading-none tabular-nums tracking-[-0.03em]">P{teamStanding.position}</span><span className="mt-1 block text-[12px] tabular-nums text-[#636464]"><Num value={teamStanding.points} /> pts</span></span>}
                </>
              ) : (
                <span className="flex-1"><span className="block text-[12px] text-[#636464]">Ton écurie</span><span className="mt-1 block text-[17px] font-medium">Choisis ton écurie</span></span>
              )}
            </button>
            {champ.data?.driverTitle && (
              <button onClick={() => onOpenSeason('standings')} className={`${card} flex items-center justify-between gap-4 px-6 py-5 text-left transition hover:border-[#3a3b3c]`}>
                <span className="min-w-0">
                  <span className="block text-[12px] text-[#636464]">{champ.data.driverTitle.decided ? `Champion du monde ${champ.data.season}` : 'En tête du championnat'}</span>
                  <span className="mt-1 block truncate text-[15px] font-medium">{champ.data.driverTitle.leaderName}</span>
                </span>
                <Arrow className="size-4 shrink-0 text-[#636464]" />
              </button>
            )}
          </div>
        </section>

        {/* ── les trois espaces ─────────────────────────────────────── */}
        <section className="mt-24 sm:mt-32" aria-labelledby="explorer">
          <h2 id="explorer" className="text-[1.75rem] font-medium tracking-[-0.035em] sm:text-[2.25rem]">Explorer</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Entry
              title="Live" tag={live ? 'En direct' : 'Rejeux'} onOpen={onOpenLive}
              icon={<path d="M3 12h4l3-8 4 16 3-8h4" />}
              tools={[['Classement en direct', onOpenLive], ['Suivre une voiture', onOpenLive], ['Vue pilote', onOpenLive]]}
            />
            <Entry
              title="Saison" onOpen={() => onOpenSeason('standings')}
              icon={<path d="M6 20V10M12 20V4M18 20v-7" />}
              tools={[['Classements', () => onOpenSeason('standings')], ['Calendrier', () => onOpenSeason('calendar')], ['Statistiques', () => onOpenSeason('stats')], ['Duel', () => onOpenSeason('stats-duel')], ['Positions', () => onOpenSeason('stats-positions')]]}
            />
            <Entry
              title="Rappels" onOpen={onOpenReminders}
              icon={<path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" />}
              tools={[['Email avant les sessions', onOpenReminders], ['Calendrier sur ton iPad', onOpenReminders]]}
            />
          </div>
        </section>

        <footer className="mt-24 flex flex-wrap items-center justify-between gap-3 border-t border-[#1d1e1f] pt-6 text-[12px] text-[#636464]">
          <p>App non officielle, non affiliée à Formula 1, FOM ou la FIA.</p>
          <a href="#/mentions" className="transition-colors hover:text-white">Mentions légales &amp; confidentialité</a>
        </footer>
      </main>
    </div>
  )
}

function Entry({ title, tag, icon, tools, onOpen }: { title: string; tag?: string; icon: ReactNode; tools: [string, () => void][]; onOpen: () => void }) {
  return (
    <div className={`${card} group flex flex-col p-7`}>
      <button onClick={onOpen} className="flex items-start justify-between text-left" aria-label={`Ouvrir ${title}`}>
        <span>
          <span className="grid size-11 place-items-center rounded-full border border-[#2b2c2d] text-[#c4c5c5]">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{icon}</svg>
          </span>
          <span className="mt-8 flex items-center gap-3 text-[1.5rem] font-medium tracking-[-0.03em]">{title}{tag && <span className="rounded-full border border-[#2b2c2d] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#939494]">{tag}</span>}</span>
        </span>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#08090a] transition group-hover:translate-x-0.5"><Arrow /></span>
      </button>
      <ul className="mt-8 border-t border-[#1d1e1f]">
        {tools.map(([label, go]) => (
          <li key={label}>
            <button onClick={go} className="flex min-h-12 w-full items-center justify-between border-b border-[#1d1e1f] text-left text-[14px] text-[#939494] hover:text-white">
              {label}<span aria-hidden className="text-[#3d3e3f]">›</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
