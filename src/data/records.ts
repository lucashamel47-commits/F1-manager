import { constructorChampions, driverChampions } from './champions'

export type RecordCat = 'titles' | 'wins' | 'podiums' | 'poles' | 'fastest' | 'starts'
export interface RecordEntry {
  name: string
  value: number
  team?: string
  note?: string
}
export type RecordTable = Partial<Record<RecordCat, RecordEntry[]>>

export const RECORDS_AS_OF =
  'Sources : victoires, podiums et départs des pilotes et écuries issus de l’API Jolpica (Ergast), arrêtés au 30 octobre 2026 (derniers Grands Prix 2026 inclus) ; ' +
  'pole positions et meilleurs tours : chiffres officiels arrêtés à fin 2025 (l’API ne distingue pas toujours les qualifications sprint). ' +
  'Les podiums d’une écurie comptent chaque voiture classée sur le podium. Palmarès : saisons 1950 → 2025 ; la saison en cours est lue en direct.'

/** Titres cumulés par nom (palmarès figé). */
function titles(list: { name: string; team: string }[], teamOf: (name: string) => string): RecordEntry[] {
  const m = new Map<string, number>()
  list.forEach((c) => m.set(c.name, (m.get(c.name) ?? 0) + 1))
  return [...m.entries()]
    .filter(([, v]) => v >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, team: teamOf(name) }))
}

const lastTeam = (name: string) => [...driverChampions].reverse().find((c) => c.name === name)?.team ?? ''
const sortDesc = (l: RecordEntry[]) => [...l].sort((a, b) => b.value - a.value)

const driverTitles = titles(driverChampions, lastTeam).filter((e) => e.value >= 3)

export const driverRecords: RecordTable = {
  titles: driverTitles,
  wins: sortDesc([
    { name: 'Lewis Hamilton', value: 106, team: 'Mercedes' },
    { name: 'Michael Schumacher', value: 91, team: 'Ferrari' },
    { name: 'Max Verstappen', value: 73, team: 'Red Bull' },
    { name: 'Sebastian Vettel', value: 53, team: 'Red Bull' },
    { name: 'Alain Prost', value: 51, team: 'McLaren' },
    { name: 'Ayrton Senna', value: 41, team: 'McLaren' },
    { name: 'Fernando Alonso', value: 32, team: 'Renault' },
    { name: 'Nigel Mansell', value: 31, team: 'Williams' },
    { name: 'Jackie Stewart', value: 27, team: 'Tyrrell' },
    { name: 'Jim Clark', value: 25, team: 'Lotus' },
  ]),
  podiums: sortDesc([
    { name: 'Lewis Hamilton', value: 208, team: 'Mercedes' },
    { name: 'Michael Schumacher', value: 155, team: 'Ferrari' },
    { name: 'Max Verstappen', value: 137, team: 'Red Bull' },
    { name: 'Sebastian Vettel', value: 122, team: 'Red Bull' },
    { name: 'Fernando Alonso', value: 106, team: 'Renault' },
    { name: 'Alain Prost', value: 106, team: 'McLaren' },
    { name: 'Kimi Räikkönen', value: 103, team: 'Ferrari' },
    { name: 'Ayrton Senna', value: 80, team: 'McLaren' },
    { name: 'Rubens Barrichello', value: 68, team: 'Ferrari' },
    { name: 'Valtteri Bottas', value: 67, team: 'Mercedes' },
  ]),
  poles: sortDesc([
    { name: 'Lewis Hamilton', value: 104, team: 'Mercedes', note: 'Mercedes · fin 2025' },
    { name: 'Michael Schumacher', value: 68, team: 'Ferrari', note: 'Ferrari · fin 2025' },
    { name: 'Ayrton Senna', value: 65, team: 'McLaren', note: 'McLaren · fin 2025' },
    { name: 'Sebastian Vettel', value: 57, team: 'Red Bull', note: 'Red Bull · fin 2025' },
    { name: 'Max Verstappen', value: 48, team: 'Red Bull', note: 'Red Bull · fin 2025' },
    { name: 'Jim Clark', value: 33, team: 'Lotus', note: 'Lotus · fin 2025' },
    { name: 'Alain Prost', value: 33, team: 'McLaren', note: 'McLaren · fin 2025' },
    { name: 'Nigel Mansell', value: 32, team: 'Williams', note: 'Williams · fin 2025' },
    { name: 'Juan Manuel Fangio', value: 29, team: 'Mercedes', note: 'Mercedes · fin 2025' },
    { name: 'Mika Häkkinen', value: 26, team: 'McLaren', note: 'McLaren · fin 2025' },
  ]),
  fastest: sortDesc([
    { name: 'Michael Schumacher', value: 77, team: 'Ferrari', note: 'Ferrari · fin 2025' },
    { name: 'Lewis Hamilton', value: 69, team: 'Mercedes', note: 'Mercedes' },
    { name: 'Kimi Räikkönen', value: 46, team: 'Ferrari', note: 'Ferrari · fin 2025' },
    { name: 'Alain Prost', value: 41, team: 'McLaren', note: 'McLaren · fin 2025' },
    { name: 'Max Verstappen', value: 38, team: 'Red Bull', note: 'Red Bull' },
    { name: 'Sebastian Vettel', value: 38, team: 'Red Bull', note: 'Red Bull' },
    { name: 'Nigel Mansell', value: 30, team: 'Williams', note: 'Williams · fin 2025' },
    { name: 'Jim Clark', value: 28, team: 'Lotus', note: 'Lotus · fin 2025' },
    { name: 'Fernando Alonso', value: 24, team: 'Renault', note: 'Renault · fin 2025' },
    { name: 'Juan Manuel Fangio', value: 23, team: 'Mercedes', note: 'Mercedes · fin 2025' },
  ]),
  starts: sortDesc([
    { name: 'Fernando Alonso', value: 446, team: 'Renault' },
    { name: 'Lewis Hamilton', value: 398, team: 'Mercedes' },
    { name: 'Kimi Räikkönen', value: 352, team: 'Ferrari' },
    { name: 'Rubens Barrichello', value: 326, team: 'Ferrari' },
    { name: 'Jenson Button', value: 309, team: 'McLaren' },
    { name: 'Michael Schumacher', value: 308, team: 'Ferrari' },
    { name: 'Sergio Pérez', value: 301, team: 'Red Bull' },
    { name: 'Sebastian Vettel', value: 300, team: 'Red Bull' },
    { name: 'Nico Hülkenberg', value: 272, team: 'Renault' },
    { name: 'Felipe Massa', value: 271, team: 'Ferrari' },
  ]),
}

