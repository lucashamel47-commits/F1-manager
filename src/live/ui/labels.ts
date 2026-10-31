import type { OFSession } from '../openf1'

const SESSION_FR: Record<string, string> = {
  'Practice 1': 'Essais libres 1', 'Practice 2': 'Essais libres 2', 'Practice 3': 'Essais libres 3',
  Qualifying: 'Qualifications', Sprint: 'Sprint', 'Sprint Qualifying': 'Qualifs Sprint', 'Sprint Shootout': 'Shootout Sprint', Race: 'Course',
}
export const SESSION_SHORT: Record<string, string> = {
  'Practice 1': 'EL1', 'Practice 2': 'EL2', 'Practice 3': 'EL3', Qualifying: 'Qualifs', Sprint: 'Sprint', 'Sprint Qualifying': 'Q. Sprint', 'Sprint Shootout': 'Q. Sprint', Race: 'Course',
}
const COUNTRY_FR: Record<string, string> = {
  Australia: 'Australie', China: 'Chine', Japan: 'Japon', Bahrain: 'Bahreïn', 'Saudi Arabia': 'Arabie saoudite', 'United States': 'États-Unis',
  Canada: 'Canada', Monaco: 'Monaco', Spain: 'Espagne', Austria: 'Autriche', 'United Kingdom': 'Grande-Bretagne', Belgium: 'Belgique',
  Hungary: 'Hongrie', Netherlands: 'Pays-Bas', Italy: 'Italie', Azerbaijan: 'Azerbaïdjan', Singapore: 'Singapour', Mexico: 'Mexique',
  Brazil: 'Brésil', Qatar: 'Qatar', 'United Arab Emirates': 'Abou Dhabi', Malaysia: 'Malaisie', Portugal: 'Portugal', France: 'France',
  Germany: 'Allemagne', Turkey: 'Turquie', Russia: 'Russie', Vietnam: 'Vietnam', Argentina: 'Argentine',
}
export const sessionFr = (name: string) => SESSION_FR[name] ?? name
export const countryFr = (s: OFSession) => COUNTRY_FR[s.country_name] ?? s.country_name
/** Pour les pays à plusieurs GP la même année (États-Unis, Italie), on précise avec le circuit. */
export const gpLabel = (s: OFSession) => {
  const c = countryFr(s)
  return /États-Unis|Italie/.test(c) ? `${c} · ${s.circuit_short_name}` : c
}
export const fmtDateFr = (iso: string) => new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
