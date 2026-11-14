// Grille 2026 de référence (11 écuries, 22 pilotes), vérifiée avec Jolpica-F1 et OpenF1 (Grand Prix du Brésil 2026).
// Elle sert de secours si l'API est injoignable ; la grille réellement affichée vient de l'API (voir lib/grid.ts).
const BASE = import.meta.env.BASE_URL
const CDN = 'https://media.formula1.com/image/upload'

export interface GridTeam {
  /** identifiant des favoris (compatible avec les anciens comptes) */
  id: string
  /** constructorId Jolpica */
  ref: string
  name: string
  /** dossier de l'écurie sur le CDN formula1.com */
  slug: string
  color: string
}
export interface GridDriver {
  /** identifiant des favoris = code à 3 lettres en minuscules (ex. « ant ») */
  id: string
  code: string
  number: string
  givenName: string
  familyName: string
  teamId: string
  /** identifiant photo formula1.com (ex. « andant01 ») */
  f1: string
}

export const TEAMS: GridTeam[] = [
  { id: 'mer', ref: 'mercedes', name: 'Mercedes', slug: 'mercedes', color: '#00D7B6' },
  { id: 'rbr', ref: 'red_bull', name: 'Red Bull Racing', slug: 'redbullracing', color: '#4781D7' },
  { id: 'fer', ref: 'ferrari', name: 'Ferrari', slug: 'ferrari', color: '#ED1131' },
  { id: 'mcl', ref: 'mclaren', name: 'McLaren', slug: 'mclaren', color: '#F47600' },
  { id: 'rb', ref: 'rb', name: 'Racing Bulls', slug: 'racingbulls', color: '#6C98FF' },
  { id: 'alp', ref: 'alpine', name: 'Alpine', slug: 'alpine', color: '#00A1E8' },
  { id: 'haas', ref: 'haas', name: 'Haas', slug: 'haasf1team', color: '#9C9FA2' },
  { id: 'aud', ref: 'audi', name: 'Audi', slug: 'audi', color: '#F50537' },
  { id: 'ast', ref: 'aston_martin', name: 'Aston Martin', slug: 'astonmartin', color: '#229971' },
  { id: 'wil', ref: 'williams', name: 'Williams', slug: 'williams', color: '#1868DB' },
  { id: 'cad', ref: 'cadillac', name: 'Cadillac', slug: 'cadillac', color: '#909090' },
]

export const DRIVERS: GridDriver[] = [
  { id: 'rus', code: 'RUS', number: '63', givenName: 'George', familyName: 'Russell', teamId: 'mer', f1: 'georus01' },
  { id: 'ant', code: 'ANT', number: '12', givenName: 'Kimi', familyName: 'Antonelli', teamId: 'mer', f1: 'andant01' },
  { id: 'ver', code: 'VER', number: '3', givenName: 'Max', familyName: 'Verstappen', teamId: 'rbr', f1: 'maxver01' },
  { id: 'had', code: 'HAD', number: '6', givenName: 'Isack', familyName: 'Hadjar', teamId: 'rbr', f1: 'isahad01' },
  { id: 'lec', code: 'LEC', number: '16', givenName: 'Charles', familyName: 'Leclerc', teamId: 'fer', f1: 'chalec01' },
  { id: 'ham', code: 'HAM', number: '44', givenName: 'Lewis', familyName: 'Hamilton', teamId: 'fer', f1: 'lewham01' },
  { id: 'nor', code: 'NOR', number: '1', givenName: 'Lando', familyName: 'Norris', teamId: 'mcl', f1: 'lannor01' },
  { id: 'pia', code: 'PIA', number: '81', givenName: 'Oscar', familyName: 'Piastri', teamId: 'mcl', f1: 'oscpia01' },
  { id: 'law', code: 'LAW', number: '30', givenName: 'Liam', familyName: 'Lawson', teamId: 'rb', f1: 'lialaw01' },
  { id: 'lin', code: 'LIN', number: '41', givenName: 'Arvid', familyName: 'Lindblad', teamId: 'rb', f1: 'arvlin01' },
  { id: 'gas', code: 'GAS', number: '10', givenName: 'Pierre', familyName: 'Gasly', teamId: 'alp', f1: 'piegas01' },
  { id: 'col', code: 'COL', number: '43', givenName: 'Franco', familyName: 'Colapinto', teamId: 'alp', f1: 'fracol01' },
  { id: 'bea', code: 'BEA', number: '87', givenName: 'Oliver', familyName: 'Bearman', teamId: 'haas', f1: 'olibea01' },
  { id: 'cam', code: 'CAM', number: '51', givenName: 'Rafael', familyName: 'Câmara', teamId: 'haas', f1: 'rafcam01' },
  { id: 'hul', code: 'HUL', number: '27', givenName: 'Nico', familyName: 'Hülkenberg', teamId: 'aud', f1: 'nichul01' },
  { id: 'bor', code: 'BOR', number: '5', givenName: 'Gabriel', familyName: 'Bortoleto', teamId: 'aud', f1: 'gabbor01' },
  { id: 'alo', code: 'ALO', number: '14', givenName: 'Fernando', familyName: 'Alonso', teamId: 'ast', f1: 'feralo01' },
  { id: 'str', code: 'STR', number: '18', givenName: 'Lance', familyName: 'Stroll', teamId: 'ast', f1: 'lanstr01' },
  { id: 'alb', code: 'ALB', number: '23', givenName: 'Alexander', familyName: 'Albon', teamId: 'wil', f1: 'alealb01' },
  { id: 'sai', code: 'SAI', number: '55', givenName: 'Carlos', familyName: 'Sainz', teamId: 'wil', f1: 'carsai01' },
  { id: 'per', code: 'PER', number: '11', givenName: 'Sergio', familyName: 'Pérez', teamId: 'cad', f1: 'serper01' },
  { id: 'bot', code: 'BOT', number: '77', givenName: 'Valtteri', familyName: 'Bottas', teamId: 'cad', f1: 'valbot01' },
]