const cTitles = new Map<string, number>()
constructorChampions.forEach((c) => cTitles.set(c.name, (cTitles.get(c.name) ?? 0) + 1))

export const constructorRecords: RecordTable = {
  titles: [...cTitles.entries()]
    .filter(([, v]) => v >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, team: name })),
  wins: sortDesc([
    { name: 'Ferrari', value: 251, team: 'Ferrari' },
    { name: 'McLaren', value: 201, team: 'McLaren' },
    { name: 'Mercedes', value: 143, team: 'Mercedes' },
    { name: 'Red Bull', value: 132, team: 'Red Bull' },
    { name: 'Williams', value: 114, team: 'Williams' },
    { name: 'Lotus', value: 79, team: 'Lotus', note: 'Team Lotus · chiffre officiel' },
    { name: 'Renault', value: 35, team: 'Renault' },
    { name: 'Benetton', value: 27, team: 'Benetton' },
    { name: 'Brabham', value: 23, team: 'Brabham' },
    { name: 'Tyrrell', value: 23, team: 'Tyrrell' },
  ]),
  podiums: sortDesc([
    { name: 'Ferrari', value: 251 + 307 + 302, team: 'Ferrari' },
    { name: 'McLaren', value: 201 + 187 + 161, team: 'McLaren' },
    { name: 'Mercedes', value: 143 + 109 + 81, team: 'Mercedes' },
    { name: 'Williams', value: 114 + 113 + 89, team: 'Williams' },
    { name: 'Red Bull', value: 132 + 92 + 85, team: 'Red Bull' },
    { name: 'Renault', value: 35 + 35 + 33, team: 'Renault' },
    { name: 'Benetton', value: 27 + 32 + 43, team: 'Benetton' },
    { name: 'Brabham', value: 23 + 25 + 30, team: 'Brabham' },
    { name: 'Tyrrell', value: 23 + 33 + 21, team: 'Tyrrell' },
  ]),
}

export interface Fact {
  value: string
  label: string
  holder: string
}

export const seasonFacts: Fact[] = [
  { value: '19', label: 'Victoires sur une saison', holder: 'Max Verstappen · 2023' },
  { value: '10', label: 'Victoires consécutives', holder: 'Max Verstappen · 2023' },
  { value: '21', label: 'Podiums sur une saison', holder: 'Max Verstappen · 2023' },
  { value: '15', label: 'Poles sur une saison', holder: 'Sebastian Vettel · 2011' },
  { value: '5', label: 'Titres pilote consécutifs', holder: 'Michael Schumacher · 2000-2004' },
  { value: '8', label: 'Titres constructeurs consécutifs', holder: 'Mercedes · 2014-2021' },
  { value: '21', label: 'Victoires d’une écurie en une saison', holder: 'Red Bull · 2023 (sur 22 GP)' },
  { value: '23 ans', label: 'Plus jeune champion du monde', holder: 'Sebastian Vettel · 2010' },
  { value: '18 ans', label: 'Plus jeune vainqueur d’un GP', holder: 'Max Verstappen · Espagne 2016' },
  { value: '46 ans', label: 'Plus âgé champion du monde', holder: 'Juan Manuel Fangio · 1957' },
  { value: '0,5 pt', label: 'Plus petit écart pour un titre', holder: 'Niki Lauda devant Alain Prost · 1984' },
  { value: '24', label: 'Grands Prix sur une saison', holder: 'Record du calendrier · 2024 et 2025' },
]
