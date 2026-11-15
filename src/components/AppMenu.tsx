import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LogoFull, LogoGlyph } from './Logo'
import SupportIcon from './SupportIcon'
import { openSupport } from '../lib/support'
import { goSettings, readSettingsSection, SETTINGS_SECTIONS, type SettingsSection } from '../lib/settings'

/**
 * Barre latérale de l'app connectée, calquée sur celle de Novex :
 * - fixe à gauche sur iPad / ordinateur (240 px), repliable en rail d'icônes ;
 * - sur téléphone, barre d'onglets en bas + feuille « Plus ».
 * Le profil ouvre un menu (Réglages, Se déconnecter). En mode réglages, la barre elle-même
 * affiche les sections (Compte, Sécurité, Apparence, Rappels, Contact) et « Retour à l'application ».
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
  sliders: 'M10 5H3M21 5h-5M16 12h5M3 12h5M8 19H3M21 19h-5',
  compte: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  securite: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  apparence: 'M12 22a10 10 0 1 1 0-20c5.5 0 10 4.5 10 10a4 4 0 0 1-4 4h-1.5a1.5 1.5 0 0 0-1.1 2.5c.2.3.3.7.3 1.1 0 1.2-.9 2.4-2.1 2.4z|M7.2 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z|M10.5 7.8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z|M15.5 7.8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z|M17.8 11.2a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  contact: 'M21 15a4 4 0 0 1-4 4H8l-5 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z',
  back: 'M19 12H5M12 19l-7-7 7-7',
  chevDown: 'm6 9 6 6 6-6',
  chevUp: 'm6 15 6-6 6 6',
}
const SETTING_ICON: Record<SettingsSection, string> = {
  compte: P.compte,
  securite: P.securite,
  apparence: P.apparence,
  rappels: P.reminders,
  contact: P.contact,
}

const Icon = ({ d, className = 'size-4' }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d.split('|').map((p, i) => <path key={i} d={p} />)}</svg>
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
  name?: string
  settingsOpen?: boolean
  onNavigate: (k: MenuKey) => void
  onOpenSettings: () => void
  onCloseSettings: () => void
  onLogout: () => void
  children: ReactNode
}

export default function AppMenu({ active, email, name, settingsOpen, onNavigate, onOpenSettings, onCloseSettings, onLogout, children }: Props) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('f1-sidebar-collapsed') === '1')
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>(() => readJSON('f1-sidebar-groups', {}))
  const [sheetOpen, setSheetOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(readSettingsSection)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { localStorage.setItem('f1-sidebar-collapsed', collapsed ? '1' : '0') }, [collapsed])
  useEffect(() => { localStorage.setItem('f1-sidebar-groups', JSON.stringify(closedGroups)) }, [closedGroups])
  useEffect(() => {
    if (!sheetOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheetOpen])
  useEffect(() => {
    const onHash = () => setSettingsSection(readSettingsSection())
    window.addEventListener('hashchange', onHash)
    onHash()
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    const onPtr = (e: PointerEvent) => {
      const el = e.target as Element | null
      if (el?.closest?.('[data-profile-menu], [data-profile]')) return
      setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPtr)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onPtr) }
  }, [menuOpen])
  useEffect(() => { if (settingsOpen) setMenuOpen(false) }, [settingsOpen])

  const go = (k: MenuKey) => { setSheetOpen(false); setMenuOpen(false); onNavigate(k) }
  const openSettings = () => { setSheetOpen(false); setMenuOpen(false); onOpenSettings() }
  const label = name || email
  const initial = label.charAt(0) || '?'

  const supportBtn = (compact: boolean) => compact ? (
    <button onClick={openSupport} aria-label="Écrire au support" title="Écrire au support" data-support className="mb-1 grid size-10 place-items-center rounded-[10px] text-[#c4c5c5] hover:bg-white/[0.06] hover:text-white"><SupportIcon /></button>
  ) : (
    <button onClick={openSupport} data-support className="btn-primary mb-3 flex h-9 w-full items-center justify-center gap-2 rounded-full text-[13.5px] font-medium tracking-[-0.01em]">
      <SupportIcon />Écrire au support
    </button>
  )

  const profileMenu = (wide: boolean) => menuOpen && (
    <div
      role="menu"
      data-profile-menu
      className={`absolute z-[70] overflow-hidden rounded-2xl border border-[#2b2c2d] bg-[#151515] py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] ${wide ? 'bottom-[calc(100%+0.5rem)] left-0 right-0' : 'bottom-[calc(100%+0.5rem)] left-2 w-56'}`}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#2b2c2d] bg-[#17181a] text-[13px] font-medium uppercase text-[#f7f8f8]" aria-hidden>{initial}</span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium text-[#f7f8f8]">{label}</span>
          <span className="block truncate text-[12px] text-[#7d7e7e] underline decoration-[#3d3e3f] underline-offset-2">{email}</span>
        </span>
      </div>
      <div className="mx-0 my-1 border-t border-[#2b2c2d]" />
      <button type="button" role="menuitem" onClick={openSettings} className="flex h-10 w-full items-center gap-2.5 px-3 text-left text-[14px] font-medium text-[#f7f8f8] hover:bg-white/[0.05]">
        <SlidersIcon /> Réglages
      </button>
      <div className="mx-0 my-1 border-t border-[#2b2c2d]" />
      <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onLogout() }} className="flex h-10 w-full items-center gap-2.5 px-3 text-left text-[14px] font-medium text-[#c4c5c5] hover:bg-white/[0.05] hover:text-white">
        <Icon d={P.logout} /> Se déconnecter
      </button>
    </div>
  )

  const profileTrigger = (opts: { collapsed?: boolean; inSheet?: boolean }) => {
    const r = opts.collapsed
    return (
      <div ref={opts.inSheet ? undefined : menuRef} className="relative">
        {!opts.inSheet && profileMenu(!r)}
        <button
          type="button"
          data-profile
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu du compte"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className={`flex w-full items-center gap-2.5 text-left transition hover:bg-white/[0.04] ${r ? 'size-10 justify-center rounded-[10px]' : opts.inSheet ? 'min-h-[3.25rem] rounded-2xl px-3 py-2' : 'rounded-[10px] px-1.5 py-1.5'}`}
        >
          <span className={`grid shrink-0 place-items-center rounded-full border border-[#2b2c2d] bg-[#17181a] font-medium uppercase text-[#d6d7d7] ${r ? 'size-8 text-[12px]' : 'size-8 text-[12px]'}`} aria-hidden>{initial}</span>
          {!r && (
            <>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#f7f8f8]">{label}</span>
              <Icon d={menuOpen ? P.chevUp : P.chevDown} className="size-3.5 text-[#7b7c7c]" />
            </>
          )}
        </button>
        {opts.inSheet && profileMenu(true)}
      </div>
    )
  }

  const appPanel = () => {
    const r = collapsed
    return (
      <div className={`flex h-full flex-col ${r ? 'items-center px-2' : 'px-2.5'}`}>
        <div className={`flex h-14 shrink-0 items-center ${r ? 'flex-col justify-center' : 'justify-between pl-2'}`}>
          {r ? (
            <button onClick={() => setCollapsed(false)} aria-label="Déplier le menu" title="Déplier le menu" className="grid size-10 place-items-center rounded-lg text-[#f7f8f8] hover:bg-white/[0.06]">
              <LogoGlyph className="h-[17px] w-auto" />
            </button>
          ) : (
            <>
              <button onClick={() => go('home')} aria-label="F1 Manager, accueil" className="flex min-h-10 items-center"><LogoFull /></button>
              <button onClick={() => setCollapsed(true)} aria-label="Replier le menu" title="Replier le menu" className="grid size-9 place-items-center rounded-lg text-[#7b7c7c] hover:bg-white/[0.06] hover:text-white">
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
                {!shut && g.items.map(([k, itemLabel]) => {
                  const on = !settingsOpen && active === k
                  return (
                    <button
                      key={k}
                      onClick={() => go(k)}
                      aria-current={on ? 'page' : undefined}
                      aria-label={r ? itemLabel : undefined}
                      title={r ? itemLabel : undefined}
                      data-side={k}
                      className={`flex items-center rounded-[10px] transition ${r ? 'size-10 justify-center' : 'h-9 w-full gap-2.5 px-2.5 text-left text-[14.5px] font-medium tracking-[-0.01em]'} ${on ? 'bg-[#f7f8f8]/[0.09] text-[#f7f8f8]' : 'text-[#c4c5c5] hover:bg-white/[0.04] hover:text-white'}`}
                    >
                      <Icon d={P[k]} className={on ? 'size-4 text-[#f7f8f8]' : 'size-4 text-[#939494]'} />
                      {!r && <span className="truncate">{itemLabel}</span>}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        <div className={`relative mt-3 w-full shrink-0 border-t border-[#2b2c2d] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 ${r ? 'flex flex-col items-center gap-1' : ''}`}>
          {supportBtn(!!r)}
          {profileTrigger({ collapsed: r })}
        </div>
      </div>
    )
  }

  const settingsPanel = () => {
    const r = collapsed
    return (
      <div className={`flex h-full flex-col ${r ? 'items-center px-2' : 'px-2.5'}`}>
        <div className={`flex h-14 shrink-0 items-center ${r ? 'justify-center' : 'justify-between gap-1 pl-1'}`}>
          {r ? (
            <button onClick={onCloseSettings} aria-label="Retour à l'application" title="Retour à l'application" className="grid size-10 place-items-center rounded-lg text-[#c4c5c5] hover:bg-white/[0.06] hover:text-white">
              <Icon d={P.back} />
            </button>
          ) : (
            <button type="button" onClick={onCloseSettings} className="flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-[13.5px] text-[#939494] transition hover:bg-white/[0.04] hover:text-white">
              <Icon d={P.back} className="size-3.5" /> Retour à l'application
            </button>
          )}
          <button onClick={() => setCollapsed((c) => !c)} aria-label={r ? 'Déplier le menu' : 'Replier le menu'} title={r ? 'Déplier le menu' : 'Replier le menu'} className="grid size-9 place-items-center rounded-lg text-[#7b7c7c] hover:bg-white/[0.06] hover:text-white">
            <Icon d={P.panel} />
          </button>
        </div>

        <nav className={`mt-1 flex w-full flex-1 flex-col overflow-y-auto ${r ? 'items-center gap-1' : 'gap-px'}`} aria-label="Réglages">
          {SETTINGS_SECTIONS.map((s) => {
            const on = settingsSection === s.id
            return (
              <button
                key={s.id}
                type="button"
                data-settings-nav={s.id}
                onClick={() => goSettings(s.id)}
                aria-current={on ? 'page' : undefined}
                aria-label={r ? s.label : undefined}
                title={r ? s.label : undefined}
                className={`flex items-center rounded-[10px] transition ${r ? 'size-10 justify-center' : 'h-9 w-full gap-2.5 px-2.5 text-left text-[14.5px] font-medium tracking-[-0.01em]'} ${on ? 'bg-[#f7f8f8]/[0.09] text-[#f7f8f8]' : 'text-[#c4c5c5] hover:bg-white/[0.04] hover:text-white'}`}
              >
                <Icon d={SETTING_ICON[s.id]} className={on ? 'size-4 text-[#f7f8f8]' : 'size-4 text-[#939494]'} />
                {!r && <span className="truncate">{s.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className={`relative mt-3 w-full shrink-0 border-t border-[#2b2c2d] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 ${r ? 'flex flex-col items-center gap-1' : ''}`}>
          {supportBtn(!!r)}
          {profileTrigger({ collapsed: r })}
        </div>
      </div>
    )
  }

  const shell = 'fixed inset-y-0 left-0 z-[60] border-r border-[#2b2c2d] bg-[#121314] pt-[env(safe-area-inset-top)] text-white'
  const TABS: [MenuKey | 'more', string, string][] = [['home', 'Accueil', P.home], ['live', 'Live', P.live], ['standings', 'Classements', P.standings], ['stats', 'Stats', P.stats], ['more', 'Plus', P.more]]
  const MORE: [MenuKey, string][] = [['calendar', 'Calendrier'], ['duel', 'Duel'], ['positions', 'Positions'], ['favorites', 'Favoris'], ['reminders', 'Rappels']]
  const moreActive = MORE.some(([k]) => k === active)

  return (
    <>
      <aside className={`app-side ${shell} hidden md:block ${collapsed ? 'w-16' : 'w-60'}`} aria-label={settingsOpen ? 'Réglages' : 'Menu'}>
        {settingsOpen ? settingsPanel() : appPanel()}
      </aside>

      {!settingsOpen && (
        <nav aria-label="Navigation" className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#2b2c2d] bg-[#08090a] pb-[env(safe-area-inset-bottom)] md:hidden">
          <div className="mx-auto grid h-[3.75rem] max-w-lg grid-cols-5">
            {TABS.map(([k, tabLabel, icon]) => {
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
                  <span className="text-[10.5px] font-medium tracking-[-0.01em]">{tabLabel}</span>
                </button>
              )
            })}
          </div>
        </nav>
      )}

      {!settingsOpen && (
        <>
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
              {MORE.map(([k, itemLabel]) => (
                <button key={k} data-more={k} onClick={() => go(k)} aria-current={active === k ? 'page' : undefined} className={`flex min-h-[3.25rem] items-center gap-3 bg-[#141516] px-4 text-left text-[15px] font-medium ${active === k ? 'text-white' : 'text-[#c4c5c5]'}`}>
                  <Icon d={P[k]} className={`size-[18px] ${active === k ? 'text-white' : 'text-[#7b7c7c]'}`} />
                  <span className="flex-1">{itemLabel}</span>
                  <span className="text-[#4a4b4c]" aria-hidden>›</span>
                </button>
              ))}
            </div>
            <button onClick={() => { setSheetOpen(false); openSupport() }} data-support className="btn-primary mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium">
              <SupportIcon className="size-[18px]" />Écrire au support
            </button>
            <div className="relative mt-3 rounded-2xl border border-[#1d1e1f] bg-[#141516]" ref={menuRef}>
              {sheetOpen && menuOpen && (
                <div role="menu" data-profile-menu className="overflow-hidden rounded-t-2xl border-b border-[#2b2c2d] bg-[#151515] py-1">
                  <button type="button" role="menuitem" onClick={openSettings} className="flex min-h-11 w-full items-center gap-2.5 px-4 text-left text-[15px] font-medium text-[#f7f8f8]">
                    <SlidersIcon /> Réglages
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setSheetOpen(false); onLogout() }} className="flex min-h-11 w-full items-center gap-2.5 px-4 text-left text-[15px] font-medium text-[#c4c5c5]">
                    <Icon d={P.logout} /> Se déconnecter
                  </button>
                </div>
              )}
              <button
                type="button"
                data-profile
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Menu du compte"
                aria-expanded={menuOpen}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#2b2c2d] bg-[#1b1c1d] text-[13px] font-medium uppercase text-[#d6d7d7]" aria-hidden>{initial}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-[#f7f8f8]">{label}</span>
                  <span className="block truncate text-[12px] text-[#7b7c7c]">{email}</span>
                </span>
                <Icon d={menuOpen ? P.chevUp : P.chevDown} className="size-3.5 text-[#7b7c7c]" />
              </button>
            </div>
            <a href="#/mentions" onClick={() => setSheetOpen(false)} className="mt-3 block text-center text-[12px] text-[#6e6f70]">Mentions légales &amp; confidentialité</a>
          </div>
        </>
      )}

      <div className={`app-side-content ${settingsOpen ? 'pb-0' : 'pb-[calc(3.75rem+env(safe-area-inset-bottom))]'} md:pb-0 ${collapsed ? 'md:pl-16' : 'md:pl-60'}`}>{children}</div>
    </>
  )
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 5H3M21 5h-5M16 12h5M3 12h5M8 19H3M21 19h-5" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  )
}