/** Identifiants photo formula1.com connus, par code pilote (pour enrichir la grille venue de l'API). */
export const F1_PHOTO_ID: Record<string, string> = Object.fromEntries(DRIVERS.map((d) => [d.code, d.f1]))

/** Anciens identifiants d'écurie → nouveaux (Sauber est devenue Audi en 2026). */
const LEGACY_TEAM: Record<string, string> = { sau: 'aud' }
export const normTeamId = (id: string | null) => (id ? LEGACY_TEAM[id] ?? id : id)

export const teamById = (id: string | null | undefined) => TEAMS.find((t) => t.id === normTeamId(id ?? null))
/** Retrouve une écurie à partir d'un nom ou d'un constructorId (API Jolpica ou OpenF1). */
export function teamByName(name?: string | null): GridTeam | undefined {
  const n = (name ?? '').toLowerCase()
  if (!n) return undefined
  if (n.includes('racing bulls') || n === 'rb' || n.startsWith('rb ') || n.includes('visa')) return TEAMS.find((t) => t.id === 'rb')
  if (n.includes('red bull') || n === 'red_bull') return TEAMS.find((t) => t.id === 'rbr')
  if (n.includes('sauber') || n.includes('kick')) return TEAMS.find((t) => t.id === 'aud')
  return TEAMS.find((t) => n.includes(t.ref.replace('_', ' ')) || n.includes(t.ref) || n.includes(t.slug) || n.includes(t.name.toLowerCase()))
}

/** Logo officiel 2026 (SVG blanc, carré 96×96), hébergé avec l'app. */
export const teamLogo = (t: GridTeam) => `${BASE}teams/${t.slug}.svg`
/** Rendu officiel de la voiture 2026 (profil, fond transparent), hébergé avec l'app. */
export const teamCar = (t: GridTeam) => `${BASE}cars/2026/${t.slug}.webp`

/** Portrait officiel 2026 du pilote (buste recadré, fond transparent, CDN formula1.com), avec silhouette de secours. */
export function driverPhoto(teamSlug: string, f1Id: string | undefined, w = 320) {
  const id = f1Id || 'unknown01'
  return `${CDN}/d_common:f1:2026:fallback:driver:2026fallbackdriverright.webp/c_crop,w_0.8,h_0.36,g_north/c_scale,w_${w}/q_auto/v1740000001/common/f1/2026/${teamSlug}/${id}/2026${teamSlug}${id}right.webp`
}
