/* Traductions françaises des textes venant des API (Jolpica, OpenF1, F1 Live Timing), qui répondent en anglais. */

const GP_FR: Record<string, string> = {
  australian: 'GP d’Australie', chinese: 'GP de Chine', japanese: 'GP du Japon', bahrain: 'GP de Bahreïn', 'saudi arabian': 'GP d’Arabie saoudite',
  miami: 'GP de Miami', canadian: 'GP du Canada', monaco: 'GP de Monaco', barcelona: 'GP de Barcelone', spanish: 'GP d’Espagne', austrian: 'GP d’Autriche',
  british: 'GP de Grande-Bretagne', belgian: 'GP de Belgique', hungarian: 'GP de Hongrie', dutch: 'GP des Pays-Bas', italian: 'GP d’Italie',
  'emilia romagna': 'GP d’Émilie-Romagne', azerbaijan: 'GP d’Azerbaïdjan', singapore: 'GP de Singapour', 'united states': 'GP des États-Unis',
  'mexico city': 'GP de Mexico', mexican: 'GP du Mexique', brazilian: 'GP du Brésil', 'são paulo': 'GP de São Paulo', 'sao paulo': 'GP de São Paulo',
  'las vegas': 'GP de Las Vegas', qatar: 'GP du Qatar', 'abu dhabi': 'GP d’Abou Dhabi', 'bahrain grand prix in malaysia': 'GP de Malaisie',
  malaysian: 'GP de Malaisie', portuguese: 'GP du Portugal', french: 'GP de France', german: 'GP d’Allemagne', turkish: 'GP de Turquie',
  russian: 'GP de Russie', 'styrian': 'GP de Styrie', 'tuscan': 'GP de Toscane', 'eifel': 'GP de l’Eifel', '70th anniversary': 'GP du 70e anniversaire',
  'sakhir': 'GP de Sakhir', vietnamese: 'GP du Vietnam', argentine: 'GP d’Argentine', madrid: 'GP de Madrid',
}

/** « Brazilian Grand Prix » → « GP du Brésil ». Inconnu : « XXX Grand Prix » → « GP XXX ». */
export function gpFr(raceName: string | null | undefined): string {
  if (!raceName) return ''
  const raw = raceName.trim()
  const low = raw.toLowerCase()
  if (GP_FR[low]) return GP_FR[low]
  const key = low.replace(/\s*grand prix.*$/i, '').trim()
  return GP_FR[key] ?? (key ? `GP ${raw.replace(/\s*grand prix.*$/i, '').trim()}` : raw)
}

const COUNTRY_FR: Record<string, string> = {
  australia: 'Australie', china: 'Chine', japan: 'Japon', bahrain: 'Bahreïn', 'saudi arabia': 'Arabie saoudite', usa: 'États-Unis', 'united states': 'États-Unis',
  canada: 'Canada', monaco: 'Monaco', spain: 'Espagne', austria: 'Autriche', uk: 'Grande-Bretagne', 'united kingdom': 'Grande-Bretagne', 'great britain': 'Grande-Bretagne',
  belgium: 'Belgique', hungary: 'Hongrie', netherlands: 'Pays-Bas', italy: 'Italie', azerbaijan: 'Azerbaïdjan', singapore: 'Singapour', mexico: 'Mexique',
  brazil: 'Brésil', qatar: 'Qatar', uae: 'Émirats arabes unis', 'united arab emirates': 'Émirats arabes unis', 'abu dhabi': 'Abou Dhabi', malaysia: 'Malaisie',
  portugal: 'Portugal', france: 'France', germany: 'Allemagne', turkey: 'Turquie', russia: 'Russie', vietnam: 'Vietnam', argentina: 'Argentine',
}
export const countryFr = (c: string | null | undefined) => (c ? COUNTRY_FR[c.trim().toLowerCase()] ?? c : '')

/** Statut d'arrivée Jolpica (« Finished », « +1 Lap », « Retired »…) en français. */
export function statusFr(s: string | null | undefined): string {
  if (!s) return ''
  const m = s.match(/^\+(\d+) Laps?$/i)
  if (m) return `+${m[1]} tour${Number(m[1]) > 1 ? 's' : ''}`
  const map: Record<string, string> = {
    finished: 'Arrivé', lapped: 'Pris un tour', retired: 'Abandon', accident: 'Accident', collision: 'Accrochage', 'collision damage': 'Dégâts après accrochage',
    disqualified: 'Disqualifié', 'did not start': 'Non partant', 'did not qualify': 'Non qualifié', withdrew: 'Forfait', engine: 'Moteur', 'power unit': 'Groupe propulseur',
    gearbox: 'Boîte de vitesses', transmission: 'Transmission', hydraulics: 'Hydraulique', brakes: 'Freins', suspension: 'Suspension', electrical: 'Électrique',
    electronics: 'Électronique', 'power loss': 'Perte de puissance', overheating: 'Surchauffe', 'fuel pressure': 'Pression d’essence', 'water pressure': 'Pression d’eau',
    'oil leak': 'Fuite d’huile', 'water leak': 'Fuite d’eau', puncture: 'Crevaison', wheel: 'Roue', 'spun off': 'Tête-à-queue', damage: 'Dégâts', 'mechanical': 'Problème mécanique',
    'not classified': 'Non classé', illness: 'Malade', 'driver unwell': 'Pilote malade', vibrations: 'Vibrations', debris: 'Débris', cooling: 'Refroidissement', battery: 'Batterie',
  }
  return map[s.trim().toLowerCase()] ?? s
}
