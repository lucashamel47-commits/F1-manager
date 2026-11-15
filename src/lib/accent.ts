/** Accents réels de l'app (bouton principal, interrupteurs). Pas de rouge. */
export const ACCENTS = [
  { id: 'neutre', label: 'Neutre', swatch: '#ffffff' },
  { id: 'bleu', label: 'Bleu', swatch: '#2563EB' },
  { id: 'violet', label: 'Violet', swatch: '#8B5CF6' },
  { id: 'ambre', label: 'Ambre', swatch: '#F59E0B' },
] as const

export type AccentId = (typeof ACCENTS)[number]['id']

const KEY = 'f1-accent'

export const isAccentId = (v: string | null | undefined): v is AccentId =>
  Boolean(v && ACCENTS.some((a) => a.id === v))

export const readAccent = (): AccentId => {
  try {
    const v = localStorage.getItem(KEY)
    return isAccentId(v) ? v : 'neutre'
  } catch { return 'neutre' }
}

export const applyAccent = (id: AccentId) => {
  document.documentElement.dataset.accent = id
  try { localStorage.setItem(KEY, id) } catch { /* ignore */ }
}

/** À appeler au démarrage, avant le premier rendu, pour éviter un flash. */
export const initAccent = () => {
  try { applyAccent(readAccent()) } catch { /* ignore */ }
}
