// Moteur de réponses du chatbot : reconnaissance d'intentions simple (mots-clés) exécutée dans le navigateur.
import {
  getCalendar,
  getConstructorStandings,
  getDriverStandings,
  getQualifying,
  getResults,
  season,
  type ConstructorStanding,
  type DriverStanding,
  type Race,
} from './f1api'

export interface BotReply {
  text: string
  chips?: string[]
}

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const hasWord = (q: string, w: string) => new RegExp(`(^| )${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(q)
const any = (q: string, ws: string[]) => ws.some((w) => q.includes(w))

const TZ = 'Europe/Paris'
const fmtDate = (iso: string, time?: string) => {
  const d = new Date(time ? `${iso}T${time}` : `${iso}T12:00:00Z`)
  const day = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ })
  if (!time) return day
  const hm = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
  return `${day} à ${hm.replace(':', ' h ')} (heure de Paris)`
}
const raceDay = (r: Race) => new Date(`${r.date}T23:59:59Z`)
const daysUntil = (r: Race) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const rd = new Date(`${r.date}T00:00:00`)
  return Math.round((rd.getTime() - today.getTime()) / 86400000)
}
const dayLabel = (n: number) => (n <= 0 ? 'aujourd’hui' : n === 1 ? 'demain' : `dans ${n} jours`)
const gpName = (r: Race) => r.raceName.replace('Grand Prix', 'GP')
const fullName = (d: { givenName: string; familyName: string }) => `${d.givenName} ${d.familyName}`
const age = (iso?: string) => {
  if (!iso) return null
  const b = new Date(iso)
  const n = new Date()
  let a = n.getFullYear() - b.getFullYear()
  if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--
  return a
}
const pts = (p: string | number) => `${p} pt${Number(p) > 1 ? 's' : ''}`
const ord = (n: string | number) => (Number(n) === 1 ? '1er' : `${n}e`)
const medal = (p: string) => (p === '1' ? '🥇' : p === '2' ? '🥈' : p === '3' ? '🥉' : `${p}.`)

const NATIONS: Record<string, string> = {
  Italian: 'italien', British: 'britannique', Dutch: 'néerlandais', Monegasque: 'monégasque', Spanish: 'espagnol', French: 'français',
  German: 'allemand', Australian: 'australien', Canadian: 'canadien', Thai: 'thaïlandais', Japanese: 'japonais', Finnish: 'finlandais',
  Mexican: 'mexicain', Brazilian: 'brésilien', Argentine: 'argentin', 'New Zealander': 'néo-zélandais', American: 'américain', Chinese: 'chinois',
  Danish: 'danois', Swiss: 'suisse', Belgian: 'belge', Austrian: 'autrichien', Swedish: 'suédois',
}
const nat = (n?: string) => (n ? NATIONS[n] ?? n : '')

// Alias français → mots-clés présents dans l'API (pays, villes…)
const RACE_ALIASES: Record<string, string> = {
  mexique: 'mexico', bresil: 'brazil', 'etats unis': 'usa', usa: 'usa', austin: 'austin', emirats: 'abu dhabi', 'abou dabi': 'abu dhabi',
  'pays bas': 'dutch', hollande: 'dutch', espagne: 'spain', belgique: 'belgian', hongrie: 'hungarian', autriche: 'austrian', japon: 'japan',
  chine: 'china', australie: 'australia', azerbaidjan: 'azerbaijan', singapour: 'singapore', 'grande bretagne': 'british', angleterre: 'british',
  italie: 'italian', monza: 'monza', 'las vegas': 'las vegas', vegas: 'las vegas', miami: 'miami', canada: 'canadian', malaisie: 'malaysia',
  bahrein: 'bahrain', arabie: 'saudi', 'sao paulo': 'brazil', interlagos: 'brazil', suzuka: 'suzuka', spa: 'belgian', silverstone: 'british',
  zandvoort: 'dutch', montreal: 'canadian', imola: 'imola', madrid: 'madrid', barcelone: 'barcelona', qatar: 'qatar', monaco: 'monaco',
}

function matchRace(q: string, races: Race[]): Race | null {
  let qq = ` ${q} `
  for (const [fr, en] of Object.entries(RACE_ALIASES)) if (qq.includes(` ${fr} `)) qq += ` ${en} `
  let best: Race | null = null
  let score = 0
  for (const r of races) {
    const keys = [
      norm(r.Circuit.Location.locality),
      norm(r.Circuit.Location.country),
      norm(r.raceName.replace(/grand prix/i, '')),
      norm(r.raceName.replace(/grand prix/i, '').replace(/ian$/, '')),
      ...norm(r.Circuit.circuitName).split(' ').filter((w) => w.length > 5),
    ].filter((k) => k.length >= 3)
    const aliasKeys: Record<string, string[]> = { USA: ['usa', 'united states'], UK: ['british'], UAE: ['abu dhabi'], Netherlands: ['dutch'] }
    keys.push(...(aliasKeys[r.Circuit.Location.country] ?? []))
    let s = 0
    for (const k of keys) if (qq.includes(` ${k} `)) s = Math.max(s, k.length)
    if (s > score) {
      score = s
      best = r
    }
  }
  return best
}

function matchDrivers(q: string, ds: DriverStanding[]): DriverStanding[] {
  const out: { d: DriverStanding; i: number }[] = []
  for (const d of ds) {
    const fam = norm(d.Driver.familyName)
    const given = norm(d.Driver.givenName)
    const parts = [fam, ...fam.split(' ').filter((w) => w.length > 3), ...given.split(' ').filter((w) => w.length > 3), `${given} ${fam}`]
    let idx = -1
    for (const p of parts) {
      const m = q.indexOf(p)
      if (m >= 0 && (m === 0 || q[m - 1] === ' ') && (q[m + p.length] === undefined || q[m + p.length] === ' ' || q[m + p.length] === 's')) idx = idx < 0 ? m : Math.min(idx, m)
    }
    if (idx >= 0) out.push({ d, i: idx })
  }
  return out.sort((a, b) => a.i - b.i).map((x) => x.d)
}

const TEAM_ALIASES: Record<string, string[]> = {
  red_bull: ['red bull', 'redbull', 'rbr'],
  rb: ['racing bulls', 'rb', 'vcarb', 'visa cash app'],
  alpine: ['alpine'],
  haas: ['haas'],
  aston_martin: ['aston martin', 'aston'],
  audi: ['audi', 'sauber', 'kick'],
  sauber: ['audi', 'sauber', 'kick'],
  cadillac: ['cadillac'],
  mclaren: ['mclaren', 'mc laren'],
  ferrari: ['ferrari', 'scuderia'],
  mercedes: ['mercedes'],
  williams: ['williams'],
}
function matchTeam(q: string, cs: ConstructorStanding[]): ConstructorStanding | null {
  const qq = ` ${q} `
  for (const c of cs) {
    const keys = [...(TEAM_ALIASES[c.Constructor.constructorId] ?? []), norm(c.Constructor.name.replace(/f1 team/i, ''))]
    if (keys.some((k) => k && qq.includes(` ${k} `))) return c
  }
  return null
}

const driverLine = (d: DriverStanding) => `${medal(d.position)} **${fullName(d.Driver)}** — ${pts(d.points)}${Number(d.wins) ? ` · ${d.wins} victoire${Number(d.wins) > 1 ? 's' : ''}` : ''} · ${d.Constructors[0]?.name ?? ''}`

const MAIN_CHIPS = ['Prochain GP', 'Classement pilotes', 'Classement constructeurs', 'Dernière course', 'Calendrier']

async function nextRaces() {
  const cal = await getCalendar()
  const now = new Date()
  return { cal, upcoming: cal.filter((r) => raceDay(r) >= now) }
}

async function answerRace(r: Race, q: string, cal: Race[]): Promise<BotReply> {
  const done = raceDay(r) < new Date()
  const place = `${r.Circuit.circuitName}, ${r.Circuit.Location.locality}`
  const askPole = any(q, ['pole', 'qualif'])
  if (!done) {
    return {
      text: `**${r.raceName}** (manche ${r.round}) n’a pas encore eu lieu.\n📅 ${fmtDate(r.date, r.time)}\n📍 ${place}\nC’est ${dayLabel(daysUntil(r))}.`,
      chips: ['Prochain GP', 'Calendrier', 'Classement pilotes'],
    }
  }
  if (askPole) {
    const qual = await getQualifying(r.round)
    const top = qual?.QualifyingResults?.slice(0, 3)
    if (!top?.length) return { text: `Je n’ai pas les qualifications du ${gpName(r)}.`, chips: MAIN_CHIPS }
    return {
      text: `Qualifications du **${r.raceName}** :\n${top.map((x) => `${medal(x.position)} **${fullName(x.Driver)}** (${x.Constructor.name})${x.position === '1' && x.Q3 ? ` — ${x.Q3}` : ''}`).join('\n')}`,
      chips: ['Dernière course', 'Prochain GP'],
    }
  }
  const res = await getResults(r.round)
  const list = res?.Results ?? []
  if (!list.length) return { text: `Je n’ai pas encore les résultats du ${gpName(r)}.`, chips: MAIN_CHIPS }
  const winnerOnly = any(q, ['gagn', 'vainqueur', 'victoire', 'remporte', 'win'])
  const podium = any(q, ['podium'])
  const n = winnerOnly ? 1 : podium ? 3 : 10
  const w = list[0]
  const head = `**${r.raceName}** — manche ${r.round}, ${fmtDate(r.date)}`
  const body = winnerOnly
    ? `🏆 Victoire de **${fullName(w.Driver)}** (${w.Constructor.name})${w.Time ? ` en ${w.Time.time}` : ''}, parti ${w.grid === '0' ? 'des stands' : `${ord(w.grid)} sur la grille`}.`
    : list.slice(0, n).map((x) => `${medal(x.position)} **${fullName(x.Driver)}** (${x.Constructor.name})${x.position === '1' && x.Time ? ` — ${x.Time.time}` : ''}`).join('\n')
  const idx = cal.findIndex((c) => c.round === r.round)
  return { text: `${head}\n${body}`, chips: ['Classement pilotes', idx >= 0 && cal[idx + 1] ? 'Prochain GP' : 'Calendrier', 'Pole de la dernière course'] }
}

export async function answer(raw: string): Promise<BotReply> {
  const q = norm(raw)
  if (!q) return { text: 'Pose-moi une question sur la F1 😉', chips: MAIN_CHIPS }

  if (/^(salut|bonjour|bonsoir|hello|coucou|hey|yo|aide|help)( |$)/.test(q) || any(q, ['que peux tu', 'tu sais faire', 'tu peux faire', 'qui es tu', 'comment ca marche'])) {
    return {
      text: `Salut ! Je suis l’assistant **F1 Manager** 🏁\nJe réponds avec les données en direct de la saison ${season} : classements pilotes et constructeurs, calendrier, prochain GP, résultats, poles, fiches pilotes et écuries.\nEssaie par exemple : « Où en est Leclerc ? » ou « Qui a gagné à Austin ? ».`,
      chips: MAIN_CHIPS,
    }
  }
  if (['merci', 'super', 'genial', 'cool', 'parfait'].some((w) => hasWord(q, w)) && q.split(' ').length <= 3) {
    return { text: 'Avec plaisir ! D’autres questions sur la F1 ? 🏎️', chips: MAIN_CHIPS }
  }

  const [ds, cs, cal] = await Promise.all([getDriverStandings(), getConstructorStandings(), getCalendar()])
  const askTeam = any(q, ['constructeur', 'ecurie', 'equipe', 'team'])

  // Course précise (ville / pays / GP)
  const race = matchRace(q, cal)
  const drivers = matchDrivers(q, ds.list)
  if (race && !any(q, ['calendrier', 'prochain', 'prochaine']) && !(drivers.length && !any(q, ['gagn', 'vainqueur', 'podium', 'pole', 'resultat', 'classement']))) {
    return answerRace(race, q, cal)
  }

  // Comparaison de deux pilotes
  if (drivers.length >= 2) {
    const [a, b] = drivers
    const diff = Math.abs(Number(a.points) - Number(b.points))
    const lead = Number(a.points) >= Number(b.points) ? a : b
    return {
      text: `**${a.Driver.familyName}** vs **${b.Driver.familyName}**\n• ${a.Driver.familyName} : ${ord(a.position)}, ${pts(a.points)}, ${a.wins} victoire(s)\n• ${b.Driver.familyName} : ${ord(b.position)}, ${pts(b.points)}, ${b.wins} victoire(s)\n${diff === 0 ? 'Égalité parfaite !' : `**${lead.Driver.familyName}** devance de ${pts(diff)}.`}`,
      chips: ['Classement pilotes', 'Dernière course'],
    }
  }

  // Un pilote
  if (drivers.length === 1 && !askTeam) {
    const d = drivers[0]
    const a = age(d.Driver.dateOfBirth)
    const leader = ds.list[0]
    const gap = Number(leader.points) - Number(d.points)
    if (any(q, ['derni', 'last']) && any(q, ['course', 'gp', 'resultat', 'termine', 'fini'])) {
      const cur = cal.filter((r) => raceDay(r) < new Date()).pop()
      const res = cur ? await getResults(cur.round) : null
      const x = res?.Results?.find((r) => r.Driver.driverId === d.Driver.driverId)
      if (cur && x) {
        return {
          text: `**${fullName(d.Driver)}** au ${gpName(cur)} : **${ord(x.position)}** (parti ${x.grid === '0' ? 'des stands' : ord(x.grid)}), ${pts(x.points)} marqué${Number(x.points) > 1 ? 's' : ''}${x.status !== 'Finished' && !x.status.startsWith('+') ? ` — ${x.status}` : ''}.`,
          chips: [`Fiche ${d.Driver.familyName}`, 'Classement pilotes'],
        }
      }
    }
    return {
      text: `**${fullName(d.Driver)}** ${d.Driver.permanentNumber ? `#${d.Driver.permanentNumber} ` : ''}— ${d.Constructors[0]?.name ?? ''}\n• Classement : **${ord(d.position)}** avec ${pts(d.points)}\n• Victoires : ${d.wins}\n• ${gap === 0 ? 'Leader du championnat 👑' : `À ${pts(gap)} du leader (${leader.Driver.familyName})`}\n• ${nat(d.Driver.nationality)}${a ? `, ${a} ans` : ''}`,
      chips: [`Dernière course de ${d.Driver.familyName}`, 'Classement pilotes', 'Classement constructeurs'],
    }
  }

  // Une écurie
  const team = matchTeam(q, cs.list)
  if (team) {
    const mates = ds.list.filter((d) => d.Constructors.some((c) => c.constructorId === team.Constructor.constructorId))
    const leader = cs.list[0]
    const gap = Number(leader.points) - Number(team.points)
    return {
      text: `**${team.Constructor.name}**${team.Constructor.nationality ? ` (${nat(team.Constructor.nationality) || team.Constructor.nationality})` : ''}\n• Classement constructeurs : **${ord(team.position)}** avec ${pts(team.points)}\n• Victoires : ${team.wins}\n• ${gap === 0 ? 'Leader du championnat 👑' : `À ${pts(gap)} du leader (${leader.Constructor.name})`}\n• Pilotes : ${mates.map((m) => `${m.Driver.familyName} (${pts(m.points)})`).join(', ') || '—'}`,
      chips: ['Classement constructeurs', 'Classement pilotes'],
    }
  }

  // Prochain GP
  if (any(q, ['prochain', 'prochaine', 'next']) || (any(q, ['quand', 'c est quand']) && any(q, ['course', 'gp', 'grand prix']))) {
    const { upcoming } = await nextRaces()
    const r = upcoming[0]
    if (!r) return { text: `La saison ${season} est terminée 🏁 Plus aucune course au calendrier.`, chips: ['Classement pilotes', 'Classement constructeurs'] }
    const n = daysUntil(r)
    const after = upcoming[1]
    return {
      text: `**Prochain GP : ${r.raceName}** (manche ${r.round}/${cal.length})\n📅 ${fmtDate(r.date, r.time)}\n📍 ${r.Circuit.circuitName}, ${r.Circuit.Location.locality} (${r.Circuit.Location.country})\n⏱️ Course ${dayLabel(n)}.${after ? `\nEnsuite : ${gpName(after)}.` : ''}`,
      chips: ['Calendrier', 'Classement pilotes', 'Dernière course'],
    }
  }

  // Calendrier
  if (any(q, ['calendrier', 'programme', 'courses restantes', 'combien de courses', 'reste']) || (any(q, ['liste', 'toutes']) && any(q, ['course', 'gp']))) {
    const { upcoming } = await nextRaces()
    if (!upcoming.length) return { text: `La saison ${season} est terminée 🏁`, chips: ['Classement pilotes'] }
    const countQ = any(q, ['combien', 'reste'])
    return {
      text: `${countQ ? `Il reste **${upcoming.length} course${upcoming.length > 1 ? 's' : ''}** sur ${cal.length} :` : 'Prochaines courses :'}\n${upcoming.slice(0, 6).map((r) => `• Manche ${r.round} — **${gpName(r)}**, ${fmtDate(r.date).replace(/^\w+ /, '')}`).join('\n')}${upcoming.length > 6 ? `\n… et ${upcoming.length - 6} autre(s).` : ''}`,
      chips: ['Prochain GP', 'Classement pilotes'],
    }
  }

  // Dernière course (résultats / vainqueur / podium / pole)
  if (any(q, ['derni', 'last', 'resultat', 'vainqueur', 'gagne', 'gagnant', 'podium', 'pole', 'qualif'])) {
    const past = cal.filter((r) => raceDay(r) < new Date())
    const last = past[past.length - 1]
    if (!last) return { text: 'Aucune course n’a encore eu lieu cette saison.', chips: ['Prochain GP', 'Calendrier'] }
    return answerRace(last, q, cal)
  }

  // Classement constructeurs
  if (askTeam || any(q, ['constructeurs'])) {
    const n = Math.min(Number((q.match(/top (\d+)/) ?? [])[1]) || cs.list.length, cs.list.length)
    return {
      text: `**Classement constructeurs** — après ${cs.round} manches\n${cs.list.slice(0, n).map((c) => `${medal(c.position)} **${c.Constructor.name}** — ${pts(c.points)}`).join('\n')}`,
      chips: ['Classement pilotes', 'Prochain GP', 'Ferrari'],
    }
  }

  // Classement pilotes / leader / champion
  if (any(q, ['classement', 'pilote', 'championnat', 'leader', 'premier', 'champion', 'points', 'top', 'meilleur', 'ecart'])) {
    const m = q.match(/top (\d+)/)
    const n = m ? Math.min(Number(m[1]), ds.list.length) : any(q, ['leader', 'premier', 'champion']) ? 3 : 10
    const [l, s] = ds.list
    const extra = l && s ? `\n\n👑 **${l.Driver.familyName}** mène avec ${pts(Number(l.points) - Number(s.points))} d’avance sur ${s.Driver.familyName}.` : ''
    return {
      text: `**Classement pilotes** — après ${ds.round} manches\n${ds.list.slice(0, n).map(driverLine).join('\n')}${extra}`,
      chips: n < 10 ? ['Top 10 pilotes', 'Classement constructeurs'] : ['Top 5 pilotes', 'Classement constructeurs', 'Prochain GP'],
    }
  }

  return {
    text: 'Hmm, je n’ai pas bien compris 🤔\nJe peux te parler des classements, du calendrier, du prochain GP, des résultats ou d’un pilote/une écurie précise (ex : « Verstappen », « McLaren »).',
    chips: MAIN_CHIPS,
  }
}
