import { useEffect, useState, type ReactNode } from 'react'
import { LogoFull, LogoGlyph } from './Logo'

/**
 * Barre latérale de l'app connectée, calquée sur celle de Novex :
 * - fixe à gauche sur iPad / ordinateur (240 px), repliable en rail d'icônes (bouton « panneau » à droite du logo, mémorisé) ;
 * - sur téléphone, barre d'onglets en bas façon iOS (Accueil, Live, Classements, Stats, Plus) ; « Plus » ouvre une feuille avec le reste.
 * Groupes repliables à titre gris + chevron, lignes icône + libellé, élément actif sur fond blanc à 9 %.
 */
export type MenuKey = 'home' | 'live' | 'standings' | 'calendar' | 'stats' | 'duel' | 'positions' | 'favorites' | 'reminders'

const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  live: 'M2 12h4l3-8 6 16 3-8h4',
  standings: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  stats: 'M3 3v18h18M7 16l4-4 3 3 6-7',
  duel: 'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 17.5 21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4M5 21l-2-2',
  positions: 'M3 7l5 4 4-6 4 8 5-3M3 17h18',
  favorites: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z',
  reminders: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  panel: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 3v18',
  more: 'M3.7 12a1.3 1.3 0 1 0 2.6 0 1.3 1.3 0 1 0-2.6 0M10.7 12a1.3 1.3 0 1 0 2.6 0 1.3 1.3 0 1 0-2.6 0M17.7 12a1.3 1.3 0 1 0 2.6 0 1.3 1.3 0 1 0-2.6 0',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
}
const Icon = ({ d, className = 'size-4' }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
)

type Group = { id: string; title: string; items: [MenuKey, string][] }
const GROUPS: Group[] = [
  { id: 'general', title: 'Général', items: [['home', 'Accueil'], ['live', 'Live']] },
  { id: 'season', title: 'Saison', items: [['standings', 'Classements'], ['calendar', 'Calendrier'], ['stats', 'Statistiques'], ['duel', 'Duel'], ['positions', 'Positions'], ['favorites', 'Favoris']] },
  { id: 'alerts', title: 'Alertes', items: [['reminders', 'Rappels']] },
]

const readJSON = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d } catch { return d } }

interface Props {
  active: MenuKey
  email: string
  onNavigate: (k: MenuKey) => void
  onLogout: () => void
  children: ReactNode
}

