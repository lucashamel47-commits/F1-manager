/** Calendrier 2026 complet (23 courses) + fiche technique de chaque circuit. */
export interface Circuit {
  round: number
  iso: string // jour de course
  circuitId: string
  name: string // Grand Prix (FR)
  circuit: string
  country: string
  flag: string
  /** Plan officiel F1 (absent pour les circuits sans plan publié) */
  map?: string
  length: string
  laps: number | null
  record?: string
  recordDriver?: string
  recordYear?: number
  // Détails facultatifs (fiche complète)
  photo?: string
  history?: string
  grip?: string
  creator?: string
  date?: string
}

const M = (n: string) => `https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/${n}_Circuit.png`

export const circuits: Circuit[] = [
  { round: 1, iso: '2026-03-08', circuitId: 'albert_park', name: 'Australie', circuit: 'Albert Park', country: 'Melbourne', flag: '🇦🇺', map: M('Australia'), length: '5,278 km', laps: 58, record: '1:19.813', recordDriver: 'C. Leclerc', recordYear: 2024 },
  { round: 2, iso: '2026-03-15', circuitId: 'shanghai', name: 'Chine', circuit: 'Shanghai International', country: 'Shanghai', flag: '🇨🇳', map: M('China'), length: '5,451 km', laps: 56, record: '1:32.238', recordDriver: 'M. Schumacher', recordYear: 2004 },
  { round: 3, iso: '2026-03-29', circuitId: 'suzuka', name: 'Japon', circuit: 'Suzuka', country: 'Suzuka', flag: '🇯🇵', map: M('Japan'), length: '5,807 km', laps: 53, record: '1:30.983', recordDriver: 'L. Hamilton', recordYear: 2019 },
  { round: 4, iso: '2026-05-03', circuitId: 'miami', name: 'Miami', circuit: 'Miami International Autodrome', country: 'Miami', flag: '🇺🇸', map: M('Miami'), length: '5,412 km', laps: 57, record: '1:29.708', recordDriver: 'M. Verstappen', recordYear: 2023 },
  { round: 5, iso: '2026-05-24', circuitId: 'villeneuve', name: 'Canada', circuit: 'Gilles-Villeneuve', country: 'Montréal', flag: '🇨🇦', map: M('Canada'), length: '4,361 km', laps: 70, record: '1:13.078', recordDriver: 'V. Bottas', recordYear: 2019 },
  { round: 6, iso: '2026-06-07', circuitId: 'monaco', name: 'Monaco', circuit: 'Monte-Carlo', country: 'Monaco', flag: '🇲🇨', map: M('Monaco'), length: '3,337 km', laps: 78, record: '1:12.909', recordDriver: 'L. Hamilton', recordYear: 2021 },
  { round: 7, iso: '2026-06-14', circuitId: 'catalunya', name: 'Barcelone', circuit: 'Barcelona-Catalunya', country: 'Barcelone', flag: '🇪🇸', map: M('Spain'), length: '4,657 km', laps: 66, record: '1:16.330', recordDriver: 'M. Verstappen', recordYear: 2023 },
  { round: 8, iso: '2026-06-28', circuitId: 'red_bull_ring', name: 'Autriche', circuit: 'Red Bull Ring', country: 'Spielberg', flag: '🇦🇹', map: M('Austria'), length: '4,318 km', laps: 71, record: '1:05.619', recordDriver: 'C. Sainz', recordYear: 2020 },
  { round: 9, iso: '2026-07-05', circuitId: 'silverstone', name: 'Grande-Bretagne', circuit: 'Silverstone', country: 'Silverstone', flag: '🇬🇧', map: M('Great_Britain'), length: '5,891 km', laps: 52, record: '1:27.097', recordDriver: 'M. Verstappen', recordYear: 2020 },
  { round: 10, iso: '2026-07-19', circuitId: 'spa', name: 'Belgique', circuit: 'Spa-Francorchamps', country: 'Spa', flag: '🇧🇪', map: M('Belgium'), length: '7,004 km', laps: 44, record: '1:46.286', recordDriver: 'V. Bottas', recordYear: 2018 },
  { round: 11, iso: '2026-07-26', circuitId: 'hungaroring', name: 'Hongrie', circuit: 'Hungaroring', country: 'Budapest', flag: '🇭🇺', map: M('Hungary'), length: '4,381 km', laps: 70, record: '1:16.627', recordDriver: 'L. Hamilton', recordYear: 2020 },
  { round: 12, iso: '2026-08-23', circuitId: 'zandvoort', name: 'Pays-Bas', circuit: 'Zandvoort', country: 'Zandvoort', flag: '🇳🇱', map: M('Netherlands'), length: '4,259 km', laps: 72, record: '1:11.097', recordDriver: 'L. Hamilton', recordYear: 2021 },
  { round: 13, iso: '2026-09-06', circuitId: 'monza', name: 'Italie', circuit: 'Monza', country: 'Monza', flag: '🇮🇹', map: M('Italy'), length: '5,793 km', laps: 53, record: '1:21.046', recordDriver: 'R. Barrichello', recordYear: 2004 },
  { round: 14, iso: '2026-09-13', circuitId: 'madring', name: 'Espagne', circuit: 'Madring', country: 'Madrid', flag: '🇪🇸', length: '≈ 5,47 km', laps: null },
  { round: 15, iso: '2026-09-26', circuitId: 'baku', name: 'Azerbaïdjan', circuit: 'Bakou', country: 'Bakou', flag: '🇦🇿', map: M('Baku'), length: '6,003 km', laps: 51, record: '1:43.009', recordDriver: 'C. Leclerc', recordYear: 2019 },
  { round: 16, iso: '2026-10-04', circuitId: 'sepang', name: 'Malaisie', circuit: 'Sepang', country: 'Kuala Lumpur', flag: '🇲🇾', length: '5,543 km', laps: 56, record: '1:34.223', recordDriver: 'J. P. Montoya', recordYear: 2004 },
  { round: 17, iso: '2026-10-11', circuitId: 'marina_bay', name: 'Singapour', circuit: 'Marina Bay', country: 'Singapour', flag: '🇸🇬', map: M('Singapore'), length: '4,940 km', laps: 62, record: '1:35.867', recordDriver: 'L. Hamilton', recordYear: 2023 },
  { round: 18, iso: '2026-10-25', circuitId: 'americas', name: 'États-Unis', circuit: 'Circuit of the Americas', country: 'Austin', flag: '🇺🇸', map: M('USA'), length: '5,513 km', laps: 56, record: '1:36.169', recordDriver: 'C. Leclerc', recordYear: 2019 },
  { round: 19, iso: '2026-11-01', circuitId: 'rodriguez', name: 'Mexico', circuit: 'Hermanos Rodríguez', country: 'Mexico', flag: '🇲🇽', map: M('Mexico'), length: '4,304 km', laps: 71, record: '1:17.774', recordDriver: 'V. Bottas', recordYear: 2021 },
  { round: 20, iso: '2026-11-08', circuitId: 'interlagos', name: 'Brésil', circuit: 'Interlagos', country: 'São Paulo', flag: '🇧🇷', map: M('Brazil'), length: '4,309 km', laps: 71, record: '1:10.540', recordDriver: 'V. Bottas', recordYear: 2018 },
  { round: 21, iso: '2026-11-22', circuitId: 'vegas', name: 'Las Vegas', circuit: 'Las Vegas Strip', country: 'Las Vegas', flag: '🇺🇸', map: M('Las_Vegas'), length: '6,201 km', laps: 50, record: '1:34.119', recordDriver: 'O. Piastri', recordYear: 2023 },
  { round: 22, iso: '2026-11-29', circuitId: 'losail', name: 'Qatar', circuit: 'Lusail', country: 'Lusail', flag: '🇶🇦', map: M('Qatar'), length: '5,419 km', laps: 57, record: '1:22.384', recordDriver: 'M. Verstappen', recordYear: 2023 },
  { round: 23, iso: '2026-12-06', circuitId: 'yas_marina', name: 'Abu Dhabi', circuit: 'Yas Marina', country: 'Abu Dhabi', flag: '🇦🇪', map: M('Abu_Dhabi'), length: '5,281 km', laps: 58, record: '1:26.103', recordDriver: 'M. Verstappen', recordYear: 2021 },
]

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
export const fmtDay = (iso: string) => {
  const [, m, d] = iso.split('-').map(Number)
  return `${d === 1 ? '1er' : d} ${MONTHS[m - 1]}`
}
/** Nombre de jours entre aujourd'hui et le jour de course (négatif = passé). */
export const daysUntil = (iso: string) => {
  const t = new Date(`${iso}T00:00:00`)
  const n = new Date()
  n.setHours(0, 0, 0, 0)
  return Math.round((t.getTime() - n.getTime()) / 86400000)
}
