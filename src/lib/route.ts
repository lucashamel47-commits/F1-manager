import { useSyncExternalStore } from 'react'

/**
 * Routage minimal par « hash » (compatible GitHub Pages, aucune config serveur) :
 *   #/connexion      → page de connexion
 *   #/inscription    → page d'inscription
 *   #/mentions       → mentions légales & confidentialité (connecté ou non)
 *   #/parametres     → paramètres du compte (connecté ; sections : /profil, /compte, /rappels, /preferences, /support)
 *   autre / vide     → accueil (les ancres #faq, #apercu… restent de simples ancres de la page)
 * Le bouton « Retour » du navigateur fonctionne : chaque lien ajoute une entrée d'historique.
 */
export type Route = 'home' | 'connexion' | 'inscription' | 'mentions' | 'parametres'

const parse = (): Route => {
  const h = window.location.hash
  if (h === '#/connexion') return 'connexion'
  if (h === '#/inscription') return 'inscription'
  if (h === '#/mentions') return 'mentions'
  if (h === '#/parametres' || h.startsWith('#/parametres/')) return 'parametres'
  return 'home'
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export const useRoute = (): Route => useSyncExternalStore(subscribe, parse, () => 'home' as Route)

export const routeHref = (r: Route) => (r === 'home' ? '#/' : `#/${r}`)

/** Remplace l'entrée d'historique courante (sans ajouter de « retour »). */
export const replaceRoute = (r: Route) => window.location.replace(routeHref(r))

/** Retire la route de l'URL (après connexion) sans recharger. */
export const clearRoute = () => {
  if (window.location.hash.startsWith('#/')) history.replaceState(null, '', window.location.pathname + window.location.search)
}