export default function AppMenu({ active, email, onNavigate, onLogout, children }: Props) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('f1-sidebar-collapsed') === '1')
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>(() => readJSON('f1-sidebar-groups', {}))
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => { localStorage.setItem('f1-sidebar-collapsed', collapsed ? '1' : '0') }, [collapsed])
  useEffect(() => { localStorage.setItem('f1-sidebar-groups', JSON.stringify(closedGroups)) }, [closedGroups])
  useEffect(() => {
    if (!sheetOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheetOpen])


  const go = (k: MenuKey) => { setSheetOpen(false); onNavigate(k) }

  const panel = () => {
    const r = collapsed
    return (
      <div className={`flex h-full flex-col ${r ? 'items-center px-2' : 'px-2.5'}`}>
        <div className={`flex h-14 shrink-0 items-center ${r ? 'flex-col justify-center' : 'justify-between pl-2'}`}>
          {r ? (
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Déplier le menu"
              title="Déplier le menu"
              className="grid size-10 place-items-center rounded-lg text-[#f7f8f8] hover:bg-white/[0.06]"
            >
              <LogoGlyph className="h-[17px] w-auto" />
            </button>
          ) : (
            <>
              <button onClick={() => go('home')} aria-label="F1 Manager, accueil" className="flex min-h-10 items-center"><LogoFull /></button>
              <button
                onClick={() => setCollapsed(true)}
                aria-label="Replier le menu"
                title="Replier le menu"
                className="grid size-9 place-items-center rounded-lg text-[#7b7c7c] hover:bg-white/[0.06] hover:text-white"
              >
                <Icon d={P.panel} />
              </button>
            </>
          )}
        </div>

        <nav className={`mt-2 flex w-full flex-1 flex-col overflow-y-auto ${r ? 'items-center gap-1' : 'gap-4'}`} aria-label="Navigation">
          {GROUPS.map((g) => {
            const shut = !r && closedGroups[g.id]
            return (
              <div key={g.id} className={`flex w-full flex-col ${r ? 'items-center gap-1' : 'gap-px'}`}>
                {!r && (
                  <button
                    onClick={() => setClosedGroups((c) => ({ ...c, [g.id]: !c[g.id] }))}
                    aria-expanded={!shut}
                    className="flex h-8 items-center gap-1 self-start rounded-md px-2.5 text-[13px] font-medium text-[#7b7c7c] transition hover:text-[#d6d7d7]"
                  >
                    {g.title}
                    <svg viewBox="0 0 24 24" className={`size-3.5 transition-transform ${shut ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                )}
                {!shut && g.items.map(([k, label]) => {
                  const on = active === k
                  return (
                    <button
                      key={k}
                      onClick={() => go(k)}
                      aria-current={on ? 'page' : undefined}
                      aria-label={r ? label : undefined}
                      title={r ? label : undefined}
                      data-side={k}
                      className={`flex items-center rounded-[10px] transition ${r ? 'size-10 justify-center' : 'h-9 w-full gap-2.5 px-2.5 text-left text-[14.5px] font-medium tracking-[-0.01em]'} ${on ? 'bg-[#f7f8f8]/[0.09] text-[#f7f8f8]' : 'text-[#c4c5c5] hover:bg-white/[0.04] hover:text-white'}`}
                    >
                      <Icon d={P[k]} className={on ? 'size-4 text-[#f7f8f8]' : 'size-4 text-[#939494]'} />
                      {!r && <span className="truncate">{label}</span>}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        <div className={`mt-3 w-full shrink-0 border-t border-[#2b2c2d] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 ${r ? 'flex flex-col items-center gap-1' : ''}`}>
          {r ? (
            <>
              <span title={email} className="grid size-8 place-items-center rounded-full border border-[#2b2c2d] bg-[#17181a] text-[12px] font-medium uppercase text-[#d6d7d7]">{email.charAt(0) || '?'}</span>
              <button onClick={() => { setSheetOpen(false); onLogout() }} aria-label="Changer de compte" title="Changer de compte" className="grid size-10 place-items-center rounded-[10px] text-[#939494] hover:bg-white/[0.06] hover:text-white"><Icon d={P.logout} /></button>
            </>
          ) : (
            <div className="flex items-center gap-2.5 px-1.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#2b2c2d] bg-[#17181a] text-[12px] font-medium uppercase text-[#d6d7d7]" aria-hidden>{email.charAt(0) || '?'}</span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#c4c5c5]">{email}</span>
              <button onClick={() => { setSheetOpen(false); onLogout() }} aria-label="Changer de compte" title="Changer de compte" className="grid size-9 shrink-0 place-items-center rounded-lg text-[#7b7c7c] hover:bg-white/[0.06] hover:text-white"><Icon d={P.logout} /></button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const shell = 'fixed inset-y-0 left-0 z-[60] border-r border-[#2b2c2d] bg-[#121314] pt-[env(safe-area-inset-top)] text-white'

  // Téléphone : barre d'onglets en bas (façon iOS) + feuille « Plus » pour le reste.
  const TABS: [MenuKey | 'more', string, string][] = [['home', 'Accueil', P.home], ['live', 'Live', P.live], ['standings', 'Classements', P.standings], ['stats', 'Stats', P.stats], ['more', 'Plus', P.more]]
  const MORE: [MenuKey, string][] = [['calendar', 'Calendrier'], ['duel', 'Duel'], ['positions', 'Positions'], ['favorites', 'Favoris'], ['reminders', 'Rappels']]
  const moreActive = MORE.some(([k]) => k === active)

  return (
    <>
      {/* iPad / ordinateur */}
      <aside className={`app-side ${shell} hidden md:block ${collapsed ? 'w-16' : 'w-60'}`} aria-label="Menu">{panel()}</aside>

      {/* téléphone : barre d'onglets */}
      <nav aria-label="Navigation" className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#2b2c2d] bg-[#08090a] pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="mx-auto grid h-[3.75rem] max-w-lg grid-cols-5">
          {TABS.map(([k, label, icon]) => {
            const on = k === 'more' ? moreActive || sheetOpen : active === k && !sheetOpen
            return (
              <button
                key={k}
                data-tab={k}
                onClick={() => (k === 'more' ? setSheetOpen((o) => !o) : go(k))}
                aria-current={on && k !== 'more' ? 'page' : undefined}
                aria-expanded={k === 'more' ? sheetOpen : undefined}
                className={`flex flex-col items-center justify-center gap-1 transition active:scale-95 ${on ? 'text-[#f7f8f8]' : 'text-[#6e6f70]'}`}
              >
                <Icon d={icon} className="size-[22px]" />
                <span className="text-[10.5px] font-medium tracking-[-0.01em]">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* téléphone : feuille « Plus » */}
      <div aria-hidden onClick={() => setSheetOpen(false)} className={`fixed inset-0 z-[55] bg-black/55 transition-opacity duration-300 md:hidden ${sheetOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Plus"
        inert={!sheetOpen}
        className={`app-sheet fixed inset-x-0 bottom-0 z-[58] rounded-t-[1.5rem] border-t border-[#2b2c2d] bg-[#101112] px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-2.5 text-white md:hidden ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[#3a3b3c]" aria-hidden />
        <div className="grid gap-px overflow-hidden rounded-2xl border border-[#1d1e1f] bg-[#1d1e1f]">
          {MORE.map(([k, label]) => (
            <button key={k} data-more={k} onClick={() => go(k)} aria-current={active === k ? 'page' : undefined} className={`flex min-h-[3.25rem] items-center gap-3 bg-[#141516] px-4 text-left text-[15px] font-medium ${active === k ? 'text-white' : 'text-[#c4c5c5]'}`}>
              <Icon d={P[k]} className={`size-[18px] ${active === k ? 'text-white' : 'text-[#7b7c7c]'}`} />
              <span className="flex-1">{label}</span>
              <span className="text-[#4a4b4c]" aria-hidden>›</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#1d1e1f] bg-[#141516] px-4 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#2b2c2d] bg-[#1b1c1d] text-[13px] font-medium uppercase text-[#d6d7d7]" aria-hidden>{email.charAt(0) || '?'}</span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-[#c4c5c5]">{email}</span>
          <button onClick={() => { setSheetOpen(false); onLogout() }} className="shrink-0 rounded-full border border-[#2b2c2d] px-3.5 py-2 text-[12.5px] font-medium text-[#d6d7d7]">Changer de compte</button>
        </div>
        <a href="#/mentions" onClick={() => setSheetOpen(false)} className="mt-3 block text-center text-[12px] text-[#6e6f70]">Mentions légales &amp; confidentialité</a>
      </div>

      <div className={`app-side-content pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0 ${collapsed ? 'md:pl-16' : 'md:pl-60'}`}>{children}</div>
    </>
  )
}
