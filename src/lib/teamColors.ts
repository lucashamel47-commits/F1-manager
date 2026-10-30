/* Couleurs d'écuries, utilisées avec parcimonie (accents discrets). */
const TEAM_COLORS: [string, string][] = [
  ['ferrari', '#E8002D'], ['mclaren', '#FF8000'], ['mercedes', '#27F4D2'], ['red bull', '#3671C6'],
  ['williams', '#64C4FF'], ['renault', '#FFD800'], ['lotus', '#CBA135'], ['brabham', '#2fa35b'],
  ['benetton', '#7bc043'], ['tyrrell', '#5b84d6'], ['alpine', '#FF87BC'], ['brawn', '#C8F000'],
  ['alfa', '#b3263a'], ['cooper', '#4a9d77'], ['brm', '#a14a4a'], ['matra', '#6c92e6'], ['vanwall', '#3f8f5f'],
  ['maserati', '#d6455c'], ['aston', '#229971'],
]
export const colorFor = (team?: string) => {
  const t = (team ?? '').toLowerCase()
  return TEAM_COLORS.find(([k]) => t.includes(k))?.[1] ?? '#a1a1aa'
}

