/** Sections des réglages (#/parametres/…). */
export type SettingsSection = 'compte' | 'securite' | 'apparence' | 'rappels' | 'contact'

export const SETTINGS_SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: 'compte', label: 'Compte' },
  { id: 'securite', label: 'Sécurité' },
  { id: 'apparence', label: 'Apparence' },
  { id: 'rappels', label: 'Rappels' },
  { id: 'contact', label: 'Contact' },
]

export const goSettings = (section?: SettingsSection) => {
  window.location.hash = section ? `#/parametres/${section}` : '#/parametres'
}

export const readSettingsSection = (): SettingsSection => {
  const id = window.location.hash.match(/^#\/parametres(?:\/([\w-]+))?$/)?.[1]
  return SETTINGS_SECTIONS.some((s) => s.id === id) ? (id as SettingsSection) : 'compte'
}

export const isSettingsIndex = (): boolean => window.location.hash === '#/parametres' || window.location.hash === '#/parametres/'
